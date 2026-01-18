'use client'

import { FinancialProvider } from '@/contexts/FinancialContext'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <FinancialProvider>{children}</FinancialProvider>
}
