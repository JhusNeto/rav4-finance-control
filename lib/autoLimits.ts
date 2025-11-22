import { Transaction, Category } from './classification'
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, subDays, differenceInDays, isSameMonth } from 'date-fns'
import { isEmotionalPurchase } from './transactionUtils'

export interface AutoLimit {
  category: Category
  suggestedLimit: number // Limite mensal sugerido
  weeklyLimit: number // Limite semanal (REGRA 6)
  dailyLimit?: number // Limite diário para vilão #1 (REGRA 9)
  averageSpending: number
  maxSpending: number
  minSpending: number
  monthsAnalyzed: number
  confidence: 'high' | 'medium' | 'low'
  recommendation: string
  behavioralLimits?: BehavioralLimits // REGRA 7
  isProtected?: boolean // REGRA 10 - categorias essenciais protegidas
}

export interface BehavioralLimits {
  maxDeliveriesPerWeek: number
  noNightPurchases: boolean
  maxEmotionalPurchases: number
  maxTransactionAmount: number
}

// REGRA 2: Percentuais máximos do salário por categoria
const MAX_SALARY_PERCENTAGES: Record<Category, number> = {
  ALIMENTACAO_DENTRO: 0.30, // 30%
  ALIMENTACAO_FORA: 0.20, // 20%
  PIX_SAIDA: 0.15, // 15%
  PIX_ENTRADA: 0, // Entrada não tem limite
  ASSINATURAS: 0.05, // 5%
  DIVIDAS_CDC: 0.50, // 50% (dívidas são obrigatórias)
  MERCADO: 0.30, // 30%
  TRANSPORTE: 0.10, // 10%
  COMPRAS_GERAIS: 0.15, // 15%
  TARIFAS: 0.02, // 2%
  SAUDE: 0.10, // 10%
  LAZER: 0.05, // 5%
  EDUCACAO: 0.10, // 10%
  VESTUARIO: 0.05, // 5%
  COMBUSTIVEL: 0.10, // 10%
  SERVICOS: 0.05, // 5%
  MANUTENCAO: 0.10, // 10%
  IMPOSTOS: 0.20, // 20%
  SALARIO: 0, // Entrada não tem limite
  OUTROS: 0.10, // 10%
}

// REGRA 10: Categorias essenciais que nunca podem ser cortadas
const PROTECTED_CATEGORIES: Category[] = [
  'MERCADO',
  'TRANSPORTE',
  'DIVIDAS_CDC',
  'TARIFAS',
  'IMPOSTOS',
  'SAUDE',
]

/**
 * Sistema de Auto-limite Consciente
 * Implementa as 10 regras de limites financeiros inteligentes
 */
export function calculateAutoLimits(
  transactions: Transaction[],
  categories: Category[],
  salary: number,
  initialBalance: number
): Record<Category, AutoLimit> {
  const today = new Date()
  const threeMonthsAgo = subMonths(today, 3)
  
  // REGRA 3: Verifica se mês anterior deu prejuízo
  const previousMonthProfit = calculatePreviousMonthProfit(transactions, initialBalance, today)
  const austerityMultiplier = previousMonthProfit < 0 ? 0.85 : 1.0 // -15% se prejuízo
  
  // REGRA 4: Verifica se pode crescer limites (saldo real sobrando)
  const canGrowLimits = canIncreaseLimits(transactions, initialBalance, today)
  
  // REGRA 9: Identifica vilão número 1
  const topVillain = identifyTopVillain(transactions, threeMonthsAgo, today)
  
  const autoLimits: Partial<Record<Category, AutoLimit>> = {}
  
  categories.forEach(category => {
    // REGRA 10: Proteção para categorias essenciais
    const isProtected = PROTECTED_CATEGORIES.includes(category)
    
    // Filtra transações da categoria nos últimos 3 meses
    const categoryTransactions = transactions.filter(t => 
      t.category === category &&
      t.type === 'SAIDA' &&
      isWithinInterval(t.date, { start: threeMonthsAgo, end: today })
    )
    
    if (categoryTransactions.length === 0) {
      autoLimits[category] = {
        category,
        suggestedLimit: 0,
        weeklyLimit: 0,
        averageSpending: 0,
        maxSpending: 0,
        minSpending: 0,
        monthsAnalyzed: 0,
        confidence: 'low',
        recommendation: 'Sem dados suficientes para calcular limite automático',
        isProtected
      }
      return
    }
    
    // Agrupa por semana (REGRA 6)
    const weeklySpending = calculateWeeklySpending(categoryTransactions, threeMonthsAgo, today)
    const weeklyValues = Array.from(weeklySpending.values())
    
    // Agrupa por mês para análise mensal
    const monthlySpending = new Map<string, number>()
    categoryTransactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
      monthlySpending.set(monthKey, (monthlySpending.get(monthKey) || 0) + Math.abs(t.amount))
    })
    
    const monthlyValues = Array.from(monthlySpending.values())
    const monthsAnalyzed = monthlyValues.length
    
    if (weeklyValues.length === 0) {
      autoLimits[category] = {
        category,
        suggestedLimit: 0,
        weeklyLimit: 0,
        averageSpending: 0,
        maxSpending: 0,
        minSpending: 0,
        monthsAnalyzed: 0,
        confidence: 'low',
        recommendation: 'Sem dados suficientes para calcular limite automático',
        isProtected
      }
      return
    }
    
    // REGRA 1: Média semanal real
    const averageWeeklySpending = weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length
    const averageMonthlySpending = monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length
    const maxSpending = Math.max(...monthlyValues)
    const minSpending = Math.min(...monthlyValues)
    
    // REGRA 1: Limite semanal = média semanal - 20%
    let weeklyLimit = averageWeeklySpending * 0.8
    
    // REGRA 2: Limite mensal nunca ultrapassa % do salário
    const maxMonthlyBySalary = (MAX_SALARY_PERCENTAGES[category] || 0.10) * salary
    let monthlyLimit = averageMonthlySpending * 0.8 // Base: média - 20%
    
    // Aplica teto do salário
    monthlyLimit = Math.min(monthlyLimit, maxMonthlyBySalary)
    
    // REGRA 3: Aplica austeridade adaptativa se mês anterior deu prejuízo
    monthlyLimit *= austerityMultiplier
    weeklyLimit *= austerityMultiplier
    
    // REGRA 5: Limite máximo de crescimento (10% por mês)
    // Se pode crescer, aplica crescimento sustentável
    if (canGrowLimits && monthlyLimit > averageMonthlySpending) {
      monthlyLimit = Math.min(monthlyLimit, averageMonthlySpending * 1.1)
      weeklyLimit = Math.min(weeklyLimit, averageWeeklySpending * 1.1)
    }
    
    // REGRA 9: Limite diário para vilão número 1
    let dailyLimit: number | undefined = undefined
    if (category === topVillain) {
      // Limite diário: média dos últimos 60 dias ÷ 1.8
      const last60Days = subDays(today, 60)
      const recentTransactions = categoryTransactions.filter(t => t.date >= last60Days)
      const total60Days = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const averageDaily = total60Days / 60
      dailyLimit = averageDaily / 1.8
    }
    
    // REGRA 7: Limites comportamentais
    const behavioralLimits = calculateBehavioralLimits(category, categoryTransactions, weeklyLimit)
    
    // Confiança baseada na quantidade de dados
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (monthsAnalyzed >= 3 && weeklyValues.length >= 12) {
      confidence = 'high'
    } else if (monthsAnalyzed >= 2 && weeklyValues.length >= 8) {
      confidence = 'medium'
    }
    
    // Recomendação baseada na análise
    let recommendation = buildRecommendation(
      category,
      monthlyLimit,
      weeklyLimit,
      averageMonthlySpending,
      averageWeeklySpending,
      isProtected,
      category === topVillain
    )
    
    autoLimits[category] = {
      category,
      suggestedLimit: Math.round(monthlyLimit * 100) / 100,
      weeklyLimit: Math.round(weeklyLimit * 100) / 100,
      dailyLimit: dailyLimit ? Math.round(dailyLimit * 100) / 100 : undefined,
      averageSpending: Math.round(averageMonthlySpending * 100) / 100,
      maxSpending: Math.round(maxSpending * 100) / 100,
      minSpending: Math.round(minSpending * 100) / 100,
      monthsAnalyzed,
      confidence,
      recommendation,
      behavioralLimits,
      isProtected
    }
  })
  
  return autoLimits as Record<Category, AutoLimit>
}

/**
 * REGRA 1: Calcula gastos semanais
 */
function calculateWeeklySpending(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Map<string, number> {
  const weeklySpending = new Map<string, number>()
  
  transactions.forEach(t => {
    // Calcula semana do ano
    const weekStart = startOfWeek(t.date)
    const weekKey = `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`
    weeklySpending.set(weekKey, (weeklySpending.get(weekKey) || 0) + Math.abs(t.amount))
  })
  
  return weeklySpending
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Segunda-feira
  return new Date(d.setDate(diff))
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * REGRA 3: Calcula lucro/prejuízo do mês anterior
 */
function calculatePreviousMonthProfit(
  transactions: Transaction[],
  initialBalance: number,
  today: Date
): number {
  const currentMonthStart = startOfMonth(today)
  const previousMonthEnd = subDays(currentMonthStart, 1)
  const previousMonthStart = startOfMonth(previousMonthEnd)
  
  // Calcula saldo inicial do mês anterior
  const transactionsBefore = transactions.filter(t => t.date < previousMonthStart)
  let balanceAtStart = initialBalance
  transactionsBefore.forEach(t => {
    balanceAtStart += t.amount
  })
  
  // Transações do mês anterior
  const previousMonthTransactions = transactions.filter(t =>
    t.date >= previousMonthStart && t.date <= previousMonthEnd
  )
  
  const income = previousMonthTransactions
    .filter(t => t.type === 'ENTRADA')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = previousMonthTransactions
    .filter(t => t.type === 'SAIDA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  return income - expenses
}

/**
 * REGRA 4: Verifica se pode aumentar limites (saldo real sobrando)
 */
function canIncreaseLimits(
  transactions: Transaction[],
  initialBalance: number,
  today: Date
): boolean {
  const currentMonthStart = startOfMonth(today)
  const previousMonthEnd = subDays(currentMonthStart, 1)
  const previousMonthStart = startOfMonth(previousMonthEnd)
  
  // Calcula saldo final do mês anterior
  const transactionsBefore = transactions.filter(t => t.date < previousMonthStart)
  let balanceAtStart = initialBalance
  transactionsBefore.forEach(t => {
    balanceAtStart += t.amount
  })
  
  const previousMonthTransactions = transactions.filter(t =>
    t.date >= previousMonthStart && t.date <= previousMonthEnd
  )
  
  const income = previousMonthTransactions
    .filter(t => t.type === 'ENTRADA')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = previousMonthTransactions
    .filter(t => t.type === 'SAIDA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const finalBalance = balanceAtStart + income - expenses
  
  // Verifica condições:
  // 1. Fechou mês com saldo positivo
  // 2. Não há PIX de terceiros suspeitos (entradas grandes não recorrentes)
  const suspiciousIncome = previousMonthTransactions
    .filter(t => t.type === 'ENTRADA' && t.amount > 500)
    .filter(t => !t.description.toLowerCase().includes('salario') && 
                 !t.description.toLowerCase().includes('salário') &&
                 !t.description.toLowerCase().includes('proventos'))
    .length
  
  return finalBalance > 0 && suspiciousIncome === 0
}

/**
 * REGRA 9: Identifica vilão número 1 (categoria que mais gasta)
 */
function identifyTopVillain(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Category | null {
  const categoryTotals = new Map<Category, number>()
  
  transactions
    .filter(t => t.type === 'SAIDA' && isWithinInterval(t.date, { start: startDate, end: endDate }))
    .forEach(t => {
      const current = categoryTotals.get(t.category) || 0
      categoryTotals.set(t.category, current + Math.abs(t.amount))
    })
  
  if (categoryTotals.size === 0) return null
  
  let maxCategory: Category | null = null
  let maxAmount = 0
  
  categoryTotals.forEach((amount, category) => {
    // Exclui categorias protegidas do vilão
    if (!PROTECTED_CATEGORIES.includes(category) && amount > maxAmount) {
      maxAmount = amount
      maxCategory = category
    }
  })
  
  return maxCategory
}

/**
 * REGRA 7: Calcula limites comportamentais
 */
function calculateBehavioralLimits(
  category: Category,
  transactions: Transaction[],
  weeklyLimit: number
): BehavioralLimits | undefined {
  // Aplica apenas para categorias específicas
  if (!['ALIMENTACAO_FORA', 'PIX_SAIDA', 'COMPRAS_GERAIS', 'LAZER'].includes(category)) {
    return undefined
  }
  
  // Analisa padrões comportamentais
  const deliveries = transactions.filter(t => 
    t.description.toLowerCase().includes('ifood') ||
    t.description.toLowerCase().includes('rappi') ||
    t.description.toLowerCase().includes('uber eats')
  ).length
  
  const nightPurchases = transactions.filter(t => {
    const hour = t.date.getHours()
    return hour >= 20 || hour <= 6
  }).length
  
  const emotionalPurchases = transactions.filter(isEmotionalPurchase).length
  
  // Limites comportamentais baseados em análise
  return {
    maxDeliveriesPerWeek: Math.max(1, Math.floor(deliveries / 12)), // Baseado em histórico
    noNightPurchases: nightPurchases > transactions.length * 0.3, // Se >30% são noturnas
    maxEmotionalPurchases: Math.max(1, Math.floor(emotionalPurchases / 12)),
    maxTransactionAmount: Math.min(weeklyLimit * 0.15, 45) // 15% do limite semanal ou R$ 45
  }
}

/**
 * Constrói recomendação personalizada
 */
function buildRecommendation(
  category: Category,
  monthlyLimit: number,
  weeklyLimit: number,
  averageMonthly: number,
  averageWeekly: number,
  isProtected: boolean,
  isTopVillain: boolean
): string {
  const parts: string[] = []
  
  if (isTopVillain) {
    parts.push('⚠️ VILÃO #1 - Limite diário ativo')
  }
  
  if (isProtected) {
    parts.push('🛡️ Categoria essencial protegida')
  }
  
  parts.push(`Limite semanal: ${formatCurrency(weeklyLimit)} (20% abaixo da média de ${formatCurrency(averageWeekly)})`)
  parts.push(`Limite mensal: ${formatCurrency(monthlyLimit)}`)
  
  if (monthlyLimit < averageMonthly * 0.9) {
    parts.push('📉 Limite reduzido devido a prejuízo no mês anterior')
  }
  
  return parts.join('. ')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
