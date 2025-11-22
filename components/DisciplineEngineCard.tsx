'use client'

import { DisciplineStatus } from '@/lib/disciplineEngine'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { Shield, AlertTriangle, Car } from 'lucide-react'
import { getCategoryLabel } from '@/lib/classification'

interface DisciplineEngineCardProps {
  disciplineStatus: DisciplineStatus
  showImpact: boolean
}

export function DisciplineEngineCard({ disciplineStatus, showImpact }: DisciplineEngineCardProps) {
  const isViolating = disciplineStatus.violations.length > 0 || !disciplineStatus.isInAusterity
  
  return (
    <Card className={isViolating ? 'border-red-500/50 bg-red-500/5' : 'border-green-500/50 bg-green-500/5'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isViolating ? (
            <AlertTriangle className="h-5 w-5 text-red-400" />
          ) : (
            <Shield className="h-5 w-5 text-green-400" />
          )}
          Engine de Disciplina RAV4
        </CardTitle>
        <CardDescription>
          {disciplineStatus.isInAusterity 
            ? 'Você está em modo de austeridade. Mantenha a disciplina!'
            : '⚠️ Você saiu da austeridade. Impacto no objetivo:'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className={`p-4 rounded-lg border ${isViolating ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isViolating ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-bold text-red-400">DISCIPLINA COMPROMETIDA</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 text-green-400" />
                <span className="font-bold text-green-400">DISCIPLINA MANTIDA</span>
              </>
            )}
          </div>
          <p className="text-sm">{disciplineStatus.impact.message}</p>
        </div>
        
        {/* Violações */}
        {disciplineStatus.violations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-400">Violações Detectadas:</h4>
            {disciplineStatus.violations.map((violation, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertTitle>{getCategoryLabel(violation.category as any)}</AlertTitle>
                <AlertDescription>
                  {violation.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {/* Impacto */}
        {showImpact && (disciplineStatus.impact.projectedDelay > 0 || disciplineStatus.impact.additionalCost > 0) && (
          <div className="p-4 rounded-lg border-2 border-red-500/50 bg-red-500/10">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-5 w-5 text-red-400" />
              <h4 className="font-bold text-lg text-red-400">Impacto no Objetivo RAV4</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Atraso Projetado:</span>
                <span className="font-bold text-red-400">
                  {disciplineStatus.impact.projectedDelay} mês(es)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Custo Adicional:</span>
                <span className="font-bold text-red-400">
                  {formatCurrency(disciplineStatus.impact.additionalCost)}
                </span>
              </div>
              <div className="mt-3 p-2 bg-background/50 rounded text-xs">
                <strong>Simulação:</strong> Se você continuar neste ritmo, seu objetivo RAV4 será atrasado em {disciplineStatus.impact.projectedDelay} mês(es) e custará {formatCurrency(disciplineStatus.impact.additionalCost)} a mais.
              </div>
            </div>
          </div>
        )}
        
        {/* Avisos */}
        {disciplineStatus.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Avisos:</h4>
            {disciplineStatus.warnings.map((warning, idx) => (
              <Alert key={idx} variant="warning">
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

