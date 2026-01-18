'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useFinancial } from '@/contexts/FinancialContext'
import { formatCurrency } from '@/lib/format'
import { Plus, Trash2, TrendingUp, TrendingDown, AlertCircle, Calculator } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTaxBreakdown, calculateNetFromGross } from '@/lib/taxCalculator'
import { TaxSystem, StudentLoanPlan } from '@/lib/types'

export default function BudgetPage() {
  const { state, updateIncome, updateOutgoings, updateSavings, updateSettings, updateTaxConfig } = useFinancial()

  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [newItemIsEssential, setNewItemIsEssential] = useState(true)

  const [newAnnualName, setNewAnnualName] = useState('')
  const [newAnnualAmount, setNewAnnualAmount] = useState('')

  // Calculate totals
  const totalIncome = state.income.primaryNet + state.income.secondaryNet + state.income.other
  const essentialOutgoings = state.outgoings.items
    .filter((i) => i.isEssential)
    .reduce((sum, i) => sum + i.amount, 0)
  const discretionaryOutgoings = state.outgoings.items
    .filter((i) => !i.isEssential)
    .reduce((sum, i) => sum + i.amount, 0)
  const annualCostsMonthly = state.outgoings.annualCosts.reduce((sum, i) => sum + i.amount, 0) / 12
  const totalOutgoings = essentialOutgoings + discretionaryOutgoings + annualCostsMonthly

  const addItem = () => {
    const amount = parseFloat(newItemAmount)
    if (!newItemName || isNaN(amount) || amount < 0) return

    const newItem = {
      id: Date.now().toString(),
      name: newItemName,
      amount,
      isEssential: newItemIsEssential,
    }

    updateOutgoings({
      items: [...state.outgoings.items, newItem],
    })

    setNewItemName('')
    setNewItemAmount('')
  }

  const removeItem = (id: string) => {
    updateOutgoings({
      items: state.outgoings.items.filter((i) => i.id !== id),
    })
  }

  const updateItem = (id: string, field: string, value: any) => {
    updateOutgoings({
      items: state.outgoings.items.map((i) =>
        i.id === id ? { ...i, [field]: value } : i
      ),
    })
  }

  const addAnnualCost = () => {
    const amount = parseFloat(newAnnualAmount)
    if (!newAnnualName || isNaN(amount) || amount < 0) return

    const newItem = {
      id: Date.now().toString(),
      name: newAnnualName,
      amount,
      isEssential: true,
    }

    updateOutgoings({
      annualCosts: [...state.outgoings.annualCosts, newItem],
    })

    setNewAnnualName('')
    setNewAnnualAmount('')
  }

  const removeAnnualCost = (id: string) => {
    updateOutgoings({
      annualCosts: state.outgoings.annualCosts.filter((i) => i.id !== id),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
        <p className="text-muted-foreground">
          Manage your income, expenses, and savings
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Total Outgoings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOutgoings, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground">per month (incl. annual)</p>
          </CardContent>
        </Card>

        <Card className={totalIncome - totalOutgoings >= 0 ? 'border-green-200' : 'border-red-200'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalIncome - totalOutgoings >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalIncome - totalOutgoings, state.currency, state.customFxRate)}
            </div>
            <p className="text-xs text-muted-foreground">before debt payments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="outgoings">Outgoings</TabsTrigger>
          <TabsTrigger value="annual">Annual Costs</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="pension">Pension</TabsTrigger>
          <TabsTrigger value="situation">Situation</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income</CardTitle>
              <CardDescription>
                {state.taxConfig.enabled
                  ? 'Enter your gross annual income - net will be calculated automatically'
                  : 'Enter your monthly net (take-home) income'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/50">
                <div className="space-y-0.5">
                  <Label htmlFor="taxMode">Use Gross Income & Auto-Calculate Tax</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable to enter gross salary and automatically calculate net income
                  </p>
                </div>
                <Switch
                  id="taxMode"
                  checked={state.taxConfig.enabled}
                  onCheckedChange={(checked) => updateTaxConfig({ enabled: checked })}
                />
              </div>

              {!state.taxConfig.enabled ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="primaryNet">Primary Monthly Net Income</Label>
                    <Input
                      id="primaryNet"
                      type="number"
                      min="0"
                      step="0.01"
                      value={state.income.primaryNet}
                      onChange={(e) => updateIncome({ primaryNet: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Your monthly take-home pay after tax</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryNet">Secondary Monthly Net Income (optional)</Label>
                    <Input
                      id="secondaryNet"
                      type="number"
                      min="0"
                      step="0.01"
                      value={state.income.secondaryNet}
                      onChange={(e) => updateIncome({ secondaryNet: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other">Other Monthly Income (optional)</Label>
                    <Input
                      id="other"
                      type="number"
                      min="0"
                      step="0.01"
                      value={state.income.other}
                      onChange={(e) => updateIncome({ other: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="primaryGross">Primary Annual Gross Income</Label>
                    <Input
                      id="primaryGross"
                      type="number"
                      min="0"
                      step="0.01"
                      value={state.income.primaryGross || 0}
                      onChange={(e) => {
                        const grossAnnual = parseFloat(e.target.value) || 0
                        const netAnnual = calculateNetFromGross(grossAnnual, state.taxConfig)
                        const netMonthly = netAnnual / 12
                        updateIncome({
                          primaryGross: grossAnnual,
                          primaryNet: Math.round(netMonthly * 100) / 100
                        })
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Your annual salary before tax and deductions</p>
                  </div>

                  {state.income.primaryGross && state.income.primaryGross > 0 && (
                    <div className="p-4 border rounded-lg bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="h-4 w-4" />
                        <h4 className="font-semibold">Tax Calculation</h4>
                      </div>
                      {(() => {
                        const breakdown = getTaxBreakdown(state.income.primaryGross, state.taxConfig)
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Annual Gross:</span>
                              <span className="font-medium">{formatCurrency(breakdown.grossAnnual, state.currency, state.customFxRate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Income Tax:</span>
                              <span className="text-red-600">-{formatCurrency(breakdown.incomeTax, state.currency, state.customFxRate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">National Insurance:</span>
                              <span className="text-red-600">-{formatCurrency(breakdown.nationalInsurance, state.currency, state.customFxRate)}</span>
                            </div>
                            {breakdown.studentLoan > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Student Loan:</span>
                                <span className="text-red-600">-{formatCurrency(breakdown.studentLoan, state.currency, state.customFxRate)}</span>
                              </div>
                            )}
                            <div className="pt-2 border-t flex justify-between font-semibold">
                              <span>Net Monthly:</span>
                              <span className="text-green-600">{formatCurrency(breakdown.netMonthly, state.currency, state.customFxRate)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Effective tax rate: {breakdown.effectiveTaxRate.toFixed(1)}%
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="secondaryGross">Secondary Annual Gross Income (optional)</Label>
                    <Input
                      id="secondaryGross"
                      type="number"
                      min="0"
                      step="0.01"
                      value={state.income.secondaryGross || 0}
                      onChange={(e) => {
                        const grossAnnual = parseFloat(e.target.value) || 0
                        const netAnnual = calculateNetFromGross(grossAnnual, state.taxConfig)
                        const netMonthly = netAnnual / 12
                        updateIncome({
                          secondaryGross: grossAnnual,
                          secondaryNet: Math.round(netMonthly * 100) / 100
                        })
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="other">Other Monthly Income (optional)</Label>
                    <Input
                      id="other"
                      type="number"
                      min="0"
                      step="0.01"
                      value={state.income.other}
                      onChange={(e) => updateIncome({ other: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Already taxed income (e.g., benefits, rental income net of tax)</p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure your tax settings in the Tax tab to ensure accurate calculations. Go to Tax Settings to set your tax code, region, and student loan plan.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outgoings">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Outgoings</CardTitle>
              <CardDescription>List your regular monthly expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing items */}
              <div className="space-y-2">
                {state.outgoings.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isEssential}
                        onCheckedChange={(checked) => updateItem(item.id, 'isEssential', checked)}
                      />
                      <Label className="text-xs whitespace-nowrap">
                        {item.isEssential ? 'Essential' : 'Discretionary'}
                      </Label>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new item */}
              <div className="flex items-end gap-2 pt-4 border-t">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="newItemName">Name</Label>
                  <Input
                    id="newItemName"
                    placeholder="e.g., Rent"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label htmlFor="newItemAmount">Amount</Label>
                  <Input
                    id="newItemAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newItemIsEssential}
                    onCheckedChange={setNewItemIsEssential}
                  />
                  <Label className="text-xs">Essential</Label>
                </div>
                <Button onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annual">
          <Card>
            <CardHeader>
              <CardTitle>Annual Costs</CardTitle>
              <CardDescription>One-off yearly expenses (amortized monthly)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing annual costs */}
              <div className="space-y-2">
                {state.outgoings.annualCosts.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{item.name}</span>
                    <span className="text-sm text-muted-foreground w-32">
                      {formatCurrency(item.amount, state.currency, state.customFxRate)}/year
                    </span>
                    <span className="text-sm font-medium w-32">
                      {formatCurrency(item.amount / 12, state.currency, state.customFxRate)}/mo
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeAnnualCost(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new annual cost */}
              <div className="flex items-end gap-2 pt-4 border-t">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="newAnnualName">Name</Label>
                  <Input
                    id="newAnnualName"
                    placeholder="e.g., Car Insurance"
                    value={newAnnualName}
                    onChange={(e) => setNewAnnualName(e.target.value)}
                  />
                </div>
                <div className="w-40 space-y-2">
                  <Label htmlFor="newAnnualAmount">Annual Amount</Label>
                  <Input
                    id="newAnnualAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newAnnualAmount}
                    onChange={(e) => setNewAnnualAmount(e.target.value)}
                  />
                </div>
                <Button onClick={addAnnualCost}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings">
          <Card>
            <CardHeader>
              <CardTitle>Savings & Emergency Fund</CardTitle>
              <CardDescription>Current savings and emergency fund targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentCash">Current Accessible Cash Savings</Label>
                <Input
                  id="currentCash"
                  type="number"
                  min="0"
                  step="0.01"
                  value={state.savings.currentCash}
                  onChange={(e) => updateSavings({ currentCash: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialEFMonths">
                  Initial Emergency Fund Target (months: {state.savings.initialEFMonths})
                </Label>
                <Input
                  id="initialEFMonths"
                  type="range"
                  min="1"
                  max="3"
                  step="1"
                  value={state.savings.initialEFMonths}
                  onChange={(e) => updateSavings({ initialEFMonths: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Target: {formatCurrency(essentialOutgoings * state.savings.initialEFMonths, state.currency, state.customFxRate)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyFundMonths">
                  Full Emergency Fund Target (months: {state.savings.emergencyFundMonths})
                </Label>
                <Input
                  id="emergencyFundMonths"
                  type="range"
                  min="3"
                  max="12"
                  step="1"
                  value={state.savings.emergencyFundMonths}
                  onChange={(e) => updateSavings({ emergencyFundMonths: parseInt(e.target.value) })}
                />
                <p className="text-sm text-muted-foreground">
                  Target: {formatCurrency(essentialOutgoings * state.savings.emergencyFundMonths, state.currency, state.customFxRate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pension">
          <Card>
            <CardHeader>
              <CardTitle>Pension Setup</CardTitle>
              <CardDescription>Workplace pension information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isEnrolled">Enrolled in workplace pension?</Label>
                <Switch
                  id="isEnrolled"
                  checked={state.pension.isEnrolled}
                  onCheckedChange={(checked) =>
                    state.pension && updateSettings({
                      ...state,
                      pension: { ...state.pension, isEnrolled: checked }
                    } as any)
                  }
                />
              </div>

              {state.pension.isEnrolled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hasEmployerMatch">Employer offers matching?</Label>
                    <Switch
                      id="hasEmployerMatch"
                      checked={state.pension.hasEmployerMatch}
                      onCheckedChange={(checked) =>
                        state.pension && updateSettings({
                          ...state,
                          pension: { ...state.pension, hasEmployerMatch: checked }
                        } as any)
                      }
                    />
                  </div>

                  {state.pension.hasEmployerMatch && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="employeePercent">Your contribution (%)</Label>
                        <Input
                          id="employeePercent"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={state.pension.employeeContributionPercent}
                          onChange={(e) =>
                            state.pension && updateSettings({
                              ...state,
                              pension: {
                                ...state.pension,
                                employeeContributionPercent: parseFloat(e.target.value) || 0
                              }
                            } as any)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="employerPercent">Employer match (%)</Label>
                        <Input
                          id="employerPercent"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={state.pension.employerMatchPercent}
                          onChange={(e) =>
                            state.pension && updateSettings({
                              ...state,
                              pension: {
                                ...state.pension,
                                employerMatchPercent: parseFloat(e.target.value) || 0
                              }
                            } as any)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="canAfford">Can afford to get max match?</Label>
                        <Switch
                          id="canAfford"
                          checked={state.pension.canAffordMaxMatch}
                          onCheckedChange={(checked) =>
                            state.pension && updateSettings({
                              ...state,
                              pension: { ...state.pension, canAffordMaxMatch: checked }
                            } as any)
                          }
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If your employer offers pension matching, it's often considered "free money" and should be prioritized in the flowchart.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="situation">
          <Card>
            <CardHeader>
              <CardTitle>Financial Situation</CardTitle>
              <CardDescription>Help us understand your current situation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reliesOnCredit">Rely on credit for essentials?</Label>
                  <p className="text-sm text-muted-foreground">
                    Do you use credit cards or loans to pay for essential living costs?
                  </p>
                </div>
                <Switch
                  id="reliesOnCredit"
                  checked={state.reliesOnCreditForEssentials}
                  onCheckedChange={(checked) =>
                    updateSettings({ reliesOnCreditForEssentials: checked })
                  }
                />
              </div>
              {state.reliesOnCreditForEssentials && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Consider seeking free debt advice from StepChange, National Debtline, or Citizens
                    Advice.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t space-y-4">
                <h3 className="font-semibold">Budget Health Summary</h3>
                <div className="grid gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium">Household Type</div>
                    <div className="text-sm text-muted-foreground capitalize">{state.householdType}</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium">Monthly Balance</div>
                    <div className={`text-sm font-semibold ${
                      totalIncome - totalOutgoings >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totalIncome - totalOutgoings, state.currency, state.customFxRate)}
                    </div>
                    <div className="text-xs text-muted-foreground">Before debt payments</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm font-medium">Emergency Fund Coverage</div>
                    <div className="text-sm text-muted-foreground">
                      {essentialOutgoings > 0
                        ? `${(state.savings.currentCash / essentialOutgoings).toFixed(1)} months of ${state.savings.emergencyFundMonths} target`
                        : 'Set essential outgoings to calculate'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure UK tax calculation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Enable gross income mode in the Income tab to use these settings. Tax calculations are based on 2024/25 tax year rates.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="taxCode">Tax Code</Label>
                <Input
                  id="taxCode"
                  type="text"
                  value={state.taxConfig.taxCode}
                  onChange={(e) => updateTaxConfig({ taxCode: e.target.value.toUpperCase() })}
                  placeholder="1257L"
                />
                <p className="text-xs text-muted-foreground">
                  Find this on your payslip. Common codes: 1257L (standard), BR (basic rate), K codes (owe tax from previous years)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxSystem">Tax System / Region</Label>
                <Select
                  value={state.taxConfig.taxSystem}
                  onValueChange={(value: TaxSystem) => updateTaxConfig({ taxSystem: value })}
                >
                  <SelectTrigger id="taxSystem">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="england_ni">England & Northern Ireland</SelectItem>
                    <SelectItem value="scotland">Scotland</SelectItem>
                    <SelectItem value="wales">Wales</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Scotland has different income tax bands. Wales currently uses England rates.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentLoanPlan">Student Loan Plan</Label>
                <Select
                  value={state.taxConfig.studentLoanPlan}
                  onValueChange={(value: StudentLoanPlan) => updateTaxConfig({ studentLoanPlan: value })}
                >
                  <SelectTrigger id="studentLoanPlan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Student Loan</SelectItem>
                    <SelectItem value="plan_1">Plan 1 (Pre-2012 England/Wales, All NI/Scotland)</SelectItem>
                    <SelectItem value="plan_2">Plan 2 (Post-2012 England/Wales)</SelectItem>
                    <SelectItem value="plan_4">Plan 4 (Scotland Post-2007)</SelectItem>
                    <SelectItem value="plan_5">Plan 5 (England/Wales from 2023)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Check your loan plan on gov.uk or your Student Loan Company statement
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="postgraduateLoan">Postgraduate Loan</Label>
                  <p className="text-sm text-muted-foreground">
                    Do you have a postgraduate loan? (6% above £21,000 threshold)
                  </p>
                </div>
                <Switch
                  id="postgraduateLoan"
                  checked={state.taxConfig.postgraduateLoan}
                  onCheckedChange={(checked) => updateTaxConfig({ postgraduateLoan: checked })}
                />
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="font-semibold">Self-Assessment</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isSelfEmployed">Self-Employed</Label>
                    <p className="text-sm text-muted-foreground">
                      Are you self-employed or have self-employment income?
                    </p>
                  </div>
                  <Switch
                    id="isSelfEmployed"
                    checked={state.taxConfig.isSelfEmployed}
                    onCheckedChange={(checked) => updateTaxConfig({ isSelfEmployed: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="hasOtherIncome">Other Untaxed Income</Label>
                    <p className="text-sm text-muted-foreground">
                      Do you have rental, dividend, or other untaxed income?
                    </p>
                  </div>
                  <Switch
                    id="hasOtherIncome"
                    checked={state.taxConfig.hasOtherIncome}
                    onCheckedChange={(checked) => updateTaxConfig({ hasOtherIncome: checked })}
                  />
                </div>

                {(state.taxConfig.isSelfEmployed || state.taxConfig.hasOtherIncome || (state.income.primaryGross && state.income.primaryGross >= 100000)) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>You may need to file a Self-Assessment tax return.</strong>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>• Register by 5 October after the end of the tax year</p>
                        <p>• Online deadline: 31 January</p>
                        <p>• Paper deadline: 31 October</p>
                        <p>• Visit gov.uk/self-assessment-tax-returns for more information</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
