'use client'

import { Category, getCategoryLabel, getCategoryColor } from '@/lib/classification'
import { CategoryMetrics } from '@/lib/projections'
import { CategoryForecast } from '@/lib/categoryForecast'
import { formatCurrency } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

interface CategoryModalProps {
  category: Category | null
  metrics: CategoryMetrics | null
  forecast: CategoryForecast | null
  transactions: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryModal({ 
  category, 
  metrics, 
  forecast, 
  transactions,
  open, 
  onOpenChange 
}: CategoryModalProps) {
  if (!category || !metrics) return null

  const categoryColor = getCategoryColor(category)
  const categoryTransactions = transactions.filter(t => t.category === category && t.type === 'SAIDA')

  // Gráfico de gastos por dia
  const dailyData = categoryTransactions.reduce((acc, t) => {
    const day = t.date.toISOString().split('T')[0]
    if (!acc[day]) acc[day] = 0
    acc[day] += Math.abs(t.amount)
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(dailyData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise Detalhada: {getCategoryLabel(category)}
          </DialogTitle>
          <DialogDescription>
            Métricas completas e projeções para esta categoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(metrics.total)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Meta Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(metrics.monthlyGoal)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">% do Salário</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metrics.percentageOfSalary.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card className={metrics.status === 'critical' ? 'border-red-500/50 bg-red-500/5' : 
                             metrics.status === 'risk' ? 'border-yellow-500/50 bg-yellow-500/5' : 
                             'border-green-500/50 bg-green-500/5'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {metrics.status === 'critical' ? (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  ) : metrics.status === 'risk' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  )}
                  <p className="text-lg font-bold capitalize">{metrics.status === 'critical' ? 'Crítico' : metrics.status === 'risk' ? 'Risco' : 'OK'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Previsão */}
          {forecast && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Previsão Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Projeção baseada no ritmo atual:</p>
                  <p className="text-xl font-bold">{formatCurrency(forecast.projectedMonthly)}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Atual</p>
                    <p className="font-medium">{formatCurrency(forecast.currentTotal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Média/dia</p>
                    <p className="font-medium">{formatCurrency(forecast.dailyAverage)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dias restantes</p>
                    <p className="font-medium">{forecast.daysRemaining}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{forecast.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Evolução Diária */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                    />
                    <Bar dataKey="amount" fill={categoryColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Transações Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes ({categoryTransactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categoryTransactions
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 10)
                  .map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t.description.substring(0, 40)}...</p>
                        <p className="text-xs text-muted-foreground">
                          {t.date.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className="font-bold text-red-400">
                        -{formatCurrency(Math.abs(t.amount))}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

