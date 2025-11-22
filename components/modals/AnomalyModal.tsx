'use client'

import { Anomaly } from '@/lib/anomalyDetection'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/classification'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, AlertTriangle, Info, Lightbulb, FileText } from 'lucide-react'
import { TransactionDetails } from '@/components/TransactionDetails'

interface AnomalyModalProps {
  anomaly: Anomaly | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AnomalyModal({ anomaly, open, onOpenChange }: AnomalyModalProps) {
  if (!anomaly) return null

  const severityColors = {
    critical: 'text-red-500 border-red-500/50 bg-red-500/10',
    high: 'text-red-400 border-red-500/50 bg-red-500/5',
    medium: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/5',
    low: 'text-blue-400 border-blue-500/50 bg-blue-500/5'
  }

  const typeLabels = {
    LARGE_PURCHASE: 'Compra Anormal',
    UNUSUAL_PIX: 'PIX Incomum',
    DUPLICATE_TRANSACTION: 'Transação Duplicada',
    UNEXPECTED_FEE: 'Taxa Inesperada'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {anomaly.severity === 'critical' ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Shield className="h-5 w-5" />
            )}
            {typeLabels[anomaly.type]}
          </DialogTitle>
          <DialogDescription>
            Anomalia detectada na análise de transações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mensagem Principal */}
          <Card className={severityColors[anomaly.severity]}>
            <CardHeader>
              <CardTitle className="text-lg">{anomaly.message}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-background/50">
                  {anomaly.severity === 'critical' ? 'Crítico' :
                   anomaly.severity === 'high' ? 'Alta Severidade' :
                   anomaly.severity === 'medium' ? 'Média Severidade' :
                   'Baixa Severidade'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Detectado em {formatDate(anomaly.detectedAt)}
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
                {anomaly.evidence.map((evidence, idx) => (
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
              <p className="text-sm leading-relaxed">{anomaly.recommendation}</p>
            </CardContent>
          </Card>

          {/* Detalhes da Transação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Detalhes da Transação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionDetails transaction={anomaly.transaction} showFullDetails={true} />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

