-- Harden function search_path for security linter
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';