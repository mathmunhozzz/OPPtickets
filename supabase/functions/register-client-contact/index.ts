import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, password, city, position, client_id, phone } = await req.json();

    console.log('Registration attempt for:', { email, name, city, client_id });

    // Validate required fields
    if (!name || !email || !password || !city || !position || !client_id) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos obrigatórios devem ser preenchidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate city exists in clients table
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, municipality')
      .eq('id', client_id)
      .single();

    if (clientError || !clientData) {
      console.error('Client not found:', clientError);
      return new Response(
        JSON.stringify({ error: 'Cliente/Prefeitura não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (clientData.municipality !== city) {
      console.error('City mismatch:', { provided: city, expected: clientData.municipality });
      return new Response(
        JSON.stringify({ error: 'Cidade não corresponde ao cliente selecionado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in funcionarios_clientes
    const { data: existingContact } = await supabaseAdmin
      .from('funcionarios_clientes')
      .select('id, auth_user_id')
      .eq('email', email)
      .single();

    if (existingContact) {
      console.error('Email already exists in funcionarios_clientes:', email);
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado como contato de cliente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in auth.users
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers.users?.find(user => user.email === email);
    let isNewAuthUser = false;
    
    let authData;
    if (existingAuthUser) {
      console.log('Auth user already exists, using existing user:', email);
      authData = { user: existingAuthUser };
    } else {
      // Create new auth user
      console.log('Creating new auth user:', email);
      isNewAuthUser = true;
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          name,
          is_client: true
        },
        email_confirm: true // Auto-confirm the email
      });

      if (authError || !newAuthData.user) {
        console.error('Auth user creation failed:', authError);
        const errorMessage = authError?.message || 'Erro desconhecido na criação do usuário';
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário: ' + errorMessage }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      authData = newAuthData;
    }

    // Insert into funcionarios_clientes table
    const { error: contactError } = await supabaseAdmin
      .from('funcionarios_clientes')
      .insert({
        auth_user_id: authData.user.id,
        name,
        email,
        city,
        position,
        client_id,
        phone: phone || null,
        approval_status: 'pending',
        is_active: false
      });

    if (contactError) {
      console.error('Contact insertion failed:', contactError);
      
      // Cleanup: delete the auth user if contact creation fails and we created it
      if (isNewAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar contato: ' + contactError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert or update profile table with pending status (UPSERT)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        name,
        account_status: 'pending'
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.error('Profile upsert failed:', profileError);
      
      // Cleanup: delete the contact if profile creation fails
      // Only delete auth user if we created it in this session
      if (isNewAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      }
      await supabaseAdmin.from('funcionarios_clientes').delete().eq('auth_user_id', authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar perfil: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Registration successful for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in register-client-contact:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});