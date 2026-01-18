import {
  FinancialState,
  FlowchartStep,
  FlowchartEvaluation,
} from './types'
import {
  hasHighInterestDebt,
  hasNonMortgageStudentLoanDebt,
  calculateMinimumPayments,
} from './debtSimulator'

// Helper to calculate monthly totals
function calculateMonthlyTotals(state: FinancialState) {
  const totalIncome =
    state.income.primaryNet + state.income.secondaryNet + state.income.other

  const essentialOutgoings = state.outgoings.items
    .filter((item) => item.isEssential)
    .reduce((sum, item) => sum + item.amount, 0)

  const discretionaryOutgoings = state.outgoings.items
    .filter((item) => !item.isEssential)
    .reduce((sum, item) => sum + item.amount, 0)

  const annualCostsMonthly =
    state.outgoings.annualCosts.reduce((sum, item) => sum + item.amount, 0) / 12

  const totalOutgoings =
    essentialOutgoings + discretionaryOutgoings + annualCostsMonthly

  const minimumDebtPayments = calculateMinimumPayments(state.debts)

  const surplus = totalIncome - totalOutgoings - minimumDebtPayments

  return {
    totalIncome,
    essentialOutgoings,
    discretionaryOutgoings,
    annualCostsMonthly,
    totalOutgoings,
    minimumDebtPayments,
    surplus,
  }
}

// Define flowchart steps
const FLOWCHART_STEPS: FlowchartStep[] = [
  {
    id: 'budget',
    title: 'Create a budget and prioritise essentials',
    description:
      'Understand your income and outgoings. Prioritise important bills, ensure you have adequate insurance, and check eligibility for state support.',
    helpLinks: [
      {
        text: 'UKPF Budgeting Guide',
        url: 'https://ukpersonal.finance/budgeting/',
      },
      {
        text: 'Benefits Calculator',
        url: 'https://www.entitledto.co.uk/',
      },
    ],
    isComplete: (state) => {
      // Consider complete if user has entered income and outgoings
      const totals = calculateMonthlyTotals(state)
      return totals.totalIncome > 0 && state.outgoings.items.length > 0
    },
    getNextActions: (state) => {
      const actions = []
      const totals = calculateMonthlyTotals(state)

      if (totals.totalIncome === 0) {
        actions.push('Enter your household income in the Budget section')
      }
      if (state.outgoings.items.length === 0) {
        actions.push('List your essential and discretionary outgoings')
      }
      actions.push('Review eligibility for benefits and state support')
      actions.push('Check you have adequate insurance (home, life, income protection)')
      actions.push('Ensure essential bills are prioritised')

      return actions
    },
  },
  {
    id: 'problem_debt',
    title: 'Deal with problem debt',
    description:
      'If you rely on credit cards or loans to pay for essentials, or cannot afford minimum payments, seek free debt advice.',
    helpLinks: [
      { text: 'StepChange Debt Charity', url: 'https://www.stepchange.org/' },
      {
        text: 'National Debtline',
        url: 'https://www.nationaldebtline.org/',
      },
      { text: 'Citizens Advice', url: 'https://www.citizensadvice.org.uk/' },
    ],
    isComplete: (state) => {
      const totals = calculateMonthlyTotals(state)
      // Complete if not relying on credit and surplus is non-negative
      return !state.reliesOnCreditForEssentials && totals.surplus >= 0
    },
    getNextActions: (state) => {
      const totals = calculateMonthlyTotals(state)
      const actions = []

      if (state.reliesOnCreditForEssentials || totals.surplus < 0) {
        actions.push(
          'Consider contacting StepChange, National Debtline, or Citizens Advice for free debt support'
        )
        actions.push('Review your budget to identify areas to reduce spending')
        actions.push(
          'Contact creditors to discuss payment arrangements if struggling'
        )
      }

      return actions
    },
  },
  {
    id: 'initial_emergency_fund',
    title: 'Build initial emergency fund',
    description:
      'Aim for 1-3 months of essential expenses in an accessible savings account. This provides a buffer against unexpected costs.',
    helpLinks: [
      {
        text: 'UKPF Emergency Fund Guide',
        url: 'https://ukpersonal.finance/emergency-fund/',
      },
    ],
    isComplete: (state) => {
      const totals = calculateMonthlyTotals(state)
      const initialTarget = totals.essentialOutgoings * state.savings.initialEFMonths
      return state.savings.currentCash >= initialTarget
    },
    getNextActions: (state) => {
      const totals = calculateMonthlyTotals(state)
      const initialTarget = totals.essentialOutgoings * state.savings.initialEFMonths
      const needed = initialTarget - state.savings.currentCash

      const actions = []

      if (needed > 0) {
        const months = totals.surplus > 0 ? Math.ceil(needed / totals.surplus) : 0
        actions.push(
          `Save £${needed.toFixed(0)} to reach your initial emergency fund target (${state.savings.initialEFMonths} month${state.savings.initialEFMonths > 1 ? 's' : ''})`
        )
        if (totals.surplus > 0) {
          actions.push(
            `At your current surplus, this would take approximately ${months} months`
          )
        }
      }

      return actions
    },
  },
  {
    id: 'high_interest_debt',
    title: 'Pay down expensive debt',
    description:
      'Focus on clearing debts with interest rates above 10% APR while maintaining minimum payments on all debts.',
    helpLinks: [
      {
        text: 'UKPF Debt Guide',
        url: 'https://ukpersonal.finance/debt/',
      },
    ],
    isComplete: (state) => {
      return !hasHighInterestDebt(state.debts)
    },
    getNextActions: (state) => {
      const actions = []
      const highInterestDebts = state.debts.filter((d) => {
        if (d.type === 'mortgage' || d.type === 'student_loan') return false
        if (d.hasPromo && d.promoMonthsRemaining > 0) return false
        return d.apr > 10
      })

      if (highInterestDebts.length > 0) {
        actions.push(
          'Use the Debts section to model paying down high-interest debts (>10% APR)'
        )
        actions.push('Consider the avalanche method to minimize interest')
        actions.push(
          'Look into balance transfer or consolidation options if available'
        )
      }

      return actions
    },
  },
  {
    id: 'pension_match',
    title: 'Contribute to pension to get employer match',
    description:
      'If your employer offers pension matching, contribute enough to get the full match. This is essentially free money.',
    helpLinks: [
      {
        text: 'UKPF Pensions Guide',
        url: 'https://ukpersonal.finance/pensions/',
      },
    ],
    isComplete: (state) => {
      if (!state.pension.hasEmployerMatch) return true // N/A if no match
      return state.pension.canAffordMaxMatch
    },
    getNextActions: (state) => {
      const actions = []

      if (!state.pension.isEnrolled) {
        actions.push('Check if you are enrolled in your workplace pension')
      }

      if (
        state.pension.hasEmployerMatch &&
        !state.pension.canAffordMaxMatch
      ) {
        actions.push(
          `Consider contributing ${state.pension.employerMatchPercent}% to get the full ${state.pension.employerMatchPercent}% employer match`
        )
      }

      return actions
    },
  },
  {
    id: 'remaining_debt',
    title: 'Clear remaining non-mortgage debt',
    description:
      'Pay off remaining debts (excluding mortgage and student loans) to free up monthly cashflow.',
    helpLinks: [
      {
        text: 'UKPF Debt Guide',
        url: 'https://ukpersonal.finance/debt/',
      },
    ],
    isComplete: (state) => {
      return !hasNonMortgageStudentLoanDebt(state.debts)
    },
    getNextActions: (state) => {
      const actions = []

      if (hasNonMortgageStudentLoanDebt(state.debts)) {
        actions.push('Use the Debts section to plan payoff of remaining debts')
        actions.push(
          'Compare avalanche (lowest interest) vs snowball (smallest balance first) strategies'
        )
      }

      return actions
    },
  },
  {
    id: 'full_emergency_fund',
    title: 'Build full emergency fund',
    description:
      'Aim for 3-12 months of essential expenses. The right amount depends on your job security and circumstances.',
    helpLinks: [
      {
        text: 'UKPF Emergency Fund Guide',
        url: 'https://ukpersonal.finance/emergency-fund/',
      },
    ],
    isComplete: (state) => {
      const totals = calculateMonthlyTotals(state)
      const fullTarget =
        totals.essentialOutgoings * state.savings.emergencyFundMonths
      return state.savings.currentCash >= fullTarget
    },
    getNextActions: (state) => {
      const totals = calculateMonthlyTotals(state)
      const fullTarget =
        totals.essentialOutgoings * state.savings.emergencyFundMonths
      const needed = fullTarget - state.savings.currentCash

      const actions = []

      if (needed > 0) {
        actions.push(
          `Save £${needed.toFixed(0)} to reach your ${state.savings.emergencyFundMonths}-month emergency fund target`
        )
        if (totals.surplus > 0) {
          const months = Math.ceil(needed / totals.surplus)
          actions.push(`This would take approximately ${months} months at your current surplus`)
        }
      }

      return actions
    },
  },
  {
    id: 'short_term_goals',
    title: 'Save for short-term goals',
    description:
      'Plan for goals within the next 5 years (house deposit, car, wedding, etc.).',
    helpLinks: [
      {
        text: 'UKPF Saving Guide',
        url: 'https://ukpersonal.finance/saving/',
      },
    ],
    isComplete: (state) => {
      // Simple heuristic: complete if no short-term goals or user has moved past
      return state.goals.filter((g) => g.isShortTerm).length === 0
    },
    getNextActions: (state) => {
      const actions = []
      const shortTermGoals = state.goals.filter((g) => g.isShortTerm)

      if (shortTermGoals.length > 0) {
        actions.push('Review your short-term goals and track progress')
        actions.push('Consider a Lifetime ISA for first-time home buyers (25% bonus)')
      } else {
        actions.push('Define any short-term savings goals (<5 years) if applicable')
      }

      return actions
    },
  },
  {
    id: 'long_term_investing',
    title: 'Invest for the long term',
    description:
      'Consider investing surplus funds for goals more than 5 years away. Research stocks & shares ISAs, pensions, and other tax-efficient accounts.',
    helpLinks: [
      {
        text: 'UKPF Investing Guide',
        url: 'https://ukpersonal.finance/investing-101/',
      },
      {
        text: 'UKPF ISA Guide',
        url: 'https://ukpersonal.finance/isa/',
      },
    ],
    isComplete: () => false, // This is an ongoing step
    getNextActions: (state) => {
      const totals = calculateMonthlyTotals(state)
      const actions = []

      if (totals.surplus > 0) {
        actions.push('Research stocks & shares ISAs for tax-efficient investing')
        actions.push(
          'Consider increasing pension contributions beyond employer match'
        )
        actions.push('Review the UKPF investing guide to understand risk and diversification')
      }

      return actions
    },
  },
  {
    id: 'review_mortgage',
    title: 'Consider mortgage overpayments or other debt',
    description:
      'Assess whether overpaying your mortgage or student loan makes sense for your situation.',
    helpLinks: [
      {
        text: 'UKPF Mortgage Guide',
        url: 'https://ukpersonal.finance/mortgage-overpayments/',
      },
    ],
    isComplete: () => false, // Ongoing decision
    getNextActions: (state) => {
      const actions = []
      const hasMortgage = state.debts.some((d) => d.type === 'mortgage')
      const hasStudentLoan = state.debts.some((d) => d.type === 'student_loan')

      if (hasMortgage) {
        actions.push(
          'Review your mortgage rate and consider overpayment benefits vs investing'
        )
      }
      if (hasStudentLoan) {
        actions.push(
          'Understand student loan repayment terms (Plan 1/2/4/5) before considering overpayment'
        )
      }

      return actions
    },
  },
]

export function evaluateFlowchart(
  state: FinancialState
): FlowchartEvaluation {
  const completedStepIds: string[] = []
  let currentStepId = FLOWCHART_STEPS[0].id
  let currentStep = FLOWCHART_STEPS[0]

  // Determine which steps are complete and find the current step
  for (const step of FLOWCHART_STEPS) {
    if (step.isComplete(state)) {
      completedStepIds.push(step.id)
    } else {
      // First incomplete step is the current step
      if (currentStepId === FLOWCHART_STEPS[0].id || completedStepIds.includes(currentStepId)) {
        currentStepId = step.id
        currentStep = step
      }
    }
  }

  // Special case: problem debt overrides other steps
  const totals = calculateMonthlyTotals(state)
  if (state.reliesOnCreditForEssentials || totals.surplus < 0) {
    currentStepId = 'problem_debt'
    currentStep = FLOWCHART_STEPS.find((s) => s.id === 'problem_debt')!
  }

  const nextActions = currentStep.getNextActions(state)

  return {
    currentStepId,
    completedStepIds,
    nextActions,
    allSteps: FLOWCHART_STEPS,
  }
}

export { FLOWCHART_STEPS }
