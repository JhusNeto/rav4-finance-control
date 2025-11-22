import { Transaction } from './classification'

/**
 * Identifica se uma transação é uma compra emocional
 * Regra atual: COMPRAS_GERAIS acima de R$ 200
 */
export function isEmotionalPurchase(transaction: Transaction): boolean {
  return (
    transaction.category === 'COMPRAS_GERAIS' &&
    transaction.type === 'SAIDA' &&
    Math.abs(transaction.amount) > 200
  )
}

