import { Transaction } from './classification'
import { FinanceGoals } from '@/store/financeStore'

export interface FinanceData {
  transactions: Transaction[]
  initialBalance: number
  salary: number
  goals: FinanceGoals
  currentDate: string
  customCategories?: string[]
  mode?: any // ModeState serializado
  weeklyGoal?: number
  rav4Target?: number
  rav4TargetDate?: string
  rav4StartDate?: string
  exportedAt: string
  version: string
}

const CURRENT_VERSION = '1.0.0'

export function exportToJSON(
  transactions: Transaction[],
  initialBalance: number,
  salary: number,
  goals: FinanceGoals,
  currentDate: Date,
  customCategories?: string[]
): string {
  const data: FinanceData = {
    transactions,
    initialBalance,
    salary,
    goals,
    currentDate: currentDate.toISOString(),
    customCategories: customCategories || [],
    exportedAt: new Date().toISOString(),
    version: CURRENT_VERSION,
  }
  
  return JSON.stringify(data, null, 2)
}

export function importFromJSON(jsonString: string): FinanceData | null {
  try {
    const data = JSON.parse(jsonString) as FinanceData
    
    // Validação básica
    if (!data.transactions || !Array.isArray(data.transactions)) {
      throw new Error('Formato inválido: transactions não encontrado')
    }
    
    // Converte strings de data de volta para Date objects
    const transactions = data.transactions.map(t => ({
      ...t,
      date: new Date(t.date)
    }))
    
    return {
      ...data,
      transactions,
      currentDate: data.currentDate ? new Date(data.currentDate).toISOString() : new Date().toISOString(),
      customCategories: data.customCategories || [],
    }
  } catch (error) {
    console.error('Erro ao importar JSON:', error)
    return null
  }
}

export function downloadJSON(data: string, filename: string = 'rav4-finance-data.json'): void {
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function readJSONFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resolve(e.target.result)
      } else {
        reject(new Error('Erro ao ler arquivo'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsText(file)
  })
}

