# Meru Trading App - Session Context

**Date:** February 7, 2026
**Branch:** `feature/stock-trading`
**Last Commit:** `491c82e` - feat: Add Fixed Income trading, AI Advisor, and theme improvements

---

## Project Overview

Meru is a mobile trading app (React Native/Expo) that allows users to trade:
- Crypto (BTC, ETH, SOL, etc.)
- Stocks (via DriveWealth integration planned)
- Event contracts (Kalshi-style)
- Fixed Income (bonds/treasuries)
- Private assets (accredited investors)

---

## What Was Built This Session

### 1. Fixed Income Trading
- **FixedIncomeDetailScreen** - Bond details, yield, credit rating, duration
- **FixedIncomeTradeScreen** - Buy/sell bonds
- **mockFixedIncomeData.ts** - 18 instruments (treasuries, corporate bonds)
- Added "Bonds" tab to MarketsScreen (colorful 2x3 grid layout)
- Added 'fixed-income' asset type to portfolioStore

### 2. AI Advisor Feature
- **AdvisorHomeScreen** - Insights cards, quick actions, market summary
- **AdvisorChatScreen** - Chat interface with contextual responses
- **aiAdvisorStore.ts** - Chat state, mock response generation with guardrails
- Fixed theme switching (dark/light mode) for both screens
- Added AI sparkles icon for Advisor tab (replaced Fearless Girl design)

### 3. Markets Screen Improvements
- Changed from horizontal tabs to 2x3 colorful grid
- Each tab has distinct color (Crypto=orange, Stocks=green, Bonds=blue, etc.)

### 4. Bug Fixes
- Fixed `useTheme()` hook usage (returns theme directly, not `{ theme }`)
- Fixed import path for `useTheme` (`../../hooks/useTheme`)
- Fixed theme colors references (`theme.colors.success.primary` not `semantic.success`)

---

## Current App Features (Complete)

| Feature | Status |
|---------|--------|
| Portfolio management | ✅ |
| Crypto trading UI | ✅ |
| Stock trading UI | ✅ |
| Fixed Income/Bonds | ✅ |
| Event contracts | ✅ |
| AI Advisor (mock) | ✅ |
| KYC flow UI | ✅ |
| Funding/Deposit UI | ✅ |
| Theming (dark/light) | ✅ |
| Private assets | ✅ |

---

## Planned Features (Not Yet Built)

### From Plan File (`/Users/ganeshpandey/.claude/plans/cheeky-inventing-taco.md`):

1. **RWA Tokens (Real World Assets)**
   - Categories: Real Estate, Commodities, Treasury Bonds, Corporate Bonds, Private Credit, Carbon Credits, Art & Collectibles
   - Files needed: mockRWAData.ts, RWADetailScreen.tsx, RWATradeScreen.tsx
   - Add RWA tab to MarketsScreen

2. **Stock Options Trading**
   - Simplified options (basic call/put buying only)
   - Files needed: mockOptionsData.ts, OptionsChainScreen.tsx, OptionsTradeScreen.tsx, OptionsPositionScreen.tsx
   - Add "Trade Options" button to stock detail screens

---

## Next Priority: Backend Development

**User clarified architecture:**
- Users create accounts at Meru (not at exchanges)
- Meru acts as broker-dealer
- Meru backend connects to Crypto.com (and other exchanges) with Meru's API keys
- Mobile app only talks to Meru backend

### Backend Requirements:
1. **User Authentication** - Signup, login, JWT tokens
2. **Crypto.com Integration** - Server-side API connection
   - Sandbox URL: `https://uat-api.3ona.co/exchange/v1`
   - WebSocket: `wss://uat-stream.3ona.co/exchange/v1/market`
   - Auth: HMAC-SHA256 signatures
3. **REST API for Mobile** - Endpoints mobile app will call
4. **Order Management** - Route orders to exchanges
5. **Balance Management** - Track user balances

### Discarded Files (Wrong Approach):
- `src/services/cryptoApi.ts` - Was client-side API (discarded)
- `src/store/cryptoApiStore.ts` - Was client-side state (discarded)
- `src/screens/settings/ApiSettingsScreen.tsx` - Was user API key input (discarded)

---

## Tech Stack

- **Frontend:** React Native, Expo SDK 54
- **State:** Zustand with AsyncStorage persistence
- **Navigation:** React Navigation (native-stack, bottom-tabs)
- **Testing:** Jest (194 tests passing)

---

## Key Files Reference

### Screens
- `src/screens/MarketsScreen.tsx` - Main markets with tabs
- `src/screens/PortfolioScreen.tsx` - User portfolio
- `src/screens/advisor/AdvisorHomeScreen.tsx` - AI advisor home
- `src/screens/advisor/AdvisorChatScreen.tsx` - AI chat
- `src/screens/FixedIncomeDetailScreen.tsx` - Bond details
- `src/screens/FixedIncomeTradeScreen.tsx` - Bond trading

### Stores
- `src/store/portfolioStore.ts` - Holdings, trades, P&L
- `src/store/fundingStore.ts` - Cash balance
- `src/store/aiAdvisorStore.ts` - AI chat state
- `src/store/themeStore.ts` - Theme management

### Theme
- `src/theme/meru.ts` - Theme constants
- `src/hooks/useTheme.ts` - Dynamic theme hook

### Navigation
- `src/navigation/RootNavigator.tsx` - All routes

---

## Commands

```bash
# Development
npm start              # Start Expo
npm run ios            # Run iOS simulator

# Testing
npm test               # Run all 194 tests

# Git
git branch             # feature/stock-trading
git log --oneline -5   # Recent commits
```

---

## Production Roadmap

### With AI Assistance (~3 months total):
1. **Week 1-2:** Build Meru Backend (Node.js/Express)
2. **Week 2-3:** Crypto.com integration (server-side)
3. **Week 3-4:** Payment integration (Stripe)
4. **Week 4-6:** Testing & hardening

### Parallel (Human-dependent):
- Broker-dealer partnership (4-8 weeks)
- Legal/compliance setup (6-10 weeks)
- Security audit (2-3 weeks)

---

## Session Notes

- All 194 tests pass
- App runs on iOS simulator
- Demo mode works fully (no real money)
- Theme switching works across all screens
- AI Advisor gives contextual responses (mock)

---

*Last updated: February 7, 2026*
