import { Transaction, Category } from './classification'
import { calculateSimilarity, calculateKeywordSimilarity, normalizeText } from './aiClassifier'

export interface SimilarTransaction {
  transaction: Transaction
  similarity: number
}

// Encontra transações similares a uma transação de referência
export function findSimilarTransactions(
  referenceTransaction: Transaction,
  allTransactions: Transaction[],
  threshold: number = 0.4
): SimilarTransaction[] {
  const similar: SimilarTransaction[] = []
  
  allTransactions.forEach(transaction => {
    // Ignora a própria transação
    if (transaction.id === referenceTransaction.id) {
      return
    }
    
    // Ignora se já tem a mesma categoria
    if (transaction.category === referenceTransaction.category) {
      return
    }
    
    // Calcula similaridade
    const textSimilarity = calculateSimilarity(
      referenceTransaction.description,
      transaction.description
    )
    const keywordSimilarity = calculateKeywordSimilarity(
      referenceTransaction.description,
      transaction.description
    )
    
    // Bonus se o valor está na mesma faixa (dentro de 20% de diferença)
    const amountDiff = Math.abs(transaction.amount - referenceTransaction.amount)
    const avgAmount = (transaction.amount + referenceTransaction.amount) / 2
    const amountSimilarity = avgAmount > 0 && amountDiff / avgAmount < 0.2 ? 0.2 : 0
    
    // Similaridade combinada
    const totalSimilarity = (textSimilarity * 0.5) + (keywordSimilarity * 0.3) + amountSimilarity
    
    if (totalSimilarity >= threshold) {
      similar.push({
        transaction,
        similarity: totalSimilarity
      })
    }
  })
  
  // Ordena por similaridade (maior primeiro)
  return similar.sort((a, b) => b.similarity - a.similarity)
}

// Agrupa transações similares por descrição normalizada
export function groupSimilarTransactions(
  transactions: Transaction[],
  threshold: number = 0.5
): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()
  
  transactions.forEach(transaction => {
    const normalized = normalizeText(transaction.description)
    let foundGroup = false
    
    // Procura grupo existente similar
    for (const [groupKey, groupTransactions] of groups.entries()) {
      const similarity = calculateSimilarity(normalized, groupKey)
      if (similarity >= threshold) {
        groupTransactions.push(transaction)
        foundGroup = true
        break
      }
    }
    
    // Se não encontrou grupo, cria novo
    if (!foundGroup) {
      groups.set(normalized, [transaction])
    }
  })
  
  return groups
}

