'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { exportToJSON, importFromJSON, downloadJSON, readJSONFile } from '@/lib/dataExport'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Download, Upload, Database, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export function DataManager() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const {
    transactions,
    initialBalance,
    salary,
    goals,
    customCategories,
    setTransactions,
    setInitialBalance,
    setSalary,
  } = useFinanceStore()
  
  const setGoal = useFinanceStore((state) => state.setGoal)
  const addCustomCategory = useFinanceStore((state) => state.addCustomCategory)

  const handleExport = () => {
    try {
      setIsExporting(true)
      setError(null)
      setSuccess(null)
      
      const jsonData = exportToJSON(transactions, initialBalance, salary, goals, new Date(), customCategories)
      const filename = `rav4-finance-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
      downloadJSON(jsonData, filename)
      
      setSuccess(`Dados exportados com sucesso! Arquivo: ${filename}`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar dados')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError(null)
    setSuccess(null)

    try {
      const jsonString = await readJSONFile(file)
      const data = importFromJSON(jsonString)

      if (!data) {
        throw new Error('Formato de arquivo inválido')
      }

      // Confirmação antes de importar
      const confirmed = confirm(
        `Importar ${data.transactions.length} transações?\n` +
        `Isso substituirá todos os dados atuais.`
      )

      if (!confirmed) {
        setIsImporting(false)
        return
      }

      // Importa os dados
      setTransactions(data.transactions)
      setInitialBalance(data.initialBalance)
      setSalary(data.salary)
      
      // Restaura metas
      Object.keys(data.goals).forEach((category) => {
        setGoal(category as any, data.goals[category])
      })
      
      // Restaura categorias customizadas
      if (data.customCategories && Array.isArray(data.customCategories)) {
        data.customCategories.forEach((cat: string) => {
          addCustomCategory(cat)
        })
      }
      
      // currentDate não é mais necessário - sempre usa mês atual

      setSuccess(
        `Dados importados com sucesso! ${data.transactions.length} transações carregadas.`
      )
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar dados')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsImporting(false)
      // Limpa o input para permitir importar o mesmo arquivo novamente
      event.target.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gerenciamento de Dados
        </CardTitle>
        <CardDescription>
          Exporte ou importe seus dados financeiros em formato JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Transações</div>
            <div className="text-lg font-bold">{transactions.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Saldo Inicial</div>
            <div className="text-lg font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(initialBalance)}
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exportar */}
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-json"
            />
            <label
              htmlFor="import-json"
              className={`block w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-center ${
                isImporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto mb-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 inline-block mr-2" />
                  Importar JSON
                </>
              )}
            </label>
          </div>

          {/* Importar */}
          <button
            onClick={handleExport}
            disabled={isExporting || transactions.length === 0}
            className={`w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 inline-block mr-2" />
                Exportar JSON
              </>
            )}
          </button>
        </div>

        {/* Mensagens */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Informações */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
          <div>
            <strong>Formato do arquivo:</strong> JSON com todas as transações, metas e configurações
          </div>
          <div>
            <strong>Backup automático:</strong> Os dados são salvos automaticamente no navegador
          </div>
          <div>
            <strong>Recomendação:</strong> Exporte seus dados regularmente como backup
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

