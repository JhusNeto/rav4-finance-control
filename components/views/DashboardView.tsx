'use client'

import { useState, useEffect } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { calculateMonthlyMetrics, calculateCategoryMetrics, getBalanceOverTime } from '@/lib/projections'
import { Category, getCategoryLabel } from '@/lib/classification'
import { calculateAllCategoryForecasts } from '@/lib/categoryForecast'
import { ModeManager } from '@/lib/modes'
import { generateWatchlist } from '@/lib/watchlist'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertTriangle, CheckCircle2, Clock, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ForecastAlert } from '@/components/ForecastAlert'
import { CategoryModal } from '@/components/modals/CategoryModal'
import { ForecastModal } from '@/components/modals/ForecastModal'
import { ModeIndicator } from '@/components/ModeIndicator'
import { Watchlist } from '@/components/Watchlist'
import { calculateWeeklyAdjustment } from '@/lib/weeklyAdjustment'
import { groupPIXByRecipient } from '@/lib/pixGrouping'
import { detectMonthlyScarcity } from '@/lib/monthlyScarcity'
import { WeeklyAdjustmentCard } from '@/components/WeeklyAdjustmentCard'
import { PIXGroupingCard } from '@/components/PIXGroupingCard'
import { ScarcityPatternsCard } from '@/components/ScarcityPatternsCard'
import { generateHeatmapData } from '@/lib/heatmap'
import { generateHourlyMap, generateStoreMap, generateCategoryMap } from '@/lib/purchaseMaps'
import { generateSmartCards } from '@/lib/smartCards'
import { HeatmapView } from '@/components/HeatmapView'
import { PurchaseMapsView } from '@/components/PurchaseMapsView'
import { SmartCardsView } from '@/components/SmartCardsView'
import { CriticalAlertSystem } from '@/lib/criticalAlerts'
import { detectEmotionalSpending } from '@/lib/emotionalSpending'
import { CriticalAlertsBanner } from '@/components/CriticalAlertsBanner'
import { CriticalAlertsModal } from '@/components/CriticalAlertsModal'

export function DashboardView() {
  const { transactions, initialBalance, salary, goals, mode, weeklyGoal, setMode } = useFinanceStore()
  
  // Estados para modais
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedForecast, setSelectedForecast] = useState<any>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false)
  
  // Encontrar maior vilão
  const categoryTotals = new Map<Category, number>()
  transactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      const current = categoryTotals.get(t.category) || 0
      categoryTotals.set(t.category, current + Math.abs(t.amount))
    })
  
  const topVillain = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])[0]
  
  const topVillainLabel = topVillain ? getCategoryLabel(topVillain[0]) : 'N/A'
  const topVillainAmount = topVillain ? topVillain[1] : 0
  const [isRAV4TargetModalOpen, setIsRAV4TargetModalOpen] = useState(false)

  const metrics = calculateMonthlyMetrics(transactions, initialBalance)
  const balanceOverTime = getBalanceOverTime(transactions, initialBalance)

  // Calcular métricas por categoria (sempre mês atual)
  const pixMetrics = calculateCategoryMetrics(transactions, 'PIX_SAIDA', goals.PIX_SAIDA, salary)
  const foodMetrics = calculateCategoryMetrics(transactions, 'ALIMENTACAO_FORA', goals.ALIMENTACAO_FORA, salary)
  const subscriptionMetrics = calculateCategoryMetrics(transactions, 'ASSINATURAS', goals.ASSINATURAS, salary)
  const debtMetrics = calculateCategoryMetrics(transactions, 'DIVIDAS_CDC', goals.DIVIDAS_CDC, salary)
  
  // Previsões por categoria
  const categoryForecasts = calculateAllCategoryForecasts(transactions)
  
  // Determina modo atual baseado nas condições
  useEffect(() => {
    const newMode = ModeManager.determineMode(transactions, metrics, weeklyGoal)
    if (newMode.currentMode !== mode.currentMode) {
      setMode(newMode)
    }
  }, [transactions, metrics, weeklyGoal, mode.currentMode, setMode])
  
  // Calcula métricas por categoria para watchlist
  const categoryMetricsMap: Record<Category, ReturnType<typeof calculateCategoryMetrics>> = {} as any
  const ALL_CATEGORIES: Category[] = [
    'ALIMENTACAO_DENTRO', 'ALIMENTACAO_FORA', 'PIX_SAIDA', 'PIX_ENTRADA',
    'ASSINATURAS', 'DIVIDAS_CDC', 'MERCADO', 'TRANSPORTE',
    'COMPRAS_GERAIS', 'TARIFAS', 'OUTROS'
  ]
  ALL_CATEGORIES.forEach(category => {
    categoryMetricsMap[category] = calculateCategoryMetrics(
      transactions, 
      category, 
      goals[category] || 0, 
      salary
    )
  })
  
  // Watchlist de riscos (só mostra em modo mochila)
  const watchlist = mode.currentMode === 'mochila' 
    ? generateWatchlist(transactions, categoryMetricsMap, metrics)
    : []
  
  // Auto-ajuste semanal
  const totalMonthlyGoal = Object.values(goals).reduce((sum, goal) => sum + goal, 0)
  const weeklyAdjustments = calculateWeeklyAdjustment(transactions, totalMonthlyGoal)
  
  // Agrupamento de PIX
  const pixGroups = groupPIXByRecipient(transactions)
  
  // Padrões de carência do mês
  const scarcityPatterns = detectMonthlyScarcity(transactions)
  
  // Heatmap de gastos
  const heatmapData = generateHeatmapData(transactions)
  
  // Mapas de compras
  const hourlyMap = generateHourlyMap(transactions)
  const storeMap = generateStoreMap(transactions)
  const categoryMap = generateCategoryMap(transactions)
  
  // Cartões inteligentes
  const smartCards = generateSmartCards(transactions, totalMonthlyGoal)
  
  // Alertas críticos (defesa contra latadas)
  const emotionalAlerts = detectEmotionalSpending(transactions)
  const criticalAlerts = CriticalAlertSystem.generateAllAlerts(
    transactions,
    metrics,
    categoryMetricsMap,
    emotionalAlerts
  )
  
  // Estado para modal de alertas
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false)
  const [shownAlertIds, setShownAlertIds] = useState<Set<string>>(new Set())
  
  // Abre modal automaticamente se houver alertas críticos novos (não mostrados antes)
  useEffect(() => {
    const criticalAlertsToShow = criticalAlerts.filter(
      a => a.severity === 'critical' && 
           !a.canDismiss && 
           !shownAlertIds.has(a.id)
    )
    
    if (criticalAlertsToShow.length > 0 && !isAlertsModalOpen) {
      setIsAlertsModalOpen(true)
      // Marca os alertas como mostrados
      setShownAlertIds(prev => {
        const newSet = new Set(prev)
        criticalAlertsToShow.forEach(a => newSet.add(a.id))
        return newSet
      })
    }
  }, [criticalAlerts, shownAlertIds, isAlertsModalOpen])
  
  // Handlers para abrir modais
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category)
    setIsCategoryModalOpen(true)
  }
  
  const handleForecastClick = (forecast: any) => {
    setSelectedForecast(forecast)
    setIsForecastModalOpen(true)
  }
  
  const getCategoryMetrics = (category: Category) => {
    switch (category) {
      case 'PIX_SAIDA': return pixMetrics
      case 'ALIMENTACAO_FORA': return foodMetrics
      case 'ASSINATURAS': return subscriptionMetrics
      case 'DIVIDAS_CDC': return debtMetrics
      default: return calculateCategoryMetrics(transactions, category, goals[category] || 0, salary)
    }
  }

  // Status da austeridade
  const austerityStatus = metrics.projectedBalance > 0 ? 'ok' : metrics.projectedBalance > -500 ? 'warning' : 'critical'
  const austerityColor = austerityStatus === 'ok' ? 'text-green-400' : austerityStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'
  const austerityBg = austerityStatus === 'ok' ? 'bg-green-500/10 border-green-500/50' : austerityStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-red-500/10 border-red-500/50'

  // Gráfico de entradas vs saídas
  const incomeVsExpenses = [
    {
      name: 'Entradas',
      valor: metrics.totalIncome,
    },
    {
      name: 'Saídas',
      valor: metrics.totalExpenses,
    },
  ]

  // Formatar dados para gráfico de saldo
  const balanceChartData = balanceOverTime.map(item => ({
    date: formatDate(item.date),
    saldo: item.balance,
  }))

  function getStatusCard(status: 'ok' | 'risk' | 'critical', total: number, goal: number) {
    if (status === 'critical') {
      return {
        bg: 'bg-red-500/10 border-red-500/50',
        text: 'text-red-400',
        icon: AlertTriangle,
      }
    }
    if (status === 'risk') {
      return {
        bg: 'bg-yellow-500/10 border-yellow-500/50',
        text: 'text-yellow-400',
        icon: AlertTriangle,
      }
    }
    return {
      bg: 'bg-green-500/10 border-green-500/50',
      text: 'text-green-400',
      icon: CheckCircle2,
    }
  }

  const pixStatus = getStatusCard(pixMetrics.status, pixMetrics.total, pixMetrics.monthlyGoal)
  const foodStatus = getStatusCard(foodMetrics.status, foodMetrics.total, foodMetrics.monthlyGoal)
  const subStatus = getStatusCard(subscriptionMetrics.status, subscriptionMetrics.total, subscriptionMetrics.monthlyGoal)
  const debtStatus = getStatusCard(debtMetrics.status, debtMetrics.total, debtMetrics.monthlyGoal)

  // Aplica estilo visual baseado no modo
  const modeStyles = mode.currentMode === 'mochila' 
    ? 'bg-red-950/50 border-red-500/20' 
    : mode.currentMode === 'iskra'
    ? 'bg-yellow-950/30 border-yellow-500/20'
    : ''

  return (
    <div className={`space-y-6 ${modeStyles} transition-all duration-300`}>
        {/* Banner de Alertas Críticos */}
        {criticalAlerts.length > 0 && (
          <CriticalAlertsBanner
            alerts={criticalAlerts}
            onViewAll={() => setIsAlertsModalOpen(true)}
          />
        )}
        
        {/* Cartões Inteligentes */}
        {smartCards.length > 0 && (
          <SmartCardsView cards={smartCards} />
        )}
        
        {/* Indicador de Modo */}
        <ModeIndicator mode={mode} />
        
        {/* Watchlist (só em modo mochila) */}
        {watchlist.length > 0 && (
          <Watchlist risks={watchlist} />
        )}
        
        {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:scale-105 transition-transform">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    Saldo Atual
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(metrics.currentBalance)}</CardTitle>
                </CardHeader>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Saldo atual considerando todas as transações históricas até hoje. 
                Inclui o saldo inicial ajustado com histórico anterior ao mês atual.
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-pointer hover:scale-105 transition-transform">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    Saldo Projetado
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </CardDescription>
                  <CardTitle className={`text-2xl ${metrics.projectedBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(metrics.projectedBalance)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Projeção do saldo ao final do mês baseada no burn rate atual. 
                Calculado assumindo que o ritmo de gastos continue até o fim do mês.
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-pointer hover:scale-105 transition-transform">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    Entradas do Mês
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </CardDescription>
                  <CardTitle className="text-2xl text-green-400">{formatCurrency(metrics.totalIncome)}</CardTitle>
                </CardHeader>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Total de todas as entradas financeiras do mês atual até hoje. 
                Inclui salários, PIX recebidos, proventos e outras receitas.
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:scale-105 transition-transform">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  Saídas do Mês
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardDescription>
                <CardTitle className="text-2xl text-red-400">{formatCurrency(metrics.totalExpenses)}</CardTitle>
              </CardHeader>
            </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Total de todas as saídas financeiras do mês atual até hoje. 
                Inclui gastos, PIX enviados, pagamentos e outras despesas.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

      {/* Alerta de Previsão de Rombo */}
      {metrics.forecast && <ForecastAlert forecast={metrics.forecast} />}

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  Burn Rate Diário
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardDescription>
                <CardTitle className="text-xl">{formatCurrency(metrics.burnRate)}</CardTitle>
              </CardHeader>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Média diária de gastos calculada dividindo o total de saídas pelos dias decorridos do mês. 
              Indica quanto você está gastando por dia em média.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  Burn Rate Semanal
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardDescription>
                <CardTitle className={`text-xl ${metrics.weeklyBurnRate > metrics.burnRate ? 'text-yellow-400' : 'text-green-400'}`}>
                  {formatCurrency(metrics.weeklyBurnRate)}
                </CardTitle>
              </CardHeader>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Média diária de gastos dos últimos 7 dias. Mostra a tendência recente de gastos. 
              Se maior que o burn rate mensal, indica aceleração de gastos.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={`cursor-pointer hover:scale-105 transition-transform ${metrics.bleedingRate > 0 ? 'bg-red-500/10 border-red-500/50' : 'bg-green-500/10 border-green-500/50'}`}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  Taxa de Sangramento
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardDescription>
                <CardTitle className={`text-xl ${metrics.bleedingRate > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatCurrency(Math.abs(metrics.bleedingRate))}
                </CardTitle>
              </CardHeader>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Quanto você está perdendo por dia além do esperado. 
              Calculado como a diferença entre seu burn rate atual e o burn rate ideal baseado em suas entradas.
              Valores positivos indicam gastos acima do esperado.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-pointer hover:scale-105 transition-transform">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dias Restantes
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardDescription>
                <CardTitle className="text-xl">{metrics.daysRemaining} dias</CardTitle>
              </CardHeader>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Quantidade de dias restantes até o final do mês atual. 
              Usado para calcular projeções e planejamento financeiro.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={`cursor-pointer hover:scale-105 transition-transform ${austerityBg}`}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  Status da Austeridade
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardDescription>
                <CardTitle className={`text-xl ${austerityColor}`}>
                  {austerityStatus === 'ok' ? 'OK' : austerityStatus === 'warning' ? 'ATENÇÃO' : 'CRÍTICO'}
                </CardTitle>
              </CardHeader>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Status baseado na projeção de fim de mês: 
              <strong> OK</strong> = saldo positivo, 
              <strong> ATENÇÃO</strong> = saldo entre 0 e -R$500, 
              <strong> CRÍTICO</strong> = saldo negativo abaixo de -R$500.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help flex items-center gap-2">
                    Curva do Saldo ao Longo do Mês
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Gráfico mostrando a evolução diária do saldo ao longo do mês. 
                    Permite visualizar tendências e identificar dias com maior impacto financeiro.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help flex items-center gap-2">
                    Entradas vs Saídas
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Comparação visual entre o total de entradas e saídas do mês. 
                    Ajuda a entender o fluxo de caixa e identificar desequilíbrios.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="valor" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Categorias Críticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`cursor-pointer hover:scale-105 transition-transform ${pixStatus.bg}`}
              onClick={() => handleCategoryClick('PIX_SAIDA')}
            >
              <CardHeader>
                <CardTitle className={`text-lg flex items-center gap-2 ${pixStatus.text}`}>
                  PIX no Mês
                  <Info className="h-3 w-3" />
                </CardTitle>
                <CardDescription className={pixStatus.text}>
                  {formatCurrency(pixMetrics.total)} / {formatCurrency(pixMetrics.monthlyGoal)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${pixStatus.text}`}>
                    {((pixMetrics.total / pixMetrics.monthlyGoal) * 100).toFixed(0)}%
                  </span>
                  <pixStatus.icon className={`h-6 w-6 ${pixStatus.text}`} />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Total de PIX enviados no mês comparado com a meta estabelecida. 
              Status: <strong>OK</strong> = abaixo de 80%, <strong>Risco</strong> = 80-100%, <strong>Crítico</strong> = acima de 100%.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`cursor-pointer hover:scale-105 transition-transform ${foodStatus.bg}`}
              onClick={() => handleCategoryClick('ALIMENTACAO_FORA')}
            >
              <CardHeader>
                <CardTitle className={`text-lg flex items-center gap-2 ${foodStatus.text}`}>
                  Alimentação Fora
                  <Info className="h-3 w-3" />
                </CardTitle>
                <CardDescription className={foodStatus.text}>
                  {formatCurrency(foodMetrics.total)} / {formatCurrency(foodMetrics.monthlyGoal)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${foodStatus.text}`}>
                    {((foodMetrics.total / foodMetrics.monthlyGoal) * 100).toFixed(0)}%
                  </span>
                  <foodStatus.icon className={`h-6 w-6 ${foodStatus.text}`} />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Total gasto com alimentação fora de casa (restaurantes, delivery) comparado com a meta. 
              Inclui todas as transações categorizadas como &quot;Alimentação Fora&quot;.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`cursor-pointer hover:scale-105 transition-transform ${subStatus.bg}`}
              onClick={() => handleCategoryClick('ASSINATURAS')}
            >
              <CardHeader>
                <CardTitle className={`text-lg flex items-center gap-2 ${subStatus.text}`}>
                  Assinaturas
                  <Info className="h-3 w-3" />
                </CardTitle>
                <CardDescription className={subStatus.text}>
                  {formatCurrency(subscriptionMetrics.total)} / {formatCurrency(subscriptionMetrics.monthlyGoal)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${subStatus.text}`}>
                    {((subscriptionMetrics.total / subscriptionMetrics.monthlyGoal) * 100).toFixed(0)}%
                  </span>
                  <subStatus.icon className={`h-6 w-6 ${subStatus.text}`} />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Total gasto com assinaturas (Netflix, Spotify, etc.) comparado com a meta mensal. 
              Ajuda a identificar gastos recorrentes que podem ser otimizados.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`cursor-pointer hover:scale-105 transition-transform ${debtStatus.bg}`}
              onClick={() => handleCategoryClick('DIVIDAS_CDC')}
            >
              <CardHeader>
                <CardTitle className={`text-lg flex items-center gap-2 ${debtStatus.text}`}>
                  Dívidas / CDC
                  <Info className="h-3 w-3" />
                </CardTitle>
                <CardDescription className={debtStatus.text}>
                  {formatCurrency(debtMetrics.total)} / {formatCurrency(debtMetrics.monthlyGoal)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${debtStatus.text}`}>
                    {((debtMetrics.total / debtMetrics.monthlyGoal) * 100).toFixed(0)}%
                  </span>
                  <debtStatus.icon className={`h-6 w-6 ${debtStatus.text}`} />
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Total gasto com dívidas e crédito consignado (CDC) comparado com a meta. 
              Inclui pagamentos de empréstimos e financiamentos.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Previsões por Categoria */}
      {categoryForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Previsões por Categoria
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Projeções mensais baseadas no ritmo atual de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryForecasts.map(forecast => {
                const trendIcon = forecast.trend === 'increasing' 
                  ? <TrendingUp className="h-4 w-4 text-red-400" />
                  : forecast.trend === 'decreasing'
                  ? <TrendingDown className="h-4 w-4 text-green-400" />
                  : <Minus className="h-4 w-4 text-gray-400" />
                
                return (
                  <div 
                    key={forecast.category}
                    className="p-4 rounded-lg border bg-card/50 cursor-pointer hover:scale-105 hover:bg-card transition-all"
                    onClick={() => handleForecastClick(forecast)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">
                          {getCategoryLabel(forecast.category)}
                        </p>
                        <p className="text-lg font-bold mt-1">
                          {formatCurrency(forecast.projectedMonthly)}
                        </p>
                      </div>
                      {trendIcon}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {forecast.message}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Atual: {formatCurrency(forecast.currentTotal)}</span>
                      <span>Média/dia: {formatCurrency(forecast.dailyAverage)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features de Automação */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auto-ajuste Semanal */}
        <WeeklyAdjustmentCard adjustments={weeklyAdjustments} />
        
        {/* Agrupamento de PIX */}
        <PIXGroupingCard groups={pixGroups} />
      </div>

      {/* Padrões de Carência do Mês */}
      {scarcityPatterns.length > 0 && (
        <ScarcityPatternsCard patterns={scarcityPatterns} />
      )}

      {/* Heatmap de Gastos */}
      <HeatmapView days={heatmapData} />

      {/* Mapas de Compras */}
      <PurchaseMapsView
        hourlyData={hourlyMap}
        storeData={storeMap}
        categoryData={categoryMap}
      />


      {/* Modais */}
      {selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          metrics={getCategoryMetrics(selectedCategory)}
          forecast={categoryForecasts.find(f => f.category === selectedCategory) || null}
          transactions={transactions}
          open={isCategoryModalOpen}
          onOpenChange={setIsCategoryModalOpen}
        />
      )}
      
      <ForecastModal
        forecast={selectedForecast}
        open={isForecastModalOpen}
        onOpenChange={setIsForecastModalOpen}
      />
      

      {/* Modal de Alertas Críticos */}
      <CriticalAlertsModal
        alerts={criticalAlerts}
        open={isAlertsModalOpen}
        onOpenChange={(open) => {
          setIsAlertsModalOpen(open)
          // Se fechou manualmente, marca todos os alertas críticos atuais como mostrados
          if (!open) {
            const criticalAlertIds = criticalAlerts
              .filter(a => a.severity === 'critical' && !a.canDismiss)
              .map(a => a.id)
            setShownAlertIds(prev => {
              const newSet = new Set(prev)
              criticalAlertIds.forEach(id => newSet.add(id))
              return newSet
            })
          }
        }}
      />
    </div>
  )
}

