'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AnimatedCard } from '@/components/AnimatedCard'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, AlertTriangle, CheckCircle2, TrendingUp, PiggyBank, Shield, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import { useFinancial } from '@/contexts/FinancialContext'
import { OnboardingWizard } from '@/components/OnboardingWizard'

const EXAMPLE_DATA = {
  currency: 'GBP' as const,
  customFxRate: 1,
  householdType: 'single' as const,
  income: {
    primaryNet: 2500,
    secondaryNet: 0,
    other: 0,
  },
  outgoings: {
    items: [
      { id: '1', name: 'Rent', amount: 850, isEssential: true },
      { id: '2', name: 'Council Tax', amount: 120, isEssential: true },
      { id: '3', name: 'Utilities', amount: 150, isEssential: true },
      { id: '4', name: 'Food & Groceries', amount: 300, isEssential: true },
      { id: '5', name: 'Transport', amount: 80, isEssential: true },
      { id: '6', name: 'Phone', amount: 25, isEssential: true },
      { id: '7', name: 'Entertainment', amount: 100, isEssential: false },
      { id: '8', name: 'Eating Out', amount: 120, isEssential: false },
    ],
    annualCosts: [
      { id: '9', name: 'Car Insurance', amount: 600, isEssential: true },
      { id: '10', name: 'Holiday Fund', amount: 1200, isEssential: false },
    ],
  },
  savings: {
    currentCash: 800,
    emergencyFundMonths: 6,
    initialEFMonths: 1,
  },
  debts: [
    {
      id: 'd1',
      name: 'Barclaycard',
      type: 'credit_card' as const,
      balance: 3500,
      apr: 21.9,
      minimumPayment: 100,
      hasPromo: false,
      promoMonthsRemaining: 0,
      paymentMode: 'minimum_payment' as const,
      notes: '',
    },
    {
      id: 'd2',
      name: 'Amex 0% Balance Transfer',
      type: 'credit_card' as const,
      balance: 2000,
      apr: 0,
      minimumPayment: 50,
      hasPromo: true,
      promoMonthsRemaining: 18,
      postPromoApr: 24.9,
      paymentMode: 'minimum_payment' as const,
      notes: '',
    },
  ],
  pension: {
    isEnrolled: true,
    hasEmployerMatch: true,
    employeeContributionPercent: 5,
    employerMatchPercent: 5,
    canAffordMaxMatch: true,
  },
  goals: [],
  reliesOnCreditForEssentials: false,
  taxConfig: {
    enabled: false,
    taxCode: '1257L',
    taxSystem: 'england_ni' as const,
    studentLoanPlan: 'none' as const,
    postgraduateLoan: false,
    isSelfEmployed: false,
    hasOtherIncome: false,
    needsSelfAssessment: false,
  },
  monthlySnapshots: [],
}

export default function HomePage() {
  const { importState } = useFinancial()
  const [wizardOpen, setWizardOpen] = useState(false)

  const loadExampleData = () => {
    importState(EXAMPLE_DATA)
  }

  const features = [
    {
      icon: Target,
      title: 'Track Your Journey',
      description: 'See exactly where you are on your financial path',
    },
    {
      icon: TrendingUp,
      title: 'Smart Comparisons',
      description: 'Compare debt strategies to save thousands in interest',
    },
    {
      icon: Shield,
      title: 'Private & Secure',
      description: 'All your data stays on your device, always',
    },
    {
      icon: Zap,
      title: 'Real-time Insights',
      description: 'Get instant feedback on your financial decisions',
    },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Take Control of Your Finances
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
          Map your personal finances onto the UKPF flowchart journey. Track debts,
          build emergency funds, and plan your financial future.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Button
            size="lg"
            className="gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={() => setWizardOpen(true)}
          >
            <TrendingUp className="h-5 w-5" />
            Get Started Free
          </Button>
          <Button size="lg" variant="outline" onClick={loadExampleData} className="text-lg px-8 py-6">
            Try Example Data
          </Button>
        </div>
        <OnboardingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      </div>

      {/* Disclaimer */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
        <Alert className="bg-amber-950/30 border-amber-800/50">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertTitle className="text-amber-300">Important Disclaimer</AlertTitle>
          <AlertDescription className="text-amber-200/80">
            This is <strong>not financial advice</strong>. The information provided is for
            educational purposes only. Always do your own research and consider seeking
            professional advice for your specific circumstances.
          </AlertDescription>
        </Alert>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, idx) => (
          <AnimatedCard key={feature.title} delay={idx * 100}>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-background" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </AnimatedCard>
        ))}
      </div>

      {/* What This App Does */}
      <div className="grid md:grid-cols-2 gap-6">
        <AnimatedCard delay={200}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              What This App Does
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-3">
              {[
                'Shows where you are on the UKPF flowchart',
                'Provides personalised next steps based on your finances',
                'Compares debt payoff strategies (Avalanche vs Snowball)',
                'Calculates timelines for becoming debt-free',
                'Shows total interest saved with different approaches',
                'Tracks emergency fund progress month-over-month',
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-green-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  </div>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-blue-600" />
              Privacy & Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-3">
              {[
                'All data stays in your browser (localStorage)',
                'No server, no tracking, no accounts',
                'Export your plan as JSON to save externally',
                'Import previously saved plans',
                'Completely free and open-source',
                'Built with open banking standards in mind',
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-blue-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </AnimatedCard>
      </div>

      {/* About UKPF Flowchart */}
      <AnimatedCard delay={400}>
        <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 p-1 rounded-lg border border-primary/20">
          <CardHeader>
            <CardTitle>About the UKPF Flowchart</CardTitle>
            <CardDescription>
              This app is based on the community-created flowchart from r/UKPersonalFinance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              The UKPF flowchart is a decision tree that helps you prioritise your financial
              goals. It guides you through essential steps like dealing with problem debt,
              building emergency funds, clearing expensive debts, and eventually investing for
              the long term.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://ukpersonal.finance/flowchart/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  View Original Flowchart
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a
                href="https://flowchart.ukpersonal.finance/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  Interactive Flowchart
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </CardContent>
        </div>
      </AnimatedCard>

      {/* CTA Section */}
      <div className="text-center space-y-6 py-12 bg-gradient-to-r from-primary/10 via-cyan-500/10 to-blue-500/10 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '500ms' }}>
        <h2 className="text-3xl font-bold">Ready to take control?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start your financial journey today. Track your progress, compare strategies, and achieve your goals.
        </p>
        <Button
          size="lg"
          className="gap-2 text-lg px-8 py-6"
          onClick={() => setWizardOpen(true)}
        >
          Start Your Journey
          <TrendingUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
