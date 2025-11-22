import { FinanceData, exportToJSON, importFromJSON } from './dataExport'
import { Transaction } from './classification'
import { FinanceGoals } from '@/store/financeStore'
import { saveToSupabase, loadFromSupabase } from './supabase'

export interface FinanceDataExtended {
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
}

const STORAGE_KEY = 'rav4-finance-storage'

// Salva no localStorage (fallback)
export function saveToLocalStorage(
  transactions: Transaction[],
  initialBalance: number,
  salary: number,
  goals: FinanceGoals,
  currentDate: Date
): void {
  if (typeof window === 'undefined') return
  
  try {
    const data = {
      transactions,
      initialBalance,
      salary,
      goals,
      currentDate: currentDate.toISOString(),
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e)
  }
}

// Carrega do localStorage (fallback)
export function loadFromLocalStorage(): Partial<FinanceData> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    
    // Converte datas de string para Date objects
    if (parsed.transactions) {
      parsed.transactions = parsed.transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }))
    }
    
    return parsed
  } catch (e) {
    console.error('Erro ao carregar do localStorage:', e)
    return null
  }
}

// Salva no Supabase (única fonte de persistência)
export async function saveToServer(
  transactions: Transaction[],
  initialBalance: number,
  salary: number,
  goals: FinanceGoals,
  currentDate: Date,
  customCategories?: string[],
  mode?: any,
  weeklyGoal?: number,
  rav4Target?: number,
  rav4TargetDate?: Date,
  rav4StartDate?: Date
): Promise<boolean> {
  // Salva apenas no Supabase
  const supabaseSuccess = await saveToSupabase(
    transactions,
    initialBalance,
    salary,
    goals,
    currentDate,
    customCategories,
    mode,
    weeklyGoal,
    rav4Target,
    rav4TargetDate,
    rav4StartDate
  )

  if (supabaseSuccess) {
    // Também salva no localStorage como backup local
    saveToLocalStorage(transactions, initialBalance, salary, goals, currentDate)
    return true
  }

  console.error('❌ Erro ao salvar no Supabase. Verifique as credenciais em .env.local')
  return false
}

// Carrega do Supabase (única fonte de persistência)
export async function loadFromServer(): Promise<Partial<FinanceData> | null> {
  // Carrega apenas do Supabase
  const supabaseData = await loadFromSupabase()
  
  if (supabaseData) {
    // loadFromSupabase já retorna no formato correto (camelCase)
    const data: any = supabaseData
    
    // Converte datas de string para Date objects
    if (data.transactions && Array.isArray(data.transactions)) {
      data.transactions = data.transactions.map((t: any) => {
        let date: Date
        if (t.date instanceof Date) {
          date = t.date
        } else if (typeof t.date === 'string') {
          date = new Date(t.date)
        } else {
          date = new Date()
        }
        
        if (isNaN(date.getTime())) {
          console.warn('Data inválida encontrada na transação:', t)
          date = new Date()
        }
        
        return {
          ...t,
          date
        }
      })
    }
    
    return data
  }

  // Se não tem dados no Supabase, tenta localStorage como último recurso
  console.warn('⚠️ Nenhum dado encontrado no Supabase. Tentando localStorage...')
  const localData = loadFromLocalStorage()
  
  if (localData) {
    console.warn('⚠️ Dados carregados do localStorage. Configure o Supabase para persistência permanente.')
  } else {
    console.warn('⚠️ Nenhum dado encontrado. Configure o Supabase e faça upload de um CSV.')
  }
  
  return localData
}

