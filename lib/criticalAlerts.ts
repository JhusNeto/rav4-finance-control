import { Transaction } from './classification'
import { MonthlyMetrics, CategoryMetrics } from './projections'
import { getHours, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { getCategoryLabel } from './classification'
import { EmotionalSpendingAlert } from './emotionalSpending'

export type AlertSeverity = 'critical' | 'high' | 'medium'

export interface CriticalAlert {
  id: string
  type: 'rombo' | 'emotional' | 'category_critical' | 'dangerous_behavior' | 'false_income'
  severity: AlertSeverity
  title: string
  message: string
  details: string[]
  recommendation: string
  actionRequired: boolean
  canDismiss: boolean
  category?: string
  value?: number
  detectedAt: Date
}

/**
 * Sistema de Alertas Críticos - Defesa contra "latadas"
 */
export class CriticalAlertSystem {
  /**
   * 7.1 Alerta de Rombo
   */
  static checkRombo(metrics: MonthlyMetrics): CriticalAlert | null {
    if (metrics.projectedBalance < 0) {
      return {
        id: 'alert-rombo',
        type: 'rombo',
        severity: 'critical',
        title: '🚨 ALERTA DE ROMBO',
        message: 'Seu saldo projetado está negativo.',
        details: [
          `Saldo projetado: ${formatCurrency(metrics.projectedBalance)}`,
          `Se continuar assim, você fecha o mês em ${formatCurrency(metrics.projectedBalance)}`,
          metrics.forecast.willGoNegative && metrics.forecast.negativeDate
            ? `Rombo previsto para: ${metrics.forecast.negativeDate.toLocaleDateString('pt-BR')}`
            : 'Rombo iminente',
          `Burn rate atual: ${formatCurrency(metrics.burnRate)}/dia`
        ],
        recommendation: `Reduza gastos diários em ${formatCurrency(Math.abs(metrics.projectedBalance) / metrics.daysRemaining)} para evitar rombo.`,
        actionRequired: true,
        canDismiss: false,
        value: metrics.projectedBalance,
        detectedAt: new Date()
      }
    }
    return null
  }

  /**
   * 7.2 Alerta de Gasto Emocional
   */
  static checkEmotionalSpending(
    emotionalAlerts: EmotionalSpendingAlert[]
  ): CriticalAlert[] {
    return emotionalAlerts
      .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
      .map(alert => ({
        id: `alert-emotional-${alert.id}`,
        type: 'emotional' as const,
        severity: alert.severity === 'critical' ? 'critical' : 'high' as AlertSeverity,
        title: '⚠️ GASTO EMOCIONAL DETECTADO',
        message: 'Você está gastando por impulso.',
        details: [
          alert.message,
          ...alert.evidence.slice(0, 3)
        ],
        recommendation: alert.recommendation,
        actionRequired: true,
        canDismiss: true,
        value: alert.transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        detectedAt: alert.detectedAt
      }))
  }

  /**
   * 7.3 Alerta de Categoria Crítica
   */
  static checkCategoryCritical(
    categoryMetrics: CategoryMetrics,
    category: string
  ): CriticalAlert | null {
    if (categoryMetrics.monthlyGoal === 0) return null
    
    const percentage = (categoryMetrics.total / categoryMetrics.monthlyGoal) * 100
    
    // Alerta quando está acima de 90% ou acima de 100%
    if (percentage >= 90) {
      return {
        id: `alert-category-${category}`,
        type: 'category_critical',
        severity: percentage >= 100 ? 'critical' : 'high',
        title: `🚨 ${getCategoryLabel(category as any).toUpperCase()} CRÍTICO`,
        message: `Você já gastou ${percentage.toFixed(0)}% do limite de ${getCategoryLabel(category as any).toLowerCase()}.`,
        details: [
          `Gasto atual: ${formatCurrency(categoryMetrics.total)}`,
          `Limite mensal: ${formatCurrency(categoryMetrics.monthlyGoal)}`,
          `Restante: ${formatCurrency(Math.max(0, categoryMetrics.monthlyGoal - categoryMetrics.total))}`,
          `% do salário: ${categoryMetrics.percentageOfSalary.toFixed(1)}%`
        ],
        recommendation: percentage >= 100
          ? `Você ultrapassou o limite! Pare imediatamente de gastar em ${getCategoryLabel(category as any).toLowerCase()} este mês.`
          : `Você está quase no limite. Reduza gastos em ${getCategoryLabel(category as any).toLowerCase()} ou ajuste a meta.`,
        actionRequired: true,
        canDismiss: percentage < 100,
        category,
        value: categoryMetrics.total,
        detectedAt: new Date()
      }
    }
    return null
  }

  /**
   * 7.4 Alerta de Comportamento Perigoso
   */
  static checkDangerousBehavior(
    transactions: Transaction[]
  ): CriticalAlert[] {
    const alerts: CriticalAlert[] = []
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    
    const monthTransactions = transactions.filter(t =>
      t.type === 'SAIDA' &&
      isWithinInterval(t.date, { start: monthStart, end: monthEnd })
    )
    
    // PIX tarde da noite (após 22h)
    const nightPix = monthTransactions.filter(t => {
      const hour = getHours(t.date)
      return t.category === 'PIX_SAIDA' && (hour >= 22 || hour < 6)
    })
    
    if (nightPix.length >= 3) {
      const nightPixTotal = nightPix.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const avgNightPix = nightPixTotal / nightPix.length
      
      // Compara com PIX diurno
      const dayPix = monthTransactions.filter(t => {
        const hour = getHours(t.date)
        return t.category === 'PIX_SAIDA' && hour >= 6 && hour < 22
      })
      
      if (dayPix.length > 0) {
        const dayPixTotal = dayPix.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const avgDayPix = dayPixTotal / dayPix.length
        
        if (avgNightPix > avgDayPix * 1.2) {
          alerts.push({
            id: 'alert-night-pix',
            type: 'dangerous_behavior',
            severity: 'high',
            title: '🌙 COMPORTAMENTO PERIGOSO DETECTADO',
            message: 'Padrão detectado: PIX tarde da noite acima do normal.',
            details: [
              `${nightPix.length} PIX noturnos detectados`,
              `Média noturna: ${formatCurrency(avgNightPix)}`,
              `Média diurna: ${formatCurrency(avgDayPix)}`,
              `Total noturno: ${formatCurrency(nightPixTotal)}`
            ],
            recommendation: 'PIX noturnos geralmente são impulsivos. Estabeleça um horário limite (ex: 20h) para transações não essenciais.',
            actionRequired: true,
            canDismiss: true,
            value: nightPixTotal,
            detectedAt: new Date()
          })
        }
      }
    }
    
    // Múltiplas compras emocionais no mesmo dia
    const emotionalPurchases = monthTransactions.filter(t => {
      return t.category === 'COMPRAS_GERAIS' && Math.abs(t.amount) > 200
    })
    
    const purchasesByDay = new Map<string, Transaction[]>()
    emotionalPurchases.forEach(t => {
      const dayKey = t.date.toISOString().split('T')[0]
      if (!purchasesByDay.has(dayKey)) {
        purchasesByDay.set(dayKey, [])
      }
      purchasesByDay.get(dayKey)!.push(t)
    })
    
    purchasesByDay.forEach((dayPurchases, day) => {
      if (dayPurchases.length >= 3) {
        const dayTotal = dayPurchases.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        alerts.push({
          id: `alert-emotional-day-${day}`,
          type: 'dangerous_behavior',
          severity: 'high',
          title: '💸 COMPRAS EMOCIONAIS EM MASSA',
          message: `${dayPurchases.length} compras emocionais detectadas em um único dia.`,
          details: [
            `Data: ${new Date(day).toLocaleDateString('pt-BR')}`,
            `Total: ${formatCurrency(dayTotal)}`,
            `Média por compra: ${formatCurrency(dayTotal / dayPurchases.length)}`
          ],
          recommendation: 'Múltiplas compras em um dia indicam gastos por impulso. Reflita sobre o que motivou essas compras.',
          actionRequired: true,
          canDismiss: true,
          value: dayTotal,
          detectedAt: new Date()
        })
      }
    })
    
    return alerts
  }

  /**
   * 7.5 Alerta de Entrada Falsa
   */
  static checkFalseIncome(
    transactions: Transaction[],
    metrics: MonthlyMetrics
  ): CriticalAlert | null {
    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)
    
    // Entradas grandes do mês
    const largeIncomes = transactions.filter(t =>
      t.type === 'ENTRADA' &&
      isWithinInterval(t.date, { start: monthStart, end: monthEnd }) &&
      t.amount > 1000 // Entradas acima de R$ 1000
    )
    
    if (largeIncomes.length > 0 && metrics.projectedBalance < 0) {
      const largestIncome = largeIncomes.reduce((max, t) => 
        t.amount > max.amount ? t : max, largeIncomes[0]
      )
      
      // Se há rombo mesmo com entrada grande, é um alerta crítico
      return {
        id: 'alert-false-income',
        type: 'false_income',
        severity: 'critical',
        title: '💰 ALERTA DE ENTRADA FALSA',
        message: 'Depósito grande detectado. Isso mascara o rombo real.',
        details: [
          `Entrada detectada: ${formatCurrency(largestIncome.amount)}`,
          `Saldo projetado: ${formatCurrency(metrics.projectedBalance)}`,
          `Mesmo com essa entrada, você ainda fecha negativo`,
          `Data da entrada: ${largestIncome.date.toLocaleDateString('pt-BR')}`
        ],
        recommendation: 'Não se iluda com entradas grandes. O rombo real persiste. Foque em reduzir gastos, não em aumentar receitas temporárias.',
        actionRequired: true,
        canDismiss: false,
        value: largestIncome.amount,
        detectedAt: new Date()
      }
    }
    
    return null
  }

  /**
   * Gera todos os alertas críticos
   */
  static generateAllAlerts(
    transactions: Transaction[],
    metrics: MonthlyMetrics,
    categoryMetrics: Record<string, CategoryMetrics>,
    emotionalAlerts: EmotionalSpendingAlert[]
  ): CriticalAlert[] {
    const alerts: CriticalAlert[] = []
    
    // 7.1 Rombo
    const romboAlert = this.checkRombo(metrics)
    if (romboAlert) alerts.push(romboAlert)
    
    // 7.2 Gasto Emocional
    alerts.push(...this.checkEmotionalSpending(emotionalAlerts))
    
    // 7.3 Categorias Críticas
    Object.entries(categoryMetrics).forEach(([category, cm]) => {
      const categoryAlert = this.checkCategoryCritical(cm, category)
      if (categoryAlert) alerts.push(categoryAlert)
    })
    
    // 7.4 Comportamento Perigoso
    alerts.push(...this.checkDangerousBehavior(transactions))
    
    // 7.5 Entrada Falsa
    const falseIncomeAlert = this.checkFalseIncome(transactions, metrics)
    if (falseIncomeAlert) alerts.push(falseIncomeAlert)
    
    // Ordena por severidade (critical primeiro)
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 3, high: 2, medium: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

