-- Create RPC function to get unique municipalities from clients table
CREATE OR REPLACE FUNCTION public.get_client_municipalities()
RETURNS TABLE(municipality text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.municipality
  FROM clients c
  WHERE c.municipality IS NOT NULL
  ORDER BY c.municipality;
$$;

-- Create RPC function to get public client data for registration
CREATE OR REPLACE FUNCTION public.get_clients_public()
RETURNS TABLE(id uuid, name text, municipality text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.municipality
  FROM clients c
  ORDER BY c.name;
$$;