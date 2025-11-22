import { Transaction } from './classification'
import { addMonths, differenceInMonths, format } from 'date-fns'

export interface Debt {
  id: string
  name: string
  currentBalance: number
  monthlyPayment: number
  interestRate: number // Taxa de juros mensal (%)
  startDate: Date
}

export interface DebtSimulation {
  debt: Debt
  currentScenario: {
    totalMonths: number
    totalInterest: number
    finalDate: Date
    totalPaid: number
  }
  acceleratedScenario: {
    extraPayment: number
    totalMonths: number
    totalInterest: number
    finalDate: Date
    totalPaid: number
    interestSaved: number
    monthsSaved: number
  }
  liberationDate: Date
  message: string
}

/**
 * Simulador de Liquidação de Dívidas
 * Simula amortização antecipada e calcula economia
 */
export class DebtSimulator {
  /**
   * Simula pagamento normal (sem amortização antecipada)
   */
  static simulateNormalPayment(debt: Debt): DebtSimulation['currentScenario'] {
    let balance = debt.currentBalance
    let totalInterest = 0
    let months = 0
    const maxMonths = 120 // Limite de segurança (10 anos)
    
    while (balance > 0.01 && months < maxMonths) {
      const interest = balance * (debt.interestRate / 100)
      const principal = debt.monthlyPayment - interest
      
      balance -= principal
      totalInterest += interest
      months++
    }
    
    const finalDate = addMonths(debt.startDate, months)
    const totalPaid = debt.currentBalance + totalInterest
    
    return {
      totalMonths: months,
      totalInterest,
      finalDate,
      totalPaid
    }
  }
  
  /**
   * Simula pagamento com amortização antecipada
   */
  static simulateAcceleratedPayment(
    debt: Debt,
    extraPayment: number
  ): DebtSimulation['acceleratedScenario'] {
    let balance = debt.currentBalance
    let totalInterest = 0
    let months = 0
    const maxMonths = 120
    
    while (balance > 0.01 && months < maxMonths) {
      const interest = balance * (debt.interestRate / 100)
      const principal = debt.monthlyPayment - interest
      const extraPrincipal = Math.min(extraPayment, balance - principal)
      
      balance -= (principal + extraPrincipal)
      totalInterest += interest
      months++
    }
    
    const finalDate = addMonths(debt.startDate, months)
    const totalPaid = debt.currentBalance + totalInterest
    
    // Compara com cenário normal
    const normalScenario = this.simulateNormalPayment(debt)
    const interestSaved = normalScenario.totalInterest - totalInterest
    const monthsSaved = normalScenario.totalMonths - months
    
    return {
      extraPayment,
      totalMonths: months,
      totalInterest,
      finalDate,
      totalPaid,
      interestSaved,
      monthsSaved
    }
  }
  
  /**
   * Gera simulação completa
   */
  static generateSimulation(
    debt: Debt,
    extraPayment: number = 0
  ): DebtSimulation {
    const currentScenario = this.simulateNormalPayment(debt)
    const acceleratedScenario = extraPayment > 0
      ? this.simulateAcceleratedPayment(debt, extraPayment)
      : {
          extraPayment: 0,
          totalMonths: currentScenario.totalMonths,
          totalInterest: currentScenario.totalInterest,
          finalDate: currentScenario.finalDate,
          totalPaid: currentScenario.totalPaid,
          interestSaved: 0,
          monthsSaved: 0
        }
    
    // Data de libertação financeira (quando todas as dívidas seriam pagas)
    const liberationDate = acceleratedScenario.finalDate
    
    // Mensagem motivacional
    let message = ''
    if (extraPayment > 0) {
      message = `Com amortização de ${formatCurrency(extraPayment)}/mês, você economiza ${formatCurrency(acceleratedScenario.interestSaved)} em juros e se liberta ${acceleratedScenario.monthsSaved} meses antes.`
    } else {
      message = `Sem amortização, você pagará ${formatCurrency(currentScenario.totalInterest)} em juros até ${format(liberationDate, 'dd/MM/yyyy')}.`
    }
    
    return {
      debt,
      currentScenario,
      acceleratedScenario,
      liberationDate,
      message
    }
  }
  
  /**
   * Detecta dívidas automaticamente das transações
   */
  static detectDebts(transactions: Transaction[]): Debt[] {
    const debts: Debt[] = []
    const today = new Date()
    
    // Agrupa transações de dívidas/CDC por descrição
    const debtTransactions = transactions.filter(t =>
      t.category === 'DIVIDAS_CDC' && t.type === 'SAIDA'
    )
    
    const debtGroups = new Map<string, Transaction[]>()
    debtTransactions.forEach(t => {
      const key = t.description.toLowerCase().trim().substring(0, 30)
      if (!debtGroups.has(key)) {
        debtGroups.set(key, [])
      }
      debtGroups.get(key)!.push(t)
    })
    
    // Cria dívidas detectadas
    debtGroups.forEach((txs, name) => {
      if (txs.length >= 3) { // Precisa de pelo menos 3 pagamentos para detectar padrão
        const sortedTxs = txs.sort((a, b) => a.date.getTime() - b.date.getTime())
        const monthlyPayment = sortedTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / sortedTxs.length
        
        // Estima saldo atual (simplificado - assume 10% de juros ao mês)
        const estimatedBalance = monthlyPayment * 12 // Assume 12 meses restantes
        const estimatedInterestRate = 10 // 10% ao mês (padrão para CDC)
        
        debts.push({
          id: `debt-${name}`,
          name: name.substring(0, 40),
          currentBalance: estimatedBalance,
          monthlyPayment,
          interestRate: estimatedInterestRate,
          startDate: sortedTxs[0].date
        })
      }
    })
    
    return debts
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

