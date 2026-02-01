# QA Checklist - Meru Trading App

Use this checklist when performing QA. Check items in order of priority (high-weight patterns first).

## Pre-QA Setup
- [ ] Read `patterns.json` and note high-weight patterns
- [ ] Check `session-log.md` for recent issues
- [ ] Note current score in `metrics.json`

---

## 1. Transaction Safety (CRITICAL)

### Balance Validation
- [ ] **P003** Buy orders check cash balance BEFORE execution
- [ ] **P003** Sell orders check holdings BEFORE execution
- [ ] **P003** Send crypto checks holdings BEFORE execution
- [ ] **P019** Deposits increase cash balance correctly
- [ ] **P019** Withdrawals decrease cash balance correctly

### Order Execution
- [ ] **P009** Buy/Sell buttons have double-tap protection
- [ ] **P010** Large orders (>$1000) require confirmation
- [ ] **P018** Trades update BOTH quantity AND cost basis
- [ ] **P002** Division by zero protected in price calculations

### Portfolio Integrity
- [ ] **P018** Holdings quantity matches after buy/sell
- [ ] **P018** Average cost calculated correctly
- [ ] Portfolio total = sum of all holdings + cash balance

---

## 2. Input Validation (HIGH)

### Numeric Inputs
- [ ] **P001** Amount fields reject non-numeric characters
- [ ] **P001** Amount fields reject multiple decimal points
- [ ] **P001** Amount fields handle negative values
- [ ] **P011** parseFloat handles NaN gracefully
- [ ] **P014** Floating point precision handled with toFixed()

### Address Validation
- [ ] **P012** BTC addresses validated (starts with 1, 3, or bc1)
- [ ] **P012** ETH addresses validated (starts with 0x, 42 chars)
- [ ] **P012** SOL addresses validated (32-44 chars base58)
- [ ] **P012** Wrong chain address rejected with clear error

### Dollar Amount Orders
- [ ] **P001** Minimum order is $1.00
- [ ] **P013** Market order slippage warning shown
- [ ] **P002** Zero price doesn't cause divide by zero

---

## 3. State Management (HIGH)

### Zustand Stores
- [ ] **P004** State updates spread existing state correctly
- [ ] **P016** Persisted state handles schema changes
- [ ] **P017** Optional chaining used appropriately

### React Hooks
- [ ] **P008** useCallback/useMemo have all dependencies
- [ ] **P005** Async operations cleaned up on unmount
- [ ] No stale closures in event handlers

---

## 4. Navigation & UX (MEDIUM)

### Navigation
- [ ] **P006** Route names match RootNavigator exactly
- [ ] Back button works correctly on all screens
- [ ] Deep links handled properly

### Display
- [ ] **P007** Small prices display correctly (0.0001)
- [ ] **P007** Large prices display correctly (67,234.89)
- [ ] Currency formatting consistent ($1,234.56)
- [ ] Quantity formatting removes trailing zeros

### Error Handling
- [ ] **P015** API errors show user-friendly messages
- [ ] Network errors handled gracefully
- [ ] Loading states shown during async operations

---

## 5. Compliance (HIGH)

### KYC
- [ ] **P020** Deposits blocked for unverified users
- [ ] **P020** Withdrawals blocked for unverified users
- [ ] KYC status displayed in Settings

### Disclosures
- [ ] **P013** Market order disclosure shown
- [ ] Risk warnings displayed for crypto trading
- [ ] Event contract settlement rules explained

---

## 6. Specific Flows to Test

### Buy Flow (Dollar Mode)
1. [ ] Enter dollar amount → quantity calculated correctly
2. [ ] Limit orders disabled in dollar mode
3. [ ] Market order disclosure shown
4. [ ] Cash balance checked
5. [ ] Confirmation for large orders
6. [ ] Portfolio updated after execution

### Buy Flow (Quantity Mode)
1. [ ] Enter quantity → total calculated correctly
2. [ ] Limit orders allowed
3. [ ] Cash balance checked
4. [ ] Portfolio updated after execution

### Sell Flow
1. [ ] Holdings balance shown
2. [ ] Cannot sell more than owned
3. [ ] Cash balance increases after sale
4. [ ] Holdings decrease correctly

### Send Crypto Flow
1. [ ] Address validation per chain
2. [ ] Holdings checked before send
3. [ ] Network fee displayed
4. [ ] Confirmation required
5. [ ] Holdings decrease after send

### Deposit Flow
1. [ ] KYC check before deposit
2. [ ] Payment method selection works
3. [ ] Amount validation (min $10)
4. [ ] Cash balance increases after deposit
5. [ ] Transaction appears in history

### Withdraw Flow
1. [ ] Cash balance shown
2. [ ] Cannot withdraw more than balance
3. [ ] Destination selection works
4. [ ] Cash balance decreases after withdrawal

---

## Post-QA

- [ ] Log all findings to `session-log.md`
- [ ] Update pattern weights in `patterns.json`
- [ ] Calculate and update score in `metrics.json`
- [ ] Add new patterns for novel bugs
- [ ] Commit fixes with descriptive messages
