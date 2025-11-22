import { Transaction } from './classification'
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, getMonth, getYear } from 'date-fns'
import { getCategoryLabel } from './classification'

export interface MonthlyInsight {
  id: string
  type: 'comparison' | 'culprit' | 'recurring_cost' | 'trend'
  message: string
  value: number
  category?: string
  comparisonMonth?: string
  percentage?: number
  icon: string
  color: 'green' | 'red' | 'yellow' | 'blue'
}

/**
 * Gera insights mensais automáticos
 */
export function generateMonthlyInsights(
  transactions: Transaction[]
): MonthlyInsight[] {
  const insights: MonthlyInsight[] = []
  const today = new Date()
  const currentMonthStart = startOfMonth(today)
  const currentMonthEnd = endOfMonth(today)
  
  // Transações do mês atual
  const currentMonthTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    isWithinInterval(t.date, { start: currentMonthStart, end: currentMonthEnd })
  )
  
  if (currentMonthTransactions.length === 0) return insights
  
  const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  // 1. Comparação com mês anterior
  const lastMonthStart = subMonths(currentMonthStart, 1)
  const lastMonthEnd = subMonths(currentMonthEnd, 1)
  const lastMonthTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    isWithinInterval(t.date, { start: lastMonthStart, end: lastMonthEnd })
  )
  
  if (lastMonthTransactions.length > 0) {
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const difference = currentMonthTotal - lastMonthTotal
    
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const lastMonthName = monthNames[getMonth(lastMonthStart)]
    
    if (difference > 0) {
      insights.push({
        id: 'monthly-comparison-increase',
        type: 'comparison',
        message: `Você gastou ${formatCurrency(difference)} a mais que em ${lastMonthName}.`,
        value: difference,
        comparisonMonth: lastMonthName,
        icon: '📈',
        color: 'red'
      })
    } else if (difference < 0) {
      insights.push({
        id: 'monthly-comparison-savings',
        type: 'comparison',
        message: `Você economizou ${formatCurrency(Math.abs(difference))} comparado a ${lastMonthName}.`,
        value: Math.abs(difference),
        comparisonMonth: lastMonthName,
        icon: '📉',
        color: 'green'
      })
    }
  }
  
  // 2. Responsável pelo rombo (se houver)
  const projectedBalance = currentMonthTotal // Simplificado - deveria usar projeção real
  if (projectedBalance > 0) {
    // Calcula percentual de cada categoria
    const categoryTotals = new Map<string, number>()
    currentMonthTransactions.forEach(t => {
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + Math.abs(t.amount))
    })
    
    const sortedCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
    
    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0]
      const topCategoryTotal = topCategory[1]
      const topCategoryPercentage = (topCategoryTotal / currentMonthTotal) * 100
      
      if (topCategoryPercentage > 30) {
        insights.push({
          id: 'monthly-culprit',
          type: 'culprit',
          message: `${getCategoryLabel(topCategory[0] as any)} foi responsável por ${topCategoryPercentage.toFixed(0)}% dos gastos.`,
          value: topCategoryTotal,
          category: topCategory[0],
          percentage: topCategoryPercentage,
          icon: '🎯',
          color: 'red'
        })
      }
    }
  }
  
  // 3. Custos recorrentes (assinaturas)
  const subscriptionTransactions = currentMonthTransactions.filter(t =>
    t.category === 'ASSINATURAS'
  )
  
  if (subscriptionTransactions.length > 0) {
    const subscriptionTotal = subscriptionTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    insights.push({
      id: 'monthly-subscriptions',
      type: 'recurring_cost',
      message: `Assinaturas estão te custando ${formatCurrency(subscriptionTotal)} por mês.`,
      value: subscriptionTotal,
      category: 'ASSINATURAS',
      icon: '💳',
      color: 'blue'
    })
  }
  
  // 4. PIX como responsável (se for significativo)
  const pixTransactions = currentMonthTransactions.filter(t =>
    t.category === 'PIX_SAIDA'
  )
  
  if (pixTransactions.length > 0) {
    const pixTotal = pixTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const pixPercentage = (pixTotal / currentMonthTotal) * 100
    
    if (pixPercentage > 30) {
      insights.push({
        id: 'monthly-pix-culprit',
        type: 'culprit',
        message: `PIX foi responsável por ${pixPercentage.toFixed(0)}% dos gastos.`,
        value: pixTotal,
        category: 'PIX_SAIDA',
        percentage: pixPercentage,
        icon: '💸',
        color: 'red'
      })
    }
  }
  
  return insights
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

