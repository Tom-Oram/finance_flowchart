import { FinancialState, MonthlySnapshot, PerformanceReport } from './types'
import { calculateMinimumPayments, calculateTotalDebt } from './debtSimulator'

/**
 * Creates a monthly snapshot of the current financial state
 */
export function createMonthlySnapshot(state: FinancialState, date: Date = new Date()): MonthlySnapshot {
  const totalIncome = state.income.primaryNet + state.income.secondaryNet + state.income.other

  const essentialOutgoings = state.outgoings.items
    .filter((i) => i.isEssential)
    .reduce((sum, i) => sum + i.amount, 0)

  const discretionaryOutgoings = state.outgoings.items
    .filter((i) => !i.isEssential)
    .reduce((sum, i) => sum + i.amount, 0)

  const annualCostsMonthly = state.outgoings.annualCosts.reduce((sum, i) => sum + i.amount, 0) / 12
  const totalOutgoings = essentialOutgoings + discretionaryOutgoings + annualCostsMonthly

  const minimumDebtPayments = calculateMinimumPayments(state.debts)
  const totalDebt = calculateTotalDebt(state.debts)
  const totalSavings = state.savings.currentCash
  const surplus = totalIncome - totalOutgoings - minimumDebtPayments

  return {
    id: date.toISOString(),
    date: date.toISOString().split('T')[0],
    totalDebt,
    totalSavings,
    totalIncome,
    totalOutgoings,
    surplus,
    debts: state.debts.map(d => ({
      id: d.id,
      name: d.name,
      balance: d.balance,
    })),
    openBankingData: {
      accountBalances: [],
      transactions: [],
    },
  }
}

/**
 * Determines if a snapshot should be created (one per day limit)
 */
export function shouldCreateSnapshot(state: FinancialState): boolean {
  if (!state.lastSnapshotDate) return true

  const today = new Date()
  const todayString = today.toISOString().split('T')[0]

  // Check if a snapshot already exists for today
  const existsToday = state.monthlySnapshots.some(s => s.date === todayString)

  return !existsToday
}

/**
 * Generates a performance report comparing current vs previous month
 */
export function generatePerformanceReport(
  currentSnapshot: MonthlySnapshot,
  previousSnapshot?: MonthlySnapshot
): PerformanceReport {
  const changes = {
    debtChange: previousSnapshot ? currentSnapshot.totalDebt - previousSnapshot.totalDebt : 0,
    debtChangePercent: previousSnapshot && previousSnapshot.totalDebt > 0
      ? ((currentSnapshot.totalDebt - previousSnapshot.totalDebt) / previousSnapshot.totalDebt) * 100
      : 0,
    savingsChange: previousSnapshot ? currentSnapshot.totalSavings - previousSnapshot.totalSavings : 0,
    savingsChangePercent: previousSnapshot && previousSnapshot.totalSavings > 0
      ? ((currentSnapshot.totalSavings - previousSnapshot.totalSavings) / previousSnapshot.totalSavings) * 100
      : 0,
    surplusChange: previousSnapshot ? currentSnapshot.surplus - previousSnapshot.surplus : 0,
    netWorthChange: previousSnapshot
      ? (currentSnapshot.totalSavings - currentSnapshot.totalDebt) - (previousSnapshot.totalSavings - previousSnapshot.totalDebt)
      : 0,
  }

  const trends = {
    debtTrend: determineTrend(changes.debtChange, -1), // negative is good for debt
    savingsTrend: determineTrend(changes.savingsChange, 1), // positive is good for savings
    surplusTrend: determineTrend(changes.surplusChange, 1), // positive is good for surplus
  }

  const milestones = {
    achieved: detectAchievedMilestones(currentSnapshot, previousSnapshot),
    upcoming: detectUpcomingMilestones(currentSnapshot),
  }

  return {
    currentMonth: currentSnapshot,
    previousMonth: previousSnapshot,
    changes,
    trends,
    milestones,
  }
}

/**
 * Determines trend direction
 */
function determineTrend(change: number, positiveDirection: 1 | -1): 'improving' | 'worsening' | 'stable' {
  const threshold = 0.01 // 1% threshold for stability

  if (Math.abs(change) < threshold) return 'stable'

  const isImproving = positiveDirection === 1 ? change > 0 : change < 0
  return isImproving ? 'improving' : 'worsening'
}

/**
 * Detects milestones achieved this month
 */
function detectAchievedMilestones(current: MonthlySnapshot, previous?: MonthlySnapshot): string[] {
  const milestones: string[] = []

  if (!previous) return milestones

  // Debt milestones
  if (previous.totalDebt > 0 && current.totalDebt === 0) {
    milestones.push('Became debt-free!')
  } else if (previous.totalDebt >= 10000 && current.totalDebt < 10000) {
    milestones.push('Debt dropped below £10,000')
  } else if (previous.totalDebt >= 5000 && current.totalDebt < 5000) {
    milestones.push('Debt dropped below £5,000')
  } else if (previous.totalDebt >= 1000 && current.totalDebt < 1000) {
    milestones.push('Debt dropped below £1,000')
  }

  // Savings milestones
  if (previous.totalSavings < 1000 && current.totalSavings >= 1000) {
    milestones.push('Saved your first £1,000!')
  } else if (previous.totalSavings < 5000 && current.totalSavings >= 5000) {
    milestones.push('Reached £5,000 in savings!')
  } else if (previous.totalSavings < 10000 && current.totalSavings >= 10000) {
    milestones.push('Reached £10,000 in savings!')
  }

  // Individual debt payoffs
  const paidOffDebts = previous.debts.filter(pd => {
    const currentDebt = current.debts.find(cd => cd.id === pd.id)
    return pd.balance > 0 && (!currentDebt || currentDebt.balance === 0)
  })

  paidOffDebts.forEach(debt => {
    milestones.push(`Paid off ${debt.name}!`)
  })

  // Net worth positive
  const prevNetWorth = previous.totalSavings - previous.totalDebt
  const currNetWorth = current.totalSavings - current.totalDebt

  if (prevNetWorth < 0 && currNetWorth >= 0) {
    milestones.push('Achieved positive net worth!')
  }

  return milestones
}

/**
 * Detects upcoming milestones
 */
function detectUpcomingMilestones(current: MonthlySnapshot): string[] {
  const milestones: string[] = []

  // Debt milestones
  if (current.totalDebt > 0) {
    if (current.totalDebt < 1100 && current.totalDebt >= 1000) {
      milestones.push('Close to getting debt below £1,000')
    } else if (current.totalDebt < 5500 && current.totalDebt >= 5000) {
      milestones.push('Close to getting debt below £5,000')
    } else if (current.totalDebt < 500) {
      milestones.push('Almost debt-free!')
    }
  }

  // Savings milestones
  if (current.totalSavings < 1000 && current.totalSavings >= 800) {
    milestones.push('Close to saving £1,000')
  } else if (current.totalSavings < 5000 && current.totalSavings >= 4500) {
    milestones.push('Close to £5,000 in savings')
  } else if (current.totalSavings < 10000 && current.totalSavings >= 9500) {
    milestones.push('Close to £10,000 in savings')
  }

  return milestones
}

/**
 * Generates insights and recommendations based on trends
 */
export function generateInsights(report: PerformanceReport): string[] {
  const insights: string[] = []

  // Debt insights
  if (report.trends.debtTrend === 'improving') {
    insights.push(`Great progress! Your debt decreased by ${Math.abs(report.changes.debtChangePercent).toFixed(1)}% this month.`)
  } else if (report.trends.debtTrend === 'worsening') {
    insights.push(`Your debt increased by ${Math.abs(report.changes.debtChangePercent).toFixed(1)}% this month. Review your budget to identify areas to cut back.`)
  }

  // Savings insights
  if (report.trends.savingsTrend === 'improving') {
    insights.push(`Excellent saving! Your savings grew by ${Math.abs(report.changes.savingsChangePercent).toFixed(1)}% this month.`)
  } else if (report.trends.savingsTrend === 'worsening' && report.currentMonth.totalSavings > 0) {
    insights.push(`Your savings decreased this month. Consider reviewing your budget priorities.`)
  }

  // Surplus insights
  if (report.trends.surplusTrend === 'worsening' && report.currentMonth.surplus < 0) {
    insights.push('Warning: Your expenses exceed your income. This is not sustainable long-term.')
  } else if (report.currentMonth.surplus > 500 && report.currentMonth.totalDebt > 0) {
    insights.push(`You have a £${report.currentMonth.surplus.toFixed(0)} monthly surplus. Consider allocating more to debt payoff.`)
  }

  // Net worth insight
  const netWorth = report.currentMonth.totalSavings - report.currentMonth.totalDebt
  if (netWorth > 0 && report.changes.netWorthChange > 0) {
    insights.push(`Your net worth increased by £${report.changes.netWorthChange.toFixed(0)} this month!`)
  }

  return insights
}

/**
 * Calculates month-over-month growth rate
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / Math.abs(previous)) * 100
}

/**
 * Gets the last N snapshots for trending
 */
export function getRecentSnapshots(state: FinancialState, count: number = 6): MonthlySnapshot[] {
  return state.monthlySnapshots
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count)
    .reverse()
}
