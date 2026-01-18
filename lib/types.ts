import { z } from 'zod'

// Currency schemas
export const CurrencySchema = z.enum(['GBP', 'EUR', 'USD', 'CUSTOM'])
export type Currency = z.infer<typeof CurrencySchema>

export const HouseholdTypeSchema = z.enum(['single', 'couple'])
export type HouseholdType = z.infer<typeof HouseholdTypeSchema>

// Tax system schemas
export const TaxSystemSchema = z.enum(['england_ni', 'scotland', 'wales'])
export type TaxSystem = z.infer<typeof TaxSystemSchema>

export const StudentLoanPlanSchema = z.enum(['none', 'plan_1', 'plan_2', 'plan_4', 'plan_5', 'postgrad'])
export type StudentLoanPlan = z.infer<typeof StudentLoanPlanSchema>

export const TaxConfigSchema = z.object({
  enabled: z.boolean().default(false),
  taxCode: z.string().default('1257L'), // 2024/25 standard personal allowance
  taxSystem: TaxSystemSchema.default('england_ni'),
  studentLoanPlan: StudentLoanPlanSchema.default('none'),
  postgraduateLoan: z.boolean().default(false),
  // For self-assessment tracking
  isSelfEmployed: z.boolean().default(false),
  hasOtherIncome: z.boolean().default(false),
  needsSelfAssessment: z.boolean().default(false),
})
export type TaxConfig = z.infer<typeof TaxConfigSchema>

// Income schema (with optional gross income support)
export const IncomeSchema = z.object({
  primaryNet: z.number().min(0),
  primaryGross: z.number().min(0).optional(), // Annual gross for tax calculation
  secondaryNet: z.number().min(0).default(0),
  secondaryGross: z.number().min(0).optional(), // Annual gross for tax calculation
  other: z.number().min(0).default(0),
})
export type Income = z.infer<typeof IncomeSchema>

// Outgoing line item
export const LineItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  amount: z.number().min(0),
  isEssential: z.boolean().default(true),
})
export type LineItem = z.infer<typeof LineItemSchema>

// Outgoings schema
export const OutgoingsSchema = z.object({
  items: z.array(LineItemSchema),
  annualCosts: z.array(LineItemSchema).default([]),
})
export type Outgoings = z.infer<typeof OutgoingsSchema>

// Debt type
export const DebtTypeSchema = z.enum([
  'credit_card',
  'loan',
  'overdraft',
  'bnpl',
  'mortgage',
  'student_loan',
  'other',
])
export type DebtType = z.infer<typeof DebtTypeSchema>

// Debt payment calculation mode
export const DebtPaymentModeSchema = z.enum(['minimum_payment', 'fixed_term'])
export type DebtPaymentMode = z.infer<typeof DebtPaymentModeSchema>

// Debt schema
export const DebtSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: DebtTypeSchema,
  balance: z.number().min(0),
  apr: z.number().min(0).max(100),
  // Payment mode: 'minimum_payment' or 'fixed_term'
  paymentMode: DebtPaymentModeSchema.default('minimum_payment'),
  minimumPayment: z.number().min(0),
  // For fixed-term loans
  fixedTermMonths: z.number().min(0).optional(),
  totalRepayable: z.number().min(0).optional(), // Total amount to repay (principal + interest)
  hasPromo: z.boolean().default(false),
  promoMonthsRemaining: z.number().min(0).default(0),
  postPromoApr: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})
export type Debt = z.infer<typeof DebtSchema>

// Pension schema
export const PensionSchema = z.object({
  isEnrolled: z.boolean().default(false),
  hasEmployerMatch: z.boolean().default(false),
  employeeContributionPercent: z.number().min(0).max(100).default(0),
  employerMatchPercent: z.number().min(0).max(100).default(0),
  canAffordMaxMatch: z.boolean().default(false),
})
export type Pension = z.infer<typeof PensionSchema>

// Savings schema
export const SavingsSchema = z.object({
  currentCash: z.number().min(0).default(0),
  emergencyFundMonths: z.number().min(1).max(12).default(3),
  initialEFMonths: z.number().min(1).max(3).default(1),
})
export type Savings = z.infer<typeof SavingsSchema>

// Goal schema
export const GoalSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  targetAmount: z.number().min(0),
  targetDate: z.string(), // ISO date
  isShortTerm: z.boolean().default(true), // <5 years
})
export type Goal = z.infer<typeof GoalSchema>

// Performance tracking - Monthly snapshot (must be before FinancialStateSchema)
export const MonthlySnapshotSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date (YYYY-MM-DD)
  totalDebt: z.number(),
  totalSavings: z.number(),
  totalIncome: z.number(),
  totalOutgoings: z.number(),
  surplus: z.number(),
  debts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    balance: z.number(),
  })),
  // Open banking compatible fields
  openBankingData: z.object({
    accountBalances: z.array(z.object({
      accountId: z.string().optional(),
      accountName: z.string().optional(),
      balance: z.number(),
      currency: z.string(),
      type: z.enum(['current', 'savings', 'credit_card', 'loan']),
    })).optional(),
    transactions: z.array(z.object({
      id: z.string().optional(),
      date: z.string(),
      amount: z.number(),
      description: z.string().optional(),
      category: z.string().optional(),
    })).optional(),
  }).optional(),
})
export type MonthlySnapshot = z.infer<typeof MonthlySnapshotSchema>

// Financial state (the main state object)
export const FinancialStateSchema = z.object({
  currency: CurrencySchema.default('GBP'),
  customFxRate: z.number().positive().default(1),
  householdType: HouseholdTypeSchema.default('single'),
  income: IncomeSchema,
  outgoings: OutgoingsSchema,
  savings: SavingsSchema,
  debts: z.array(DebtSchema).default([]),
  pension: PensionSchema,
  goals: z.array(GoalSchema).default([]),
  reliesOnCreditForEssentials: z.boolean().default(false),
  taxConfig: TaxConfigSchema.default({ enabled: false }),
  monthlySnapshots: z.array(MonthlySnapshotSchema).default([]),
  lastSnapshotDate: z.string().optional(),
})
export type FinancialState = z.infer<typeof FinancialStateSchema>

// Debt payoff strategy
export const PayoffStrategySchema = z.enum(['avalanche', 'snowball'])
export type PayoffStrategy = z.infer<typeof PayoffStrategySchema>

// Debt schedule entry (simulation output)
export interface DebtScheduleEntry {
  month: number
  date: Date
  debtId: string
  debtName: string
  balance: number
  payment: number
  principal: number
  interest: number
}

// Payoff summary
export interface PayoffSummary {
  strategy: PayoffStrategy
  monthsToPayoff: number
  totalInterest: number
  payoffDate: Date
  schedule: DebtScheduleEntry[]
}

// Flowchart step
export interface FlowchartStep {
  id: string
  title: string
  description: string
  helpLinks: { text: string; url: string }[]
  isComplete: (state: FinancialState) => boolean
  getNextActions: (state: FinancialState) => string[]
}

// Flowchart evaluation result
export interface FlowchartEvaluation {
  currentStepId: string
  completedStepIds: string[]
  nextActions: string[]
  allSteps: FlowchartStep[]
}

// Performance report
export interface PerformanceReport {
  currentMonth: MonthlySnapshot
  previousMonth?: MonthlySnapshot
  changes: {
    debtChange: number
    debtChangePercent: number
    savingsChange: number
    savingsChangePercent: number
    surplusChange: number
    netWorthChange: number
  }
  trends: {
    debtTrend: 'improving' | 'worsening' | 'stable'
    savingsTrend: 'improving' | 'worsening' | 'stable'
    surplusTrend: 'improving' | 'worsening' | 'stable'
  }
  milestones: {
    achieved: string[]
    upcoming: string[]
  }
}

// Updated financial state with snapshots
export const FinancialStateWithSnapshotsSchema = FinancialStateSchema.extend({
  monthlySnapshots: z.array(MonthlySnapshotSchema).default([]),
  lastSnapshotDate: z.string().optional(),
})
