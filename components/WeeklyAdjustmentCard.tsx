'use client'

import { WeeklyAdjustment } from '@/lib/weeklyAdjustment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface WeeklyAdjustmentCardProps {
  adjustments: WeeklyAdjustment[]
}

export function WeeklyAdjustmentCard({ adjustments }: WeeklyAdjustmentCardProps) {
  if (adjustments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Auto-ajuste Semanal
          </CardTitle>
          <CardDescription>
            Aguardando dados da semana...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const latestAdjustment = adjustments[adjustments.length - 1]
  const hasAdjustment = latestAdjustment.adjustment !== 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Auto-ajuste Semanal
        </CardTitle>
        <CardDescription>
          Recalibração automática do resto do mês baseada no gasto atual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Último ajuste */}
        {hasAdjustment && (
          <Alert variant={latestAdjustment.adjustment > 0 ? 'destructive' : 'default'}>
            <AlertTitle className="flex items-center gap-2">
              {latestAdjustment.adjustment > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              Ajuste Automático Aplicado
            </AlertTitle>
            <AlertDescription>
              <p className="font-medium mb-2">{latestAdjustment.message}</p>
              <p className="text-sm">{latestAdjustment.recommendation}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Histórico de semanas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Histórico Semanal</h4>
          {adjustments.map((adj) => (
            <div
              key={adj.weekNumber}
              className="p-3 rounded-lg border bg-card/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-sm">
                    Semana {adj.weekNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(adj.weekStart)} - {formatDate(adj.weekEnd)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">
                    {formatCurrency(adj.actualSpending)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Proj: {formatCurrency(adj.projectedSpending)}
                  </div>
                </div>
              </div>
              
              {adj.adjustment !== 0 && (
                <div className={`flex items-center gap-1 text-xs mt-2 ${
                  adj.adjustment > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {adj.adjustment > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {adj.adjustment > 0 ? '+' : ''}{formatCurrency(adj.adjustment)}
                  </span>
                </div>
              )}
              
              <div className="mt-2 pt-2 border-t border-border text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Novo limite diário:</span>
                  <span className="font-medium">{formatCurrency(adj.newDailyLimit)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

