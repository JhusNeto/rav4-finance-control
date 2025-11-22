'use client'

import { CriticalAlert } from '@/lib/criticalAlerts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CriticalAlertsBannerProps {
  alerts: CriticalAlert[]
  onDismiss?: (alertId: string) => void
  onViewAll?: () => void
}

export function CriticalAlertsBanner({ 
  alerts, 
  onDismiss,
  onViewAll 
}: CriticalAlertsBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  
  // Mostra apenas alertas críticos não dispensados
  const criticalAlerts = alerts.filter(a => 
    a.severity === 'critical' && !dismissedAlerts.has(a.id)
  )
  
  if (criticalAlerts.length === 0) return null
  
  const topAlert = criticalAlerts[0]
  
  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
    onDismiss?.(alertId)
  }
  
  return (
    <Alert
      variant="destructive"
      className={cn(
        'border-2 animate-pulse mb-4',
        'bg-red-950/50 border-red-500'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 animate-bounce" />
        <div className="flex-1">
          <AlertTitle className="text-lg font-bold mb-1">
            {topAlert.title}
          </AlertTitle>
          <AlertDescription>
            <p className="font-medium mb-2">{topAlert.message}</p>
            {topAlert.details.length > 0 && (
              <p className="text-sm mb-2">{topAlert.details[0]}</p>
            )}
            {criticalAlerts.length > 1 && (
              <p className="text-xs text-muted-foreground mb-2">
                + {criticalAlerts.length - 1} outro(s) alerta(s) crítico(s)
              </p>
            )}
            {onViewAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="mt-2 border-white/20 text-white hover:bg-white/10"
              >
                Ver Todos os Alertas
              </Button>
            )}
          </AlertDescription>
        </div>
        {topAlert.canDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(topAlert.id)}
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

