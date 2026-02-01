# CLAUDE.md

This file provides guidance to Claude Code when working with the Meru Trading App.

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

### Post-Fix Verification

After fixing ANY bug:
1. Add a regression test for the fix
2. Run: `npm test`
3. If tests pass, commit
4. If tests fail, fix regression first

## Key Business Rules

- **Balance validation**: Always check balance BEFORE executing transactions
- **Large orders**: Require confirmation for orders >$1000
- **Dollar mode**: Force market orders, show slippage warning
- **KYC**: Block deposits/withdrawals for unverified users
- **Address validation**: Validate wallet addresses per chain (BTC/ETH/SOL)

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
