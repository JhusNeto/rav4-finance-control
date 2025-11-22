import { Transaction } from './classification'
import { differenceInDays, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns'
import { normalizeText } from './aiClassifier'

export interface HiddenSubscription {
  id: string
  description: string
  normalizedDescription: string
  amount: number
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'irregular'
  occurrences: number
  firstSeen: Date
  lastSeen: Date
  totalSpent: number
  confidence: 'high' | 'medium' | 'low'
  message: string
}

/**
 * Detecta assinaturas ocultas (micro pagamentos recorrentes)
 */
export function detectHiddenSubscriptions(transactions: Transaction[]): HiddenSubscription[] {
  const subscriptions: HiddenSubscription[] = []
  
  // Filtra apenas saídas (pagamentos)
  const payments = transactions.filter(t => t.type === 'SAIDA')
  
  if (payments.length < 3) return subscriptions
  
  // Agrupa transações por descrição normalizada e valor similar
  const grouped = new Map<string, Transaction[]>()
  
  payments.forEach(t => {
    const normalized = normalizeText(t.description)
    const amountRounded = Math.round(t.amount * 100) / 100 // Arredonda para centavos
    
    // Cria chave combinando descrição normalizada e valor (com tolerância)
    const key = `${normalized.substring(0, 50)}_${amountRounded.toFixed(2)}`
    
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(t)
  })
  
  // Analisa cada grupo para identificar padrões recorrentes
  grouped.forEach((transactions, key) => {
    if (transactions.length < 3) return // Precisa de pelo menos 3 ocorrências
    
    // Ordena por data
    const sorted = transactions.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Calcula intervalos entre transações
    const intervals: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      const days = differenceInDays(sorted[i].date, sorted[i - 1].date)
      intervals.push(days)
    }
    
    // Calcula média e desvio padrão dos intervalos
    const avgInterval = intervals.reduce((sum, d) => sum + d, 0) / intervals.length
    const variance = intervals.reduce((sum, d) => sum + Math.pow(d - avgInterval, 2), 0) / intervals.length
    const stdDev = Math.sqrt(variance)
    
    // Determina frequência baseado no intervalo médio
    let frequency: 'monthly' | 'biweekly' | 'weekly' | 'irregular' = 'irregular'
    if (avgInterval >= 25 && avgInterval <= 35 && stdDev < 5) {
      frequency = 'monthly'
    } else if (avgInterval >= 12 && avgInterval <= 18 && stdDev < 3) {
      frequency = 'biweekly'
    } else if (avgInterval >= 5 && avgInterval <= 9 && stdDev < 2) {
      frequency = 'weekly'
    }
    
    // Se for irregular mas com muitas ocorrências, ainda pode ser assinatura
    const isRecurring = frequency !== 'irregular' || (sorted.length >= 5 && stdDev < avgInterval * 0.5)
    
    if (isRecurring) {
      const amount = Math.abs(sorted[0].amount)
      const totalSpent = sorted.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      // Calcula confiança baseado na regularidade
      let confidence: 'high' | 'medium' | 'low' = 'low'
      if (frequency !== 'irregular' && stdDev < avgInterval * 0.2) {
        confidence = 'high'
      } else if (frequency !== 'irregular' || sorted.length >= 6) {
        confidence = 'medium'
      }
      
      // Verifica se já não é uma assinatura conhecida
      const isKnownSubscription = sorted.some(t => 
        t.category === 'ASSINATURAS' ||
        t.description.toLowerCase().includes('netflix') ||
        t.description.toLowerCase().includes('spotify') ||
        t.description.toLowerCase().includes('disney') ||
        t.description.toLowerCase().includes('prime') ||
        t.description.toLowerCase().includes('gympass')
      )
      
      if (!isKnownSubscription && amount < 100) { // Micro pagamentos
        const message = frequency === 'monthly' 
          ? `Possível assinatura mensal de ${formatCurrency(amount)}: "${sorted[0].description}"`
          : frequency === 'biweekly'
          ? `Possível assinatura quinzenal de ${formatCurrency(amount)}: "${sorted[0].description}"`
          : frequency === 'weekly'
          ? `Possível assinatura semanal de ${formatCurrency(amount)}: "${sorted[0].description}"`
          : `Possível assinatura irregular de ${formatCurrency(amount)}: "${sorted[0].description}"`
        
        subscriptions.push({
          id: `hidden-sub-${key}`,
          description: sorted[0].description,
          normalizedDescription: normalizeText(sorted[0].description),
          amount,
          frequency,
          occurrences: sorted.length,
          firstSeen: sorted[0].date,
          lastSeen: sorted[sorted.length - 1].date,
          totalSpent,
          confidence,
          message
        })
      }
    }
  })
  
  return subscriptions.sort((a, b) => b.confidence.localeCompare(a.confidence))
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

