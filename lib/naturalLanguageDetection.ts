import { Transaction } from './classification'
import { normalizeText } from './aiClassifier'

export interface NaturalLanguageDetection {
  question: string
  confidence: number
  suggestion: string
  transactionId: string
}

/**
 * Sistema de Detecção por Linguagem Natural
 * Analisa transações e faz perguntas/sugestões em linguagem natural
 */
export class NaturalLanguageDetector {
  /**
   * Detecta padrões e gera perguntas em linguagem natural
   */
  static detectPatterns(transactions: Transaction[]): NaturalLanguageDetection[] {
    const detections: NaturalLanguageDetection[] = []
    
    // Analisa cada transação
    transactions.forEach(transaction => {
      const normalizedDesc = normalizeText(transaction.description)
      
      // 1. Detecção de comida fora
      if (this.looksLikeEatingOut(normalizedDesc, transaction)) {
        detections.push({
          question: `Este lançamento parece ser comida fora.`,
          confidence: 0.85,
          suggestion: `Considere categorizar como "Alimentação Fora" para melhor rastreamento.`,
          transactionId: transaction.id
        })
      }
      
      // 2. Detecção de PIX recorrente
      if (this.looksLikeRecurringPIX(transactions, transaction)) {
        detections.push({
          question: `Este PIX é recorrente?`,
          confidence: 0.75,
          suggestion: `Você já fez ${this.countSimilarPIX(transactions, transaction)} PIX para o mesmo destinatário este mês. Pode ser uma assinatura ou pagamento recorrente.`,
          transactionId: transaction.id
        })
      }
      
      // 3. Detecção de possível assinatura não categorizada
      if (this.looksLikeSubscription(normalizedDesc, transaction)) {
        detections.push({
          question: `Esta transação parece ser uma assinatura.`,
          confidence: 0.80,
          suggestion: `Considere categorizar como "Assinaturas" para melhor controle mensal.`,
          transactionId: transaction.id
        })
      }
      
      // 4. Detecção de gasto emocional
      if (this.looksLikeEmotionalSpending(transaction)) {
        detections.push({
          question: `Este gasto parece ser emocional.`,
          confidence: 0.70,
          suggestion: `Gasto feito após as 20h ou em valor acima do padrão. Considere revisar se era necessário.`,
          transactionId: transaction.id
        })
      }
      
      // 5. Detecção de possível erro/fraude
      if (this.looksLikeAnomaly(transactions, transaction)) {
        detections.push({
          question: `Esta transação parece incomum.`,
          confidence: 0.90,
          suggestion: `Valor muito acima do padrão ou destinatário incomum. Verifique se reconhece esta transação.`,
          transactionId: transaction.id
        })
      }
    })
    
    // Remove duplicatas e ordena por confiança
    return this.deduplicateDetections(detections)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10) // Top 10 detecções
  }
  
  /**
   * Verifica se parece ser comida fora
   */
  private static looksLikeEatingOut(description: string, transaction: Transaction): boolean {
    const foodKeywords = ['ifood', 'uber eats', 'rappi', 'lanche', 'restaurante', 'pizza', 'burger', 'mcdonalds', 'subway', 'kfc', 'delivery']
    const hasFoodKeyword = foodKeywords.some(keyword => description.includes(keyword))
    
    // Se já está categorizado como alimentação fora, não precisa detectar
    if (transaction.category === 'ALIMENTACAO_FORA') {
      return false
    }
    
    return hasFoodKeyword && transaction.type === 'SAIDA'
  }
  
  /**
   * Verifica se parece ser PIX recorrente
   */
  private static looksLikeRecurringPIX(transactions: Transaction[], transaction: Transaction): boolean {
    if (transaction.category !== 'PIX_SAIDA' && transaction.type !== 'SAIDA') {
      return false
    }
    
    // Conta quantos PIX similares existem
    const similarCount = this.countSimilarPIX(transactions, transaction)
    return similarCount >= 2 // Pelo menos 2 PIX para o mesmo destinatário
  }
  
  /**
   * Conta PIX similares (mesmo destinatário)
   */
  private static countSimilarPIX(transactions: Transaction[], transaction: Transaction): number {
    const normalizedDesc = normalizeText(transaction.description)
    
    return transactions.filter(t => {
      if (t.id === transaction.id) return false
      if (t.type !== 'SAIDA') return false
      
      const tDesc = normalizeText(t.description)
      // Extrai possível CPF/CNPJ ou nome do destinatário
      const transactionKey = this.extractRecipientKey(normalizedDesc)
      const tKey = this.extractRecipientKey(tDesc)
      
      return transactionKey && tKey && transactionKey === tKey
    }).length
  }
  
  /**
   * Extrai chave do destinatário (CPF, CNPJ ou parte do nome)
   */
  private static extractRecipientKey(description: string): string | null {
    // Tenta extrair CPF (11 dígitos)
    const cpfMatch = description.match(/\d{11}/)
    if (cpfMatch) return cpfMatch[0]
    
    // Tenta extrair CNPJ (14 dígitos)
    const cnpjMatch = description.match(/\d{14}/)
    if (cnpjMatch) return cnpjMatch[0]
    
    // Extrai primeiras palavras (nome do destinatário)
    const words = description.split(/\s+/).filter(w => w.length > 3)
    if (words.length >= 2) {
      return words.slice(0, 2).join(' ').toLowerCase()
    }
    
    return null
  }
  
  /**
   * Verifica se parece ser assinatura
   */
  private static looksLikeSubscription(description: string, transaction: Transaction): boolean {
    if (transaction.category === 'ASSINATURAS') {
      return false
    }
    
    const subscriptionKeywords = ['netflix', 'spotify', 'disney', 'prime', 'gympass', 'assinatura', 'mensalidade', 'plano']
    const hasSubscriptionKeyword = subscriptionKeywords.some(keyword => description.includes(keyword))
    
    return hasSubscriptionKeyword && transaction.type === 'SAIDA'
  }
  
  /**
   * Verifica se parece ser gasto emocional
   */
  private static looksLikeEmotionalSpending(transaction: Transaction): boolean {
    if (transaction.type !== 'SAIDA') return false
    
    const hour = transaction.date.getHours()
    const isLateNight = hour >= 20 || hour <= 2
    const isHighValue = Math.abs(transaction.amount) > 200
    
    return isLateNight || isHighValue
  }
  
  /**
   * Verifica se parece ser anomalia
   */
  private static looksLikeAnomaly(transactions: Transaction[], transaction: Transaction): boolean {
    if (transaction.type !== 'SAIDA') return false
    
    const amount = Math.abs(transaction.amount)
    
    // Calcula média de gastos similares
    const similarTransactions = transactions.filter(t => 
      t.id !== transaction.id &&
      t.type === 'SAIDA' &&
      t.category === transaction.category
    )
    
    if (similarTransactions.length === 0) return false
    
    const avgAmount = similarTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / similarTransactions.length
    
    // Se o valor é mais de 3x a média, é anomalia
    return amount > avgAmount * 3
  }
  
  /**
   * Remove detecções duplicadas
   */
  private static deduplicateDetections(detections: NaturalLanguageDetection[]): NaturalLanguageDetection[] {
    const seen = new Set<string>()
    return detections.filter(detection => {
      const key = `${detection.transactionId}-${detection.question}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }
}

