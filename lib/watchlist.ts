import { Transaction, Category } from './classification'
import { CategoryMetrics } from './projections'
import { calculateMonthlyMetrics } from './projections'

export interface RiskItem {
  id: string
  type: 'category' | 'trend' | 'pattern' | 'forecast'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  currentValue: number
  threshold: number
  category?: Category
  recommendation: string
}

/**
 * Watchlist de Riscos Financeiros
 * Lista de itens que precisam de atenção imediata
 */
export function generateWatchlist(
  transactions: Transaction[],
  categoryMetrics: Record<Category, CategoryMetrics>,
  metrics: ReturnType<typeof calculateMonthlyMetrics>
): RiskItem[] {
  const risks: RiskItem[] = []
  
  // 1. Categorias críticas (acima de 100% da meta)
  Object.entries(categoryMetrics).forEach(([category, cm]) => {
    if (cm.monthlyGoal > 0 && cm.total > cm.monthlyGoal) {
      const percentage = (cm.total / cm.monthlyGoal) * 100
      risks.push({
        id: `category-${category}`,
        type: 'category',
        severity: percentage > 150 ? 'critical' : percentage > 120 ? 'high' : 'medium',
        title: `${category} acima da meta`,
        description: `Gastou ${percentage.toFixed(0)}% da meta mensal`,
        currentValue: cm.total,
        threshold: cm.monthlyGoal,
        category: category as Category,
        recommendation: `Reduza gastos em ${category} ou ajuste a meta para R$ ${cm.total.toFixed(2)}`
      })
    }
  })
  
  // 2. Previsão de rombo
  if (metrics.forecast.willGoNegative) {
    risks.push({
      id: 'forecast-negative',
      type: 'forecast',
      severity: 'critical',
      title: 'Previsão de Rombo',
      description: `Saldo projetado: ${formatCurrency(metrics.forecast.projectedBalance)}`,
      currentValue: metrics.forecast.projectedBalance,
      threshold: 0,
      recommendation: `Reduza gastos diários em ${formatCurrency(Math.abs(metrics.forecast.projectedBalance) / metrics.daysRemaining)} para evitar rombo`
    })
  }
  
  // 3. Burn rate muito alto
  const idealDailySpending = metrics.totalIncome / 30
  if (metrics.burnRate > idealDailySpending * 1.5) {
    risks.push({
      id: 'burn-rate-high',
      type: 'trend',
      severity: metrics.burnRate > idealDailySpending * 2 ? 'high' : 'medium',
      title: 'Burn Rate Elevado',
      description: `Gastando ${formatCurrency(metrics.burnRate)}/dia (ideal: ${formatCurrency(idealDailySpending)})`,
      currentValue: metrics.burnRate,
      threshold: idealDailySpending,
      recommendation: `Reduza gastos diários em ${formatCurrency(metrics.burnRate - idealDailySpending)} para manter equilíbrio`
    })
  }
  
  // 4. Taxa de sangramento alta
  if (metrics.bleedingRate > 20) {
    risks.push({
      id: 'bleeding-rate',
      type: 'trend',
      severity: metrics.bleedingRate > 50 ? 'high' : 'medium',
      title: 'Taxa de Sangramento Alta',
      description: `Perdendo ${formatCurrency(metrics.bleedingRate)}/dia além do esperado`,
      currentValue: metrics.bleedingRate,
      threshold: 0,
      recommendation: 'Identifique e elimine gastos não essenciais que estão causando essa perda diária'
    })
  }
  
  // 5. Categorias sem meta mas com gastos altos
  Object.entries(categoryMetrics).forEach(([category, cm]) => {
    if (cm.monthlyGoal === 0 && cm.total > 500) {
      risks.push({
        id: `no-goal-${category}`,
        type: 'category',
        severity: 'low',
        title: `${category} sem meta definida`,
        description: `Gastou ${formatCurrency(cm.total)} sem meta estabelecida`,
        currentValue: cm.total,
        threshold: 0,
        category: category as Category,
        recommendation: `Estabeleça uma meta mensal para ${category} para melhor controle`
      })
    }
  })
  
  return risks.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

