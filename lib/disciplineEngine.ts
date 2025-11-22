import { ModeState, AppMode } from './modes'
import { MonthlyMetrics } from './projections'
import { Transaction } from './classification'

export interface DisciplineStatus {
  isInAusterity: boolean
  violations: {
    category: string
    amount: number
    limit: number
    message: string
  }[]
  impact: {
    projectedDelay: number // Meses de atraso no objetivo
    additionalCost: number // Custo adicional
    message: string
  }
  warnings: string[]
}

/**
 * Engine de Disciplina do Projeto RAV4
 * Monitora se você está saindo da austeridade e mostra impacto
 */
export class DisciplineEngine {
  /**
   * Verifica se está saindo da austeridade
   */
  static checkDiscipline(
    mode: ModeState,
    metrics: MonthlyMetrics,
    transactions: Transaction[],
    categoryLimits: Record<string, number>
  ): DisciplineStatus {
    const isInAusterity = mode.currentMode === 'mochila' || mode.currentMode === 'iskra'
    
    const violations: DisciplineStatus['violations'] = []
    const warnings: string[] = []
    
    // Verifica violações de limites por categoria
    Object.entries(categoryLimits).forEach(([category, limit]) => {
      const categoryTransactions = transactions.filter(t =>
        t.category === category &&
        t.type === 'SAIDA'
      )
      
      const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      if (categoryTotal > limit) {
        violations.push({
          category,
          amount: categoryTotal,
          limit,
          message: `${category} ultrapassou o limite de ${formatCurrency(limit)}. Gasto atual: ${formatCurrency(categoryTotal)}`
        })
      } else if (categoryTotal > limit * 0.9) {
        warnings.push(`${category} está próximo do limite (${((categoryTotal / limit) * 100).toFixed(0)}%)`)
      }
    })
    
    // Calcula impacto se sair da austeridade
    let projectedDelay = 0
    let additionalCost = 0
    
    if (!isInAusterity && mode.currentMode === 'normal') {
      // Se estava em austeridade e saiu, calcula impacto
      const excessSpending = metrics.totalExpenses - (metrics.totalIncome * 0.7) // Assume que deveria gastar 70% da renda
      
      if (excessSpending > 0) {
        // Estima atraso no objetivo (assume que cada R$ 1000 de excesso = 1 mês de atraso)
        projectedDelay = Math.ceil(excessSpending / 1000)
        additionalCost = excessSpending
      }
    }
    
    const impactMessage = violations.length > 0 || additionalCost > 0
      ? `Sair da austeridade agora pode atrasar seu objetivo em ${projectedDelay} mês(es) e custar ${formatCurrency(additionalCost)} adicional.`
      : 'Você está mantendo a disciplina. Continue assim!'
    
    return {
      isInAusterity,
      violations,
      impact: {
        projectedDelay,
        additionalCost,
        message: impactMessage
      },
      warnings
    }
  }
  
  /**
   * Gera avisos mais fortes quando sai da austeridade
   */
  static generateStrongWarnings(disciplineStatus: DisciplineStatus): string[] {
    const warnings: string[] = []
    
    if (!disciplineStatus.isInAusterity && disciplineStatus.violations.length > 0) {
      warnings.push('🚨 VOCÊ SAIU DA AUSTERIDADE!')
      warnings.push(`Você violou ${disciplineStatus.violations.length} limite(s) de categoria.`)
      warnings.push(disciplineStatus.impact.message)
      
      disciplineStatus.violations.forEach(v => {
        warnings.push(`⚠️ ${v.message}`)
      })
    }
    
    return warnings
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

