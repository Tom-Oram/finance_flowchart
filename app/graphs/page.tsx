'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFinancial } from '@/contexts/FinancialContext'
import { compareStrategies, filterPayoffDebts } from '@/lib/debtSimulator'
import { formatCurrency, formatMonthYear } from '@/lib/format'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'

export default function GraphsPage() {
  const { state } = useFinancial()
  const [extraPayment, setExtraPayment] = useState(100)

  const payoffDebts = useMemo(() => filterPayoffDebts(state.debts), [state.debts])

  if (payoffDebts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Graphs</h1>
          <p className="text-muted-foreground">
            Visual comparison of debt payoff strategies
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Add some debts first to see payoff strategy graphs. Mortgages and student loans are
            excluded from this comparison.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const comparison = useMemo(
    () => compareStrategies(payoffDebts, extraPayment, new Date()),
    [payoffDebts, extraPayment]
  )

  // Prepare data for balance over time chart
  const balanceData = useMemo(() => {
    const data: { month: number; date: string; avalanche: number; snowball: number }[] = []

    const maxMonths = Math.max(
      comparison.avalanche.monthsToPayoff,
      comparison.snowball.monthsToPayoff
    )

    for (let month = 0; month <= maxMonths; month++) {
      const avalancheBalance = comparison.avalanche.schedule
        .filter(s => s.month === month)
        .reduce((sum, s) => sum + s.balance, 0)

      const snowballBalance = comparison.snowball.schedule
        .filter(s => s.month === month)
        .reduce((sum, s) => sum + s.balance, 0)

      const date = new Date()
      date.setMonth(date.getMonth() + month)

      data.push({
        month,
        date: formatMonthYear(date),
        avalanche: avalancheBalance,
        snowball: snowballBalance,
      })
    }

    return data
  }, [comparison])

  // Prepare data for cumulative interest chart
  const interestData = useMemo(() => {
    const data: { month: number; date: string; avalanche: number; snowball: number }[] = []

    const maxMonths = Math.max(
      comparison.avalanche.monthsToPayoff,
      comparison.snowball.monthsToPayoff
    )

    for (let month = 0; month <= maxMonths; month++) {
      const avalancheInterest = comparison.avalanche.schedule
        .filter(s => s.month <= month)
        .reduce((sum, s) => sum + s.interest, 0)

      const snowballInterest = comparison.snowball.schedule
        .filter(s => s.month <= month)
        .reduce((sum, s) => sum + s.interest, 0)

      const date = new Date()
      date.setMonth(date.getMonth() + month)

      data.push({
        month,
        date: formatMonthYear(date),
        avalanche: avalancheInterest,
        snowball: snowballInterest,
      })
    }

    return data
  }, [comparison])

  // Bar chart data for comparison
  const comparisonData = useMemo(() => [
    {
      name: 'Avalanche',
      interest: comparison.avalanche.totalInterest,
      months: comparison.avalanche.monthsToPayoff,
    },
    {
      name: 'Snowball',
      interest: comparison.snowball.totalInterest,
      months: comparison.snowball.monthsToPayoff,
    },
  ], [comparison])

  const maxMonths = Math.max(
    comparison.avalanche.monthsToPayoff,
    comparison.snowball.monthsToPayoff
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Graphs</h1>
        <p className="text-muted-foreground">
          Visual comparison of debt payoff strategies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extra Payment Amount</CardTitle>
          <CardDescription>
            Adjust to see how different extra payment amounts affect your payoff
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Monthly Extra Payment</Label>
              <span className="font-medium">
                {formatCurrency(extraPayment, state.currency, state.customFxRate)}
              </span>
            </div>
            <Input
              type="range"
              min="0"
              max="2000"
              step="10"
              value={extraPayment}
              onChange={(e) => setExtraPayment(parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Remaining Debt Balance Over Time
          </CardTitle>
          <CardDescription>
            How your total debt decreases with each strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={Math.floor(maxMonths / 10) || 1}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  formatCurrency(value, state.currency, state.customFxRate)
                }
              />
              <Tooltip
                formatter={(value: number) =>
                  formatCurrency(value, state.currency, state.customFxRate)
                }
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avalanche"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Avalanche"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="snowball"
                stroke="#a855f7"
                strokeWidth={2}
                name="Snowball"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cumulative Interest Paid Over Time</CardTitle>
          <CardDescription>
            Total interest accumulated with each strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={interestData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={Math.floor(maxMonths / 10) || 1}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  formatCurrency(value, state.currency, state.customFxRate)
                }
              />
              <Tooltip
                formatter={(value: number) =>
                  formatCurrency(value, state.currency, state.customFxRate)
                }
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avalanche"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Avalanche"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="snowball"
                stroke="#a855f7"
                strokeWidth={2}
                name="Snowball"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Interest Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) =>
                    formatCurrency(value, state.currency, state.customFxRate)
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    formatCurrency(value, state.currency, state.customFxRate)
                  }
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="interest" fill="#3b82f6" name="Total Interest" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Months to Payoff Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="months" fill="#a855f7" name="Months to Payoff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-green-700">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Avalanche Method</h4>
              <ul className="text-sm space-y-1">
                <li>
                  Total Interest:{' '}
                  <strong>
                    {formatCurrency(comparison.avalanche.totalInterest, state.currency, state.customFxRate)}
                  </strong>
                </li>
                <li>
                  Months to payoff: <strong>{comparison.avalanche.monthsToPayoff}</strong>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Snowball Method</h4>
              <ul className="text-sm space-y-1">
                <li>
                  Total Interest:{' '}
                  <strong>
                    {formatCurrency(comparison.snowball.totalInterest, state.currency, state.customFxRate)}
                  </strong>
                </li>
                <li>
                  Months to payoff: <strong>{comparison.snowball.monthsToPayoff}</strong>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-lg font-semibold text-green-700">
              Using Avalanche saves you{' '}
              {formatCurrency(Math.abs(comparison.interestSaved), state.currency, state.customFxRate)}{' '}
              in interest
              {comparison.monthsSaved !== 0 && (
                <> and gets you debt-free {Math.abs(comparison.monthsSaved)} months {comparison.monthsSaved > 0 ? 'faster' : 'slower'}</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
