-- Modificar função can_view_ticket para permitir visualização de tickets importados do Spoken
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

  -- ⭐ NOVO: Tickets importados do Spoken API são visíveis para todos usuários aprovados
  if t.source = 'spoken_api' then
    return true;
  end if;

  -- Criador
  if t.created_by = check_user_id then
    return true;
  end if;

  -- Designado (comparando auth_user_id com o employee do assigned_to)
  if t.assigned_to is not null and exists (
    select 1
      from public.employees e
     where e.id = t.assigned_to
       and e.auth_user_id = check_user_id
  ) then
    return true;
  end if;

  -- Membro do mesmo setor do ticket
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

COMMENT ON FUNCTION public.can_view_ticket IS 'Verifica se um usuário pode visualizar um ticket. Tickets do Spoken API são visíveis para todos usuários aprovados.';