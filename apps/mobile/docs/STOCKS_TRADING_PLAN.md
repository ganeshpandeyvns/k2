# Meru Stock Trading Integration Plan

## Executive Summary

Add US equities (stocks) trading to the Meru platform alongside existing crypto and predictive markets. Orders will be routed through DriveWealth's brokerage-as-a-service API for execution, clearing, and custody.

---

## Current Architecture Analysis

### Existing Asset Types
| Asset Type | Order Flow | Settlement | Backend |
|------------|------------|------------|---------|
| **Crypto** | `api.createOrder()` → Demo/Mock | Simulated instant | Local demo mode |
| **Events** | `api.createOrder()` → Demo/Mock | Binary $1/$0 | Local demo mode |

### Current Order Structure
```typescript
// src/services/api.ts
createOrder({
  instrument: string;      // 'BTC-USD' or 'FED-RATE-MAR'
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: string;
  price?: string;
  eventSide?: 'yes' | 'no';
})
```

### Key Files to Modify
- `src/services/api.ts` - Add stock endpoints
- `src/screens/TradeScreen.tsx` - Stock trading UI
- `src/screens/MarketsScreen.tsx` - Stock discovery
- `src/screens/InstrumentDetailScreen.tsx` - Stock detail page
- `src/store/portfolioStore.ts` - Stock holdings
- `src/navigation/RootNavigator.tsx` - Navigation types

---

## DriveWealth Integration Overview

### What is DriveWealth?
DriveWealth is a B2B brokerage infrastructure provider that enables fintechs to offer stock trading through APIs. They handle:
- **Execution**: Order routing to exchanges
- **Clearing**: Trade settlement (T+1 for equities)
- **Custody**: Holding customer assets
- **Compliance**: Tax reporting, regulatory filings
- **Fractional Shares**: Trading as little as $1 worth of any stock

### Integration Model: Fully Disclosed
DriveWealth manages all brokerage functions:
- Customer accounts opened with DriveWealth
- DriveWealth generates statements/tax docs
- DriveWealth handles corporate actions (dividends, splits)
- Meru focuses on UX, DriveWealth handles compliance

### API Authentication
```
Headers:
  dw-client-app-key: <partner_api_key>
  dw-auth-token: <session_token>
  Authorization: Bearer <jwt_token>
```

---

## Backend Service Architecture

### New Service: `trading-service`

```
/services/trading/
├── src/
│   ├── drivewealth/
│   │   ├── client.ts           # DriveWealth API client
│   │   ├── orders.ts           # Order management
│   │   ├── accounts.ts         # Account management
│   │   ├── instruments.ts      # Stock data/quotes
│   │   └── webhooks.ts         # Order status updates
│   ├── routes/
│   │   ├── orders.ts           # POST /orders, GET /orders/:id
│   │   ├── instruments.ts      # GET /instruments/stocks
│   │   └── accounts.ts         # Account linking
│   ├── models/
│   │   ├── Order.ts
│   │   ├── Position.ts
│   │   └── Account.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### DriveWealth API Client

```typescript
// services/trading/src/drivewealth/client.ts
class DriveWealthClient {
  private baseUrl = 'https://bo-api.drivewealth.io/back-office';
  private apiKey: string;
  private authToken: string;

  // Account Management
  async createUser(userData: UserData): Promise<DWUser>;
  async createAccount(userId: string, accountType: string): Promise<DWAccount>;
  async getAccount(accountNo: string): Promise<DWAccount>;

  // Orders
  async createOrder(order: DWOrderRequest): Promise<DWOrder>;
  async getOrder(orderId: string): Promise<DWOrder>;
  async cancelOrder(orderId: string): Promise<void>;

  // Positions & Balances
  async getPositions(accountNo: string): Promise<DWPosition[]>;
  async getBalances(accountNo: string): Promise<DWBalances>;

  // Instruments
  async searchInstruments(query: string): Promise<DWInstrument[]>;
  async getQuote(symbol: string): Promise<DWQuote>;
  async getBatchQuotes(symbols: string[]): Promise<DWQuote[]>;
}
```

### DriveWealth Order Request

```typescript
// Order request to DriveWealth
interface DWOrderRequest {
  accountNo: string;           // DriveWealth account number
  symbol: string;              // 'AAPL', 'TSLA', etc.
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';

  // Quantity (one required)
  quantity?: number;           // Share count (fractional allowed)
  amountCash?: number;         // Dollar amount for notional orders

  // Price (for limit/stop orders)
  price?: number;              // Limit price
  stopPrice?: number;          // Stop trigger price

  // Options
  timeInForce?: 'DAY' | 'GTC' | 'GTX';  // GTX = extended hours
  extendedHours?: boolean;     // Pre/post market
  commission?: number;         // Fee to charge
}

// Order response from DriveWealth
interface DWOrder {
  id: string;                  // DriveWealth order ID
  accountNo: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: string;
  status: 'NEW' | 'FILLED' | 'PARTIAL_FILL' | 'CANCELLED' | 'REJECTED';
  quantity: number;
  filledQuantity: number;
  averagePrice: number;
  createdAt: string;
  updatedAt: string;
}
```

### Order Status Webhooks

DriveWealth sends webhooks for order updates:

```typescript
// Webhook payload
interface DWWebhookPayload {
  type: 'ORDER_UPDATED' | 'ORDER_FILLED' | 'ORDER_CANCELLED';
  data: {
    orderId: string;
    status: string;
    filledQuantity: number;
    averagePrice: number;
    timestamp: string;
  };
}

// Webhook handler
app.post('/webhooks/drivewealth', async (req, res) => {
  const { type, data } = req.body;

  switch (type) {
    case 'ORDER_FILLED':
      await updatePortfolioPosition(data);
      await notifyUser(data);
      break;
    case 'ORDER_CANCELLED':
      await handleCancellation(data);
      break;
  }

  res.status(200).send('OK');
});
```

---

## Mobile App Changes

### 1. New Asset Type: Stocks

```typescript
// src/types/instrument.ts
type AssetType = 'crypto' | 'event' | 'stock';

interface StockInstrument {
  symbol: string;           // 'AAPL'
  name: string;             // 'Apple Inc.'
  exchange: string;         // 'NASDAQ'
  type: 'stock';
  tradeable: boolean;
  fractionalEnabled: boolean;
}
```

### 2. API Service Updates

```typescript
// src/services/api.ts - New endpoints

// Stock instruments
getStocks(): Promise<StockInstrument[]>;
searchStocks(query: string): Promise<StockInstrument[]>;
getStockQuote(symbol: string): Promise<StockQuote>;

// Stock orders (routed to DriveWealth via backend)
createStockOrder(order: StockOrderRequest): Promise<Order>;

interface StockOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';

  // Quantity mode
  amountType: 'dollars' | 'shares';
  amount: number;           // Dollar amount OR share count

  // Limit orders
  limitPrice?: number;

  // Extended hours
  extendedHours?: boolean;
}
```

### 3. Markets Screen - Stocks Tab

```typescript
// src/screens/MarketsScreen.tsx
const MARKET_TABS = ['Crypto', 'Stocks', 'Events'];

// Stock categories
const STOCK_SECTIONS = [
  { title: 'Popular', symbols: ['AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT'] },
  { title: 'Tech', symbols: ['NVDA', 'META', 'NFLX', 'CRM', 'ORCL'] },
  { title: 'Finance', symbols: ['JPM', 'BAC', 'GS', 'V', 'MA'] },
  { title: 'Healthcare', symbols: ['JNJ', 'UNH', 'PFE', 'MRK', 'ABBV'] },
];
```

### 4. Stock Detail Screen

```typescript
// src/screens/InstrumentDetailScreen.tsx - Stock-specific sections

// Company info card
<View style={styles.companyInfo}>
  <Text style={styles.companyName}>{stock.name}</Text>
  <Text style={styles.exchange}>{stock.exchange}</Text>
  <Text style={styles.sector}>{stock.sector}</Text>
</View>

// Market status indicator
<View style={styles.marketStatus}>
  {isMarketOpen ? (
    <Text style={styles.openBadge}>Market Open</Text>
  ) : (
    <Text style={styles.closedBadge}>Market Closed</Text>
  )}
  {extendedHoursAvailable && (
    <Text style={styles.extendedBadge}>Extended Hours</Text>
  )}
</View>

// Key stats
<View style={styles.stats}>
  <StatRow label="Market Cap" value={formatMarketCap(stock.marketCap)} />
  <StatRow label="P/E Ratio" value={stock.peRatio?.toFixed(2) || 'N/A'} />
  <StatRow label="52W High" value={formatCurrency(stock.high52w)} />
  <StatRow label="52W Low" value={formatCurrency(stock.low52w)} />
  <StatRow label="Avg Volume" value={formatVolume(stock.avgVolume)} />
  <StatRow label="Dividend Yield" value={formatPercent(stock.dividendYield)} />
</View>
```

### 5. Trade Screen - Stock Mode

```typescript
// src/screens/TradeScreen.tsx - Stock-specific logic

// Market hours check
const isMarketOpen = checkMarketHours();
const canTradeExtended = stock.extendedHoursEnabled;

// Order types for stocks
const STOCK_ORDER_TYPES = [
  { value: 'market', label: 'Market Order' },
  { value: 'limit', label: 'Limit Order' },
];

// Time in force options
const TIME_IN_FORCE = [
  { value: 'day', label: 'Day Only' },
  { value: 'gtc', label: 'Good Till Cancelled' },
];

// Extended hours toggle
{!isMarketOpen && canTradeExtended && (
  <View style={styles.extendedHoursToggle}>
    <Text>Trade in Extended Hours</Text>
    <Switch value={extendedHours} onValueChange={setExtendedHours} />
    <Text style={styles.disclaimer}>
      Extended hours trading has additional risks
    </Text>
  </View>
)}

// Settlement notice
<View style={styles.settlementNotice}>
  <Text style={styles.noticeText}>
    Stock trades settle in 1 business day (T+1)
  </Text>
</View>
```

### 6. Portfolio Store Updates

```typescript
// src/store/portfolioStore.ts

interface StockHolding extends Holding {
  type: 'stock';
  symbol: string;
  shares: number;
  avgCost: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;

  // DriveWealth-specific
  dwAccountNo: string;
  costBasis: number;        // For tax purposes
}

// Actions
interface PortfolioActions {
  // Existing
  executeBuy: (asset: string, quantity: number, price: number) => void;
  executeSell: (asset: string, quantity: number, price: number) => void;

  // New for stocks
  syncStockPositions: () => Promise<void>;  // Fetch from DriveWealth
  updateStockPosition: (position: StockHolding) => void;
}
```

---

## Account Linking Flow

### DriveWealth Account Creation

Users need a DriveWealth brokerage account to trade stocks:

```
1. User taps "Enable Stock Trading" in Settings
2. Collect required KYC info (if not already verified)
3. Call DriveWealth Users API to create user
4. Call DriveWealth Accounts API to create brokerage account
5. Store DriveWealth account number in user profile
6. Enable stock trading features
```

### Required KYC Fields

```typescript
interface StockTradingKYC {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: 'US';  // US residents only initially

  // Identity
  dateOfBirth: string;
  ssn: string;  // Full SSN required for brokerage

  // Employment
  employmentStatus: 'employed' | 'self_employed' | 'retired' | 'student' | 'unemployed';
  employer?: string;
  occupation?: string;

  // Investor Profile
  investmentExperience: 'none' | 'limited' | 'moderate' | 'extensive';
  investmentObjective: 'growth' | 'income' | 'speculation' | 'preservation';
  riskTolerance: 'low' | 'medium' | 'high';
  annualIncome: string;  // Range
  netWorth: string;      // Range
  liquidNetWorth: string;
}
```

---

## Market Hours & Extended Trading

### Regular Market Hours
- **Pre-Market**: 4:00 AM - 9:30 AM ET
- **Regular Hours**: 9:30 AM - 4:00 PM ET
- **After-Hours**: 4:00 PM - 8:00 PM ET

### Extended Hours Considerations
```typescript
// src/utils/marketHours.ts

interface MarketStatus {
  isOpen: boolean;
  session: 'pre' | 'regular' | 'after' | 'closed';
  nextOpen: Date;
  nextClose: Date;
}

function getMarketStatus(): MarketStatus {
  const now = new Date();
  const et = convertToET(now);

  // Check holidays
  if (isMarketHoliday(et)) {
    return { isOpen: false, session: 'closed', ... };
  }

  // Check weekend
  if (isWeekend(et)) {
    return { isOpen: false, session: 'closed', ... };
  }

  // Check time of day
  const hour = et.getHours();
  const minute = et.getMinutes();
  const time = hour * 60 + minute;

  if (time >= 4*60 && time < 9*60+30) {
    return { isOpen: true, session: 'pre', ... };
  }
  if (time >= 9*60+30 && time < 16*60) {
    return { isOpen: true, session: 'regular', ... };
  }
  if (time >= 16*60 && time < 20*60) {
    return { isOpen: true, session: 'after', ... };
  }

  return { isOpen: false, session: 'closed', ... };
}
```

### Extended Hours UI Warning

```typescript
// Show warning for extended hours orders
{marketStatus.session !== 'regular' && (
  <View style={styles.extendedWarning}>
    <Text style={styles.warningIcon}>⚠️</Text>
    <Text style={styles.warningText}>
      Extended hours trading involves additional risks including lower
      liquidity, higher volatility, and wider spreads. Prices may differ
      significantly from regular market hours.
    </Text>
  </View>
)}
```

---

## Data Flow Architecture

### Order Submission Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                                                                  │
│  TradeScreen                                                     │
│       │                                                          │
│       ▼                                                          │
│  Validation (balance, quantity, market hours)                   │
│       │                                                          │
│       ▼                                                          │
│  api.createStockOrder({ symbol, side, amount, type })           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MERU BACKEND                                │
│                                                                  │
│  POST /v1/orders/stocks                                         │
│       │                                                          │
│       ▼                                                          │
│  1. Validate user has DriveWealth account                       │
│  2. Check buying power / holdings                               │
│  3. Transform to DriveWealth format                             │
│       │                                                          │
│       ▼                                                          │
│  DriveWealthClient.createOrder()                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DRIVEWEALTH                                 │
│                                                                  │
│  POST /back-office/orders                                       │
│       │                                                          │
│       ▼                                                          │
│  Order Routing → Exchange Execution → Clearing → Settlement     │
│       │                                                          │
│       ▼                                                          │
│  Webhook: ORDER_FILLED                                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MERU BACKEND                                │
│                                                                  │
│  POST /webhooks/drivewealth                                     │
│       │                                                          │
│       ▼                                                          │
│  1. Update order status in DB                                   │
│  2. Update user positions                                       │
│  3. Push notification to user                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Quote Data Flow

```
Mobile App                    Meru Backend               DriveWealth / Data Provider
    │                              │                              │
    │  GET /instruments/stocks     │                              │
    │────────────────────────────▶│                              │
    │                              │  GET /instruments            │
    │                              │────────────────────────────▶│
    │                              │◀────────────────────────────│
    │◀────────────────────────────│                              │
    │                              │                              │
    │  GET /quotes/AAPL            │                              │
    │────────────────────────────▶│                              │
    │                              │  GET /quotes/{symbol}        │
    │                              │────────────────────────────▶│
    │                              │◀────────────────────────────│
    │◀────────────────────────────│                              │
```

---

## UI/UX Considerations

### 1. Asset Type Indicator
Clear visual distinction between asset types:
```
┌─────────────────────────────────────┐
│ AAPL                    [STOCK]    │  ← Blue badge
│ Apple Inc.                          │
│ $178.45  +2.34%                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ BTC-USD                 [CRYPTO]   │  ← Orange badge
│ Bitcoin                             │
│ $67,234.89  +1.23%                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ FED-RATE-MAR            [EVENT]    │  ← Purple badge
│ Fed Rate Cut - March                │
│ 42¢ Yes  +8.5%                     │
└─────────────────────────────────────┘
```

### 2. Market Status Banner
```
┌─────────────────────────────────────┐
│ 🟢 Market Open                      │  Regular hours
│    Closes in 2h 34m                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🟡 After Hours Trading              │  Extended hours
│    Regular market opens in 14h 22m  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔴 Market Closed                    │  Closed
│    Opens Monday 9:30 AM ET          │
└─────────────────────────────────────┘
```

### 3. Fractional Shares Messaging
```
┌─────────────────────────────────────┐
│  Buy AAPL                           │
│                                     │
│  $100.00                            │
│  ≈ 0.5607 shares @ $178.35         │
│                                     │
│  💡 You can buy fractional shares   │
│     starting at just $1.00          │
└─────────────────────────────────────┘
```

### 4. Settlement Time Notice
```
┌─────────────────────────────────────┐
│  ⓘ Stocks settle in 1 business day │
│    Funds available: Tomorrow        │
└─────────────────────────────────────┘
```

---

## Regulatory & Compliance

### Requirements
1. **Brokerage Account**: Each user needs a DriveWealth brokerage account
2. **KYC/AML**: Full identity verification required (SSN, address proof)
3. **Suitability**: Collect investment profile information
4. **Disclosures**: Present required brokerage disclosures
5. **PDT Rule**: Pattern Day Trader restrictions for accounts < $25K

### Disclosure Screens
- Brokerage Account Agreement
- Fractional Share Disclosure
- Extended Hours Trading Risks
- Order Execution Disclosure
- Payment for Order Flow Disclosure

### Tax Reporting
DriveWealth handles:
- 1099-B (cost basis reporting)
- 1099-DIV (dividend income)
- Corporate actions (splits, mergers)

---

## Demo Mode for Stocks

### Mock Stock Data
```typescript
// src/utils/mockStockData.ts
export const DEMO_STOCKS: StockInstrument[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', price: 178.45 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', price: 245.67 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', price: 178.23 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', price: 141.89 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', price: 378.91 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', price: 721.33 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', price: 485.12 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', price: 198.45 },
  // ... more stocks
];

export const DEMO_STOCK_PRICES: Record<string, StockQuote> = {
  AAPL: { price: 178.45, change: 2.34, changePercent: 1.33, volume: 52_340_000 },
  TSLA: { price: 245.67, change: -5.23, changePercent: -2.08, volume: 98_120_000 },
  // ... more quotes
};
```

### Simulated Order Execution
```typescript
// In demo mode, simulate stock order execution
async simulateStockOrder(order: StockOrderRequest): Promise<Order> {
  // Simulate network delay
  await sleep(1500);

  const quote = DEMO_STOCK_PRICES[order.symbol];
  const filledPrice = order.orderType === 'market'
    ? quote.price
    : order.limitPrice!;

  const filledQuantity = order.amountType === 'dollars'
    ? order.amount / filledPrice
    : order.amount;

  return {
    id: generateOrderId(),
    symbol: order.symbol,
    side: order.side,
    status: 'FILLED',
    filledQuantity,
    averagePrice: filledPrice,
    createdAt: new Date().toISOString(),
  };
}
```

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1-2)
1. Create `trading-service` with DriveWealth client
2. Implement order creation endpoint
3. Implement webhook handler for order updates
4. Set up DriveWealth sandbox environment
5. Create account linking flow

### Phase 2: Mobile - Stock Discovery (Week 2-3)
1. Add "Stocks" tab to MarketsScreen
2. Implement stock search functionality
3. Create StockDetailScreen
4. Add stock price charts
5. Demo mode with mock stock data

### Phase 3: Mobile - Stock Trading (Week 3-4)
1. Update TradeScreen for stocks
2. Add market hours checking
3. Implement extended hours toggle
4. Add fractional share support
5. Order confirmation flow

### Phase 4: Portfolio Integration (Week 4-5)
1. Display stock holdings in portfolio
2. Real-time P&L tracking
3. Position synchronization with DriveWealth
4. Transaction history for stocks

### Phase 5: Account Onboarding (Week 5-6)
1. DriveWealth KYC collection screens
2. Brokerage agreement acceptance
3. Account activation flow
4. Error handling and retry logic

### Phase 6: Polish & Testing (Week 6-7)
1. End-to-end testing with DriveWealth sandbox
2. Error handling improvements
3. Loading states and animations
4. Performance optimization

---

## API Endpoints Summary

### New Mobile → Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/instruments/stocks` | List available stocks |
| GET | `/v1/instruments/stocks/search?q=` | Search stocks |
| GET | `/v1/instruments/stocks/:symbol` | Stock details |
| GET | `/v1/instruments/stocks/:symbol/quote` | Real-time quote |
| POST | `/v1/orders/stocks` | Create stock order |
| GET | `/v1/orders/stocks/:id` | Get order status |
| DELETE | `/v1/orders/stocks/:id` | Cancel order |
| GET | `/v1/portfolio/stocks` | Stock positions |
| GET | `/v1/market/status` | Market hours status |
| POST | `/v1/accounts/brokerage/create` | Create DW account |
| GET | `/v1/accounts/brokerage/status` | Check DW account status |

### Backend → DriveWealth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create user |
| POST | `/accounts` | Create brokerage account |
| GET | `/accounts/:accountNo` | Get account details |
| POST | `/orders` | Create order |
| GET | `/orders/:orderId` | Get order status |
| DELETE | `/orders/:orderId` | Cancel order |
| GET | `/accounts/:accountNo/positions` | Get positions |
| GET | `/accounts/:accountNo/balances` | Get balances |
| GET | `/instruments` | Search instruments |
| GET | `/marketdata/quotes` | Get quotes |

---

## Risk Considerations

### Technical Risks
1. **API Latency**: DriveWealth API calls add latency to order flow
2. **Webhook Reliability**: Order updates depend on webhook delivery
3. **Rate Limits**: DriveWealth may have API rate limits
4. **Downtime**: Exchange/DriveWealth outages affect trading

### Business Risks
1. **Regulatory Compliance**: Must adhere to SEC/FINRA rules
2. **Customer Complaints**: Real money means real complaints
3. **Settlement Failures**: T+1 settlement introduces risk
4. **Corporate Actions**: Dividends, splits require handling

### Mitigations
1. Implement retry logic with exponential backoff
2. Add fallback polling for missed webhooks
3. Cache quotes locally to reduce API calls
4. Build robust error handling and user messaging
5. Partner with DriveWealth support for compliance guidance

---

## Success Metrics

1. **Order Success Rate**: > 99% of orders successfully submitted
2. **Order Fill Rate**: > 98% of market orders filled immediately
3. **Quote Latency**: < 500ms for real-time quotes
4. **User Adoption**: X% of users enable stock trading within 30 days
5. **Trading Volume**: $X in stock trading volume per month

---

## Open Questions

1. **Data Provider**: Use DriveWealth for quotes or separate provider (Polygon, IEX)?
2. **Fractional Limits**: Minimum order size? ($1? $5?)
3. **Extended Hours**: Enable from day 1 or phase in later?
4. **Options**: Future roadmap for options trading?
5. **International**: Non-US users? Different regulations?

---

## References

- [DriveWealth Developer Portal](https://developer.drivewealth.com/)
- [DriveWealth API Reference](https://developer.drivewealth.com/apis/reference/post_orders)
- [DriveWealth Integration Guide](https://developer.drivewealth.com/implementation/docs/step-6-placing-trades-orders-overview)
- [DriveWealth Account Opening](https://developer.drivewealth.com/apis/docs/opening-accounts)
