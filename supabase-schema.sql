-- Schema do Supabase para RAV4 Finance Control
-- Execute este SQL no SQL Editor do Supabase

-- Tabela principal de dados financeiros
CREATE TABLE IF NOT EXISTS finance_data (
  id TEXT PRIMARY KEY DEFAULT 'main',
  user_id TEXT, -- Para suporte multi-usuário futuro (opcional)
  transactions JSONB NOT NULL DEFAULT '[]'::jsonb,
  initial_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  salary NUMERIC(12, 2) NOT NULL DEFAULT 5000,
  goals JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_date_value TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  custom_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  mode JSONB,
  weekly_goal NUMERIC(12, 2),
  rav4_target NUMERIC(12, 2),
  rav4_target_date TIMESTAMPTZ,
  rav4_start_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_finance_data_user_id ON finance_data(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_data_updated_at ON finance_data(updated_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_finance_data_updated_at ON finance_data;
CREATE TRIGGER update_finance_data_updated_at
  BEFORE UPDATE ON finance_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Desabilitado por padrão para facilitar desenvolvimento
-- Você pode habilitar depois se precisar de autenticação
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;

-- Política permissiva (permite tudo) - ajuste conforme necessário
CREATE POLICY "Permitir tudo para finance_data" ON finance_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentários nas colunas
COMMENT ON TABLE finance_data IS 'Armazena todos os dados financeiros do usuário';
COMMENT ON COLUMN finance_data.id IS 'ID único do registro (padrão: main)';
COMMENT ON COLUMN finance_data.transactions IS 'Array JSON de transações financeiras';
COMMENT ON COLUMN finance_data.goals IS 'Objeto JSON com metas por categoria';
COMMENT ON COLUMN finance_data.current_date_value IS 'Data atual selecionada pelo usuário';
COMMENT ON COLUMN finance_data.mode IS 'Estado atual do modo financeiro (normal/iskra/mochila)';

