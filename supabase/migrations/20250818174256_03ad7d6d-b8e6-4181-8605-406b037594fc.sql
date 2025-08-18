
-- 1) LOGS DE TICKETS (criação, status, atribuição)
drop trigger if exists trg_ticket_logs on public.tickets;
create trigger trg_ticket_logs
after insert or update on public.tickets
for each row execute function public.log_ticket_action();

-- 2) TRIGGERS DE updated_at NAS TABELAS COM COLUNA updated_at
-- Observação: usamos a função pública já existente public.update_updated_at_column()

-- profiles
drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- employees
drop trigger if exists set_updated_at_employees on public.employees;
create trigger set_updated_at_employees
before update on public.employees
for each row execute function public.update_updated_at_column();

-- sectors
drop trigger if exists set_updated_at_sectors on public.sectors;
create trigger set_updated_at_sectors
before update on public.sectors
for each row execute function public.update_updated_at_column();

-- tickets
drop trigger if exists set_updated_at_tickets on public.tickets;
create trigger set_updated_at_tickets
before update on public.tickets
for each row execute function public.update_updated_at_column();

-- trips
drop trigger if exists set_updated_at_trips on public.trips;
create trigger set_updated_at_trips
before update on public.trips
for each row execute function public.update_updated_at_column();

-- trip_reports
drop trigger if exists set_updated_at_trip_reports on public.trip_reports;
create trigger set_updated_at_trip_reports
before update on public.trip_reports
for each row execute function public.update_updated_at_column();

-- employee_absences
drop trigger if exists set_updated_at_employee_absences on public.employee_absences;
create trigger set_updated_at_employee_absences
before update on public.employee_absences
for each row execute function public.update_updated_at_column();

-- user_roles
drop trigger if exists set_updated_at_user_roles on public.user_roles;
create trigger set_updated_at_user_roles
before update on public.user_roles
for each row execute function public.update_updated_at_column();

-- vehicles
drop trigger if exists set_updated_at_vehicles on public.vehicles;
create trigger set_updated_at_vehicles
before update on public.vehicles
for each row execute function public.update_updated_at_column();

-- clients
drop trigger if exists set_updated_at_clients on public.clients;
create trigger set_updated_at_clients
before update on public.clients
for each row execute function public.update_updated_at_column();

-- notification_settings
drop trigger if exists set_updated_at_notification_settings on public.notification_settings;
create trigger set_updated_at_notification_settings
before update on public.notification_settings
for each row execute function public.update_updated_at_column();

-- 3) ÍNDICES PARA PERFORMANCE
create index if not exists idx_employees_auth_user_id on public.employees(auth_user_id);
create index if not exists idx_tickets_sector_id on public.tickets(sector_id);
create index if not exists idx_tickets_created_by on public.tickets(created_by);
create index if not exists idx_ticket_action_logs_ticket_id on public.ticket_action_logs(ticket_id);

-- 4) BACKFILLS (idempotentes)

-- Vincular employees.auth_user_id por e-mail (quando possível)
update public.employees e
   set auth_user_id = u.id
  from auth.users u
 where e.auth_user_id is null
   and e.email is not null
   and lower(e.email) = lower(u.email);

-- Atualizar profiles.name a partir de employees quando estiver "Usuário/Usuario" ou nulo
update public.profiles p
   set name = e.name
  from public.employees e
 where e.auth_user_id = p.user_id
   and (p.name is null or p.name in ('Usuário','Usuario'));
