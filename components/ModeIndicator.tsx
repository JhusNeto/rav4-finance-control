'use client'

import { ModeState, AppMode } from '@/lib/modes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Zap, AlertTriangle, Info } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ModeIndicatorProps {
  mode: ModeState
}

export function ModeIndicator({ mode }: ModeIndicatorProps) {
  const modeConfig = {
    normal: {
      icon: Shield,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/50',
      title: 'Modo Normal',
      description: 'Sistema operando normalmente'
    },
    iskra: {
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/50',
      title: 'Modo Iskra',
      description: 'Proteção preventiva ativada'
    },
    mochila: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/50',
      title: 'Mochila de Guerra',
      description: 'Modo de emergência financeira'
    }
  }

  const config = modeConfig[mode.currentMode]
  const Icon = config.icon

  if (mode.currentMode === 'normal') {
    return null // Não mostra nada no modo normal
  }

  return (
    <Card className={`${config.bg} border-2 animate-pulse`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${config.color}`}>
          <Icon className="h-5 w-5" />
          {config.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {mode.reason && (
          <div>
            <p className="text-sm font-medium mb-1">Motivo da Ativação:</p>
            <p className="text-sm text-muted-foreground">{mode.reason}</p>
          </div>
        )}
        
        {mode.activatedAt && (
          <div className="text-xs text-muted-foreground">
            Ativado em: {formatDate(mode.activatedAt)}
          </div>
        )}

        {/* Restrições Ativas */}
        {(mode.restrictions.blockedCategories.length > 0 || 
          mode.restrictions.maxDailySpending !== null ||
          Object.keys(mode.restrictions.maxCategorySpending).length > 0) && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium mb-2">Restrições Ativas:</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {mode.restrictions.blockedCategories.length > 0 && (
                <li>• Categorias bloqueadas: {mode.restrictions.blockedCategories.join(', ')}</li>
              )}
              {mode.restrictions.maxDailySpending !== null && (
                <li>• Limite diário: R$ {mode.restrictions.maxDailySpending.toFixed(2)}</li>
              )}
              {Object.keys(mode.restrictions.maxCategorySpending).length > 0 && (
                <li>• Limites por categoria ativos</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

