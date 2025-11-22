'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { Calendar } from 'lucide-react'

interface RAV4TargetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTarget: number
  currentTargetDate: Date
  currentStartDate: Date
  onSave: (target: number, targetDate: Date, startDate: Date) => void
}

export function RAV4TargetModal({
  open,
  onOpenChange,
  currentTarget,
  currentTargetDate,
  currentStartDate,
  onSave
}: RAV4TargetModalProps) {
  const [target, setTarget] = useState(currentTarget.toString())
  const [targetDate, setTargetDate] = useState(
    currentTargetDate.toISOString().split('T')[0]
  )
  const [startDate, setStartDate] = useState(
    currentStartDate.toISOString().split('T')[0]
  )
  const [errors, setErrors] = useState<{
    target?: string
    targetDate?: string
    startDate?: string
  }>({})

  // Atualiza os valores quando o modal abre ou os valores mudam
  useEffect(() => {
    if (open) {
      setTarget(currentTarget.toString())
      setTargetDate(currentTargetDate.toISOString().split('T')[0])
      setStartDate(currentStartDate.toISOString().split('T')[0])
      setErrors({})
    }
  }, [open, currentTarget, currentTargetDate, currentStartDate])

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    // Validação do objetivo
    const targetNum = parseFloat(target.replace(/[^\d,.-]/g, '').replace(',', '.'))
    if (isNaN(targetNum) || targetNum <= 0) {
      newErrors.target = 'Objetivo deve ser um valor maior que zero'
    }

    // Validação das datas
    const targetDateObj = new Date(targetDate)
    const startDateObj = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(targetDateObj.getTime())) {
      newErrors.targetDate = 'Data alvo inválida'
    } else if (targetDateObj <= today) {
      newErrors.targetDate = 'Data alvo deve ser no futuro'
    }

    if (isNaN(startDateObj.getTime())) {
      newErrors.startDate = 'Data de início inválida'
    }

    if (startDateObj > targetDateObj) {
      newErrors.startDate = 'Data de início deve ser anterior à data alvo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) {
      return
    }

    const targetNum = parseFloat(target.replace(/[^\d,.-]/g, '').replace(',', '.'))
    const targetDateObj = new Date(targetDate)
    const startDateObj = new Date(startDate)

    onSave(targetNum, targetDateObj, startDateObj)
    onOpenChange(false)
  }

  const formatCurrencyInput = (value: string) => {
    // Remove tudo exceto números, vírgula e ponto
    const cleaned = value.replace(/[^\d,.-]/g, '')
    
    // Se tem vírgula, mantém como está (formato brasileiro)
    if (cleaned.includes(',')) {
      return cleaned
    }
    
    // Se tem ponto, pode ser formato americano ou decimal
    if (cleaned.includes('.')) {
      return cleaned
    }
    
    // Se só tem números, formata como moeda brasileira
    if (cleaned.length > 0) {
      const num = parseFloat(cleaned)
      if (!isNaN(num)) {
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(num / 100)
      }
    }
    
    return cleaned
  }

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Permite entrada livre, mas formata na exibição
    setTarget(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Objetivo RAV4
          </DialogTitle>
          <DialogDescription>
            Configure seu objetivo macro e as datas do Projeto RAV4
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="target">Objetivo (R$)</Label>
            <Input
              id="target"
              type="text"
              placeholder="50.000,00"
              value={target}
              onChange={handleTargetChange}
              className={errors.target ? 'border-red-500' : ''}
            />
            {errors.target && (
              <p className="text-sm text-red-400">{errors.target}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Valor total que você deseja economizar até a data alvo
            </p>
          </div>

          {/* Data de Início */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={errors.startDate ? 'border-red-500' : ''}
            />
            {errors.startDate && (
              <p className="text-sm text-red-400">{errors.startDate}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Quando você começou (ou vai começar) o Projeto RAV4
            </p>
          </div>

          {/* Data Alvo */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Data Alvo</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={errors.targetDate ? 'border-red-500' : ''}
            />
            {errors.targetDate && (
              <p className="text-sm text-red-400">{errors.targetDate}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Quando você pretende alcançar o objetivo
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <h4 className="font-medium mb-2">Resumo:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Objetivo:</span>
                <span className="font-bold">
                  {target ? new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(parseFloat(target.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0) : 'R$ 0,00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Início:</span>
                <span className="font-bold">{startDate ? formatDate(new Date(startDate)) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alvo:</span>
                <span className="font-bold">{targetDate ? formatDate(new Date(targetDate)) : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Objetivo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

