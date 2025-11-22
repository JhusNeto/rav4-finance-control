'use client'

import { AISuggestion } from '@/lib/aiSuggestions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, TrendingDown, X, DollarSign, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AISuggestionsCardProps {
  suggestions: AISuggestion[]
  onSuggestionClick?: (suggestion: AISuggestion) => void
}

export function AISuggestionsCard({ suggestions, onSuggestionClick }: AISuggestionsCardProps) {
  if (suggestions.length === 0) {
    return null
  }
  
  const getTypeIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'cancel_subscription':
        return <X className="h-4 w-4" />
      case 'reduce_category':
        return <TrendingDown className="h-4 w-4" />
      case 'optimize_spending':
        return <Target className="h-4 w-4" />
      case 'debt_payoff':
        return <DollarSign className="h-4 w-4" />
      case 'savings_opportunity':
        return <Lightbulb className="h-4 w-4" />
    }
  }
  
  const getPriorityColor = (priority: AISuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Sugestões Automáticas de IA
        </CardTitle>
        <CardDescription>
          Ações recomendadas para economizar e otimizar seus gastos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1">
                {getTypeIcon(suggestion.type)}
                <h4 className="font-medium text-sm">{suggestion.title}</h4>
              </div>
              <Badge className={getPriorityColor(suggestion.priority)}>
                {suggestion.priority}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">{suggestion.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs">
                  <span className="text-muted-foreground">Economia mensal: </span>
                  <span className="font-bold text-green-400">
                    {formatCurrency(suggestion.impact.monthlySavings)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Economia anual: </span>
                  <span className="font-bold text-green-400">
                    {formatCurrency(suggestion.impact.annualSavings)}
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                Ver detalhes
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 italic">
              {suggestion.impact.message}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

