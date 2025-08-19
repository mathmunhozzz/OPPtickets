
-- Permitir que membros do mesmo setor do ticket possam atualizar o ticket
-- (ex.: mover status entre colunas no board)
CREATE POLICY "Membros do setor podem atualizar tickets do setor"
ON public.tickets
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND tickets.sector_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.employee_sectors es ON es.employee_id = e.id
    WHERE e.auth_user_id = auth.uid()
      AND es.sector_id = tickets.sector_id
  )
)
WITH CHECK (
  tickets.sector_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.employee_sectors es ON es.employee_id = e.id
    WHERE e.auth_user_id = auth.uid()
      AND es.sector_id = tickets.sector_id
  )
);
