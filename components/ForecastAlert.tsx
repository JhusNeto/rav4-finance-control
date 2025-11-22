'use client'

import { ForecastResult } from '@/lib/projections'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingDown, Calendar, DollarSign } from 'lucide-react'

interface ForecastAlertProps {
  forecast: ForecastResult
}

export function ForecastAlert({ forecast }: ForecastAlertProps) {
  if (!forecast.willGoNegative) {
    return null
  }

  const severity = forecast.negativeAmount > 1000 ? 'high' : forecast.negativeAmount > 500 ? 'medium' : 'low'
  
  const getSeverityColor = () => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'medium':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
      default:
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
    }
  }

  const formatNegativeDate = () => {
    if (!forecast.negativeDate) return null
    
    const today = new Date()
    const isToday = forecast.negativeDate.toDateString() === today.toDateString()
    const isEndOfMonth = forecast.negativeDate.toDateString() === forecast.projectionDate.toDateString()
    
    if (isToday) return 'hoje'
    if (isEndOfMonth) return `dia ${forecast.projectionDate.getDate()}`
    
    return formatDate(forecast.negativeDate)
  }

  return (
    <Card className={`border-2 ${getSeverityColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Previsão de Rombo
        </CardTitle>
        <CardDescription>
          Projeção baseada no ritmo atual de gastos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mensagem Principal */}
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
          <TrendingDown className="h-4 w-4" />
          <AlertTitle className="text-red-400">Atenção: Rombo Projetado</AlertTitle>
          <AlertDescription className="text-red-300/90 mt-2 space-y-2">
            <p className="font-semibold text-base">
              Se continuar assim, você fecha em <span className="text-red-400 font-bold">-{formatCurrency(forecast.negativeAmount)}</span> no dia {forecast.projectionDate.getDate()}.
            </p>
            
            {forecast.negativeDate && forecast.daysUntilNegative !== null && (
              <div className="flex items-center gap-2 text-sm mt-3 pt-2 border-t border-red-500/20">
                <Calendar className="h-4 w-4" />
                <span>
                  {forecast.daysUntilNegative === 0 
                    ? 'Saldo já está negativo ou ficará negativo hoje'
                    : forecast.daysUntilNegative === 1
                    ? 'Ficará negativo amanhã'
                    : `Ficará negativo em ${forecast.daysUntilNegative} dias (${formatNegativeDate()})`
                  }
                </span>
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Detalhes da Projeção */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" />
              Saldo Projetado
            </div>
            <div className="text-lg font-bold text-red-400">
              {formatCurrency(forecast.projectedBalance)}
            </div>
          </div>
          
          {forecast.daysUntilNegative !== null && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                Dias Restantes
              </div>
              <div className="text-lg font-bold">
                {forecast.daysUntilNegative} {forecast.daysUntilNegative === 1 ? 'dia' : 'dias'}
              </div>
            </div>
          )}
        </div>

        {/* Recomendações */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Recomendação:</strong> Reduza gastos em {formatCurrency(forecast.negativeAmount / (forecast.daysRemaining || 1))} por dia para evitar o rombo.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

