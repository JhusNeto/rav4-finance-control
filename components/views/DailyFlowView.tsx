'use client'

import { useState, useMemo } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { getBalanceOverTime } from '@/lib/projections'
import { getCategoryLabel, getCategoryColor } from '@/lib/classification'
import { Transaction } from '@/lib/classification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { TrendingDown, Zap, ShoppingBag, Info, Calendar } from 'lucide-react'
import { CategoryEditor } from '@/components/CategoryEditor'
import { TransactionDetails } from '@/components/TransactionDetails'
import { EmotionalBadge } from '@/components/EmotionalBadge'
import { isEmotionalPurchase } from '@/lib/transactionUtils'
import { TransactionModal } from '@/components/modals/TransactionModal'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export function DailyFlowView() {
  const { transactions, initialBalance } = useFinanceStore()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsTransactionModalOpen(true)
  }

  const today = new Date()
  
  // Lista de meses disponíveis nas transações
  const availableMonths = useMemo(() => {
    if (transactions.length === 0) return []
    
    const monthSet = new Set<string>()
    transactions.forEach(t => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
      monthSet.add(monthKey)
    })
    
    return Array.from(monthSet)
      .map(key => {
        const [year, month] = key.split('-').map(Number)
        return new Date(year, month - 1, 1)
      })
      .sort((a, b) => b.getTime() - a.getTime()) // Mais recente primeiro
  }, [transactions])

  // Filtra transações do mês selecionado
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  const isCurrentMonth = selectedMonth.getMonth() === today.getMonth() && 
                         selectedMonth.getFullYear() === today.getFullYear()
  const endDate = isCurrentMonth ? today : monthEnd
  
  const monthTransactions = transactions
    .filter(t => {
      const tDate = t.date
      return tDate >= monthStart && tDate <= endDate
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  // Gráfico de saldo apenas para o mês selecionado
  const balanceOverTime = useMemo(() => {
    // Calcula saldo inicial do mês selecionado
    const transactionsBeforeMonth = transactions.filter(t => t.date < monthStart)
    let balanceAtMonthStart = initialBalance
    transactionsBeforeMonth.forEach(t => {
      balanceAtMonthStart += t.amount
    })
    
    // Calcula saldo ao longo do mês selecionado
    const balanceData: { date: Date; balance: number }[] = []
    let currentBalance = balanceAtMonthStart
    
    const monthTransactionsSorted = monthTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    monthTransactionsSorted.forEach(t => {
      currentBalance += t.amount
      balanceData.push({ date: t.date, balance: currentBalance })
    })
    
    return balanceData
  }, [transactions, initialBalance, monthStart, monthTransactions])

  // Encontrar dia mais caro
  const expensesByDay = new Map<string, number>()
  monthTransactions
    .filter(t => t.type === 'SAIDA')
    .forEach(t => {
      const dayKey = formatDate(t.date)
      expensesByDay.set(dayKey, (expensesByDay.get(dayKey) || 0) + Math.abs(t.amount))
    })

  let mostExpensiveDay = { date: '', amount: 0 }
  expensesByDay.forEach((amount, date) => {
    if (amount > mostExpensiveDay.amount) {
      mostExpensiveDay = { date, amount }
    }
  })

  // Dia com maior uso de PIX
  const pixByDay = new Map<string, number>()
  monthTransactions
    .filter(t => t.category === 'PIX_SAIDA')
    .forEach(t => {
      const dayKey = formatDate(t.date)
      pixByDay.set(dayKey, (pixByDay.get(dayKey) || 0) + Math.abs(t.amount))
    })

  let highestPixDay = { date: '', amount: 0 }
  pixByDay.forEach((amount, date) => {
    if (amount > highestPixDay.amount) {
      highestPixDay = { date, amount }
    }
  })

  // Pico de alimentação fora
  const foodByDay = new Map<string, number>()
  monthTransactions
    .filter(t => t.category === 'ALIMENTACAO_FORA')
    .forEach(t => {
      const dayKey = formatDate(t.date)
      foodByDay.set(dayKey, (foodByDay.get(dayKey) || 0) + Math.abs(t.amount))
    })

  let highestFoodDay = { date: '', amount: 0 }
  foodByDay.forEach((amount, date) => {
    if (amount > highestFoodDay.amount) {
      highestFoodDay = { date, amount }
    }
  })

  // Compras emocionais (transações acima de R$ 200 em compras gerais)
  const emotionalPurchases = monthTransactions.filter(isEmotionalPurchase)

  const chartData = balanceOverTime.map(item => ({
    date: formatDate(item.date),
    saldo: item.balance,
  }))

  return (
    <div className="space-y-6">
      {/* Filtro de Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtrar por Mês
          </CardTitle>
          <CardDescription>
            Selecione o mês para visualizar e editar transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <select
              value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number)
                setSelectedMonth(new Date(year, month - 1, 1))
              }}
              className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
            >
              {availableMonths.length > 0 ? (
                availableMonths.map(month => {
                  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
                  const monthNames = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                  ]
                  const label = `${monthNames[month.getMonth()]} ${month.getFullYear()}`
                  const isCurrent = month.getMonth() === today.getMonth() && 
                                   month.getFullYear() === today.getFullYear()
                  return (
                    <option key={monthKey} value={monthKey}>
                      {label} {isCurrent ? '(Atual)' : ''}
                    </option>
                  )
                })
              ) : (
                <option value={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`}>
                  {format(today, 'MMMM yyyy', { locale: ptBR })}
                </option>
              )}
            </select>
            <div className="text-sm text-muted-foreground">
              {monthTransactions.length} transação(ões) encontrada(s) em {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destaques Automáticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              Dia Mais Caro
            </CardDescription>
            <CardTitle className="text-lg text-red-400">
              {mostExpensiveDay.date || 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(mostExpensiveDay.amount)}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Maior PIX do Dia
            </CardDescription>
            <CardTitle className="text-lg text-yellow-400">
              {highestPixDay.date || 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(highestPixDay.amount)}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-400" />
              Pico de Alimentação
            </CardDescription>
            <CardTitle className="text-lg text-orange-400">
              {highestFoodDay.date || 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(highestFoodDay.amount)}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/50 bg-purple-500/5">
          <CardHeader className="pb-2">
            <CardDescription>Compras Emocionais</CardDescription>
            <CardTitle className="text-lg text-purple-400">
              {emotionalPurchases.length} ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(emotionalPurchases.reduce((sum, t) => sum + Math.abs(t.amount), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Variação do Saldo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help flex items-center gap-2">
                  Variação do Saldo em {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                  <Info className="h-4 w-4 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Gráfico mostrando como o saldo varia dia a dia ao longo do mês selecionado. 
                  Permite visualizar a evolução financeira e identificar tendências de gastos.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Evolução diária do saldo em {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
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
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Transações</CardTitle>
          <CardDescription>
            Transações de {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })} em ordem cronológica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {monthTransactions.map((transaction) => {
              const isExpense = transaction.type === 'SAIDA'
              const isEmotional = isEmotionalPurchase(transaction)
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 hover:scale-[1.02] transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span 
                        className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        {formatDate(transaction.date)}
                      </span>
                      <CategoryEditor transaction={transaction} />
                      {isEmotional && <EmotionalBadge />}
                    </div>
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <TransactionDetails transaction={transaction} />
                    </div>
                  </div>
                  <div 
                    className={`text-lg font-bold cursor-pointer ${isExpense ? 'text-red-400' : 'text-green-400'}`}
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    {isExpense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              )
            })}
            {monthTransactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma transação encontrada. Faça upload de um arquivo CSV para começar.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Transação */}
      <TransactionModal
        transaction={selectedTransaction}
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
      />
    </div>
  )
}

