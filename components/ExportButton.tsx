'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/store/financeStore'
import { exportToJSON, downloadJSON } from '@/lib/dataExport'
import { Download } from 'lucide-react'
import { format } from 'date-fns'

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false)
  const { transactions, initialBalance, salary, goals, customCategories } = useFinanceStore()

  const handleExport = () => {
    if (transactions.length === 0) {
      alert('Nenhum dado para exportar')
      return
    }

    try {
      setIsExporting(true)
      const jsonData = exportToJSON(transactions, initialBalance, salary, goals, new Date(), customCategories)
      const filename = `rav4-finance-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
      downloadJSON(jsonData, filename)
    } catch (err) {
      console.error('Erro ao exportar:', err)
      alert('Erro ao exportar dados')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || transactions.length === 0}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/50 rounded hover:border-border hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Exportar dados para JSON"
    >
      <Download className="h-3 w-3" />
      <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar'}</span>
    </button>
  )
}

