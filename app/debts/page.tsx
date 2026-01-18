'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinancial } from '@/contexts/FinancialContext'
import { Debt, DebtType, DebtPaymentMode } from '@/lib/types'
import { formatCurrency, formatMonths, formatDate } from '@/lib/format'
import { compareStrategies, filterPayoffDebts } from '@/lib/debtSimulator'
import { Plus, Trash2, AlertTriangle, TrendingDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  credit_card: 'Credit Card',
  loan: 'Loan',
  overdraft: 'Overdraft',
  bnpl: 'Buy Now Pay Later',
  mortgage: 'Mortgage',
  student_loan: 'Student Loan',
  other: 'Other',
}

export default function DebtsPage() {
  const { state, addDebt, updateDebt, removeDebt } = useFinancial()

  const [extraPayment, setExtraPayment] = useState(100)
  const [showAddForm, setShowAddForm] = useState(false)

  // New debt form state
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({
    name: '',
    type: 'credit_card',
    balance: 0,
    apr: 0,
    paymentMode: 'minimum_payment',
    minimumPayment: 0,
    hasPromo: false,
    promoMonthsRemaining: 0,
    postPromoApr: 0,
    notes: '',
  })

  // Calculate comparison
  const payoffDebts = filterPayoffDebts(state.debts)
  const comparison = payoffDebts.length > 0
    ? compareStrategies(payoffDebts, extraPayment, new Date())
    : null

  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.balance) return

    // For fixed-term loans, validate required fields
    if (newDebt.paymentMode === 'fixed_term') {
      if (!newDebt.fixedTermMonths) return
      // totalRepayable is optional - we can calculate from APR if not provided
      if (!newDebt.totalRepayable && (!newDebt.apr || newDebt.apr <= 0)) return
    } else {
      // For minimum payment mode, require minimum payment
      if (!newDebt.minimumPayment) return
    }

    const debt: Debt = {
      id: Date.now().toString(),
      name: newDebt.name,
      type: newDebt.type as DebtType,
      balance: newDebt.balance,
      apr: newDebt.apr || 0,
      paymentMode: newDebt.paymentMode || 'minimum_payment',
      minimumPayment: newDebt.minimumPayment || 0,
      fixedTermMonths: newDebt.fixedTermMonths,
      totalRepayable: newDebt.totalRepayable,
      hasPromo: newDebt.hasPromo || false,
      promoMonthsRemaining: newDebt.promoMonthsRemaining || 0,
      postPromoApr: newDebt.postPromoApr || newDebt.apr || 0,
      notes: newDebt.notes,
    }

    addDebt(debt)
    setNewDebt({
      name: '',
      type: 'credit_card',
      balance: 0,
      apr: 0,
      paymentMode: 'minimum_payment',
      minimumPayment: 0,
      hasPromo: false,
      promoMonthsRemaining: 0,
      postPromoApr: 0,
      notes: '',
    })
    setShowAddForm(false)
  }

  const excludedDebts = state.debts.filter(d => d.type === 'mortgage' || d.type === 'student_loan')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Debts</h1>
        <p className="text-muted-foreground">
          Manage your debts and compare payoff strategies
        </p>
      </div>

      {excludedDebts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Mortgages and Student Loans</AlertTitle>
          <AlertDescription>
            You have {excludedDebts.length} mortgage/student loan debt(s) that are excluded from payoff
            comparison by default. These typically have special considerations and are addressed
            later in the flowchart.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Debt List</TabsTrigger>
          <TabsTrigger value="comparison" disabled={payoffDebts.length === 0}>
            Payoff Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Existing debts */}
          {state.debts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No debts added yet</p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Debt
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {state.debts.map((debt) => (
                  <Card key={debt.id} className={cn(
                    (debt.type === 'mortgage' || debt.type === 'student_loan') && 'border-muted'
                  )}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{debt.name}</CardTitle>
                          <CardDescription>{DEBT_TYPE_LABELS[debt.type]}</CardDescription>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeDebt(debt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Payment Mode Selector - Only for loans */}
                        {debt.type === 'loan' && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Payment Mode</Label>
                            <Select
                              value={debt.paymentMode || 'minimum_payment'}
                              onValueChange={(value) => updateDebt(debt.id, { paymentMode: value as DebtPaymentMode })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minimum_payment">Minimum Payment (Variable)</SelectItem>
                                <SelectItem value="fixed_term">Fixed Term Loan</SelectItem>
                              </SelectContent>
                            </Select>
                            {debt.paymentMode === 'fixed_term' && (
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  Fixed-term loans have predetermined monthly payments over a set period.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}

                        {debt.type === 'loan' && debt.paymentMode === 'fixed_term' ? (
                          <>
                            {/* Fixed Term Mode Fields */}
                            <div className="space-y-2">
                              <Label>Current Outstanding Amount</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={debt.balance}
                                onChange={(e) => updateDebt(debt.id, { balance: parseFloat(e.target.value) || 0 })}
                              />
                              <p className="text-xs text-muted-foreground">
                                The amount you currently owe
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Total Repayable (Optional)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={debt.totalRepayable || ''}
                                onChange={(e) => updateDebt(debt.id, { totalRepayable: parseFloat(e.target.value) || undefined })}
                                placeholder="Leave blank to calculate from current balance + APR"
                              />
                              <p className="text-xs text-muted-foreground">
                                Total amount from lender (includes all interest)
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>APR (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={debt.apr}
                                onChange={(e) => updateDebt(debt.id, { apr: parseFloat(e.target.value) || 0 })}
                              />
                              <p className="text-xs text-muted-foreground">
                                {debt.totalRepayable ? 'For reference/comparison' : 'Used to calculate monthly payment'}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Term (Months)</Label>
                              <Input
                                type="number"
                                min="1"
                                value={debt.fixedTermMonths || ''}
                                onChange={(e) => updateDebt(debt.id, { fixedTermMonths: parseInt(e.target.value) || undefined })}
                              />
                            </div>
                            {/* Calculated Monthly Payment Display */}
                            {debt.fixedTermMonths && (debt.totalRepayable || (debt.balance && debt.apr > 0)) && (
                              <div className="md:col-span-2 p-3 bg-accent/50 rounded-md">
                                <Label className="text-sm">Calculated Monthly Payment</Label>
                                <p className="text-lg font-semibold">
                                  {debt.totalRepayable
                                    ? formatCurrency(debt.totalRepayable / debt.fixedTermMonths, state.currency, state.customFxRate)
                                    : (() => {
                                        const monthlyRate = debt.apr / 100 / 12
                                        const n = debt.fixedTermMonths
                                        const pv = debt.balance
                                        const payment = (monthlyRate * pv) / (1 - Math.pow(1 + monthlyRate, -n))
                                        return formatCurrency(payment, state.currency, state.customFxRate)
                                      })()
                                  }
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {debt.totalRepayable
                                    ? 'Interest already included in total repayable'
                                    : 'Calculated using standard loan formula with interest'
                                  }
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Minimum Payment Mode Fields */}
                            <div className="space-y-2">
                              <Label>Current Balance</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={debt.balance}
                                onChange={(e) => updateDebt(debt.id, { balance: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>APR (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={debt.apr}
                                onChange={(e) => updateDebt(debt.id, { apr: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Minimum Payment</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={debt.minimumPayment}
                                onChange={(e) => updateDebt(debt.id, { minimumPayment: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Interest-Free Promo?</Label>
                                <Switch
                                  checked={debt.hasPromo}
                                  onCheckedChange={(checked) => updateDebt(debt.id, { hasPromo: checked })}
                                />
                              </div>
                            </div>
                            {debt.hasPromo && (
                              <>
                                <div className="space-y-2">
                                  <Label>Promo Months Remaining</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={debt.promoMonthsRemaining}
                                    onChange={(e) => updateDebt(debt.id, { promoMonthsRemaining: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Post-Promo APR (%)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={debt.postPromoApr || debt.apr}
                                    onChange={(e) => updateDebt(debt.id, { postPromoApr: parseFloat(e.target.value) || 0 })}
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      {debt.notes && (
                        <div className="mt-4">
                          <Label>Notes</Label>
                          <p className="text-sm text-muted-foreground">{debt.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another Debt
              </Button>
            </>
          )}

          {/* Add debt form */}
          {showAddForm && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Add New Debt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Barclaycard"
                      value={newDebt.name}
                      onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newDebt.type}
                      onValueChange={(value) => setNewDebt({ ...newDebt, type: value as DebtType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DEBT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Mode Selector - Only for loans */}
                  {newDebt.type === 'loan' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Payment Mode</Label>
                      <Select
                        value={newDebt.paymentMode || 'minimum_payment'}
                        onValueChange={(value) => setNewDebt({ ...newDebt, paymentMode: value as DebtPaymentMode })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimum_payment">Minimum Payment (Variable)</SelectItem>
                          <SelectItem value="fixed_term">Fixed Term Loan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newDebt.type === 'loan' && newDebt.paymentMode === 'fixed_term' ? (
                    <>
                      {/* Fixed Term Mode Fields */}
                      <div className="space-y-2">
                        <Label>Current Outstanding Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newDebt.balance}
                          onChange={(e) => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">
                          The amount you currently owe
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Total Repayable (Optional)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newDebt.totalRepayable || ''}
                          onChange={(e) => setNewDebt({ ...newDebt, totalRepayable: parseFloat(e.target.value) || undefined })}
                          placeholder="Leave blank to calculate from current balance + APR"
                        />
                        <p className="text-xs text-muted-foreground">
                          Total amount from lender (includes all interest)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>APR (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={newDebt.apr}
                          onChange={(e) => setNewDebt({ ...newDebt, apr: parseFloat(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-muted-foreground">
                          {newDebt.totalRepayable ? 'For reference/comparison' : 'Used to calculate monthly payment'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Term (Months)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newDebt.fixedTermMonths || ''}
                          onChange={(e) => setNewDebt({ ...newDebt, fixedTermMonths: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                      {/* Calculated Monthly Payment Display */}
                      {newDebt.fixedTermMonths && (newDebt.totalRepayable || (newDebt.balance && newDebt.apr && newDebt.apr > 0)) && (
                        <div className="md:col-span-2 p-3 bg-accent/50 rounded-md">
                          <Label className="text-sm">Calculated Monthly Payment</Label>
                          <p className="text-lg font-semibold">
                            {newDebt.totalRepayable
                              ? formatCurrency(newDebt.totalRepayable / newDebt.fixedTermMonths, state.currency, state.customFxRate)
                              : (() => {
                                  const monthlyRate = (newDebt.apr || 0) / 100 / 12
                                  const n = newDebt.fixedTermMonths
                                  const pv = newDebt.balance || 0
                                  const payment = (monthlyRate * pv) / (1 - Math.pow(1 + monthlyRate, -n))
                                  return formatCurrency(payment, state.currency, state.customFxRate)
                                })()
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {newDebt.totalRepayable
                              ? 'Interest already included in total repayable'
                              : 'Calculated using standard loan formula with interest'
                            }
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Minimum Payment Mode Fields */}
                      <div className="space-y-2">
                        <Label>Current Balance</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newDebt.balance}
                          onChange={(e) => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>APR (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={newDebt.apr}
                          onChange={(e) => setNewDebt({ ...newDebt, apr: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Monthly Payment</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newDebt.minimumPayment}
                          onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pt-8">
                          <Label>Interest-Free Promo?</Label>
                          <Switch
                            checked={newDebt.hasPromo}
                            onCheckedChange={(checked) => setNewDebt({ ...newDebt, hasPromo: checked })}
                          />
                        </div>
                      </div>
                      {newDebt.hasPromo && (
                        <>
                          <div className="space-y-2">
                            <Label>Promo Months Remaining</Label>
                            <Input
                              type="number"
                              min="0"
                              value={newDebt.promoMonthsRemaining}
                              onChange={(e) => setNewDebt({ ...newDebt, promoMonthsRemaining: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Post-Promo APR (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={newDebt.postPromoApr}
                              onChange={(e) => setNewDebt({ ...newDebt, postPromoApr: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddDebt}>Add Debt</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {comparison && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Extra Payment Amount</CardTitle>
                  <CardDescription>
                    How much extra can you pay towards debt each month?
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
                    <Input
                      type="number"
                      min="0"
                      step="10"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(parseInt(e.target.value) || 0)}
                      className="w-40"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-700">Avalanche Method</CardTitle>
                    <CardDescription>Highest APR first (minimizes interest)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Time to debt-free:</span>
                      <span className="font-semibold">{formatMonths(comparison.avalanche.monthsToPayoff)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Payoff date:</span>
                      <span className="font-semibold">{formatDate(comparison.avalanche.payoffDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total interest:</span>
                      <span className="font-semibold text-blue-700">
                        {formatCurrency(comparison.avalanche.totalInterest, state.currency, state.customFxRate)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-700">Snowball Method</CardTitle>
                    <CardDescription>Smallest balance first (quick wins)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Time to debt-free:</span>
                      <span className="font-semibold">{formatMonths(comparison.snowball.monthsToPayoff)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Payoff date:</span>
                      <span className="font-semibold">{formatDate(comparison.snowball.payoffDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total interest:</span>
                      <span className="font-semibold text-purple-700">
                        {formatCurrency(comparison.snowball.totalInterest, state.currency, state.customFxRate)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="text-green-700">Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Avalanche saves you:</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(Math.abs(comparison.interestSaved), state.currency, state.customFxRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time difference:</span>
                    <span className="font-semibold">
                      {formatMonths(Math.abs(comparison.monthsSaved))}
                      {comparison.monthsSaved > 0 ? ' faster' : comparison.monthsSaved < 0 ? ' slower' : ' same'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Avalanche typically saves more money but Snowball can provide psychological wins.
                    Choose the method that keeps you motivated.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
