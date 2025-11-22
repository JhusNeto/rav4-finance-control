'use client'

import { WeeklyInsight } from '@/lib/weeklyInsights'
import { MonthlyInsight } from '@/lib/monthlyInsights'
import { PredictiveInsight } from '@/lib/predictiveInsights'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { Lightbulb, Calendar, TrendingUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/classification'

interface InsightsViewProps {
  weeklyInsights: WeeklyInsight[]
  monthlyInsights: MonthlyInsight[]
  predictiveInsights: PredictiveInsight[]
}

export function InsightsView({ 
  weeklyInsights, 
  monthlyInsights, 
  predictiveInsights 
}: InsightsViewProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-500/10 border-green-500/50 text-green-400'
      case 'yellow':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
      case 'red':
        return 'bg-red-500/10 border-red-500/50 text-red-400'
      case 'blue':
        return 'bg-blue-500/10 border-blue-500/50 text-blue-400'
      default:
        return 'bg-muted border-border text-foreground'
    }
  }
  
  const renderInsight = (insight: WeeklyInsight | MonthlyInsight | PredictiveInsight) => (
    <Card
      key={insight.id}
      className={cn(
        'transition-all hover:scale-[1.02] cursor-pointer',
        getColorClasses(insight.color)
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{insight.icon}</div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">{insight.message}</p>
            {insight.value > 0 && (
              <div className="text-lg font-bold mt-1">
                {formatCurrency(insight.value)}
              </div>
            )}
            {insight.category && (
              <div className="text-xs text-muted-foreground mt-1">
                Categoria: {getCategoryLabel(insight.category as any)}
              </div>
            )}
            {'percentage' in insight && insight.percentage && (
              <div className="text-xs text-muted-foreground mt-1">
                {insight.percentage.toFixed(1)}% do total
              </div>
            )}
            {'topExpenses' in insight && insight.topExpenses && (
              <div className="mt-2 space-y-1">
                <div className="text-xs font-medium">Top gastos:</div>
                {insight.topExpenses.map((exp, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground">
                    • {exp.description}: {formatCurrency(exp.amount)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Insights Automáticos
        </CardTitle>
        <CardDescription>
          Análises inteligentes dos seus gastos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Semanais ({weeklyInsights.length})
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Mensais ({monthlyInsights.length})
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Preditivos ({predictiveInsights.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Insights Semanais */}
          <TabsContent value="weekly" className="space-y-3">
            {weeklyInsights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum insight semanal disponível ainda.
              </div>
            ) : (
              weeklyInsights.map(renderInsight)
            )}
          </TabsContent>
          
          {/* Insights Mensais */}
          <TabsContent value="monthly" className="space-y-3">
            {monthlyInsights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum insight mensal disponível ainda.
              </div>
            ) : (
              monthlyInsights.map(renderInsight)
            )}
          </TabsContent>
          
          {/* Insights Preditivos */}
          <TabsContent value="predictive" className="space-y-3">
            {predictiveInsights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum insight preditivo disponível ainda.
              </div>
            ) : (
              predictiveInsights.map(renderInsight)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

