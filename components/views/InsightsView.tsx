'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { calculateMonthlyMetrics } from '@/lib/projections'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar } from 'lucide-react'
import { generateWeeklyInsights } from '@/lib/weeklyInsights'
import { generateMonthlyInsights } from '@/lib/monthlyInsights'
import { generatePredictiveInsights } from '@/lib/predictiveInsights'
import { AIAssistant } from '@/lib/aiAssistant'
import { AISuggestionsCard } from '@/components/AISuggestionsCard'
import { AISuggestionEngine, AISuggestion } from '@/lib/aiSuggestions'
import { SuggestionModal } from '@/components/modals/SuggestionModal'

export function InsightsView() {
  const { transactions, initialBalance, salary, goals, weeklyGoal } = useFinanceStore()
  
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null)
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false)
  
  const metrics = calculateMonthlyMetrics(transactions, initialBalance)
  
  // Insights semanais
  const weeklyInsights = generateWeeklyInsights(transactions, weeklyGoal)
  const weeklySummary = AIAssistant.generateWeeklySummary(transactions, metrics)
  
  // Insights mensais
  const monthlyInsights = generateMonthlyInsights(transactions)
  
  // Insights preditivos
  const predictiveInsights = generatePredictiveInsights(transactions)
  
  // Sugestões de IA
  const aiSuggestions = AISuggestionEngine.generateSuggestions(transactions, metrics, goals, salary)
  
  const handleSuggestionClick = (suggestion: AISuggestion) => {
    setSelectedSuggestion(suggestion)
    setIsSuggestionModalOpen(true)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🟦 Insights</h1>
          <p className="text-muted-foreground mt-1">Inteligência Artificial Financeira</p>
        </div>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">
            <Calendar className="h-4 w-4 mr-2" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <Calendar className="h-4 w-4 mr-2" />
            Mês
          </TabsTrigger>
          <TabsTrigger value="predictive">
            <Target className="h-4 w-4 mr-2" />
            Preditivos
          </TabsTrigger>
        </TabsList>

        {/* Insights Semanais */}
        <TabsContent value="weekly" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Resumo Semanal
              </CardTitle>
              <CardDescription>
                {weeklySummary.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyInsights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{insight.message}</p>
                      {insight.value > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Valor: {formatCurrency(insight.value)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Mensais */}
        <TabsContent value="monthly" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análise Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {monthlyInsights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{insight.message}</p>
                      {insight.value > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Valor: {formatCurrency(insight.value)}
                        </p>
                      )}
                      {'percentage' in insight && insight.percentage && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Variação: {insight.percentage > 0 ? '+' : ''}{insight.percentage.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Preditivos */}
        <TabsContent value="predictive" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Previsões e Oportunidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {predictiveInsights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-card/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Target className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{insight.message}</p>
                      {insight.value > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Potencial: {formatCurrency(insight.value)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* Sugestões de IA */}
          {aiSuggestions.length > 0 && (
            <AISuggestionsCard 
              suggestions={aiSuggestions}
              onSuggestionClick={handleSuggestionClick}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Sugestão */}
      <SuggestionModal
        suggestion={selectedSuggestion}
        open={isSuggestionModalOpen}
        onOpenChange={setIsSuggestionModalOpen}
      />
    </div>
  )
}

