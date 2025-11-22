'use client'

import { HeatmapDay } from '@/lib/heatmap'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface HeatmapViewProps {
  days: HeatmapDay[]
}

export function HeatmapView({ days }: HeatmapViewProps) {
  const getIntensityColor = (intensity: HeatmapDay['intensity'], isToday: boolean, isFuture: boolean) => {
    if (isFuture) return 'bg-muted/30 border-muted'
    if (isToday) return 'ring-2 ring-primary ring-offset-2'
    
    switch (intensity) {
      case 'critical':
        return 'bg-red-600 hover:bg-red-700 border-red-500'
      case 'high':
        return 'bg-red-500 hover:bg-red-600 border-red-400'
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400'
      case 'low':
        return 'bg-green-500 hover:bg-green-600 border-green-400'
      default:
        return 'bg-muted hover:bg-muted/80 border-border'
    }
  }
  
  const getIntensityLabel = (intensity: HeatmapDay['intensity']) => {
    switch (intensity) {
      case 'critical':
        return 'Dia Crítico'
      case 'high':
        return 'Dia Caro'
      case 'medium':
        return 'Dia Moderado'
      case 'low':
        return 'Dia Seguro'
      default:
        return 'Sem Gastos'
    }
  }
  
  // Agrupa por semana (7 dias)
  const weeks: HeatmapDay[][] = []
  let currentWeek: HeatmapDay[] = []
  
  days.forEach((day, index) => {
    currentWeek.push(day)
    
    // A cada 7 dias ou no último dia, fecha a semana
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Heatmap de Gastos
        </CardTitle>
        <CardDescription>
          Visualização de dias mais caros (vermelho) e mais seguros (verde)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex gap-1">
              {week.map((day) => (
                <Tooltip key={day.date.toISOString()}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex-1 aspect-square rounded border cursor-pointer transition-all',
                        'flex flex-col items-center justify-center text-xs',
                        getIntensityColor(day.intensity, day.isToday, day.isFuture)
                      )}
                    >
                      <span className={cn(
                        'font-medium',
                        day.intensity === 'none' || day.isFuture ? 'text-muted-foreground' : 'text-white'
                      )}>
                        {day.dayOfMonth}
                      </span>
                      {day.totalSpending > 0 && !day.isFuture && (
                        <span className={cn(
                          'text-[10px] mt-0.5',
                          day.intensity === 'low' ? 'text-green-100' : 'text-white'
                        )}>
                          {formatCurrency(day.totalSpending).replace('R$', '').trim()}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{formatDate(day.date)}</p>
                      <p>{getIntensityLabel(day.intensity)}</p>
                      {day.totalSpending > 0 && (
                        <>
                          <p>Total: {formatCurrency(day.totalSpending)}</p>
                          <p>{day.transactionCount} transação(ões)</p>
                        </>
                      )}
                      {day.isToday && <p className="text-primary">Hoje</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        
        {/* Legenda */}
        <div className="mt-6 flex items-center justify-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 border border-green-400" />
            <span>Dia Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-400" />
            <span>Dia Moderado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500 border border-red-400" />
            <span>Dia Caro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-600 border border-red-500" />
            <span>Dia Crítico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/30 border border-muted" />
            <span>Sem Gastos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

