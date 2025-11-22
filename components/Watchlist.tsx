'use client'

import { RiskItem } from '@/lib/watchlist'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, Target, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/classification'

interface WatchlistProps {
  risks: RiskItem[]
}

export function Watchlist({ risks }: WatchlistProps) {
  if (risks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Watchlist de Riscos
          </CardTitle>
          <CardDescription>Nenhum risco crítico detectado no momento</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getSeverityColor = (severity: RiskItem['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10 text-red-400'
      case 'high':
        return 'border-orange-500/50 bg-orange-500/10 text-orange-400'
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
      default:
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400'
    }
  }

  const getTypeIcon = (type: RiskItem['type']) => {
    switch (type) {
      case 'category':
        return <Target className="h-4 w-4" />
      case 'trend':
        return <TrendingUp className="h-4 w-4" />
      case 'forecast':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Watchlist de Riscos ({risks.length})
        </CardTitle>
        <CardDescription>
          Itens que precisam de atenção imediata
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {risks.map((risk) => (
            <div
              key={risk.id}
              className={`p-4 rounded-lg border ${getSeverityColor(risk.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(risk.type)}
                  <h4 className="font-medium">{risk.title}</h4>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-background/50 capitalize">
                  {risk.severity}
                </span>
              </div>
              
              <p className="text-sm mb-3">{risk.description}</p>
              
              {risk.category && (
                <div className="text-xs mb-2">
                  Categoria: {getCategoryLabel(risk.category)}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs mb-2">
                <span>Atual: {formatCurrency(risk.currentValue)}</span>
                {risk.threshold > 0 && (
                  <span>Limite: {formatCurrency(risk.threshold)}</span>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-current/20">
                <p className="text-xs">
                  <strong>Recomendação:</strong> {risk.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

