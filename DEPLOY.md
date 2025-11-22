# Deploy na Vercel

Este guia explica como fazer o deploy do RAV4 Finance Control na Vercel.

## Pré-requisitos

1. Conta na Vercel (gratuita): https://vercel.com/signup
2. Projeto no Supabase configurado (veja `SUPABASE_SETUP.md`)
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## Opção 1: Deploy via Dashboard da Vercel (Recomendado)

### Passo 1: Preparar o Repositório

1. Certifique-se de que seu código está em um repositório Git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <seu-repositorio-url>
   git push -u origin main
   ```

### Passo 2: Conectar na Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New..."** → **"Project"**
3. Importe seu repositório Git
4. A Vercel detectará automaticamente que é um projeto Next.js

### Passo 3: Configurar Variáveis de Ambiente

**IMPORTANTE**: Configure as variáveis antes do primeiro deploy!

1. Na página de configuração do projeto, vá em **"Environment Variables"**
2. Adicione as seguintes variáveis:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```

3. Selecione os ambientes:
   - ✅ **Production**
   - ✅ **Preview** (opcional, para branches)
   - ✅ **Development** (opcional)

### Passo 4: Configurar Build Settings

A Vercel detecta automaticamente:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install` (automático)

Não é necessário alterar nada, mas você pode verificar em **"Settings" → "General"**.

### Passo 5: Fazer o Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (geralmente 2-5 minutos)
3. Quando concluir, você receberá uma URL: `https://seu-projeto.vercel.app`

### Passo 6: Verificar o Deploy

1. Acesse a URL fornecida
2. Faça upload de um CSV de teste
3. Verifique se os dados foram salvos no Supabase:
   - Acesse o Supabase Dashboard
   - Vá em **Table Editor** → **finance_data**
   - Deve aparecer um registro com `id = 'main'`

## Opção 2: Deploy via CLI da Vercel

### Passo 1: Instalar Vercel CLI

```bash
npm i -g vercel
```

### Passo 2: Fazer Login

```bash
vercel login
```

### Passo 3: Deploy

```bash
cd rav4-finance-control
vercel
```

Siga as instruções:
- **Set up and deploy?** → `Y`
- **Which scope?** → Selecione sua conta
- **Link to existing project?** → `N` (primeira vez)
- **Project name?** → `rav4-finance-control` (ou outro)
- **Directory?** → `./` (pressione Enter)
- **Override settings?** → `N`

### Passo 4: Configurar Variáveis de Ambiente

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Cole o valor quando solicitado
# Selecione os ambientes (Production, Preview, Development)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Cole o valor quando solicitado
# Selecione os ambientes
```

### Passo 5: Deploy de Produção

```bash
vercel --prod
```

## Configurações Adicionais

### Domínio Customizado (Opcional)

1. Na Vercel Dashboard, vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções

### Variáveis de Ambiente por Ambiente

Você pode ter valores diferentes para cada ambiente:

- **Production**: URL e chave do Supabase de produção
- **Preview**: URL e chave do Supabase de staging (opcional)
- **Development**: URL e chave do Supabase local (opcional)

## Troubleshooting

### Build Falha

1. Verifique os logs em **Deployments** → **View Function Logs**
2. Erro comum: Variáveis de ambiente não configuradas
   - Solução: Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Erro de Runtime

1. Verifique o console do navegador
2. Verifique os logs da Vercel em **Functions** → **View Logs**
3. Erro comum: Supabase não configurado
   - Solução: Verifique se as variáveis estão configuradas corretamente

### Dados Não Persistem

1. Verifique se o Supabase está configurado corretamente
2. Verifique se a tabela `finance_data` existe no Supabase
3. Verifique os logs do Supabase em **Logs** → **Postgres Logs`

## Atualizações Futuras

Após o primeiro deploy, atualizações são automáticas:

1. Faça `git push` para o repositório
2. A Vercel detecta automaticamente e faz um novo deploy
3. Você recebe uma notificação quando concluir

Para deploys manuais:

```bash
vercel --prod
```

## Verificação Pós-Deploy

Após o deploy, teste:

1. ✅ Acesse a URL da aplicação
2. ✅ Faça upload de um CSV
3. ✅ Verifique se os dados aparecem no dashboard
4. ✅ Verifique se os dados foram salvos no Supabase
5. ✅ Teste o botão "Limpar dados"
6. ✅ Verifique se os gráficos estão funcionando

## Suporte

Se encontrar problemas:

1. Verifique os logs da Vercel
2. Verifique os logs do Supabase
3. Consulte a documentação:
   - Vercel: https://vercel.com/docs
   - Supabase: https://supabase.com/docs
   - Next.js: https://nextjs.org/docs

