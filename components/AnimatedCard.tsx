'use client'

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

export function AnimatedCard({ children, className, delay = 0, hover = true }: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4",
        hover && "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <Card className={cn(
        "h-full transition-colors",
        hover && "hover:border-primary/50"
      )}>
        {children}
      </Card>
    </div>
  )
}
