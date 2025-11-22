# Instruções Rápidas - RAV4 Finance Control

## 🚀 Início Rápido

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Rodar o projeto:**
   ```bash
   npm run dev
   ```

3. **Acessar no navegador:**
   ```
   http://localhost:3000
   ```

## 📊 Como Usar

### 1. Upload de Extrato CSV

- Clique em "Selecionar Arquivo CSV"
- Selecione seu extrato bancário
- O sistema processará automaticamente

### 2. Formato do CSV Esperado

O CSV deve ter pelo menos estas colunas:
- **Data**: Formato DD/MM/AAAA (ex: 01/09/2025)
- **Descrição**: Descrição da transação
- **Valor**: Valor numérico (negativo para saídas, positivo para entradas)

**Exemplo:**
```csv
Data,Descrição,Valor
01/09/2025,Salário - Empresa XYZ,5000.00
02/09/2025,PIX - Enviado - João,-150.00
03/09/2025,Ifood - Restaurante,-45.50
```

### 3. Navegação pelas Telas

- **Visão Estratégica**: Dashboard principal com métricas gerais
- **Visão Tática**: Fluxo diário e timeline de transações
- **Visão Operacional**: Análise detalhada por categoria
- **Visão de Risco**: Alertas e notificações automáticas

## ⚙️ Configuração de Metas

As metas padrão estão em `store/financeStore.ts`:

```typescript
const defaultGoals: FinanceGoals = {
  PIX_SAIDA: 500,        // Meta mensal de PIX enviado
  ALIMENTACAO_FORA: 800, // Meta mensal de alimentação fora
  ASSINATURAS: 200,      // Meta mensal de assinaturas
  DIVIDAS_CDC: 1000,     // Meta mensal de dívidas
}
```

Para alterar, edite o arquivo ou implemente interface de configuração.

## 🎯 Classificação Automática

O sistema classifica automaticamente baseado em palavras-chave:

- **Alimentação Fora**: ifood, lanche, restaurante, burger, pizza, etc.
- **Assinaturas**: netflix, spotify, disney, prime, gympass, etc.
- **Dívidas**: consig, cdc, empréstimo, financiamento, etc.
- **Transporte**: uber, 99, taxi, etc.
- **PIX**: Detecta automaticamente entradas e saídas

## 📈 Métricas Calculadas

- **Saldo Atual**: Saldo base + entradas - saídas
- **Saldo Projetado**: Projeção baseada no burn rate médio
- **Burn Rate**: Média diária de gastos
- **Status de Austeridade**: Verde (OK), Amarelo (Atenção), Vermelho (Crítico)

## 🚨 Alertas Automáticos

O sistema gera alertas quando:
- PIX diário ultrapassa a meta
- Categoria ultrapassa a meta mensal
- Projeção de fim de mês é negativa
- Despesas estão fora do padrão

## 💡 Dicas

1. **Formato de Data**: Use DD/MM/AAAA para melhor compatibilidade
2. **Valores Negativos**: Use valores negativos para saídas no CSV
3. **Descrições**: Quanto mais detalhada a descrição, melhor a classificação
4. **Metas**: Ajuste as metas conforme sua realidade financeira

## 🔧 Troubleshooting

### CSV não está sendo processado
- Verifique se as colunas estão nomeadas corretamente
- Confirme que há pelo menos Data, Descrição e Valor
- Verifique o formato das datas

### Classificação incorreta
- Adicione palavras-chave específicas nas descrições
- Edite `lib/classification.ts` para adicionar novas regras

### Gráficos não aparecem
- Certifique-se de que há transações carregadas
- Verifique se as datas estão no mês atual

## 📝 Próximos Passos

- [ ] Interface para editar metas
- [ ] Exportar relatórios em PDF
- [ ] Histórico de meses anteriores
- [ ] Comparação entre meses
- [ ] Notificações em tempo real

