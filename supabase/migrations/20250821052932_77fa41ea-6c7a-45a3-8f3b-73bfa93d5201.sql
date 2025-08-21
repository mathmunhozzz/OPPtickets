
-- 1) Criação da tabela de funcionários do cliente (contatos)
create table if not exists public.funcionarios_clientes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  position text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint funcionarios_clientes_unique_name_per_client unique (client_id, name)
);

-- 2) Índices úteis
create index if not exists idx_funcionarios_clientes_client_id on public.funcionarios_clientes (client_id);
create index if not exists idx_funcionarios_clientes_lower_name on public.funcionarios_clientes (lower(name));

-- 3) Habilitar RLS
alter table public.funcionarios_clientes enable row level security;

-- 4) Políticas de RLS
-- Inserir: qualquer usuário autenticado
create policy if not exists "Authenticated users can insert client contacts"
  on public.funcionarios_clientes
  for insert
  with check (auth.uid() is not null);

-- Atualizar: qualquer usuário autenticado
create policy if not exists "Authenticated users can update client contacts"
  on public.funcionarios_clientes
  for update
  using (auth.uid() is not null);

-- Deletar: qualquer usuário autenticado
create policy if not exists "Authenticated users can delete client contacts"
  on public.funcionarios_clientes
  for delete
  using (auth.uid() is not null);

-- Visualizar: somente usuários autenticados com perfil aprovado (mesmo padrão da tabela clients)
create policy if not exists "Authenticated approved users can view client contacts"
  on public.funcionarios_clientes
  for select
  using (
    auth.uid() is not null
    and (
      select profiles.account_status
      from public.profiles
      where profiles.user_id = auth.uid()
    ) = 'approved'
  );

-- 5) Trigger para manter updated_at sempre atualizado
drop trigger if exists trg_funcionarios_clientes_set_updated_at on public.funcionarios_clientes;

create trigger trg_funcionarios_clientes_set_updated_at
  before update on public.funcionarios_clientes
  for each row
  execute function public.update_updated_at_column();
