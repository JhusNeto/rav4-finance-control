import { create } from 'zustand'
import { Transaction, Category } from '@/lib/classification'
import { MonthlyMetrics, CategoryMetrics, Alert } from '@/lib/projections'
import { saveToServer } from '@/lib/dataPersistence'
import { ModeState, AppMode } from '@/lib/modes'

export interface FinanceGoals {
  PIX_SAIDA: number
  ALIMENTACAO_FORA: number
  ASSINATURAS: number
  DIVIDAS_CDC: number
  [key: string]: number
}

interface FinanceState {
  transactions: Transaction[]
  initialBalance: number
  salary: number
  goals: FinanceGoals
  currentDate: Date
  customCategories: string[] // Categorias customizadas criadas pelo usuário
  mode: ModeState // Modo atual do sistema
  weeklyGoal: number // Meta semanal de gastos
  rav4Target: number // Objetivo macro do Projeto RAV4
  rav4TargetDate: Date // Data alvo do Projeto RAV4
  rav4StartDate: Date // Data de início do Projeto RAV4
  
  // Actions
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  setInitialBalance: (balance: number) => void
  setSalary: (salary: number) => void
  setGoal: (category: Category, value: number) => void
  setCurrentDate: (date: Date) => void
  addCustomCategory: (category: string) => void
  clearTransactions: () => Promise<void>
  loadFromStorage: () => void
  saveToStorage: () => void
  setMode: (mode: ModeState) => void
  setWeeklyGoal: (goal: number) => void
  setRAV4Target: (target: number, targetDate: Date, startDate: Date) => void
}

const defaultGoals: FinanceGoals = {
  PIX_SAIDA: 500,
  ALIMENTACAO_FORA: 800,
  ASSINATURAS: 200,
  DIVIDAS_CDC: 1000,
}

const STORAGE_KEY = 'rav4-finance-storage'

// Funções de persistência
function loadFromLocalStorage(): Partial<FinanceState> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    
    // Converte datas de string para Date
    if (parsed.transactions) {
      parsed.transactions = parsed.transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date)
      }))
    }
    if (parsed.currentDate) {
      parsed.currentDate = new Date(parsed.currentDate)
    }
    
    return parsed
  } catch (e) {
    console.error('Erro ao carregar do localStorage:', e)
    return null
  }
}

function saveToLocalStorage(state: FinanceState): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e)
  }
}

export const useFinanceStore = create<FinanceState>((set, get) => {
  // Estado inicial sempre igual (não carrega do localStorage aqui para evitar hydration mismatch)
  return {
    transactions: [],
    initialBalance: 0,
    salary: 5000,
    goals: defaultGoals,
    currentDate: new Date(),
    customCategories: [],
    mode: {
      currentMode: 'normal',
      activatedAt: null,
      reason: '',
      restrictions: {
        blockedCategories: [],
        maxDailySpending: null,
        maxCategorySpending: {}
      }
    },
    weeklyGoal: 1000, // Meta semanal padrão
    rav4Target: 50000, // Objetivo macro padrão: R$ 50.000
    rav4TargetDate: (() => {
      const date = new Date()
      date.setMonth(date.getMonth() + 12) // 12 meses a partir de agora
      return date
    })(),
    rav4StartDate: new Date(), // Data de início padrão: hoje

    setTransactions: (transactions) => {
      set({ transactions })
      const state = get()
      // Salva em background (não bloqueia a UI)
      saveToServer(
        transactions,
        state.initialBalance,
        state.salary,
        state.goals,
        state.currentDate,
        state.customCategories
      ).catch(err => console.error('Erro ao salvar transações:', err))
    },
    
    addTransaction: (transaction) => {
      const newTransactions = [...get().transactions, transaction]
      set({ transactions: newTransactions })
      const state = get()
      saveToServer(
        newTransactions,
        state.initialBalance,
        state.salary,
        state.goals,
        state.currentDate,
        state.customCategories
      ).catch(err => console.error('Erro ao salvar transação:', err))
    },
    
    setInitialBalance: (balance) => {
      set({ initialBalance: balance })
      const state = get()
      saveToServer(
        state.transactions,
        balance,
        state.salary,
        state.goals,
        state.currentDate,
        state.customCategories
      ).catch(err => console.error('Erro ao salvar saldo inicial:', err))
    },
    
    setSalary: (salary) => {
      set({ salary })
      const state = get()
      saveToServer(
        state.transactions,
        state.initialBalance,
        salary,
        state.goals,
        state.currentDate,
        state.customCategories
      ).catch(err => console.error('Erro ao salvar salário:', err))
    },
    
    setGoal: (category, value) => {
      const newGoals = { ...get().goals, [category]: value }
      set({ goals: newGoals })
      const state = get()
      saveToServer(
        state.transactions,
        state.initialBalance,
        state.salary,
        newGoals,
        state.currentDate,
        state.customCategories
      ).catch(err => console.error('Erro ao salvar meta:', err))
    },
    
    setCurrentDate: (date) => {
      set({ currentDate: date })
      const state = get()
      saveToServer(
        state.transactions,
        state.initialBalance,
        state.salary,
        state.goals,
        date
      ).catch(err => console.error('Erro ao salvar data:', err))
    },
    
    addCustomCategory: (category: string) => {
      const state = get()
      const normalizedCategory = category.trim()
      
      // Não adiciona se já existe
      if (state.customCategories.includes(normalizedCategory)) {
        return
      }
      
      // Não adiciona se é categoria padrão
      const STANDARD_CATEGORIES = [
        'ALIMENTACAO_DENTRO', 'ALIMENTACAO_FORA', 'PIX_SAIDA', 'PIX_ENTRADA',
        'ASSINATURAS', 'DIVIDAS_CDC', 'MERCADO', 'TRANSPORTE',
        'COMPRAS_GERAIS', 'TARIFAS', 'OUTROS'
      ]
      if (STANDARD_CATEGORIES.includes(normalizedCategory)) {
        return
      }
      
      const newCustomCategories = [...state.customCategories, normalizedCategory]
      set({ customCategories: newCustomCategories })
      
      // Salva no servidor
      saveToServer(
        state.transactions,
        state.initialBalance,
        state.salary,
        state.goals,
        state.currentDate,
        newCustomCategories
      ).catch(err => console.error('Erro ao salvar categoria customizada:', err))
    },
    
    clearTransactions: async () => {
      // Limpa o estado local
      set({ 
        transactions: [],
        initialBalance: 0,
        salary: 5000,
        goals: defaultGoals,
        customCategories: [],
        mode: {
          currentMode: 'normal',
          activatedAt: null,
          reason: '',
          restrictions: {
            blockedCategories: [],
            maxDailySpending: null,
            maxCategorySpending: {}
          }
        },
        weeklyGoal: 0,
        rav4Target: 50000,
        rav4TargetDate: (() => {
          const date = new Date()
          date.setMonth(date.getMonth() + 12)
          return date
        })(),
        rav4StartDate: new Date()
      })
      
      // Deleta do Supabase
      try {
        const { deleteFromSupabase } = await import('@/lib/supabase')
        const deleted = await deleteFromSupabase()
        if (deleted) {
          console.log('✅ Dados deletados do Supabase com sucesso')
        } else {
          console.warn('⚠️ Não foi possível deletar do Supabase (pode não estar configurado)')
        }
      } catch (err) {
        console.error('Erro ao deletar do Supabase:', err)
      }
    },
    
    setMode: (mode) => {
      set({ mode })
    },
    
    setWeeklyGoal: (goal) => {
      set({ weeklyGoal: goal })
      const state = get()
      saveToServer(
        state.transactions,
        state.initialBalance,
        state.salary,
        state.goals,
        state.currentDate,
        state.customCategories
      ).catch(err => console.error('Erro ao salvar meta semanal:', err))
    },
    
    setRAV4Target: (target, targetDate, startDate) => {
      set({ rav4Target: target, rav4TargetDate: targetDate, rav4StartDate: startDate })
      const state = get()
      saveToServer(
        state.transactions,
        state.initialBalance,
        state.salary,
        state.goals,
        state.currentDate,
        state.customCategories,
        state.mode,
        state.weeklyGoal,
        target,
        targetDate,
        startDate
      ).catch(err => console.error('Erro ao salvar objetivo RAV4:', err))
    },
    
    loadFromStorage: () => {
      // Carrega dados do servidor (JSON permanente)
      import('@/lib/dataPersistence').then(({ loadFromServer }) => {
        loadFromServer().then(stored => {
          if (stored) {
            set({
              transactions: stored.transactions || [],
              initialBalance: stored.initialBalance || 0,
              salary: stored.salary || 5000,
              goals: stored.goals || defaultGoals,
              currentDate: stored.currentDate ? new Date(stored.currentDate) : new Date(),
              customCategories: stored.customCategories || [],
              mode: stored.mode || {
                currentMode: 'normal',
                activatedAt: null,
                reason: '',
                restrictions: {
                  blockedCategories: [],
                  maxDailySpending: null,
                  maxCategorySpending: {}
                }
              },
              weeklyGoal: stored.weeklyGoal || 1000,
              rav4Target: stored.rav4Target || 50000,
              rav4TargetDate: stored.rav4TargetDate ? new Date(stored.rav4TargetDate) : (() => {
                const date = new Date()
                date.setMonth(date.getMonth() + 12)
                return date
              })(),
              rav4StartDate: stored.rav4StartDate ? new Date(stored.rav4StartDate) : new Date(),
            })
          }
        }).catch(err => console.error('Erro ao carregar dados:', err))
      })
    },
    
    saveToStorage: () => {
      const state = get()
      saveToServer(
        state.transactions,
        state.initialBalance,
        state.salary,
        state.goals,
        state.currentDate,
        state.customCategories
      ).catch(err => console.error('Erro ao salvar dados:', err))
    },
  }
})

