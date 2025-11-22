'use client'

import { Transaction } from '@/lib/classification'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel, getCategoryColor } from '@/lib/classification'
import { TransactionDetails } from '@/components/TransactionDetails'
import { EmotionalBadge } from '@/components/EmotionalBadge'
import { isEmotionalPurchase } from '@/lib/transactionUtils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, Tag, FileText } from 'lucide-react'

interface TransactionModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionModal({ transaction, open, onOpenChange }: TransactionModalProps) {
  if (!transaction) return null

  const categoryColor = getCategoryColor(transaction.category)
  const isEmotional = isEmotionalPurchase(transaction)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Transação
            {isEmotional && <EmotionalBadge />}
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre esta transação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Data: </span>
                  <span className="font-medium">{formatDate(transaction.date)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Valor: </span>
                  <span className={`font-bold text-lg ${transaction.type === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>
                    {transaction.type === 'ENTRADA' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Categoria: </span>
                  <span 
                    className="font-medium px-2 py-1 rounded text-xs"
                    style={{ 
                      backgroundColor: `${categoryColor}20`,
                      color: categoryColor
                    }}
                  >
                    {getCategoryLabel(transaction.category)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Tipo: </span>
                <span className={`font-medium ${transaction.type === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}`}>
                  {transaction.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes Completos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes Completos</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionDetails transaction={transaction} showFullDetails={true} />
            </CardContent>
          </Card>

          {/* Descrição Original */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descrição Original</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{transaction.description}</p>
              {transaction.originalDescription && transaction.originalDescription !== transaction.description && (
                <p className="text-xs text-muted-foreground mt-2">
                  Original: {transaction.originalDescription}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

