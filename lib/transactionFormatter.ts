import { Transaction } from './classification'

/**
 * Formata a descrição completa de uma transação para exibição
 */
export function formatTransactionDescription(transaction: Transaction): string {
  const parts: string[] = []
  
  if (transaction.lancamento) {
    parts.push(transaction.lancamento)
  }
  
  if (transaction.detalhes) {
    // Extrai informações úteis dos detalhes
    const detalhes = transaction.detalhes.trim()
    
    // Se tem data/hora no início (formato "DD/MM HH:MM"), separa
    const dateTimeMatch = detalhes.match(/^(\d{2}\/\d{2}\s+\d{2}:\d{2})\s+(.+)$/)
    if (dateTimeMatch) {
      const [, dateTime, rest] = dateTimeMatch
      parts.push(`${dateTime} - ${rest}`)
    } else {
      parts.push(detalhes)
    }
  }
  
  return parts.join(' | ') || transaction.description
}

/**
 * Extrai informações estruturadas dos detalhes
 */
export function parseTransactionDetails(detalhes: string): {
  dateTime?: string
  recipient?: string
  location?: string
  raw: string
} {
  if (!detalhes) {
    return { raw: '' }
  }
  
  const result: {
    dateTime?: string
    recipient?: string
    location?: string
    raw: string
  } = { raw: detalhes }
  
  // Tenta extrair data/hora (formato "DD/MM HH:MM")
  const dateTimeMatch = detalhes.match(/^(\d{2}\/\d{2}\s+\d{2}:\d{2})/)
  if (dateTimeMatch) {
    result.dateTime = dateTimeMatch[1]
    const rest = detalhes.substring(dateTimeMatch[0].length).trim()
    
    // Tenta identificar destinatário/local
    if (rest) {
      // Se tem " - " separando, pode ser destinatário
      const parts = rest.split(' - ').map(p => p.trim())
      if (parts.length > 1) {
        result.recipient = parts[parts.length - 1]
        result.location = parts.slice(0, -1).join(' - ')
      } else {
        result.recipient = rest
      }
    }
  } else {
    // Sem data/hora, assume que é tudo destinatário/local
    result.recipient = detalhes
  }
  
  return result
}

/**
 * Formata valor para exibição com contexto
 */
export function formatTransactionValue(transaction: Transaction): string {
  const sign = transaction.type === 'ENTRADA' ? '+' : '-'
  return `${sign} ${transaction.amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })}`
}

/**
 * Gera uma descrição curta para cards e listas
 */
export function getShortDescription(transaction: Transaction): string {
  // Prioriza detalhes se disponível, senão usa lançamento
  if (transaction.detalhes) {
    const parsed = parseTransactionDetails(transaction.detalhes)
    return parsed.recipient || parsed.raw || transaction.detalhes
  }
  
  return transaction.lancamento || transaction.description
}

