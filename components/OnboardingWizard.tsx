'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useFinancial } from '@/contexts/FinancialContext'
import { HouseholdType } from '@/lib/types'
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface OnboardingWizardProps {
  open: boolean
  onClose: () => void
}

export function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const { updateSettings, updateIncome, updateOutgoings, updateSavings } = useFinancial()
  const [step, setStep] = useState(1)
  const totalSteps = 5

  // Form state
  const [householdType, setHouseholdType] = useState<HouseholdType>('single')
  const [primaryIncome, setPrimaryIncome] = useState('')
  const [secondaryIncome, setSecondaryIncome] = useState('')
  const [essentialSpending, setEssentialSpending] = useState('')
  const [nonEssentialSpending, setNonEssentialSpending] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')

  const progress = (step / totalSteps) * 100

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleFinish = () => {
    // Save all data to context
    updateSettings({ householdType })

    updateIncome({
      primaryNet: parseFloat(primaryIncome) || 0,
      secondaryNet: parseFloat(secondaryIncome) || 0,
      other: 0,
    })

    const essential = parseFloat(essentialSpending) || 0
    const nonEssential = parseFloat(nonEssentialSpending) || 0

    if (essential > 0 || nonEssential > 0) {
      const items = []
      if (essential > 0) {
        items.push({
          id: crypto.randomUUID(),
          name: 'Essential Spending',
          amount: essential,
          isEssential: true,
        })
      }
      if (nonEssential > 0) {
        items.push({
          id: crypto.randomUUID(),
          name: 'Non-Essential Spending',
          amount: nonEssential,
          isEssential: false,
        })
      }
      updateOutgoings({ items, annualCosts: [] })
    }

    updateSavings({
      currentCash: parseFloat(currentSavings) || 0,
      emergencyFundMonths: 3,
      initialEFMonths: 1,
    })

    onClose()
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return true // Household type always valid
      case 2:
        return primaryIncome !== '' && parseFloat(primaryIncome) >= 0
      case 3:
        return true // Optional spending
      case 4:
        return true // Optional savings
      case 5:
        return true // Summary
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome to Wealthcheck</DialogTitle>
          <DialogDescription>
            Let's set up your financial profile in {totalSteps} quick steps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step 1: Household Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Household Type</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Are you managing finances alone or with a partner?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="householdType">Select your household type</Label>
                <Select value={householdType} onValueChange={(value: HouseholdType) => setHouseholdType(value)}>
                  <SelectTrigger id="householdType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="couple">Couple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Income */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Monthly Income</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your monthly take-home pay (after tax)
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryIncome">Primary Income (required)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      id="primaryIncome"
                      type="number"
                      min="0"
                      step="0.01"
                      value={primaryIncome}
                      onChange={(e) => setPrimaryIncome(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Your main monthly take-home pay</p>
                </div>
                {householdType === 'couple' && (
                  <div className="space-y-2">
                    <Label htmlFor="secondaryIncome">Partner's Income (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        id="secondaryIncome"
                        type="number"
                        min="0"
                        step="0.01"
                        value={secondaryIncome}
                        onChange={(e) => setSecondaryIncome(e.target.value)}
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Spending */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Monthly Spending</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Estimate your average monthly expenses
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="essentialSpending">Essential Spending</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      id="essentialSpending"
                      type="number"
                      min="0"
                      step="0.01"
                      value={essentialSpending}
                      onChange={(e) => setEssentialSpending(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Rent, bills, groceries, transport, etc.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nonEssentialSpending">Non-Essential Spending</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      id="nonEssentialSpending"
                      type="number"
                      min="0"
                      step="0.01"
                      value={nonEssentialSpending}
                      onChange={(e) => setNonEssentialSpending(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Entertainment, dining out, subscriptions, etc.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Savings */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Current Savings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  How much do you currently have in cash savings?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentSavings">Cash Savings</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="currentSavings"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Money in bank accounts, easy-access savings, etc.</p>
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  You're All Set!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Here's what we've captured:
                </p>
              </div>
              <div className="space-y-3 p-4 border rounded-lg bg-accent/50">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Household:</span>
                  <span className="text-sm font-medium capitalize">{householdType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Income:</span>
                  <span className="text-sm font-medium">
                    £{(parseFloat(primaryIncome || '0') + parseFloat(secondaryIncome || '0')).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Spending:</span>
                  <span className="text-sm font-medium">
                    £{(parseFloat(essentialSpending || '0') + parseFloat(nonEssentialSpending || '0')).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Savings:</span>
                  <span className="text-sm font-medium">£{parseFloat(currentSavings || '0').toFixed(2)}</span>
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-primary/5">
                <p className="text-sm">
                  You can add more details (debts, pension, specific expenses) anytime from the Budget and Debts pages.
                  The flowchart will guide you through the next steps!
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
