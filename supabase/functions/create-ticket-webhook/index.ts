import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTicketRequest {
  title: string;
  description?: string;
  priority?: 'baixa' | 'media' | 'alta';
  status?: 'pendente' | 'em_analise' | 'corrigido' | 'negado';
  request_number?: string;
  tags?: string[];
  sector_id?: string;
  assigned_to?: string;
  client_contact_id?: string;
  due_date?: string;
  created_by?: string;
  created_by_email?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Método não permitido. Use POST.' 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log('=== Iniciando criação de ticket via webhook ===');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const requestData: CreateTicketRequest = await req.json();
    console.log('Dados recebidos:', JSON.stringify(requestData, null, 2));

    // Validate required fields
    if (!requestData.title || requestData.title.trim() === '') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Campo "title" é obrigatório e não pode estar vazio.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Find or validate user
    let created_by = requestData.created_by;
    
    if (!created_by && requestData.created_by_email) {
      console.log(`Buscando usuário pelo email: ${requestData.created_by_email}`);
      
      // Try to find user by email in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('name', requestData.created_by_email)
        .single();

      if (!profileError && profile) {
        created_by = profile.user_id;
        console.log(`Usuário encontrado: ${created_by}`);
      } else {
        // Try to find in employees table
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('auth_user_id')
          .eq('email', requestData.created_by_email)
          .single();

        if (!employeeError && employee?.auth_user_id) {
          created_by = employee.auth_user_id;
          console.log(`Funcionário encontrado: ${created_by}`);
        }
      }
    }

    // If still no user found, use a default system user or return error
    if (!created_by) {
      console.log('Nenhum usuário encontrado, usando usuário padrão do sistema');
      // You might want to create a system user or use a specific UUID here
      // For now, we'll return an error requiring a valid user
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário não encontrado. Forneça um "created_by" válido ou um "created_by_email" cadastrado no sistema.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate sector_id if provided
    if (requestData.sector_id) {
      const { data: sector, error: sectorError } = await supabase
        .from('sectors')
        .select('id')
        .eq('id', requestData.sector_id)
        .single();

      if (sectorError || !sector) {
        console.log(`Setor inválido: ${requestData.sector_id}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Setor com ID "${requestData.sector_id}" não encontrado.` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate assigned_to if provided
    if (requestData.assigned_to) {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', requestData.assigned_to)
        .single();

      if (employeeError || !employee) {
        console.log(`Funcionário inválido: ${requestData.assigned_to}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Funcionário com ID "${requestData.assigned_to}" não encontrado.` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate client_contact_id if provided
    if (requestData.client_contact_id) {
      const { data: contact, error: contactError } = await supabase
        .from('funcionarios_clientes')
        .select('id')
        .eq('id', requestData.client_contact_id)
        .single();

      if (contactError || !contact) {
        console.log(`Contato do cliente inválido: ${requestData.client_contact_id}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Contato do cliente com ID "${requestData.client_contact_id}" não encontrado.` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Prepare ticket data with defaults
    const ticketData = {
      title: requestData.title.trim(),
      description: requestData.description?.trim() || null,
      priority: requestData.priority || 'media',
      status: requestData.status || 'pendente',
      request_number: requestData.request_number?.trim() || null,
      tags: requestData.tags || [],
      sector_id: requestData.sector_id || null,
      assigned_to: requestData.assigned_to || null,
      client_contact_id: requestData.client_contact_id || null,
      due_date: requestData.due_date || null,
      created_by: created_by,
    };

    console.log('Dados do ticket a ser criado:', JSON.stringify(ticketData, null, 2));

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      console.error('Erro ao criar ticket:', ticketError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro interno ao criar o ticket: ' + ticketError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Ticket criado com sucesso:', ticket.id);

    // Success response
    const response = {
      success: true,
      ticket_id: ticket.id,
      ticket_number: ticket.request_number,
      status: ticket.status,
      created_at: ticket.created_at,
      message: 'Ticket criado com sucesso!'
    };

    console.log('Resposta de sucesso:', JSON.stringify(response, null, 2));
    console.log('=== Webhook finalizado com sucesso ===');

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro não tratado no webhook:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor: ' + error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});