'use client'

import { Heart } from 'lucide-react'

interface EmotionalBadgeProps {
  className?: string
}

export function EmotionalBadge({ className = '' }: EmotionalBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-500/20 text-pink-400 border border-pink-500/30 ${className}`}
      title="Compra emocional"
    >
      <Heart className="h-3 w-3 fill-pink-400" />
      Emocional
    </span>
  )
}

