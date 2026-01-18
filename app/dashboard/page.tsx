'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useFinancial } from '@/contexts/FinancialContext'
import { evaluateFlowchart } from '@/lib/flowchartRules'
import { formatCurrency } from '@/lib/format'
import { CheckCircle2, Circle, AlertCircle, TrendingUp, Wallet, CreditCard, PiggyBank, Target, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateMinimumPayments, calculateTotalDebt, filterPayoffDebts, hasHighInterestDebt } from '@/lib/debtSimulator'
import { Debt, PayoffStrategy } from '@/lib/types'

export default function DashboardPage() {
  const { state } = useFinancial()
  const [debtStrategy, setDebtStrategy] = useState<PayoffStrategy>('avalanche')

  const flowchart = evaluateFlowchart(state)

  // Calculate key metrics
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
  const surplus = totalIncome - totalOutgoings - minimumDebtPayments
  const totalDebt = calculateTotalDebt(state.debts)

  const efMonthsCovered = essentialOutgoings > 0 ? state.savings.currentCash / essentialOutgoings : 0

  const currentStep = flowchart.allSteps.find((s) => s.id === flowchart.currentStepId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your current position on the UKPF flowchart journey
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Surplus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              surplus >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(surplus, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income minus expenses and minimums
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDebt, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {state.debts.length} debt{state.debts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Savings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(state.savings.currentCash, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Accessible emergency fund
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EF Months</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {efMonthsCovered.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {state.savings.emergencyFundMonths} months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Target Debt */}
      {filterPayoffDebts(state.debts).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Priority Target Debt
                </CardTitle>
                <CardDescription>
                  Recommended debt to focus extra payments on based on your chosen method
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={debtStrategy === 'avalanche' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDebtStrategy('avalanche')}
                >
                  Avalanche
                </Button>
                <Button
                  variant={debtStrategy === 'snowball' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDebtStrategy('snowball')}
                >
                  Snowball
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const payoffDebts = filterPayoffDebts(state.debts)
              let targetDebt: Debt | undefined

              // Use selected strategy
              if (debtStrategy === 'avalanche') {
                // Highest APR first
                const sorted = [...payoffDebts].sort((a, b) => {
                  const aRate = a.hasPromo && a.promoMonthsRemaining > 0 ? 0 : a.apr
                  const bRate = b.hasPromo && b.promoMonthsRemaining > 0 ? 0 : b.apr
                  return bRate - aRate
                })
                targetDebt = sorted[0]
              } else {
                // Snowball: Smallest balance first
                const sorted = [...payoffDebts].sort((a, b) => a.balance - b.balance)
                targetDebt = sorted[0]
              }

              if (!targetDebt) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No debts to prioritize at this time.
                  </p>
                )
              }

              return (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-accent/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{targetDebt.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {debtStrategy === 'avalanche' ? 'Highest APR' : 'Smallest Balance'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-destructive">
                          {formatCurrency(targetDebt.balance, state.currency, state.customFxRate)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {targetDebt.apr}% APR
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Minimum Payment</Label>
                        <p className="font-medium">
                          {formatCurrency(targetDebt.minimumPayment, state.currency, state.customFxRate)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Payment Mode</Label>
                        <p className="font-medium">
                          {targetDebt.paymentMode === 'fixed_term' ? 'Fixed Term' : 'Variable'}
                        </p>
                      </div>
                    </div>

                    {surplus > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground">
                          With your {formatCurrency(surplus, state.currency, state.customFxRate)} monthly surplus, you could pay an extra{' '}
                          {formatCurrency(Math.min(surplus, targetDebt.balance), state.currency, state.customFxRate)} towards this debt.
                          {(() => {
                            const extraPayment = Math.min(surplus, targetDebt.balance)
                            const monthlyPayment = targetDebt.minimumPayment + extraPayment
                            const currentBalance = targetDebt.balance
                            const apr = targetDebt.apr

                            // Calculate months to payoff with minimum payment only
                            let monthsWithMinimum = 0
                            let balanceMin = currentBalance
                            while (balanceMin > 0.01 && monthsWithMinimum < 600) {
                              const interest = (balanceMin * apr) / 100 / 12
                              const principal = targetDebt.minimumPayment - interest
                              if (principal <= 0) break // Can't pay off with minimum
                              balanceMin -= principal
                              monthsWithMinimum++
                            }

                            // Calculate months to payoff with extra payment
                            let monthsWithExtra = 0
                            let balanceExtra = currentBalance
                            while (balanceExtra > 0.01 && monthsWithExtra < 600) {
                              const interest = (balanceExtra * apr) / 100 / 12
                              const payment = Math.min(monthlyPayment, balanceExtra + interest)
                              const principal = payment - interest
                              balanceExtra -= principal
                              monthsWithExtra++
                            }

                            const monthsSaved = monthsWithMinimum - monthsWithExtra

                            if (monthsSaved > 0 && monthsWithMinimum < 600) {
                              return (
                                <> This would allow you to pay off this debt{' '}
                                  <strong>{monthsSaved} month{monthsSaved !== 1 ? 's' : ''} sooner</strong>.
                                </>
                              )
                            }
                            return null
                          })()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>
                      <strong>Strategy:</strong> {debtStrategy === 'avalanche'
                        ? 'Avalanche pays debts by highest APR first, minimizing total interest paid.'
                        : 'Snowball pays smallest debts first, providing psychological wins and motivation.'}
                    </p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Current Step */}
      {currentStep && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Current Focus: {currentStep.title}
            </CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Next Actions:</h4>
              <ul className="space-y-1">
                {flowchart.nextActions.map((action, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
            {currentStep.helpLinks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Helpful Resources:</h4>
                <div className="flex flex-wrap gap-2">
                  {currentStep.helpLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {link.text} →
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Flowchart Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Flowchart Progress</CardTitle>
          <CardDescription>
            Your journey through the UKPF financial priorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flowchart.allSteps.map((step, idx) => {
              const isCompleted = flowchart.completedStepIds.includes(step.id)
              const isCurrent = step.id === flowchart.currentStepId

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-lg border transition-colors",
                    isCurrent && "border-primary bg-primary/5",
                    isCompleted && !isCurrent && "border-green-200 bg-green-50/50"
                  )}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : isCurrent ? (
                      <AlertCircle className="h-6 w-6 text-primary" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {step.description}
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-primary font-medium mt-2">
                        ← You are here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {surplus < 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your expenses exceed your income by{' '}
            <strong>{formatCurrency(Math.abs(surplus), state.currency, state.customFxRate)}</strong>{' '}
            per month. Review your budget and consider ways to increase income or reduce
            spending.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
