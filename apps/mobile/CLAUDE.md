# CLAUDE.md

This file provides guidance to Claude Code when working with the Meru Trading App.

## CRITICAL: Development Guidelines

This is a **financial trading application** - bugs can cost users money. Before writing code, follow these rules:

### Golden Rule: No Regressions
**ANY fix or enhancement MUST NOT break existing functionality.** Before committing:
1. Run `npm test` - ALL tests must pass
2. Visually verify affected screens still work
3. Test related flows end-to-end
4. If a fix breaks something else, fix that FIRST

- **No hardcoded secrets** - Fail fast if env vars missing, never commit API keys
- **Enforce business rules everywhere** - Balance checks, KYC, limits at ALL entry points (screens, stores, services)
- **No demo data in production** - Show errors, not fake data when APIs fail
- **Think adversarially** - Verify ownership, check permissions on every action
- **Use transactions** - Wrap read-then-write operations atomically (check balance → deduct → execute)
- **Fail secure** - Unknown state = denied, not allowed
- **Validate at boundaries** - All user input must be sanitized before use
- **Double-tap protection** - All transaction buttons must prevent rapid re-submission

## Project Overview

Meru is a mobile trading application built with React Native/Expo that allows users to trade crypto and event contracts. The app features:

- Portfolio management with real-time P&L tracking
- Crypto trading (BTC, ETH, SOL, etc.)
- Event contract trading (Kalshi-style)
- Wallet features (send, receive, swap)
- Funding flows (deposit, withdraw)
- KYC verification

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: React Navigation (native-stack, bottom-tabs)
- **API**: React Query for data fetching
- **Testing**: Jest with ts-jest

## Commands

```bash
# Development
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator

# Testing
npm test               # Run all tests
npm test -- --coverage # Run with coverage report
npm test -- path/to/test.ts  # Run specific test

# Type checking
npx tsc --noEmit       # Check types without emitting
```

## Directory Structure

```
src/
├── screens/           # Screen components
│   ├── funding/       # Deposit, Withdraw, PaymentMethods
│   ├── kyc/           # KYC verification screens
│   ├── wallet/        # Send, Receive screens
│   └── swap/          # Swap screen
├── components/        # Reusable components
├── store/             # Zustand stores
│   ├── portfolioStore.ts   # Holdings, trades, P&L
│   ├── fundingStore.ts     # Cash balance, transactions
│   ├── kycStore.ts         # KYC status
│   └── walletStore.ts      # Addresses, sends
├── utils/             # Utility functions
│   ├── trading.ts     # Order calculations
│   ├── validation.ts  # Input validation
│   └── format.ts      # Formatting helpers
├── navigation/        # React Navigation setup
├── services/          # API client
└── theme/             # Styling constants
```

## Self-Improving QA Loop

**IMPORTANT**: When asked to run QA, testing, or find bugs, use the self-improving QA loop in `qa-loop/`:

### Quick Start
1. **Read `qa-loop/patterns.json`** - Contains 20+ learned patterns from past issues
2. **Read `qa-loop/checklist.md`** - Comprehensive QA checklist
3. **Apply patterns** - "When I see X, check for Y"
4. **Fix immediately** - Don't just report, fix the issues
5. **Log findings** - Update `qa-loop/session-log.md`
6. **Learn** - Add new patterns to `patterns.json` for future sessions
7. **Update score** - Track progress in `qa-loop/metrics.json`

### High-Priority Patterns (Check First)
| ID | Weight | Pattern |
|----|--------|---------|
| P003 | 1.8 | Balance validation before transactions |
| P010 | 1.6 | Large transaction confirmation (>$1000) |
| P018 | 1.6 | Portfolio cost basis updates |
| P002 | 1.5 | Division by zero protection |
| P019 | 1.5 | Cash balance updates |
| P012 | 1.4 | Wallet address validation per chain |

### RL-Style Scoring
- **Penalties**: CRITICAL=-100, HIGH=-50, MEDIUM=-20, LOW=-5
- **Rewards**: No new bugs=+200, Pattern caught bug=+10, New pattern=+25
- **Goal**: Reach cumulative score of +500

### Quick Issue Trigger

**IMPORTANT**: When user message starts with "Issue:" - treat as bug report!

Format: `Issue: [file:line] - [description], [SEVERITY]`

Example:
```
Issue: src/screens/TradeScreen.tsx:150 - Dollar input allows negative values, MEDIUM
```

**Auto-actions when "Issue:" detected:**
1. Parse file, line, description, severity
2. Add to `qa-loop/mistakes.json`
3. Create pattern in `qa-loop/patterns.json`
4. Fix the bug in the code
5. Search codebase for similar issues
6. Update `qa-loop/metrics.json` score
7. Commit all changes

### CRITICAL: Post-Fix Verification (Regression Testing)

**After fixing ANY bug, you MUST run regression tests to ensure fixes don't break existing functionality.**

```bash
# Run all tests after any fix
npm test
```

**When adding a new fix:**
1. Fix the bug in the code
2. Add a regression test for the specific fix in `__tests__/`
3. Run `npm test` to verify all tests pass
4. If tests pass, commit with descriptive message
5. If tests fail, fix the regression BEFORE committing

**Regression test locations:**
- Store logic: `__tests__/store/*.test.ts`
- Utilities: `__tests__/utils/*.test.ts`
- Validation: `__tests__/utils/validation.test.ts`
- Trading calculations: `__tests__/utils/trading.test.ts`

**Test naming convention:**
```typescript
it('should [expected behavior] when [condition]', () => {
  // Arrange, Act, Assert
});
```

## Business Rules (Enforce at ALL Entry Points)

These rules MUST be checked at all entry points (screens, store actions, API calls):

### Transaction Safety
- **Balance validation**: Check at screen load AND before execution - never trust cached values
- **Large transaction confirmation**: >$1000 requires explicit Alert confirmation
- **Double-tap protection**: Disable buttons during processing, use `isProcessing` state
- **Atomic operations**: Balance check → deduct → execute must be atomic

### Trading Rules
- **Dollar mode**: Force market orders, show slippage warning disclosure
- **Quantity mode**: Allow limit orders, validate against holdings for sells
- **Price validation**: Protect against division by zero, handle NaN gracefully

### Compliance
- **KYC required**: Block deposits/withdrawals/large sends for unverified users
- **Asset ownership**: Verify user owns asset before any sell/send operation
- **Address validation**: Validate wallet addresses per chain (BTC/ETH/SOL formats differ)

### Limits
- **Minimum deposit**: $10
- **Minimum order**: $1.00 for dollar-based orders
- **Confirmation threshold**: $1000 for all transaction types

## Testing Conventions

- Test files in `__tests__/` directory
- Store tests: `__tests__/store/*.test.ts`
- Utility tests: `__tests__/utils/*.test.ts`
- Use descriptive test names: "should calculate quantity from dollars"
- Mock AsyncStorage in test setup

## Common Patterns

### Adding a New Screen
1. Create screen in `src/screens/[category]/`
2. Add to `RootNavigator.tsx`
3. Add navigation types to `RootStackParamList`

### Adding Store State
1. Add type to store interface
2. Add initial state
3. Add actions
4. Add persistence if needed
5. Add tests

### Input Validation
Use utilities from `src/utils/`:
- `sanitizeAmountInput()` - Clean numeric input
- `validateAddress()` - Validate wallet addresses
- `isValidTransactionAmount()` - Check amount validity

## Environment Variables

The app runs in **Demo Mode** by default (no real backend required). For production:

```bash
# .env or app.config.js
API_BASE_URL=https://api.meru.com    # Backend API endpoint
DEMO_MODE=false                       # Set false for real transactions
```

**Demo Mode Behavior:**
- All transactions are simulated locally
- No real money movement
- Mock prices and exchange rates
- Instant "success" for all operations

**Required for Production:**
- `API_BASE_URL` - Backend API endpoint
- `STRIPE_PUBLISHABLE_KEY` - For payment processing
- `SENTRY_DSN` - Error tracking (optional)

## Demo Credentials & Testing

### Default Demo State
The app initializes with:
- **Cash Balance**: $10,000
- **Holdings**: Pre-loaded BTC, ETH, SOL positions
- **KYC Status**: Verified (for testing all flows)
- **Payment Method**: Demo bank account linked

### Testing Different States
Reset stores in Settings or use store actions:
```typescript
// Reset to initial state
usePortfolioStore.getState().reset();
useFundingStore.getState().reset();
useKYCStore.getState().reset();
```

### Demo Mode Indicator
All transaction screens show "Demo Mode - No real money" badge to prevent confusion.
