import { Transaction } from './classification'
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { getCategoryLabel } from './classification'

export interface PredictiveInsight {
  id: string
  type: 'potential_savings' | 'optimization' | 'forecast'
  message: string
  value: number
  topExpenses?: Array<{ description: string; amount: number }>
  category?: string
  icon: string
  color: 'green' | 'yellow' | 'blue'
}

/**
 * Gera insights preditivos automáticos
 */
export function generatePredictiveInsights(
  transactions: Transaction[]
): PredictiveInsight[] {
  const insights: PredictiveInsight[] = []
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  
  // Transações do mês atual
  const monthTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    isWithinInterval(t.date, { start: monthStart, end: monthEnd })
  )
  
  if (monthTransactions.length === 0) return insights
  
  // 1. Economia potencial evitando top 5 gastos
  const sortedByAmount = [...monthTransactions]
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5)
  
  if (sortedByAmount.length >= 3) {
    const top5Total = sortedByAmount.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    // Considera apenas gastos não essenciais (exclui dívidas, mercado básico)
    const nonEssential = sortedByAmount.filter(t =>
      t.category !== 'DIVIDAS_CDC' &&
      t.category !== 'MERCADO' &&
      t.category !== 'TARIFAS'
    )
    
    if (nonEssential.length > 0) {
      const potentialSavings = nonEssential.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      insights.push({
        id: 'predictive-top-expenses',
        type: 'potential_savings',
        message: `Se você evitar os ${nonEssential.length} maiores gastos não essenciais, economiza ${formatCurrency(potentialSavings)}/mês.`,
        value: potentialSavings,
        topExpenses: nonEssential.map(t => ({
          description: t.description.substring(0, 40),
          amount: Math.abs(t.amount)
        })),
        icon: '💡',
        color: 'green'
      })
    }
  }
  
  // 2. Otimização por categoria
  const categoryTotals = new Map<string, number>()
  monthTransactions.forEach(t => {
    categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + Math.abs(t.amount))
  })
  
  // Identifica categoria com maior potencial de redução
  const expensiveCategories = Array.from(categoryTotals.entries())
    .filter(([cat]) => 
      cat === 'ALIMENTACAO_FORA' ||
      cat === 'PIX_SAIDA' ||
      cat === 'COMPRAS_GERAIS'
    )
    .sort((a, b) => b[1] - a[1])
  
  if (expensiveCategories.length > 0) {
    const topCategory = expensiveCategories[0]
    const reductionPotential = topCategory[1] * 0.2 // 20% de redução potencial
    
    if (reductionPotential > 100) {
      insights.push({
        id: 'predictive-category-optimization',
        type: 'optimization',
        message: `Reduzindo ${getCategoryLabel(topCategory[0] as any)} em 20%, você economiza ${formatCurrency(reductionPotential)}/mês.`,
        value: reductionPotential,
        category: topCategory[0],
        icon: '🎯',
        color: 'blue'
      })
    }
  }
  
  // 3. Previsão de economia anual
  const monthlyTotal = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const daysElapsed = Math.max(1, today.getDate())
  const projectedMonthly = (monthlyTotal / daysElapsed) * 30
  const projectedAnnual = projectedMonthly * 12
  
  // Compara com meta (se disponível)
  const idealMonthly = monthlyTotal * 0.9 // Assume 10% de redução como ideal
  const annualSavings = (projectedMonthly - idealMonthly) * 12
  
  if (annualSavings > 0) {
    insights.push({
      id: 'predictive-annual-forecast',
      type: 'forecast',
      message: `Com uma redução de 10% nos gastos, você economizaria ${formatCurrency(annualSavings)} por ano.`,
      value: annualSavings,
      icon: '📊',
      color: 'green'
    })
  }
  
  return insights
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

