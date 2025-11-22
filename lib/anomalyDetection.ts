import { Transaction } from './classification'
import { differenceInDays, isSameDay } from 'date-fns'
import { normalizeText } from './aiClassifier'

export interface Anomaly {
  id: string
  type: 'LARGE_PURCHASE' | 'UNUSUAL_PIX' | 'DUPLICATE_TRANSACTION' | 'UNEXPECTED_FEE'
  severity: 'low' | 'medium' | 'high' | 'critical'
  transaction: Transaction
  message: string
  evidence: string[]
  recommendation: string
  detectedAt: Date
}

/**
 * Sistema de detecção de anomalias (fraude ou erro)
 */
export function detectAnomalies(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  if (transactions.length === 0) return anomalies
  
  // 1. Compra muito maior que o padrão
  const largePurchaseAnomalies = detectLargePurchaseAnomalies(transactions)
  anomalies.push(...largePurchaseAnomalies)
  
  // 2. PIX incomum para destinatário incomum
  const unusualPixAnomalies = detectUnusualPixAnomalies(transactions)
  anomalies.push(...unusualPixAnomalies)
  
  // 3. Transações repetidas
  const duplicateAnomalies = detectDuplicateTransactionAnomalies(transactions)
  anomalies.push(...duplicateAnomalies)
  
  // 4. Taxas bancárias inesperadas
  const feeAnomalies = detectUnexpectedFeeAnomalies(transactions)
  anomalies.push(...feeAnomalies)
  
  return anomalies.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

/**
 * Detecta compras muito maiores que o padrão da categoria
 */
function detectLargePurchaseAnomalies(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Agrupa por categoria
  const byCategory = new Map<string, Transaction[]>()
  transactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      if (!byCategory.has(t.category)) {
        byCategory.set(t.category, [])
      }
      byCategory.get(t.category)!.push(t)
    })
  
  byCategory.forEach((categoryTransactions, category) => {
    if (categoryTransactions.length < 3) return // Precisa de histórico
    
    const amounts = categoryTransactions.map(t => Math.abs(t.amount))
    const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const max = Math.max(...amounts)
    
    // Calcula desvio padrão
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - average, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)
    
    // Identifica outliers (mais de 2 desvios padrão acima da média)
    categoryTransactions.forEach(t => {
      const amount = Math.abs(t.amount)
      const zScore = (amount - average) / stdDev
      
      if (zScore > 2) {
        const severity = zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium'
        
        anomalies.push({
          id: `large-purchase-${t.id}`,
          type: 'LARGE_PURCHASE',
          severity,
          transaction: t,
          message: `Compra ${((amount / average - 1) * 100).toFixed(0)}% acima da média da categoria ${category}.`,
          evidence: [
            `Valor: ${formatCurrency(amount)}`,
            `Média da categoria: ${formatCurrency(average)}`,
            `Desvio padrão: ${zScore.toFixed(2)}x acima da média`,
            `Data: ${t.date.toLocaleDateString('pt-BR')}`
          ],
          recommendation: 'Verifique se esta compra foi realmente autorizada e se o valor está correto.',
          detectedAt: new Date()
        })
      }
    })
  })
  
  return anomalies
}

/**
 * Detecta PIX incomum para destinatário incomum
 */
function detectUnusualPixAnomalies(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  const pixTransactions = transactions.filter(t => 
    t.category === 'PIX_SAIDA' && 
    t.type === 'SAIDA'
  )
  
  if (pixTransactions.length < 5) return anomalies
  
  // Agrupa por destinatário (normaliza descrição)
  const byRecipient = new Map<string, Transaction[]>()
  pixTransactions.forEach(t => {
    const normalized = normalizeText(t.description)
    // Extrai nome do destinatário (primeiras palavras após "pix" ou similar)
    const recipient = normalized.split(/\s+/).slice(0, 3).join(' ')
    
    if (!byRecipient.has(recipient)) {
      byRecipient.set(recipient, [])
    }
    byRecipient.get(recipient)!.push(t)
  })
  
  // Identifica destinatários incomuns (apenas 1 transação ou valor muito diferente)
  byRecipient.forEach((transactions, recipient) => {
    if (transactions.length === 1) {
      // Destinatário único - pode ser incomum
      const amount = Math.abs(transactions[0].amount)
      
      // Compara com média geral de PIX
      const allPixAmounts = pixTransactions.map(t => Math.abs(t.amount))
      const avgPix = allPixAmounts.reduce((sum, a) => sum + a, 0) / allPixAmounts.length
      
      if (amount > avgPix * 2) {
        anomalies.push({
          id: `unusual-pix-${transactions[0].id}`,
          type: 'UNUSUAL_PIX',
          severity: amount > avgPix * 5 ? 'high' : 'medium',
          transaction: transactions[0],
          message: `PIX de ${formatCurrency(amount)} para destinatário incomum: "${transactions[0].description}".`,
          evidence: [
            `Valor: ${formatCurrency(amount)}`,
            `Média de PIX: ${formatCurrency(avgPix)}`,
            `Destinatário: ${recipient}`,
            `Primeira transação para este destinatário`
          ],
          recommendation: 'Verifique se você conhece este destinatário e se o valor está correto.',
          detectedAt: new Date()
        })
      }
    }
  })
  
  return anomalies
}

/**
 * Detecta transações repetidas (possível cobrança duplicada)
 */
function detectDuplicateTransactionAnomalies(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Agrupa por descrição normalizada e valor
  const grouped = new Map<string, Transaction[]>()
  
  transactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      const normalized = normalizeText(t.description)
      const amount = Math.abs(t.amount).toFixed(2)
      const key = `${normalized.substring(0, 50)}_${amount}`
      
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(t)
    })
  
  // Identifica grupos com múltiplas transações no mesmo dia ou dias próximos
  grouped.forEach((transactions, key) => {
    if (transactions.length < 2) return
    
    // Verifica se há transações no mesmo dia ou em dias consecutivos
    const sorted = transactions.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const daysDiff = differenceInDays(sorted[i + 1].date, sorted[i].date)
      
      if (daysDiff <= 1) { // Mesmo dia ou dia seguinte
        const severity = isSameDay(sorted[i].date, sorted[i + 1].date) ? 'critical' : 'high'
        
        anomalies.push({
          id: `duplicate-${sorted[i].id}`,
          type: 'DUPLICATE_TRANSACTION',
          severity,
          transaction: sorted[i],
          message: `Possível transação duplicada: ${formatCurrency(Math.abs(sorted[i].amount))} em ${sorted[i].date.toLocaleDateString('pt-BR')} e ${sorted[i + 1].date.toLocaleDateString('pt-BR')}.`,
          evidence: [
            `Valor: ${formatCurrency(Math.abs(sorted[i].amount))}`,
            `Primeira ocorrência: ${sorted[i].date.toLocaleDateString('pt-BR')}`,
            `Segunda ocorrência: ${sorted[i + 1].date.toLocaleDateString('pt-BR')}`,
            `Descrição: "${sorted[i].description}"`
          ],
          recommendation: 'Verifique se esta transação foi cobrada duas vezes. Entre em contato com o estabelecimento se necessário.',
          detectedAt: new Date()
        })
        
        break // Evita múltiplos alertas para o mesmo grupo
      }
    }
  })
  
  return anomalies
}

/**
 * Detecta taxas bancárias inesperadas
 */
function detectUnexpectedFeeAnomalies(transactions: Transaction[]): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  const feeTransactions = transactions.filter(t => 
    t.category === 'TARIFAS' &&
    t.type === 'SAIDA'
  )
  
  if (feeTransactions.length === 0) return anomalies
  
  // Agrupa por tipo de taxa (baseado na descrição)
  const byType = new Map<string, Transaction[]>()
  feeTransactions.forEach(t => {
    const normalized = normalizeText(t.description)
    let type = 'outras'
    
    if (normalized.includes('iof')) type = 'iof'
    else if (normalized.includes('tarifa')) type = 'tarifa'
    else if (normalized.includes('anuidade')) type = 'anuidade'
    else if (normalized.includes('manutencao')) type = 'manutenção'
    
    if (!byType.has(type)) {
      byType.set(type, [])
    }
    byType.get(type)!.push(t)
  })
  
  // Identifica taxas inesperadas (novas ou valores muito altos)
  byType.forEach((transactions, type) => {
    const amounts = transactions.map(t => Math.abs(t.amount))
    const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const max = Math.max(...amounts)
    
    // Se há apenas uma ocorrência de um tipo de taxa, pode ser inesperada
    if (transactions.length === 1 && Math.abs(transactions[0].amount) > 10) {
      anomalies.push({
        id: `unexpected-fee-${transactions[0].id}`,
        type: 'UNEXPECTED_FEE',
        severity: Math.abs(transactions[0].amount) > 50 ? 'high' : 'medium',
        transaction: transactions[0],
        message: `Taxa bancária inesperada: ${formatCurrency(Math.abs(transactions[0].amount))} - ${type}.`,
        evidence: [
          `Tipo: ${type}`,
          `Valor: ${formatCurrency(Math.abs(transactions[0].amount))}`,
          `Data: ${transactions[0].date.toLocaleDateString('pt-BR')}`,
          `Primeira ocorrência deste tipo de taxa`
        ],
        recommendation: 'Verifique com seu banco o motivo desta taxa. Pode ser uma cobrança indevida ou uma nova tarifa.',
        detectedAt: new Date()
      })
    }
    
    // Se há múltiplas taxas mas uma muito acima da média
    if (transactions.length > 1 && max > average * 3) {
      const outlier = transactions.find(t => Math.abs(t.amount) === max)!
      anomalies.push({
        id: `unexpected-fee-high-${outlier.id}`,
        type: 'UNEXPECTED_FEE',
        severity: 'high',
        transaction: outlier,
        message: `Taxa ${type} muito acima do padrão: ${formatCurrency(Math.abs(outlier.amount))} (média: ${formatCurrency(average)}).`,
        evidence: [
          `Tipo: ${type}`,
          `Valor: ${formatCurrency(Math.abs(outlier.amount))}`,
          `Média: ${formatCurrency(average)}`,
          `Data: ${outlier.date.toLocaleDateString('pt-BR')}`
        ],
        recommendation: 'Verifique com seu banco o motivo desta taxa elevada.',
        detectedAt: new Date()
      })
    }
  })
  
  return anomalies
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

