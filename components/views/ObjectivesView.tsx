'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { calculateRAV4Progress } from '@/lib/rav4Progress'
import { DebtSimulator } from '@/lib/debtSimulator'
import { RAV4ProgressCard } from '@/components/RAV4ProgressCard'
import { DebtSimulatorCard } from '@/components/DebtSimulatorCard'
import { RAV4TargetModal } from '@/components/modals/RAV4TargetModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Target, Calculator, TrendingUp, TrendingDown, AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ObjectivesView() {
  const { 
    transactions, 
    initialBalance, 
    goals, 
    rav4Target, 
    rav4TargetDate, 
    rav4StartDate, 
    setRAV4Target,
    setGoal 
  } = useFinanceStore()
  
  const [isRAV4TargetModalOpen, setIsRAV4TargetModalOpen] = useState(false)
  
  // RAV4 Progress
  const rav4Progress = calculateRAV4Progress(
    transactions,
    initialBalance,
    rav4Target,
    rav4TargetDate,
    rav4StartDate
  )
  
  // Dívidas detectadas
  const detectedDebts = DebtSimulator.detectDebts(transactions)
  
  // Calcula dívidas restantes
  const totalDebts = transactions
    .filter(t => t.category === 'DIVIDAS_CDC' && t.type === 'SAIDA')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🟪 Objetivos</h1>
          <p className="text-muted-foreground mt-1">Modo RAV4 - Jornada rumo à liberdade financeira</p>
        </div>
      </div>

      {/* Indicadores RAV4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Indicadores RAV4
          </CardTitle>
          <CardDescription>
            Progresso total e projeções do Projeto RAV4
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RAV4ProgressCard 
            progress={rav4Progress}
            onEditTarget={() => setIsRAV4TargetModalOpen(true)}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="text-xs text-muted-foreground mb-1">Progresso Total</div>
              <div className="text-2xl font-bold">{rav4Progress.percentage.toFixed(1)}%</div>
            </div>
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="text-xs text-muted-foreground mb-1">Dívidas Restantes</div>
              <div className="text-2xl font-bold text-red-400">{formatCurrency(totalDebts)}</div>
            </div>
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="text-xs text-muted-foreground mb-1">Valor da Entrada</div>
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(rav4Target * 0.2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">(20% do objetivo)</div>
            </div>
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="text-xs text-muted-foreground mb-1">Dias Restantes</div>
              <div className="text-2xl font-bold">{rav4Progress.daysRemaining}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simuladores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simuladores
          </CardTitle>
          <CardDescription>
            Simule diferentes cenários para acelerar seus objetivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simulador de Dívidas */}
          {detectedDebts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Amortização Antecipada de Dívidas</h3>
              {detectedDebts.map(debt => (
                <DebtSimulatorCard key={debt.id} debt={debt} />
              ))}
            </div>
          )}
          
          {/* Simuladores de Impacto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Economia por Corte de Assinaturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency((goals.ASSINATURAS || 0) * 0.5)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Se cortar 50% das assinaturas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reduzir Alimentação Fora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency((goals.ALIMENTACAO_FORA || 0) * 0.3)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Se reduzir 30% em delivery
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reduzir PIX por 30 dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency((goals.PIX_SAIDA || 0) * 0.4)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Se reduzir 40% dos PIX
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ajustes
          </CardTitle>
          <CardDescription>
            Configure metas mensais e limites de categorias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card/50">
              <h4 className="font-medium mb-3">Metas Mensais</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>PIX Saída:</span>
                  <span className="font-bold">{formatCurrency(goals.PIX_SAIDA || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alimentação Fora:</span>
                  <span className="font-bold">{formatCurrency(goals.ALIMENTACAO_FORA || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assinaturas:</span>
                  <span className="font-bold">{formatCurrency(goals.ASSINATURAS || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dívidas / CDC:</span>
                  <span className="font-bold">{formatCurrency(goals.DIVIDAS_CDC || 0)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-card/50">
              <h4 className="font-medium mb-3">Regras da Austeridade</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span>Burn rate positivo = Verde</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-yellow-400" />
                  <span>Burn rate próximo de zero = Amarelo</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>Burn rate negativo = Vermelho</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsRAV4TargetModalOpen(true)}
          >
            Editar Objetivo RAV4
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Edição de Objetivo */}
      <RAV4TargetModal
        open={isRAV4TargetModalOpen}
        onOpenChange={setIsRAV4TargetModalOpen}
        currentTarget={rav4Target}
        currentTargetDate={rav4TargetDate}
        currentStartDate={rav4StartDate}
        onSave={(target, targetDate, startDate) => {
          setRAV4Target(target, targetDate, startDate)
        }}
      />
    </div>
  )
}

