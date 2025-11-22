'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { calculateCategoryMetrics } from '@/lib/projections'
import { Category, getCategoryLabel, getCategoryColor } from '@/lib/classification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { CategoryModal } from '@/components/modals/CategoryModal'
import { calculateAllCategoryForecasts } from '@/lib/categoryForecast'
import { calculateAutoLimits } from '@/lib/autoLimits'
import { AutoLimitsCard } from '@/components/AutoLimitsCard'

const ALL_CATEGORIES: Category[] = [
  'ALIMENTACAO_DENTRO',
  'ALIMENTACAO_FORA',
  'PIX_SAIDA',
  'PIX_ENTRADA',
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
  'SALARIO',
  'OUTROS',
]

export function CategoryAnalysisView() {
  const { transactions, salary, goals, customCategories, setGoal, initialBalance } = useFinanceStore()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category)
    setIsCategoryModalOpen(true)
  }

  // Combina categorias padrão com customizadas e extrai categorias únicas das transações
  const allUsedCategories = new Set<Category>()
  transactions.forEach(t => allUsedCategories.add(t.category))
  
  const categoryMetrics = Array.from(allUsedCategories).map(category => {
    const goal = goals[category] || 0
    return calculateCategoryMetrics(transactions, category, goal, salary)
  }).filter(cm => cm.total > 0 || cm.monthlyGoal > 0)
  
  const categoryForecasts = calculateAllCategoryForecasts(transactions)
  
  // Auto-limites por categoria (com regras conscientes)
  const autoLimits = calculateAutoLimits(transactions, ALL_CATEGORIES, salary, initialBalance)

  const chartData = categoryMetrics
    .filter(cm => cm.category !== 'PIX_ENTRADA') // Remove entradas do gráfico
    .map(cm => ({
      name: getCategoryLabel(cm.category),
      total: cm.total,
      meta: cm.monthlyGoal,
    }))

  function getStatusIcon(status: 'ok' | 'risk' | 'critical') {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-400" />
      case 'risk':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
    }
  }

  function getStatusLabel(status: 'ok' | 'risk' | 'critical') {
    switch (status) {
      case 'critical':
        return 'Crítico'
      case 'risk':
        return 'Risco'
      default:
        return 'OK'
    }
  }

  function getStatusColor(status: 'ok' | 'risk' | 'critical') {
    switch (status) {
      case 'critical':
        return 'text-red-400'
      case 'risk':
        return 'text-yellow-400'
      default:
        return 'text-green-400'
    }
  }

  return (
    <div className="space-y-6">
        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help flex items-center gap-2">
                    Gastos por Categoria vs Meta
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Comparação visual entre o total gasto em cada categoria e a meta estabelecida. 
                    Barras verdes indicam que está dentro da meta, amarelas indicam risco e vermelhas indicam que ultrapassou.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription>Comparação visual entre gastos reais e metas estabelecidas</CardDescription>
          </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9CA3AF"
                angle={-45}
                textAnchor="end"
                height={120}
              />
              <YAxis stroke="#9CA3AF" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="total" fill="#EF4444" name="Gasto Real" />
              <Bar dataKey="meta" fill="#10B981" name="Meta Mensal" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help flex items-center gap-2">
                  Análise Detalhada por Categoria
                  <Info className="h-4 w-4 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Tabela completa com todas as categorias de gastos, mostrando total gasto, meta mensal, 
                  percentual do salário consumido e status (OK, Risco ou Crítico). 
                  Ajuda a identificar categorias que precisam de atenção.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>Métricas completas de cada categoria de gasto</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Total do Mês</TableHead>
                <TableHead className="text-right">Meta Mensal</TableHead>
                <TableHead className="text-right">% do Salário</TableHead>
                <TableHead className="text-right">% da Meta</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryMetrics.map((cm) => {
                const percentageOfGoal = cm.monthlyGoal > 0 
                  ? (cm.total / cm.monthlyGoal) * 100 
                  : 0

                return (
                  <TableRow 
                    key={cm.category}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleCategoryClick(cm.category)}
                  >
                    <TableCell>
                      <span className={getCategoryColor(cm.category)}>
                        {getCategoryLabel(cm.category)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cm.total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {cm.monthlyGoal > 0 ? formatCurrency(cm.monthlyGoal) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {cm.percentageOfSalary.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {cm.monthlyGoal > 0 ? (
                        <span className={percentageOfGoal > 100 ? 'text-red-400' : percentageOfGoal > 80 ? 'text-yellow-400' : 'text-green-400'}>
                          {percentageOfGoal.toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(cm.status)}
                        <span className={getStatusColor(cm.status)}>
                          {getStatusLabel(cm.status)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {categoryMetrics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada. Faça upload de um arquivo CSV para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorias OK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">
              {categoryMetrics.filter(cm => cm.status === 'ok').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorias em Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-400">
              {categoryMetrics.filter(cm => cm.status === 'risk').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorias Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-400">
              {categoryMetrics.filter(cm => cm.status === 'critical').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-limites */}
      <AutoLimitsCard
        autoLimits={autoLimits}
        currentGoals={goals}
        onApplyLimit={(category, limit) => {
          // Aplica o limite sugerido como meta da categoria
          setGoal(category, limit)
        }}
      />

      {/* Modal de Categoria */}
      {selectedCategory && (
        <CategoryModal
          category={selectedCategory}
          metrics={categoryMetrics.find(cm => cm.category === selectedCategory) || null}
          forecast={categoryForecasts.find(f => f.category === selectedCategory) || null}
          transactions={transactions}
          open={isCategoryModalOpen}
          onOpenChange={setIsCategoryModalOpen}
        />
      )}
    </div>
  )
}

