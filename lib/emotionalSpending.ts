import { Transaction } from './classification'
import { getHours, getDay, differenceInHours, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

export interface EmotionalSpendingAlert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  evidence: string[]
  transactions: Transaction[]
  detectedAt: Date
  recommendation: string
}

/**
 * Detector avançado de gastos emocionais
 * Algoritmo baseado em múltiplos fatores:
 * - Horário (após 20h = perigo)
 * - Tipo de gasto
 * - Descrição (lanche, comida rápida, etc.)
 * - Frequência na semana
 * - Padrão comparado ao histórico
 */
export function detectEmotionalSpending(transactions: Transaction[]): EmotionalSpendingAlert[] {
  const alerts: EmotionalSpendingAlert[] = []
  
  if (transactions.length < 5) return alerts
  
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  
  // Filtra transações da semana atual
  const weekTransactions = transactions.filter(t => 
    isWithinInterval(t.date, { start: weekStart, end: weekEnd }) &&
    t.type === 'SAIDA'
  )
  
  if (weekTransactions.length === 0) return alerts
  
  // 1. Detecção de PIX impulsivos noturnos
  const nightPixAlerts = detectNightImpulsivePix(weekTransactions, transactions)
  alerts.push(...nightPixAlerts)
  
  // 2. Detecção de compras emocionais por horário
  const emotionalTimeAlerts = detectEmotionalTimeSpending(weekTransactions, transactions)
  alerts.push(...emotionalTimeAlerts)
  
  // 3. Detecção de padrão de comida rápida/lanche
  const fastFoodAlerts = detectFastFoodPattern(weekTransactions, transactions)
  alerts.push(...fastFoodAlerts)
  
  // 4. Detecção de frequência anormal na semana
  const frequencyAlerts = detectAbnormalFrequency(weekTransactions, transactions)
  alerts.push(...frequencyAlerts)
  
  // 5. Detecção de gastos comparados ao histórico
  const historicalAlerts = detectHistoricalDeviation(weekTransactions, transactions)
  alerts.push(...historicalAlerts)
  
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

/**
 * Detecta PIX impulsivos feitos à noite (após 20h)
 */
function detectNightImpulsivePix(
  weekTransactions: Transaction[],
  allTransactions: Transaction[]
): EmotionalSpendingAlert[] {
  const alerts: EmotionalSpendingAlert[] = []
  
  const nightPix = weekTransactions.filter(t => {
    const hour = getHours(t.date)
    return t.category === 'PIX_SAIDA' && (hour >= 20 || hour < 6)
  })
  
  if (nightPix.length < 2) return alerts
  
  // Agrupa por período de horas
  const pixByPeriod = new Map<string, Transaction[]>()
  nightPix.forEach(t => {
    const hour = getHours(t.date)
    const period = hour >= 20 ? 'night' : 'dawn'
    if (!pixByPeriod.has(period)) {
      pixByPeriod.set(period, [])
    }
    pixByPeriod.get(period)!.push(t)
  })
  
  // Detecta múltiplos PIX em curto período
  const sortedPix = nightPix.sort((a, b) => a.date.getTime() - b.date.getTime())
  
  for (let i = 0; i < sortedPix.length - 1; i++) {
    const current = sortedPix[i]
    const next = sortedPix[i + 1]
    const hoursDiff = differenceInHours(next.date, current.date)
    
    if (hoursDiff <= 4) {
      // Múltiplos PIX em menos de 4 horas
      const group = sortedPix.filter(t => {
        const diff = differenceInHours(t.date, current.date)
        return diff >= 0 && diff <= 4
      })
      
      if (group.length >= 2) {
        const severity = group.length >= 3 ? 'critical' : group.length === 2 ? 'high' : 'medium'
        
        alerts.push({
          id: `night-pix-${current.id}`,
          severity,
          message: `Você está gastando emocionalmente. Este é o ${group.length}° PIX impulsivo em ${hoursDiff} horas.`,
          evidence: [
            `${group.length} PIX noturnos em ${hoursDiff} horas`,
            `Total gasto: ${formatCurrency(group.reduce((sum, t) => sum + Math.abs(t.amount), 0))}`,
            `Horário: ${getHours(current.date)}h às ${getHours(group[group.length - 1].date)}h`,
            `Padrão: PIX após 20h indica compras por impulso`
          ],
          transactions: group,
          detectedAt: new Date(),
          recommendation: 'PIX noturnos geralmente são impulsivos. Considere estabelecer um horário limite (ex: 20h) para transações não essenciais.'
        })
        
        // Evita duplicatas
        break
      }
    }
  }
  
  return alerts
}

/**
 * Detecta gastos emocionais por horário (fins de semana, noites)
 */
function detectEmotionalTimeSpending(
  weekTransactions: Transaction[],
  allTransactions: Transaction[]
): EmotionalSpendingAlert[] {
  const alerts: EmotionalSpendingAlert[] = []
  
  // Gastos após 20h
  const nightSpending = weekTransactions.filter(t => {
    const hour = getHours(t.date)
    return hour >= 20 && (
      t.category === 'ALIMENTACAO_FORA' ||
      t.category === 'COMPRAS_GERAIS' ||
      t.category === 'PIX_SAIDA'
    )
  })
  
  // Gastos em fins de semana
  const weekendSpending = weekTransactions.filter(t => {
    const day = getDay(t.date)
    return (day === 0 || day === 6) && (
      t.category === 'ALIMENTACAO_FORA' ||
      t.category === 'COMPRAS_GERAIS'
    )
  })
  
  if (nightSpending.length >= 5 || weekendSpending.length >= 5) {
    const totalNight = nightSpending.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalWeekend = weekendSpending.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    if (nightSpending.length >= 5) {
      alerts.push({
        id: 'emotional-night',
        severity: nightSpending.length >= 8 ? 'high' : 'medium',
        message: `${nightSpending.length} gastos após 20h esta semana. Padrão de gastos emocionais noturnos detectado.`,
        evidence: [
          `${nightSpending.length} transações após 20h`,
          `Total: ${formatCurrency(totalNight)}`,
          `Média por transação: ${formatCurrency(totalNight / nightSpending.length)}`
        ],
        transactions: nightSpending,
        detectedAt: new Date(),
        recommendation: 'Gastos noturnos frequentemente são emocionais. Estabeleça um horário limite e evite compras após esse horário.'
      })
    }
    
    if (weekendSpending.length >= 5) {
      alerts.push({
        id: 'emotional-weekend',
        severity: weekendSpending.length >= 8 ? 'high' : 'medium',
        message: `${weekendSpending.length} gastos em fins de semana. Possível padrão de gastos emocionais.`,
        evidence: [
          `${weekendSpending.length} transações em fins de semana`,
          `Total: ${formatCurrency(totalWeekend)}`,
          `Média por transação: ${formatCurrency(totalWeekend / weekendSpending.length)}`
        ],
        transactions: weekendSpending,
        detectedAt: new Date(),
        recommendation: 'Fins de semana podem levar a gastos por tédio ou compensação. Planeje atividades gratuitas e estabeleça limites.'
      })
    }
  }
  
  return alerts
}

/**
 * Detecta padrão de comida rápida/lanche (indicador de gasto emocional)
 */
function detectFastFoodPattern(
  weekTransactions: Transaction[],
  allTransactions: Transaction[]
): EmotionalSpendingAlert[] {
  const alerts: EmotionalSpendingAlert[] = []
  
  const fastFoodKeywords = [
    'lanche', 'burger', 'pizza', 'ifood', 'rappi', 'uber eats',
    'mcdonalds', 'bk', 'burger king', 'habibs', 'bobs',
    'comida rapida', 'fast food', 'delivery'
  ]
  
  const fastFoodTransactions = weekTransactions.filter(t => {
    const desc = t.description.toLowerCase()
    return fastFoodKeywords.some(keyword => desc.includes(keyword)) ||
           t.category === 'ALIMENTACAO_FORA'
  })
  
  if (fastFoodTransactions.length >= 4) {
    const total = fastFoodTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const avg = total / fastFoodTransactions.length
    
    // Compara com histórico (últimas 4 semanas)
    const today = new Date()
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    
    const historicalFastFood = allTransactions.filter(t => 
      t.date >= fourWeeksAgo &&
      t.date < weekStart &&
      fastFoodKeywords.some(keyword => t.description.toLowerCase().includes(keyword))
    )
    
    const historicalAvg = historicalFastFood.length > 0
      ? historicalFastFood.reduce((sum, t) => sum + Math.abs(t.amount), 0) / historicalFastFood.length
      : 0
    
    const isAboveAverage = historicalAvg > 0 && avg > historicalAvg * 1.3
    
    if (isAboveAverage || fastFoodTransactions.length >= 6) {
      alerts.push({
        id: 'fast-food-pattern',
        severity: fastFoodTransactions.length >= 8 ? 'high' : 'medium',
        message: `${fastFoodTransactions.length} pedidos de comida rápida/delivery esta semana. Padrão de gasto emocional detectado.`,
        evidence: [
          `${fastFoodTransactions.length} transações de comida rápida/delivery`,
          `Total: ${formatCurrency(total)}`,
          `Média: ${formatCurrency(avg)}`,
          isAboveAverage ? `Acima da média histórica (${formatCurrency(historicalAvg)})` : 'Frequência muito alta'
        ],
        transactions: fastFoodTransactions,
        detectedAt: new Date(),
        recommendation: 'Comida rápida frequente pode indicar gastos emocionais. Considere preparar refeições com antecedência e estabelecer limite semanal.'
      })
    }
  }
  
  return alerts
}

/**
 * Detecta frequência anormal de gastos na semana
 */
function detectAbnormalFrequency(
  weekTransactions: Transaction[],
  allTransactions: Transaction[]
): EmotionalSpendingAlert[] {
  const alerts: EmotionalSpendingAlert[] = []
  
  // Agrupa por dia
  const byDay = new Map<number, Transaction[]>()
  weekTransactions.forEach(t => {
    const day = getDay(t.date)
    if (!byDay.has(day)) {
      byDay.set(day, [])
    }
    byDay.get(day)!.push(t)
  })
  
  // Encontra dias com muitos gastos
  const highFrequencyDays = Array.from(byDay.entries())
    .filter(([_, txs]) => txs.length >= 5)
    .sort((a, b) => b[1].length - a[1].length)
  
  if (highFrequencyDays.length > 0) {
    const [day, transactions] = highFrequencyDays[0]
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    alerts.push({
      id: `frequency-${day}`,
      severity: transactions.length >= 8 ? 'high' : 'medium',
      message: `${transactions.length} transações em ${dayNames[day]}. Frequência anormal de gastos detectada.`,
      evidence: [
        `${transactions.length} transações em um único dia`,
        `Total: ${formatCurrency(total)}`,
        `Dia: ${dayNames[day]}`
      ],
      transactions,
      detectedAt: new Date(),
      recommendation: 'Múltiplas transações em um dia podem indicar gastos impulsivos. Revise cada transação e identifique padrões.'
    })
  }
  
  return alerts
}

/**
 * Detecta desvio do padrão histórico
 */
function detectHistoricalDeviation(
  weekTransactions: Transaction[],
  allTransactions: Transaction[]
): EmotionalSpendingAlert[] {
  const alerts: EmotionalSpendingAlert[] = []
  
  // Calcula média semanal dos últimos 2 meses
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
  
  const historicalTransactions = allTransactions.filter(t => 
    t.date >= twoMonthsAgo &&
    t.date < weekStart &&
    t.type === 'SAIDA'
  )
  
  if (historicalTransactions.length < 20) return alerts // Precisa de histórico suficiente
  
  // Calcula média semanal histórica
  const daysDiff = Math.abs((weekStart.getTime() - twoMonthsAgo.getTime()) / (1000 * 60 * 60 * 24))
  const weeksCount = Math.max(1, Math.ceil(daysDiff / 7))
  const avgWeeklySpending = historicalTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / weeksCount
  
  // Gasto da semana atual
  const currentWeekSpending = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  // Detecta se está muito acima da média
  if (currentWeekSpending > avgWeeklySpending * 1.5) {
    const deviation = ((currentWeekSpending / avgWeeklySpending - 1) * 100).toFixed(0)
    
    alerts.push({
      id: 'historical-deviation',
      severity: currentWeekSpending > avgWeeklySpending * 2 ? 'high' : 'medium',
      message: `Gastos ${deviation}% acima da média histórica esta semana. Padrão anormal detectado.`,
      evidence: [
        `Gasto da semana: ${formatCurrency(currentWeekSpending)}`,
        `Média histórica: ${formatCurrency(avgWeeklySpending)}`,
        `Desvio: +${deviation}%`,
        `Transações: ${weekTransactions.length}`
      ],
      transactions: weekTransactions,
      detectedAt: new Date(),
      recommendation: 'Gastos muito acima da média podem indicar perda de controle. Revise suas transações e identifique gastos não essenciais.'
    })
  }
  
  return alerts
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

