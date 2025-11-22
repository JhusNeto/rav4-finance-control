import { Transaction } from './classification'
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'

/**
 * Detecta o salário automaticamente baseado nas transações
 * 
 * Estratégias:
 * 1. Procura transações categorizadas como "SALARIO"
 * 2. Calcula média mensal dos últimos 3 meses
 * 3. Se não encontrar, usa o valor mais recente
 * 4. Se ainda não encontrar, retorna null (mantém o valor atual)
 */
export function detectSalary(transactions: Transaction[]): number | null {
  if (!transactions || transactions.length === 0) {
    return null
  }

  const today = new Date()
  const threeMonthsAgo = subMonths(today, 3)

  // Filtra transações de salário dos últimos 3 meses
  const salaryTransactions = transactions
    .filter(t => 
      t.category === 'SALARIO' && 
      t.type === 'ENTRADA' &&
      t.amount > 0 &&
      t.date >= threeMonthsAgo
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime()) // Mais recentes primeiro

  if (salaryTransactions.length === 0) {
    return null
  }

  // Agrupa por mês para calcular média mensal
  const monthlySalaries = new Map<string, number[]>()
  
  salaryTransactions.forEach(t => {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlySalaries.has(monthKey)) {
      monthlySalaries.set(monthKey, [])
    }
    monthlySalaries.get(monthKey)!.push(t.amount)
  })

  // Calcula o total por mês (pode ter múltiplos salários no mesmo mês, como 13º)
  const monthlyTotals: number[] = []
  monthlySalaries.forEach((amounts, monthKey) => {
    const monthTotal = amounts.reduce((sum, amount) => sum + amount, 0)
    monthlyTotals.push(monthTotal)
  })

  if (monthlyTotals.length === 0) {
    return null
  }

  // Estratégia 1: Se há apenas um mês, usa esse valor
  if (monthlyTotals.length === 1) {
    return monthlyTotals[0]
  }

  // Estratégia 2: Calcula média dos meses (ignorando outliers)
  // Remove valores muito diferentes da média (provavelmente 13º salário ou bônus)
  const average = monthlyTotals.reduce((sum, val) => sum + val, 0) / monthlyTotals.length
  const stdDev = Math.sqrt(
    monthlyTotals.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / monthlyTotals.length
  )

  // Filtra valores dentro de 1.5 desvios padrão da média
  const filteredTotals = monthlyTotals.filter(
    val => Math.abs(val - average) <= 1.5 * stdDev
  )

  if (filteredTotals.length > 0) {
    // Retorna a média dos valores filtrados
    const filteredAverage = filteredTotals.reduce((sum, val) => sum + val, 0) / filteredTotals.length
    return Math.round(filteredAverage * 100) / 100 // Arredonda para 2 casas decimais
  }

  // Estratégia 3: Se não conseguiu filtrar, usa o valor mais recente
  return salaryTransactions[0].amount
}

/**
 * Detecta salário baseado em padrões de transações recorrentes
 * Procura por entradas mensais recorrentes mesmo que não estejam categorizadas como SALARIO
 */
export function detectSalaryFromRecurringTransactions(transactions: Transaction[]): number | null {
  if (!transactions || transactions.length === 0) {
    return null
  }

  const today = new Date()
  const sixMonthsAgo = subMonths(today, 6)

  // Filtra todas as entradas dos últimos 6 meses
  const entries = transactions
    .filter(t => 
      t.type === 'ENTRADA' && 
      t.amount > 0 &&
      t.date >= sixMonthsAgo
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  if (entries.length < 3) {
    return null // Precisa de pelo menos 3 entradas para detectar padrão
  }

  // Agrupa por mês
  const monthlyEntries = new Map<string, number[]>()
  
  entries.forEach(t => {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyEntries.has(monthKey)) {
      monthlyEntries.set(monthKey, [])
    }
    monthlyEntries.get(monthKey)!.push(t.amount)
  })

  // Procura por valores recorrentes (mesmo valor aparecendo em múltiplos meses)
  const valueFrequency = new Map<number, number>()
  
  monthlyEntries.forEach((amounts) => {
    const monthTotal = amounts.reduce((sum, amount) => sum + amount, 0)
    valueFrequency.set(monthTotal, (valueFrequency.get(monthTotal) || 0) + 1)
  })

  // Encontra o valor que aparece mais vezes (provavelmente o salário)
  let mostFrequentValue = 0
  let maxFrequency = 0

  valueFrequency.forEach((frequency, value) => {
    if (frequency > maxFrequency && value > 1000) { // Salário deve ser pelo menos R$ 1000
      maxFrequency = frequency
      mostFrequentValue = value
    }
  })

  // Se o valor aparece em pelo menos 3 meses diferentes, considera como salário
  if (maxFrequency >= 3) {
    return mostFrequentValue
  }

  return null
}

/**
 * Função principal que detecta o salário usando múltiplas estratégias
 */
export function autoDetectSalary(transactions: Transaction[]): number | null {
  // Estratégia 1: Procura transações categorizadas como SALARIO
  const salaryFromCategory = detectSalary(transactions)
  if (salaryFromCategory) {
    return salaryFromCategory
  }

  // Estratégia 2: Procura por padrões de transações recorrentes
  const salaryFromRecurring = detectSalaryFromRecurringTransactions(transactions)
  if (salaryFromRecurring) {
    return salaryFromRecurring
  }

  // Não conseguiu detectar
  return null
}

