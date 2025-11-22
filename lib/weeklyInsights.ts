import { Transaction } from './classification'
import { startOfWeek, endOfWeek, isWithinInterval, getDay, format, subWeeks } from 'date-fns'
import { getCategoryLabel } from './classification'

export interface WeeklyInsight {
  id: string
  type: 'savings' | 'villain' | 'worst_day' | 'trend'
  message: string
  value: number
  category?: string
  day?: string
  comparison?: number
  icon: string
  color: 'green' | 'red' | 'yellow' | 'blue'
}

/**
 * Gera insights semanais automáticos
 */
export function generateWeeklyInsights(
  transactions: Transaction[],
  weeklyGoal: number
): WeeklyInsight[] {
  const insights: WeeklyInsight[] = []
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  
  // Transações da semana atual
  const weekTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    isWithinInterval(t.date, { start: weekStart, end: weekEnd })
  )
  
  if (weekTransactions.length === 0) return insights
  
  const weekTotal = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  // 1. Economia da semana (comparado com meta ou semana anterior)
  if (weeklyGoal > 0) {
    const savings = weeklyGoal - weekTotal
    if (savings > 0) {
      insights.push({
        id: 'weekly-savings',
        type: 'savings',
        message: `Você economizou ${formatCurrency(savings)} esta semana.`,
        value: savings,
        icon: '💰',
        color: 'green'
      })
    }
  }
  
  // Compara com semana anterior
  const lastWeekStart = subWeeks(weekStart, 1)
  const lastWeekEnd = subWeeks(weekEnd, 1)
  const lastWeekTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    isWithinInterval(t.date, { start: lastWeekStart, end: lastWeekEnd })
  )
  
  if (lastWeekTransactions.length > 0) {
    const lastWeekTotal = lastWeekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const difference = lastWeekTotal - weekTotal
    
    if (difference > 0) {
      insights.push({
        id: 'weekly-comparison-savings',
        type: 'savings',
        message: `Você economizou ${formatCurrency(difference)} comparado à semana passada.`,
        value: difference,
        comparison: lastWeekTotal,
        icon: '📉',
        color: 'green'
      })
    } else if (difference < 0) {
      insights.push({
        id: 'weekly-comparison-increase',
        type: 'trend',
        message: `Você gastou ${formatCurrency(Math.abs(difference))} a mais que na semana passada.`,
        value: Math.abs(difference),
        comparison: lastWeekTotal,
        icon: '📈',
        color: 'red'
      })
    }
  }
  
  // 2. Maior vilão da semana (categoria que mais gastou)
  const categoryTotals = new Map<string, number>()
  weekTransactions.forEach(t => {
    categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + Math.abs(t.amount))
  })
  
  if (categoryTotals.size > 0) {
    const sortedCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
    
    const topCategory = sortedCategories[0]
    const topCategoryTotal = topCategory[1]
    const topCategoryPercentage = (topCategoryTotal / weekTotal) * 100
    
    if (topCategoryPercentage > 30) { // Se representa mais de 30% dos gastos
      insights.push({
        id: 'weekly-villain',
        type: 'villain',
        message: `O maior vilão da semana foi ${getCategoryLabel(topCategory[0] as any)}.`,
        value: topCategoryTotal,
        category: topCategory[0],
        icon: '🎯',
        color: 'red'
      })
    }
  }
  
  // 3. Pior dia da semana
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const dayTotals = new Map<number, number>()
  
  weekTransactions.forEach(t => {
    const day = getDay(t.date)
    dayTotals.set(day, (dayTotals.get(day) || 0) + Math.abs(t.amount))
  })
  
  if (dayTotals.size > 0) {
    const sortedDays = Array.from(dayTotals.entries())
      .sort((a, b) => b[1] - a[1])
    
    const worstDay = sortedDays[0]
    const worstDayName = dayNames[worstDay[0]]
    
    insights.push({
      id: 'weekly-worst-day',
      type: 'worst_day',
      message: `Seu pior dia foi ${worstDayName}.`,
      value: worstDay[1],
      day: worstDayName,
      icon: '📅',
      color: 'yellow'
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

