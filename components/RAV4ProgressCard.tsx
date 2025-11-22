'use client'

import { RAV4Progress } from '@/lib/rav4Progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface RAV4ProgressCardProps {
  progress: RAV4Progress
  onEditTarget?: () => void
}

export function RAV4ProgressCard({ progress, onEditTarget }: RAV4ProgressCardProps) {
  const getStatusColor = (status: RAV4Progress['status']) => {
    switch (status) {
      case 'ahead':
        return 'text-green-400 border-green-500/50 bg-green-500/10'
      case 'on_track':
        return 'text-blue-400 border-blue-500/50 bg-blue-500/10'
      case 'behind':
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10'
      case 'critical':
        return 'text-red-400 border-red-500/50 bg-red-500/10'
    }
  }
  
  const getStatusIcon = (status: RAV4Progress['status']) => {
    switch (status) {
      case 'ahead':
        return <CheckCircle2 className="h-5 w-5" />
      case 'on_track':
        return <TrendingUp className="h-5 w-5" />
      case 'behind':
        return <AlertTriangle className="h-5 w-5" />
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />
    }
  }
  
  return (
    <Card className={cn('border-2', getStatusColor(progress.status))}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          RAV4 Progress
          {onEditTarget && (
            <button
              onClick={onEditTarget}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              Editar
            </button>
          )}
        </CardTitle>
        <CardDescription>
          Progresso em direção ao objetivo macro do Projeto RAV4
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-bold">{progress.percentage.toFixed(1)}%</span>
          </div>
          <Progress value={progress.percentage} className="h-3" />
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Atual</div>
            <div className="text-lg font-bold">{formatCurrency(progress.currentProgress)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Objetivo</div>
            <div className="text-lg font-bold">{formatCurrency(progress.targetProgress)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Faltam</div>
            <div className="text-lg font-bold text-red-400">{formatCurrency(progress.remaining)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Dias Restantes</div>
            <div className="text-lg font-bold">{progress.daysRemaining}</div>
          </div>
        </div>
        
        {/* Status */}
        <div className={cn('p-3 rounded-lg border', getStatusColor(progress.status))}>
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(progress.status)}
            <span className="font-medium capitalize">{progress.status.replace('_', ' ')}</span>
          </div>
          <p className="text-sm">{progress.message}</p>
        </div>
        
        {/* Data de Conclusão Projetada */}
        {progress.projectedCompletionDate && 
         progress.projectedCompletionDate instanceof Date && 
         !isNaN(progress.projectedCompletionDate.getTime()) && (
          <div className="text-xs text-muted-foreground">
            Projeção de conclusão: {formatDate(progress.projectedCompletionDate)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

