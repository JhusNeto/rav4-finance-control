import { createClient } from '@supabase/supabase-js'
import { Transaction } from './classification'
import { FinanceGoals } from '@/store/financeStore'

// Tipos para o Supabase
export interface FinanceDataRow {
  id: string
  user_id?: string // Para suporte multi-usuário futuro
  transactions: Transaction[]
  initial_balance: number
  salary: number
  goals: FinanceGoals
  current_date_value: string // Renomeado de current_date (palavra reservada PostgreSQL)
  custom_categories?: string[]
  mode?: any
  weekly_goal?: number
  rav4_target?: number
  rav4_target_date?: string
  rav4_start_date?: string
  created_at?: string
  updated_at?: string
}

// Cliente Supabase (criado condicionalmente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cria cliente apenas se as variáveis estiverem configuradas
// Caso contrário, retorna null e o sistema usa fallback
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Não precisamos de autenticação por enquanto
      }
    })
  : null

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // Apenas loga no servidor para evitar spam no console do cliente
    console.error('❌ Variáveis de ambiente do Supabase não configuradas! Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local')
  }
}

// Nome da tabela
const TABLE_NAME = 'finance_data'

/**
 * Salva dados financeiros no Supabase
 */
export async function saveToSupabase(
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
  try {
    if (!supabase || !supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase não configurado! Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local')
      return false
    }

    // Serializa transações convertendo Date para string ISO
    const serializedTransactions = transactions.map(t => ({
      ...t,
      date: t.date instanceof Date ? t.date.toISOString() : t.date
    }))

    const data: FinanceDataRow = {
      id: 'main', // ID único para o usuário principal (pode ser expandido para multi-usuário)
      transactions: serializedTransactions as any, // Supabase JSONB aceita arrays
      initial_balance: initialBalance,
      salary,
      goals: goals as any,
      current_date_value: currentDate.toISOString(),
      custom_categories: customCategories || [],
      mode: mode ? JSON.parse(JSON.stringify(mode)) : null,
      weekly_goal: weeklyGoal,
      rav4_target: rav4Target,
      rav4_target_date: rav4TargetDate?.toISOString(),
      rav4_start_date: rav4StartDate?.toISOString(),
      updated_at: new Date().toISOString()
    }

    // Usa upsert para criar ou atualizar
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(data, {
        onConflict: 'id'
      })

    if (error) {
      console.error('Erro ao salvar no Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao salvar no Supabase:', error)
    return false
  }
}

/**
 * Carrega dados financeiros do Supabase
 */
export async function loadFromSupabase(): Promise<Partial<FinanceDataRow> | null> {
  try {
    if (!supabase || !supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase não configurado! Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local')
      return null
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', 'main')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado
        return null
      }
      console.error('Erro ao carregar do Supabase:', error)
      return null
    }

    if (!data) {
      return null
    }

    // Converte dados do Supabase (snake_case) para o formato esperado (camelCase)
    const result: any = {
      transactions: (data.transactions as any) || [],
      initialBalance: data.initial_balance || 0,
      salary: data.salary || 5000,
      goals: (data.goals as any) || {},
      currentDate: data.current_date_value ? new Date(data.current_date_value) : new Date(),
      customCategories: data.custom_categories || [],
      mode: data.mode,
      weeklyGoal: data.weekly_goal,
      rav4Target: data.rav4_target,
      rav4TargetDate: data.rav4_target_date ? new Date(data.rav4_target_date) : undefined,
      rav4StartDate: data.rav4_start_date ? new Date(data.rav4_start_date) : undefined,
    }

    // Converte datas das transações de string para Date
    if (result.transactions && Array.isArray(result.transactions)) {
      result.transactions = result.transactions.map((t: any) => {
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

    return result
  } catch (error) {
    console.error('Erro ao carregar do Supabase:', error)
    return null
  }
}

/**
 * Deleta todos os dados do Supabase
 */
export async function deleteFromSupabase(): Promise<boolean> {
  try {
    if (!supabase || !supabaseUrl || !supabaseAnonKey) {
      return false
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', 'main')

    if (error) {
      console.error('Erro ao deletar do Supabase:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao deletar do Supabase:', error)
    return false
  }
}

