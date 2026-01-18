'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { FinancialState, Debt, LineItem, Goal, MonthlySnapshot, TaxConfig } from '@/lib/types'
import { saveFinancialState, loadFinancialState } from '@/lib/storage'
import { createMonthlySnapshot, shouldCreateSnapshot } from '@/lib/performanceTracking'

interface FinancialContextType {
  state: FinancialState
  updateIncome: (income: Partial<FinancialState['income']>) => void
  updateOutgoings: (outgoings: Partial<FinancialState['outgoings']>) => void
  updateSavings: (savings: Partial<FinancialState['savings']>) => void
  updatePension: (pension: Partial<FinancialState['pension']>) => void
  updateTaxConfig: (taxConfig: Partial<TaxConfig>) => void
  addDebt: (debt: Debt) => void
  updateDebt: (id: string, debt: Partial<Debt>) => void
  removeDebt: (id: string) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, goal: Partial<Goal>) => void
  removeGoal: (id: string) => void
  updateSettings: (settings: Partial<Pick<FinancialState, 'currency' | 'customFxRate' | 'householdType' | 'reliesOnCreditForEssentials'>>) => void
  resetState: () => void
  importState: (state: FinancialState) => void
  createSnapshot: () => void
  manualSnapshot: (customDate?: Date) => void
  deleteSnapshot: (id: string) => void
}

const defaultState: FinancialState = {
  currency: 'GBP',
  customFxRate: 1,
  householdType: 'single',
  income: {
    primaryNet: 0,
    secondaryNet: 0,
    other: 0,
  },
  outgoings: {
    items: [],
    annualCosts: [],
  },
  savings: {
    currentCash: 0,
    emergencyFundMonths: 3,
    initialEFMonths: 1,
  },
  debts: [],
  pension: {
    isEnrolled: false,
    hasEmployerMatch: false,
    employeeContributionPercent: 0,
    employerMatchPercent: 0,
    canAffordMaxMatch: false,
  },
  goals: [],
  reliesOnCreditForEssentials: false,
  taxConfig: {
    enabled: false,
    taxCode: '1257L',
    taxSystem: 'england_ni',
    studentLoanPlan: 'none',
    postgraduateLoan: false,
    isSelfEmployed: false,
    hasOtherIncome: false,
    needsSelfAssessment: false,
  },
  monthlySnapshots: [],
  lastSnapshotDate: undefined,
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinancialState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFinancialState()
    if (loaded) {
      setState(loaded)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      saveFinancialState(state)
    }
  }, [state, isLoaded])

  const updateIncome = (income: Partial<FinancialState['income']>) => {
    setState((prev) => ({
      ...prev,
      income: { ...prev.income, ...income },
    }))
  }

  const updateOutgoings = (outgoings: Partial<FinancialState['outgoings']>) => {
    setState((prev) => ({
      ...prev,
      outgoings: { ...prev.outgoings, ...outgoings },
    }))
  }

  const updateSavings = (savings: Partial<FinancialState['savings']>) => {
    setState((prev) => ({
      ...prev,
      savings: { ...prev.savings, ...savings },
    }))
  }

  const updatePension = (pension: Partial<FinancialState['pension']>) => {
    setState((prev) => ({
      ...prev,
      pension: { ...prev.pension, ...pension },
    }))
  }

  const updateTaxConfig = (taxConfig: Partial<TaxConfig>) => {
    setState((prev) => ({
      ...prev,
      taxConfig: { ...prev.taxConfig, ...taxConfig },
    }))
  }

  const addDebt = (debt: Debt) => {
    setState((prev) => ({
      ...prev,
      debts: [...prev.debts, debt],
    }))
  }

  const updateDebt = (id: string, debtUpdate: Partial<Debt>) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === id ? { ...d, ...debtUpdate } : d)),
    }))
  }

  const removeDebt = (id: string) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }))
  }

  const addGoal = (goal: Goal) => {
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, goal],
    }))
  }

  const updateGoal = (id: string, goalUpdate: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...goalUpdate } : g)),
    }))
  }

  const removeGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }))
  }

  const updateSettings = (settings: Partial<Pick<FinancialState, 'currency' | 'customFxRate' | 'householdType' | 'reliesOnCreditForEssentials'>>) => {
    setState((prev) => ({
      ...prev,
      ...settings,
    }))
  }

  const resetState = () => {
    setState(defaultState)
  }

  const importState = (newState: FinancialState) => {
    setState(newState)
  }

  const createSnapshot = () => {
    if (!shouldCreateSnapshot(state)) return

    const snapshot = createMonthlySnapshot(state)
    setState((prev) => ({
      ...prev,
      monthlySnapshots: [...prev.monthlySnapshots, snapshot],
      lastSnapshotDate: new Date().toISOString(),
    }))
  }

  const manualSnapshot = (customDate?: Date) => {
    const snapshotDate = customDate || new Date()
    const dateString = snapshotDate.toISOString().split('T')[0]

    // Check if snapshot already exists for this day (one per day limit)
    const existingSnapshot = state.monthlySnapshots.find(
      s => s.date === dateString
    )

    if (existingSnapshot && !customDate) {
      // Don't create duplicate for same day unless it's a custom date (testing)
      console.warn('Snapshot already exists for today')
      return
    }

    const snapshot = createMonthlySnapshot(state, snapshotDate)
    setState((prev) => ({
      ...prev,
      monthlySnapshots: [...prev.monthlySnapshots, snapshot],
      lastSnapshotDate: snapshotDate.toISOString(),
    }))
  }

  const deleteSnapshot = (id: string) => {
    setState((prev) => ({
      ...prev,
      monthlySnapshots: prev.monthlySnapshots.filter(s => s.id !== id),
    }))
  }

  // Auto-create snapshot on significant changes
  useEffect(() => {
    if (isLoaded && shouldCreateSnapshot(state)) {
      createSnapshot()
    }
  }, [state.debts, state.savings.currentCash, isLoaded])

  return (
    <FinancialContext.Provider
      value={{
        state,
        updateIncome,
        updateOutgoings,
        updateSavings,
        updatePension,
        updateTaxConfig,
        addDebt,
        updateDebt,
        removeDebt,
        addGoal,
        updateGoal,
        removeGoal,
        updateSettings,
        resetState,
        importState,
        createSnapshot,
        manualSnapshot,
        deleteSnapshot,
      }}
    >
      {children}
    </FinancialContext.Provider>
  )
}

export function useFinancial() {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider')
  }
  return context
}
