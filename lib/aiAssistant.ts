import { Transaction } from './classification'
import { MonthlyMetrics } from './projections'
import { formatCurrency, formatDate } from './utils'
import { startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns'

export interface AssistantSummary {
  period: 'daily' | 'weekly'
  date: Date
  summary: string
  highlights: string[]
  warnings: string[]
  recommendations: string[]
  metrics: {
    totalIncome: number
    totalExpenses: number
    balance: number
    topCategory: string
    topCategoryAmount: number
  }
}

/**
 * Assistente Interno de IA
 * Gera resumos automáticos diários e semanais
 */
export class AIAssistant {
  /**
   * Gera resumo diário
   */
  static generateDailySummary(
    transactions: Transaction[],
    metrics: MonthlyMetrics,
    date: Date = new Date()
  ): AssistantSummary {
    const start = startOfDay(date)
    const end = endOfDay(date)
    
    const dayTransactions = transactions.filter(t =>
      isWithinInterval(t.date, { start, end })
    )
    
    const dayIncome = dayTransactions
      .filter(t => t.type === 'ENTRADA')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const dayExpenses = dayTransactions
      .filter(t => t.type === 'SAIDA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const dayBalance = dayIncome - dayExpenses
    
    // Top categoria do dia
    const categoryTotals = new Map<string, number>()
    dayTransactions
      .filter(t => t.type === 'SAIDA')
      .forEach(t => {
        const current = categoryTotals.get(t.category) || 0
        categoryTotals.set(t.category, current + Math.abs(t.amount))
      })
    
    const topCategory = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])[0] || ['OUTROS', 0]
    
    // Gera resumo em linguagem natural
    const summary = this.buildDailySummaryText(dayBalance, dayExpenses, dayIncome, topCategory[0])
    
    // Highlights
    const highlights: string[] = []
    if (dayBalance > 0) {
      highlights.push(`✅ Você teve saldo positivo hoje: ${formatCurrency(dayBalance)}`)
    }
    if (dayExpenses < 100) {
      highlights.push(`💰 Gastos baixos hoje: apenas ${formatCurrency(dayExpenses)}`)
    }
    if (dayTransactions.length === 0) {
      highlights.push(`📊 Nenhuma transação registrada hoje`)
    }
    
    // Warnings
    const warnings: string[] = []
    if (dayBalance < 0) {
      warnings.push(`⚠️ Saldo negativo hoje: ${formatCurrency(Math.abs(dayBalance))}`)
    }
    if (dayExpenses > 500) {
      warnings.push(`🚨 Gastos altos hoje: ${formatCurrency(dayExpenses)}`)
    }
    
    // Recommendations
    const recommendations: string[] = []
    const dailyBurnRate = metrics.totalExpenses / 30 // Aproximação diária
    if (dayExpenses > dailyBurnRate * 1.5) {
      recommendations.push(`💡 Você gastou ${formatCurrency(dayExpenses)} hoje, acima da média diária de ${formatCurrency(dailyBurnRate)}. Considere reduzir gastos amanhã.`)
    }
    if (metrics.projectedBalance < 0) {
      recommendations.push(`🎯 Seu saldo projetado está negativo. Foque em reduzir gastos não essenciais.`)
    }
    
    return {
      period: 'daily',
      date,
      summary,
      highlights,
      warnings,
      recommendations,
      metrics: {
        totalIncome: dayIncome,
        totalExpenses: dayExpenses,
        balance: dayBalance,
        topCategory: topCategory[0],
        topCategoryAmount: topCategory[1]
      }
    }
  }
  
  /**
   * Gera resumo semanal
   */
  static generateWeeklySummary(
    transactions: Transaction[],
    metrics: MonthlyMetrics,
    date: Date = new Date()
  ): AssistantSummary {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Segunda-feira
    const end = endOfWeek(date, { weekStartsOn: 1 }) // Domingo
    
    const weekTransactions = transactions.filter(t =>
      isWithinInterval(t.date, { start, end })
    )
    
    const weekIncome = weekTransactions
      .filter(t => t.type === 'ENTRADA')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const weekExpenses = weekTransactions
      .filter(t => t.type === 'SAIDA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const weekBalance = weekIncome - weekExpenses
    
    // Top categoria da semana
    const categoryTotals = new Map<string, number>()
    weekTransactions
      .filter(t => t.type === 'SAIDA')
      .forEach(t => {
        const current = categoryTotals.get(t.category) || 0
        categoryTotals.set(t.category, current + Math.abs(t.amount))
      })
    
    const topCategory = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])[0] || ['OUTROS', 0]
    
    // Gera resumo em linguagem natural
    const summary = this.buildWeeklySummaryText(weekBalance, weekExpenses, weekIncome, topCategory[0], weekTransactions.length)
    
    // Highlights
    const highlights: string[] = []
    if (weekBalance > 0) {
      highlights.push(`✅ Semana com saldo positivo: ${formatCurrency(weekBalance)}`)
    }
    const dailyBurnRate = metrics.totalExpenses / 30 // Aproximação diária
    const avgDailyExpense = weekExpenses / 7
    if (avgDailyExpense < dailyBurnRate) {
      highlights.push(`💰 Você gastou abaixo da média diária esta semana`)
    }
    highlights.push(`📊 ${weekTransactions.length} transações registradas`)
    
    // Warnings
    const warnings: string[] = []
    if (weekBalance < 0) {
      warnings.push(`⚠️ Semana com saldo negativo: ${formatCurrency(Math.abs(weekBalance))}`)
    }
    if (weekExpenses > metrics.totalExpenses * 0.3) { // Mais de 30% do mês em uma semana
      warnings.push(`🚨 Você gastou ${formatCurrency(weekExpenses)} esta semana, equivalente a ${((weekExpenses / metrics.totalExpenses) * 100).toFixed(0)}% do mês`)
    }
    
    // Recommendations
    const recommendations: string[] = []
    if (weekExpenses > metrics.totalExpenses * 0.3) {
      recommendations.push(`💡 Esta semana você gastou mais que o esperado. Tente manter os gastos mais controlados na próxima semana.`)
    }
    if (metrics.projectedBalance < 0) {
      recommendations.push(`🎯 Seu saldo projetado está negativo. Foque em reduzir gastos nas próximas semanas.`)
    }
    if (topCategory[1] > weekExpenses * 0.4) {
      recommendations.push(`📌 ${topCategory[0]} foi sua maior categoria esta semana (${formatCurrency(topCategory[1])}). Considere reduzir.`)
    }
    
    return {
      period: 'weekly',
      date,
      summary,
      highlights,
      warnings,
      recommendations,
      metrics: {
        totalIncome: weekIncome,
        totalExpenses: weekExpenses,
        balance: weekBalance,
        topCategory: topCategory[0],
        topCategoryAmount: topCategory[1]
      }
    }
  }
  
  /**
   * Constrói texto do resumo diário
   */
  private static buildDailySummaryText(
    balance: number,
    expenses: number,
    income: number,
    topCategory: string
  ): string {
    const today = new Date()
    const dateStr = isNaN(today.getTime()) ? 'hoje' : formatDate(today)
    
    if (balance > 0) {
      return `Hoje (${dateStr}), você teve um dia positivo! Entradas de ${formatCurrency(income)} e gastos de ${formatCurrency(expenses)}, resultando em saldo positivo de ${formatCurrency(balance)}. Sua maior categoria de gastos foi ${topCategory}.`
    } else if (balance < 0) {
      return `Hoje (${dateStr}), você gastou ${formatCurrency(expenses)} e teve entradas de ${formatCurrency(income)}, resultando em saldo negativo de ${formatCurrency(Math.abs(balance))}. Sua maior categoria de gastos foi ${topCategory}.`
    } else {
      return `Hoje (${dateStr}), você não teve movimentações financeiras.`
    }
  }
  
  /**
   * Constrói texto do resumo semanal
   */
  private static buildWeeklySummaryText(
    balance: number,
    expenses: number,
    income: number,
    topCategory: string,
    transactionCount: number
  ): string {
    const avgDaily = expenses / 7
    
    if (balance > 0) {
      return `Esta semana você teve um desempenho positivo! Total de entradas: ${formatCurrency(income)}, gastos: ${formatCurrency(expenses)} (média diária de ${formatCurrency(avgDaily)}), resultando em saldo positivo de ${formatCurrency(balance)}. Você fez ${transactionCount} transações e sua maior categoria foi ${topCategory}.`
    } else {
      return `Esta semana você gastou ${formatCurrency(expenses)} (média diária de ${formatCurrency(avgDaily)}) e teve entradas de ${formatCurrency(income)}, resultando em saldo de ${formatCurrency(balance)}. Você fez ${transactionCount} transações e sua maior categoria foi ${topCategory}.`
    }
  }
}

