
create table public.funcionarios_clientes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references public.clients(id) on delete cascade,
  sector_id uuid references public.sectors(id) on delete set null,
  name text not null,
  email text,
  phone text,
  position text,
  notes text,
  is_active boolean not null default true
);

alter table public.funcionarios_clientes enable row level security;

create trigger set_timestamp before update on public.funcionarios_clientes for each row execute function public.update_updated_at_column();

CREATE POLICY \"Authenticated can view active client contacts\"
ON public.funcionarios_clientes
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY \"Admins/managers can view all client contacts\"
ON public.funcionarios_clientes
FOR SELECT
USING (has_role('admin'::app_role) OR has_role('manager'::app_role));

CREATE POLICY \"Authenticated can insert client contacts\"
ON public.funcionarios_clientes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY \"Authenticated can update client contacts\"
ON public.funcionarios_clientes
FOR UPDATE
USING (auth.uid() IS NOT NULL);

create index on public.funcionarios_clientes (client_id);
create index on public.funcionarios_clientes (sector_id);
create index funcionarios_clientes_name_idx on public.funcionarios_clientes (lower(name));
