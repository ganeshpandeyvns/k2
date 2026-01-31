# K2 Compliance & Launch Structure

## 1. Regulatory Landscape Overview

### 1.1 Key Regulatory Bodies

| Regulator | Jurisdiction | Relevance to K2 |
|-----------|--------------|-----------------|
| **FinCEN** | Federal | Money Services Business (MSB) registration |
| **State Regulators** | Per-state | Money Transmitter Licenses (MTL) |
| **SEC** | Federal | Securities (if applicable) |
| **CFTC** | Federal | Event contracts / derivatives |
| **State AGs** | Per-state | Consumer protection |

### 1.2 Core Regulatory Questions

| Question | K2's Answer | Implication |
|----------|-------------|-------------|
| Does K2 hold customer funds? | **No** (non-custodial) | Avoid MSB/MTL in most cases |
| Does K2 execute trades? | **No** (routes to exchanges) | Not a broker-dealer |
| Does K2 offer securities? | **No** (crypto + events only) | Avoid SEC registration |
| Does K2 offer derivatives? | **Indirectly** (via Kalshi) | Kalshi holds the DCM registration |

---

## 2. Non-Custodial Model: Legal Advantages

### 2.1 What "Non-Custodial" Means

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NON-CUSTODIAL ARCHITECTURE                           │
│                                                                             │
│  WHAT K2 DOES:                          WHAT K2 DOES NOT DO:               │
│  ───────────────                        ─────────────────────               │
│  ✓ Provides unified UI                  ✗ Hold user funds                  │
│  ✓ Routes orders to exchanges           ✗ Take custody of crypto           │
│  ✓ Aggregates portfolio data            ✗ Process deposits/withdrawals     │
│  ✓ Sends notifications                  ✗ Transmit money                   │
│  ✓ Stores user preferences              ✗ Operate wallets on behalf        │
│                                                                             │
│  USER'S ASSETS:                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                                │
│  │   Crypto.com    │    │     Kalshi      │                                │
│  │   (User's acct) │    │   (User's acct) │                                │
│  └────────┬────────┘    └────────┬────────┘                                │
│           │                      │                                          │
│           └───────┬──────────────┘                                          │
│                   │                                                         │
│           K2 reads data via OAuth                                           │
│           K2 submits orders via OAuth                                       │
│           User funds NEVER touch K2                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Regulatory Benefits

| Requirement | Custodial App | K2 (Non-Custodial) |
|-------------|---------------|---------------------|
| MSB Registration (FinCEN) | Required | **Likely Not Required** |
| State MTL (50 states) | Required (most states) | **Likely Not Required** |
| Qualified Custodian | Required | **Not Required** |
| State-by-state crypto licenses | Required | **Likely Not Required** |
| SOC 2 Type II | Expected | Recommended (not required) |
| Minimum Capital | Often required | **Not Required** |

### 2.3 Legal Caveats

> **DISCLAIMER:** This is not legal advice. Consult a licensed attorney specializing in fintech/crypto regulations before launch.

**Potential Risks Even in Non-Custodial Model:**

1. **"Control" Arguments**: If K2 has ability to execute on user's behalf, some regulators may argue K2 has constructive custody
2. **State Variation**: Some states (e.g., NY BitLicense) have broad definitions that might capture non-custodial apps
3. **CFTC Scope**: Routing event contracts may have implications even if Kalshi is the regulated entity
4. **Advertising**: Claims about trading may trigger broker-dealer scrutiny

**Mitigations:**
- Clear user disclosures about non-custodial nature
- User explicitly authorizes each order (no auto-trading)
- No "advice" or "recommendations" (information only)
- Legal review of all marketing materials

---

## 3. Event Contracts / Prediction Markets

### 3.1 Regulatory Framework

Event contracts in the US are regulated by the CFTC as derivatives. To offer them legally:

| Option | Description | Viability |
|--------|-------------|-----------|
| **DCM Registration** | Become a Designated Contract Market | $5M+, 2-3 years, not viable |
| **SEF Registration** | Swap Execution Facility | Institutional only |
| **Partner with DCM** | Route through Kalshi | ✅ **Recommended** |
| **Offshore** | Operate from non-US jurisdiction | Legal risk, not recommended |

### 3.2 Kalshi Partnership Model

Kalshi (Kalshi Exchange LLC) is a CFTC-registered DCM. Users trade event contracts directly with Kalshi; K2 is just an interface.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     KALSHI INTEGRATION MODEL                                │
│                                                                             │
│  USER                      K2                         KALSHI (DCM)          │
│  ────                      ──                         ───────────           │
│                                                                             │
│  1. Creates Kalshi account ─────────────────────────▶ Verifies identity    │
│     (KYC with Kalshi)                                 Holds USD balance    │
│                                                                             │
│  2. Links Kalshi to K2 ────▶ Stores OAuth tokens                           │
│                                                                             │
│  3. Views events in K2 ────▶ Fetches from Kalshi API                       │
│                                                                             │
│  4. Places order in K2 ────▶ Routes to Kalshi ──────▶ Executes trade       │
│                              (as user's agent)        Settles contract     │
│                                                                             │
│  REGULATORY RESPONSIBILITY:                                                 │
│  • KYC/AML: Kalshi                                                          │
│  • Trade execution: Kalshi                                                  │
│  • Customer funds: Kalshi                                                   │
│  • Market surveillance: Kalshi                                              │
│  • Disclosures: Kalshi (K2 must display)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 K2's Obligations for Event Contracts

Even as a routing interface, K2 must:

1. **Display Kalshi-required disclosures** (risk warnings, contract specs)
2. **Not provide advice** on which events to trade
3. **Not create proprietary markets** (only route to Kalshi's markets)
4. **Implement Kalshi's restrictions** (geo-fencing, etc.)
5. **Report suspicious activity** (if observed in K2 layer)

---

## 4. State-by-State Considerations

### 4.1 Crypto Trading Restrictions

| State | Restriction | K2 Impact |
|-------|-------------|-----------|
| **New York** | BitLicense required for most crypto activities | Block NY users OR rely on Crypto.com's license |
| **Hawaii** | Strict custody requirements | Block HI users if Crypto.com doesn't operate there |
| **Others** | Varies | Follow Crypto.com's geographic coverage |

### 4.2 Event Contract Restrictions

Kalshi has its own state-by-state restrictions. K2 must enforce the same:

```typescript
// Geo-restriction logic
const BLOCKED_STATES = {
  events: ["NY", "HI", "AL", "AK"], // Example - get actual list from Kalshi
  crypto: ["NY", "HI"]  // Example - get actual list from Crypto.com
};

function checkStateRestrictions(
  user: User,
  productType: "crypto" | "events"
): boolean {
  const userState = user.kycData?.state || user.ipLocation?.state;
  return !BLOCKED_STATES[productType].includes(userState);
}
```

### 4.3 Geo-Fencing Implementation

```typescript
// Multi-layer geo verification
interface GeoCheck {
  // Layer 1: IP-based (initial)
  ipCountry: string;
  ipState: string;

  // Layer 2: KYC-based (verified)
  kycCountry: string;
  kycState: string;

  // Layer 3: Phone-based (if available)
  phoneCountry?: string;
}

function isUserAllowed(geo: GeoCheck, product: string): boolean {
  // Use most reliable source
  const state = geo.kycState || geo.ipState;
  const country = geo.kycCountry || geo.ipCountry;

  // US only for MVP
  if (country !== "US") return false;

  // Check state restrictions
  return checkStateRestrictions({ state }, product);
}
```

---

## 5. Launch Paths

### 5.1 Path A: Pure Non-Custodial (Recommended for MVP)

**Description:** Users link their existing Crypto.com and Kalshi accounts. K2 is purely a UI layer.

**Timeline:** 8-12 weeks

**Regulatory Requirements:**
- Legal review of non-custodial claims
- Privacy policy and terms of service
- State restriction implementation
- Display required disclosures

**Pros:**
- Fastest to market
- Lowest regulatory burden
- No capital requirements

**Cons:**
- Fragmented UX (users need 2 external accounts)
- Limited to exchange OAuth capabilities
- Dependent on exchange API availability

**Architecture:**
```
User ──▶ K2 App ──▶ OAuth ──▶ Crypto.com
                 ──▶ OAuth ──▶ Kalshi
```

---

### 5.2 Path B: Custodial (Future State)

**Description:** K2 holds user funds, provides unified account.

**Timeline:** 12-18+ months

**Regulatory Requirements:**
- MSB Registration (FinCEN)
- State MTL (47+ states, costs $1-5M total)
- Qualified custodian partnership (Fireblocks, BitGo, Anchorage)
- SOC 2 Type II audit
- Compliance program (AML, KYC, etc.)
- State-specific crypto licenses (NY BitLicense, etc.)

**Pros:**
- Seamless UX
- Single account
- More control over user experience

**Cons:**
- Significant cost ($2-5M+)
- Long timeline (12-24 months for licenses)
- Ongoing compliance burden
- Custody risk/liability

**Architecture Changes:**
```
User ──▶ K2 App ──▶ K2 Backend ──▶ Qualified Custodian
                               ──▶ Crypto.com (as broker)
                               ──▶ Kalshi (as introducing broker)
```

---

### 5.3 Path C: Hybrid (Crypto.com Partnership)

**Description:** Partner with Crypto.com to white-label their services under K2 brand.

**Timeline:** 6-12 months (depends on partnership)

**Requirements:**
- Commercial agreement with Crypto.com
- May need introducing broker registration (depending on structure)
- Rely on Crypto.com's licenses

**Pros:**
- Better UX than pure non-custodial
- Faster than building full custodial
- Lower regulatory burden on K2

**Cons:**
- Dependent on Crypto.com partnership terms
- Revenue share with partner
- Less control

---

## 6. Compliance Checklist (MVP)

### 6.1 Before Launch

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Legal review of non-custodial model | ⬜ | External counsel | Critical path |
| Terms of Service | ⬜ | Legal | Include arbitration clause |
| Privacy Policy | ⬜ | Legal | CCPA/GDPR ready |
| Risk Disclosures | ⬜ | Product | Kalshi templates + crypto warnings |
| State restriction list | ⬜ | Legal + Engineering | From both exchanges |
| Geo-fencing implementation | ⬜ | Engineering | IP + KYC based |
| Age verification (18+) | ⬜ | Engineering | Via exchange KYC |
| Audit logging | ⬜ | Engineering | All trades, logins |

### 6.2 Ongoing

| Item | Frequency | Owner |
|------|-----------|-------|
| Review state law changes | Quarterly | Legal |
| Update disclosures | As needed | Compliance |
| Audit log review | Monthly | Compliance |
| Exchange API terms review | Quarterly | Legal |
| Privacy policy updates | As needed | Legal |

---

## 7. Disclosures Required

### 7.1 General Disclosures (All Users)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REQUIRED USER DISCLOSURES                               │
│                                                                             │
│  ONBOARDING:                                                                │
│  "K2 is a trading interface only. K2 does not hold your funds. Your        │
│   crypto assets are held at Crypto.com. Your event contract positions      │
│   are held at Kalshi. By using K2, you authorize us to submit orders       │
│   on your behalf to these exchanges."                                       │
│                                                                             │
│  CRYPTO TRADING:                                                            │
│  "Cryptocurrency trading involves substantial risk. Prices are volatile.   │
│   You may lose some or all of your investment. Past performance is not     │
│   indicative of future results. Only trade with funds you can afford       │
│   to lose."                                                                 │
│                                                                             │
│  EVENT CONTRACTS:                                                           │
│  "Event contracts are speculative products. You could lose your entire     │
│   investment. Event contracts are offered by Kalshi Exchange LLC, a        │
│   CFTC-registered Designated Contract Market. Read Kalshi's disclosures    │
│   before trading."                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Pre-Trade Disclosures

Display before every trade:
- Current price and estimated fill price
- Fees (exchange fees, K2 fees if any)
- Total cost / proceeds
- For events: Max loss = purchase amount

### 7.3 Kalshi-Specific Disclosures

Kalshi requires specific contract-level disclosures:
- Contract specifications
- Settlement source and methodology
- Expiration date and time
- Position limits

K2 must display these exactly as provided by Kalshi API.

---

## 8. Security & Privacy Compliance

### 8.1 Data Protection

| Data Type | Storage | Encryption | Retention |
|-----------|---------|------------|-----------|
| User credentials | K2 DB | Argon2 hash | Account lifetime |
| Exchange OAuth tokens | K2 DB | AES-256 (KMS) | Until revoked |
| Trade history | K2 DB | At-rest encryption | 7 years |
| Audit logs | S3 | At-rest + KMS | 7 years |
| Personal data (name, email) | K2 DB | At-rest encryption | Account + 5 years |

### 8.2 Privacy Compliance

**CCPA Requirements (California):**
- Right to know what data is collected
- Right to delete data
- Right to opt-out of sale (K2 does not sell data)
- Privacy policy disclosure

**Implementation:**
- Data export feature (user can download their data)
- Account deletion feature (with legal retention exemptions)
- Privacy settings in app
- Clear privacy policy

### 8.3 SOC 2 Preparation (Recommended)

Even if not required for non-custodial, SOC 2 builds trust:

| Control | Implementation |
|---------|----------------|
| Access Control | Role-based access, MFA for all systems |
| Encryption | TLS in transit, AES at rest |
| Monitoring | CloudWatch, alerting, log analysis |
| Incident Response | Documented procedures, on-call rotation |
| Change Management | Git-based, PR reviews, staging environment |

---

## 9. Risk Warnings Copy

### 9.1 Crypto Trading Warning

```
⚠️ CRYPTOCURRENCY RISK WARNING

Cryptocurrency trading is highly speculative and involves significant risk.

• Prices can be extremely volatile and may drop significantly in short periods
• You could lose some or all of your invested capital
• Cryptocurrencies are not legal tender and are not backed by any government
• Past performance is not a guarantee of future results
• Only invest what you can afford to lose completely

Crypto.com holds your cryptocurrency assets. K2 provides a trading interface only.
```

### 9.2 Event Contract Warning

```
⚠️ EVENT CONTRACT RISK WARNING

Event contracts are speculative instruments regulated by the CFTC.

• The maximum amount you can lose is your entire purchase amount
• Event contracts are binary - you either win a fixed amount or lose everything
• Prices reflect market probability estimates, not guaranteed outcomes
• Event contracts are offered by Kalshi Exchange LLC (CFTC-registered DCM)
• K2 routes your orders to Kalshi; K2 does not hold your funds

Read Kalshi's full risk disclosure before trading: [link]
```

---

## 10. Compliance Contacts

| Need | Resource |
|------|----------|
| Crypto regulatory questions | Engage fintech counsel (e.g., Anderson Kill, Debevoise) |
| CFTC / derivatives questions | Engage derivatives counsel |
| State money transmitter | Engage MTL specialist (e.g., Kilpatrick Townsend) |
| Privacy / data protection | Engage privacy counsel |
| Kalshi integration questions | Kalshi partner support |
| Crypto.com integration questions | Crypto.com partner support |

