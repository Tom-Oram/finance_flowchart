# UK Personal Finance Flowchart App - Project Overview

## 🎯 What This App Does

A comprehensive web application that helps UK users navigate their personal finance journey using the community-created UKPF flowchart as a guide.

### Core Features

1. **Interactive Flowchart Progress**
   - Shows current position on the flowchart
   - Highlights completed steps
   - Provides personalized next actions

2. **Debt Payoff Simulator**
   - Avalanche method (highest APR first)
   - Snowball method (smallest balance first)
   - Side-by-side comparison with savings calculations
   - Handles promotional 0% periods

3. **Visual Analytics**
   - Debt balance reduction over time
   - Cumulative interest paid comparison
   - Bar charts for total interest and payoff duration
   - Real-time updates as you adjust extra payments

4. **Budget Tracking**
   - Monthly income (primary, secondary, other)
   - Essential vs discretionary spending
   - Annual costs amortized monthly
   - Emergency fund progress monitoring

5. **Timeline Calculations**
   - Debt-free date predictions
   - Emergency fund completion dates
   - Interest saved with different strategies
   - Month-by-month payment schedules

## 🏗️ Technical Architecture

### Technology Choices

- **Next.js 14 (App Router)**: Modern React framework with excellent DX
- **TypeScript**: Full type safety throughout
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality, accessible components
- **Recharts**: Responsive, customizable charts
- **Zod**: Runtime validation and type inference
- **React Context**: Global state management
- **localStorage**: Persistent client-side storage

### Key Design Decisions

1. **No Backend Required**
   - Purely client-side application
   - No server costs, no database
   - Complete privacy (no data leaves the browser)
   - Instant deployment to static hosting

2. **Strong Typing**
   - Zod schemas define runtime validation
   - TypeScript interfaces ensure compile-time safety
   - Prevents invalid financial data

3. **Modular Business Logic**
   - `debtSimulator.ts`: Pure functions for calculations
   - `flowchartRules.ts`: Decision engine with clear step definitions
   - `format.ts`: Reusable formatting utilities
   - Easy to test, maintain, and extend

4. **Accessible UI**
   - Radix UI primitives (keyboard navigation, ARIA labels)
   - Semantic HTML
   - Clear visual hierarchy
   - Responsive design

## 📁 File Structure & Responsibilities

### Core Libraries (`lib/`)

#### `types.ts`
- TypeScript types for entire app
- Zod schemas for validation
- Single source of truth for data shapes

#### `debtSimulator.ts`
- Core debt payoff calculations
- Month-by-month amortization
- Strategy comparison logic
- Interest calculation with APR handling
- Promotional rate transitions

#### `flowchartRules.ts`
- Flowchart step definitions
- Completion criteria functions
- Next action generators
- Help link mappings
- Decision tree logic

#### `format.ts`
- Currency formatting (multi-currency support)
- Date formatting (UK locale)
- Percentage formatting
- Month/year utilities

#### `storage.ts`
- localStorage save/load
- JSON export
- File import
- State validation

### Context (`contexts/`)

#### `FinancialContext.tsx`
- Global state management
- CRUD operations for debts, goals, outgoings
- Auto-save to localStorage
- State initialization

### UI Components (`components/`)

#### `ui/`
- shadcn/ui components (Button, Card, Input, etc.)
- Consistent styling
- Reusable across pages

#### `Navigation.tsx`
- Main navigation bar
- Active page highlighting
- Responsive menu

#### `Footer.tsx`
- Attribution links
- License notice
- Disclaimer text
- Problem debt signposting

### Pages (`app/`)

#### `page.tsx` (Home)
- Onboarding
- Feature overview
- Disclaimers
- Example data loader

#### `dashboard/page.tsx`
- Flowchart progress stepper
- Key metrics tiles
- Current focus card
- Next actions list

#### `budget/page.tsx`
- Income editor
- Outgoings manager (essential/discretionary)
- Annual costs
- Emergency fund targets
- Savings tracker

#### `debts/page.tsx`
- Debt CRUD interface
- Payoff comparison (Avalanche vs Snowball)
- Strategy selector
- Extra payment calculator

#### `graphs/page.tsx`
- Line charts (balance over time, interest over time)
- Bar charts (comparison summaries)
- Interactive sliders
- Responsive charts with Recharts

#### `settings/page.tsx`
- Currency selector
- Household type
- Pension configuration
- Data export/import
- Reset functionality

## 🧮 Debt Simulator Deep Dive

### Algorithm Overview

The debt simulator uses a month-by-month amortization approach:

1. **Initialization**: Create state for each debt
2. **Each Month**:
   - Calculate interest for each debt
   - Pay minimums on all debts
   - Allocate extra payment to priority debt (strategy-dependent)
   - Update balances
   - Record schedule entry
3. **Termination**: When all debts paid or max months reached

### Avalanche Strategy
- Sort debts by APR (highest first)
- Allocate extra payment to highest APR debt
- Minimizes total interest paid
- Mathematically optimal

### Snowball Strategy
- Sort debts by balance (smallest first)
- Allocate extra payment to smallest balance
- Provides psychological wins (debts eliminated faster)
- May cost more in interest

### Promotional Rates
- Track months remaining on 0% promo
- Decrement each month
- Switch to post-promo APR when expired
- Correctly prioritize based on current APR (not post-promo)

## 🎨 User Experience Features

### Smart Defaults
- GBP currency
- 3-month full emergency fund target
- 1-month initial emergency fund
- Example data available for testing

### Inline Help
- Tooltips explaining terms (APR, minimum payment, etc.)
- Links to UKPF guides for each flowchart step
- Contextual help text throughout

### Validation & Feedback
- Real-time input validation
- Clear error messages
- Visual feedback (green for positive, red for negative)
- Disabled states when data missing

### Responsive Design
- Mobile-friendly navigation (icons only on small screens)
- Responsive charts (Recharts ResponsiveContainer)
- Grid layouts that stack on mobile
- Touch-friendly controls

## 🔒 Privacy & Security

### No Data Leaves Browser
- No API calls to external servers
- No analytics or tracking
- No cookies (except localStorage)

### Export/Import
- Users control their data
- JSON format (human-readable, portable)
- No vendor lock-in

### Clear Data
- One-click reset in Settings
- Confirmation prompt before destructive actions

## 📊 Testing Strategy

### Unit Tests (`lib/__tests__/`)
- Core calculation correctness
- Edge cases (empty debts, high payments, etc.)
- Strategy comparison accuracy
- Promotional rate transitions
- Helper function validation

### Manual Testing Checklist
- [ ] Load example data
- [ ] Add/edit/remove debts
- [ ] Compare payoff strategies
- [ ] View graphs with different extra payments
- [ ] Export and re-import data
- [ ] Test all currency options
- [ ] Verify localStorage persistence
- [ ] Check responsive design on mobile

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Netlify
```bash
npm run build
# Deploy /out folder
```

### GitHub Pages
```bash
npm run build
# Deploy /out folder to gh-pages branch
```

### Static Export
```bash
npm run build
# Serve the .next folder
```

## 🛠️ Customization Guide

### Adding Flowchart Steps
Edit `lib/flowchartRules.ts`:
```typescript
{
  id: 'new_step',
  title: 'New Step',
  description: 'Description',
  helpLinks: [{ text: 'Link', url: 'https://...' }],
  isComplete: (state) => {
    // Your completion logic
    return state.someCondition
  },
  getNextActions: (state) => {
    return ['Action 1', 'Action 2']
  },
}
```

### Changing Color Scheme
Edit `app/globals.css` CSS variables:
```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Your color */
}
```

### Adding New Debt Types
1. Update `lib/types.ts` DebtTypeSchema
2. Update `DEBT_TYPE_LABELS` in `app/debts/page.tsx`
3. Update filtering logic if needed

## 📈 Future Enhancement Ideas

- Goal tracking with timelines
- Pension contribution calculator
- Tax band calculator
- Investment allocation suggestions
- Multi-user household mode
- Debt avalanche/snowball hybrid strategies
- Savings account comparison
- Mortgage overpayment calculator
- PDF export of plan
- Dark mode

## 🙏 Attribution

Based on the UKPF Flowchart (CC BY-NC-SA 4.0):
- https://ukpersonal.finance/flowchart/
- https://flowchart.ukpersonal.finance/

## 📝 License

**CC BY-NC-SA 4.0**
- Attribution required
- Non-commercial use only
- Share-alike (derivatives must use same license)

---

**Quick Links:**
- [README.md](./README.md) - Full documentation
- [SETUP.md](./SETUP.md) - Quick start guide
- [UKPF Flowchart](https://ukpersonal.finance/flowchart/) - Original flowchart
