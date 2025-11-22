'use client'

import { ScarcityPattern } from '@/lib/monthlyScarcity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, Calendar, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ScarcityPatternsCardProps {
  patterns: ScarcityPattern[]
}

export function ScarcityPatternsCard({ patterns }: ScarcityPatternsCardProps) {
  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Padrões de Carência do Mês
          </CardTitle>
          <CardDescription>
            Nenhum padrão problemático detectado
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getPatternLabel = (type: ScarcityPattern['type']) => {
    switch (type) {
      case 'EXPENSIVE_WEEK':
        return 'Semana Mais Cara'
      case 'POST_SALARY_SPENDING':
        return 'Gastos Pós-Salário'
      case 'PRE_MONTH_END':
        return 'Comportamento Pré-Fim de Mês'
      case 'MID_MONTH_SPIKE':
        return 'Pico no Meio do Mês'
      default:
        return 'Padrão Detectado'
    }
  }

  const getPatternIcon = (type: ScarcityPattern['type']) => {
    switch (type) {
      case 'EXPENSIVE_WEEK':
      case 'MID_MONTH_SPIKE':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Padrões de Carência do Mês ({patterns.length})
        </CardTitle>
        <CardDescription>
          Padrões de gastos problemáticos detectados automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {patterns.map((pattern, idx) => (
            <Alert
              key={idx}
              variant={pattern.severity === 'high' ? 'destructive' : pattern.severity === 'medium' ? 'warning' : 'default'}
            >
              <div className="flex items-start gap-3">
                {getPatternIcon(pattern.type)}
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2">
                    {getPatternLabel(pattern.type)}
                    {pattern.weekNumber && (
                      <span className="text-xs text-muted-foreground">
                        (Semana {pattern.weekNumber})
                      </span>
                    )}
                    {pattern.dayRange && (
                      <span className="text-xs text-muted-foreground">
                        (Dias {pattern.dayRange.start}-{pattern.dayRange.end})
                      </span>
                    )}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <p className="font-medium mb-2">{pattern.message}</p>
                    <div className="space-y-1 mb-2">
                      {pattern.evidence.map((evidence, eIdx) => (
                        <div key={eIdx} className="text-sm">• {evidence}</div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                      <strong>Recomendação:</strong> {pattern.recommendation}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

