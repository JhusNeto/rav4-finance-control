'use client'

import { useState } from 'react'
import { Transaction, Category, getCategoryLabel, STANDARD_CATEGORIES } from '@/lib/classification'
import { learnClassification } from '@/lib/aiClassifier'
import { findSimilarTransactions } from '@/lib/similarTransactions'
import { useFinanceStore } from '@/store/financeStore'
import { Edit2, Check, X, Plus } from 'lucide-react'
import { SimilarTransactionsModal } from './SimilarTransactionsModal'

interface CategoryEditorProps {
  transaction: Transaction
  onUpdate?: () => void
}

export function CategoryEditor({ transaction, onUpdate }: CategoryEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category>(transaction.category)
  const [showSimilarModal, setShowSimilarModal] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [similarTransactions, setSimilarTransactions] = useState<Array<{ transaction: Transaction; similarity: number }>>([])
  const { setTransactions, transactions, customCategories, addCustomCategory } = useFinanceStore()

  // Combina categorias padrão com customizadas
  const allCategories: Category[] = [
    ...STANDARD_CATEGORIES,
    ...customCategories
  ]

  const handleSave = () => {
    // Se está criando nova categoria, valida e cria
    if (isCreatingNew && newCategoryName.trim()) {
      const normalizedName = newCategoryName.trim()
      
      // Verifica se já existe
      if (allCategories.includes(normalizedName)) {
        alert('Esta categoria já existe!')
        return
      }
      
      // Cria a nova categoria
      addCustomCategory(normalizedName)
      setSelectedCategory(normalizedName)
      setIsCreatingNew(false)
      setNewCategoryName('')
    }
    
    // Atualiza a transação no store
    const updatedTransactions = transactions.map(t =>
      t.id === transaction.id
        ? { ...t, category: selectedCategory }
        : t
    )
    setTransactions(updatedTransactions)

    // Aprende a nova classificação
    learnClassification(
      transaction.description,
      transaction.amount,
      selectedCategory,
      transaction.type
    )

    setIsEditing(false)
    setIsCreatingNew(false)
    setNewCategoryName('')

    // Busca transações similares
    const updatedTransaction = { ...transaction, category: selectedCategory }
    const similar = findSimilarTransactions(updatedTransaction, updatedTransactions, 0.5)
    
    if (similar.length > 0) {
      setSimilarTransactions(similar)
      setShowSimilarModal(true)
    } else {
      onUpdate?.()
    }
  }

  const handleConfirmSimilar = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      setShowSimilarModal(false)
      setSimilarTransactions([])
      onUpdate?.()
      return
    }

    // Busca as transações atualizadas do store para garantir que temos a versão mais recente
    // Usa getState() para acessar o estado atual do Zustand sem precisar do hook
    const store = useFinanceStore.getState()
    const currentTransactions = store.transactions
    
    // Recategoriza apenas as transações selecionadas
    const updatedTransactions = currentTransactions.map(t => {
      if (selectedIds.includes(t.id)) {
        // Aprende cada classificação
        learnClassification(
          t.description,
          t.amount,
          selectedCategory,
          t.type
        )
        return { ...t, category: selectedCategory }
      }
      return t
    })
    
    // Atualiza o store com as transações recategorizadas
    store.setTransactions(updatedTransactions)
    setShowSimilarModal(false)
    setSimilarTransactions([])
    onUpdate?.()
  }

  const handleCancelSimilar = () => {
    setShowSimilarModal(false)
    setSimilarTransactions([])
    onUpdate?.()
  }

  const handleCancel = () => {
    setSelectedCategory(transaction.category)
    setIsEditing(false)
    setIsCreatingNew(false)
    setNewCategoryName('')
  }

  const handleCreateNew = () => {
    setIsCreatingNew(true)
    setNewCategoryName('')
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        {!isCreatingNew ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  handleCreateNew()
                } else {
                  setSelectedCategory(e.target.value as Category)
                }
              }}
              className="px-2 py-1 text-sm bg-muted border border-border rounded text-foreground"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
              <option value="__NEW__">+ Criar nova categoria</option>
            </select>
            <button
              onClick={handleSave}
              className="p-1 text-green-400 hover:text-green-300 transition-colors"
              title="Salvar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da nova categoria"
              className="px-2 py-1 text-sm bg-muted border border-border rounded text-foreground flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                } else if (e.key === 'Escape') {
                  handleCancel()
                }
              }}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={!newCategoryName.trim()}
              className="p-1 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Criar e salvar"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsCreatingNew(false)
                setNewCategoryName('')
              }}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              title="Cancelar criação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        title="Editar categoria"
      >
        <span>{getCategoryLabel(transaction.category)}</span>
        <Edit2 className="h-3 w-3" />
      </button>

      {showSimilarModal && (
        <SimilarTransactionsModal
          referenceTransaction={{ ...transaction, category: selectedCategory }}
          similarTransactions={similarTransactions}
          onConfirm={handleConfirmSimilar}
          onCancel={handleCancelSimilar}
          open={showSimilarModal}
        />
      )}
    </>
  )
}

