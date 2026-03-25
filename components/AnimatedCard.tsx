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
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <Card className={cn(
        "h-full transition-colors duration-300",
        hover && "hover:border-primary/30"
      )}>
        {children}
      </Card>
    </div>
  )
}
