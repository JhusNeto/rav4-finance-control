'use client'

import { SmartCard } from '@/lib/smartCards'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SmartCardsViewProps {
  cards: SmartCard[]
}

export function SmartCardsView({ cards }: SmartCardsViewProps) {
  if (cards.length === 0) return null
  
  const getColorClasses = (color: SmartCard['color']) => {
    switch (color) {
      case 'green':
        return 'bg-green-500/10 border-green-500/50 text-green-400'
      case 'yellow':
        return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
      case 'red':
        return 'bg-red-500/10 border-red-500/50 text-red-400'
      case 'blue':
        return 'bg-blue-500/10 border-blue-500/50 text-blue-400'
      default:
        return 'bg-muted border-border text-foreground'
    }
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card
          key={card.id}
          className={cn(
            'transition-all hover:scale-105 cursor-pointer',
            getColorClasses(card.color)
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{card.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{card.title}</h3>
                <p className="text-sm mb-3">{card.message}</p>
                {card.value > 0 && (
                  <div className="text-2xl font-bold">
                    {formatCurrency(card.value)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

