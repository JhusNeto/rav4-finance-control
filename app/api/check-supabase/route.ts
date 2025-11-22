import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { 
        error: 'Supabase não configurado',
        message: 'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local'
      },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data, error } = await supabase
      .from('finance_data')
      .select('*')
      .eq('id', 'main')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: 'Nenhum dado encontrado no Supabase',
          data: null
        })
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao consultar Supabase',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum dado encontrado',
        data: null
      })
    }

    // Processa os dados para retornar estatísticas
    const transactions = Array.isArray(data.transactions) ? data.transactions : []
    
    // Estatísticas por categoria
    const categoryStats: { [key: string]: { count: number; total: number; transactions: any[] } } = {}
    
    transactions.forEach((t: any) => {
      const category = t.category || 'Outros'
      const amount = parseFloat(t.amount || 0)
      
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, total: 0, transactions: [] }
      }
      
      categoryStats[category].count++
      categoryStats[category].total += amount
      categoryStats[category].transactions.push(t)
    })

    // Ordena transações por data (mais recentes primeiro)
    const sortedTransactions = [...transactions].sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })

    // Calcula totais
    const totalEntradas = transactions
      .filter((t: any) => t.type === 'ENTRADA')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)
    
    const totalSaidas = transactions
      .filter((t: any) => t.type === 'SAIDA')
      .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount || 0)), 0)

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        initialBalance: data.initial_balance,
        salary: data.salary,
        totalTransactions: transactions.length,
        totalEntradas,
        totalSaidas,
        balance: data.initial_balance + totalEntradas - totalSaidas,
        updatedAt: data.updated_at,
        createdAt: data.created_at,
        customCategories: data.custom_categories || [],
        rav4Target: data.rav4_target,
        rav4TargetDate: data.rav4_target_date,
        rav4StartDate: data.rav4_start_date,
        categoryStats: Object.entries(categoryStats)
          .map(([category, stats]) => ({
            category,
            count: stats.count,
            total: stats.total,
            average: stats.total / stats.count
          }))
          .sort((a, b) => Math.abs(b.total) - Math.abs(a.total)),
        recentTransactions: sortedTransactions.slice(0, 20),
        allTransactions: sortedTransactions
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro inesperado',
        message: error.message
      },
      { status: 500 }
    )
  }
}

