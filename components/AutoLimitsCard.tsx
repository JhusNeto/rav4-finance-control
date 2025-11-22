'use client'

import { AutoLimit } from '@/lib/autoLimits'
import { Category, getCategoryLabel } from '@/lib/classification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Target, AlertCircle, CheckCircle2, Shield, Zap } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface AutoLimitsCardProps {
  autoLimits: Record<Category, AutoLimit>
  currentGoals: Record<Category, number>
  onApplyLimit?: (category: Category, limit: number) => void
}

export function AutoLimitsCard({ autoLimits, currentGoals, onApplyLimit }: AutoLimitsCardProps) {
  const categories = Object.keys(autoLimits) as Category[]
  
  // Mostra todas as categorias que têm dados (mesmo com baixa confiança)
  // Mas separa protegidas das não protegidas
  const nonProtectedLimits = categories.filter(cat => 
    autoLimits[cat].averageSpending > 0 || autoLimits[cat].suggestedLimit > 0
  ).filter(cat => !autoLimits[cat].isProtected)
  
  const protectedLimits = categories.filter(cat => 
    autoLimits[cat].isProtected && 
    (autoLimits[cat].averageSpending > 0 || autoLimits[cat].suggestedLimit > 0)
  )
  
  const allRelevantLimits = [...nonProtectedLimits, ...protectedLimits]

  if (allRelevantLimits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Auto-limites Conscientes
          </CardTitle>
          <CardDescription>
            Analisando histórico dos últimos 3 meses com regras de proteção...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Auto-limites Conscientes
        </CardTitle>
        <CardDescription>
          Limites calculados com proteções: 20% abaixo da média, teto por salário, austeridade adaptativa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Categorias não protegidas (sugestões de corte) */}
          {nonProtectedLimits.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Sugestões de Limite (Categorias Cortáveis)
              </div>
              {nonProtectedLimits.map(category => {
                const limit = autoLimits[category]
                return renderLimitCard(category, limit, currentGoals, onApplyLimit)
              })}
            </div>
          )}
          
          {/* Categorias protegidas (informativas) */}
          {protectedLimits.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Limites Informativos (Categorias Essenciais Protegidas)
              </div>
              {protectedLimits.map(category => {
                const limit = autoLimits[category]
                return renderLimitCard(category, limit, currentGoals, undefined) // Não permite aplicar em protegidas
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function renderLimitCard(
  category: Category,
  limit: AutoLimit,
  currentGoals: Record<Category, number>,
  onApplyLimit?: (category: Category, limit: number) => void
) {
  const currentGoal = currentGoals[category] || 0
  const difference = limit.suggestedLimit - currentGoal
  const isHigher = difference > 0
  
  return (
    <div
      key={category}
      className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-medium text-lg">{getCategoryLabel(category)}</span>
            
            {limit.isProtected && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/50">
                    <Shield className="h-3 w-3 mr-1" />
                    Protegida
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Categoria essencial - nunca será cortada</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {limit.dailyLimit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-red-500/10 border-red-500/50">
                    <Zap className="h-3 w-3 mr-1" />
                    Vilão #1
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limite diário ativo: {formatCurrency(limit.dailyLimit)}</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {limit.confidence === 'high' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alta confiança (3+ meses de dados)</p>
                </TooltipContent>
              </Tooltip>
            )}
            {limit.confidence === 'medium' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Média confiança (2 meses de dados)</p>
                </TooltipContent>
              </Tooltip>
            )}
            {limit.confidence === 'low' && limit.averageSpending > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Baixa confiança (poucos dados disponíveis)</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground mb-3">
            {limit.recommendation}
          </div>
          
          {/* Limites Semanais (REGRA 6) */}
          {limit.weeklyLimit > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2 bg-muted/50 rounded">
                <div className="text-xs text-muted-foreground">Limite Semanal</div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(limit.weeklyLimit)}
                </div>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <div className="text-xs text-muted-foreground">Limite Mensal</div>
                <div className="text-lg font-bold">
                  {formatCurrency(limit.suggestedLimit)}
                </div>
              </div>
            </div>
          )}
          
          {/* Limites Comportamentais (REGRA 7) */}
          {limit.behavioralLimits && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <div className="text-xs font-medium text-yellow-400 mb-2">
                🎯 Limites Comportamentais
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {limit.behavioralLimits.maxDeliveriesPerWeek > 0 && (
                  <div>• Máx. {limit.behavioralLimits.maxDeliveriesPerWeek} delivery(s) por semana</div>
                )}
                {limit.behavioralLimits.noNightPurchases && (
                  <div>• 🚫 Compras noturnas bloqueadas (após 20h)</div>
                )}
                {limit.behavioralLimits.maxEmotionalPurchases > 0 && (
                  <div>• Máx. {limit.behavioralLimits.maxEmotionalPurchases} gasto(s) emocional(is) por semana</div>
                )}
                {limit.behavioralLimits.maxTransactionAmount > 0 && (
                  <div>• Teto por transação: {formatCurrency(limit.behavioralLimits.maxTransactionAmount)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
        <div>
          <span>Média: </span>
          <span className="font-medium">{formatCurrency(limit.averageSpending)}</span>
        </div>
        {limit.maxSpending > 0 && (
          <div>
            <span>Máx: </span>
            <span className="font-medium">{formatCurrency(limit.maxSpending)}</span>
          </div>
        )}
        {limit.monthsAnalyzed > 0 && (
          <div>
            <span>{limit.monthsAnalyzed} meses</span>
          </div>
        )}
      </div>
      
      {onApplyLimit && limit.suggestedLimit > 0 && !limit.isProtected && (
        <button
          onClick={() => onApplyLimit(category, limit.suggestedLimit)}
          className="w-full mt-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium"
        >
          Aplicar Limite Consciente
        </button>
      )}
    </div>
  )
}
