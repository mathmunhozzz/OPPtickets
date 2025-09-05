-- Add new columns to funcionarios_clientes table for self-registration
ALTER TABLE public.funcionarios_clientes 
ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Create cities table for available cities
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on cities table
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Insert some default cities
INSERT INTO public.cities (name) VALUES 
('São Paulo'),
('Rio de Janeiro'),
('Belo Horizonte'),
('Salvador'),
('Brasília'),
('Fortaleza'),
('Recife'),
('Manaus'),
('Cuiabá'),
('Goiânia')
ON CONFLICT (name) DO NOTHING;

-- Update funcionarios_clientes RLS policies
DROP POLICY IF EXISTS "Authenticated can view active client contacts" ON public.funcionarios_clientes;
DROP POLICY IF EXISTS "Authenticated can insert client contacts" ON public.funcionarios_clientes;
DROP POLICY IF EXISTS "Authenticated can update client contacts" ON public.funcionarios_clientes;

-- New RLS policies for funcionarios_clientes
CREATE POLICY "Anyone can self-register as client contact" 
ON public.funcionarios_clientes 
FOR INSERT 
WITH CHECK (
  auth_user_id = auth.uid() 
  AND approval_status = 'pending'
);

CREATE POLICY "Users can view their own registration" 
ON public.funcionarios_clientes 
FOR SELECT 
USING (
  auth_user_id = auth.uid() 
  OR has_role('admin'::app_role) 
  OR has_role('manager'::app_role)
);

CREATE POLICY "Users can update their own pending registration" 
ON public.funcionarios_clientes 
FOR UPDATE 
USING (
  auth_user_id = auth.uid() 
  AND approval_status = 'pending'
);

CREATE POLICY "Admins can manage all client contacts" 
ON public.funcionarios_clientes 
FOR ALL 
USING (
  has_role('admin'::app_role) 
  OR has_role('manager'::app_role)
);

-- Cities policies
CREATE POLICY "Everyone can view cities" 
ON public.cities 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage cities" 
ON public.cities 
FOR ALL 
USING (
  has_role('admin'::app_role) 
  OR has_role('manager'::app_role)
);

-- Create trigger to update timestamps
CREATE TRIGGER update_cities_updated_at
BEFORE UPDATE ON public.cities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_funcionarios_clientes_auth_user_id 
ON public.funcionarios_clientes(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_funcionarios_clientes_approval_status 
ON public.funcionarios_clientes(approval_status);