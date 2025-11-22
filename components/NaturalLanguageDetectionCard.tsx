'use client'

import { NaturalLanguageDetection } from '@/lib/naturalLanguageDetection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface NaturalLanguageDetectionCardProps {
  detections: NaturalLanguageDetection[]
  onTransactionClick?: (transactionId: string) => void
}

export function NaturalLanguageDetectionCard({ detections, onTransactionClick }: NaturalLanguageDetectionCardProps) {
  if (detections.length === 0) {
    return null
  }
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-red-500/20 text-red-400 border-red-500/50'
    if (confidence >= 0.6) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Detecção por Linguagem Natural
        </CardTitle>
        <CardDescription>
          Análise inteligente das suas transações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {detections.map((detection, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors cursor-pointer"
            onClick={() => onTransactionClick?.(detection.transactionId)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className="font-medium text-sm mb-1">{detection.question}</p>
                <p className="text-xs text-muted-foreground">{detection.suggestion}</p>
              </div>
              <Badge className={getConfidenceColor(detection.confidence)}>
                {(detection.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>
        ))}
        
        {detections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma detecção encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

