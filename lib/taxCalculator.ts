/**
 * UK Tax Calculation Library
 * Calculates income tax, National Insurance, and student loan repayments
 * Based on 2024/25 tax year rates
 */

import {
  TAX_BANDS_ENGLAND_NI,
  TAX_BANDS_SCOTLAND,
  TAX_BANDS_WALES,
  NATIONAL_INSURANCE_BANDS,
  STUDENT_LOAN_THRESHOLDS,
  SELF_ASSESSMENT_CRITERIA,
} from './taxRates'
import { TaxConfig, TaxSystem, StudentLoanPlan, Income } from './types'

/**
 * Parse tax code to extract personal allowance
 * Common formats: 1257L, K497, BR, NT, D0, etc.
 */
export function parseTaxCode(taxCode: string): {
  personalAllowance: number
  isK: boolean // K code means negative allowance (owe tax from previous years)
  isNT: boolean // NT means no tax
  isBR: boolean // BR means basic rate on all income (20%)
  isD0: boolean // D0 means higher rate on all income (40%)
  isD1: boolean // D1 means additional rate on all income (45%)
} {
  const code = taxCode.toUpperCase().trim()

  // Special codes
  if (code === 'NT') {
    return { personalAllowance: 999999, isK: false, isNT: true, isBR: false, isD0: false, isD1: false }
  }
  if (code === 'BR') {
    return { personalAllowance: 0, isK: false, isNT: false, isBR: true, isD0: false, isD1: false }
  }
  if (code === 'D0') {
    return { personalAllowance: 0, isK: false, isNT: false, isBR: false, isD0: true, isD1: false }
  }
  if (code === 'D1') {
    return { personalAllowance: 0, isK: false, isNT: false, isBR: false, isD0: false, isD1: true }
  }

  // K code (negative allowance)
  if (code.startsWith('K')) {
    const number = parseInt(code.substring(1))
    if (isNaN(number)) return { personalAllowance: 12570, isK: false, isNT: false, isBR: false, isD0: false, isD1: false }
    return { personalAllowance: -number * 10, isK: true, isNT: false, isBR: false, isD0: false, isD1: false }
  }

  // Standard L code (most common)
  if (code.endsWith('L')) {
    const number = parseInt(code.substring(0, code.length - 1))
    if (isNaN(number)) return { personalAllowance: 12570, isK: false, isNT: false, isBR: false, isD0: false, isD1: false }
    return { personalAllowance: number * 10, isK: false, isNT: false, isBR: false, isD0: false, isD1: false }
  }

  // Default to standard personal allowance
  return { personalAllowance: 12570, isK: false, isNT: false, isBR: false, isD0: false, isD1: false }
}

/**
 * Calculate income tax for England/NI
 */
function calculateIncomeTaxEnglandNI(grossAnnual: number, personalAllowance: number): number {
  const bands = TAX_BANDS_ENGLAND_NI

  // Apply personal allowance taper (£1 reduction for every £2 over £100k)
  let adjustedPA = personalAllowance
  if (grossAnnual > bands.personalAllowanceTaperThreshold) {
    const excess = grossAnnual - bands.personalAllowanceTaperThreshold
    const reduction = Math.floor(excess / 2)
    adjustedPA = Math.max(0, personalAllowance - reduction)
  }

  const taxableIncome = Math.max(0, grossAnnual - adjustedPA)
  let tax = 0

  // Basic rate: £0 - £37,700 (£50,270 - £12,570)
  const basicRateBand = bands.basicRate.threshold - bands.personalAllowance
  if (taxableIncome > 0) {
    const basicRateAmount = Math.min(taxableIncome, basicRateBand)
    tax += basicRateAmount * bands.basicRate.rate
  }

  // Higher rate: £37,701 - £112,570 (£50,271 - £125,140 minus tapered PA)
  if (taxableIncome > basicRateBand) {
    const higherRateBand = bands.higherRate.threshold - bands.basicRate.threshold
    const higherRateAmount = Math.min(taxableIncome - basicRateBand, higherRateBand)
    tax += higherRateAmount * bands.higherRate.rate
  }

  // Additional rate: Above £125,140
  if (taxableIncome > (bands.higherRate.threshold - adjustedPA)) {
    const additionalRateAmount = taxableIncome - (bands.higherRate.threshold - adjustedPA)
    tax += additionalRateAmount * bands.additionalRate.rate
  }

  return Math.round(tax * 100) / 100
}

/**
 * Calculate income tax for Scotland
 */
function calculateIncomeTaxScotland(grossAnnual: number, personalAllowance: number): number {
  const bands = TAX_BANDS_SCOTLAND

  // Apply personal allowance taper
  let adjustedPA = personalAllowance
  if (grossAnnual > bands.personalAllowanceTaperThreshold) {
    const excess = grossAnnual - bands.personalAllowanceTaperThreshold
    const reduction = Math.floor(excess / 2)
    adjustedPA = Math.max(0, personalAllowance - reduction)
  }

  const taxableIncome = Math.max(0, grossAnnual - adjustedPA)
  let tax = 0

  if (taxableIncome === 0) return 0

  // Starter rate: £12,571 - £14,876
  const starterBand = bands.starterRate.threshold - bands.personalAllowance
  if (taxableIncome > 0) {
    const starterAmount = Math.min(taxableIncome, starterBand)
    tax += starterAmount * bands.starterRate.rate
  }

  // Basic rate: £14,877 - £26,561
  if (taxableIncome > starterBand) {
    const basicBand = bands.basicRate.threshold - bands.starterRate.threshold
    const basicAmount = Math.min(taxableIncome - starterBand, basicBand)
    tax += basicAmount * bands.basicRate.rate
  }

  // Intermediate rate: £26,562 - £43,662
  if (taxableIncome > (bands.basicRate.threshold - bands.personalAllowance)) {
    const intermediateBand = bands.intermediateRate.threshold - bands.basicRate.threshold
    const intermediateAmount = Math.min(
      taxableIncome - (bands.basicRate.threshold - bands.personalAllowance),
      intermediateBand
    )
    tax += intermediateAmount * bands.intermediateRate.rate
  }

  // Higher rate: £43,663 - £125,140
  if (taxableIncome > (bands.intermediateRate.threshold - bands.personalAllowance)) {
    const higherBand = bands.higherRate.threshold - bands.intermediateRate.threshold
    const higherAmount = Math.min(
      taxableIncome - (bands.intermediateRate.threshold - bands.personalAllowance),
      higherBand
    )
    tax += higherAmount * bands.higherRate.rate
  }

  // Top rate: Above £125,140
  if (taxableIncome > (bands.higherRate.threshold - adjustedPA)) {
    const topAmount = taxableIncome - (bands.higherRate.threshold - adjustedPA)
    tax += topAmount * bands.topRate.rate
  }

  return Math.round(tax * 100) / 100
}

/**
 * Calculate income tax for Wales (currently same as England/NI)
 */
function calculateIncomeTaxWales(grossAnnual: number, personalAllowance: number): number {
  return calculateIncomeTaxEnglandNI(grossAnnual, personalAllowance)
}

/**
 * Main income tax calculation function
 */
export function calculateIncomeTax(
  grossAnnual: number,
  taxCode: string,
  taxSystem: TaxSystem
): number {
  if (grossAnnual <= 0) return 0

  const parsed = parseTaxCode(taxCode)

  // Handle special tax codes
  if (parsed.isNT) return 0
  if (parsed.isBR) return grossAnnual * 0.20
  if (parsed.isD0) return grossAnnual * 0.40
  if (parsed.isD1) return grossAnnual * 0.45

  // Calculate based on tax system
  switch (taxSystem) {
    case 'scotland':
      return calculateIncomeTaxScotland(grossAnnual, parsed.personalAllowance)
    case 'wales':
      return calculateIncomeTaxWales(grossAnnual, parsed.personalAllowance)
    case 'england_ni':
    default:
      return calculateIncomeTaxEnglandNI(grossAnnual, parsed.personalAllowance)
  }
}

/**
 * Calculate National Insurance contributions
 * Class 1 NICs for employees (applies UK-wide)
 */
export function calculateNationalInsurance(grossAnnual: number): number {
  if (grossAnnual <= 0) return 0

  const bands = NATIONAL_INSURANCE_BANDS
  let ni = 0

  // Between primary threshold and upper earnings limit: 8%
  if (grossAnnual > bands.primaryThreshold) {
    const amountInBand = Math.min(
      grossAnnual - bands.primaryThreshold,
      bands.upperEarningsLimit - bands.primaryThreshold
    )
    ni += amountInBand * bands.class1Rate
  }

  // Above upper earnings limit: 2%
  if (grossAnnual > bands.upperEarningsLimit) {
    const amountAbove = grossAnnual - bands.upperEarningsLimit
    ni += amountAbove * bands.class1RateAbove
  }

  return Math.round(ni * 100) / 100
}

/**
 * Calculate student loan repayment
 */
export function calculateStudentLoanRepayment(
  grossAnnual: number,
  plan: StudentLoanPlan,
  hasPostgrad: boolean
): number {
  if (grossAnnual <= 0) return 0

  let totalRepayment = 0

  // Undergraduate loan repayment
  if (plan !== 'none' && plan !== 'postgrad') {
    const threshold = STUDENT_LOAN_THRESHOLDS[plan].threshold
    const rate = STUDENT_LOAN_THRESHOLDS[plan].rate

    if (grossAnnual > threshold) {
      totalRepayment += (grossAnnual - threshold) * rate
    }
  }

  // Postgraduate loan repayment (can be in addition to undergraduate)
  if (hasPostgrad) {
    const threshold = STUDENT_LOAN_THRESHOLDS.postgrad.threshold
    const rate = STUDENT_LOAN_THRESHOLDS.postgrad.rate

    if (grossAnnual > threshold) {
      totalRepayment += (grossAnnual - threshold) * rate
    }
  }

  return Math.round(totalRepayment * 100) / 100
}

/**
 * Calculate net income from gross using tax configuration
 * This is the main function to convert gross to net
 */
export function calculateNetFromGross(
  grossAnnual: number,
  taxConfig: TaxConfig
): number {
  if (grossAnnual <= 0) return 0

  const incomeTax = calculateIncomeTax(grossAnnual, taxConfig.taxCode, taxConfig.taxSystem)
  const ni = calculateNationalInsurance(grossAnnual)
  const studentLoan = calculateStudentLoanRepayment(
    grossAnnual,
    taxConfig.studentLoanPlan,
    taxConfig.postgraduateLoan
  )

  const netAnnual = grossAnnual - incomeTax - ni - studentLoan

  return Math.max(0, Math.round(netAnnual * 100) / 100)
}

/**
 * Get tax breakdown for display
 */
export function getTaxBreakdown(grossAnnual: number, taxConfig: TaxConfig) {
  const incomeTax = calculateIncomeTax(grossAnnual, taxConfig.taxCode, taxConfig.taxSystem)
  const ni = calculateNationalInsurance(grossAnnual)
  const studentLoan = calculateStudentLoanRepayment(
    grossAnnual,
    taxConfig.studentLoanPlan,
    taxConfig.postgraduateLoan
  )
  const netAnnual = calculateNetFromGross(grossAnnual, taxConfig)

  return {
    grossAnnual,
    incomeTax,
    nationalInsurance: ni,
    studentLoan,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveTaxRate: grossAnnual > 0 ? ((grossAnnual - netAnnual) / grossAnnual) * 100 : 0,
  }
}

/**
 * Check if user needs to file self-assessment tax return
 */
export function needsSelfAssessment(
  income: Income,
  taxConfig: TaxConfig,
  options: {
    rentalIncome?: number
    savingsInterest?: number
    dividendIncome?: number
    capitalGains?: number
    untaxedIncome?: number
    claimsChildBenefit?: boolean
  } = {}
): boolean {
  const totalIncome = income.primaryNet + income.secondaryNet + income.other
  const criteria = SELF_ASSESSMENT_CRITERIA

  // Self-employed
  if (taxConfig.isSelfEmployed) return true

  // High income (over £100k)
  if (totalIncome >= criteria.highIncome) return true

  // Other income sources
  if (options.rentalIncome && options.rentalIncome >= criteria.rentalIncome) return true
  if (options.savingsInterest && options.savingsInterest >= criteria.savingsInterest) return true
  if (options.dividendIncome && options.dividendIncome >= criteria.dividendIncome) return true
  if (options.capitalGains && options.capitalGains >= criteria.capitalGains) return true
  if (options.untaxedIncome && options.untaxedIncome >= criteria.untaxedIncome) return true

  // Child Benefit and high earner
  if (options.claimsChildBenefit && totalIncome >= 50000) return true

  // User has marked they have other income that requires SA
  if (taxConfig.hasOtherIncome) return true

  return false
}
