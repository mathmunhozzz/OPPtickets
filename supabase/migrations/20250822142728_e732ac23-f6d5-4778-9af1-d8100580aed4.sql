-- Primeiro, verificar se a tabela funcionarios_clientes existe e corrigir a estrutura
DROP TABLE IF EXISTS public.funcionarios_clientes CASCADE;

-- Recriar a tabela funcionarios_clientes com a estrutura correta
CREATE TABLE public.funcionarios_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  position text,
  notes text,
  is_active boolean NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.funcionarios_clientes ENABLE ROW LEVEL SECURITY;

-- Trigger para manter updated_at
CREATE TRIGGER trg_funcionarios_clientes_updated_at
BEFORE UPDATE ON public.funcionarios_clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices úteis
CREATE INDEX idx_funcionarios_clientes_client_id ON public.funcionarios_clientes (client_id);
CREATE INDEX idx_funcionarios_clientes_sector_id ON public.funcionarios_clientes (sector_id);
CREATE INDEX idx_funcionarios_clientes_name ON public.funcionarios_clientes (lower(name));

-- Políticas RLS
CREATE POLICY "Authenticated can view active client contacts"
ON public.funcionarios_clientes
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins/managers can view all client contacts"
ON public.funcionarios_clientes
FOR SELECT
USING (public.has_role('admin'::app_role) OR public.has_role('manager'::app_role));

CREATE POLICY "Authenticated can insert client contacts"
ON public.funcionarios_clientes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update client contacts"
ON public.funcionarios_clientes
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete client contacts"
ON public.funcionarios_clientes
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Adicionar campo client_contact_id na tabela tickets para vincular funcionário do cliente
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS client_contact_id uuid REFERENCES public.funcionarios_clientes(id) ON DELETE SET NULL;

-- Criar índice para o novo campo
CREATE INDEX IF NOT EXISTS idx_tickets_client_contact_id ON public.tickets (client_contact_id);