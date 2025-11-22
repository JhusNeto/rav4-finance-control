import { Transaction } from './classification'
import { startOfMonth, endOfMonth, getDate, getDay, startOfWeek, endOfWeek, isWithinInterval, differenceInDays } from 'date-fns'

export interface ScarcityPattern {
  type: 'EXPENSIVE_WEEK' | 'POST_SALARY_SPENDING' | 'PRE_MONTH_END' | 'MID_MONTH_SPIKE'
  weekNumber?: number
  dayRange?: { start: number; end: number }
  severity: 'low' | 'medium' | 'high'
  message: string
  evidence: string[]
  recommendation: string
  totalSpending: number
  averageDailySpending: number
}

/**
 * Auto-detector de Carência do Mês
 * Identifica padrões de gastos problemáticos:
 * - Semanas mais caras
 * - Padrões de gastos pós-salário
 * - Comportamento pré-fim de mês
 */
export function detectMonthlyScarcity(
  transactions: Transaction[]
): ScarcityPattern[] {
  const patterns: ScarcityPattern[] = []
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  
  // Filtra transações do mês atual
  const monthTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    isWithinInterval(t.date, { start: monthStart, end: monthEnd })
  )
  
  if (monthTransactions.length === 0) return patterns
  
  // 1. Detecta semanas mais caras
  const expensiveWeeks = detectExpensiveWeeks(monthTransactions, monthStart, monthEnd)
  patterns.push(...expensiveWeeks)
  
  // 2. Detecta padrão pós-salário (primeiros 5 dias do mês)
  const postSalaryPattern = detectPostSalarySpending(monthTransactions, monthStart)
  if (postSalaryPattern) patterns.push(postSalaryPattern)
  
  // 3. Detecta comportamento pré-fim de mês (últimos 5 dias)
  const preMonthEndPattern = detectPreMonthEndBehavior(monthTransactions, monthEnd)
  if (preMonthEndPattern) patterns.push(preMonthEndPattern)
  
  // 4. Detecta pico no meio do mês (dias 15-20)
  const midMonthSpike = detectMidMonthSpike(monthTransactions, monthStart)
  if (midMonthSpike) patterns.push(midMonthSpike)
  
  return patterns.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

/**
 * Detecta semanas mais caras comparando com a média
 */
function detectExpensiveWeeks(
  transactions: Transaction[],
  monthStart: Date,
  monthEnd: Date
): ScarcityPattern[] {
  const patterns: ScarcityPattern[] = []
  
  // Agrupa por semana
  const weeklySpending = new Map<number, { transactions: Transaction[]; total: number }>()
  
  let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  let weekNumber = 1
  
  while (currentWeekStart <= monthEnd) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const actualWeekEnd = weekEnd > monthEnd ? monthEnd : weekEnd
    
    const weekTransactions = transactions.filter(t =>
      isWithinInterval(t.date, { start: currentWeekStart, end: actualWeekEnd })
    )
    
    const total = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    if (weekTransactions.length > 0) {
      weeklySpending.set(weekNumber, { transactions: weekTransactions, total })
    }
    
    currentWeekStart = new Date(actualWeekEnd)
    currentWeekStart.setDate(currentWeekStart.getDate() + 1)
    weekNumber++
    
    if (currentWeekStart > monthEnd) break
  }
  
  if (weeklySpending.size < 2) return patterns
  
  // Calcula média semanal
  const weeklyTotals = Array.from(weeklySpending.values()).map(w => w.total)
  const averageWeekly = weeklyTotals.reduce((sum, val) => sum + val, 0) / weeklyTotals.length
  
  // Identifica semanas acima da média
  weeklySpending.forEach((week, weekNum) => {
    if (week.total > averageWeekly * 1.3) { // 30% acima da média
      const daysInWeek = week.transactions.length
      const avgDaily = week.total / daysInWeek
      
      const severity = week.total > averageWeekly * 1.5 ? 'high' : 'medium'
      
      patterns.push({
        type: 'EXPENSIVE_WEEK',
        weekNumber: weekNum,
        severity,
        message: `Semana ${weekNum} foi ${((week.total / averageWeekly - 1) * 100).toFixed(0)}% mais cara que a média`,
        evidence: [
          `Total da semana: ${formatCurrency(week.total)}`,
          `Média semanal: ${formatCurrency(averageWeekly)}`,
          `${week.transactions.length} transações`,
          `Média diária: ${formatCurrency(avgDaily)}`
        ],
        recommendation: 'Identifique os gastos desta semana e avalie se eram necessários. Considere redistribuir gastos ao longo do mês.',
        totalSpending: week.total,
        averageDailySpending: avgDaily
      })
    }
  })
  
  return patterns
}

/**
 * Detecta padrão de gastos pós-salário (primeiros 5 dias)
 */
function detectPostSalarySpending(
  transactions: Transaction[],
  monthStart: Date
): ScarcityPattern | null {
  const postSalaryDays = transactions.filter(t => {
    const dayOfMonth = getDate(t.date)
    return dayOfMonth <= 5
  })
  
  if (postSalaryDays.length === 0) return null
  
  const postSalaryTotal = postSalaryDays.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const avgDaily = postSalaryTotal / 5
  
  // Compara com resto do mês
  const restOfMonth = transactions.filter(t => {
    const dayOfMonth = getDate(t.date)
    return dayOfMonth > 5
  })
  
  if (restOfMonth.length === 0) return null
  
  const restTotal = restOfMonth.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const restDays = Math.max(1, differenceInDays(new Date(), monthStart) - 5)
  const restAvgDaily = restTotal / restDays
  
  // Se gastou muito mais nos primeiros dias
  if (avgDaily > restAvgDaily * 1.5) {
    return {
      type: 'POST_SALARY_SPENDING',
      dayRange: { start: 1, end: 5 },
      severity: avgDaily > restAvgDaily * 2 ? 'high' : 'medium',
      message: `Padrão de gastos pós-salário detectado: ${formatCurrency(avgDaily)}/dia nos primeiros 5 dias vs ${formatCurrency(restAvgDaily)}/dia no resto do mês`,
      evidence: [
        `Gastos nos primeiros 5 dias: ${formatCurrency(postSalaryTotal)}`,
        `Média diária pós-salário: ${formatCurrency(avgDaily)}`,
        `Média diária resto do mês: ${formatCurrency(restAvgDaily)}`,
        `${postSalaryDays.length} transações nos primeiros dias`
      ],
      recommendation: 'Gastos concentrados logo após o salário podem indicar falta de planejamento. Distribua melhor os gastos ao longo do mês.',
      totalSpending: postSalaryTotal,
      averageDailySpending: avgDaily
    }
  }
  
  return null
}

/**
 * Detecta comportamento pré-fim de mês (últimos 5 dias)
 */
function detectPreMonthEndBehavior(
  transactions: Transaction[],
  monthEnd: Date
): ScarcityPattern | null {
  const last5Days = transactions.filter(t => {
    const dayOfMonth = getDate(t.date)
    const daysInMonth = getDate(monthEnd)
    return dayOfMonth >= daysInMonth - 4
  })
  
  if (last5Days.length === 0) return null
  
  const last5DaysTotal = last5Days.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const avgDaily = last5DaysTotal / 5
  
  // Compara com resto do mês
  const restOfMonth = transactions.filter(t => {
    const dayOfMonth = getDate(t.date)
    const daysInMonth = getDate(monthEnd)
    return dayOfMonth < daysInMonth - 4
  })
  
  if (restOfMonth.length === 0) return null
  
  const restTotal = restOfMonth.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const restDays = Math.max(1, getDate(monthEnd) - 5)
  const restAvgDaily = restTotal / restDays
  
  // Se gastou muito mais nos últimos dias
  if (avgDaily > restAvgDaily * 1.5) {
    const daysInMonth = getDate(monthEnd)
    return {
      type: 'PRE_MONTH_END',
      dayRange: { start: daysInMonth - 4, end: daysInMonth },
      severity: avgDaily > restAvgDaily * 2 ? 'high' : 'medium',
      message: `Gastos aumentados nos últimos 5 dias do mês: ${formatCurrency(avgDaily)}/dia vs ${formatCurrency(restAvgDaily)}/dia no resto`,
      evidence: [
        `Gastos nos últimos 5 dias: ${formatCurrency(last5DaysTotal)}`,
        `Média diária pré-fim: ${formatCurrency(avgDaily)}`,
        `Média diária resto: ${formatCurrency(restAvgDaily)}`,
        `${last5Days.length} transações nos últimos dias`
      ],
      recommendation: 'Gastos no final do mês podem indicar desespero ou falta de planejamento. Planeje melhor para evitar surpresas.',
      totalSpending: last5DaysTotal,
      averageDailySpending: avgDaily
    }
  }
  
  return null
}

/**
 * Detecta pico no meio do mês (dias 15-20)
 */
function detectMidMonthSpike(
  transactions: Transaction[],
  monthStart: Date
): ScarcityPattern | null {
  const midMonthDays = transactions.filter(t => {
    const dayOfMonth = getDate(t.date)
    return dayOfMonth >= 15 && dayOfMonth <= 20
  })
  
  if (midMonthDays.length === 0) return null
  
  const midMonthTotal = midMonthDays.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const avgDaily = midMonthTotal / 6 // 6 dias (15-20)
  
  // Compara com resto do mês
  const restOfMonth = transactions.filter(t => {
    const dayOfMonth = getDate(t.date)
    return dayOfMonth < 15 || dayOfMonth > 20
  })
  
  if (restOfMonth.length === 0) return null
  
  const restTotal = restOfMonth.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const restDays = Math.max(1, transactions.length - 6)
  const restAvgDaily = restTotal / restDays
  
  // Se há um pico significativo no meio do mês
  if (avgDaily > restAvgDaily * 1.4) {
    return {
      type: 'MID_MONTH_SPIKE',
      dayRange: { start: 15, end: 20 },
      severity: avgDaily > restAvgDaily * 1.7 ? 'high' : 'medium',
      message: `Pico de gastos detectado no meio do mês (dias 15-20): ${formatCurrency(avgDaily)}/dia`,
      evidence: [
        `Gastos nos dias 15-20: ${formatCurrency(midMonthTotal)}`,
        `Média diária no meio: ${formatCurrency(avgDaily)}`,
        `Média diária resto: ${formatCurrency(restAvgDaily)}`,
        `${midMonthDays.length} transações no período`
      ],
      recommendation: 'Pico no meio do mês pode indicar pagamentos recorrentes ou gastos não planejados. Revise e planeje melhor.',
      totalSpending: midMonthTotal,
      averageDailySpending: avgDaily
    }
  }
  
  return null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

