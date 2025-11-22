import { Transaction } from './classification'
import { MonthlyMetrics } from './projections'
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

export type AppMode = 'normal' | 'iskra' | 'mochila'

export interface ModeState {
  currentMode: AppMode
  activatedAt: Date | null
  reason: string
  restrictions: {
    blockedCategories: string[]
    maxDailySpending: number | null
    maxCategorySpending: Record<string, number>
  }
}

/**
 * Sistema de modos de proteção financeira
 */
export class ModeManager {
  /**
   * Determina o modo atual baseado nas condições financeiras
   */
  static determineMode(
    transactions: Transaction[],
    metrics: MonthlyMetrics,
    weeklyGoal: number
  ): ModeState {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    
    // Transações da semana atual
    const weekTransactions = transactions.filter(t => 
      isWithinInterval(t.date, { start: weekStart, end: weekEnd }) &&
      t.type === 'SAIDA'
    )
    
    const weekSpending = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    // Condições para Mochila de Guerra
    const forecast = metrics.forecast
    const willGoNegative = forecast.willGoNegative
    const isBelowWeeklyGoal = weekSpending >= weeklyGoal * 0.9 // 90% da meta semanal
    
    if (willGoNegative || isBelowWeeklyGoal || metrics.projectedBalance < -500) {
      return {
        currentMode: 'mochila',
        activatedAt: new Date(),
        reason: willGoNegative 
          ? `Previsão indica rombo de ${formatCurrency(Math.abs(forecast.negativeAmount))}`
          : isBelowWeeklyGoal
          ? `Gastos semanais acima de 90% da meta (${formatCurrency(weekSpending)}/${formatCurrency(weeklyGoal)})`
          : `Saldo projetado negativo: ${formatCurrency(metrics.projectedBalance)}`,
        restrictions: {
          blockedCategories: ['COMPRAS_GERAIS', 'ALIMENTACAO_FORA'],
          maxDailySpending: 50, // Máximo R$ 50 por dia
          maxCategorySpending: {
            'PIX_SAIDA': 100,
            'ALIMENTACAO_FORA': 30,
            'TRANSPORTE': 20
          }
        }
      }
    }
    
    // Condições para modo Iskra (proteção preventiva)
    const isNearLimit = metrics.projectedBalance < 500 || weekSpending >= weeklyGoal * 0.7
    
    if (isNearLimit) {
      return {
        currentMode: 'iskra',
        activatedAt: new Date(),
        reason: metrics.projectedBalance < 500
          ? `Saldo projetado próximo do limite: ${formatCurrency(metrics.projectedBalance)}`
          : `Gastos semanais em 70% da meta: ${formatCurrency(weekSpending)}/${formatCurrency(weeklyGoal)}`,
        restrictions: {
          blockedCategories: [],
          maxDailySpending: 100,
          maxCategorySpending: {
            'PIX_SAIDA': 200,
            'ALIMENTACAO_FORA': 50
          }
        }
      }
    }
    
    // Modo normal
    return {
      currentMode: 'normal',
      activatedAt: null,
      reason: '',
      restrictions: {
        blockedCategories: [],
        maxDailySpending: null,
        maxCategorySpending: {}
      }
    }
  }
  
  /**
   * Verifica se uma transação viola as restrições do modo atual
   */
  static checkRestriction(
    mode: ModeState,
    transaction: Transaction,
    dailySpending: number,
    categorySpending: Record<string, number>
  ): { allowed: boolean; reason: string } {
    // Verifica categoria bloqueada
    if (mode.restrictions.blockedCategories.includes(transaction.category)) {
      return {
        allowed: false,
        reason: `Categoria ${transaction.category} está bloqueada no modo ${mode.currentMode}`
      }
    }
    
    // Verifica limite diário
    if (mode.restrictions.maxDailySpending !== null) {
      const newDailyTotal = dailySpending + Math.abs(transaction.amount)
      if (newDailyTotal > mode.restrictions.maxDailySpending) {
        return {
          allowed: false,
          reason: `Limite diário de ${formatCurrency(mode.restrictions.maxDailySpending)} seria ultrapassado`
        }
      }
    }
    
    // Verifica limite por categoria
    const categoryLimit = mode.restrictions.maxCategorySpending[transaction.category]
    if (categoryLimit !== undefined) {
      const currentCategorySpending = categorySpending[transaction.category] || 0
      const newCategoryTotal = currentCategorySpending + Math.abs(transaction.amount)
      if (newCategoryTotal > categoryLimit) {
        return {
          allowed: false,
          reason: `Limite da categoria ${transaction.category} (${formatCurrency(categoryLimit)}) seria ultrapassado`
        }
      }
    }
    
    return { allowed: true, reason: '' }
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

