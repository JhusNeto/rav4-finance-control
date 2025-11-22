'use client'

import { useState, useMemo } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { calculateMonthlyMetrics, calculateCategoryMetrics, generateAlerts } from '@/lib/projections'
import { Category, getCategoryLabel } from '@/lib/classification'
import { detectHiddenPatterns, HiddenPattern } from '@/lib/patternDetection'
import { detectHiddenSubscriptions, HiddenSubscription } from '@/lib/hiddenSubscriptions'
import { detectAnomalies, Anomaly } from '@/lib/anomalyDetection'
import { detectEmotionalSpending, EmotionalSpendingAlert } from '@/lib/emotionalSpending'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Info, Filter, Eye, Zap, Shield, Search } from 'lucide-react'
import { PatternModal } from '@/components/modals/PatternModal'
import { SubscriptionModal } from '@/components/modals/SubscriptionModal'
import { AnomalyModal } from '@/components/modals/AnomalyModal'
import { CriticalAlertSystem } from '@/lib/criticalAlerts'

const ALL_CATEGORIES: Category[] = [
  'ALIMENTACAO_DENTRO',
  'ALIMENTACAO_FORA',
  'PIX_SAIDA',
  'ASSINATURAS',
  'DIVIDAS_CDC',
  'MERCADO',
  'TRANSPORTE',
  'COMPRAS_GERAIS',
  'TARIFAS',
  'SAUDE',
  'LAZER',
  'EDUCACAO',
  'VESTUARIO',
  'COMBUSTIVEL',
  'SERVICOS',
  'MANUTENCAO',
  'IMPOSTOS',
  'OUTROS',
]

export function AlertsView() {
  const { transactions, initialBalance, salary, goals } = useFinanceStore()
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  
  // Estados para modais
  const [selectedPattern, setSelectedPattern] = useState<HiddenPattern | null>(null)
  const [selectedSubscription, setSelectedSubscription] = useState<HiddenSubscription | null>(null)
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false)
  
  const handlePatternClick = (pattern: HiddenPattern) => {
    setSelectedPattern(pattern)
    setIsPatternModalOpen(true)
  }
  
  const handleSubscriptionClick = (subscription: HiddenSubscription) => {
    setSelectedSubscription(subscription)
    setIsSubscriptionModalOpen(true)
  }
  
  const handleAnomalyClick = (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly)
    setIsAnomalyModalOpen(true)
  }

  const metrics = calculateMonthlyMetrics(transactions, initialBalance)
  
  const categoryMetricsMap: Record<Category, ReturnType<typeof calculateCategoryMetrics>> = {} as any
  ALL_CATEGORIES.forEach(category => {
    categoryMetricsMap[category] = calculateCategoryMetrics(
      transactions, 
      category, 
      goals[category] || 0, 
      salary
    )
  })

  // Cria um Record completo com todas as categorias para generateAlerts
  const goalsRecord: Record<Category, number> = {} as Record<Category, number>
  ALL_CATEGORIES.forEach(category => {
    goalsRecord[category] = goals[category] || 0
  })

  const alerts = generateAlerts(transactions, metrics, categoryMetricsMap, goalsRecord)
  
  // Detecções avançadas
  const hiddenPatterns = detectHiddenPatterns(transactions)
  const hiddenSubscriptions = detectHiddenSubscriptions(transactions)
  const anomalies = detectAnomalies(transactions)
  const emotionalAlerts = detectEmotionalSpending(transactions)
  
  // Alertas críticos (defesa contra latadas) - reutiliza categoryMetricsMap já calculado
  const criticalAlerts = CriticalAlertSystem.generateAllAlerts(
    transactions,
    metrics,
    categoryMetricsMap,
    emotionalAlerts
  )

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filterType !== 'all' && alert.type !== filterType) return false
      if (filterCategory !== 'all' && alert.category !== filterCategory) return false
      return true
    })
  }, [alerts, filterType, filterCategory])

  function getAlertVariant(severity: 'low' | 'medium' | 'high') {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'warning'
      default:
        return 'default'
    }
  }

  function getAlertIcon(severity: 'low' | 'medium' | 'high') {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  function getAlertTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      PIX_DAILY: 'PIX Diário',
      FOOD_WEEKLY: 'Alimentação Semanal',
      UNKNOWN_SUBSCRIPTION: 'Assinatura Desconhecida',
      NEGATIVE_PROJECTION: 'Projeção Negativa',
      UNUSUAL_EXPENSE: 'Despesa Fora do Padrão',
    }
    return labels[type] || type
  }

  const alertTypes = ['all', 'PIX_DAILY', 'FOOD_WEEKLY', 'UNKNOWN_SUBSCRIPTION', 'NEGATIVE_PROJECTION', 'UNUSUAL_EXPENSE']
  const categories = ['all', ...ALL_CATEGORIES]

  return (
    <div className="space-y-6">
      {/* Alertas Críticos (Defesa contra Latadas) */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold">🚨 Alertas Críticos ({criticalAlerts.length})</h2>
          </div>
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'warning' : 'default'}
                className={alert.severity === 'critical' ? 'border-2 animate-pulse' : ''}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'critical' ? 'animate-bounce' : ''}`} />
                  <div className="flex-1">
                    <AlertTitle className="text-lg font-bold mb-2">{alert.title}</AlertTitle>
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
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                        <strong>Recomendação:</strong> {alert.recommendation}
                      </div>
                      {alert.actionRequired && (
                        <div className="flex items-center gap-2 text-sm text-yellow-400">
                          <Info className="h-4 w-4" />
                          <span>Ação imediata necessária</span>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help flex items-center gap-2">
                    Filtros de Alertas
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Use os filtros para encontrar alertas específicos por tipo ou categoria. 
                    Útil para focar em áreas que precisam de atenção imediata.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Alerta</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                {alertTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'Todos' : getAlertTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Todas' : getCategoryLabel(cat as Category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Alertas</CardDescription>
            <CardTitle className="text-2xl">{alerts.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-400">Alertas Médios</CardDescription>
            <CardTitle className="text-2xl text-yellow-400">
              {alerts.filter(a => a.severity === 'medium').length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-400">Alertas Críticos</CardDescription>
            <CardTitle className="text-2xl text-red-400">
              {alerts.filter(a => a.severity === 'high').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Alertas ({filteredAlerts.length})</h2>
        
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum alerta encontrado com os filtros selecionados.
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={getAlertVariant(alert.severity)}
              className="animate-fade-in"
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <AlertTitle className="flex items-center justify-between">
                    <span>{getAlertTypeLabel(alert.type)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(alert.date)}
                    </span>
                  </AlertTitle>
                  <AlertDescription className="mt-1">
                    {alert.message}
                    {alert.category && (
                      <span className="ml-2 text-xs">
                        ({getCategoryLabel(alert.category)})
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))
        )}
      </div>

      {/* Gastos Emocionais */}
      {emotionalAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-2xl font-bold">Gastos Emocionais Detectados ({emotionalAlerts.length})</h2>
          </div>
          {emotionalAlerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'warning' : 'default'}
              className="cursor-pointer hover:scale-[1.02] transition-all"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div className="flex-1">
                  <AlertTitle className="font-bold">{alert.message}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-1">
                      {alert.evidence.map((evidence, idx) => (
                        <div key={idx} className="text-sm">• {evidence}</div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                      <strong>Recomendação:</strong> {alert.recommendation}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Padrões Ocultos */}
      {hiddenPatterns.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Padrões Ocultos Detectados ({hiddenPatterns.length})</h2>
          </div>
          {hiddenPatterns.map((pattern) => (
            <Alert
              key={pattern.id}
              variant={pattern.severity === 'high' ? 'destructive' : pattern.severity === 'medium' ? 'warning' : 'default'}
              className="cursor-pointer hover:scale-[1.02] transition-all"
              onClick={() => handlePatternClick(pattern)}
            >
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 mt-0.5" />
                <div className="flex-1">
                  <AlertTitle>{pattern.message}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-1">
                      {pattern.evidence.map((evidence, idx) => (
                        <div key={idx} className="text-sm">• {evidence}</div>
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
      )}

      {/* Assinaturas Ocultas */}
      {hiddenSubscriptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Assinaturas Ocultas Detectadas ({hiddenSubscriptions.length})</h2>
          </div>
          {hiddenSubscriptions.map((sub) => (
            <Alert
              key={sub.id}
              variant={sub.confidence === 'high' ? 'destructive' : sub.confidence === 'medium' ? 'warning' : 'default'}
              className="cursor-pointer hover:scale-[1.02] transition-all"
              onClick={() => handleSubscriptionClick(sub)}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1">
                  <AlertTitle>{sub.message}</AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-1 text-sm">
                      <div>• Frequência: {sub.frequency === 'monthly' ? 'Mensal' : sub.frequency === 'biweekly' ? 'Quinzenal' : sub.frequency === 'weekly' ? 'Semanal' : 'Irregular'}</div>
                      <div>• Ocorrências: {sub.occurrences} vezes</div>
                      <div>• Total gasto: {formatCurrency(sub.totalSpent)}</div>
                      <div>• Primeira vez: {formatDate(sub.firstSeen)}</div>
                      <div>• Última vez: {formatDate(sub.lastSeen)}</div>
                      <div>• Confiança: {sub.confidence === 'high' ? 'Alta' : sub.confidence === 'medium' ? 'Média' : 'Baixa'}</div>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Anomalias */}
      {anomalies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Anomalias Detectadas ({anomalies.length})</h2>
          </div>
          {anomalies.map((anomaly) => (
            <Alert
              key={anomaly.id}
              variant={anomaly.severity === 'critical' || anomaly.severity === 'high' ? 'destructive' : anomaly.severity === 'medium' ? 'warning' : 'default'}
              className="cursor-pointer hover:scale-[1.02] transition-all"
              onClick={() => handleAnomalyClick(anomaly)}
            >
              <div className="flex items-start gap-3">
                {anomaly.severity === 'critical' ? (
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500" />
                ) : (
                  <Shield className="h-4 w-4 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertTitle>
                    {anomaly.type === 'LARGE_PURCHASE' ? 'Compra Anormal' :
                     anomaly.type === 'UNUSUAL_PIX' ? 'PIX Incomum' :
                     anomaly.type === 'DUPLICATE_TRANSACTION' ? 'Transação Duplicada' :
                     'Taxa Inesperada'}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="font-medium mb-2">{anomaly.message}</div>
                    <div className="space-y-1 text-sm">
                      {anomaly.evidence.map((evidence, idx) => (
                        <div key={idx}>• {evidence}</div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                      <strong>Recomendação:</strong> {anomaly.recommendation}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Transação: {anomaly.transaction.description} - {formatCurrency(Math.abs(anomaly.transaction.amount))} em {formatDate(anomaly.transaction.date)}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Modais */}
      <PatternModal
        pattern={selectedPattern}
        open={isPatternModalOpen}
        onOpenChange={setIsPatternModalOpen}
      />
      
      <SubscriptionModal
        subscription={selectedSubscription}
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
      />
      
      <AnomalyModal
        anomaly={selectedAnomaly}
        open={isAnomalyModalOpen}
        onOpenChange={setIsAnomalyModalOpen}
      />
    </div>
  )
}

