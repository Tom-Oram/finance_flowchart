/**
 * UK Tax Rates for 2024/25 Tax Year
 * Update these annually when new rates are announced
 */

// England & Northern Ireland Income Tax Bands (2024/25)
export const TAX_BANDS_ENGLAND_NI = {
  personalAllowance: 12570,
  basicRate: {
    threshold: 50270, // Upper limit for basic rate
    rate: 0.20,
  },
  higherRate: {
    threshold: 125140, // Upper limit for higher rate (when PA tapers to zero)
    rate: 0.40,
  },
  additionalRate: {
    rate: 0.45, // Above £125,140
  },
  // Personal allowance tapers by £1 for every £2 earned over £100k
  personalAllowanceTaperThreshold: 100000,
}

// Scotland Income Tax Bands (2024/25)
// Scotland has 5 income tax bands (more progressive)
export const TAX_BANDS_SCOTLAND = {
  personalAllowance: 12570, // Same as rest of UK
  starterRate: {
    threshold: 14876, // £12,570 - £14,876
    rate: 0.19,
  },
  basicRate: {
    threshold: 26561, // £14,877 - £26,561
    rate: 0.20,
  },
  intermediateRate: {
    threshold: 43662, // £26,562 - £43,662
    rate: 0.21,
  },
  higherRate: {
    threshold: 125140, // £43,663 - £125,140
    rate: 0.42,
  },
  topRate: {
    rate: 0.47, // Above £125,140
  },
  // Personal allowance tapers by £1 for every £2 earned over £100k
  personalAllowanceTaperThreshold: 100000,
}

// Wales Income Tax (2024/25)
// Wales currently uses England & NI rates but has devolved powers
// Future-proofed for potential divergence
export const TAX_BANDS_WALES = {
  ...TAX_BANDS_ENGLAND_NI,
  // Wales could set different rates in future
  // Currently identical to England & NI
}

// National Insurance Contributions (2024/25)
// Class 1 NICs for employees - applies UK-wide
export const NATIONAL_INSURANCE_BANDS = {
  primaryThreshold: 12570, // Annual threshold (aligned with PA)
  upperEarningsLimit: 50270, // Annual UEL
  class1Rate: 0.08, // 8% between PT and UEL (reduced from 12% in 2023)
  class1RateAbove: 0.02, // 2% above UEL
}

// Student Loan Repayment Thresholds (2024/25)
export const STUDENT_LOAN_THRESHOLDS = {
  plan_1: {
    threshold: 24990, // Annual threshold
    rate: 0.09, // 9% above threshold
    description: 'Plan 1 (pre-2012 England/Wales, all NI/Scotland)',
  },
  plan_2: {
    threshold: 27295, // Annual threshold
    rate: 0.09,
    description: 'Plan 2 (post-2012 England/Wales)',
  },
  plan_4: {
    threshold: 31395, // Annual threshold (Scotland only)
    rate: 0.09,
    description: 'Plan 4 (Scotland post-2007)',
  },
  plan_5: {
    threshold: 25000, // Annual threshold
    rate: 0.09,
    description: 'Plan 5 (England/Wales from 2023)',
  },
  postgrad: {
    threshold: 21000, // Annual threshold
    rate: 0.06, // 6% (lower rate than undergraduate)
    description: 'Postgraduate Loan',
  },
}

// Tax Year
export const CURRENT_TAX_YEAR = '2024/25'

// Self-Assessment deadlines
export const SELF_ASSESSMENT_DEADLINES = {
  registration: 'By 5 October after the end of the tax year',
  paperReturn: '31 October',
  onlineReturn: '31 January',
  paymentDue: '31 January (and 31 July for second payment on account)',
}

// Self-Assessment triggers (when you might need to file)
export const SELF_ASSESSMENT_CRITERIA = {
  selfEmployedIncome: 1000, // £1,000+ from self-employment
  rentalIncome: 2500, // £2,500+ from property (before expenses)
  savingsInterest: 10000, // £10,000+ in savings interest
  dividendIncome: 10000, // £10,000+ in dividends
  capitalGains: 6000, // Above CGT allowance (2024/25: £6,000)
  highIncome: 100000, // £100,000+ total income
  childBenefit: true, // If you or partner earn over £50,000 and claim Child Benefit
  untaxedIncome: 2500, // £2,500+ untaxed income
}
