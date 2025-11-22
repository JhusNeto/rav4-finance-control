'use client'

import { CriticalAlert } from '@/lib/criticalAlerts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle, X, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface CriticalAlertsModalProps {
  alerts: CriticalAlert[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: (alertId: string) => void
}

export function CriticalAlertsModal({ 
  alerts, 
  open, 
  onOpenChange,
  onDismiss 
}: CriticalAlertsModalProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  
  // Filtra alertas não dispensados
  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id))
  
  if (visibleAlerts.length === 0) {
    return null
  }
  
  const criticalAlerts = visibleAlerts.filter(a => a.severity === 'critical')
  const highAlerts = visibleAlerts.filter(a => a.severity === 'high')
  
  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]))
    onDismiss?.(alertId)
  }
  
  const getSeverityVariant = (severity: CriticalAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'warning'
      default:
        return 'default'
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Alertas Críticos ({visibleAlerts.length})
          </DialogTitle>
          <DialogDescription>
            Atenção: Situações que requerem ação imediata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alertas Críticos */}
          {criticalAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-red-400">🚨 CRÍTICO</h3>
              {criticalAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={getSeverityVariant(alert.severity)}
                  className="border-2 animate-pulse"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <AlertTitle className="text-lg font-bold mb-2">
                        {alert.title}
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">{alert.message}</p>
                        
                        {alert.details.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {alert.details.map((detail, idx) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        )}
                        
                        {alert.value !== undefined && (
                          <div className="text-lg font-bold">
                            {formatCurrency(alert.value)}
                          </div>
                        )}
                        
                        <div className="mt-3 p-3 bg-background/50 rounded border-l-4 border-current">
                          <p className="text-sm font-medium mb-1">Recomendação:</p>
                          <p className="text-sm">{alert.recommendation}</p>
                        </div>
                        
                        {alert.actionRequired && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-yellow-400">
                            <Info className="h-4 w-4" />
                            <span>Ação imediata necessária</span>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                    {alert.canDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(alert.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {/* Alertas de Alta Severidade */}
          {highAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-yellow-400">⚠️ ALTA PRIORIDADE</h3>
              {highAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={getSeverityVariant(alert.severity)}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div className="flex-1">
                      <AlertTitle className="font-bold mb-1">
                        {alert.title}
                      </AlertTitle>
                      <AlertDescription className="space-y-1">
                        <p className="text-sm">{alert.message}</p>
                        {alert.details.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            {alert.details.slice(0, 2).map((detail, idx) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        )}
                        <p className="text-xs mt-2">{alert.recommendation}</p>
                      </AlertDescription>
                    </div>
                    {alert.canDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(alert.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {criticalAlerts.length} crítico(s) • {highAlerts.length} alta prioridade
          </p>
          <Button 
            onClick={() => {
              onOpenChange(false)
              // Pequeno delay para evitar reabertura imediata
              setTimeout(() => {
                // Força fechamento mesmo se houver alertas críticos
              }, 100)
            }}
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

