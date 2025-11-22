# RAV4 Finance Control

Sala de Guerra Financeira - Painel financeiro pessoal hiperpersonalizado

## 🎯 Objetivo

Sistema completo de controle financeiro pessoal desenhado para eliminar descontrole, prever rombos, identificar rapidamente vilões financeiros (PIX, alimentação fora, assinaturas, dívidas) e projetar o final de mês com precisão absoluta.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **TailwindCSS**
- **Shadcn/UI** (Cards, Tables, Tabs, Alert, Skeleton)
- **Zustand** para estado global
- **Recharts** para gráficos
- **Date-fns** para manipulação de datas
- **Papaparse** para parsing de CSV

## 📋 Funcionalidades

### 1. Dashboard Principal - Visão Estratégica
- Saldo atual e projetado
- Entradas e saídas do mês
- Burn rate diário
- Dias restantes
- Status da austeridade (verde/amarelo/vermelho)
- Gráficos de saldo e entradas vs saídas
- Cards de alerta para PIX, Alimentação, Assinaturas e Dívidas

### 2. Fluxo Diário - Visão Tática
- Timeline de todas as transações
- Gráfico de variação do saldo
- Destaques automáticos:
  - Dia mais caro
  - Dia com maior uso de PIX
  - Pico de alimentação fora
  - Compras emocionais

### 3. Análise por Categorias - Visão Operacional
- Tabela detalhada com métricas por categoria
- Gráficos comparativos (gasto real vs meta)
- Status de cada categoria (OK/Risco/Crítico)
- Percentual do salário consumido

### 4. Alertas - Visão de Risco
- Sistema automático de alertas:
  - PIX diário acima da meta
  - Alimentação semanal estourada
  - Assinatura não reconhecida
  - Burn rate projetado negativo
  - Despesa fora do padrão
- Filtros por tipo e categoria

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 📊 Uso

1. **Upload de CSV**: Faça upload do seu extrato bancário em formato CSV
2. **Formato esperado**: O CSV deve conter colunas como:
   - Data (formato DD/MM/AAAA)
   - Descrição/Histórico
   - Valor (com ou sem R$)

3. **Classificação Automática**: O sistema classifica automaticamente as transações em:
   - Alimentação dentro/fora
   - PIX (entrada/saída)
   - Assinaturas
   - Dívidas/CDC
   - Mercado
   - Transporte
   - Compras gerais
   - Outros

4. **Configuração de Metas**: As metas podem ser ajustadas no código (store/financeStore.ts) ou através da interface (futuro)

## 🎨 Design

- Tema escuro padrão
- Estilo militar/estratégico
- Componentes com animações sutis
- Layout estilo "sala de situação"
- Tipografia clara (Inter)

## 📁 Estrutura do Projeto

```
rav4-finance-control/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/          # Componentes Shadcn/UI
│   ├── views/       # Views principais
│   └── CSVUpload.tsx
├── lib/
│   ├── classification.ts  # Classificação de transações
│   ├── csvParser.ts       # Parser de CSV
│   ├── projections.ts     # Cálculos e projeções
│   └── utils.ts           # Utilitários
└── store/
    └── financeStore.ts    # Estado global Zustand
```

## 🔧 Configuração

### Metas Padrão (store/financeStore.ts)

```typescript
const defaultGoals: FinanceGoals = {
  PIX_SAIDA: 500,
  ALIMENTACAO_FORA: 800,
  ASSINATURAS: 200,
  DIVIDAS_CDC: 1000,
}
```

### Salário e Saldo Inicial

Configure no store ou através da interface (futuro).

## 📝 Notas

- O sistema assume que valores negativos no CSV são saídas e positivos são entradas
- A classificação é baseada em palavras-chave nas descrições
- As projeções são calculadas com base no burn rate diário médio

## 🚨 Alertas Automáticos

O sistema gera alertas automaticamente quando:
- PIX diário ultrapassa a meta
- Categoria ultrapassa a meta mensal
- Projeção de fim de mês é negativa
- Despesas estão fora do padrão

## 📄 Licença

Projeto pessoal - Uso privado

