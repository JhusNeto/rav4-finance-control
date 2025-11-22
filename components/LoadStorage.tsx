'use client'

import { useEffect, useState } from 'react'
import { useFinanceStore } from '@/store/financeStore'

export function LoadStorage() {
  const [mounted, setMounted] = useState(false)
  const loadFromStorage = useFinanceStore((state) => state.loadFromStorage)

  useEffect(() => {
    // Marca como montado e carrega dados do servidor (JSON permanente)
    setMounted(true)
    loadFromStorage()
  }, [loadFromStorage])

  // Não renderiza nada até estar montado no cliente
  if (!mounted) {
    return null
  }

  return null
}

