import {
  Debt,
  PayoffStrategy,
  DebtScheduleEntry,
  PayoffSummary,
} from './types'
import { addMonths } from './format'

interface DebtState {
  id: string
  name: string
  balance: number
  apr: number
  minimumPayment: number
  hasPromo: boolean
  promoMonthsRemaining: number
  postPromoApr: number
  paymentMode: 'minimum_payment' | 'fixed_term'
  fixedTermMonths?: number
  fixedMonthlyPayment?: number
}

function calculateMonthlyInterest(balance: number, apr: number): number {
  const monthlyRate = apr / 100 / 12
  return balance * monthlyRate
}

function sortDebtsByStrategy(
  debts: DebtState[],
  strategy: PayoffStrategy
): DebtState[] {
  if (strategy === 'avalanche') {
    // Highest APR first (considering promo rates)
    return [...debts].sort((a, b) => {
      const aRate = a.hasPromo && a.promoMonthsRemaining > 0 ? 0 : a.apr
      const bRate = b.hasPromo && b.promoMonthsRemaining > 0 ? 0 : b.apr
      return bRate - aRate
    })
  } else {
    // Snowball: Lowest balance first
    return [...debts].sort((a, b) => a.balance - b.balance)
  }
}

export function simulateDebts(
  debts: Debt[],
  extraPayment: number,
  strategy: PayoffStrategy,
  startDate: Date = new Date()
): PayoffSummary {
  if (debts.length === 0) {
    return {
      strategy,
      monthsToPayoff: 0,
      totalInterest: 0,
      payoffDate: startDate,
      schedule: [],
    }
  }

  // Initialize debt states
  let debtStates: DebtState[] = debts.map((d) => {
    const state: DebtState = {
      id: d.id,
      name: d.name,
      balance: d.balance,
      apr: d.apr,
      minimumPayment: d.minimumPayment,
      hasPromo: d.hasPromo,
      promoMonthsRemaining: d.promoMonthsRemaining,
      postPromoApr: d.postPromoApr || d.apr,
      paymentMode: d.paymentMode || 'minimum_payment',
      fixedTermMonths: d.fixedTermMonths,
    }

    // Calculate fixed monthly payment if in fixed_term mode
    if (d.paymentMode === 'fixed_term' && d.totalRepayable && d.fixedTermMonths) {
      // Total repayable already includes all interest - simple division
      state.fixedMonthlyPayment = d.totalRepayable / d.fixedTermMonths
      // Update balance to total repayable since that's what we're actually paying off
      state.balance = d.totalRepayable
      // Set APR to 0 since interest is already baked in
      state.apr = 0
    } else if (d.paymentMode === 'fixed_term' && d.fixedTermMonths && d.balance && d.apr > 0) {
      // Calculate using standard loan formula: P = (r * PV) / (1 - (1 + r)^-n)
      const monthlyRate = d.apr / 100 / 12
      const n = d.fixedTermMonths
      const pv = d.balance
      state.fixedMonthlyPayment = (monthlyRate * pv) / (1 - Math.pow(1 + monthlyRate, -n))
    }

    return state
  })

  const schedule: DebtScheduleEntry[] = []
  let month = 0
  let totalInterest = 0
  const maxMonths = 600 // Safety limit: 50 years

  while (debtStates.some((d) => d.balance > 0.01) && month < maxMonths) {
    month++
    const currentDate = addMonths(startDate, month)

    // Calculate total minimum payment
    const totalMinimum = debtStates.reduce(
      (sum, d) => (d.balance > 0 ? sum + d.minimumPayment : sum),
      0
    )

    // Determine extra payment allocation
    let remainingExtra = extraPayment

    // Sort debts by strategy for extra payment allocation
    const sortedDebts = sortDebtsByStrategy(
      debtStates.filter((d) => d.balance > 0),
      strategy
    )

    // Pay minimums first, then allocate extra
    for (const debt of debtStates) {
      if (debt.balance <= 0) continue

      // Determine current APR (handle promo)
      let currentApr = debt.apr
      if (debt.hasPromo && debt.promoMonthsRemaining > 0) {
        currentApr = 0
        debt.promoMonthsRemaining--
      } else if (debt.hasPromo && debt.promoMonthsRemaining === 0) {
        // Promo expired, switch to post-promo rate
        currentApr = debt.postPromoApr
        debt.apr = debt.postPromoApr
        debt.hasPromo = false
      }

      // Calculate interest for this month
      const interest = calculateMonthlyInterest(debt.balance, currentApr)
      totalInterest += interest

      // Determine payment for this debt
      let payment: number

      if (debt.paymentMode === 'fixed_term' && debt.fixedMonthlyPayment) {
        // Fixed-term loan: use calculated fixed payment as base
        payment = debt.fixedMonthlyPayment

        // But still allow extra payments on top for priority debt
        if (sortedDebts.length > 0 && sortedDebts[0].id === debt.id && remainingExtra > 0) {
          const extraForThisDebt = Math.min(remainingExtra, debt.balance + interest - payment)
          payment += Math.max(0, extraForThisDebt)
          remainingExtra -= Math.max(0, extraForThisDebt)
        }
      } else {
        // Variable payment: use minimum + potential extra
        payment = debt.minimumPayment

        // If this is the priority debt for extra payment
        if (sortedDebts.length > 0 && sortedDebts[0].id === debt.id && remainingExtra > 0) {
          const extraForThisDebt = Math.min(remainingExtra, debt.balance + interest - payment)
          payment += Math.max(0, extraForThisDebt)
          remainingExtra -= Math.max(0, extraForThisDebt)
        }
      }

      // Ensure payment doesn't exceed balance + interest
      payment = Math.min(payment, debt.balance + interest)

      const principal = payment - interest
      debt.balance = Math.max(0, debt.balance - principal)

      // Record schedule entry
      schedule.push({
        month,
        date: currentDate,
        debtId: debt.id,
        debtName: debt.name,
        balance: debt.balance,
        payment,
        principal,
        interest,
      })
    }

    // Remove paid-off debts from active list
    debtStates = debtStates.filter((d) => d.balance > 0)
  }

  return {
    strategy,
    monthsToPayoff: month,
    totalInterest,
    payoffDate: addMonths(startDate, month),
    schedule,
  }
}

export function compareStrategies(
  debts: Debt[],
  extraPayment: number,
  startDate: Date = new Date()
): {
  avalanche: PayoffSummary
  snowball: PayoffSummary
  interestSaved: number
  monthsSaved: number
} {
  const avalanche = simulateDebts(debts, extraPayment, 'avalanche', startDate)
  const snowball = simulateDebts(debts, extraPayment, 'snowball', startDate)

  return {
    avalanche,
    snowball,
    interestSaved: snowball.totalInterest - avalanche.totalInterest,
    monthsSaved: snowball.monthsToPayoff - avalanche.monthsToPayoff,
  }
}

export function calculateMinimumPayments(debts: Debt[]): number {
  return debts.reduce((sum, d) => {
    // For fixed-term loans, calculate the actual payment
    if (d.paymentMode === 'fixed_term') {
      if (d.totalRepayable && d.fixedTermMonths) {
        // Simple division: total repayable / months
        return sum + (d.totalRepayable / d.fixedTermMonths)
      } else if (d.fixedTermMonths && d.balance && d.apr > 0) {
        // Standard loan formula
        const monthlyRate = d.apr / 100 / 12
        const n = d.fixedTermMonths
        const pv = d.balance
        const payment = (monthlyRate * pv) / (1 - Math.pow(1 + monthlyRate, -n))
        return sum + payment
      }
    }
    return sum + d.minimumPayment
  }, 0)
}

export function calculateTotalDebt(debts: Debt[]): number {
  return debts.reduce((sum, d) => {
    // Always use balance - it represents current outstanding amount
    return sum + d.balance
  }, 0)
}

export function hasHighInterestDebt(debts: Debt[]): boolean {
  return debts.some((d) => {
    // Exclude mortgage and student loans from high-interest check
    if (d.type === 'mortgage' || d.type === 'student_loan') return false
    // Consider debts over 10% APR as high interest (unless on 0% promo)
    if (d.hasPromo && d.promoMonthsRemaining > 0) return false
    return d.apr > 10
  })
}

export function hasNonMortgageStudentLoanDebt(debts: Debt[]): boolean {
  return debts.some((d) => d.type !== 'mortgage' && d.type !== 'student_loan' && d.balance > 0)
}

export function filterPayoffDebts(debts: Debt[]): Debt[] {
  // Filter out mortgage and student loans for standard payoff tracking
  return debts.filter((d) => d.type !== 'mortgage' && d.type !== 'student_loan')
}
