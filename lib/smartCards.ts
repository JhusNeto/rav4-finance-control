import { Transaction } from './classification'
import { startOfMonth, endOfMonth, isSameDay, isToday, getDate } from 'date-fns'
import { formatCurrency } from './utils'

export interface SmartCard {
  id: string
  type: 'biggest_expense' | 'today_spending' | 'congratulations' | 'warning' | 'trend'
  title: string
  message: string
  value: number
  icon: string
  color: 'green' | 'yellow' | 'red' | 'blue'
  priority: number
}

/**
 * Gera cartões inteligentes com mensagens contextuais
 */
export function generateSmartCards(
  transactions: Transaction[],
  monthlyGoal: number
): SmartCard[] {
  const cards: SmartCard[] = []
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  
  const monthTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    t.date >= monthStart &&
    t.date <= monthEnd
  )
  
  // 1. Maior gasto do mês
  const biggestExpense = monthTransactions.reduce((max, t) => {
    return Math.abs(t.amount) > Math.abs(max.amount) ? t : max
  }, monthTransactions[0])
  
  if (biggestExpense) {
    cards.push({
      id: 'biggest-expense',
      type: 'biggest_expense',
      title: 'Maior Gasto do Mês',
      message: `Sua maior transação foi ${formatCurrency(Math.abs(biggestExpense.amount))}`,
      value: Math.abs(biggestExpense.amount),
      icon: '💰',
      color: 'red',
      priority: 3
    })
  }
  
  // 2. Gastos de hoje
  const todayTransactions = transactions.filter(t =>
    t.type === 'SAIDA' &&
    isSameDay(t.date, today)
  )
  
  const todayTotal = todayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  if (todayTotal > 0) {
    const dailyAverage = monthTransactions.length > 0
      ? monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / getDate(today)
      : 0
    
    if (todayTotal > dailyAverage * 1.5) {
      cards.push({
        id: 'today-warning',
        type: 'warning',
        title: 'Atenção: Hoje',
        message: `Você gastou ${formatCurrency(todayTotal)} hoje, acima da média diária de ${formatCurrency(dailyAverage)}`,
        value: todayTotal,
        icon: '⚠️',
        color: 'yellow',
        priority: 5
      })
    } else {
      cards.push({
        id: 'today-spending',
        type: 'today_spending',
        title: 'Gastos de Hoje',
        message: `Hoje você gastou ${formatCurrency(todayTotal)}`,
        value: todayTotal,
        icon: '📅',
        color: 'blue',
        priority: 4
      })
    }
  } else {
    // 3. Parabéns por não gastar
    cards.push({
      id: 'congratulations',
      type: 'congratulations',
      title: 'Parabéns!',
      message: 'Você não gastou nada hoje. Continue assim!',
      value: 0,
      icon: '🎉',
      color: 'green',
      priority: 2
    })
  }
  
  // 4. Tendência do mês
  const monthTotal = monthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const daysElapsed = getDate(today)
  const projectedTotal = (monthTotal / daysElapsed) * 30
  
  if (monthlyGoal > 0) {
    if (projectedTotal > monthlyGoal * 1.2) {
      cards.push({
        id: 'trend-warning',
        type: 'warning',
        title: 'Tendência Perigosa',
        message: `Se continuar assim, você vai gastar ${formatCurrency(projectedTotal)} este mês (${formatCurrency(monthlyGoal)} de meta)`,
        value: projectedTotal,
        icon: '📈',
        color: 'red',
        priority: 6
      })
    } else if (projectedTotal <= monthlyGoal * 0.9) {
      cards.push({
        id: 'trend-good',
        type: 'trend',
        title: 'Tendência Positiva',
        message: `Projeção: ${formatCurrency(projectedTotal)} este mês. Você está dentro da meta!`,
        value: projectedTotal,
        icon: '✅',
        color: 'green',
        priority: 1
      })
    }
  }
  
  // Ordena por prioridade (maior primeiro)
  return cards.sort((a, b) => b.priority - a.priority)
}

