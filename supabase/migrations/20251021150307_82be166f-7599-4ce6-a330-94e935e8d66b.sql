-- 1. Remover política RLS atual que causa conflito
DROP POLICY IF EXISTS "Tickets visíveis apenas para usuários aprovados" ON public.tickets;

-- 2. Modificar função can_view_ticket para REMOVER lógica de spoken_api
CREATE OR REPLACE FUNCTION public.can_view_ticket(ticket_uuid uuid, check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  t record;
begin
  -- Admins/Managers podem ver todos
  if public.has_role('admin'::app_role, check_user_id)
     or public.has_role('manager'::app_role, check_user_id)
  then
    return true;
  end if;

  -- Busca dados essenciais do ticket
  select id, created_by, assigned_to, sector_id, source
    into t
  from public.tickets
  where id = ticket_uuid;

  if not found then
    return false;
  end if;

  -- Criador
  if t.created_by = check_user_id then
    return true;
  end if;

  -- Designado
  if t.assigned_to is not null and exists (
    select 1
      from public.employees e
     where e.id = t.assigned_to
       and e.auth_user_id = check_user_id
  ) then
    return true;
  end if;

  -- Membro do mesmo setor
  if t.sector_id is not null and exists (
    select 1
      from public.employees e
      join public.employee_sectors es on es.employee_id = e.id
     where e.auth_user_id = check_user_id
       and es.sector_id = t.sector_id
  ) then
    return true;
  end if;

  return false;
end;
$$;

-- 3. Criar política específica para tickets MANUAIS
CREATE POLICY "Users can view manual tickets"
ON public.tickets
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND source = 'manual'
  AND (
    SELECT account_status 
    FROM profiles 
    WHERE user_id = auth.uid()
  ) = 'approved'
  AND public.can_view_ticket(id)
);

-- 4. Criar política específica para tickets SPOKEN API
CREATE POLICY "Users can view spoken tickets"
ON public.tickets
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND source = 'spoken_api'
  AND (
    SELECT account_status 
    FROM profiles 
    WHERE user_id = auth.uid()
  ) = 'approved'
);