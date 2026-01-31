# K2 Trading Platform - Complete Blueprint

## Executive Summary

**K2** is a mobile + web trading application enabling US retail users to:
1. **Trade spot crypto** (top 20 coins) via Crypto.com Exchange API
2. **Trade event contracts** (prediction markets) via Kalshi DCM API

### Critical Constraint: Event Markets Reality Check

> **IMPORTANT**: Crypto.com does NOT offer prediction/event markets. They are a crypto exchange only.
>
> For CFTC-compliant event contracts in the US, you MUST route through a registered Designated Contract Market (DCM). Current options:
> - **Kalshi** (recommended) - Only CFTC-registered event contract exchange for retail
> - **Nadex** - Binary options on forex/indices (not general events)
> - **CME/CBOE** - Institutional derivatives (not retail event contracts)
>
> This blueprint assumes: **Crypto.com for crypto** + **Kalshi for events**

---

## Architecture Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         K2 PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   iOS App   │  │ Android App │  │   Web App   │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └────────────────┼────────────────┘                        │
│                          ▼                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    K2 API GATEWAY                              │ │
│  │         (Auth, Rate Limiting, Request Routing)                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                          │                                          │
│    ┌─────────────────────┼─────────────────────┐                   │
│    ▼                     ▼                     ▼                   │
│  ┌─────────┐      ┌─────────────┐      ┌─────────────┐            │
│  │  Auth   │      │   Trading   │      │  Market     │            │
│  │ Service │      │   Service   │      │  Data Svc   │            │
│  └─────────┘      └──────┬──────┘      └──────┬──────┘            │
│                          │                     │                   │
│         ┌────────────────┴────────────────┐   │                   │
│         ▼                                 ▼   ▼                   │
│  ┌─────────────────┐            ┌─────────────────┐               │
│  │ Crypto.com      │            │ Kalshi          │               │
│  │ Exchange Router │            │ Event Router    │               │
│  └────────┬────────┘            └────────┬────────┘               │
└───────────┼──────────────────────────────┼──────────────────────────┘
            ▼                              ▼
    ┌───────────────┐              ┌───────────────┐
    │  Crypto.com   │              │    Kalshi     │
    │  Exchange API │              │   DCM API     │
    └───────────────┘              └───────────────┘
```

---

## Non-Custodial Model (Phase 1)

In non-custodial mode, **K2 never holds user funds**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER'S ACCOUNTS                              │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ User's Crypto.com   │    │ User's Kalshi       │            │
│  │ Exchange Account    │    │ Account             │            │
│  │ (holds crypto)      │    │ (holds USD)         │            │
│  └──────────┬──────────┘    └──────────┬──────────┘            │
│             │  OAuth/API Key            │  OAuth/API Key       │
│             ▼                           ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    K2 APP                                   ││
│  │  • Unified UI across both exchanges                         ││
│  │  • Portfolio aggregation (read-only balances)               ││
│  │  • Order routing (passthrough to exchanges)                 ││
│  │  • NO custody of funds                                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- No Money Transmitter License (MTL) required
- No custody risk/liability
- Faster launch (weeks, not months)

**Tradeoffs:**
- Users must have accounts at both exchanges
- Fragmented onboarding experience
- Limited to features each exchange supports

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Product Requirements](./01-prd/PRD.md) | Personas, features, success metrics |
| 02 | [UX/UI Specification](./02-ux-ui/UX-SPEC.md) | Screens, flows, design system |
| 03 | [Architecture](./03-architecture/ARCHITECTURE.md) | System design, services, data flow |
| 04 | [Trading Core](./04-trading-core/TRADING-CORE.md) | OMS, risk, execution, reconciliation |
| 05 | [Compliance](./05-compliance/COMPLIANCE.md) | Licensing, paths, requirements |
| 06 | [Execution Plan](./06-execution-plan/AGENT-PLAN.md) | AI agent assignments, milestones |
| 07 | [API Specs](./07-api-specs/) | OpenAPI definitions |

---

## Timeline Overview (Aggressive - 100% AI Agents)

```
Week 1-2:   Foundation (Auth, API Gateway, DB Schema)
Week 3-4:   Crypto.com Integration (Sandbox)
Week 5-6:   Kalshi Integration (Sandbox)
Week 7-8:   Mobile Apps (React Native MVP)
Week 9-10:  Testing, Polish, Security Audit
Week 11-12: Soft Launch (Testflight/Internal)
```

**Total: 12 weeks to functional MVP with sandbox APIs**

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Custody Model | Non-custodial (OAuth) | Avoid MTL, faster launch |
| Crypto Exchange | Crypto.com | User specified |
| Event Markets | Kalshi | Only CFTC-registered retail DCM |
| Mobile Framework | React Native | Single codebase, AI-friendly |
| Backend | Node.js/TypeScript | Fast iteration, AI-friendly |
| Database | PostgreSQL + Redis | Reliable, well-understood |
| Hosting | AWS/GCP | Cloud-native from day 1 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Crypto.com API partnership denied | Medium | Critical | Have Coinbase Pro as backup |
| Kalshi API access delayed | Medium | High | Launch crypto-only first |
| OAuth token management complexity | High | Medium | Use proven OAuth libraries |
| State-by-state restrictions | High | Medium | Geo-fence restricted states |
| Exchange rate limits | Medium | Medium | Implement caching, backoff |

---

## Success Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Signups | 1,000 | First 30 days |
| Connected Accounts | 500 | Users linking exchange accounts |
| Trades Executed | 5,000 | Via K2 interface |
| App Crashes | <1% | Crashlytics |
| Order Success Rate | >99% | Orders accepted by exchanges |
| P95 Latency | <500ms | Order submission to ack |

