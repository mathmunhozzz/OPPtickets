-- Function to safely get creator names for visible tickets
CREATE OR REPLACE FUNCTION public.get_ticket_creator_names(
  ticket_ids uuid[],
  check_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE(ticket_id uuid, creator_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id AS ticket_id,
         COALESCE(e.name, p.name, 'Usuário') AS creator_name
  FROM public.tickets t
  LEFT JOIN public.employees e ON e.auth_user_id = t.created_by
  LEFT JOIN public.profiles p ON p.user_id = t.created_by
  WHERE t.id = ANY(ticket_ids)
    AND public.can_view_ticket(t.id, check_user_id);
$$;

-- Allow authenticated users to execute the function
GRANT EXECUTE ON FUNCTION public.get_ticket_creator_names(uuid[], uuid) TO authenticated;