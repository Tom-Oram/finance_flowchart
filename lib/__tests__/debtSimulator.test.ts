import {
  simulateDebts,
  compareStrategies,
  calculateMinimumPayments,
  calculateTotalDebt,
  hasHighInterestDebt,
  hasNonMortgageStudentLoanDebt,
} from '../debtSimulator'
import { Debt } from '../types'

describe('debtSimulator', () => {
  const singleDebt: Debt = {
    id: '1',
    name: 'Test Card',
    type: 'credit_card',
    balance: 1000,
    apr: 20,
    minimumPayment: 25,
    hasPromo: false,
    promoMonthsRemaining: 0,
  }

  const twoDebts: Debt[] = [
    {
      id: '1',
      name: 'High APR Card',
      type: 'credit_card',
      balance: 2000,
      apr: 24,
      minimumPayment: 50,
      hasPromo: false,
      promoMonthsRemaining: 0,
    },
    {
      id: '2',
      name: 'Low APR Card',
      type: 'credit_card',
      balance: 1000,
      apr: 12,
      minimumPayment: 25,
      hasPromo: false,
      promoMonthsRemaining: 0,
    },
  ]

  describe('calculateMinimumPayments', () => {
    it('should calculate total minimum payments', () => {
      expect(calculateMinimumPayments([singleDebt])).toBe(25)
      expect(calculateMinimumPayments(twoDebts)).toBe(75)
      expect(calculateMinimumPayments([])).toBe(0)
    })
  })

  describe('calculateTotalDebt', () => {
    it('should calculate total debt balance', () => {
      expect(calculateTotalDebt([singleDebt])).toBe(1000)
      expect(calculateTotalDebt(twoDebts)).toBe(3000)
      expect(calculateTotalDebt([])).toBe(0)
    })
  })

  describe('hasHighInterestDebt', () => {
    it('should detect high interest debt over 10%', () => {
      expect(hasHighInterestDebt([singleDebt])).toBe(true)

      const lowInterestDebt: Debt = {
        ...singleDebt,
        apr: 5,
      }
      expect(hasHighInterestDebt([lowInterestDebt])).toBe(false)
    })

    it('should ignore mortgage and student loans', () => {
      const mortgage: Debt = {
        ...singleDebt,
        type: 'mortgage',
        apr: 15,
      }
      expect(hasHighInterestDebt([mortgage])).toBe(false)
    })

    it('should ignore debts on 0% promo', () => {
      const promoDebt: Debt = {
        ...singleDebt,
        hasPromo: true,
        promoMonthsRemaining: 12,
        apr: 25,
      }
      expect(hasHighInterestDebt([promoDebt])).toBe(false)
    })
  })

  describe('hasNonMortgageStudentLoanDebt', () => {
    it('should detect non-mortgage/student loan debts', () => {
      expect(hasNonMortgageStudentLoanDebt([singleDebt])).toBe(true)
    })

    it('should ignore mortgage and student loans', () => {
      const mortgage: Debt = { ...singleDebt, type: 'mortgage' }
      const studentLoan: Debt = { ...singleDebt, type: 'student_loan' }

      expect(hasNonMortgageStudentLoanDebt([mortgage, studentLoan])).toBe(false)
    })
  })

  describe('simulateDebts', () => {
    it('should handle empty debt list', () => {
      const result = simulateDebts([], 0, 'avalanche')

      expect(result.monthsToPayoff).toBe(0)
      expect(result.totalInterest).toBe(0)
      expect(result.schedule).toEqual([])
    })

    it('should pay off single debt correctly', () => {
      const result = simulateDebts([singleDebt], 100, 'avalanche')

      expect(result.monthsToPayoff).toBeGreaterThan(0)
      expect(result.monthsToPayoff).toBeLessThan(20) // Should pay off in reasonable time
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(result.schedule.length).toBeGreaterThan(0)

      // Final balance should be 0
      const lastEntry = result.schedule[result.schedule.length - 1]
      expect(lastEntry.balance).toBeLessThan(1) // Allow for rounding
    })

    it('should allocate extra payment to highest APR first (avalanche)', () => {
      const avalanche = simulateDebts(twoDebts, 100, 'avalanche')

      // In early months, extra payment should go to high APR debt
      const earlySchedule = avalanche.schedule.filter(s => s.month === 1)
      const highAprPayment = earlySchedule.find(s => s.debtId === '1')?.payment || 0
      const lowAprPayment = earlySchedule.find(s => s.debtId === '2')?.payment || 0

      // High APR should get more than just minimum
      expect(highAprPayment).toBeGreaterThan(50)
      // Low APR should get approximately its minimum
      expect(lowAprPayment).toBeCloseTo(25, 0)
    })

    it('should allocate extra payment to smallest balance first (snowball)', () => {
      const snowball = simulateDebts(twoDebts, 100, 'snowball')

      // In early months, extra payment should go to smaller balance
      const earlySchedule = snowball.schedule.filter(s => s.month === 1)
      const smallBalancePayment = earlySchedule.find(s => s.debtId === '2')?.payment || 0
      const largeBalancePayment = earlySchedule.find(s => s.debtId === '1')?.payment || 0

      // Small balance should get more than just minimum
      expect(smallBalancePayment).toBeGreaterThan(25)
      // Large balance should get approximately its minimum
      expect(largeBalancePayment).toBeCloseTo(50, 0)
    })

    it('should handle promotional rates correctly', () => {
      const promoDebt: Debt = {
        id: '1',
        name: 'Promo Card',
        type: 'credit_card',
        balance: 1000,
        apr: 0,
        minimumPayment: 50,
        hasPromo: true,
        promoMonthsRemaining: 6,
        postPromoApr: 24,
      }

      const result = simulateDebts([promoDebt], 50, 'avalanche')

      // Interest should be 0 during promo period
      const promoMonthsSchedule = result.schedule.filter(s => s.month <= 6)
      const promoInterest = promoMonthsSchedule.reduce((sum, s) => sum + s.interest, 0)
      expect(promoInterest).toBe(0)

      // If debt extends beyond promo, should accrue interest after
      if (result.monthsToPayoff > 6) {
        const postPromoSchedule = result.schedule.filter(s => s.month > 6)
        const postPromoInterest = postPromoSchedule.reduce((sum, s) => sum + s.interest, 0)
        expect(postPromoInterest).toBeGreaterThan(0)
      }
    })
  })

  describe('compareStrategies', () => {
    it('should compare avalanche and snowball strategies', () => {
      const comparison = compareStrategies(twoDebts, 100)

      expect(comparison.avalanche).toBeDefined()
      expect(comparison.snowball).toBeDefined()
      expect(comparison.interestSaved).toBeDefined()
      expect(comparison.monthsSaved).toBeDefined()

      // Avalanche should save interest (or be equal)
      expect(comparison.interestSaved).toBeGreaterThanOrEqual(0)
    })

    it('should show avalanche saves money on different APRs', () => {
      const comparison = compareStrategies(twoDebts, 100)

      // With significantly different APRs, avalanche should save money
      expect(comparison.avalanche.totalInterest).toBeLessThanOrEqual(
        comparison.snowball.totalInterest
      )
    })
  })
})
