'use client'

import { useState, useEffect } from 'react'
import { Transaction, Category, getCategoryLabel, getCategoryColor } from '@/lib/classification'
import { SimilarTransaction } from '@/lib/similarTransactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { EmotionalBadge } from '@/components/EmotionalBadge'
import { isEmotionalPurchase } from '@/lib/transactionUtils'

interface SimilarTransactionsModalProps {
  referenceTransaction: Transaction
  similarTransactions: SimilarTransaction[]
  onConfirm: (selectedIds: string[]) => void
  onCancel: () => void
  open: boolean
}

export function SimilarTransactionsModal({
  referenceTransaction,
  similarTransactions,
  onConfirm,
  onCancel,
  open
}: SimilarTransactionsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(similarTransactions.map(st => st.transaction.id))
  )

  // Atualiza seleção quando similarTransactions muda
  useEffect(() => {
    setSelectedIds(new Set(similarTransactions.map(st => st.transaction.id)))
  }, [similarTransactions])

  const handleToggle = (transactionId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === similarTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(similarTransactions.map(st => st.transaction.id)))
    }
  }

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      onCancel()
      return
    }
    
    setIsProcessing(true)
    await onConfirm(Array.from(selectedIds))
    setIsProcessing(false)
  }

  if (similarTransactions.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col" style={{ zIndex: 100 }}>
        <DialogHeader>
          <DialogTitle>Transações Similares Encontradas</DialogTitle>
          <DialogDescription>
            Encontramos <strong>{similarTransactions.length}</strong> transação(ões) similar(es) à que você acabou de categorizar.
            Selecione quais deseja recategorizar.
          </DialogDescription>
        </DialogHeader>

        {/* Reference Transaction */}
        <div className="p-4 bg-muted/30 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">Transação de referência:</span>
          </div>
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{formatDate(referenceTransaction.date)}</span>
              <span className={`font-medium ${getCategoryColor(referenceTransaction.category)}`}>
                {getCategoryLabel(referenceTransaction.category)}
              </span>
            </div>
            <div className="text-foreground/80 mt-1 space-y-1">
              {referenceTransaction.lancamento && (
                <p className="font-medium">{referenceTransaction.lancamento}</p>
              )}
              {referenceTransaction.detalhes && (
                <p>{referenceTransaction.detalhes}</p>
              )}
              {!referenceTransaction.lancamento && !referenceTransaction.detalhes && (
                <p>{referenceTransaction.description}</p>
              )}
            </div>
            <p className="text-foreground/60 mt-1">
              {formatCurrency(referenceTransaction.amount)}
            </p>
          </div>
        </div>

        {/* Selection Header */}
        <div className="flex items-center justify-between p-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === similarTransactions.length}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Selecionar todas ({selectedIds.size}/{similarTransactions.length})
            </label>
          </div>
        </div>

        {/* Similar Transactions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {similarTransactions.map(({ transaction, similarity }) => {
            const isSelected = selectedIds.has(transaction.id)
            return (
              <div
                key={transaction.id}
                className={`p-3 border rounded-lg transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border bg-muted/20 hover:bg-muted/40'
                }`}
                onClick={() => handleToggle(transaction.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(transaction.id)}
                    onClick={(e) => e.stopPropagation()}
                    id={`transaction-${transaction.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                      <span className={`text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                        {getCategoryLabel(transaction.category)} →
                      </span>
                      <span className={`text-xs font-medium ${getCategoryColor(referenceTransaction.category)}`}>
                        {getCategoryLabel(referenceTransaction.category)}
                      </span>
                      {isEmotionalPurchase(transaction) && <EmotionalBadge className="scale-75" />}
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(similarity * 100)}% similar)
                      </span>
                    </div>
                    <div className="text-sm text-foreground/90 space-y-1">
                      {transaction.lancamento && (
                        <p className="font-medium">{transaction.lancamento}</p>
                      )}
                      {transaction.detalhes && (
                        <p className="break-words">{transaction.detalhes}</p>
                      )}
                      {!transaction.lancamento && !transaction.detalhes && (
                        <p className="break-words">{transaction.description}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4 space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Ao confirmar, <strong>{selectedIds.size}</strong> transação(ões) selecionada(s) será(ão) recategorizada(s) para{' '}
              <strong>{getCategoryLabel(referenceTransaction.category)}</strong>.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || selectedIds.size === 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Recategorizar {selectedIds.size} transação(ões)
                </>
              )}
            </Button>
            <Button
              onClick={onCancel}
              disabled={isProcessing}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

