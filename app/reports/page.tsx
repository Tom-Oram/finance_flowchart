'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFinancial } from '@/contexts/FinancialContext'
import { generatePerformanceReport, generateInsights, getRecentSnapshots, createMonthlySnapshot } from '@/lib/performanceTracking'
import { formatCurrency, formatDate } from '@/lib/format'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Award, Target, AlertCircle, Download, RefreshCw, Trash2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function ReportsPage() {
  const { state, manualSnapshot, deleteSnapshot } = useFinancial()
  const [customDate, setCustomDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Create current snapshot from live data
  const currentSnapshot = createMonthlySnapshot(state)

  const snapshots = getRecentSnapshots(state, 12)
  const latestSavedSnapshot = snapshots[snapshots.length - 1]

  // Compare current state to latest saved snapshot
  const report = generatePerformanceReport(currentSnapshot, latestSavedSnapshot)
  const insights = generateInsights(report)

  // Prepare chart data
  const trendData = snapshots.map(s => ({
    date: new Date(s.date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
    debt: s.totalDebt,
    savings: s.totalSavings,
    netWorth: s.totalSavings - s.totalDebt,
    surplus: s.surplus,
  }))

  if (!report) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground">
            Track your financial progress month-over-month
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No snapshots have been created yet. Snapshots are automatically created when you make significant changes to your finances.
            <div className="mt-4">
              <Button onClick={() => manualSnapshot()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Create First Snapshot
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const TrendIcon = ({ trend }: { trend: 'improving' | 'worsening' | 'stable' }) => {
    if (trend === 'improving') return <TrendingUp className="h-5 w-5 text-green-600" />
    if (trend === 'worsening') return <TrendingDown className="h-5 w-5 text-red-600" />
    return <Minus className="h-5 w-5 text-gray-400" />
  }

  const handleCreateSnapshot = () => {
    if (customDate) {
      const date = new Date(customDate)
      manualSnapshot(date)
      setCustomDate('')
      setShowDatePicker(false)
    } else {
      manualSnapshot()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground">
            Track your financial progress month-over-month
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="Create snapshot with custom date"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => manualSnapshot()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Create Snapshot
          </Button>
        </div>
      </div>

      {/* Custom Date Picker */}
      {showDatePicker && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Snapshot with Custom Date</CardTitle>
            <CardDescription>For testing purposes, you can create a snapshot with a specific date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="customDate">Date</Label>
                <Input
                  id="customDate"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateSnapshot}>
                <Calendar className="h-4 w-4 mr-2" />
                Create with Date
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      {report && report.milestones.achieved.length > 0 && (
        <Card className="border-green-800/50 bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Award className="h-5 w-5" />
              Milestones Achieved!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.milestones.achieved.map((milestone, idx) => (
                <li key={idx} className="flex items-center gap-2 text-green-300">
                  <Award className="h-4 w-4" />
                  <span className="font-medium">{milestone}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Month-over-Month Comparison */}
      {report && latestSavedSnapshot && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <TrendIcon trend={report.trends.debtTrend} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.currentMonth.totalDebt, state.currency, state.customFxRate)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "font-medium",
                  report.changes.debtChange < 0 ? "text-green-600" : report.changes.debtChange > 0 ? "text-red-600" : "text-gray-500"
                )}>
                  {report.changes.debtChange < 0 ? '↓' : report.changes.debtChange > 0 ? '↑' : '→'}
                  {' '}
                  {formatCurrency(Math.abs(report.changes.debtChange), state.currency, state.customFxRate)}
                  {' '}
                  ({Math.abs(report.changes.debtChangePercent).toFixed(1)}%)
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <TrendIcon trend={report.trends.savingsTrend} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(report.currentMonth.totalSavings, state.currency, state.customFxRate)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "font-medium",
                  report.changes.savingsChange > 0 ? "text-green-600" : report.changes.savingsChange < 0 ? "text-red-600" : "text-gray-500"
                )}>
                  {report.changes.savingsChange > 0 ? '↑' : report.changes.savingsChange < 0 ? '↓' : '→'}
                  {' '}
                  {formatCurrency(Math.abs(report.changes.savingsChange), state.currency, state.customFxRate)}
                  {' '}
                  ({Math.abs(report.changes.savingsChangePercent).toFixed(1)}%)
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <TrendIcon trend={report.changes.netWorthChange > 0 ? 'improving' : report.changes.netWorthChange < 0 ? 'worsening' : 'stable'} />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                (report.currentMonth.totalSavings - report.currentMonth.totalDebt) >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(report.currentMonth.totalSavings - report.currentMonth.totalDebt, state.currency, state.customFxRate)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={cn(
                  "font-medium",
                  report.changes.netWorthChange > 0 ? "text-green-600" : report.changes.netWorthChange < 0 ? "text-red-600" : "text-gray-500"
                )}>
                  {report.changes.netWorthChange > 0 ? '↑' : report.changes.netWorthChange < 0 ? '↓' : '→'}
                  {' '}
                  {formatCurrency(Math.abs(report.changes.netWorthChange), state.currency, state.customFxRate)}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Trend Charts */}
      {trendData.length > 1 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Debt & Savings Trend</CardTitle>
              <CardDescription>Track how your debt and savings change over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value, state.currency, state.customFxRate)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, state.currency, state.customFxRate)} />
                  <Legend />
                  <Line type="monotone" dataKey="debt" stroke="#ef4444" strokeWidth={2} name="Total Debt" />
                  <Line type="monotone" dataKey="savings" stroke="#22c55e" strokeWidth={2} name="Total Savings" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Net Worth Trend</CardTitle>
              <CardDescription>Your net worth over time (Savings - Debt)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value, state.currency, state.customFxRate)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, state.currency, state.customFxRate)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Net Worth"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Surplus Trend</CardTitle>
              <CardDescription>Income minus expenses and minimum debt payments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(value, state.currency, state.customFxRate)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value, state.currency, state.customFxRate)} />
                  <Legend />
                  <Bar dataKey="surplus" fill="#8b5cf6" name="Monthly Surplus" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Upcoming Milestones */}
      {report && report.milestones.upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Upcoming Milestones
            </CardTitle>
            <CardDescription>You're close to achieving these goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.milestones.upcoming.map((milestone, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>{milestone}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Snapshot History */}
      <Card>
        <CardHeader>
          <CardTitle>Snapshot History</CardTitle>
          <CardDescription>{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} recorded (limit: 1 per day)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {snapshots.slice().reverse().map((snapshot) => (
              <div key={snapshot.id} className="flex justify-between items-center p-3 border rounded hover:bg-accent/50 transition-colors">
                <div>
                  <div className="font-medium">{formatDate(new Date(snapshot.date))}</div>
                  <div className="text-sm text-muted-foreground">
                    {snapshot.debts.length} debt{snapshot.debts.length !== 1 ? 's' : ''} tracked
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm">
                      Debt: <span className="font-medium">{formatCurrency(snapshot.totalDebt, state.currency, state.customFxRate)}</span>
                    </div>
                    <div className="text-sm">
                      Savings: <span className="font-medium">{formatCurrency(snapshot.totalSavings, state.currency, state.customFxRate)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSnapshot(snapshot.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete snapshot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Snapshots are limited to one per day and are automatically created when you make significant changes to your finances. You can also create manual snapshots using the button above, or use the calendar icon to create a snapshot with a custom date for testing purposes.
        </AlertDescription>
      </Alert>
    </div>
  )
}
