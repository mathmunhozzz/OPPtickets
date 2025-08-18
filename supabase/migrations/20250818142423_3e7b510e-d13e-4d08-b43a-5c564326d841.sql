-- Criar tabela de logs de ações dos tickets
CREATE TABLE public.ticket_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'status_change', 'assignment_change', 'created', etc
  old_value TEXT,
  new_value TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB
);

-- Enable RLS
ALTER TABLE public.ticket_action_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para ticket_action_logs
CREATE POLICY "Logs visíveis para quem tem acesso ao ticket"
ON public.ticket_action_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role('admin'::app_role) OR 
    has_role('manager'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.tickets t 
      LEFT JOIN public.employees e ON e.id = t.assigned_to
      WHERE t.id = ticket_action_logs.ticket_id AND (
        t.created_by = auth.uid() OR 
        e.auth_user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Sistema pode inserir logs"
ON public.ticket_action_logs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND performed_by = auth.uid()
);

-- Criar índices para performance
CREATE INDEX idx_ticket_action_logs_ticket_id ON public.ticket_action_logs(ticket_id);
CREATE INDEX idx_ticket_action_logs_performed_at ON public.ticket_action_logs(performed_at);

-- Função para registrar logs automaticamente
CREATE OR REPLACE FUNCTION public.log_ticket_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para criação de ticket
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_action_logs (
      ticket_id, 
      action_type, 
      new_value, 
      performed_by,
      details
    ) VALUES (
      NEW.id,
      'created',
      NEW.status,
      NEW.created_by,
      jsonb_build_object('title', NEW.title, 'priority', NEW.priority)
    );
    RETURN NEW;
  END IF;
  
  -- Log para mudanças de status
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.ticket_action_logs (
      ticket_id,
      action_type,
      old_value,
      new_value,
      performed_by
    ) VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  -- Log para mudanças de responsável
  IF TG_OP = 'UPDATE' AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    INSERT INTO public.ticket_action_logs (
      ticket_id,
      action_type,
      old_value,
      new_value,
      performed_by
    ) VALUES (
      NEW.id,
      'assignment_change',
      COALESCE(OLD.assigned_to::text, 'unassigned'),
      COALESCE(NEW.assigned_to::text, 'unassigned'),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para logs automáticos
CREATE TRIGGER ticket_action_logging
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_action();