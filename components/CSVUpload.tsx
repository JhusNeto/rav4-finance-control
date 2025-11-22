'use client'

import { useRef, useState, useEffect } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { parseCSV, convertCSVToTransactions } from '@/lib/csvParser'
import { saveToServer } from '@/lib/dataPersistence'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Upload, FileText, CheckCircle2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function CSVUpload() {
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { 
    setTransactions, 
    setInitialBalance, 
    setSalary,
    transactions, 
    initialBalance,
    salary,
    goals,
    clearTransactions 
  } = useFinanceStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Lê o arquivo como ArrayBuffer primeiro para poder tentar diferentes encodings
      const arrayBuffer = await file.arrayBuffer()
      
      // Tenta primeiro com UTF-8
      let text = new TextDecoder('utf-8').decode(arrayBuffer)
      
      // Se detectar problemas de encoding, tenta ISO-8859-1 (comum em arquivos brasileiros)
      if (text.includes('�')) {
        try {
          text = new TextDecoder('iso-8859-1').decode(arrayBuffer)
        } catch (e) {
          // Se falhar, tenta Windows-1252
          try {
            text = new TextDecoder('windows-1252').decode(arrayBuffer)
          } catch (e2) {
            // Se tudo falhar, mantém UTF-8 mesmo com caracteres corrompidos
            console.warn('Não foi possível converter encoding, usando UTF-8 com caracteres corrompidos')
          }
        }
      }
      
      const rows = await parseCSV(text)
      const result = await convertCSVToTransactions(rows)
      
      console.log('CSV Parse Result:', {
        totalRows: rows.length,
        transactionsFound: result.transactions.length,
        initialBalance: result.initialBalance,
        sampleTransactions: result.transactions.slice(0, 5)
      })
      
      if (result.transactions.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo. Verifique o formato do CSV.')
      }
      
      // Faz MERGE com transações existentes (não substitui)
      // Combina transações existentes com as novas do CSV
      const existingTransactions = transactions || []
      const newTransactions = result.transactions
      
      // Combina todas as transações
      const allTransactions = [...existingTransactions, ...newTransactions]
      
      // Remove duplicatas baseado em: data + valor + descrição normalizada
      const uniqueTransactions = allTransactions.filter((tx, index, self) => {
        const txKey = `${tx.date.toISOString().split('T')[0]}_${tx.amount}_${tx.description.toLowerCase().trim()}`
        return index === self.findIndex(t => {
          const tKey = `${t.date.toISOString().split('T')[0]}_${t.amount}_${t.description.toLowerCase().trim()}`
          return tKey === txKey
        })
      })
      
      console.log(`[CSV Upload] Merge realizado:`, {
        transacoesExistentes: existingTransactions.length,
        transacoesNovas: newTransactions.length,
        totalAposMerge: allTransactions.length,
        totalAposDeduplicacao: uniqueTransactions.length,
        duplicatasRemovidas: allTransactions.length - uniqueTransactions.length
      })
      
      // CORREÇÃO: Usa apenas o saldo anterior do CSV mais antigo como ponto de partida
      // Isso garante cálculos íntegros e consistentes com o extrato bancário
      // Encontra a transação mais antiga para determinar qual CSV tem o saldo anterior correto
      const allTransactionsSorted = uniqueTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())
      const oldestTransaction = allTransactionsSorted[0]
      const newestTransaction = allTransactionsSorted[allTransactionsSorted.length - 1]
      
      // Se a transação mais antiga é do novo CSV, usa o saldo anterior do novo CSV
      // Caso contrário, mantém o saldo anterior existente (que já é do CSV mais antigo)
      const oldestDate = oldestTransaction ? oldestTransaction.date : new Date()
      const newTransactionsSorted = newTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())
      const oldestNewTransaction = newTransactionsSorted[0]
      
      let finalInitialBalance = initialBalance
      
      if (oldestNewTransaction && oldestNewTransaction.date.getTime() <= oldestDate.getTime()) {
        // O novo CSV contém transações mais antigas, então usa seu saldo anterior
        // IMPORTANTE: Isso recalcula tudo desde o novo ponto de partida mais antigo
        finalInitialBalance = result.initialBalance !== 0 ? result.initialBalance : initialBalance
        console.log(`[CSV Upload] ⚠️ CSV mais antigo detectado! Usando saldo anterior do novo CSV:`, {
          saldoAnterior: finalInitialBalance,
          dataTransacaoMaisAntiga: oldestNewTransaction.date.toISOString().split('T')[0],
          dataTransacaoMaisAntigaAnterior: oldestDate.toISOString().split('T')[0],
          origem: 'novo CSV (mais antigo)',
          acao: 'Recalculando tudo desde este ponto'
        })
      } else {
        // Mantém o saldo anterior existente (já é do CSV mais antigo)
        console.log(`[CSV Upload] Mantendo saldo anterior do CSV mais antigo:`, {
          saldoAnterior: finalInitialBalance,
          dataTransacaoMaisAntiga: oldestDate.toISOString().split('T')[0],
          dataTransacaoMaisAntigaNovo: oldestNewTransaction ? oldestNewTransaction.date.toISOString().split('T')[0] : 'N/A',
          origem: 'CSV anterior (mais antigo)',
          acao: 'Novo CSV não é mais antigo, mantendo saldo existente'
        })
      }
      
      // Detecta salário automaticamente antes de salvar
      const { autoDetectSalary } = await import('@/lib/salaryDetection')
      const detectedSalary = autoDetectSalary(uniqueTransactions)
      const finalSalary = detectedSalary || salary
      
      if (detectedSalary && detectedSalary !== salary) {
        console.log(`💰 Salário detectado automaticamente após upload: R$ ${detectedSalary.toFixed(2)} (anterior: R$ ${salary.toFixed(2)})`)
      }
      
      // Salva automaticamente no servidor (JSON permanente)
      const { customCategories } = useFinanceStore.getState()
      const saved = await saveToServer(
        uniqueTransactions,
        finalInitialBalance,
        finalSalary, // Usa salário detectado ou o atual
        goals,
        new Date(), // Sempre usa data atual
        customCategories
      )
      
      if (!saved) {
        console.warn('Aviso: Dados salvos apenas localmente (servidor indisponível)')
      }
      
      // Atualiza transações (isso vai detectar o salário automaticamente)
      setTransactions(uniqueTransactions)
      setInitialBalance(finalInitialBalance)
      
      // Se detectou um salário diferente, atualiza também
      if (detectedSalary && detectedSalary !== salary) {
        setSalary(finalSalary)
      }
      setSuccess(true)
      
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo CSV')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Extrato CSV
        </CardTitle>
        <CardDescription>
          Faça upload do seu extrato bancário em formato CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processando...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Selecionar Arquivo CSV
            </>
          )}
        </button>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>
              {transactions.length} transações importadas com sucesso!
              {initialBalance !== 0 && (
                <span className="block mt-1">
                  Saldo inicial: {formatCurrency(initialBalance)}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {mounted && transactions.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <div className="font-medium">{transactions.length} transações carregadas</div>
              {initialBalance !== 0 && (
                <div className="text-muted-foreground text-xs mt-1">
                  Saldo inicial: {formatCurrency(initialBalance)}
                </div>
              )}
            </div>
            <button
              onClick={async () => {
                if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
                  await clearTransactions()
                  setSuccess(false)
                }
              }}
              className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

