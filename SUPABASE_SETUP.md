# Configuração do Supabase

Este projeto usa Supabase para persistência de dados. Siga os passos abaixo para configurar.

## 1. Criar Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha os dados do projeto:
   - Nome: `rav4-finance-control` (ou outro nome de sua preferência)
   - Database Password: escolha uma senha forte
   - Region: escolha a região mais próxima (ex: South America - São Paulo)

## 2. Criar Tabela no Banco de Dados

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run** para executar

Isso criará a tabela `finance_data` com todas as colunas necessárias.

## 3. Obter Credenciais

1. No dashboard do Supabase, vá em **Settings** → **API**
2. Copie os seguintes valores:
   - **Project URL** (ex: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a chave pública, não a service_role)

## 4. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env.local` na raiz do projeto (copie de `.env.local.example`)
2. Adicione as credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

## 5. Testar a Conexão

1. Execute `npm run dev`
2. Faça upload de um CSV
3. Verifique no Supabase se os dados foram salvos:
   - Vá em **Table Editor** → **finance_data**
   - Deve aparecer um registro com `id = 'main'`

## Persistência Exclusiva via Supabase

⚠️ **IMPORTANTE**: O sistema agora usa **apenas Supabase** para persistência de dados.

- **Persistência principal**: Supabase
- **Backup local**: localStorage (apenas como cache temporário)

O Supabase é **obrigatório** para o funcionamento do sistema. Certifique-se de configurar as variáveis de ambiente corretamente.

## Estrutura da Tabela

A tabela `finance_data` armazena:
- `id`: ID único (padrão: 'main')
- `transactions`: Array JSON de transações
- `initial_balance`: Saldo inicial
- `salary`: Salário
- `goals`: Metas por categoria (JSON)
- `custom_categories`: Array de categorias customizadas
- `mode`: Estado do modo financeiro
- `rav4_target`, `rav4_target_date`, `rav4_start_date`: Dados do Projeto RAV4
- `created_at`, `updated_at`: Timestamps automáticos

## Segurança

Por padrão, a tabela está configurada com RLS (Row Level Security) habilitado, mas com uma política permissiva. Para produção, ajuste as políticas conforme necessário.

