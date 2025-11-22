import { Transaction } from './classification'
import { getHours, getDay, getDate, differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

export interface HiddenPattern {
  id: string
  type: 'NIGHT_PIX' | 'EMOTIONAL_AFTER_STRESS' | 'PRESSURE_WEEK' | 'TIRED_DELIVERY' | 'MID_MONTH_SPENDING'
  severity: 'low' | 'medium' | 'high'
  message: string
  evidence: string[]
  recommendation: string
  detectedAt: Date
}

/**
 * Engine de detecção de padrões ocultos e comportamentos perigosos
 */
export function detectHiddenPatterns(transactions: Transaction[]): HiddenPattern[] {
  const patterns: HiddenPattern[] = []
  
  // 1. Aumento de PIX noturno
  const nightPixPattern = detectNightPixPattern(transactions)
  if (nightPixPattern) patterns.push(nightPixPattern)
  
  // 2. Compras emocionais após estresse (identificado por padrão de gastos)
  const emotionalPattern = detectEmotionalAfterStress(transactions)
  if (emotionalPattern) patterns.push(emotionalPattern)
  
  // 3. Gastos aumentados em semana de pressão
  const pressureWeekPattern = detectPressureWeekPattern(transactions)
  if (pressureWeekPattern) patterns.push(pressureWeekPattern)
  
  // 4. Tendência de pedir mais delivery quando cansado (fins de semana/finais de tarde)
  const tiredDeliveryPattern = detectTiredDeliveryPattern(transactions)
  if (tiredDeliveryPattern) patterns.push(tiredDeliveryPattern)
  
  // 5. Gastos maiores perto do dia 20 do mês
  const midMonthSpendingPattern = detectMidMonthSpendingPattern(transactions)
  if (midMonthSpendingPattern) patterns.push(midMonthSpendingPattern)
  
  return patterns
}

/**
 * Detecta aumento de PIX noturno (após 22h)
 */
function detectNightPixPattern(transactions: Transaction[]): HiddenPattern | null {
  const pixTransactions = transactions.filter(t => 
    t.category === 'PIX_SAIDA' && 
    t.type === 'SAIDA'
  )
  
  if (pixTransactions.length < 5) return null
  
  // Agrupa por período do dia (manhã: 6-12, tarde: 12-18, noite: 18-22, madrugada: 22-6)
  const nightPix = pixTransactions.filter(t => {
    const hour = getHours(t.date)
    return hour >= 22 || hour < 6
  })
  
  const nightPixPercentage = (nightPix.length / pixTransactions.length) * 100
  const nightPixTotal = nightPix.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalPix = pixTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const nightPixAmountPercentage = (nightPixTotal / totalPix) * 100
  
  if (nightPixPercentage > 30 || nightPixAmountPercentage > 40) {
    return {
      id: 'night-pix',
      type: 'NIGHT_PIX',
      severity: nightPixPercentage > 50 ? 'high' : 'medium',
      message: `Você está fazendo ${nightPixPercentage.toFixed(0)}% dos seus PIX à noite/madrugada (${nightPix.length} transações).`,
      evidence: [
        `${nightPix.length} PIX noturnos de ${pixTransactions.length} totais`,
        `${formatCurrency(nightPixTotal)} em PIX noturnos (${nightPixAmountPercentage.toFixed(0)}% do total)`
      ],
      recommendation: 'PIX noturnos podem indicar compras por impulso. Considere estabelecer um horário limite para transações.',
      detectedAt: new Date()
    }
  }
  
  return null
}

/**
 * Detecta compras emocionais após estresse (identificado por padrão de gastos altos seguidos de mais gastos)
 */
function detectEmotionalAfterStress(transactions: Transaction[]): HiddenPattern | null {
  const emotionalPurchases = transactions.filter(t => 
    t.type === 'SAIDA' && 
    Math.abs(t.amount) > 200 &&
    (t.category === 'COMPRAS_GERAIS' || t.category === 'ALIMENTACAO_FORA')
  )
  
  if (emotionalPurchases.length < 3) return null
  
  // Agrupa por dia e verifica se há múltiplas compras emocionais no mesmo dia
  const emotionalByDay = new Map<string, Transaction[]>()
  emotionalPurchases.forEach(t => {
    const dayKey = t.date.toISOString().split('T')[0]
    if (!emotionalByDay.has(dayKey)) {
      emotionalByDay.set(dayKey, [])
    }
    emotionalByDay.get(dayKey)!.push(t)
  })
  
  // Encontra dias com múltiplas compras emocionais
  const stressDays = Array.from(emotionalByDay.entries())
    .filter(([_, txs]) => txs.length >= 2)
    .map(([day, txs]) => ({
      day,
      count: txs.length,
      total: txs.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    }))
  
  if (stressDays.length > 0) {
    const totalStressSpending = stressDays.reduce((sum, d) => sum + d.total, 0)
    return {
      id: 'emotional-stress',
      type: 'EMOTIONAL_AFTER_STRESS',
      severity: stressDays.length > 3 ? 'high' : 'medium',
      message: `Detectado padrão de compras emocionais: ${stressDays.length} dias com múltiplas compras acima de R$ 200.`,
      evidence: [
        `${stressDays.length} dias com compras emocionais múltiplas`,
        `Total gasto nesses dias: ${formatCurrency(totalStressSpending)}`,
        `Dia mais crítico: ${stressDays.sort((a, b) => b.total - a.total)[0].day} com ${formatCurrency(stressDays.sort((a, b) => b.total - a.total)[0].total)}`
      ],
      recommendation: 'Compras emocionais após estresse podem ser controladas. Tente identificar gatilhos e estabelecer um período de espera antes de comprar.',
      detectedAt: new Date()
    }
  }
  
  return null
}

/**
 * Detecta gastos aumentados em semana de pressão (identificado por semanas com gastos muito acima da média)
 */
function detectPressureWeekPattern(transactions: Transaction[]): HiddenPattern | null {
  if (transactions.length < 14) return null // Precisa de pelo menos 2 semanas
  
  // Agrupa transações por semana
  const weeklyTotals = new Map<string, number>()
  
  transactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      const weekStart = startOfWeek(t.date, { weekStartsOn: 1 })
      const weekKey = weekStart.toISOString().split('T')[0]
      const current = weeklyTotals.get(weekKey) || 0
      weeklyTotals.set(weekKey, current + Math.abs(t.amount))
    })
  
  const weeklyValues = Array.from(weeklyTotals.values())
  if (weeklyValues.length < 2) return null
  
  const averageWeekly = weeklyValues.reduce((sum, v) => sum + v, 0) / weeklyValues.length
  const highPressureWeeks = Array.from(weeklyTotals.entries())
    .filter(([_, total]) => total > averageWeekly * 1.5)
  
  if (highPressureWeeks.length > 0) {
    const maxWeek = highPressureWeeks.sort((a, b) => b[1] - a[1])[0]
    return {
      id: 'pressure-week',
      type: 'PRESSURE_WEEK',
      severity: maxWeek[1] > averageWeekly * 2 ? 'high' : 'medium',
      message: `Detectadas ${highPressureWeeks.length} semanas com gastos ${((maxWeek[1] / averageWeekly - 1) * 100).toFixed(0)}% acima da média.`,
      evidence: [
        `Semana mais crítica: ${maxWeek[0]} com ${formatCurrency(maxWeek[1])}`,
        `Média semanal: ${formatCurrency(averageWeekly)}`,
        `${highPressureWeeks.length} semanas acima de ${formatCurrency(averageWeekly * 1.5)}`
      ],
      recommendation: 'Semanas de pressão podem levar a gastos impulsivos. Tente identificar o que causa esse aumento e planeje com antecedência.',
      detectedAt: new Date()
    }
  }
  
  return null
}

/**
 * Detecta tendência de pedir mais delivery quando cansado (fins de semana e finais de tarde)
 */
function detectTiredDeliveryPattern(transactions: Transaction[]): HiddenPattern | null {
  const deliveryTransactions = transactions.filter(t => 
    t.category === 'ALIMENTACAO_FORA' &&
    t.type === 'SAIDA'
  )
  
  if (deliveryTransactions.length < 5) return null
  
  // Fins de semana (sábado e domingo)
  const weekendDelivery = deliveryTransactions.filter(t => {
    const day = getDay(t.date)
    return day === 0 || day === 6 // Domingo ou Sábado
  })
  
  // Finais de tarde (após 18h)
  const eveningDelivery = deliveryTransactions.filter(t => {
    const hour = getHours(t.date)
    return hour >= 18
  })
  
  const weekendPercentage = (weekendDelivery.length / deliveryTransactions.length) * 100
  const eveningPercentage = (eveningDelivery.length / deliveryTransactions.length) * 100
  
  if (weekendPercentage > 40 || eveningPercentage > 50) {
    return {
      id: 'tired-delivery',
      type: 'TIRED_DELIVERY',
      severity: (weekendPercentage > 50 && eveningPercentage > 60) ? 'high' : 'medium',
      message: `Você pede delivery principalmente em fins de semana (${weekendPercentage.toFixed(0)}%) e finais de tarde (${eveningPercentage.toFixed(0)}%).`,
      evidence: [
        `${weekendDelivery.length} pedidos em fins de semana de ${deliveryTransactions.length} totais`,
        `${eveningDelivery.length} pedidos após 18h`,
        `Total gasto: ${formatCurrency(deliveryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0))}`
      ],
      recommendation: 'Pedidos quando cansado podem ser mais caros. Considere preparar refeições no início da semana ou ter opções rápidas em casa.',
      detectedAt: new Date()
    }
  }
  
  return null
}

/**
 * Detecta gastos maiores perto do dia 20 do mês
 */
function detectMidMonthSpendingPattern(transactions: Transaction[]): HiddenPattern | null {
  const expenses = transactions.filter(t => t.type === 'SAIDA')
  
  if (expenses.length < 10) return null
  
  // Agrupa por dia do mês
  const spendingByDay = new Map<number, number>()
  expenses.forEach(t => {
    const day = getDate(t.date)
    const current = spendingByDay.get(day) || 0
    spendingByDay.set(day, current + Math.abs(t.amount))
  })
  
  // Verifica se há pico entre dias 18-22
  const midMonthDays = [18, 19, 20, 21, 22]
  const midMonthSpending = midMonthDays
    .map(day => spendingByDay.get(day) || 0)
    .reduce((sum, amount) => sum + amount, 0)
  
  const averageDailySpending = Array.from(spendingByDay.values())
    .reduce((sum, amount) => sum + amount, 0) / spendingByDay.size
  
  const midMonthAverage = midMonthSpending / midMonthDays.length
  
  if (midMonthAverage > averageDailySpending * 1.3) {
    return {
      id: 'mid-month-spending',
      type: 'MID_MONTH_SPENDING',
      severity: midMonthAverage > averageDailySpending * 1.5 ? 'high' : 'medium',
      message: `Gastos ${((midMonthAverage / averageDailySpending - 1) * 100).toFixed(0)}% acima da média entre os dias 18-22 do mês.`,
      evidence: [
        `Média diária geral: ${formatCurrency(averageDailySpending)}`,
        `Média nos dias 18-22: ${formatCurrency(midMonthAverage)}`,
        `Total nos dias críticos: ${formatCurrency(midMonthSpending)}`
      ],
      recommendation: 'Gastos maiores perto do dia 20 podem estar relacionados ao recebimento ou pagamento de contas. Planeje melhor o fluxo de caixa.',
      detectedAt: new Date()
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

