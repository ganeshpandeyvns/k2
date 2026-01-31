# K2 System Architecture

## 1. Architecture Overview

### 1.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   iOS App   │  │ Android App │  │   Web App   │                         │
│  │ React Native│  │ React Native│  │    React    │                         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                         │
└─────────┼────────────────┼────────────────┼─────────────────────────────────┘
          └────────────────┼────────────────┘
                           │ HTTPS/WSS
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EDGE LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CDN (CloudFront/Cloudflare)                  │   │
│  │                    Static Assets, API Caching, DDoS                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         WAF (Rate Limiting, IP Filtering)            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway (Kong / AWS API Gateway)              │   │
│  │        • JWT Validation  • Rate Limiting  • Request Routing          │   │
│  │        • Request/Response Logging  • Geo-blocking                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┬─────────────────┐
          ▼                ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION SERVICES                                │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │     Auth     │  │    User      │  │  Portfolio   │  │   Trading    │   │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │   │
│  │              │  │              │  │              │  │              │   │
│  │ • Login/Reg  │  │ • Profile    │  │ • Balances   │  │ • Orders     │   │
│  │ • OAuth      │  │ • Settings   │  │ • Positions  │  │ • Execution  │   │
│  │ • 2FA        │  │ • KYC Status │  │ • P&L Calc   │  │ • Routing    │   │
│  │ • Sessions   │  │ • Preferences│  │ • History    │  │ • Risk Check │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Market Data │  │ Notification │  │   Watchlist  │  │    Alerts    │   │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │   │
│  │              │  │              │  │              │  │              │   │
│  │ • Price Feed │  │ • Push       │  │ • Lists      │  │ • Price      │   │
│  │ • WebSocket  │  │ • Email      │  │ • Sharing    │  │ • Events     │   │
│  │ • Caching    │  │ • In-App     │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXCHANGE INTEGRATION LAYER                             │
│                                                                             │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │     Crypto.com Adapter         │  │       Kalshi Adapter           │   │
│  │                                │  │                                │   │
│  │ • REST Client                  │  │ • REST Client                  │   │
│  │ • WebSocket Client             │  │ • WebSocket Client             │   │
│  │ • OAuth Token Manager          │  │ • API Key Manager              │   │
│  │ • Order Translation            │  │ • Event Contract Mapping       │   │
│  │ • Rate Limit Handling          │  │ • Rate Limit Handling          │   │
│  │ • Retry Logic                  │  │ • Retry Logic                  │   │
│  └────────────────────────────────┘  └────────────────────────────────┘   │
│                 │                                   │                      │
└─────────────────┼───────────────────────────────────┼──────────────────────┘
                  ▼                                   ▼
         ┌────────────────┐                  ┌────────────────┐
         │  Crypto.com    │                  │     Kalshi     │
         │  Exchange API  │                  │    DCM API     │
         └────────────────┘                  └────────────────┘
```

### 1.2 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA STORES                                       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        PRIMARY DATABASE                               │  │
│  │                    PostgreSQL (RDS / Cloud SQL)                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │  Users  │  │ Exchange│  │ Orders  │  │Watchlist│  │ Alerts  │   │  │
│  │  │         │  │ Links   │  │(mirror) │  │         │  │         │   │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐                         │
│  │   CACHE (Redis)     │  │  MESSAGE QUEUE      │                         │
│  │                     │  │  (SQS / Redis)      │                         │
│  │ • Session tokens    │  │                     │                         │
│  │ • Price cache       │  │ • Order events      │                         │
│  │ • Rate limit state  │  │ • Notifications     │                         │
│  │ • Exchange tokens   │  │ • Webhook delivery  │                         │
│  └─────────────────────┘  └─────────────────────┘                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      AUDIT LOG (Immutable)                           │   │
│  │               CloudWatch Logs / S3 with Object Lock                  │   │
│  │                                                                       │   │
│  │  • All API requests  • All order actions  • All auth events          │   │
│  │  • Exchange API calls  • Error events  • Admin actions               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Specifications

### 2.1 Auth Service

**Responsibilities:**
- User registration and login
- OAuth integration (Google, Apple)
- Exchange account linking (Crypto.com, Kalshi OAuth)
- JWT token issuance and validation
- Two-factor authentication (TOTP)
- Session management

**Technology:** Node.js + TypeScript

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Email/password login |
| POST | /auth/oauth/google | Google OAuth callback |
| POST | /auth/oauth/apple | Apple OAuth callback |
| GET | /auth/link/cryptocom/initiate | Start Crypto.com OAuth |
| GET | /auth/link/cryptocom/callback | Complete Crypto.com link |
| GET | /auth/link/kalshi/initiate | Start Kalshi OAuth |
| GET | /auth/link/kalshi/callback | Complete Kalshi link |
| POST | /auth/2fa/enable | Enable TOTP 2FA |
| POST | /auth/2fa/verify | Verify 2FA code |
| POST | /auth/logout | Invalidate session |
| GET | /auth/sessions | List active sessions |
| DELETE | /auth/sessions/:id | Revoke session |

**Database Schema:**

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),  -- null for OAuth-only users
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    email_verified  BOOLEAN DEFAULT FALSE,
    totp_secret     VARCHAR(255),  -- encrypted
    totp_enabled    BOOLEAN DEFAULT FALSE
);

CREATE TABLE oauth_providers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    provider        VARCHAR(50) NOT NULL,  -- 'google', 'apple'
    provider_user_id VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

CREATE TABLE exchange_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    exchange        VARCHAR(50) NOT NULL,  -- 'cryptocom', 'kalshi'
    access_token    TEXT NOT NULL,  -- encrypted
    refresh_token   TEXT,  -- encrypted
    token_expires_at TIMESTAMP,
    exchange_user_id VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    status          VARCHAR(20) DEFAULT 'active',  -- active, revoked, expired
    UNIQUE(user_id, exchange)
);

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    token_hash      VARCHAR(255) NOT NULL,
    device_info     JSONB,
    ip_address      INET,
    created_at      TIMESTAMP DEFAULT NOW(),
    expires_at      TIMESTAMP NOT NULL,
    last_used_at    TIMESTAMP DEFAULT NOW()
);
```

---

### 2.2 Trading Service

**Responsibilities:**
- Order submission and management
- Pre-trade risk checks
- Order routing to appropriate exchange
- Order status tracking
- Trade history aggregation

**Technology:** Node.js + TypeScript

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| POST | /orders | Submit new order |
| GET | /orders | List orders (with filters) |
| GET | /orders/:id | Get order details |
| DELETE | /orders/:id | Cancel order |
| GET | /orders/:id/executions | Get fills for order |
| GET | /trades | Trade history |

**Order Submission Flow:**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   Trading   │───▶│    Risk     │───▶│  Exchange   │
│   Request   │    │   Service   │    │   Engine    │    │   Adapter   │
└─────────────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
                          │                  │                   │
                   1. Validate        2. Check limits     3. Submit to
                      request            & exposure          exchange
                          │                  │                   │
                          ▼                  ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                   │ Parse order │    │ Max order   │    │ Translate   │
                   │ Assign ID   │    │ Notional    │    │ to exchange │
                   │ Log request │    │ Velocity    │    │ format      │
                   └─────────────┘    │ Fat finger  │    │ Send via    │
                                      └─────────────┘    │ REST/WS     │
                                                         └─────────────┘
```

**Database Schema:**

```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    client_order_id VARCHAR(50) UNIQUE NOT NULL,  -- idempotency key
    exchange        VARCHAR(50) NOT NULL,  -- 'cryptocom', 'kalshi'
    exchange_order_id VARCHAR(100),  -- ID from exchange

    -- Order details
    instrument      VARCHAR(50) NOT NULL,  -- 'BTC-USD', 'KXBTC-24DEC31-B100000'
    instrument_type VARCHAR(20) NOT NULL,  -- 'crypto', 'event'
    side            VARCHAR(10) NOT NULL,  -- 'buy', 'sell'
    order_type      VARCHAR(20) NOT NULL,  -- 'market', 'limit'
    quantity        DECIMAL(20, 8) NOT NULL,
    price           DECIMAL(20, 8),  -- null for market orders

    -- Status
    status          VARCHAR(20) NOT NULL,  -- pending, submitted, open, filled,
                                           -- partial, cancelled, rejected
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    avg_fill_price  DECIMAL(20, 8),

    -- Timestamps
    created_at      TIMESTAMP DEFAULT NOW(),
    submitted_at    TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT NOW(),

    -- Metadata
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}'
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE TABLE order_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id),
    exchange_exec_id VARCHAR(100),
    quantity        DECIMAL(20, 8) NOT NULL,
    price           DECIMAL(20, 8) NOT NULL,
    fee             DECIMAL(20, 8) DEFAULT 0,
    fee_currency    VARCHAR(10),
    executed_at     TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

### 2.3 Portfolio Service

**Responsibilities:**
- Aggregate balances from linked exchanges
- Calculate positions and P&L
- Portfolio history and performance

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | /portfolio/summary | Total value, allocation |
| GET | /portfolio/balances | Per-exchange balances |
| GET | /portfolio/positions | All positions |
| GET | /portfolio/positions/:instrument | Single position |
| GET | /portfolio/performance | Historical performance |

**Note:** Portfolio service is READ-ONLY. It fetches data from exchanges via their APIs using stored OAuth tokens. K2 does NOT store balances—it caches them briefly for display.

---

### 2.4 Market Data Service

**Responsibilities:**
- Real-time price feeds from exchanges
- WebSocket fanout to clients
- Price caching and throttling
- OHLCV data for charts

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MARKET DATA SERVICE                              │
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐                │
│  │   Crypto.com WS     │    │    Kalshi WS        │                │
│  │   Consumer          │    │    Consumer         │                │
│  └──────────┬──────────┘    └──────────┬──────────┘                │
│             │                          │                            │
│             └──────────┬───────────────┘                            │
│                        ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PRICE AGGREGATOR                          │   │
│  │   • Normalize formats  • Dedupe  • Sequence validation       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                        │                                            │
│            ┌───────────┼───────────┐                               │
│            ▼           ▼           ▼                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                  │
│  │ Redis Cache │ │ WS Fanout   │ │ Time-Series │                  │
│  │ (latest)    │ │ to Clients  │ │ DB (charts) │                  │
│  └─────────────┘ └─────────────┘ └─────────────┘                  │
│                        │                                            │
└────────────────────────┼────────────────────────────────────────────┘
                         ▼
                    ┌─────────┐
                    │ Clients │
                    │  (WS)   │
                    └─────────┘
```

**Endpoints:**

| Type | Path | Description |
|------|------|-------------|
| REST | /prices/:instrument | Current price |
| REST | /prices | Batch prices |
| REST | /candles/:instrument | OHLCV data |
| WS | /ws/prices | Real-time price stream |

---

### 2.5 Notification Service

**Responsibilities:**
- Push notifications (FCM, APNs)
- Email notifications
- In-app notifications
- Notification preferences

**Triggers:**
- Order filled
- Order cancelled/rejected
- Price alert triggered
- Event settled
- Security events (new login, 2FA changes)

---

## 3. Security Architecture

### 3.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                            │
│                                                                     │
│  ┌─────────────┐                                                   │
│  │   Client    │                                                   │
│  │   Login     │                                                   │
│  └──────┬──────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AUTH SERVICE                              │   │
│  │  1. Validate credentials                                     │   │
│  │  2. Check 2FA if enabled                                     │   │
│  │  3. Generate JWT (short-lived, 15 min)                       │   │
│  │  4. Generate refresh token (long-lived, 7 days)              │   │
│  │  5. Store session in DB                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  JWT Payload:                                                │   │
│  │  {                                                           │   │
│  │    "sub": "user-uuid",                                       │   │
│  │    "iat": 1234567890,                                        │   │
│  │    "exp": 1234568790,  // 15 min                             │   │
│  │    "session_id": "session-uuid"                              │   │
│  │  }                                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Secret Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECRET MANAGEMENT                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │               AWS KMS / GCP Cloud KMS                        │   │
│  │                                                               │   │
│  │  Master Keys (never leave KMS):                               │   │
│  │  • user-data-key     (encrypt exchange tokens)                │   │
│  │  • jwt-signing-key   (sign/verify JWTs)                       │   │
│  │  • audit-log-key     (encrypt sensitive audit data)           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │             AWS Secrets Manager / GCP Secret Manager         │   │
│  │                                                               │   │
│  │  Application Secrets:                                         │   │
│  │  • Database connection strings                                │   │
│  │  • Redis connection strings                                   │   │
│  │  • Exchange API credentials (for sandbox)                     │   │
│  │  • OAuth client secrets                                       │   │
│  │  • SMTP credentials                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  KEY ROTATION:                                                      │
│  • KMS keys: Annual rotation (automatic)                            │
│  • JWT signing: 90-day rotation (manual with overlap)               │
│  • Exchange tokens: Per OAuth spec (refresh before expiry)          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Security Controls

| Control | Implementation |
|---------|----------------|
| TLS | 1.3 everywhere, HSTS enabled |
| Rate Limiting | Per-user, per-IP, per-endpoint |
| CORS | Strict origin allowlist |
| CSP | Strict policy for web app |
| Input Validation | Joi/Zod schemas on all inputs |
| SQL Injection | Parameterized queries only |
| XSS | React escaping + CSP |
| CSRF | SameSite cookies + token |
| Encryption at Rest | RDS/KMS for DB, S3 encryption |
| Audit Logging | All sensitive operations logged |

---

## 4. Infrastructure

### 4.1 AWS Architecture (Primary)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS ARCHITECTURE                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Route 53 (DNS)                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CloudFront (CDN + WAF)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Application Load Balancer                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         ECS Fargate Cluster                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │   Auth   │  │ Trading  │  │Portfolio │  │Market Data│            │   │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │            │   │
│  │  │ (2 tasks)│  │ (2 tasks)│  │ (2 tasks)│  │ (2 tasks)│            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                  │                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │   RDS PostgreSQL   │  │  ElastiCache Redis │  │        SQS         │   │
│  │   (Multi-AZ)       │  │   (Cluster Mode)   │  │   (Message Queue)  │   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘   │
│                                                                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐   │
│  │    S3 (Assets,     │  │    CloudWatch      │  │     KMS / Secrets  │   │
│  │    Audit Logs)     │  │   (Logs, Metrics)  │  │      Manager       │   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Environments

| Environment | Purpose | Scale |
|-------------|---------|-------|
| Development | Local development | Docker Compose |
| Staging | Pre-production testing | 1 task per service |
| Production | Live users | 2+ tasks per service, Multi-AZ |

### 4.3 CI/CD Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───▶│   GitHub    │───▶│    Build    │───▶│   Deploy    │
│   Push      │    │   Actions   │    │   & Test    │    │   to ECS    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │
                         ├── Lint + Type Check
                         ├── Unit Tests
                         ├── Build Docker Images
                         ├── Push to ECR
                         ├── Integration Tests (staging)
                         └── Deploy (staging → prod with approval)
```

---

## 5. Observability

### 5.1 Metrics (CloudWatch / Prometheus)

| Category | Metrics |
|----------|---------|
| Application | Request latency (P50, P95, P99), Error rate, Request count |
| Trading | Order submission latency, Fill rate, Rejection rate |
| Exchange | API latency per exchange, Rate limit hits, Error rate |
| Infrastructure | CPU, Memory, Network, Disk |
| Business | Active users, Orders per hour, Portfolio value (aggregate) |

### 5.2 Logging

**Format:** Structured JSON

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "trading-service",
  "trace_id": "abc123",
  "user_id": "user-uuid",
  "message": "Order submitted",
  "order_id": "order-uuid",
  "exchange": "cryptocom",
  "latency_ms": 45
}
```

**Log Levels:**
- ERROR: Failures requiring attention
- WARN: Unusual but handled situations
- INFO: Significant business events
- DEBUG: Detailed diagnostic (staging only)

### 5.3 Tracing

Distributed tracing with OpenTelemetry:
- Trace ID propagated across all services
- Spans for external API calls
- Integration with CloudWatch X-Ray or Jaeger

### 5.4 Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | >1% errors over 5 min | Critical |
| High Latency | P95 > 2s over 5 min | Warning |
| Exchange API Down | 3 consecutive failures | Critical |
| Database Connection | Pool exhausted | Critical |
| Rate Limit Hit | >10 per minute | Warning |

---

## 6. API Design Principles

### 6.1 REST Conventions

- Use nouns for resources: `/orders`, `/users`
- Use HTTP methods appropriately: GET, POST, PUT, DELETE
- Version in URL: `/v1/orders`
- Pagination: `?limit=20&cursor=abc`
- Filtering: `?status=open&exchange=cryptocom`
- Sorting: `?sort=-created_at`

### 6.2 Response Format

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req-uuid",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response:**

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance at Crypto.com",
    "details": {
      "required": "1000.00",
      "available": "500.00",
      "currency": "USD"
    }
  },
  "meta": {
    "request_id": "req-uuid",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6.3 WebSocket Protocol

```json
// Client → Server (subscribe)
{
  "type": "subscribe",
  "channel": "prices",
  "instruments": ["BTC-USD", "ETH-USD"]
}

// Server → Client (price update)
{
  "type": "price",
  "instrument": "BTC-USD",
  "price": "64950.00",
  "change_24h": "2.5",
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Server → Client (order update)
{
  "type": "order_update",
  "order_id": "order-uuid",
  "status": "filled",
  "filled_quantity": "0.1",
  "avg_price": "64950.00"
}
```

