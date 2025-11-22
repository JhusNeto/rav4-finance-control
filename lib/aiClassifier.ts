import { Category, TransactionType } from './classification'

// Sistema de aprendizado baseado em histórico e similaridade de texto
interface ClassificationExample {
  description: string
  category: Category
  type: TransactionType
  amount: number
}

// Armazena exemplos aprendidos
const LEARNED_EXAMPLES_KEY = 'rav4-learned-classifications'

// Carrega exemplos aprendidos do localStorage
function loadLearnedExamples(): ClassificationExample[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(LEARNED_EXAMPLES_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Salva exemplos aprendidos no localStorage
function saveLearnedExamples(examples: ClassificationExample[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(LEARNED_EXAMPLES_KEY, JSON.stringify(examples))
  } catch (error) {
    console.error('Erro ao salvar exemplos aprendidos:', error)
  }
}

// Normaliza texto para comparação
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
}

// Calcula similaridade entre duas strings usando Jaccard similarity
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1).split(' '))
  const words2 = new Set(normalizeText(text2).split(' '))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

// Calcula similaridade usando palavras-chave importantes
export function calculateKeywordSimilarity(text1: string, text2: string): number {
  const words1 = normalizeText(text1).split(' ').filter(w => w.length > 3)
  const words2 = normalizeText(text2).split(' ').filter(w => w.length > 3)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  let matches = 0
  words1.forEach(word => {
    if (words2.includes(word)) matches++
  })
  
  return matches / Math.max(words1.length, words2.length)
}

// Encontra a melhor correspondência nos exemplos aprendidos
function findBestMatch(
  description: string,
  amount: number,
  learnedExamples: ClassificationExample[]
): ClassificationExample | null {
  if (learnedExamples.length === 0) return null
  
  let bestMatch: ClassificationExample | null = null
  let bestScore = 0
  
  learnedExamples.forEach(example => {
    // Calcula similaridade combinada
    const textSimilarity = calculateSimilarity(description, example.description)
    const keywordSimilarity = calculateKeywordSimilarity(description, example.description)
    
    // Bonus se o valor está na mesma faixa
    const amountSimilarity = Math.abs(amount - example.amount) < 100 ? 0.2 : 0
    
    const totalScore = (textSimilarity * 0.5) + (keywordSimilarity * 0.3) + amountSimilarity
    
    if (totalScore > bestScore && totalScore > 0.4) { // Threshold mínimo
      bestScore = totalScore
      bestMatch = example
    }
  })
  
  return bestMatch
}

// Classifica usando IA baseada em aprendizado
export function classifyWithAI(
  description: string,
  amount: number,
  fallbackClassification: { category: Category; type: TransactionType }
): { category: Category; type: TransactionType; confidence: number; source: 'learned' | 'rules' } {
  const learnedExamples = loadLearnedExamples()
  const match = findBestMatch(description, amount, learnedExamples)
  
  if (match) {
    return {
      category: match.category,
      type: match.type,
      confidence: 0.8,
      source: 'learned'
    }
  }
  
  return {
    ...fallbackClassification,
    confidence: 0.6,
    source: 'rules'
  }
}

// Aprende uma nova classificação (quando usuário corrige)
export function learnClassification(
  description: string,
  amount: number,
  category: Category,
  type: TransactionType
): void {
  const learnedExamples = loadLearnedExamples()
  
  // Adiciona novo exemplo
  const newExample: ClassificationExample = {
    description: normalizeText(description),
    category,
    type,
    amount
  }
  
  // Remove duplicatas (mesma descrição normalizada)
  const filtered = learnedExamples.filter(
    ex => normalizeText(ex.description) !== normalizeText(description)
  )
  
  // Adiciona no início (mais recentes têm prioridade)
  filtered.unshift(newExample)
  
  // Mantém apenas os últimos 500 exemplos (evita localStorage ficar muito grande)
  const limited = filtered.slice(0, 500)
  
  saveLearnedExamples(limited)
}

// Remove um exemplo aprendido
export function unlearnClassification(description: string): void {
  const learnedExamples = loadLearnedExamples()
  const filtered = learnedExamples.filter(
    ex => normalizeText(ex.description) !== normalizeText(description)
  )
  saveLearnedExamples(filtered)
}

// Estatísticas de aprendizado
export function getLearningStats(): {
  totalExamples: number
  categories: Record<Category, number>
} {
  const learnedExamples = loadLearnedExamples()
  const categories: Record<string, number> = {}
  
  learnedExamples.forEach(ex => {
    categories[ex.category] = (categories[ex.category] || 0) + 1
  })
  
  return {
    totalExamples: learnedExamples.length,
    categories: categories as Record<Category, number>
  }
}

// Limpa todos os exemplos aprendidos
export function clearLearnedExamples(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LEARNED_EXAMPLES_KEY)
}

