'use client'

import { PIXGroup } from '@/lib/pixGrouping'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, TrendingUp, Calendar } from 'lucide-react'

interface PIXGroupingCardProps {
  groups: PIXGroup[]
}

export function PIXGroupingCard({ groups }: PIXGroupingCardProps) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agrupamento de PIX
          </CardTitle>
          <CardDescription>
            Nenhum PIX encontrado este mês
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Agrupamento de PIX ({groups.length} destinatários)
        </CardTitle>
        <CardDescription>
          PIX agrupados automaticamente por destinatário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {groups.map((group, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-medium mb-1 truncate" title={group.recipient}>
                    {group.recipient}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {group.pattern}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold">
                    {formatCurrency(group.totalAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {group.count} PIX
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">Média</div>
                  <div className="font-medium">{formatCurrency(group.averageAmount)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Frequência</div>
                  <div className="font-medium capitalize">
                    {group.frequency === 'daily' ? 'Diário' :
                     group.frequency === 'weekly' ? 'Semanal' :
                     group.frequency === 'monthly' ? 'Mensal' :
                     'Irregular'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Período</div>
                  <div className="font-medium text-xs">
                    {formatDate(group.firstTransaction)} - {formatDate(group.lastTransaction)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

