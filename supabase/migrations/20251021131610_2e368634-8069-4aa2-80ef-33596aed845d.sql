-- Adiciona campo CPF na tabela employees para vincular com dados do Spoken
ALTER TABLE public.employees 
ADD COLUMN cpf text UNIQUE;

-- Cria índice para busca rápida por CPF
CREATE INDEX idx_employees_cpf ON public.employees(cpf) WHERE cpf IS NOT NULL;

-- Adiciona comentário explicativo
COMMENT ON COLUMN public.employees.cpf IS 'CPF do funcionário para integração com sistema Spoken';