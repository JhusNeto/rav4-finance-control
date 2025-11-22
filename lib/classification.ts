export type TransactionType = 
  | 'ENTRADA' 
  | 'SAIDA'

// Categorias padrão - Expandidas para maior precisão
export type StandardCategory = 
  | 'ALIMENTACAO_DENTRO'
  | 'ALIMENTACAO_FORA'
  | 'PIX_SAIDA'
  | 'PIX_ENTRADA'
  | 'ASSINATURAS'
  | 'DIVIDAS_CDC'
  | 'MERCADO'
  | 'TRANSPORTE'
  | 'COMPRAS_GERAIS'
  | 'TARIFAS'
  | 'SAUDE'
  | 'LAZER'
  | 'EDUCACAO'
  | 'VESTUARIO'
  | 'COMBUSTIVEL'
  | 'SERVICOS'
  | 'MANUTENCAO'
  | 'IMPOSTOS'
  | 'SALARIO'
  | 'OUTROS'

// Category agora aceita categorias padrão ou customizadas (string)
export type Category = StandardCategory | string

export interface Transaction {
  id: string
  date: Date
  description: string // Descrição completa para exibição
  amount: number
  type: TransactionType
  category: Category
  // Campos normalizados separados
  lancamento: string // Tipo de lançamento (ex: "Pix - Enviado", "Compra com Cartão")
  detalhes: string // Detalhes adicionais (ex: "30/08 10:29 Juscelino Barbosa Da Silva")
  numeroDocumento: string // Nº documento
  originalDescription: string // Descrição original combinada
}

// Keywords expandidas e mais precisas para cada categoria

const ALIMENTACAO_FORA_KEYWORDS = [
  // Delivery apps
  'ifood', 'rappi', 'uber eats', 'i food', 'ifood.com', 'rappi.com.br',
  // Restaurantes e lanchonetes
  'restaurante', 'lanche', 'lanchonete', 'burger', 'hamburgueria', 'pizza', 
  'pizzaria', 'kfc', 'mcdonalds', 'subway', 'giraffas', 'habibs', 'outback',
  'sabor', 'glace', 'top sabor', 'mandaka', 'container', 'churrascaria',
  'sushi', 'japones', 'chines', 'italiano', 'mexicano', 'fast food',
  // Cafeterias e padarias (fora)
  'starbucks', 'café', 'cafe', 'padaria', 'confeitaria', 'doceria',
  // Açaí e sorvete
  'açaí', 'acai', 'sorvete', 'gelato', 'frozen yogurt',
  // Bebidas
  'bar', 'cervejaria', 'pub', 'balada', 'boate'
]

const ALIMENTACAO_DENTRO_KEYWORDS = [
  'acougue', 'açougue', 'sacolao', 'sacolão', 'hortifruti', 'horti fruti',
  'feira', 'feira livre', 'verduras', 'legumes', 'carnes', 'peixe',
  'frango', 'bovino', 'suino', 'suíno'
]

const MERCADO_KEYWORDS = [
  'supermercado', 'super mercado', 'atacadao', 'atacadão', 'atacado',
  'extra', 'carrefour', 'walmart', 'big', 'pao de acucar', 'pão de açúcar',
  'assai', 'atacarejo', 'sam club', 'sams club', 'costco',
  'leroy merlin', 'leroy', 'casas bahia', 'magazine luiza', 'magalu',
  'pet shop', 'petshop', 'petz', 'cobasi'
]

const ASSINATURAS_KEYWORDS = [
  // Streaming
  'netflix', 'spotify', 'disney', 'disney plus', 'disney+', 'prime', 'amazon prime',
  'youtube premium', 'youtube', 'hbo', 'hbo max', 'hbo max', 'paramount',
  'apple tv', 'apple music', 'globo play', 'globoplay', 'telecine',
  // Assinaturas de software
  'adobe', 'photoshop', 'microsoft', 'office 365', 'office365', 'onedrive',
  'dropbox', 'icloud', 'google drive', 'google one',
  // Assinaturas de serviços
  'gympass', 'smart fit', 'bluefit', 'bio ritmo', 'academia',
  'assinatura', 'assinar', 'combo', 'streaming', 'premium',
  // Outras assinaturas
  'prime video', 'amazon', 'aws', 'cloudflare', 'github', 'notion',
  'canva', 'figma', 'slack', 'zoom', 'teams'
]

const DIVIDAS_KEYWORDS = [
  'consig', 'consignado', 'cdc', 'credito consignado', 'crédito consignado',
  'emprest', 'emprestimo', 'empréstimo', 'financiamento', 'parcela',
  'antecipa', 'antecipacao', 'antecipação', 'renovação', 'renovacao',
  'crédito', 'credito', 'pgto cdc', 'pagamento cdc', 'banco pan',
  'banco inter', 'nubank', 'c6 bank', 'itau', 'bradesco', 'santander',
  'banco do brasil', 'bb', 'caixa', 'caixa economica', 'serasa',
  'scpc', 'spc', 'cheque especial', 'cartao de credito', 'cartão de crédito',
  'fatura', 'fatura cartao', 'fatura cartão'
]

const TRANSPORTE_KEYWORDS = [
  'uber', '99', 'taxi', 'transporte', 'passagem', 'uber do brasil',
  'uberx', 'uber black', 'uber comfort', 'uber pool', 'uber eats',
  'cabify', 'in drive', 'indrive', 'bolt', 'lime', 'bird',
  'metro', 'metro', 'onibus', 'ônibus', 'bilhete unico', 'bilhete único',
  'metroviario', 'metroviário', 'cpfl', 'viação', 'viacao',
  'posto', 'combustivel', 'combustível', 'gasolina', 'etanol', 'diesel',
  'shell', 'ipiranga', 'petrobras', 'petrobrás', 'texaco', 'esso'
]

const SAUDE_KEYWORDS = [
  'odontologia', 'dentista', 'odontologo', 'odontólogo', 'neocare',
  'clinica', 'clínica', 'hospital', 'farmacia', 'farmácia', 'drogaria',
  'droga raia', 'drogasil', 'pacheco', 'ultrafarma', 'raia drogasil',
  'medico', 'médico', 'consulta', 'exame', 'laboratorio', 'laboratório',
  'unimed', 'amil', 'sulamerica', 'sul américa', 'bradesco saude',
  'bradesco saúde', 'notredame', 'notre dame', 'hcor', 'sirio libanes',
  'sírio libanês', 'plano de saude', 'plano de saúde', 'seguro saude',
  'seguro saúde', 'psicologo', 'psicólogo', 'psiquiatra', 'fisioterapia',
  'fisioterapeuta', 'nutricionista', 'nutricao', 'nutrição'
]

const LAZER_KEYWORDS = [
  'cinema', 'ingresso', 'show', 'show', 'festival', 'evento', 'teatro',
  'museu', 'exposicao', 'exposição', 'parque', 'diversao', 'diversão',
  'jogo', 'games', 'playstation', 'xbox', 'nintendo', 'steam',
  'viagem', 'viagens', 'hotel', 'hospedagem', 'airbnb', 'booking',
  'passagem aerea', 'passagem aérea', 'azul', 'gol', 'latam', 'tam',
  'praia', 'passeio', 'turismo', 'turismo', 'passeio', 'excursao', 'excursão'
]

const EDUCACAO_KEYWORDS = [
  'curso', 'cursos', 'faculdade', 'universidade', 'escola', 'ensino',
  'educacao', 'educação', 'materiais', 'material escolar', 'livro', 'livros',
  'amazon kindle', 'kindle', 'coursera', 'udemy', 'alura', 'pluralsight',
  'ensino medio', 'ensino médio', 'ensino superior', 'pos graduacao',
  'pós graduação', 'mba', 'mestrado', 'doutorado', 'tcc', 'monografia',
  'mensalidade escolar', 'mensalidade faculdade', 'matricula', 'matrícula'
]

const VESTUARIO_KEYWORDS = [
  'roupa', 'roupas', 'vestuario', 'vestuário', 'moda', 'fashion',
  'camisa', 'calca', 'calça', 'sapato', 'sapatos', 'tenis', 'tênis',
  'sandalias', 'sandálias', 'bolsa', 'bolsas', 'mochila', 'acessorio',
  'acessório', 'oculos', 'óculos', 'relogio', 'relógio', 'joia', 'joias',
  'renner', 'c&a', 'riachuelo', 'zara', 'h&m', 'forever 21', 'shein',
  'nike', 'adidas', 'puma', 'reebok', 'vans', 'converse', 'all star'
]

const COMBUSTIVEL_KEYWORDS = [
  'combustivel', 'combustível', 'gasolina', 'etanol', 'diesel', 'gnv',
  'posto', 'posto de gasolina', 'shell', 'ipiranga', 'petrobras', 'petrobrás',
  'texaco', 'esso', 'vibra', 'ale', 'ati', 'apec', 'petrobras distribuidora'
]

const SERVICOS_KEYWORDS = [
  'servico', 'serviço', 'manutencao', 'manutenção', 'reparo', 'conserto',
  'eletricista', 'encanador', 'pintor', 'pedreiro', 'marceneiro',
  'limpeza', 'faxina', 'diarista', 'empregada', 'domestica', 'doméstica',
  'lavanderia', 'lavagem', 'lavagem de carro', 'lavagem de roupa',
  'barbearia', 'barbeiro', 'salão', 'salao', 'cabeleireiro', 'cabeleireira',
  'estetica', 'estética', 'depilacao', 'depilação', 'massagem', 'spa',
  'contador', 'contabilidade', 'advogado', 'advocacia', 'juridico', 'jurídico',
  'seguranca', 'segurança', 'alarme', 'portaria', 'porteiro'
]

const MANUTENCAO_KEYWORDS = [
  'oficina', 'mecanica', 'mecânica', 'auto pecas', 'autopeças', 'auto peças',
  'pneu', 'pneus', 'bateria', 'oleo', 'óleo', 'filtro', 'revisao', 'revisão',
  'troca de oleo', 'troca de óleo', 'alinhamento', 'balanceamento',
  'funilaria', 'pintura de carro', 'vidracaria', 'vidraçaria', 'guincho',
  'seguro auto', 'seguro de carro', 'ipva', 'licenciamento', 'documento',
  'multa', 'multas', 'detran', 'detrã'
]

const IMPOSTOS_KEYWORDS = [
  'imposto', 'impostos', 'irpf', 'ir', 'imposto de renda', 'dar', 'darf',
  'iptu', 'iptu', 'iptu', 'ipva', 'ipva', 'itbi', 'iss', 'inss',
  'previdencia', 'previdência', 'fgts', 'fgts', 'contribuicao', 'contribuição',
  'receita federal', 'receita', 'fazenda', 'secretaria da fazenda'
]

const SALARIO_KEYWORDS = [
  'salario', 'salário', 'proventos', 'recebimento de proventos',
  'pagamento de salario', 'pagamento de salário', 'folha de pagamento',
  'plr', 'participacao nos lucros', 'participação nos lucros',
  '13 salario', '13º salário', 'decimo terceiro', 'décimo terceiro',
  'ferias', 'férias', 'abono', 'bonus', 'bônus', 'comissao', 'comissão',
  'adiantamento', 'vale', 'vale refeicao', 'vale refeição', 'vale transporte',
  'vale alimentacao', 'vale alimentação'
]

const TARIFAS_KEYWORDS = [
  'iof', 'i.o.f', 'i o f', 'tarifa', 'taxa', 'anuidade', 'manutenção', 
  'manutencao', 'juros', 'cobrança', 'cobranca', 'anabb', 'mensalidade',
  'taxa de manutencao', 'taxa de manutenção', 'taxa de servico',
  'taxa de serviço', 'tarifa bancaria', 'tarifa bancária',
  'taxa de transferencia', 'taxa de transferência', 'ted', 'doc',
  'taxa de saque', 'taxa de extrato', 'taxa de consulta'
]

// Classificação melhorada com padrões mais inteligentes
export function classifyTransaction(description: string, amount: number): { category: Category; type: TransactionType } {
  const desc = description.toLowerCase().trim()
  const isPositive = amount > 0
  
  // Normaliza descrição para melhor matching
  // IMPORTANTE: Preserva "I.O.F." antes de remover pontos, convertendo para "iof"
  let normalizedDesc = desc
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Converte "I.O.F." ou "I O F" para "iof" antes de remover outros caracteres especiais
    .replace(/\b[Ii]\s*\.?\s*[Oo]\s*\.?\s*[Ff]\s*\.?\b/g, 'iof')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // PIX - verifica primeiro se é PIX (com variações)
  if (normalizedDesc.includes('pix') || desc.includes('pix')) {
    if (normalizedDesc.includes('recebido') || normalizedDesc.includes('entrada') || 
        desc.includes('recebido') || desc.includes('entrada') || isPositive) {
      return { category: 'PIX_ENTRADA', type: 'ENTRADA' }
    }
    if (normalizedDesc.includes('enviado') || normalizedDesc.includes('saida') || 
        desc.includes('enviado') || desc.includes('saída') || desc.includes('saida') || !isPositive) {
      return { category: 'PIX_SAIDA', type: 'SAIDA' }
    }
    // Se não tem indicação clara, usa o sinal do valor
    return isPositive 
      ? { category: 'PIX_ENTRADA', type: 'ENTRADA' }
      : { category: 'PIX_SAIDA', type: 'SAIDA' }
  }
  
  // Entradas (salário, etc) - apenas se valor positivo
  if (isPositive) {
    // Salário e proventos (categoria específica)
    if (SALARIO_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
      return { category: 'SALARIO', type: 'ENTRADA' }
    }
    // CDC Antecipação (entrada de crédito)
    if (desc.includes('cdc') && desc.includes('antecipa')) {
      return { category: 'DIVIDAS_CDC', type: 'ENTRADA' } // Entrada de crédito
    }
    // PIX Recebido
    if (desc.includes('pix') && (desc.includes('recebido') || desc.includes('entrada'))) {
      return { category: 'PIX_ENTRADA', type: 'ENTRADA' }
    }
    // Movimento do dia (pequenos créditos)
    if (desc.includes('movimento do dia')) {
      return { category: 'OUTROS', type: 'ENTRADA' }
    }
    // Se positivo e não identificado, assume entrada genérica
    return { category: 'PIX_ENTRADA', type: 'ENTRADA' }
  }
  
  // Saídas - classificação por palavras-chave (apenas para valores negativos)
  // Ordem importa: verifica categorias mais específicas primeiro
  
  // PIX específico
  if (normalizedDesc.includes('pix enviado') || desc.includes('pix - enviado')) {
    return { category: 'PIX_SAIDA', type: 'SAIDA' }
  }
  
  // Impostos (verificar antes de outras categorias)
  if (IMPOSTOS_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'IMPOSTOS', type: 'SAIDA' }
  }
  
  // Tarifas e juros (verificar antes de outras categorias)
  const hasIOF = normalizedDesc.includes('iof') || 
                 desc.includes('iof') || 
                 desc.includes('i.o.f') ||
                 desc.includes('i o f') ||
                 normalizedDesc.includes('cobranca de iof') ||
                 desc.includes('cobrança de iof') ||
                 desc.includes('cobranca de iof')
  
  if (hasIOF || TARIFAS_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    if (hasIOF) {
      console.log(`[Classification] IOF detectado na classificação:`, { desc, normalizedDesc, amount })
    }
    return { category: 'TARIFAS', type: 'SAIDA' }
  }
  
  // Dívidas e CDC (verificar antes de outras categorias)
  if (DIVIDAS_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'DIVIDAS_CDC', type: 'SAIDA' }
  }
  
  // Assinaturas (com mais variações)
  if (ASSINATURAS_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'ASSINATURAS', type: 'SAIDA' }
  }
  
  // Combustível (verificar antes de transporte)
  if (COMBUSTIVEL_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'COMBUSTIVEL', type: 'SAIDA' }
  }
  
  // Transporte
  if (TRANSPORTE_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'TRANSPORTE', type: 'SAIDA' }
  }
  
  // Manutenção (carro, casa, etc)
  if (MANUTENCAO_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'MANUTENCAO', type: 'SAIDA' }
  }
  
  // Saúde (categoria específica agora)
  if (SAUDE_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'SAUDE', type: 'SAIDA' }
  }
  
  // Educação
  if (EDUCACAO_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'EDUCACAO', type: 'SAIDA' }
  }
  
  // Lazer
  if (LAZER_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'LAZER', type: 'SAIDA' }
  }
  
  // Vestuário
  if (VESTUARIO_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'VESTUARIO', type: 'SAIDA' }
  }
  
  // Serviços
  if (SERVICOS_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'SERVICOS', type: 'SAIDA' }
  }
  
  // Mercado (verificar antes de alimentação para evitar conflito)
  if (MERCADO_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'MERCADO', type: 'SAIDA' }
  }
  
  // Alimentação em casa (verificar antes de alimentação fora)
  if (ALIMENTACAO_DENTRO_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'ALIMENTACAO_DENTRO', type: 'SAIDA' }
  }
  
  // Alimentação fora (verificar depois de mercado e alimentação em casa)
  if (ALIMENTACAO_FORA_KEYWORDS.some(keyword => normalizedDesc.includes(keyword) || desc.includes(keyword))) {
    return { category: 'ALIMENTACAO_FORA', type: 'SAIDA' }
  }
  
  // Compras com cartão (mais variações) - verificar depois de categorias específicas
  if (normalizedDesc.includes('compra com cartao') || normalizedDesc.includes('pagto cartao') ||
      desc.includes('compra com cartão') || desc.includes('compra com cartao') || 
      desc.includes('pagto cartão') || desc.includes('pagto cartao') ||
      normalizedDesc.includes('debito') || desc.includes('débito')) {
    // Tenta identificar melhor pela descrição
    const detalhesLower = desc.includes(' - ') ? desc.split(' - ')[1]?.toLowerCase() || '' : ''
    
    // Se tem nome de loja conhecida, classifica melhor
    if (VESTUARIO_KEYWORDS.some(kw => detalhesLower.includes(kw))) {
      return { category: 'VESTUARIO', type: 'SAIDA' }
    }
    if (LAZER_KEYWORDS.some(kw => detalhesLower.includes(kw))) {
      return { category: 'LAZER', type: 'SAIDA' }
    }
    if (SAUDE_KEYWORDS.some(kw => detalhesLower.includes(kw))) {
      return { category: 'SAUDE', type: 'SAIDA' }
    }
    
    return { category: 'COMPRAS_GERAIS', type: 'SAIDA' }
  }
  
  // Pagamento de boleto
  if (normalizedDesc.includes('pagamento de boleto') || normalizedDesc.includes('boleto') ||
      desc.includes('pagamento de boleto') || desc.includes('boleto')) {
    return { category: 'OUTROS', type: 'SAIDA' }
  }
  
  // Fallback para saídas não identificadas
  return { category: 'OUTROS', type: 'SAIDA' }
}

// Labels padrão
const STANDARD_LABELS: Record<StandardCategory, string> = {
  ALIMENTACAO_DENTRO: 'Alimentação em Casa',
  ALIMENTACAO_FORA: 'Alimentação Fora / Delivery',
  PIX_SAIDA: 'PIX Enviado',
  PIX_ENTRADA: 'PIX Recebido',
  ASSINATURAS: 'Assinaturas',
  DIVIDAS_CDC: 'Dívidas / CDC',
  MERCADO: 'Mercado',
  TRANSPORTE: 'Transporte',
  COMPRAS_GERAIS: 'Compras Gerais',
  TARIFAS: 'Tarifas',
  SAUDE: 'Saúde',
  LAZER: 'Lazer',
  EDUCACAO: 'Educação',
  VESTUARIO: 'Vestuário',
  COMBUSTIVEL: 'Combustível',
  SERVICOS: 'Serviços',
  MANUTENCAO: 'Manutenção',
  IMPOSTOS: 'Impostos',
  SALARIO: 'Salário',
  OUTROS: 'Outros',
}

export function getCategoryLabel(category: Category): string {
  // Se é categoria padrão, retorna label padrão
  if (category in STANDARD_LABELS) {
    return STANDARD_LABELS[category as StandardCategory]
  }
  // Se é categoria customizada, retorna ela mesma (já formatada)
  return category
}

// Cores padrão
const STANDARD_COLORS: Record<StandardCategory, string> = {
  ALIMENTACAO_DENTRO: 'text-green-400',
  ALIMENTACAO_FORA: 'text-yellow-400',
  PIX_SAIDA: 'text-red-400',
  PIX_ENTRADA: 'text-green-400',
  ASSINATURAS: 'text-purple-400',
  DIVIDAS_CDC: 'text-red-500',
  MERCADO: 'text-blue-400',
  TRANSPORTE: 'text-cyan-400',
  COMPRAS_GERAIS: 'text-orange-400',
  TARIFAS: 'text-gray-400',
  SAUDE: 'text-pink-400',
  LAZER: 'text-indigo-400',
  EDUCACAO: 'text-blue-500',
  VESTUARIO: 'text-fuchsia-400',
  COMBUSTIVEL: 'text-amber-500',
  SERVICOS: 'text-teal-400',
  MANUTENCAO: 'text-slate-400',
  IMPOSTOS: 'text-red-600',
  SALARIO: 'text-emerald-400',
  OUTROS: 'text-gray-500',
}

// Gera cor baseada em hash da string para categorias customizadas
function getColorFromString(str: string): string {
  const colors = [
    'text-blue-400',
    'text-purple-400',
    'text-pink-400',
    'text-indigo-400',
    'text-teal-400',
    'text-amber-400',
    'text-lime-400',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function getCategoryColor(category: Category): string {
  // Se é categoria padrão, retorna cor padrão
  if (category in STANDARD_COLORS) {
    return STANDARD_COLORS[category as StandardCategory]
  }
  // Se é categoria customizada, gera cor baseada no nome
  return getColorFromString(category)
}

// Lista de categorias padrão
export const STANDARD_CATEGORIES: StandardCategory[] = [
  'ALIMENTACAO_DENTRO',
  'ALIMENTACAO_FORA',
  'PIX_SAIDA',
  'PIX_ENTRADA',
  'ASSINATURAS',
  'DIVIDAS_CDC',
  'MERCADO',
  'TRANSPORTE',
  'COMPRAS_GERAIS',
  'TARIFAS',
  'SAUDE',
  'LAZER',
  'EDUCACAO',
  'VESTUARIO',
  'COMBUSTIVEL',
  'SERVICOS',
  'MANUTENCAO',
  'IMPOSTOS',
  'SALARIO',
  'OUTROS',
]

