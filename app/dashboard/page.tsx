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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your current position on the UKPF flowchart journey
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Surplus</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              surplus >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {formatCurrency(surplus, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Income minus expenses and minimums
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debt</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCurrency(totalDebt, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {state.debts.length} debt{state.debts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Savings</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight">
              {formatCurrency(state.savings.currentCash, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Accessible emergency fund
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">EF Months</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <PiggyBank className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight">
              {efMonthsCovered.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
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
                  <Target className="h-5 w-5 text-primary" />
                  Priority Target Debt
                </CardTitle>
                <CardDescription className="mt-1">
                  Recommended debt to focus extra payments on
                </CardDescription>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant={debtStrategy === 'avalanche' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDebtStrategy('avalanche')}
                  className={debtStrategy !== 'avalanche' ? 'border-border/60' : ''}
                >
                  Avalanche
                </Button>
                <Button
                  variant={debtStrategy === 'snowball' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDebtStrategy('snowball')}
                  className={debtStrategy !== 'snowball' ? 'border-border/60' : ''}
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

              if (debtStrategy === 'avalanche') {
                const sorted = [...payoffDebts].sort((a, b) => {
                  const aRate = a.hasPromo && a.promoMonthsRemaining > 0 ? 0 : a.apr
                  const bRate = b.hasPromo && b.promoMonthsRemaining > 0 ? 0 : b.apr
                  return bRate - aRate
                })
                targetDebt = sorted[0]
              } else {
                const sorted = [...payoffDebts].sort((a, b) => a.balance - b.balance)
                targetDebt = sorted[0]
              }

              if (!targetDebt) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No debts to prioritise at this time.
                  </p>
                )
              }

              return (
                <div className="space-y-4">
                  <div className="p-5 border border-border/60 rounded-xl bg-accent/30">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{targetDebt.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {debtStrategy === 'avalanche' ? 'Highest APR' : 'Smallest Balance'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold tabular-nums text-red-400">
                          {formatCurrency(targetDebt.balance, state.currency, state.customFxRate)}
                        </div>
                        <div className="text-sm text-muted-foreground tabular-nums">
                          {targetDebt.apr}% APR
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Minimum Payment</Label>
                        <p className="font-medium tabular-nums">
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
                      <div className="mt-4 pt-4 border-t border-border/60">
                        <p className="text-sm text-muted-foreground">
                          With your <span className="text-emerald-400 font-medium tabular-nums">{formatCurrency(surplus, state.currency, state.customFxRate)}</span> monthly surplus, you could pay an extra{' '}
                          <span className="font-medium tabular-nums">{formatCurrency(Math.min(surplus, targetDebt.balance), state.currency, state.customFxRate)}</span> towards this debt.
                          {(() => {
                            const extraPayment = Math.min(surplus, targetDebt.balance)
                            const monthlyPayment = targetDebt.minimumPayment + extraPayment
                            const currentBalance = targetDebt.balance
                            const apr = targetDebt.apr

                            let monthsWithMinimum = 0
                            let balanceMin = currentBalance
                            while (balanceMin > 0.01 && monthsWithMinimum < 600) {
                              const interest = (balanceMin * apr) / 100 / 12
                              const principal = targetDebt.minimumPayment - interest
                              if (principal <= 0) break
                              balanceMin -= principal
                              monthsWithMinimum++
                            }

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
                                  <strong className="text-foreground">{monthsSaved} month{monthsSaved !== 1 ? 's' : ''} sooner</strong>.
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
                      <strong className="text-foreground/80">Strategy:</strong> {debtStrategy === 'avalanche'
                        ? 'Avalanche pays debts by highest APR first, minimising total interest paid.'
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
        <Card className="border-primary/40 glow-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              Current Focus: {currentStep.title}
            </CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-sm">Next Actions:</h4>
              <ul className="space-y-1.5">
                {flowchart.nextActions.map((action, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary">&#8226;</span>
                    <span className="text-muted-foreground">{action}</span>
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
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      {link.text} &rarr;
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
          <div className="space-y-3">
            {flowchart.allSteps.map((step, idx) => {
              const isCompleted = flowchart.completedStepIds.includes(step.id)
              const isCurrent = step.id === flowchart.currentStepId

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border transition-all duration-200",
                    isCurrent && "border-primary/40 bg-primary/5 glow-primary",
                    isCompleted && !isCurrent && "border-emerald-500/20 bg-emerald-500/5",
                    !isCompleted && !isCurrent && "border-border/40"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    ) : isCurrent ? (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <Circle className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {step.description}
                    </div>
                    {isCurrent && (
                      <div className="text-xs text-primary font-medium mt-2">
                        You are here
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
            <strong className="tabular-nums">{formatCurrency(Math.abs(surplus), state.currency, state.customFxRate)}</strong>{' '}
            per month. Review your budget and consider ways to increase income or reduce
            spending.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
