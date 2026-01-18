'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showPercentage?: boolean
  color?: 'primary' | 'green' | 'red' | 'yellow'
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({
  value,
  max,
  label,
  showPercentage = true,
  color = 'primary',
  animated = true,
  size = 'md'
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  }

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="font-medium">{label}</span>
          {showPercentage && (
            <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={cn("w-full bg-secondary rounded-full overflow-hidden", heightClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorClasses[color],
            animated && "animate-in slide-in-from-left"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
