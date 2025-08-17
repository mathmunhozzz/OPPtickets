
-- 1) Tickets visíveis por setor para o usuário atual, ou todos para admin/manager.
--    Esta função NÃO altera políticas existentes e é apenas leitura.
create or replace function public.get_visible_tickets()
returns setof public.tickets
language sql
stable
security definer
set search_path = public
as $$
  select t.*
  from public.tickets t
  where
    case
      when has_role('admin'::app_role) or has_role('manager'::app_role)
        then true
      else t.sector_id in (
        select es.sector_id
        from public.employees e
        join public.employee_sectors es on es.employee_id = e.id
        where e.auth_user_id = auth.uid()
      )
    end
$$;

-- 2) Lista de usuários/funcionários com seus setores (somente admin/manager pode executar).
create or replace function public.list_users_with_sectors()
returns table (
  employee_id uuid,
  user_id uuid,
  name text,
  email text,
  sector_ids uuid[],
  sector_names text[]
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (has_role('admin'::app_role) or has_role('manager'::app_role')) then
    raise exception 'Insufficient privileges';
  end if;

  return query
  select
    e.id as employee_id,
    e.auth_user_id as user_id,
    e.name,
    e.email,
    array_remove(array_agg(distinct s.id), null) as sector_ids,
    array_remove(array_agg(distinct s.name), null) as sector_names
  from public.employees e
  left join public.employee_sectors es on es.employee_id = e.id
  left join public.sectors s on s.id = es.sector_id
  group by e.id, e.auth_user_id, e.name, e.email;
end;
$$;

-- Observação: Nenhuma política RLS foi alterada/removida.
-- Estas funções apenas LEEM dados e aplicam filtro por setor ou checagem de papel internamente.
