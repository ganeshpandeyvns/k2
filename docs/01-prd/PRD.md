# K2 Product Requirements Document (PRD)

## 1. Product Vision

**K2** is the fastest, simplest way for US retail traders to access both crypto spot markets and prediction/event markets through a single, beautiful interface.

**Core Value Proposition:**
> "One app. Two markets. Zero friction."

Users connect their existing Crypto.com and Kalshi accounts, then trade seamlessly through K2's unified interface without K2 ever holding their funds.

---

## 2. Personas

### 2.1 Retail Trader ("Alex")

**Demographics:**
- Age: 25-40
- Tech-savvy, mobile-first
- Has traded crypto before (Coinbase, Robinhood)
- Curious about prediction markets
- Portfolio: $1K - $50K

**Goals:**
- Quick trades during market moves
- Simple portfolio view across assets
- Wants to bet on real-world events (elections, sports, crypto prices)
- Doesn't want multiple apps

**Pain Points:**
- Switching between Crypto.com and Kalshi apps is annoying
- Wants unified P&L view
- Confused by complex order types
- Worried about security of linking accounts

**K2 Solution:**
- Single sign-on, unified dashboard
- One-tap trading
- Clear, jargon-free UI
- Bank-grade security messaging

---

### 2.2 Power User ("Morgan")

**Demographics:**
- Age: 30-50
- Active trader, multiple times per day
- Portfolio: $50K - $500K
- Uses limit orders, wants advanced features
- Tax-conscious

**Goals:**
- Fast execution, minimal latency
- Advanced order types (limit, stop-loss)
- Real-time P&L and exposure tracking
- Tax lot tracking, export for accountant
- Price alerts and notifications

**Pain Points:**
- Current apps too slow
- Wants keyboard shortcuts (web)
- Needs detailed trade history
- Wants API access eventually

**K2 Solution:**
- Optimized trading ticket (<200ms to submit)
- Limit orders, bracket orders
- Detailed trade history with CSV export
- Real-time WebSocket updates
- Future: Power user API

---

### 2.3 Compliance Admin ("Jordan")

**Demographics:**
- Internal K2 employee or contractor
- Responsible for monitoring, reporting
- Needs audit trails

**Goals:**
- Monitor for suspicious activity
- Generate regulatory reports
- Manage user access/restrictions
- View system health

**Pain Points:**
- Needs clear audit logs
- Must demonstrate compliance controls
- Needs to geo-fence restricted states

**K2 Solution:**
- Admin dashboard (internal)
- Immutable audit logs
- State restriction enforcement
- User verification status tracking

---

## 3. Feature Set

### 3.1 Core Features (MVP)

#### Authentication & Onboarding

| Feature | Description | Priority |
|---------|-------------|----------|
| Email/Password Signup | Standard auth with email verification | P0 |
| OAuth Login | Google, Apple Sign-In | P0 |
| Exchange Linking | OAuth flow to connect Crypto.com account | P0 |
| Kalshi Linking | OAuth/API key flow to connect Kalshi | P0 |
| KYC Status Display | Show verification status from linked exchanges | P1 |
| Onboarding Tutorial | 4-screen intro explaining non-custodial model | P0 |

#### Portfolio & Dashboard

| Feature | Description | Priority |
|---------|-------------|----------|
| Unified Balance View | Aggregate balances from both exchanges | P0 |
| Position List | Current positions (crypto + events) | P0 |
| P&L Summary | Daily, weekly, all-time P&L | P0 |
| Performance Chart | Portfolio value over time | P1 |
| Asset Allocation | Pie chart of holdings | P2 |

#### Crypto Trading (via Crypto.com)

| Feature | Description | Priority |
|---------|-------------|----------|
| Market Browser | List of tradeable crypto pairs | P0 |
| Price Chart | Candlestick chart with basic indicators | P0 |
| Market Order | Buy/sell at market price | P0 |
| Limit Order | Buy/sell at specified price | P0 |
| Order Book View | Bids/asks display | P1 |
| Trade History | List of executed trades | P0 |
| Open Orders | List of pending orders with cancel | P0 |

#### Event Markets (via Kalshi)

| Feature | Description | Priority |
|---------|-------------|----------|
| Event Browser | Categories: Politics, Economics, Crypto, Sports | P0 |
| Event Detail | Market description, rules, settlement criteria | P0 |
| Yes/No Trading | Buy Yes or No contracts | P0 |
| Position View | Current event positions | P0 |
| Settlement Display | Outcome and payout when event settles | P0 |
| Event Search | Search by keyword | P1 |

#### Watchlists & Alerts

| Feature | Description | Priority |
|---------|-------------|----------|
| Watchlist | Custom list of crypto + events | P0 |
| Price Alerts | Push notification when price crosses threshold | P1 |
| Event Alerts | Notify when event nears expiry | P2 |

---

### 3.2 Trust & Safety Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Non-Custodial Explainer | Clear messaging that K2 doesn't hold funds | P0 |
| Trade Confirmations | Email receipt for every trade | P0 |
| Risk Warnings | Pre-trade warnings for volatile assets | P0 |
| Event Disclosures | Kalshi-required disclosures for event contracts | P0 |
| Two-Factor Auth | TOTP-based 2FA for account security | P0 |
| Session Management | View/revoke active sessions | P1 |
| Linked Account Management | View/revoke exchange connections | P0 |

---

### 3.3 Phase 2 Features (Post-MVP)

| Feature | Priority | Notes |
|---------|----------|-------|
| Recurring Buys | P1 | Auto-buy crypto on schedule |
| Tax Lot Tracking | P1 | FIFO/LIFO/specific lot selection |
| Advanced Charts | P1 | More indicators, drawing tools |
| Stop-Loss Orders | P1 | If supported by exchanges |
| Social Watchlists | P2 | Share watchlists with privacy controls |
| Referral Program | P2 | Ethical viral loop |
| Dark Mode | P1 | User preference |
| Widget Support | P2 | iOS/Android home screen widgets |
| API Access | P2 | For power users |

---

## 4. User Flows

### 4.1 Onboarding Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Welcome   │───▶│   Sign Up   │───▶│  Verify     │
│   Screen    │    │  Email/OAuth│    │   Email     │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                   ┌─────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXCHANGE LINKING                         │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │  Link Crypto.com    │    │    Link Kalshi      │        │
│  │  [Connect Button]   │    │   [Connect Button]  │        │
│  │                     │    │                     │        │
│  │  "For crypto trading│    │  "For event markets"│        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
│  ℹ️ K2 never holds your funds. Your assets stay at the     │
│     exchanges. We just provide a unified trading interface. │
└─────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Tutorial   │───▶│  Dashboard  │───▶│   Ready!    │
│  (4 screens)│    │   Preview   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 4.2 Trade Flow (Crypto)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Dashboard  │───▶│  Asset      │───▶│   Trade     │
│  or Search  │    │  Detail     │    │   Ticket    │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
               ┌─────────────────┐                      ┌─────────────────┐
               │  Review Order   │                      │  Insufficient   │
               │  ───────────    │                      │  Balance Error  │
               │  Buy 0.5 BTC    │                      │                 │
               │  @ Market       │                      │  [Add Funds at  │
               │  Est: $32,450   │                      │   Crypto.com]   │
               │                 │                      └─────────────────┘
               │  [Confirm]      │
               └────────┬────────┘
                        │
                        ▼
               ┌─────────────────┐    ┌─────────────────┐
               │  Order          │───▶│  Confirmation   │
               │  Submitted      │    │  (with receipt) │
               │  (loading)      │    │                 │
               └─────────────────┘    └─────────────────┘
```

### 4.3 Trade Flow (Event Contract)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐
│   Events    │───▶│  Event      │───▶│      Trade Ticket           │
│   Browser   │    │  Detail     │    │  ─────────────────────────  │
└─────────────┘    └─────────────┘    │  "Will BTC exceed $100K     │
                                      │   by Dec 31, 2024?"         │
                                      │                             │
                                      │  ┌───────┐    ┌───────┐    │
                                      │  │  YES  │    │  NO   │    │
                                      │  │  62¢  │    │  38¢  │    │
                                      │  └───────┘    └───────┘    │
                                      │                             │
                                      │  Contracts: [____10____]    │
                                      │  Cost: $6.20                │
                                      │  Max Profit: $3.80          │
                                      │                             │
                                      │  ⚠️ Event contracts are     │
                                      │  speculative. Max loss is   │
                                      │  your purchase amount.      │
                                      │                             │
                                      │  [Place Order]              │
                                      └─────────────────────────────┘
```

---

## 5. Success Metrics & KPIs

### 5.1 Acquisition Metrics

| Metric | Definition | Target (Month 1) |
|--------|------------|------------------|
| App Downloads | Total installs | 5,000 |
| Signup Rate | Downloads → Signups | 40% |
| Exchange Link Rate | Signups → At least one exchange linked | 50% |
| Activation Rate | Linked → First trade | 30% |

### 5.2 Engagement Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| DAU/MAU | Daily/Monthly active users | 25% |
| Trades per User | Weekly average | 5 |
| Session Duration | Average | 4 minutes |
| Feature Adoption | % using events + crypto | 40% |

### 5.3 Quality Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Order Success Rate | Submitted → Filled | >99% |
| App Crash Rate | Sessions with crash | <0.5% |
| P95 Latency | Order submit to ack | <500ms |
| Customer Satisfaction | NPS | >50 |

---

## 6. Out of Scope (MVP)

The following are explicitly NOT in MVP:

- Custodial services (holding user funds)
- Fiat on/off ramps (users do this at exchanges)
- Margin trading
- Futures/options beyond Kalshi events
- Social features (copy trading, leaderboards)
- Non-US users
- Non-English languages
- Desktop native apps (web only for desktop)

---

## 7. Dependencies & Risks

### 7.1 External Dependencies

| Dependency | Owner | Risk | Mitigation |
|------------|-------|------|------------|
| Crypto.com API Access | Crypto.com | May have rate limits, downtime | Implement caching, fallback messaging |
| Kalshi API Access | Kalshi | New API, may have issues | Start integration early in sandbox |
| OAuth Flows | Both exchanges | May change without notice | Abstract OAuth layer, monitor for changes |
| App Store Approval | Apple/Google | May flag trading apps | Prepare thorough compliance documentation |

### 7.2 Regulatory Dependencies

| Requirement | Status | Notes |
|-------------|--------|-------|
| Non-custodial = No MTL | Assumed | Legal review recommended |
| State Restrictions | Must geo-fence | NY, HI, others restrict crypto |
| Event Market Disclosures | Required | Kalshi provides templates |

---

## 8. Appendix: Supported Assets

### 8.1 Crypto (Top 20 by Market Cap)

| Symbol | Name | Priority |
|--------|------|----------|
| BTC | Bitcoin | P0 |
| ETH | Ethereum | P0 |
| USDT | Tether | P0 |
| BNB | BNB | P1 |
| SOL | Solana | P0 |
| XRP | XRP | P1 |
| USDC | USD Coin | P0 |
| ADA | Cardano | P1 |
| AVAX | Avalanche | P1 |
| DOGE | Dogecoin | P1 |
| DOT | Polkadot | P2 |
| TRX | Tron | P2 |
| LINK | Chainlink | P1 |
| MATIC | Polygon | P1 |
| TON | Toncoin | P2 |
| SHIB | Shiba Inu | P2 |
| LTC | Litecoin | P2 |
| BCH | Bitcoin Cash | P2 |
| UNI | Uniswap | P2 |
| XLM | Stellar | P2 |

### 8.2 Event Categories (Kalshi)

| Category | Examples |
|----------|----------|
| Economics | Fed rate decisions, CPI prints, GDP |
| Politics | Elections, legislation, appointments |
| Crypto | BTC/ETH price milestones |
| Weather | Hurricane landings, temperature records |
| Finance | Stock milestones, IPO dates |
| Entertainment | Awards, box office records |

