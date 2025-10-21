-- Adicionar coluna source para identificar origem dos tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE tickets ADD CONSTRAINT tickets_source_check 
  CHECK (source IN ('manual', 'spoken_api'));

-- Criar índice para melhor performance nas queries
CREATE INDEX IF NOT EXISTS idx_tickets_source ON tickets(source);

-- Atualizar tickets existentes que foram importados do Spoken (identificados pela tag 'spoken')
UPDATE tickets 
SET source = 'spoken_api' 
WHERE 'spoken' = ANY(tags);

-- Comentários para documentação
COMMENT ON COLUMN tickets.source IS 'Origem do ticket: manual (criado no sistema) ou spoken_api (importado via API Spoken)';
COMMENT ON INDEX idx_tickets_source IS 'Índice para otimizar queries que filtram por origem do ticket';