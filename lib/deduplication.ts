import { Transaction } from './classification'
import { normalizeText } from './aiClassifier'

/**
 * Cria uma chave única para identificar transações duplicadas
 * Baseado em: data, valor, descrição normalizada
 */
function createTransactionKey(transaction: Transaction): string {
  const dateKey = transaction.date.toISOString().split('T')[0] // YYYY-MM-DD
  const amountKey = transaction.amount.toFixed(2)
  const descKey = normalizeText(transaction.description).substring(0, 50) // Primeiros 50 chars normalizados
  
  return `${dateKey}|${amountKey}|${descKey}`
}

/**
 * Verifica se duas transações são duplicadas
 * Considera duplicatas APENAS se:
 * - Mesma data (mesmo dia)
 * - Mesmo valor (dentro de 0.01 de tolerância)
 * - Descrição idêntica após normalização
 * 
 * Removida verificação de similaridade de Jaccard para evitar remoções errôneas
 */
function areDuplicates(t1: Transaction, t2: Transaction): boolean {
  // Mesma data (mesmo dia)
  const sameDate = t1.date.toISOString().split('T')[0] === t2.date.toISOString().split('T')[0]
  if (!sameDate) return false
  
  // Mesmo valor (tolerância de 0.01 para arredondamentos)
  const amountDiff = Math.abs(t1.amount - t2.amount)
  if (amountDiff > 0.01) return false
  
  // Descrição deve ser IDÊNTICA após normalização (sem similaridade aproximada)
  const desc1 = normalizeText(t1.description)
  const desc2 = normalizeText(t2.description)
  
  // Apenas considera duplicata se descrições forem exatamente iguais após normalização
  return desc1 === desc2
}

/**
 * Remove transações duplicadas de uma lista
 * Mantém a primeira ocorrência e remove as subsequentes
 */
export function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Map<string, Transaction>()
  const deduplicated: Transaction[] = []
  const duplicates: Transaction[] = []
  
  for (const transaction of transactions) {
    const key = createTransactionKey(transaction)
    
    // Verifica se já existe uma transação com essa chave
    const existing = seen.get(key)
    
    if (existing) {
      // Verifica se são realmente duplicatas (pode haver falsos positivos na chave)
      if (areDuplicates(existing, transaction)) {
        duplicates.push(transaction)
        continue // Ignora duplicata
      }
    }
    
    // Verifica também contra todas as transações já processadas (para casos de chaves diferentes mas duplicatas reais)
    let isDuplicate = false
    for (const [existingKey, existingTx] of seen.entries()) {
      if (areDuplicates(existingTx, transaction)) {
        duplicates.push(transaction)
        isDuplicate = true
        break
      }
    }
    
    if (!isDuplicate) {
      seen.set(key, transaction)
      deduplicated.push(transaction)
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`Removidas ${duplicates.length} transações duplicadas`)
  }
  
  return deduplicated
}

/**
 * Faz merge inteligente de transações repetidas
 * Quando encontra duplicatas, mantém a mais completa (com mais campos preenchidos)
 * e combina informações úteis de ambas
 */
export function mergeDuplicateTransactions(transactions: Transaction[]): Transaction[] {
  const merged: Transaction[] = []
  const processed = new Set<string>()
  
  for (let i = 0; i < transactions.length; i++) {
    const tx1 = transactions[i]
    const key1 = createTransactionKey(tx1)
    
    if (processed.has(key1)) continue
    
    // Procura por duplicatas desta transação
    const duplicates: Transaction[] = [tx1]
    
    for (let j = i + 1; j < transactions.length; j++) {
      const tx2 = transactions[j]
      const key2 = createTransactionKey(tx2)
      
      if (processed.has(key2)) continue
      
      if (areDuplicates(tx1, tx2)) {
        duplicates.push(tx2)
        processed.add(key2)
      }
    }
    
    // Se encontrou duplicatas, faz merge
    if (duplicates.length > 1) {
      // Encontra a transação mais completa (com mais campos preenchidos)
      const mostComplete = duplicates.reduce((best, current) => {
        let bestScore = 0
        let currentScore = 0
        
        if (best.lancamento) bestScore++
        if (best.detalhes) bestScore++
        if (best.numeroDocumento) bestScore++
        if (best.description && best.description.length > 20) bestScore++
        
        if (current.lancamento) currentScore++
        if (current.detalhes) currentScore++
        if (current.numeroDocumento) currentScore++
        if (current.description && current.description.length > 20) currentScore++
        
        return currentScore > bestScore ? current : best
      })
      
      // Combina informações úteis de todas as duplicatas
      const mergedTx: Transaction = {
        ...mostComplete,
        // Combina detalhes se algum tiver mais informação
        detalhes: duplicates
          .map(tx => tx.detalhes)
          .filter(Boolean)
          .reduce((best, current) => current.length > best.length ? current : best, mostComplete.detalhes || ''),
        // Mantém o número de documento mais completo
        numeroDocumento: duplicates
          .map(tx => tx.numeroDocumento)
          .filter(Boolean)
          .reduce((best, current) => current.length > best.length ? current : best, mostComplete.numeroDocumento || ''),
        // Descrição combinada (sem duplicar)
        description: duplicates
          .map(tx => tx.description)
          .filter(Boolean)
          .reduce((best, current) => {
            const normalizedBest = normalizeText(best)
            const normalizedCurrent = normalizeText(current)
            // Se a atual tem mais informação e não é substring da melhor, usa ela
            if (current.length > best.length && !normalizedBest.includes(normalizedCurrent)) {
              return `${best} | ${current}`
            }
            return best
          }, mostComplete.description),
      }
      
      merged.push(mergedTx)
      processed.add(key1)
      
      console.log(`Merged ${duplicates.length} transações duplicadas: ${mergedTx.description.substring(0, 50)}...`)
    } else {
      // Não tem duplicatas, adiciona normalmente
      merged.push(tx1)
      processed.add(key1)
    }
  }
  
  return merged
}

