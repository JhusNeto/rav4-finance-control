'use client'

import { AssistantSummary } from '@/lib/aiAssistant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Calendar, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AIAssistantCardProps {
  dailySummary: AssistantSummary
  weeklySummary: AssistantSummary
}

export function AIAssistantCard({ dailySummary, weeklySummary }: AIAssistantCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Assistente Interno
        </CardTitle>
        <CardDescription>
          Resumos automáticos do seu desempenho financeiro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">
              <Calendar className="h-4 w-4 mr-2" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <Calendar className="h-4 w-4 mr-2" />
              Semanal
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-4 mt-4">
            <SummaryContent summary={dailySummary} />
          </TabsContent>
          
          <TabsContent value="weekly" className="space-y-4 mt-4">
            <SummaryContent summary={weeklySummary} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SummaryContent({ summary }: { summary: AssistantSummary }) {
  return (
    <div className="space-y-4">
      {/* Resumo Principal */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <p className="text-sm leading-relaxed">{summary.summary}</p>
      </div>
      
      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg border bg-card/50">
          <div className="text-xs text-muted-foreground mb-1">Entradas</div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(summary.metrics.totalIncome)}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card/50">
          <div className="text-xs text-muted-foreground mb-1">Gastos</div>
          <div className="text-lg font-bold text-red-400">
            {formatCurrency(summary.metrics.totalExpenses)}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card/50">
          <div className="text-xs text-muted-foreground mb-1">Saldo</div>
          <div className={`text-lg font-bold ${summary.metrics.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(summary.metrics.balance)}
          </div>
        </div>
        <div className="p-3 rounded-lg border bg-card/50">
          <div className="text-xs text-muted-foreground mb-1">Top Categoria</div>
          <div className="text-sm font-bold">
            {summary.metrics.topCategory}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(summary.metrics.topCategoryAmount)}
          </div>
        </div>
      </div>
      
      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            Destaques
          </h4>
          {summary.highlights.map((highlight, idx) => (
            <div key={idx} className="text-xs p-2 rounded bg-green-500/10 border border-green-500/20">
              {highlight}
            </div>
          ))}
        </div>
      )}
      
      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            Avisos
          </h4>
          {summary.warnings.map((warning, idx) => (
            <div key={idx} className="text-xs p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
              {warning}
            </div>
          ))}
        </div>
      )}
      
      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-400" />
            Recomendações
          </h4>
          {summary.recommendations.map((rec, idx) => (
            <div key={idx} className="text-xs p-2 rounded bg-blue-500/10 border border-blue-500/20">
              {rec}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

