import { Transaction } from './classification'
import { startOfMonth, endOfMonth, eachDayOfInterval, getDate, format, isSameDay } from 'date-fns'

export interface HeatmapDay {
  date: Date
  dayOfMonth: number
  totalSpending: number
  transactionCount: number
  intensity: 'none' | 'low' | 'medium' | 'high' | 'critical'
  isToday: boolean
  isFuture: boolean
}

/**
 * Gera dados para Heatmap de gastos diários
 * Mostra dias mais caros e mais seguros
 */
export function generateHeatmapData(
  transactions: Transaction[],
  month: Date = new Date()
): HeatmapDay[] {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const today = new Date()
  
  // Todos os dias do mês
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Agrupa transações por dia
  const spendingByDay = new Map<string, { total: number; count: number }>()
  
  transactions
    .filter(t => t.type === 'SAIDA' && isSameMonth(t.date, month))
    .forEach(t => {
      const dayKey = format(t.date, 'yyyy-MM-dd')
      const current = spendingByDay.get(dayKey) || { total: 0, count: 0 }
      spendingByDay.set(dayKey, {
        total: current.total + Math.abs(t.amount),
        count: current.count + 1
      })
    })
  
  // Calcula estatísticas para determinar intensidade
  const allTotals = Array.from(spendingByDay.values()).map(d => d.total)
  const maxSpending = Math.max(...allTotals, 0)
  const avgSpending = allTotals.length > 0
    ? allTotals.reduce((sum, val) => sum + val, 0) / allTotals.length
    : 0
  
  // Gera dados para cada dia
  return allDays.map(date => {
    const dayKey = format(date, 'yyyy-MM-dd')
    const dayData = spendingByDay.get(dayKey) || { total: 0, count: 0 }
    const isToday = isSameDay(date, today)
    const isFuture = date > today
    
    // Determina intensidade baseada no gasto
    let intensity: HeatmapDay['intensity'] = 'none'
    if (dayData.total > 0) {
      if (dayData.total >= maxSpending * 0.8) {
        intensity = 'critical'
      } else if (dayData.total >= avgSpending * 1.5) {
        intensity = 'high'
      } else if (dayData.total >= avgSpending) {
        intensity = 'medium'
      } else {
        intensity = 'low'
      }
    }
    
    return {
      date,
      dayOfMonth: getDate(date),
      totalSpending: dayData.total,
      transactionCount: dayData.count,
      intensity,
      isToday,
      isFuture
    }
  })
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth()
}

