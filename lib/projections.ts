import { Transaction, Category } from './classification'
import { differenceInDays, endOfMonth, startOfMonth, isSameDay, addDays } from 'date-fns'

export interface ForecastResult {
  projectedBalance: number
  willGoNegative: boolean
  negativeDate: Date | null // Data em que o saldo ficará negativo (se aplicável)
  negativeAmount: number // Valor negativo projetado no fim do mês
  daysUntilNegative: number | null // Dias até ficar negativo
  daysRemaining: number // Dias restantes até o fim do mês
  projectionDate: Date // Data da projeção (fim do mês)
}

export interface MonthlyMetrics {
  currentBalance: number
  projectedBalance: number
  totalIncome: number
  totalExpenses: number
  burnRate: number
  weeklyBurnRate: number // Burn rate ajustado semanal
  bleedingRate: number // Taxa de sangramento (perda diária não percebida)
  daysRemaining: number
  daysElapsed: number
  forecast: ForecastResult // Previsão detalhada de rombo
}

export interface CategoryMetrics {
  category: Category
  total: number
  monthlyGoal: number
  percentageOfSalary: number
  status: 'ok' | 'risk' | 'critical'
}

export interface Alert {
  id: string
  type: 'PIX_DAILY' | 'FOOD_WEEKLY' | 'UNKNOWN_SUBSCRIPTION' | 'NEGATIVE_PROJECTION' | 'UNUSUAL_EXPENSE'
  message: string
  date: Date
  category?: Category
  severity: 'low' | 'medium' | 'high'
}

export function calculateMonthlyMetrics(
  transactions: Transaction[],
  initialBalance: number
): MonthlyMetrics {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  
  // CORREÇÃO: Calcula o saldo sequencialmente a partir do saldo anterior do CSV mais antigo
  // O initialBalance já é o saldo anterior do CSV mais antigo (garantido pelo CSVUpload)
  // Então calculamos tudo sequencialmente desde a primeira transação até o início do mês atual
  
  // Ordena todas as transações por data
  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  
  // Calcula saldo sequencialmente desde a primeira transação até o início do mês atual
  let runningBalance = initialBalance
  const historicalTransactions = sortedTransactions.filter(t => t.date < monthStart)
  
  historicalTransactions.forEach(t => {
    if (t.type === 'ENTRADA') {
      runningBalance += t.amount
    } else {
      runningBalance -= Math.abs(t.amount)
    }
  })
  
  // O saldo ajustado é o resultado do cálculo sequencial até o início do mês atual
  const adjustedInitialBalance = runningBalance
  
  // Transações do mês atual
  const monthTransactions = transactions.filter(t => 
    t.date >= monthStart && t.date <= today
  )

  const totalIncome = monthTransactions
    .filter(t => t.type === 'ENTRADA')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = monthTransactions
    .filter(t => t.type === 'SAIDA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // Saldo atual = saldo inicial ajustado + entradas do mês - saídas do mês
  const currentBalance = adjustedInitialBalance + totalIncome - totalExpenses

  // Burn rate: média diária de gastos do mês atual
  const daysElapsed = differenceInDays(today, monthStart) + 1
  const burnRate = daysElapsed > 0 ? totalExpenses / daysElapsed : 0

  // Burn rate ajustado semanal: média dos últimos 7 dias ou média semanal do mês
  const weekStart = addDays(today, -6) // Últimos 7 dias
  const weekStartDate = weekStart < monthStart ? monthStart : weekStart
  const weekTransactions = monthTransactions.filter(t => t.date >= weekStartDate)
  const weekExpenses = weekTransactions
    .filter(t => t.type === 'SAIDA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const weekDays = differenceInDays(today, weekStartDate) + 1
  const weeklyBurnRate = weekDays > 0 ? weekExpenses / weekDays : burnRate

  // Taxa de sangramento: diferença entre burn rate atual e burn rate ideal
  // Calcula quanto você está perdendo por dia além do esperado
  // Burn rate ideal seria: (salário - gastos fixos esperados) / 30
  // Como não temos gastos fixos separados, usamos a diferença entre burn rate atual e médio histórico
  // Se não há histórico suficiente, usa a diferença entre burn rate e média mensal esperada
  const expectedDailyExpense = totalIncome > 0 ? (totalIncome / 30) : 0 // Assume que gastos devem ser ~salário/30
  const bleedingRate = burnRate - expectedDailyExpense // Quanto está gastando além do esperado por dia

  // Projeção: usa burn rate semanal (mais preciso) se disponível, senão usa mensal
  const projectionBurnRate = weeklyBurnRate > 0 ? weeklyBurnRate : burnRate
  
  const daysRemaining = differenceInDays(monthEnd, today)
  const totalDays = differenceInDays(monthEnd, monthStart) + 1
  
  // Calcula projeção dia a dia até o fim do mês
  const forecast = calculateForecast(
    currentBalance,
    projectionBurnRate,
    today,
    monthEnd,
    totalIncome,
    daysElapsed,
    totalDays
  )

  return {
    currentBalance,
    projectedBalance: forecast.projectedBalance,
    totalIncome,
    totalExpenses,
    burnRate,
    weeklyBurnRate,
    bleedingRate,
    daysRemaining,
    daysElapsed,
    forecast,
  }
}

/**
 * Calcula previsão detalhada de rombo financeiro
 * Projeta dia a dia até o fim do mês baseado no ritmo atual
 */
function calculateForecast(
  currentBalance: number,
  dailyBurnRate: number,
  today: Date,
  monthEnd: Date,
  totalIncome: number,
  daysElapsed: number,
  totalDaysInMonth: number
): ForecastResult {
  const projectionDate = monthEnd
  
  // Calcula gastos projetados para os dias restantes
  const daysRemaining = differenceInDays(monthEnd, today)
  const projectedExpensesRemaining = dailyBurnRate * daysRemaining
  
  // Saldo projetado no fim do mês
  const projectedBalance = currentBalance - projectedExpensesRemaining
  
  // Verifica se vai ficar negativo
  const willGoNegative = projectedBalance < 0
  const negativeAmount = willGoNegative ? Math.abs(projectedBalance) : 0
  
  // Calcula quando vai ficar negativo (se aplicável)
  let negativeDate: Date | null = null
  let daysUntilNegative: number | null = null
  
  if (willGoNegative && currentBalance > 0) {
    // Calcula quantos dias até o saldo ficar negativo
    const daysToNegative = Math.ceil(currentBalance / dailyBurnRate)
    negativeDate = addDays(today, daysToNegative)
    
    // Se a data calculada está dentro do mês atual
    if (negativeDate <= monthEnd) {
      daysUntilNegative = daysToNegative
    } else {
      // Se vai ficar negativo só no fim do mês
      negativeDate = monthEnd
      daysUntilNegative = daysRemaining
    }
  } else if (willGoNegative && currentBalance <= 0) {
    // Já está negativo ou vai ficar hoje
    negativeDate = today
    daysUntilNegative = 0
  }
  
  return {
    projectedBalance,
    willGoNegative,
    negativeDate,
    negativeAmount,
    daysUntilNegative,
    daysRemaining,
    projectionDate,
  }
}

export function calculateCategoryMetrics(
  transactions: Transaction[],
  category: Category,
  monthlyGoal: number,
  salary: number
): CategoryMetrics {
  const today = new Date()
  const monthStart = startOfMonth(today)

  // Apenas transações do mês atual
  const categoryTransactions = transactions.filter(t => 
    t.category === category &&
    t.date >= monthStart &&
    t.date <= today &&
    t.type === 'SAIDA'
  )

  const total = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const percentageOfSalary = salary > 0 ? (total / salary) * 100 : 0

  let status: 'ok' | 'risk' | 'critical' = 'ok'
  if (total >= monthlyGoal) {
    status = 'critical'
  } else if (total >= monthlyGoal * 0.8) {
    status = 'risk'
  }

  return {
    category,
    total,
    monthlyGoal,
    percentageOfSalary,
    status,
  }
}

export function generateAlerts(
  transactions: Transaction[],
  metrics: MonthlyMetrics,
  categoryMetrics: Record<Category, CategoryMetrics>,
  goals: Record<Category, number>
): Alert[] {
  const alerts: Alert[] = []
  const today = new Date()
  const monthStart = startOfMonth(today)

  // Alertas de PIX diário (apenas mês atual)
  const pixTransactions = transactions.filter(t => 
    t.category === 'PIX_SAIDA' &&
    t.date >= monthStart &&
    t.date <= today
  )

  const pixByDay = new Map<string, number>()
  pixTransactions.forEach(t => {
    const dayKey = t.date.toISOString().split('T')[0]
    pixByDay.set(dayKey, (pixByDay.get(dayKey) || 0) + Math.abs(t.amount))
  })

  const pixDailyGoal = (goals.PIX_SAIDA || 0) / 30
  pixByDay.forEach((amount, day) => {
    if (amount > pixDailyGoal) {
      alerts.push({
        id: `pix-${day}`,
        type: 'PIX_DAILY',
        message: `PIX diário acima da meta: ${amount.toFixed(2)} (meta: ${pixDailyGoal.toFixed(2)})`,
        date: new Date(day),
        category: 'PIX_SAIDA',
        severity: amount > pixDailyGoal * 1.5 ? 'high' : 'medium',
      })
    }
  })

  // Alerta de projeção negativa
  if (metrics.projectedBalance < 0) {
    alerts.push({
      id: 'negative-projection',
      type: 'NEGATIVE_PROJECTION',
      message: `Projeção de fim de mês negativa: ${metrics.projectedBalance.toFixed(2)}`,
      date: today,
      severity: 'high',
    })
  }

  // Alertas de categoria crítica
  Object.values(categoryMetrics).forEach(cm => {
    if (cm.status === 'critical') {
      alerts.push({
        id: `category-${cm.category}`,
        type: 'UNUSUAL_EXPENSE',
        message: `${cm.category} ultrapassou a meta mensal`,
        date: today,
        category: cm.category,
        severity: 'high',
      })
    }
  })

  return alerts
}

export function getBalanceOverTime(
  transactions: Transaction[],
  initialBalance: number
): Array<{ date: Date; balance: number }> {
  const today = new Date()
  const monthStart = startOfMonth(today)
  
  // CORREÇÃO: Calcula saldo sequencialmente a partir do saldo anterior do CSV mais antigo
  // Ordena todas as transações por data
  const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  
  // Calcula saldo sequencialmente desde a primeira transação até o início do mês atual
  let runningBalance = initialBalance
  const historicalTransactions = sortedTransactions.filter(t => t.date < monthStart)
  
  historicalTransactions.forEach(t => {
    if (t.type === 'ENTRADA') {
      runningBalance += t.amount
    } else {
      runningBalance -= Math.abs(t.amount)
    }
  })
  
  // runningBalance agora contém o saldo no início do mês atual (calculado sequencialmente)
  
  // Transações do mês atual ordenadas
  const monthTransactions = transactions.filter(t => 
    t.date >= monthStart && t.date <= today
  ).sort((a, b) => a.date.getTime() - b.date.getTime())

  const balanceOverTime: Array<{ date: Date; balance: number }> = []

  // Criar entrada para cada dia do mês até hoje
  let currentDay = monthStart
  while (currentDay <= today) {
    const dayTransactions = monthTransactions.filter(t => 
      isSameDay(t.date, currentDay)
    )

    dayTransactions.forEach(t => {
      if (t.type === 'ENTRADA') {
        runningBalance += t.amount
      } else {
        runningBalance -= Math.abs(t.amount)
      }
    })

    balanceOverTime.push({
      date: new Date(currentDay),
      balance: runningBalance,
    })

    currentDay = addDays(currentDay, 1)
  }

  return balanceOverTime
}

