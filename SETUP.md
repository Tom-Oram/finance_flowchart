# Quick Setup Guide

## First Time Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## First Steps in the App

1. **Home Page**: Read disclaimers and click "Load Example Data" to see the app populated
2. **Dashboard**: View your flowchart position and next steps
3. **Budget**: Enter your real income and expenses
4. **Debts**: Add your actual debts to see real payoff strategies
5. **Graphs**: Visualize your debt reduction journey
6. **Settings**: Configure currency, export/import data, manage pension settings

## Key Features to Test

### Debt Payoff Comparison
- Add 2+ debts with different APRs
- Go to Debts > Payoff Comparison
- Adjust extra payment slider
- See Avalanche vs Snowball comparison

### Graphs
- After adding debts, visit Graphs page
- View debt reduction over time
- Compare total interest paid
- See months-to-payoff charts

### Emergency Fund Tracking
- Set current cash savings in Budget > Savings
- Adjust target months (1-3 for initial, 3-12 for full)
- Dashboard shows months covered

### Data Persistence
- All data auto-saves to localStorage
- Export as JSON from Settings
- Import previously saved plans
- Reset all data if needed

## Troubleshooting

### "No debts to display" on Graphs
- Add debts in the Debts page first
- Note: Mortgages and student loans are excluded from payoff comparison

### Data not saving
- Check browser localStorage is enabled
- Try exporting your plan as backup
- Clear browser cache and reimport if needed

### Tests failing
- Ensure you've run `npm install` first
- Check Node version (requires 18+)
- Run `npm test` to see specific failures

## Project Structure Overview

```
├── app/                    # Next.js pages (App Router)
│   ├── page.tsx           # Home
│   ├── dashboard/         # Flowchart progress
│   ├── budget/            # Income & expenses
│   ├── debts/             # Debt manager
│   ├── graphs/            # Charts
│   └── settings/          # Config
├── components/            # UI components
│   ├── ui/               # shadcn components
│   ├── Navigation.tsx
│   └── Footer.tsx
├── contexts/             # State management
│   └── FinancialContext.tsx
├── lib/                  # Business logic
│   ├── debtSimulator.ts  # Core calculations
│   ├── flowchartRules.ts # Decision engine
│   ├── format.ts         # Formatting utilities
│   ├── storage.ts        # localStorage
│   └── types.ts          # TypeScript types
└── README.md             # Full documentation
```

## Common Customizations

### Changing Default Currency
Edit `contexts/FinancialContext.tsx`:
```typescript
const defaultState: FinancialState = {
  currency: 'EUR', // Change from 'GBP'
  // ...
}
```

### Adjusting Emergency Fund Range
Edit `lib/types.ts`:
```typescript
emergencyFundMonths: z.number().min(3).max(24), // Increase from 12
```

### Adding New Debt Types
Edit `lib/types.ts`:
```typescript
export const DebtTypeSchema = z.enum([
  'credit_card',
  'loan',
  'your_new_type', // Add here
  // ...
])
```

Then update `DEBT_TYPE_LABELS` in `app/debts/page.tsx`.

## Need Help?

- Read the full [README.md](./README.md)
- Check the [UKPF Flowchart](https://ukpersonal.finance/flowchart/)
- Review component code - it's well-commented
- Run tests to understand core logic: `npm test`

## License Reminder

This app is licensed under **CC BY-NC-SA 4.0**:
- ✅ Free to use and modify
- ✅ Must give attribution
- ❌ No commercial use
- ✅ Share modifications under same license

See [README.md](./README.md) for full license details.
