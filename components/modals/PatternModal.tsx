'use client'

import { HiddenPattern } from '@/lib/patternDetection'
import { formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Info, Lightbulb } from 'lucide-react'

interface PatternModalProps {
  pattern: HiddenPattern | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatternModal({ pattern, open, onOpenChange }: PatternModalProps) {
  if (!pattern) return null

  const severityColors = {
    high: 'text-red-400 border-red-500/50 bg-red-500/5',
    medium: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/5',
    low: 'text-blue-400 border-blue-500/50 bg-blue-500/5'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Padrão Detectado
          </DialogTitle>
          <DialogDescription>
            Comportamento identificado na análise dos seus gastos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mensagem Principal */}
          <Card className={severityColors[pattern.severity]}>
            <CardHeader>
              <CardTitle className="text-lg">{pattern.message}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-1 rounded bg-background/50">
                  {pattern.severity === 'high' ? 'Alta Severidade' : 
                   pattern.severity === 'medium' ? 'Média Severidade' : 
                   'Baixa Severidade'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Detectado em {formatDate(pattern.detectedAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Evidências */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-4 w-4" />
                Evidências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {pattern.evidence.map((evidence, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm">{evidence}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recomendação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-4 w-4" />
                Recomendação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{pattern.recommendation}</p>
            </CardContent>
          </Card>

          {/* Tipo de Padrão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {pattern.type === 'NIGHT_PIX' && 'PIX Noturno'}
                {pattern.type === 'EMOTIONAL_AFTER_STRESS' && 'Compras Emocionais após Estresse'}
                {pattern.type === 'PRESSURE_WEEK' && 'Semana de Pressão'}
                {pattern.type === 'TIRED_DELIVERY' && 'Delivery quando Cansado'}
                {pattern.type === 'MID_MONTH_SPENDING' && 'Gastos no Meio do Mês'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

