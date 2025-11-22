import { Transaction } from './classification'
import { MonthlyMetrics, calculateCategoryMetrics } from './projections'
import { Category, getCategoryLabel } from './classification'
import { FinanceGoals } from '@/store/financeStore'

export interface AISuggestion {
  id: string
  type: 'cancel_subscription' | 'reduce_category' | 'optimize_spending' | 'debt_payoff' | 'savings_opportunity'
  title: string
  description: string
  action: string
  impact: {
    monthlySavings: number
    annualSavings: number
    message: string
  }
  priority: 'high' | 'medium' | 'low'
  category?: Category
  transactionId?: string
}

/**
 * Sistema de Sugestões Automáticas por IA
 * Analisa padrões e sugere ações específicas para economizar
 */
export class AISuggestionEngine {
  /**
   * Gera todas as sugestões automáticas
   */
  static generateSuggestions(
    transactions: Transaction[],
    metrics: MonthlyMetrics,
    goals: FinanceGoals,
    salary: number
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    // 1. Sugestões de cancelamento de assinaturas
    suggestions.push(...this.suggestSubscriptionCancellations(transactions))
    
    // 2. Sugestões de redução por categoria
    suggestions.push(...this.suggestCategoryReductions(transactions, goals, salary))
    
    // 3. Sugestões de otimização de gastos
    suggestions.push(...this.suggestSpendingOptimizations(transactions, metrics))
    
    // 4. Sugestões de pagamento de dívidas
    suggestions.push(...this.suggestDebtPayoffs(transactions, metrics))
    
    // 5. Oportunidades de economia
    suggestions.push(...this.findSavingsOpportunities(transactions, metrics))
    
    // Ordena por prioridade e impacto
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.impact.monthlySavings - a.impact.monthlySavings
      })
      .slice(0, 10) // Top 10 sugestões
  }
  
  /**
   * Sugere cancelamento de assinaturas
   */
  private static suggestSubscriptionCancellations(transactions: Transaction[]): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    // Agrupa assinaturas por descrição
    const subscriptions = transactions.filter(t => t.category === 'ASSINATURAS')
    const subscriptionGroups = new Map<string, Transaction[]>()
    
    subscriptions.forEach(sub => {
      const key = normalizeDescription(sub.description)
      if (!subscriptionGroups.has(key)) {
        subscriptionGroups.set(key, [])
      }
      subscriptionGroups.get(key)!.push(sub)
    })
    
    // Para cada assinatura recorrente, sugere cancelamento
    subscriptionGroups.forEach((subs, key) => {
      if (subs.length >= 2) { // Pelo menos 2 meses
        const monthlyCost = subs.reduce((sum, s) => sum + Math.abs(s.amount), 0) / subs.length
        const totalMonthly = monthlyCost
        
        suggestions.push({
          id: `cancel-sub-${key}`,
          type: 'cancel_subscription',
          title: `Cancele esta assinatura para economizar R$ ${formatCurrency(monthlyCost)}/mês`,
          description: `Você está gastando ${formatCurrency(totalMonthly)} por mês com "${subs[0].description.substring(0, 40)}".`,
          action: `Cancelar assinatura "${subs[0].description.substring(0, 30)}"`,
          impact: {
            monthlySavings: monthlyCost,
            annualSavings: monthlyCost * 12,
            message: `Economize ${formatCurrency(monthlyCost * 12)} por ano cancelando esta assinatura.`
          },
          priority: monthlyCost > 50 ? 'high' : 'medium',
          transactionId: subs[0].id
        })
      }
    })
    
    return suggestions
  }
  
  /**
   * Sugere reduções por categoria
   */
  private static suggestCategoryReductions(
    transactions: Transaction[],
    goals: FinanceGoals,
    salary: number
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    const categories: Category[] = ['PIX_SAIDA', 'ALIMENTACAO_FORA', 'ASSINATURAS', 'DIVIDAS_CDC']
    
    categories.forEach(category => {
      const goal = goals[category] || 0
      const metrics = calculateCategoryMetrics(transactions, category, goal, salary)
      
      // Se ultrapassou a meta em mais de 20%
      if (metrics.total > goal * 1.2) {
        const excess = metrics.total - goal
        const reductionTarget = goal * 0.9 // Reduzir para 90% da meta
        
        suggestions.push({
          id: `reduce-category-${category}`,
          type: 'reduce_category',
          title: `Você pode reduzir o rombo se parar de gastar tanto em ${getCategoryLabel(category)}`,
          description: `Você gastou ${formatCurrency(metrics.total)} em ${getCategoryLabel(category)}, mas a meta é ${formatCurrency(goal)}.`,
          action: `Reduzir gastos em ${getCategoryLabel(category)} para ${formatCurrency(reductionTarget)}/mês`,
          impact: {
            monthlySavings: excess,
            annualSavings: excess * 12,
            message: `Economize ${formatCurrency(excess)} por mês reduzindo gastos em ${getCategoryLabel(category)}.`
          },
          priority: excess > 500 ? 'high' : 'medium',
          category
        })
      }
    })
    
    return suggestions
  }
  
  /**
   * Sugere otimizações de gastos
   */
  private static suggestSpendingOptimizations(
    transactions: Transaction[],
    metrics: MonthlyMetrics
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    // Se o burn rate está negativo, sugere otimizações
    if (metrics.burnRate < 0) {
      const dailyDeficit = Math.abs(metrics.burnRate)
      const monthlyDeficit = dailyDeficit * 30
      
      suggestions.push({
        id: 'optimize-spending',
        type: 'optimize_spending',
        title: 'Otimize seus gastos para evitar rombo',
        description: `Seu burn rate diário está negativo. Você está gastando mais do que ganha.`,
        action: 'Reduzir gastos em categorias não essenciais',
        impact: {
          monthlySavings: monthlyDeficit,
          annualSavings: monthlyDeficit * 12,
          message: `Reduzindo ${formatCurrency(dailyDeficit)} por dia, você economiza ${formatCurrency(monthlyDeficit)} por mês.`
        },
        priority: 'high'
      })
    }
    
    return suggestions
  }
  
  /**
   * Sugere pagamento de dívidas
   */
  private static suggestDebtPayoffs(
    transactions: Transaction[],
    metrics: MonthlyMetrics
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    const debtTransactions = transactions.filter(t => t.category === 'DIVIDAS_CDC' && t.type === 'SAIDA')
    const totalDebt = debtTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    if (totalDebt > 0 && metrics.projectedBalance < 0) {
      suggestions.push({
        id: 'debt-payoff',
        type: 'debt_payoff',
        title: 'Considere amortizar dívidas para reduzir juros',
        description: `Você está pagando ${formatCurrency(totalDebt)} em dívidas por mês.`,
        action: 'Usar simulador de liquidação de dívidas',
        impact: {
          monthlySavings: totalDebt * 0.1, // Estimativa de 10% de economia em juros
          annualSavings: totalDebt * 0.1 * 12,
          message: `Amortizando antecipadamente, você pode economizar em juros.`
        },
        priority: 'medium'
      })
    }
    
    return suggestions
  }
  
  /**
   * Encontra oportunidades de economia
   */
  private static findSavingsOpportunities(
    transactions: Transaction[],
    metrics: MonthlyMetrics
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    // Encontra gastos recorrentes que podem ser reduzidos
    const recurringExpenses = this.findRecurringExpenses(transactions)
    
    recurringExpenses.forEach(expense => {
      if (expense.monthlyCost > 100) {
        suggestions.push({
          id: `savings-${expense.description}`,
          type: 'savings_opportunity',
          title: `Oportunidade de economia: ${expense.description}`,
          description: `Você gasta ${formatCurrency(expense.monthlyCost)} por mês com isso.`,
          action: `Revisar necessidade de "${expense.description}"`,
          impact: {
            monthlySavings: expense.monthlyCost * 0.3, // 30% de economia potencial
            annualSavings: expense.monthlyCost * 0.3 * 12,
            message: `Reduzindo 30%, você economiza ${formatCurrency(expense.monthlyCost * 0.3)} por mês.`
          },
          priority: expense.monthlyCost > 200 ? 'high' : 'low'
        })
      }
    })
    
    return suggestions
  }
  
  /**
   * Encontra gastos recorrentes
   */
  private static findRecurringExpenses(transactions: Transaction[]): Array<{ description: string; monthlyCost: number }> {
    const expenseMap = new Map<string, number[]>()
    
    transactions
      .filter(t => t.type === 'SAIDA')
      .forEach(t => {
        const key = normalizeDescription(t.description)
        if (!expenseMap.has(key)) {
          expenseMap.set(key, [])
        }
        expenseMap.get(key)!.push(Math.abs(t.amount))
      })
    
    const recurring: Array<{ description: string; monthlyCost: number }> = []
    
    expenseMap.forEach((amounts, key) => {
      if (amounts.length >= 2) {
        const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
        recurring.push({
          description: key.substring(0, 40),
          monthlyCost: avgAmount
        })
      }
    })
    
    return recurring.sort((a, b) => b.monthlyCost - a.monthlyCost).slice(0, 5)
  }
}

function normalizeDescription(description: string): string {
  return description.toLowerCase().trim().substring(0, 50)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

