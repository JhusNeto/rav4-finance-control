# Correção: Problema ao Deletar Dados no Supabase

Se o botão "Limpar" não está deletando os dados do Supabase, siga estes passos:

## Problema Comum: RLS (Row Level Security)

O Supabase pode estar bloqueando operações DELETE devido às políticas RLS.

## Solução

### Passo 1: Verificar e Atualizar a Política RLS

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o seguinte SQL:

```sql
-- Remove a política antiga (se existir)
DROP POLICY IF EXISTS "Permitir tudo para finance_data" ON finance_data;

-- Cria uma nova política que permite DELETE
CREATE POLICY "Permitir tudo para finance_data" ON finance_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Passo 2: Verificar se a Política Está Ativa

Execute este SQL para verificar as políticas:

```sql
SELECT * FROM pg_policies WHERE tablename = 'finance_data';
```

Deve aparecer uma política com `cmd = 'ALL'` ou `cmd = '*'`.

### Passo 3: Testar Manualmente

Execute este SQL para testar se o DELETE funciona:

```sql
DELETE FROM finance_data WHERE id = 'main';
```

Se funcionar, o problema estava na política RLS.

### Passo 4: Verificar Variáveis de Ambiente na Vercel

Certifique-se de que as variáveis estão configuradas:

1. Vercel Dashboard → Seu Projeto → **Settings** → **Environment Variables**
2. Verifique se existem:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Se não existirem, adicione-as
4. Faça um novo deploy após adicionar

### Passo 5: Verificar Logs

1. Abra o **Console do Navegador** (F12)
2. Clique em "Limpar"
3. Verifique os logs:
   - Deve aparecer: `🗑️ Tentando deletar dados do Supabase...`
   - Se houver erro, aparecerá: `❌ Erro ao deletar do Supabase:`
   - Se funcionar: `✅ Dados deletados do Supabase:`

## Alternativa: Desabilitar RLS Temporariamente (NÃO RECOMENDADO PARA PRODUÇÃO)

Se você quiser testar sem RLS:

```sql
ALTER TABLE finance_data DISABLE ROW LEVEL SECURITY;
```

**⚠️ ATENÇÃO**: Isso remove toda a segurança. Use apenas para testes!

Para reabilitar depois:

```sql
ALTER TABLE finance_data ENABLE ROW LEVEL SECURITY;
```

## Verificação Final

Após aplicar as correções:

1. Clique em "Limpar" no painel
2. Verifique o console do navegador
3. Acesse o Supabase → Table Editor → finance_data
4. O registro com `id = 'main'` deve ter sido deletado

## Se Ainda Não Funcionar

1. Verifique os logs do Supabase:
   - Supabase Dashboard → **Logs** → **Postgres Logs**
   - Procure por erros relacionados a DELETE

2. Verifique se a chave anon está correta:
   - Supabase Dashboard → **Settings** → **API**
   - Compare com a variável `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel

3. Teste a conexão:
   - Acesse: `https://seu-projeto.vercel.app/api/check-supabase`
   - Deve retornar os dados atuais

