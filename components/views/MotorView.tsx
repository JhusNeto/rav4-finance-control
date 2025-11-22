'use client'

import { useFinanceStore } from '@/store/financeStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Cpu, Brain, AlertTriangle, TrendingUp, FileText } from 'lucide-react'
import { NaturalLanguageDetector } from '@/lib/naturalLanguageDetection'
import { DebtSimulator } from '@/lib/debtSimulator'
import { groupPIXByRecipient } from '@/lib/pixGrouping'
import { detectHiddenSubscriptions } from '@/lib/hiddenSubscriptions'
import { detectAnomalies } from '@/lib/anomalyDetection'
import { detectHiddenPatterns } from '@/lib/patternDetection'

export function MotorView() {
  const { transactions } = useFinanceStore()
  
  // Inteligência automática
  const naturalLanguageDetections = NaturalLanguageDetector.detectPatterns(transactions)
  const detectedDebts = DebtSimulator.detectDebts(transactions)
  const pixGroups = groupPIXByRecipient(transactions)
  const hiddenSubscriptions = detectHiddenSubscriptions(transactions)
  const anomalies = detectAnomalies(transactions)
  const patterns = detectHiddenPatterns(transactions)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🟫 Motor</h1>
          <p className="text-muted-foreground mt-1">Backend Visual - Sistema em Background</p>
        </div>
      </div>

      {/* Inteligência Automática */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Inteligência Automática
          </CardTitle>
          <CardDescription>
            Processamento automático de transações e padrões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Classificação Automática</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {transactions.length} transações processadas
              </p>
            </div>
            
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Detecções por Linguagem Natural</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {naturalLanguageDetections.length} padrões detectados
              </p>
            </div>
            
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4" />
                <span className="font-medium">Agrupamento de PIX</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {pixGroups.length} grupos de destinatários
              </p>
            </div>
            
            <div className="p-4 rounded-lg border bg-card/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Assinaturas Ocultas</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {hiddenSubscriptions.length} assinaturas detectadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomalias */}
      <Card>
        <CardHeader>
          <CardTitle>Anomalias Detectadas</CardTitle>
          <CardDescription>
            Transações fora do padrão identificadas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {anomalies.slice(0, 10).map((anomaly, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
                <p className="text-sm font-medium">{anomaly.type}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {anomaly.transaction.description} - {formatCurrency(Math.abs(anomaly.transaction.amount))}
                </p>
                <p className="text-xs text-muted-foreground">
                  Detectado em {formatDate(anomaly.detectedAt)}
                </p>
              </div>
            ))}
            {anomalies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma anomalia detectada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Padrões Ocultos */}
      <Card>
        <CardHeader>
          <CardTitle>Padrões Ocultos Detectados</CardTitle>
          <CardDescription>
            Comportamentos perigosos identificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {patterns.slice(0, 10).map((pattern, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-red-500/10 border-red-500/20">
                <p className="text-sm font-medium">{pattern.type}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pattern.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Detectado em {formatDate(pattern.detectedAt)}
                </p>
              </div>
            ))}
            {patterns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum padrão perigoso detectado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Logs do Sistema</CardTitle>
          <CardDescription>
            Aprendizados e mudanças automáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">•</span> Sistema iniciado
            </div>
            <div className="p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">•</span> {transactions.length} transações carregadas
            </div>
            <div className="p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">•</span> {naturalLanguageDetections.length} detecções geradas
            </div>
            <div className="p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">•</span> {pixGroups.length} grupos de PIX identificados
            </div>
            <div className="p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">•</span> {hiddenSubscriptions.length} assinaturas ocultas encontradas
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

