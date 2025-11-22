import Papa from 'papaparse'
import { Transaction } from './classification'
import { classifyTransaction } from './classification'
import { parse } from 'date-fns'
import { deduplicateTransactions, mergeDuplicateTransactions } from './deduplication'

export interface CSVRow {
  [key: string]: string
}

export function parseCSV(csvText: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        resolve(results.data as CSVRow[])
      },
      error: (error: Error) => {
        reject(error)
      },
    })
  })
}

export function parseDate(dateStr: string): Date {
  // Ignora datas inválidas como "00/00/0000"
  if (!dateStr || dateStr.includes('00/00/0000') || dateStr.trim() === '') {
    return new Date()
  }
  
  // Tenta diferentes formatos de data
  const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'dd/MM/yy']
  
  for (const format of formats) {
    try {
      const parsed = parse(dateStr.trim(), format, new Date())
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
        return parsed
      }
    } catch (e) {
      continue
    }
  }
  
  // Fallback: tenta parse direto
  const fallback = new Date(dateStr)
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 2000) {
    return fallback
  }
  
  return new Date()
}

/**
 * Extrai data e hora da descrição da transação quando disponível
 * Procura por padrões como "DD/MM/YYYY HH:MM", "DD/MM HH:MM" ou "DD/MM/YYYY às HH:MM"
 * Quando não tem ano na descrição, usa o ano da data de referência (coluna)
 * Retorna null se não encontrar
 */
export function extractDateFromDescription(description: string, referenceDate?: Date): Date | null {
  if (!description) return null
  
  // Usa a data de referência (da coluna) para determinar o ano quando não especificado
  const refYear = referenceDate ? referenceDate.getFullYear() : new Date().getFullYear()
  const refMonth = referenceDate ? referenceDate.getMonth() : new Date().getMonth()
  
  // Padrões de data/hora comuns em extratos bancários brasileiros
  // Exemplos:
  // - "03/11/2025 14:30" (com ano completo)
  // - "03/11/25 14:30" (com ano de 2 dígitos)
  // - "01/11 15:47" (sem ano - usa ano da data de referência)
  // - "03/11/2025 às 14:30"
  
  const patterns = [
    // DD/MM/YYYY HH:MM:SS
    { regex: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}):(\d{2}):(\d{2})/, hasYear: true },
    // DD/MM/YYYY HH:MM
    { regex: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}):(\d{2})/, hasYear: true },
    // DD/MM/YYYY às HH:MM
    { regex: /(\d{2}\/\d{2}\/\d{4})\s+às\s+(\d{2}):(\d{2})/, hasYear: true },
    // DD/MM/YY HH:MM:SS
    { regex: /(\d{2}\/\d{2}\/\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, hasYear: true },
    // DD/MM/YY HH:MM
    { regex: /(\d{2}\/\d{2}\/\d{2})\s+(\d{2}):(\d{2})/, hasYear: true },
    // DD/MM/YY às HH:MM
    { regex: /(\d{2}\/\d{2}\/\d{2})\s+às\s+(\d{2}):(\d{2})/, hasYear: true },
    // DD/MM HH:MM:SS (sem ano - usa ano da referência)
    { regex: /(\d{2}\/\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, hasYear: false },
    // DD/MM HH:MM (sem ano - usa ano da referência) - MAIS COMUM
    { regex: /(\d{2}\/\d{2})\s+(\d{2}):(\d{2})/, hasYear: false },
    // DD/MM às HH:MM (sem ano)
    { regex: /(\d{2}\/\d{2})\s+às\s+(\d{2}):(\d{2})/, hasYear: false },
  ]
  
  for (const pattern of patterns) {
    const match = description.match(pattern.regex)
    if (match) {
      try {
        const dateStr = match[1] // Data (DD/MM/YYYY, DD/MM/YY ou DD/MM)
        const hour = parseInt(match[2] || '0', 10)
        const minute = parseInt(match[3] || '0', 10)
        const second = parseInt(match[4] || '0', 10)
        
        let parsedDate: Date | null = null
        
        if (pattern.hasYear) {
          // Tem ano na descrição - parse normal
          const dateFormats = ['dd/MM/yyyy', 'dd/MM/yy']
          
          for (const format of dateFormats) {
            try {
              const parsed = parse(dateStr.trim(), format, new Date())
              if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
                parsedDate = parsed
                break
              }
            } catch (e) {
              continue
            }
          }
          
          if (!parsedDate) continue
          
          // Se o ano tem apenas 2 dígitos, ajusta
          if (dateStr.length === 8) { // DD/MM/YY
            const yearPart = parseInt(dateStr.split('/')[2], 10)
            const fullYear = yearPart <= 30 ? 2000 + yearPart : 1900 + yearPart
            parsedDate = new Date(fullYear, parsedDate.getMonth(), parsedDate.getDate())
          }
        } else {
          // Não tem ano - usa ano da data de referência
          const [day, month] = dateStr.split('/').map(Number)
          if (day && month && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            parsedDate = new Date(refYear, month - 1, day)
          } else {
            continue
          }
        }
        
        if (!parsedDate) continue
        
        // Adiciona hora, minuto e segundo
        parsedDate.setHours(hour, minute, second, 0)
        
        // Valida se a data é válida
        if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
          return parsedDate
        }
      } catch (e) {
        // Continua tentando outros padrões
        continue
      }
    }
  }
  
  // Se não encontrou padrão com hora, tenta apenas data no formato DD/MM/YYYY, DD/MM/YY ou DD/MM
  const dateOnlyPatterns = [
    { regex: /(\d{2}\/\d{2}\/\d{4})/, hasYear: true },
    { regex: /(\d{2}\/\d{2}\/\d{2})/, hasYear: true },
    { regex: /(\d{2}\/\d{2})/, hasYear: false },
  ]
  
  for (const pattern of dateOnlyPatterns) {
    const match = description.match(pattern.regex)
    if (match) {
      try {
        const dateStr = match[1]
        let parsedDate: Date | null = null
        
        if (pattern.hasYear) {
          const dateFormats = ['dd/MM/yyyy', 'dd/MM/yy']
          
          for (const format of dateFormats) {
            try {
              const parsed = parse(dateStr.trim(), format, new Date())
              if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
                parsedDate = parsed
                break
              }
            } catch (e) {
              continue
            }
          }
          
          if (!parsedDate) continue
          
          // Se o ano tem apenas 2 dígitos, ajusta
          if (dateStr.length === 8) { // DD/MM/YY
            const yearPart = parseInt(dateStr.split('/')[2], 10)
            const fullYear = yearPart <= 30 ? 2000 + yearPart : 1900 + yearPart
            parsedDate = new Date(fullYear, parsedDate.getMonth(), parsedDate.getDate())
          }
        } else {
          // Não tem ano - usa ano da data de referência
          const [day, month] = dateStr.split('/').map(Number)
          if (day && month && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            parsedDate = new Date(refYear, month - 1, day)
          } else {
            continue
          }
        }
        
        if (!parsedDate) continue
        
        // Valida se a data é válida
        if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
          return parsedDate
        }
      } catch (e) {
        continue
      }
    }
  }
  
  return null
}

export function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') {
    return 0
  }
  
  // Remove espaços e R$
  let cleaned = amountStr.replace(/R\$/g, '').trim()
  
  // Formato brasileiro: pontos para milhares, vírgula para decimal
  // Ex: "1.234,56" ou "-372,93"
  // Remove pontos (milhares) e converte vírgula para ponto (decimal)
  cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.')
  
  const amount = parseFloat(cleaned)
  return isNaN(amount) ? 0 : amount
}

export interface ParseResult {
  transactions: Transaction[]
  initialBalance: number
}

// Função auxiliar para encontrar coluna ignorando encoding e case
function findColumn(row: CSVRow, possibleNames: string[]): string {
  const rowKeys = Object.keys(row)
  
  for (const name of possibleNames) {
    // Busca exata
    if (row[name]) return row[name]
    
    // Busca case-insensitive
    const found = rowKeys.find(key => key.toLowerCase() === name.toLowerCase())
    if (found) return row[found]
    
    // Busca parcial (para lidar com encoding)
    const foundPartial = rowKeys.find(key => 
      key.toLowerCase().includes(name.toLowerCase().replace(/[çã]/g, '')) ||
      name.toLowerCase().includes(key.toLowerCase().replace(/[çã]/g, ''))
    )
    if (foundPartial) return row[foundPartial]
  }
  
  return ''
}

export async function convertCSVToTransactions(rows: CSVRow[]): Promise<ParseResult> {
  const transactions: Transaction[] = []
  let initialBalance = 0
  
  // Estatísticas de debug
  let skippedNoDate = 0
  let skippedNoDescription = 0
  let skippedBalance = 0
  let skippedInvalidDate = 0
  let skippedZeroAmount = 0
  let processedCount = 0
  
  // Palavras-chave para ignorar linhas de saldo
  const IGNORE_KEYWORDS = [
    'saldo do dia',
    's a l d o',
    'saldo',
    'movimento do dia'
  ]
  
  console.log(`[CSV Parser] Iniciando parse de ${rows.length} linhas do CSV`)
  
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]
    // Busca colunas usando função auxiliar
    const dateStr = findColumn(row, ['Data', 'DATA', 'data', 'Date', 'date'])
    const lancamento = findColumn(row, [
      'Lançamento', 'Lancamento', 'lançamento', 'lancamento',
      'Lan�amento', // Encoding ISO-8859-1
      'Lançamento'
    ])
    const detalhes = findColumn(row, ['Detalhes', 'detalhes', 'Detalhes'])
    const tipoLancamento = findColumn(row, [
      'Tipo Lançamento', 'Tipo Lancamento', 'tipo lançamento', 'tipo lancamento',
      'Tipo Lan�amento' // Encoding ISO-8859-1
    ])
    const amountStr = findColumn(row, [
      'Valor', 'VALOR', 'valor', 'Amount', 'amount',
      'Crédito', 'crédito', 'Débito', 'débito',
      'Cr�dito', 'D�bito' // Encoding ISO-8859-1
    ]) || '0'
    
    // Normaliza e limpa os campos
    const normalizedLancamento = lancamento ? lancamento.trim() : ''
    const normalizedDetalhes = detalhes ? detalhes.trim() : ''
    const numeroDocumento = findColumn(row, [
      'Nº documento', 'N documento', 'N� documento', 'Numero documento',
      'Número documento', 'Documento', 'documento'
    ]) || ''
    
    // Cria descrição completa para classificação e exibição
    const descriptionParts = [normalizedLancamento, normalizedDetalhes].filter(Boolean)
    const description = descriptionParts.join(' - ').trim() || 'Transação sem descrição'
    
    // DEBUG: Log específico para IOF - verifica em múltiplos lugares
    // Verifica tanto na descrição original quanto normalizada, e nos campos individuais
    const lancamentoLower = lancamento ? lancamento.toLowerCase() : ''
    const detalhesLower = detalhes ? detalhes.toLowerCase() : ''
    const descLower = description.toLowerCase()
    
    const isIOFDescription = descLower.includes('iof') || 
                             descLower.includes('i.o.f') ||
                             descLower.includes('i o f') ||
                             lancamentoLower.includes('iof') ||
                             lancamentoLower.includes('i.o.f') ||
                             lancamentoLower.includes('i o f') ||
                             detalhesLower.includes('iof') ||
                             detalhesLower.includes('i.o.f') ||
                             detalhesLower.includes('i o f') ||
                             normalizedLancamento.toLowerCase().includes('iof') ||
                             normalizedDetalhes.toLowerCase().includes('iof')
    
    // Extrai saldo anterior
    if (lancamento && lancamento.toLowerCase().includes('saldo anterior')) {
      const saldoAnterior = parseAmount(amountStr)
      initialBalance = saldoAnterior
      console.log('Saldo anterior encontrado:', saldoAnterior)
      continue // Não adiciona como transação
    }
    
    // Ignora linhas de saldo e linhas sem descrição válida
    if (!dateStr || (!normalizedLancamento && !normalizedDetalhes)) {
      if (!dateStr) skippedNoDate++
      if (!normalizedLancamento && !normalizedDetalhes) skippedNoDescription++
      if (isIOFDescription) {
        console.warn(`[CSV Parser] IOF ignorado - sem data ou descrição:`, { dateStr, lancamento, detalhes })
      }
      continue
    }
    
    // Verifica se é linha de saldo (já verificado acima, mas verifica novamente para segurança)
    // IMPORTANTE: Não ignora se for IOF (mesmo que contenha "saldo" na descrição)
    // Exemplo: "Cobrança de I.O.F. - IOF Saldo Devedor Conta" não é linha de saldo
    const isBalanceLine = IGNORE_KEYWORDS.some(keyword => descLower.includes(keyword))
    
    if (isBalanceLine && !isIOFDescription) {
      skippedBalance++
      continue // Ignora linhas de saldo (mas não IOF)
    }
    
    // Se for IOF mas foi identificado como linha de saldo, loga mas não ignora
    if (isBalanceLine && isIOFDescription) {
      console.log(`[CSV Parser] IOF detectado - contém "saldo" mas não é linha de saldo, processando normalmente:`, description)
    }
    
    // Ignora datas inválidas
    if (dateStr.includes('00/00/0000')) {
      skippedInvalidDate++
      continue
    }
    
    // Parse da data da coluna primeiro (para usar como referência se necessário)
    const columnDate = parseDate(dateStr)
    
    // Tenta extrair data e hora da descrição primeiro
    // Passa a data da coluna como referência para determinar o ano quando não especificado
    const descriptionDate = extractDateFromDescription(description, columnDate)
    let date: Date
    
    if (descriptionDate) {
      // Usa a data extraída da descrição (que pode incluir hora)
      date = descriptionDate
      console.log(`[CSV Parser] Data extraída da descrição: ${description.substring(0, 80)}... -> ${date.toISOString()} (coluna: ${columnDate.toISOString()})`)
    } else {
      // Usa a data da coluna como fallback
      date = columnDate
    }
    
    const rawAmount = parseAmount(amountStr)
    
    // Validação: se a data é inválida (ano muito antigo ou futuro), pula
    // PERMITE até 2 anos no futuro para permitir extratos com datas futuras
    const currentYear = new Date().getFullYear()
    if (date.getFullYear() < 2000 || date.getFullYear() > currentYear + 2) {
      console.warn(`[CSV Parser] Data inválida ignorada: ${dateStr} -> ${date.toISOString()} (ano: ${date.getFullYear()}, limite: ${currentYear + 2})`)
      if (isIOFDescription) {
        console.warn(`[CSV Parser] IOF ignorado por data inválida:`, { dateStr, date: date.toISOString(), year: date.getFullYear(), description })
      }
      skippedInvalidDate++
      continue
    }
    
    // Se não tem valor, pula (EXCETO para IOF que pode ter valores muito pequenos)
    // IOF pode aparecer como valores muito pequenos que podem ser arredondados
    const isIOF = isIOFDescription
    
    if (rawAmount === 0 && !isIOF) {
      skippedZeroAmount++
      continue
    }
    
    // Para IOF, aceita mesmo valores muito pequenos (pode ser centavos)
    if (isIOF && Math.abs(rawAmount) < 0.01) {
      console.warn(`[CSV Parser] IOF com valor muito pequeno ignorado: ${description} - ${rawAmount}`)
      skippedZeroAmount++
      continue
    }
    
    // DEBUG: Log quando encontra IOF
    if (isIOF) {
      console.log(`[CSV Parser] IOF detectado:`, {
        date: dateStr,
        lancamento: normalizedLancamento,
        detalhes: normalizedDetalhes,
        description,
        amount: rawAmount,
        amountStr
      })
    }
    
    processedCount++
    
    // Classifica usando sistema híbrido: regras + IA aprendizado
    const rulesClassification = classifyTransaction(description, rawAmount)
    
    // Tenta usar IA aprendizado (só funciona no cliente)
    let classification = rulesClassification
    if (typeof window !== 'undefined') {
      try {
        const { classifyWithAI } = await import('./aiClassifier')
        classification = classifyWithAI(description, rawAmount, rulesClassification)
      } catch (error) {
        // Fallback para regras se IA falhar
        console.warn('Erro ao usar IA classifier, usando regras:', error)
      }
    } else {
      // No servidor, usa apenas regras
      classification = rulesClassification
    }
    
    // Determina tipo baseado na coluna "Tipo Lançamento" ou no sinal do valor
    let transactionType: 'ENTRADA' | 'SAIDA'
    if (tipoLancamento) {
      const tipoLower = tipoLancamento.toLowerCase().trim()
      if (tipoLower.includes('entrada') || tipoLower.includes('receb')) {
        transactionType = 'ENTRADA'
      } else if (tipoLower.includes('saída') || tipoLower.includes('saida') || tipoLower.includes('pag')) {
        transactionType = 'SAIDA'
      } else {
        // Fallback: usa classificação ou sinal do valor
        transactionType = classification.type
      }
    } else {
      // Usa a classificação automática que já considera a descrição
      transactionType = classification.type
    }
    
    // Garante consistência: se o valor é negativo, deve ser saída
    // (alguns CSVs podem ter valores negativos mesmo quando tipo diz entrada)
    if (rawAmount < 0 && transactionType === 'ENTRADA') {
      console.warn(`Inconsistência detectada: valor negativo mas tipo ENTRADA. Descrição: ${description}`)
      transactionType = 'SAIDA'
    }
    
    const category = classification.category
    
    transactions.push({
      id: `tx-${index}-${Date.now()}`,
      date,
      description, // Descrição completa para exibição
      amount: Math.abs(rawAmount), // Sempre armazena valor absoluto
      type: transactionType,
      category,
      // Campos normalizados separados
      lancamento: normalizedLancamento,
      detalhes: normalizedDetalhes,
      numeroDocumento: numeroDocumento.trim(),
      originalDescription: description, // Mantém descrição original combinada
    })
  }
  
  // Logs detalhados de debug
  console.log(`[CSV Parser] ===== ESTATÍSTICAS DE PARSE =====`)
  console.log(`[CSV Parser] Total de linhas processadas: ${rows.length}`)
  console.log(`[CSV Parser] Transações válidas criadas: ${transactions.length}`)
  console.log(`[CSV Parser] Linhas ignoradas - Sem data: ${skippedNoDate}`)
  console.log(`[CSV Parser] Linhas ignoradas - Sem descrição: ${skippedNoDescription}`)
  console.log(`[CSV Parser] Linhas ignoradas - Saldo: ${skippedBalance}`)
  console.log(`[CSV Parser] Linhas ignoradas - Data inválida: ${skippedInvalidDate}`)
  console.log(`[CSV Parser] Linhas ignoradas - Valor zero: ${skippedZeroAmount}`)
  console.log(`[CSV Parser] Total processado: ${processedCount}`)
  console.log(`[CSV Parser] Saldo inicial encontrado: ${initialBalance}`)
  console.log(`[CSV Parser] =================================`)
  
  // TEMPORARIAMENTE DESABILITADO: Deduplicação e merge podem estar removendo transações válidas
  // TODO: Investigar por que está removendo transações legítimas
  // Primeiro, remove duplicatas exatas
  // const deduplicated = deduplicateTransactions(transactions)
  // console.log(`[CSV Parser] Após deduplicação: ${deduplicated.length} transações`)
  
  // Depois, faz merge inteligente de transações similares que podem ser variações da mesma transação
  // const merged = mergeDuplicateTransactions(deduplicated)
  // console.log(`[CSV Parser] Após merge: ${merged.length} transações`)
  
  return {
    transactions, // Retorna todas as transações sem deduplicação/merge
    initialBalance
  }
}

