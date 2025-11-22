import { Transaction } from './classification'
import { startOfMonth, endOfMonth, isWithinInterval, differenceInDays, addMonths } from 'date-fns'

export interface RAV4Progress {
  currentProgress: number
  targetProgress: number
  percentage: number
  remaining: number
  daysRemaining: number
  projectedCompletionDate: Date | null
  status: 'on_track' | 'ahead' | 'behind' | 'critical'
  message: string
}

/**
 * Calcula o progresso do Projeto RAV4
 * Objetivo macro: Economizar X reais até uma data específica
 */
export function calculateRAV4Progress(
  transactions: Transaction[],
  initialBalance: number,
  targetAmount: number,
  targetDate: Date,
  startDate: Date
): RAV4Progress {
  const today = new Date()
  
  // Calcula saldo atual (considerando histórico)
  const currentBalance = calculateCurrentBalance(transactions, initialBalance)
  
  // Progresso atual (quanto já economizou desde o início)
  const currentProgress = currentBalance - initialBalance
  
  // Progresso necessário até a data alvo
  const targetProgress = targetAmount
  
  // Percentual de progresso
  const percentage = targetProgress > 0 
    ? Math.min(100, (currentProgress / targetProgress) * 100)
    : 0
  
  // Quanto falta
  const remaining = Math.max(0, targetProgress - currentProgress)
  
  // Dias restantes até a data alvo
  const daysRemaining = Math.max(0, differenceInDays(targetDate, today))
  
  // Projeta data de conclusão baseada no ritmo atual
  let projectedCompletionDate: Date | null = null
  if (currentProgress > 0 && daysRemaining > 0) {
    const daysElapsed = differenceInDays(today, startDate)
    const dailyRate = daysElapsed > 0 ? currentProgress / daysElapsed : 0
    
    if (dailyRate > 0 && isFinite(dailyRate) && remaining > 0) {
      const daysNeeded = remaining / dailyRate
      if (isFinite(daysNeeded) && daysNeeded > 0) {
        try {
          projectedCompletionDate = addMonths(today, Math.ceil(daysNeeded / 30))
          // Valida se a data é válida
          if (isNaN(projectedCompletionDate.getTime())) {
            projectedCompletionDate = null
          }
        } catch (e) {
          projectedCompletionDate = null
        }
      }
    }
  }
  
  // Status baseado no progresso
  let status: RAV4Progress['status'] = 'on_track'
  let message = ''
  
  if (percentage >= 100) {
    status = 'ahead'
    message = `🎉 Objetivo alcançado! Você já economizou ${formatCurrency(currentProgress)}.`
  } else if (percentage >= 80) {
    status = 'on_track'
    message = `Você está no caminho certo. Faltam ${formatCurrency(remaining)} para o objetivo.`
  } else if (percentage >= 50) {
    status = 'behind'
    message = `Atenção: Você está um pouco atrasado. Faltam ${formatCurrency(remaining)}.`
  } else {
    status = 'critical'
    message = `🚨 Crítico: Você está muito atrás. Faltam ${formatCurrency(remaining)} para o objetivo.`
  }
  
  return {
    currentProgress,
    targetProgress,
    percentage,
    remaining,
    daysRemaining,
    projectedCompletionDate,
    status,
    message
  }
}

/**
 * Calcula saldo atual considerando todas as transações
 */
function calculateCurrentBalance(transactions: Transaction[], initialBalance: number): number {
  return transactions.reduce((balance, t) => {
    if (t.type === 'ENTRADA') {
      return balance + t.amount
    } else {
      return balance - Math.abs(t.amount)
    }
  }, initialBalance)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

