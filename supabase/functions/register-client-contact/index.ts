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

    // Check if email already exists
    const { data: existingContact } = await supabaseAdmin
      .from('funcionarios_clientes')
      .select('id')
      .eq('email', email)
      .single();

    if (existingContact) {
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        is_client: true
      },
      email_confirm: true // Auto-confirm the email
    });

    if (authError || !authData.user) {
      console.error('Auth user creation failed:', authError);
      
      // Check for specific email already exists error
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário: ' + authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      
      // Cleanup: delete the auth user if contact creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar contato: ' + contactError.message }),
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