import { Transaction } from './classification'
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

export interface PIXGroup {
  recipient: string
  count: number
  totalAmount: number
  averageAmount: number
  firstTransaction: Date
  lastTransaction: Date
  transactions: Transaction[]
  frequency: 'daily' | 'weekly' | 'monthly' | 'irregular'
  pattern: string
}

/**
 * Sistema de Auto-agrupamento de PIX
 * Agrupa PIX por destinatário e identifica padrões
 */
export function groupPIXByRecipient(
  transactions: Transaction[]
): PIXGroup[] {
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  
  // Filtra apenas PIX de saída do mês atual
  const pixTransactions = transactions.filter(t =>
    t.category === 'PIX_SAIDA' &&
    t.type === 'SAIDA' &&
    isWithinInterval(t.date, { start: monthStart, end: monthEnd })
  )
  
  // Agrupa por destinatário
  const groupsMap = new Map<string, Transaction[]>()
  
  pixTransactions.forEach(t => {
    // Tenta extrair destinatário da descrição ou detalhes
    const recipient = extractRecipient(t)
    
    if (!groupsMap.has(recipient)) {
      groupsMap.set(recipient, [])
    }
    
    groupsMap.get(recipient)!.push(t)
  })
  
  // Converte para array de grupos
  const groups: PIXGroup[] = []
  
  groupsMap.forEach((txs, recipient) => {
    if (txs.length === 0) return
    
    // Ordena por data
    txs.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    const totalAmount = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const averageAmount = totalAmount / txs.length
    
    // Calcula frequência
    const frequency = calculateFrequency(txs)
    
    // Gera padrão descritivo
    const pattern = generatePattern(txs, frequency)
    
    groups.push({
      recipient,
      count: txs.length,
      totalAmount,
      averageAmount,
      firstTransaction: txs[0].date,
      lastTransaction: txs[txs.length - 1].date,
      transactions: txs,
      frequency,
      pattern
    })
  })
  
  // Ordena por quantidade (mais frequentes primeiro)
  return groups.sort((a, b) => b.count - a.count)
}

/**
 * Extrai o nome do destinatário da transação
 */
function extractRecipient(transaction: Transaction): string {
  // Tenta usar detalhes primeiro
  if (transaction.detalhes && transaction.detalhes.trim()) {
    // Remove informações de data/hora se presentes
    const cleaned = transaction.detalhes
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove datas
      .replace(/\d{2}:\d{2}/g, '') // Remove horas
      .trim()
    
    if (cleaned.length > 0) {
      return cleaned.substring(0, 50) // Limita tamanho
    }
  }
  
  // Fallback para descrição
  const desc = transaction.description
    .replace(/PIX/i, '')
    .replace(/ENVIADO/i, '')
    .replace(/SAIDA/i, '')
    .trim()
  
  return desc || 'Destinatário desconhecido'
}

/**
 * Calcula a frequência dos PIX
 */
function calculateFrequency(transactions: Transaction[]): PIXGroup['frequency'] {
  if (transactions.length < 2) return 'irregular'
  
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
  const intervals: number[] = []
  
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i].date.getTime() - sorted[i - 1].date.getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    intervals.push(days)
  }
  
  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
  
  if (avgInterval <= 1) return 'daily'
  if (avgInterval <= 7) return 'weekly'
  if (avgInterval <= 30) return 'monthly'
  return 'irregular'
}

/**
 * Gera uma descrição do padrão
 */
function generatePattern(transactions: Transaction[], frequency: PIXGroup['frequency']): string {
  const count = transactions.length
  const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const frequencyLabels = {
    daily: 'diário',
    weekly: 'semanal',
    monthly: 'mensal',
    irregular: 'irregular'
  }
  
  return `O mesmo destinatário recebeu ${count} PIX este mês (padrão ${frequencyLabels[frequency]}, total: ${formatCurrency(total)})`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

