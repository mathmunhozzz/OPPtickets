
-- 1) Função centralizada de visibilidade
create or replace function public.can_view_ticket(
  ticket_uuid uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
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
  select id, created_by, assigned_to, sector_id
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
$function$;

-- 2) Tickets: substituir política de SELECT para incluir "mesmo setor"
drop policy if exists "Tickets visíveis para criador, responsável e admins/gestores" on public.tickets;

create policy "Tickets visíveis para criador, responsável, admins/gestores ou mesmo setor"
on public.tickets
for select
using (public.can_view_ticket(id));

-- 3) Logs: alinhar a visibilidade com a do ticket
drop policy if exists "Logs visíveis para quem tem acesso ao ticket" on public.ticket_action_logs;

create policy "Logs visíveis para quem tem acesso ao ticket (inclui mesmo setor)"
on public.ticket_action_logs
for select
using (public.can_view_ticket(ticket_id));

-- 4) Comentários: alinhar a visibilidade com a do ticket
drop policy if exists "Comentários visíveis a quem pode ver o ticket" on public.ticket_comments;

create policy "Comentários visíveis a quem pode ver o ticket (inclui mesmo setor)"
on public.ticket_comments
for select
using (public.can_view_ticket(ticket_id));

-- 5) Backfill de vínculo employee -> usuário (por e-mail)
-- Observação: funciona quando o e-mail do employee = e-mail do usuário autenticado no Supabase.
update public.employees e
   set auth_user_id = u.id
  from auth.users u
 where e.auth_user_id is null
   and e.email is not null
   and lower(e.email) = lower(u.email);
