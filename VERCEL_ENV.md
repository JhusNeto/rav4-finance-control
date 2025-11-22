# Configuração de Variáveis de Ambiente na Vercel

Para usar o Supabase em produção na Vercel, configure as variáveis de ambiente:

## Passos

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Selecione o projeto `rav4-finance-control`
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

### Variáveis Necessárias

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### Configuração por Ambiente

Você pode configurar diferentes valores para:
- **Production**: Produção
- **Preview**: Deploys de preview (branches)
- **Development**: Ambiente local

Recomendação: Configure pelo menos para **Production**.

## Após Configurar

1. Faça um novo deploy (ou aguarde o próximo deploy automático)
2. As variáveis estarão disponíveis na aplicação
3. O sistema automaticamente usará Supabase em vez do fallback

## Verificação

Após o deploy, você pode verificar se está funcionando:
1. Faça upload de um CSV na aplicação
2. Acesse o Supabase → Table Editor → finance_data
3. Deve aparecer um registro com os dados

## Fallback Automático

Se as variáveis não estiverem configuradas:
- O sistema continua funcionando normalmente
- Usa API Route (JSON file) como fallback
- Não há impacto na funcionalidade

