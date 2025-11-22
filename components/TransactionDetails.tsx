'use client'

import { Transaction } from '@/lib/classification'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryLabel, getCategoryColor } from '@/lib/classification'
import { parseTransactionDetails } from '@/lib/transactionFormatter'
import { EmotionalBadge } from '@/components/EmotionalBadge'
import { isEmotionalPurchase } from '@/lib/transactionUtils'

interface TransactionDetailsProps {
  transaction: Transaction
  showFullDetails?: boolean
}

export function TransactionDetails({ transaction, showFullDetails = false }: TransactionDetailsProps) {
  const parsedDetails = transaction.detalhes ? parseTransactionDetails(transaction.detalhes) : null

  if (showFullDetails) {
    return (
      <div className="space-y-2 text-sm">
        {/* Tipo de Lançamento */}
        {transaction.lancamento && (
          <div>
            <span className="text-muted-foreground">Tipo: </span>
            <span className="font-medium">{transaction.lancamento}</span>
          </div>
        )}

        {/* Data/Hora dos detalhes */}
        {parsedDetails?.dateTime && (
          <div>
            <span className="text-muted-foreground">Data/Hora: </span>
            <span>{parsedDetails.dateTime}</span>
          </div>
        )}

        {/* Destinatário/Local */}
        {parsedDetails?.recipient && (
          <div>
            <span className="text-muted-foreground">Destinatário: </span>
            <span>{parsedDetails.recipient}</span>
          </div>
        )}

        {parsedDetails?.location && (
          <div>
            <span className="text-muted-foreground">Local: </span>
            <span>{parsedDetails.location}</span>
          </div>
        )}

        {/* Detalhes completos (se não foi parseado) */}
        {transaction.detalhes && !parsedDetails?.dateTime && (
          <div>
            <span className="text-muted-foreground">Detalhes: </span>
            <span>{transaction.detalhes}</span>
          </div>
        )}

        {/* Nº Documento */}
        {transaction.numeroDocumento && (
          <div>
            <span className="text-muted-foreground">Nº Documento: </span>
            <span className="font-mono text-xs">{transaction.numeroDocumento}</span>
          </div>
        )}

        {/* Categoria */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Categoria: </span>
          <span className={`font-medium ${getCategoryColor(transaction.category)}`}>
            {getCategoryLabel(transaction.category)}
          </span>
          {isEmotionalPurchase(transaction) && <EmotionalBadge />}
        </div>

        {/* Tipo */}
        <div>
          <span className="text-muted-foreground">Tipo: </span>
          <span className={transaction.type === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}>
            {transaction.type === 'ENTRADA' ? 'Entrada' : 'Saída'}
          </span>
        </div>
      </div>
    )
  }

  // Visualização compacta
  const isEmotional = isEmotionalPurchase(transaction)
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {transaction.lancamento && (
          <p className="text-sm font-medium">{transaction.lancamento}</p>
        )}
        {isEmotional && <EmotionalBadge />}
      </div>
      {transaction.detalhes && (
        <p className="text-sm text-foreground/80">{transaction.detalhes}</p>
      )}
      {!transaction.lancamento && !transaction.detalhes && (
        <p className="text-sm text-foreground/80">{transaction.description}</p>
      )}
      {transaction.numeroDocumento && (
        <p className="text-xs text-muted-foreground">Doc: {transaction.numeroDocumento}</p>
      )}
    </div>
  )
}

