'use client'

import { AISuggestion } from '@/lib/aiSuggestions'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { Lightbulb, TrendingDown, X, DollarSign, Target, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SuggestionModalProps {
  suggestion: AISuggestion | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuggestionModal({ suggestion, open, onOpenChange }: SuggestionModalProps) {
  if (!suggestion) return null

  const getTypeIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'cancel_subscription':
        return <X className="h-5 w-5 text-red-400" />
      case 'reduce_category':
        return <TrendingDown className="h-5 w-5 text-yellow-400" />
      case 'optimize_spending':
        return <Target className="h-5 w-5 text-blue-400" />
      case 'debt_payoff':
        return <DollarSign className="h-5 w-5 text-green-400" />
      case 'savings_opportunity':
        return <Lightbulb className="h-5 w-5 text-primary" />
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

  const getTypeLabel = (type: AISuggestion['type']) => {
    switch (type) {
      case 'cancel_subscription':
        return 'Cancelar Assinatura'
      case 'reduce_category':
        return 'Reduzir Categoria'
      case 'optimize_spending':
        return 'Otimizar Gastos'
      case 'debt_payoff':
        return 'Pagar Dívida'
      case 'savings_opportunity':
        return 'Oportunidade de Economia'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getTypeIcon(suggestion.type)}
            <DialogTitle className="flex-1">{suggestion.title}</DialogTitle>
            <Badge className={getPriorityColor(suggestion.priority)}>
              {suggestion.priority === 'high' ? 'Alta' : suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
            </Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {getTypeLabel(suggestion.type)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Descrição */}
          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {suggestion.description}
            </p>
          </div>

          {/* Ação Recomendada */}
          <div>
            <h3 className="font-semibold mb-2">Ação Recomendada</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {suggestion.action}
            </p>
          </div>

          {/* Impacto Financeiro */}
          <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Impacto Financeiro
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Economia Mensal</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(suggestion.impact.monthlySavings)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Economia Anual</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(suggestion.impact.annualSavings)}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              {suggestion.impact.message}
            </p>
          </div>

          {/* Informações Adicionais */}
          {suggestion.category && (
            <div>
              <h3 className="font-semibold mb-2">Categoria Afetada</h3>
              <Badge variant="outline" className="text-sm">
                {suggestion.category}
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

