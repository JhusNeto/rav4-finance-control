'use client'

import { DebtSimulation, Debt } from '@/lib/debtSimulator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calculator, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { DebtSimulator } from '@/lib/debtSimulator'

interface DebtSimulatorCardProps {
  debt: Debt
  onSimulate?: (extraPayment: number) => DebtSimulation
}

export function DebtSimulatorCard({ debt, onSimulate }: DebtSimulatorCardProps) {
  const [extraPayment, setExtraPayment] = useState(0)
  const [simulation, setSimulation] = useState<DebtSimulation | null>(null)
  
  const handleSimulate = () => {
    const sim = DebtSimulator.generateSimulation(debt, extraPayment)
    setSimulation(sim)
    onSimulate?.(extraPayment)
  }
  
  if (!simulation) {
    // Mostra simulação inicial (sem amortização)
    const initialSim = DebtSimulator.generateSimulation(debt, 0)
    setSimulation(initialSim)
  }
  
  const currentSim = simulation || DebtSimulator.generateSimulation(debt, 0)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Simulador de Liquidação: {debt.name}
        </CardTitle>
        <CardDescription>
          Simule amortização antecipada e veja sua economia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da Dívida */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border bg-card/50">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Saldo Atual</div>
            <div className="font-bold">{formatCurrency(debt.currentBalance)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Parcela Mensal</div>
            <div className="font-bold">{formatCurrency(debt.monthlyPayment)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Taxa de Juros</div>
            <div className="font-bold">{debt.interestRate}% ao mês</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Início</div>
            <div className="font-bold text-sm">
              {debt.startDate && !isNaN(new Date(debt.startDate).getTime()) 
                ? formatDate(debt.startDate) 
                : '-'}
            </div>
          </div>
        </div>
        
        {/* Simulação Atual (sem amortização) */}
        <div className="p-4 rounded-lg border bg-muted/30">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cenário Atual (sem amortização)
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Total de Juros</div>
              <div className="font-bold text-red-400">{formatCurrency(currentSim.currentScenario.totalInterest)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Meses para Quitar</div>
              <div className="font-bold">{currentSim.currentScenario.totalMonths}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Data Final</div>
              <div className="font-bold">
                {currentSim.currentScenario.finalDate && !isNaN(new Date(currentSim.currentScenario.finalDate).getTime())
                  ? formatDate(currentSim.currentScenario.finalDate)
                  : '-'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Pago</div>
              <div className="font-bold">{formatCurrency(currentSim.currentScenario.totalPaid)}</div>
            </div>
          </div>
        </div>
        
        {/* Simulador de Amortização */}
        <div className="p-4 rounded-lg border bg-card/50">
          <h4 className="font-medium mb-3">Simular Amortização Antecipada</h4>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Valor extra por mês"
              value={extraPayment || ''}
              onChange={(e) => setExtraPayment(Number(e.target.value))}
              className="flex-1"
            />
            <Button onClick={handleSimulate}>
              Simular
            </Button>
          </div>
        </div>
        
        {/* Resultado da Simulação (se houver amortização) */}
        {currentSim.acceleratedScenario.extraPayment > 0 && (
          <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/50">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-green-400">
              <TrendingDown className="h-4 w-4" />
              Com Amortização de {formatCurrency(currentSim.acceleratedScenario.extraPayment)}/mês
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Economia de Juros:</span>
                <span className="font-bold text-green-400">
                  {formatCurrency(currentSim.acceleratedScenario.interestSaved)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Meses Economizados:</span>
                <span className="font-bold text-green-400">
                  {currentSim.acceleratedScenario.monthsSaved} meses
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nova Data Final:</span>
                <span className="font-bold">
                  {currentSim.acceleratedScenario.finalDate && !isNaN(new Date(currentSim.acceleratedScenario.finalDate).getTime())
                    ? formatDate(currentSim.acceleratedScenario.finalDate)
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Pago:</span>
                <span className="font-bold">
                  {formatCurrency(currentSim.acceleratedScenario.totalPaid)}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Data de Libertação Financeira */}
        <div className="p-4 rounded-lg border-2 border-primary/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h4 className="font-bold text-lg">Data de Libertação Financeira</h4>
          </div>
          <div className="text-2xl font-bold text-primary mb-1">
            {currentSim.liberationDate && !isNaN(new Date(currentSim.liberationDate).getTime())
              ? formatDate(currentSim.liberationDate)
              : '-'}
          </div>
          <p className="text-sm text-muted-foreground">
            {currentSim.message}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

