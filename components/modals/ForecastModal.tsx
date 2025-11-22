'use client'

import { CategoryForecast } from '@/lib/categoryForecast'
import { ForecastResult } from '@/lib/projections'
import { formatCurrency } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/classification'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar, AlertTriangle, Info } from 'lucide-react'

interface ForecastModalProps {
  forecast: CategoryForecast | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForecastModal({ forecast, open, onOpenChange }: ForecastModalProps) {
  if (!forecast) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Previsão Detalhada: {getCategoryLabel(forecast.category)}
          </DialogTitle>
          <DialogDescription>
            Análise completa da projeção mensal baseada no ritmo atual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Projeção Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projeção Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Se continuar neste ritmo:</p>
                <p className="text-4xl font-bold">{formatCurrency(forecast.projectedMonthly)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  em {getCategoryLabel(forecast.category)} este mês
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Detalhadas */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Gasto Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(forecast.currentTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {forecast.daysElapsed} dias decorridos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Média Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(forecast.dailyAverage)}</p>
                <p className="text-xs text-muted-foreground mt-1">por dia</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Dias Restantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{forecast.daysRemaining}</p>
                <p className="text-xs text-muted-foreground mt-1">até o fim do mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Tendência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {forecast.trend === 'increasing' ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-red-400" />
                      <p className="text-lg font-bold text-red-400">Aumentando</p>
                    </>
                  ) : forecast.trend === 'decreasing' ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-400 rotate-180" />
                      <p className="text-lg font-bold text-green-400">Diminuindo</p>
                    </>
                  ) : (
                    <>
                      <Info className="h-5 w-5 text-gray-400" />
                      <p className="text-lg font-bold text-gray-400">Estável</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mensagem */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed">{forecast.message}</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

