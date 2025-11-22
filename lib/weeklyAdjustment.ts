import { Transaction } from './classification'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, differenceInDays, isWithinInterval } from 'date-fns'

export interface WeeklyAdjustment {
  weekNumber: number
  weekStart: Date
  weekEnd: Date
  actualSpending: number
  projectedSpending: number
  adjustment: number
  newDailyLimit: number
  message: string
  recommendation: string
}

/**
 * Sistema de Auto-ajuste Semanal
 * Recalibra automaticamente o resto do mês se você gastar mais do que o esperado
 */
export function calculateWeeklyAdjustment(
  transactions: Transaction[],
  monthlyGoal: number
): WeeklyAdjustment[] {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const totalDaysInMonth = differenceInDays(monthEnd, monthStart) + 1
  const daysElapsed = differenceInDays(today, monthStart) + 1
  
  // Ideal: gasto uniforme ao longo do mês
  const idealDailySpending = monthlyGoal / totalDaysInMonth
  const idealWeeklySpending = idealDailySpending * 7
  
  // Calcula gastos por semana
  const weekAdjustments: WeeklyAdjustment[] = []
  let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  let weekNumber = 1
  
  while (currentWeekStart <= today && currentWeekStart <= monthEnd) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const actualWeekEnd = weekEnd > monthEnd ? monthEnd : weekEnd
    
    // Transações desta semana
    const weekTransactions = transactions.filter(t =>
      isWithinInterval(t.date, { start: currentWeekStart, end: actualWeekEnd }) &&
      t.type === 'SAIDA'
    )
    
    const actualSpending = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    // Projeção baseada no ideal
    const daysInWeek = differenceInDays(actualWeekEnd, currentWeekStart) + 1
    const projectedSpending = idealDailySpending * daysInWeek
    
    // Ajuste necessário
    const adjustment = actualSpending - projectedSpending
    
    // Calcula novo limite diário para o resto do mês
    const remainingDays = differenceInDays(monthEnd, today) + 1
    const remainingBudget = monthlyGoal - (transactions.filter(t =>
      t.date >= monthStart &&
      t.date <= today &&
      t.type === 'SAIDA'
    ).reduce((sum, t) => sum + Math.abs(t.amount), 0))
    
    const newDailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0
    
    // Mensagem e recomendação
    let message = ''
    let recommendation = ''
    
    if (adjustment > 0) {
      // Gastou mais do que o esperado
      message = `Semana ${weekNumber}: Gastou ${formatCurrency(actualSpending)} (${formatCurrency(adjustment)} acima do esperado)`
      recommendation = `Ajuste automático: Limite diário reduzido para ${formatCurrency(newDailyLimit)} para compensar o excesso.`
    } else if (adjustment < -idealDailySpending * 2) {
      // Gastou muito menos (pode ter margem)
      message = `Semana ${weekNumber}: Gastou ${formatCurrency(actualSpending)} (${formatCurrency(Math.abs(adjustment))} abaixo do esperado)`
      recommendation = `Você está abaixo do ritmo. Pode aumentar ligeiramente os gastos, mas mantenha o controle.`
    } else {
      // Dentro do esperado
      message = `Semana ${weekNumber}: Gastou ${formatCurrency(actualSpending)} (dentro do esperado)`
      recommendation = `Continue mantendo este ritmo. Limite diário sugerido: ${formatCurrency(newDailyLimit)}`
    }
    
    weekAdjustments.push({
      weekNumber,
      weekStart: currentWeekStart,
      weekEnd: actualWeekEnd,
      actualSpending,
      projectedSpending,
      adjustment,
      newDailyLimit,
      message,
      recommendation
    })
    
    // Próxima semana
    currentWeekStart = new Date(actualWeekEnd)
    currentWeekStart.setDate(currentWeekStart.getDate() + 1)
    weekNumber++
    
    // Para se já passou do mês atual
    if (currentWeekStart > monthEnd) break
  }
  
  return weekAdjustments
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

