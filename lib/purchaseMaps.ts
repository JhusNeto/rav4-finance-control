import { Transaction } from './classification'
import { getHours, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

export interface HourlySpending {
  hour: number
  total: number
  count: number
  average: number
}

export interface StoreSpending {
  store: string
  total: number
  count: number
  average: number
  category: string
}

export interface CategorySpendingMap {
  category: string
  total: number
  count: number
  percentage: number
}

/**
 * Gera mapa de gastos por horário
 */
export function generateHourlyMap(
  transactions: Transaction[]
): HourlySpending[] {
  const hourlyData = new Map<number, { total: number; count: number }>()
  
  transactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      const hour = getHours(t.date)
      const current = hourlyData.get(hour) || { total: 0, count: 0 }
      hourlyData.set(hour, {
        total: current.total + Math.abs(t.amount),
        count: current.count + 1
      })
    })
  
  return Array.from({ length: 24 }, (_, hour) => {
    const data = hourlyData.get(hour) || { total: 0, count: 0 }
    return {
      hour,
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0
    }
  })
}

/**
 * Gera mapa de gastos por loja/estabelecimento
 */
export function generateStoreMap(
  transactions: Transaction[]
): StoreSpending[] {
  const storeMap = new Map<string, { total: number; count: number; category: string }>()
  
  transactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      // Extrai nome da loja da descrição
      const store = extractStoreName(t)
      
      const current = storeMap.get(store) || { total: 0, count: 0, category: t.category }
      storeMap.set(store, {
        total: current.total + Math.abs(t.amount),
        count: current.count + 1,
        category: t.category
      })
    })
  
  return Array.from(storeMap.entries())
    .map(([store, data]) => ({
      store,
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0,
      category: data.category
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20) // Top 20 lojas
}

/**
 * Gera mapa de gastos por tipo/categoria
 */
export function generateCategoryMap(
  transactions: Transaction[]
): CategorySpendingMap[] {
  const categoryMap = new Map<string, { total: number; count: number }>()
  
  const totalSpending = transactions
    .filter(t => t.type === 'SAIDA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  transactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      const current = categoryMap.get(t.category) || { total: 0, count: 0 }
      categoryMap.set(t.category, {
        total: current.total + Math.abs(t.amount),
        count: current.count + 1
      })
    })
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Extrai nome da loja da descrição da transação
 */
function extractStoreName(transaction: Transaction): string {
  // Tenta usar detalhes primeiro
  if (transaction.detalhes && transaction.detalhes.trim()) {
    // Remove informações de data/hora
    const cleaned = transaction.detalhes
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
      .replace(/\d{2}:\d{2}/g, '')
      .trim()
    
    if (cleaned.length > 0 && cleaned.length < 50) {
      return cleaned
    }
  }
  
  // Fallback para descrição
  const desc = transaction.description
    .replace(/PIX/i, '')
    .replace(/ENVIADO/i, '')
    .replace(/SAIDA/i, '')
    .replace(/DEBITO/i, '')
    .replace(/CREDITO/i, '')
    .trim()
  
  // Limita tamanho e remove caracteres especiais excessivos
  return desc.substring(0, 40) || 'Estabelecimento desconhecido'
}

