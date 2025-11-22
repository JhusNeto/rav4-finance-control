import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'storage')

// Garante que o diretório existe
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

// GET - Carrega dados salvos
export async function GET() {
  try {
    await ensureDataDir()
    const filePath = path.join(DATA_DIR, 'finance-data.json')
    
    if (!existsSync(filePath)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Nenhum dado encontrado',
        data: null 
      })
    }
    
    const fileContent = await readFile(filePath, 'utf-8')
    
    // Valida se o conteúdo não está vazio
    if (!fileContent || fileContent.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Arquivo vazio',
        data: null 
      })
    }
    
    let data
    try {
      data = JSON.parse(fileContent)
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError)
      console.error('Conteúdo do arquivo (primeiros 500 chars):', fileContent.substring(0, 500))
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao fazer parse do JSON: ' + (parseError instanceof Error ? parseError.message : 'Erro desconhecido'),
        data: null 
      }, { status: 500 })
    }
    
    // Valida estrutura básica
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ 
        success: false, 
        message: 'Dados inválidos',
        data: null 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data 
    })
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null 
    }, { status: 500 })
  }
}

// POST - Salva dados
export async function POST(request: NextRequest) {
  try {
    await ensureDataDir()
    const body = await request.json()
    
    // Valida estrutura básica
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        success: false, 
        message: 'Dados inválidos recebidos' 
      }, { status: 400 })
    }
    
    // Garante que transações estão serializadas corretamente
    if (body.transactions && Array.isArray(body.transactions)) {
      body.transactions = body.transactions.map((t: any) => {
        // Se a data ainda for um objeto Date, converte para string
        if (t.date instanceof Date) {
          return {
            ...t,
            date: t.date.toISOString()
          }
        }
        return t
      })
    }
    
    const filePath = path.join(DATA_DIR, 'finance-data.json')
    const dataToSave = {
      ...body,
      savedAt: new Date().toISOString(),
    }
    
    // Tenta serializar para validar antes de salvar
    let serialized: string
    try {
      serialized = JSON.stringify(dataToSave, null, 2)
    } catch (stringifyError) {
      console.error('Erro ao serializar dados:', stringifyError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao serializar dados: ' + (stringifyError instanceof Error ? stringifyError.message : 'Erro desconhecido')
      }, { status: 500 })
    }
    
    await writeFile(filePath, serialized, 'utf-8')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Dados salvos com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao salvar dados:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao salvar dados' 
    }, { status: 500 })
  }
}

// DELETE - Limpa dados
export async function DELETE() {
  try {
    const filePath = path.join(DATA_DIR, 'finance-data.json')
    
    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises')
      await unlink(filePath)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Dados removidos com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao remover dados:', error)
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro ao remover dados' 
    }, { status: 500 })
  }
}

