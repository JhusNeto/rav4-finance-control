'use client'

import { useState, useEffect } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Filter } from 'lucide-react'
import { format } from 'date-fns'

export function DateFilter() {
  const [mounted, setMounted] = useState(false)
  const { currentDate, setCurrentDate, transactions } = useFinanceStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Encontra o primeiro e último mês disponível nas transações (só após montagem)
  const availableMonths = mounted && transactions.length > 0
    ? (() => {
        const dates = transactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime())
        const firstDate = dates[0]
        const lastDate = dates[dates.length - 1]
        const months: { year: number; month: number; label: string }[] = []
        
        let current = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
        const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)
        
        while (current <= end) {
          const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
          ]
          months.push({
            year: current.getFullYear(),
            month: current.getMonth(),
            label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`
          })
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
        }
        
        return months
      })()
    : []

  // Adiciona o mês atual se não houver transações
  if (availableMonths.length === 0) {
    const now = new Date()
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    availableMonths.push({
      year: now.getFullYear(),
      month: now.getMonth(),
      label: `${monthNames[now.getMonth()]} ${now.getFullYear()}`
    })
  }

  const handleMonthChange = (year: number, month: number) => {
    // Define para o primeiro dia do mês selecionado
    setCurrentDate(new Date(year, month, 1))
  }


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtro Temporal
        </CardTitle>
        <CardDescription>
          Selecione o período para visualizar os dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Seletor de Mês/Ano */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período Selecionado
            </label>
            <div className="flex items-center gap-2">
              <select
                value={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-').map(Number)
                  handleMonthChange(year, month)
                }}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {availableMonths.map((m) => (
                  <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navegação Rápida */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                setCurrentDate(prevMonth)
              }}
              className="flex-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              ← Mês Anterior
            </button>
            <button
              onClick={() => {
                const today = new Date()
                setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
              }}
              className="flex-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => {
                const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                setCurrentDate(nextMonth)
              }}
              className="flex-1 px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Próximo Mês →
            </button>
          </div>

          {/* Informações do Período */}
          {mounted && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <strong>Período:</strong> {format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'dd/MM/yyyy')} até{' '}
                  {format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'dd/MM/yyyy')}
                </div>
                {transactions.length > 0 && (
                  <div>
                    <strong>Transações disponíveis:</strong> {availableMonths.length} {availableMonths.length === 1 ? 'mês' : 'meses'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

