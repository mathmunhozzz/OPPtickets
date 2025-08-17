
-- 1) Atualizar o enum de status dos tickets
-- Renomear 'pendente' -> 'em_analise' se existir e 'em_analise' ainda não existir
DO $$
DECLARE
  exists_em_analise boolean;
  exists_pendente boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ticket_status' AND e.enumlabel = 'em_analise'
  ) INTO exists_em_analise;

  SELECT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ticket_status' AND e.enumlabel = 'pendente'
  ) INTO exists_pendente;

  IF exists_pendente AND NOT exists_em_analise THEN
    EXECUTE 'ALTER TYPE public.ticket_status RENAME VALUE ''pendente'' TO ''em_analise''';
  END IF;
END
$$;

-- Adicionar valores que faltarem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ticket_status' AND e.enumlabel = 'aberto'
  ) THEN
    ALTER TYPE public.ticket_status ADD VALUE 'aberto';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ticket_status' AND e.enumlabel = 'finalizado'
  ) THEN
    ALTER TYPE public.ticket_status ADD VALUE 'finalizado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ticket_status' AND e.enumlabel = 'negado'
  ) THEN
    ALTER TYPE public.ticket_status ADD VALUE 'negado';
  END IF;
END
$$;

-- Definir default para 'aberto'
ALTER TABLE public.tickets
  ALTER COLUMN status SET DEFAULT 'aberto'::public.ticket_status;

-- 2) Índices para melhorar RLS/consultas
CREATE INDEX IF NOT EXISTS idx_tickets_sector_id ON public.tickets(sector_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);

-- 3) RLS: visibilidade por setor (recriar SELECT)
DROP POLICY IF EXISTS "Tickets visíveis para criador, responsável e admins/gestores" ON public.tickets;

CREATE POLICY "Tickets visíveis por setor, criador, responsável e admins/gestores"
ON public.tickets
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    has_role('admin'::app_role)
    OR has_role('manager'::app_role)
    OR (created_by = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM employees e
      JOIN employee_sectors es ON es.employee_id = e.id
      WHERE e.auth_user_id = auth.uid()
        AND es.sector_id = tickets.sector_id
    )
    OR EXISTS (
      SELECT 1 FROM employees e2
      WHERE e2.id = tickets.assigned_to AND e2.auth_user_id = auth.uid()
    )
  )
);

-- 4) RLS: inserção permitida apenas no próprio setor
DROP POLICY IF EXISTS "Usuários criam os próprios tickets" ON public.tickets;

CREATE POLICY "Usuários criam tickets no próprio setor"
ON public.tickets
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
  AND (
    tickets.sector_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM employees e
      JOIN employee_sectors es ON es.employee_id = e.id
      WHERE e.auth_user_id = auth.uid()
        AND es.sector_id = tickets.sector_id
    )
  )
);

-- Mantemos as políticas existentes de UPDATE/DELETE

-- 5) (Opcional) Realtime para tickets (idempotente)
ALTER TABLE public.tickets REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tickets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets';
  END IF;
END
$$;
