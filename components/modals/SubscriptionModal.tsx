'use client'

import { HiddenSubscription } from '@/lib/hiddenSubscriptions'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Calendar, DollarSign, AlertCircle, TrendingUp } from 'lucide-react'

interface SubscriptionModalProps {
  subscription: HiddenSubscription | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionModal({ subscription, open, onOpenChange }: SubscriptionModalProps) {
  if (!subscription) return null

  const confidenceColors = {
    high: 'text-red-400 border-red-500/50 bg-red-500/5',
    medium: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/5',
    low: 'text-blue-400 border-blue-500/50 bg-blue-500/5'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Assinatura Oculta Detectada
          </DialogTitle>
          <DialogDescription>
            Micro pagamento recorrente identificado automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Principais */}
          <Card className={confidenceColors[subscription.confidence]}>
            <CardHeader>
              <CardTitle className="text-lg">{subscription.message}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-1 rounded bg-background/50">
                  Confiança: {subscription.confidence === 'high' ? 'Alta' : 
                             subscription.confidence === 'medium' ? 'Média' : 
                             'Baixa'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(subscription.amount)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Frequência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  {subscription.frequency === 'monthly' ? 'Mensal' :
                   subscription.frequency === 'biweekly' ? 'Quinzenal' :
                   subscription.frequency === 'weekly' ? 'Semanal' :
                   'Irregular'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ocorrências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{subscription.occurrences}</p>
                <p className="text-xs text-muted-foreground">vezes detectadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Gasto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(subscription.totalSpent)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Primeira vez: </span>
                <span className="font-medium">{formatDate(subscription.firstSeen)}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Última vez: </span>
                <span className="font-medium">{formatDate(subscription.lastSeen)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{subscription.description}</p>
            </CardContent>
          </Card>

          {/* Aviso */}
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Atenção</p>
                  <p className="text-sm text-muted-foreground">
                    Esta assinatura não está categorizada como tal. Considere revisar e categorizar corretamente para melhor controle financeiro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

