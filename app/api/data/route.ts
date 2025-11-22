import { NextRequest, NextResponse } from 'next/server'

// GET - Carrega dados salvos
// NOTA: Esta rota foi descontinuada. O sistema agora usa apenas Supabase.
// Esta rota retorna vazio para manter compatibilidade, mas não deve ser usada.
export async function GET() {
  // Retorna vazio, pois o sistema agora usa apenas Supabase
  // A função loadFromServer() em dataPersistence.ts já não chama mais esta rota
  return NextResponse.json({ 
    success: false, 
    message: 'Esta rota foi descontinuada. O sistema agora usa apenas Supabase para persistência.',
    data: null 
  })
}

// POST - Salva dados
// NOTA: Esta rota foi descontinuada. O sistema agora usa apenas Supabase.
// Esta rota retorna sucesso para manter compatibilidade, mas não salva nada.
export async function POST(request: NextRequest) {
  // Retorna sucesso, mas não salva nada, pois o sistema agora usa apenas Supabase
  // A função saveToServer() em dataPersistence.ts já não chama mais esta rota
  console.warn('⚠️ Tentativa de usar rota /api/data POST descontinuada. Use Supabase.')
  return NextResponse.json({ 
    success: true, 
    message: 'Esta rota foi descontinuada. Os dados são salvos automaticamente no Supabase.' 
  })
}

// DELETE - Limpa dados
// NOTA: Esta rota foi descontinuada. O sistema agora usa apenas Supabase.
// Esta rota retorna sucesso para manter compatibilidade, mas não deleta nada.
export async function DELETE() {
  // Retorna sucesso, mas não deleta nada, pois o sistema agora usa apenas Supabase
  // A função clearTransactions() já deleta diretamente do Supabase
  console.warn('⚠️ Tentativa de usar rota /api/data DELETE descontinuada. Use Supabase.')
  return NextResponse.json({ 
    success: true, 
    message: 'Esta rota foi descontinuada. Os dados são deletados diretamente do Supabase.' 
  })
}

