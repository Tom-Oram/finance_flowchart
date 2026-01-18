# Wealthcheck

An interactive web application that helps UK users map their personal finances onto the [UKPF Flowchart](https://ukpersonal.finance/flowchart/) journey. Track debts, build emergency funds, and plan your financial future with visual debt payoff comparisons and timelines.

## ⚠️ Important Disclaimers

### Not Financial Advice

**This is NOT financial advice.** The information provided by this application is for educational and informational purposes only. It should not be considered professional financial advice.

- Always do your own research
- Consider seeking advice from a qualified financial advisor for your specific circumstances
- This tool provides general guidance based on community-created flowcharts, not personalised financial advice

### Problem Debt Support

If you are struggling with debt or relying on credit to pay for essential living costs, free help is available from these UK charities:

- [StepChange Debt Charity](https://www.stepchange.org/)
- [National Debtline](https://www.nationaldebtline.org/)
- [Citizens Advice](https://www.citizensadvice.org.uk/)

These organizations provide free, confidential debt advice and support.

## 📜 License & Attribution

### UKPF Flowchart License

This app is based on the **UK Personal Finance Flowchart**, which is published under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/).

**Attribution:**
- Original flowchart: [ukpersonal.finance/flowchart](https://ukpersonal.finance/flowchart/)
- Interactive version: [flowchart.ukpersonal.finance](https://flowchart.ukpersonal.finance/)
- Community: [r/UKPersonalFinance](https://www.reddit.com/r/UKPersonalFinance/)

**License Requirements:**
- ✅ **Attribution** — Credit is given to the UKPF community and flowchart creators
- ✅ **NonCommercial** — This app is free and non-commercial
- ✅ **ShareAlike** — This app is also licensed under CC BY-NC-SA 4.0

### This App's License

This application itself is also licensed under **CC BY-NC-SA 4.0**.

You are free to:
- **Share** — copy and redistribute the material
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license

## 🚀 Features

- **Flowchart Progress Tracking**: See where you are on your financial journey
- **Personalized Next Steps**: Get actionable guidance based on your situation
- **Debt Payoff Comparison**: Compare Avalanche (highest APR first) vs Snowball (smallest balance first) strategies
- **Visual Graphs**: Charts showing debt reduction, interest accumulation, and payoff timelines
- **Timeline Calculations**: See exactly when you'll be debt-free and reach your emergency fund goals
- **Emergency Fund Planning**: Track progress toward 1-3 month and 3-12 month emergency fund targets
- **Multi-Currency Support**: GBP, EUR, USD, or custom currency
- **Privacy First**: All data stored locally in your browser, no server, no tracking
- **Import/Export**: Save your plan as JSON for backup or transfer

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Charts**: [Recharts](https://recharts.org/)
- **Validation**: [Zod](https://zod.dev/)
- **State Management**: React Context + localStorage
- **Testing**: Jest + React Testing Library

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ukpf_flowchart
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm run start
```

### Run Tests

```bash
npm test
# or
npm run test:watch
```

## 🧭 How to Use

1. **Start on the Home page** — Read the disclaimers and understand what the app does
2. **Load Example Data** (optional) — Click "Load Example Data" to see the app with sample finances
3. **Go to Budget** — Enter your income, outgoings, and savings
4. **Add Debts** (if any) — Enter your debts with balances, APRs, and minimum payments
5. **Configure Settings** — Set your currency, household type, and pension details
6. **View Dashboard** — See where you are on the flowchart and what to focus on next
7. **Explore Debts** — Compare Avalanche vs Snowball payoff strategies
8. **Check Graphs** — Visualize your debt payoff journey over time

## 🔧 Project Structure

```
ukpf_flowchart/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/onboarding
│   ├── dashboard/         # Flowchart progress
│   ├── budget/            # Income & outgoings
│   ├── debts/             # Debt management
│   ├── graphs/            # Visual comparisons
│   └── settings/          # Preferences & data management
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Navigation.tsx
│   └── Footer.tsx
├── contexts/             # React Context providers
│   └── FinancialContext.tsx
├── lib/                  # Core business logic
│   ├── types.ts          # TypeScript types & Zod schemas
│   ├── debtSimulator.ts  # Debt payoff calculations
│   ├── flowchartRules.ts # Flowchart decision engine
│   ├── format.ts         # Currency & date formatting
│   ├── storage.ts        # localStorage persistence
│   └── __tests__/        # Unit tests
└── README.md
```

## 🧪 Testing

The app includes comprehensive unit tests for the core debt simulator engine:

- Single debt payoff correctness
- Two-debt allocation (Avalanche vs Snowball)
- Promotional 0% rate transitions
- Edge cases (empty debts, high extra payments, etc.)

Run tests with:
```bash
npm test
```

## 🔐 Privacy & Data

- **No backend**: This is a purely client-side application
- **No tracking**: No analytics, no cookies, no external requests
- **Local storage only**: All your financial data is stored in your browser's localStorage
- **Export/Import**: You can export your plan as JSON and import it later
- **Clear data**: Use the Settings page to reset all data

**Important**: Clearing your browser data will delete your financial plan. Export regularly to keep a backup.

## 🌍 Currency Support

Calculations are performed in GBP (base currency). Display can be:
- **GBP** (£)
- **EUR** (€)
- **USD** ($)
- **Custom** (with user-provided FX rate)

Note: Currency conversion is for display only. No live exchange rates are used.

## 🤝 Contributing

This is a personal/educational project based on community resources. If you find bugs or have suggestions:

1. Check if your issue is with the UKPF flowchart itself (refer to the [official flowchart](https://ukpersonal.finance/flowchart/))
2. For app-specific issues, open an issue or submit a pull request

Remember: Any derivative works must also be licensed under CC BY-NC-SA 4.0.

## 🙏 Acknowledgments

- **UKPF Community**: For creating and maintaining the original flowchart
- **r/UKPersonalFinance**: For financial education and community support
- **shadcn**: For the excellent UI component library
- **Next.js Team**: For the amazing framework

## 📚 Resources

- [UKPF Flowchart](https://ukpersonal.finance/flowchart/)
- [UKPF Wiki](https://ukpersonal.finance/)
- [r/UKPersonalFinance](https://www.reddit.com/r/UKPersonalFinance/)
- [Money Helper (UK Government)](https://www.moneyhelper.org.uk/)

## ⚖️ Legal

This application is provided "as is" without warranty of any kind, express or implied. Use at your own risk.

The creators of this app are not liable for any financial decisions you make based on information provided by this tool.

---

**Remember**: This is a planning tool, not professional advice. Always do your own research and consider consulting qualified professionals for your specific situation.
