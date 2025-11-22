import { Transaction, Category } from './classification'
import { startOfMonth, endOfMonth, differenceInDays, addDays } from 'date-fns'

export interface CategoryForecast {
  category: Category
  currentTotal: number
  projectedMonthly: number
  dailyAverage: number
  daysElapsed: number
  daysRemaining: number
  trend: 'increasing' | 'decreasing' | 'stable'
  message: string
}

/**
 * Calcula previsão mensal por categoria baseada no ritmo atual
 */
export function calculateCategoryForecast(
  transactions: Transaction[],
  category: Category
): CategoryForecast | null {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  
  // Transações da categoria no mês atual
  const categoryTransactions = transactions.filter(t => 
    t.category === category && 
    t.type === 'SAIDA' &&
    t.date >= monthStart && 
    t.date <= today
  )
  
  if (categoryTransactions.length === 0) {
    return null
  }
  
  const currentTotal = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const daysElapsed = differenceInDays(today, monthStart) + 1
  const daysRemaining = differenceInDays(monthEnd, today)
  const totalDaysInMonth = differenceInDays(monthEnd, monthStart) + 1
  
  // Média diária baseada nos dias decorridos
  const dailyAverage = daysElapsed > 0 ? currentTotal / daysElapsed : 0
  
  // Projeção mensal: média diária × total de dias do mês
  const projectedMonthly = dailyAverage * totalDaysInMonth
  
  // Análise de tendência (últimos 7 dias vs média geral)
  const weekStart = addDays(today, -6)
  const weekTransactions = categoryTransactions.filter(t => t.date >= weekStart)
  const weekTotal = weekTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const weekDailyAverage = weekTotal / 7
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (weekDailyAverage > dailyAverage * 1.1) {
    trend = 'increasing'
  } else if (weekDailyAverage < dailyAverage * 0.9) {
    trend = 'decreasing'
  }
  
  // Mensagem personalizada
  const message = `Você vai gastar ${formatCurrency(projectedMonthly)} em ${getCategoryLabel(category)} este mês se continuar nesse ritmo.`
  
  return {
    category,
    currentTotal,
    projectedMonthly,
    dailyAverage,
    daysElapsed,
    daysRemaining,
    trend,
    message
  }
}

/**
 * Calcula previsões para todas as categorias
 */
export function calculateAllCategoryForecasts(
  transactions: Transaction[]
): CategoryForecast[] {
  const categories: Category[] = [
    'ALIMENTACAO_FORA',
    'PIX_SAIDA',
    'ASSINATURAS',
    'DIVIDAS_CDC',
    'TRANSPORTE',
    'COMPRAS_GERAIS',
    'TARIFAS'
  ]
  
  const forecasts = categories
    .map(cat => calculateCategoryForecast(transactions, cat))
    .filter((f): f is CategoryForecast => f !== null)
  
  return forecasts
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    ALIMENTACAO_DENTRO: 'Alimentação em Casa',
    ALIMENTACAO_FORA: 'Alimentação Fora',
    PIX_ENTRADA: 'PIX Entrada',
    PIX_SAIDA: 'PIX',
    ASSINATURAS: 'Assinaturas',
    DIVIDAS_CDC: 'Dívidas/CDC',
    TRANSPORTE: 'Transporte',
    COMPRAS_GERAIS: 'Compras Gerais',
    TARIFAS: 'Tarifas',
    OUTROS: 'Outros'
  }
  return labels[category] || category
}

