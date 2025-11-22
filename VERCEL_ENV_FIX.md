# Correção: Erro 401 - Invalid API Key no Supabase

Se você está recebendo o erro `Invalid API key` ou `401`, significa que as variáveis de ambiente do Supabase não estão configuradas corretamente na Vercel.

## Erro Comum

```
[Error] Invalid API key
hint: "Double check your Supabase `anon` or `service_role` API key."
```

## Solução Passo a Passo

### Passo 1: Obter as Credenciais Corretas do Supabase

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie os seguintes valores:
   - **Project URL** (exemplo: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (a chave pública, NÃO a `service_role`)

### Passo 2: Configurar na Vercel

1. Acesse o **Vercel Dashboard**: https://vercel.com/dashboard
2. Selecione o projeto `rav4-finance-control`
3. Vá em **Settings** → **Environment Variables**
4. Verifique se existem estas variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Passo 3: Adicionar/Atualizar Variáveis

Se as variáveis **não existem**:

1. Clique em **"Add New"**
2. **Key**: `NEXT_PUBLIC_SUPABASE_URL`
3. **Value**: Cole a URL do seu projeto Supabase (ex: `https://xxxxxxxxxxxxx.supabase.co`)
4. Selecione os ambientes:
   - ✅ **Production**
   - ✅ **Preview** (opcional)
   - ✅ **Development** (opcional)
5. Clique em **"Save"**

6. Repita para a segunda variável:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Cole a chave `anon public` do Supabase
   - Selecione os mesmos ambientes
   - Clique em **"Save"**

Se as variáveis **já existem**:

1. Clique em cada variável para editar
2. Verifique se os valores estão corretos
3. **IMPORTANTE**: Certifique-se de que está usando a chave `anon public`, NÃO a `service_role`
4. Salve as alterações

### Passo 4: Fazer Novo Deploy

Após adicionar/atualizar as variáveis:

1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deploy
3. Selecione **"Redeploy"**
4. Ou faça um novo commit e push (deploy automático)

**⚠️ IMPORTANTE**: As variáveis de ambiente só são aplicadas em novos deploys!

### Passo 5: Verificar se Funcionou

1. Aguarde o deploy completar
2. Acesse sua aplicação na Vercel
3. Abra o **Console do Navegador** (F12)
4. Verifique se não há mais erros 401
5. Faça upload de um CSV de teste
6. Verifique se os dados foram salvos no Supabase

## Verificação Rápida

Execute este comando para verificar as variáveis na Vercel (via CLI):

```bash
vercel env ls
```

Deve mostrar:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Erros Comuns

### ❌ Usando `service_role` em vez de `anon`

**Erro**: A chave `service_role` é para uso no servidor apenas e não deve ser exposta no cliente.

**Solução**: Use sempre a chave `anon public` para variáveis `NEXT_PUBLIC_*`.

### ❌ Variáveis não aplicadas

**Erro**: Você adicionou as variáveis mas o erro continua.

**Solução**: Faça um novo deploy. Variáveis de ambiente só são aplicadas em novos deploys.

### ❌ URL incorreta

**Erro**: A URL do Supabase está incorreta.

**Solução**: Verifique se a URL está no formato: `https://xxxxxxxxxxxxx.supabase.co` (sem barra no final).

### ❌ Variáveis apenas em Development

**Erro**: Você configurou apenas para Development, mas está testando em Production.

**Solução**: Configure para **Production** também (ou todos os ambientes).

## Teste Manual

Após configurar, teste a conexão:

1. Acesse: `https://seu-projeto.vercel.app/api/check-supabase`
2. Deve retornar JSON com os dados ou mensagem de "Nenhum dado encontrado"
3. Se retornar erro 500 ou 401, as variáveis ainda não estão corretas

## Se Ainda Não Funcionar

1. Verifique os logs da Vercel:
   - Vercel Dashboard → Seu Projeto → **Deployments** → Clique no deploy → **View Function Logs**
   - Procure por erros relacionados ao Supabase

2. Verifique os logs do Supabase:
   - Supabase Dashboard → **Logs** → **Postgres Logs**
   - Procure por tentativas de conexão

3. Teste localmente:
   ```bash
   # No arquivo .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
   
   npm run dev
   ```
   Se funcionar localmente mas não na Vercel, o problema é a configuração das variáveis na Vercel.

