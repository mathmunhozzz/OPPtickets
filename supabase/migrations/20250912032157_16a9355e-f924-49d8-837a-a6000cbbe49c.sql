-- Update RLS policies for tickets table to require approved account status

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view trips based on role" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.tickets;
DROP POLICY IF EXISTS "Users can update relevant trips" ON public.tickets;
DROP POLICY IF EXISTS "Admins and managers can delete trips" ON public.tickets;

-- Update tickets SELECT policy to require approved status
DROP POLICY IF EXISTS "Tickets visíveis para criador, responsável, admins/gestores o" ON public.tickets;
CREATE POLICY "Tickets visíveis apenas para usuários aprovados" 
ON public.tickets 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) 
  AND (
    SELECT account_status 
    FROM profiles 
    WHERE user_id = auth.uid()
  ) = 'approved'
  AND can_view_ticket(id)
);

-- Update tickets INSERT policy to require approved status
DROP POLICY IF EXISTS "Usuários criam os próprios tickets" ON public.tickets;
CREATE POLICY "Usuários aprovados podem criar tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) 
  AND (created_by = auth.uid())
  AND (
    SELECT account_status 
    FROM profiles 
    WHERE user_id = auth.uid()
  ) = 'approved'
);

-- Update tickets UPDATE policies to require approved status
DROP POLICY IF EXISTS "Atualização por criador, responsável e admins/gestores" ON public.tickets;
DROP POLICY IF EXISTS "Membros do setor podem atualizar tickets do setor" ON public.tickets;
CREATE POLICY "Usuários aprovados podem atualizar tickets autorizados" 
ON public.tickets 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL) 
  AND (
    SELECT account_status 
    FROM profiles 
    WHERE user_id = auth.uid()
  ) = 'approved'
  AND (
    has_role('admin'::app_role) 
    OR has_role('manager'::app_role) 
    OR (created_by = auth.uid()) 
    OR (EXISTS (
      SELECT 1 
      FROM employees e 
      WHERE e.id = tickets.assigned_to 
      AND e.auth_user_id = auth.uid()
    ))
    OR (
      sector_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 
        FROM employees e
        JOIN employee_sectors es ON es.employee_id = e.id
        WHERE e.auth_user_id = auth.uid() 
        AND es.sector_id = tickets.sector_id
      )
    )
  )
);

-- Update tickets DELETE policy to require approved status
DROP POLICY IF EXISTS "Remoção por criador e admins/gestores" ON public.tickets;
CREATE POLICY "Usuários aprovados podem remover tickets autorizados" 
ON public.tickets 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL) 
  AND (
    SELECT account_status 
    FROM profiles 
    WHERE user_id = auth.uid()
  ) = 'approved'
  AND (
    has_role('admin'::app_role) 
    OR has_role('manager'::app_role) 
    OR (created_by = auth.uid())
  )
);