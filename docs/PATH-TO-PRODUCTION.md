# K2: Path to Production

## Executive Summary

| Phase | Timeline | Cost Estimate | Blocker? |
|-------|----------|---------------|----------|
| 1. Exchange Sandbox Integration | 2-3 weeks | $0 | **Yes** - Need API access |
| 2. Security Hardening | 2-3 weeks | $5-15K (audit) | Yes |
| 3. Legal/Compliance | 2-4 weeks | $10-30K | **Yes** - Critical |
| 4. Production Infrastructure | 1-2 weeks | $500-2K/month | No |
| 5. Testing & QA | 2-3 weeks | $0-5K | No |
| 6. App Store Submission | 1-2 weeks | $100/year | No |
| 7. Soft Launch (Beta) | 1 week | $0 | No |

**Realistic Total: 10-16 weeks from today**

**Critical Path:** Exchange API access + Legal review (parallel)

---

## Phase 1: Exchange Sandbox Integration (2-3 weeks)

### 1.1 Crypto.com Exchange API

**Current State:** Mock adapter with simulated prices/fills

**Required Steps:**

| Task | Effort | Dependency |
|------|--------|------------|
| Apply for Exchange API access | 1-2 weeks wait | Business registration |
| Implement OAuth 2.0 flow | 3-5 days | API credentials |
| Replace mock with real REST client | 2-3 days | None |
| Implement WebSocket price feed | 2-3 days | None |
| Handle rate limits & retries | 1-2 days | None |
| Test order lifecycle in sandbox | 3-5 days | API access |

**Code Changes:**

```typescript
// services/trading/src/adapters/cryptocom-adapter.ts (NEW)
// Replace mock-cryptocom.ts with real implementation

export class CryptoComAdapter implements BaseExchangeAdapter {
  private restClient: CryptoComRestClient;
  private wsClient: CryptoComWebSocket;

  async connect(tokens: OAuthTokens): Promise<void> {
    // Real OAuth token handling
    this.restClient = new CryptoComRestClient({
      baseUrl: 'https://api.crypto.com/exchange/v1',
      accessToken: tokens.accessToken,
    });

    this.wsClient = new CryptoComWebSocket({
      url: 'wss://stream.crypto.com/exchange/v1/market',
    });
  }

  async submitOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Real API call with idempotency key
    const response = await this.restClient.post('/orders', {
      instrument_name: request.instrument,
      side: request.side.toUpperCase(),
      type: request.type.toUpperCase(),
      quantity: request.quantity,
      price: request.price,
      client_oid: request.clientOrderId, // Idempotency
    });

    return this.mapOrderResponse(response);
  }
}
```

**Blockers:**
- Crypto.com Exchange API requires business verification
- May need institutional partnership agreement for routing retail orders
- Some features (sub-accounts) may require higher tier access

### 1.2 Kalshi API

**Current State:** Mock adapter with simulated event contracts

**Required Steps:**

| Task | Effort | Dependency |
|------|--------|------------|
| Apply for Kalshi API access | 1-2 weeks wait | Business application |
| Implement API authentication | 1-2 days | API credentials |
| Replace mock with real REST client | 2-3 days | None |
| Implement WebSocket feed | 2-3 days | None |
| Handle Kalshi-specific order types | 1-2 days | None |
| Test in sandbox | 3-5 days | API access |

**Kalshi-Specific Considerations:**
- Kalshi uses API keys (not OAuth) - simpler auth but different model
- Event contracts have specific fields (yes_price, no_price)
- Position limits per market
- Settlement handling (auto-settles at expiration)

**Code Changes:**

```typescript
// services/trading/src/adapters/kalshi-adapter.ts (NEW)
export class KalshiAdapter implements BaseExchangeAdapter {
  private client: KalshiClient;

  async connect(config: { apiKey: string; apiSecret: string }): Promise<void> {
    this.client = new KalshiClient({
      baseUrl: 'https://trading-api.kalshi.com/trade-api/v2',
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
  }

  async submitOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Kalshi uses "yes"/"no" side, not "buy"/"sell"
    const response = await this.client.post('/orders', {
      ticker: request.instrument,
      action: request.side === 'buy' ? 'buy' : 'sell',
      side: request.eventSide, // 'yes' or 'no'
      type: request.type,
      count: parseInt(request.quantity), // Whole contracts only
      yes_price: request.eventSide === 'yes' ? parseInt(request.price * 100) : undefined,
      no_price: request.eventSide === 'no' ? parseInt(request.price * 100) : undefined,
    });

    return this.mapOrderResponse(response);
  }
}
```

### 1.3 OAuth Flow Implementation

For non-custodial mode, users must authorize K2 to trade on their behalf:

```typescript
// apps/mobile/src/services/oauth.ts

export async function connectExchange(exchange: 'cryptocom' | 'kalshi') {
  if (exchange === 'cryptocom') {
    // Crypto.com OAuth 2.0 flow
    const authUrl = `https://crypto.com/oauth/authorize?` +
      `client_id=${CRYPTOCOM_CLIENT_ID}&` +
      `redirect_uri=${REDIRECT_URI}&` +
      `scope=trading:read trading:write&` +
      `response_type=code`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

    if (result.type === 'success') {
      const code = extractCodeFromUrl(result.url);
      const tokens = await exchangeCodeForTokens(code);
      await secureStore.setItem('cryptocom_tokens', JSON.stringify(tokens));
    }
  }

  if (exchange === 'kalshi') {
    // Kalshi uses API key flow - user enters credentials
    // Show modal to enter API key/secret (generated in Kalshi dashboard)
    navigation.navigate('EnterKalshiCredentials');
  }
}
```

---

## Phase 2: Security Hardening (2-3 weeks)

### 2.1 Authentication & Session Management

**Current State:** Mock JWT, development mode bypass

**Required:**

| Item | Current | Required |
|------|---------|----------|
| Password hashing | None | Argon2id |
| JWT signing | Hardcoded secret | RSA/EC keys from KMS |
| Session management | In-memory | Redis with expiry |
| Token refresh | Not implemented | Automatic refresh flow |
| 2FA | Stub | TOTP (Google Auth compatible) |
| Rate limiting | None | Per-user, per-endpoint |

**Implementation:**

```typescript
// services/auth/src/auth-service.ts

export class AuthService {
  constructor(
    private kms: AWS.KMS,
    private redis: Redis,
    private db: PrismaClient,
  ) {}

  async login(email: string, password: string, totpCode?: string): Promise<AuthTokens> {
    const user = await this.db.user.findUnique({ where: { email } });
    if (!user) throw new AuthError('INVALID_CREDENTIALS');

    // Verify password
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new AuthError('INVALID_CREDENTIALS');

    // Check 2FA if enabled
    if (user.totpEnabled) {
      if (!totpCode) throw new AuthError('TOTP_REQUIRED');
      const validTotp = authenticator.verify({ token: totpCode, secret: user.totpSecret });
      if (!validTotp) throw new AuthError('INVALID_TOTP');
    }

    // Generate tokens with KMS-managed keys
    const accessToken = await this.generateToken(user, '15m');
    const refreshToken = await this.generateRefreshToken(user);

    // Store session in Redis
    await this.redis.setex(
      `session:${refreshToken}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify({ userId: user.id, deviceInfo: request.deviceInfo })
    );

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private async generateToken(user: User, expiresIn: string): Promise<string> {
    // Sign with KMS-managed key
    const payload = { sub: user.id, email: user.email };
    return jwt.sign(payload, await this.getSigningKey(), { expiresIn });
  }
}
```

### 2.2 Secrets Management

**Current State:** Environment variables, hardcoded secrets

**Required:**

```typescript
// services/trading/src/config/secrets.ts

import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManager({ region: 'us-east-1' });

export async function getSecrets(): Promise<AppSecrets> {
  const secrets = await secretsManager.getSecretValue({
    SecretId: 'k2/production/trading-service',
  });

  return JSON.parse(secrets.SecretString);
}

// Secrets structure:
interface AppSecrets {
  databaseUrl: string;           // PostgreSQL connection string
  redisUrl: string;              // Redis connection string
  jwtPrivateKey: string;         // RSA private key for JWT signing
  cryptocomClientId: string;     // OAuth client ID
  cryptocomClientSecret: string; // OAuth client secret
  kalshiApiKey: string;          // For testing/development only
  encryptionKey: string;         // For encrypting stored OAuth tokens
}
```

### 2.3 OAuth Token Encryption

User's exchange tokens must be encrypted at rest:

```typescript
// services/trading/src/utils/encryption.ts

import { KMS } from '@aws-sdk/client-kms';

export class TokenEncryption {
  private kms = new KMS({ region: 'us-east-1' });
  private keyId = 'alias/k2-token-encryption';

  async encrypt(plaintext: string): Promise<Buffer> {
    const result = await this.kms.encrypt({
      KeyId: this.keyId,
      Plaintext: Buffer.from(plaintext),
    });
    return Buffer.from(result.CiphertextBlob);
  }

  async decrypt(ciphertext: Buffer): Promise<string> {
    const result = await this.kms.decrypt({
      CiphertextBlob: ciphertext,
    });
    return Buffer.from(result.Plaintext).toString();
  }
}

// Usage when storing tokens:
const encrypted = await tokenEncryption.encrypt(JSON.stringify(oauthTokens));
await db.exchangeConnection.update({
  where: { id: connectionId },
  data: { accessTokenEncrypted: encrypted },
});
```

### 2.4 Security Audit Checklist

Before launch, verify:

| Category | Item | Status |
|----------|------|--------|
| **Auth** | Passwords hashed with Argon2id | ⬜ |
| **Auth** | JWT signed with KMS key | ⬜ |
| **Auth** | Refresh token rotation | ⬜ |
| **Auth** | Session invalidation on logout | ⬜ |
| **Auth** | 2FA implemented | ⬜ |
| **Secrets** | No secrets in code/env vars | ⬜ |
| **Secrets** | All secrets in Secrets Manager | ⬜ |
| **Secrets** | OAuth tokens encrypted at rest | ⬜ |
| **API** | Rate limiting per user | ⬜ |
| **API** | Input validation (Zod) | ⬜ |
| **API** | SQL injection prevention (Prisma) | ⬜ |
| **API** | XSS prevention | ⬜ |
| **Infra** | HTTPS only | ⬜ |
| **Infra** | WAF configured | ⬜ |
| **Infra** | VPC with private subnets | ⬜ |
| **Audit** | All trades logged | ⬜ |
| **Audit** | All logins logged | ⬜ |
| **Audit** | Logs retained 7 years | ⬜ |

**Recommended:** External penetration test ($5-15K)

---

## Phase 3: Legal & Compliance (2-4 weeks)

### 3.1 Legal Review Requirements

**CRITICAL:** Before launching, you MUST have attorney review for:

| Document | Purpose | Cost Estimate |
|----------|---------|---------------|
| Terms of Service | User agreement, liability limits | $3-8K |
| Privacy Policy | CCPA/GDPR compliance | $2-5K |
| Risk Disclosures | Crypto & event contract warnings | $2-5K |
| Non-custodial analysis | Confirm MTL not required | $5-15K |
| Exchange partnership review | API terms compliance | $2-5K |

**Total Legal Budget: $15-40K (can negotiate fixed fee)**

### 3.2 Non-Custodial Confirmation

Your attorney should confirm in writing that your architecture:

1. Does NOT constitute money transmission
2. Does NOT require state MTL licenses
3. Complies with Crypto.com and Kalshi API terms
4. Properly discloses the non-custodial nature to users

**Key questions to answer:**
- Does K2 ever have "control" over user funds? (Should be NO)
- Can K2 unilaterally move user funds? (Should be NO)
- Does K2 commingle user funds? (Should be NO)
- Are all user actions explicitly authorized? (Should be YES)

### 3.3 Required Disclosures

Implement these disclosure screens:

```typescript
// apps/mobile/src/screens/Disclosures.tsx

const DISCLOSURES = {
  onboarding: `
    K2 is a trading interface that connects to your existing exchange accounts.

    IMPORTANT: K2 does not hold your funds.
    • Your crypto is held at Crypto.com
    • Your event contract positions are held at Kalshi
    • K2 submits orders on your behalf when you authorize them

    You must have accounts at these exchanges to trade through K2.
  `,

  cryptoRisk: `
    CRYPTOCURRENCY RISK WARNING

    Cryptocurrency trading is highly speculative and involves significant risk.
    • Prices can drop significantly in short periods
    • You could lose some or all of your investment
    • Cryptocurrencies are not backed by any government
    • Past performance does not guarantee future results

    Only trade with funds you can afford to lose.
  `,

  eventRisk: `
    EVENT CONTRACT RISK WARNING

    Event contracts are speculative instruments regulated by the CFTC.
    • You could lose your entire investment
    • Contracts settle at $1 or $0 - no partial outcomes
    • Prices reflect market probability, not guaranteed outcomes

    Event contracts are offered by Kalshi Exchange LLC,
    a CFTC-registered Designated Contract Market.
  `,

  preTradeConfirmation: (order) => `
    You are about to ${order.side} ${order.quantity} ${order.instrument}

    Estimated cost: ${order.estimatedTotal}
    Exchange: ${order.exchange}

    By confirming, you authorize K2 to submit this order to ${order.exchange}
    on your behalf. This order will be executed according to ${order.exchange}'s
    terms and conditions.
  `,
};
```

### 3.4 Geo-Restrictions

Implement state-level blocking:

```typescript
// services/trading/src/middleware/geo-restriction.ts

const RESTRICTED_STATES = {
  crypto: ['NY'], // NY requires BitLicense - check if Crypto.com covers
  events: ['NY', 'MT', 'NV'], // Kalshi restrictions - verify current list
};

export async function checkGeoRestriction(
  req: FastifyRequest,
  product: 'crypto' | 'events'
): Promise<void> {
  const user = await getUser(req);
  const state = user.kycState || await getStateFromIP(req.ip);

  if (RESTRICTED_STATES[product].includes(state)) {
    throw new GeoRestrictionError(
      `${product === 'crypto' ? 'Crypto' : 'Event'} trading is not available in ${state}`
    );
  }
}
```

### 3.5 Age Verification

Ensure 18+ only:

```typescript
// Rely on exchange KYC, but add check in app
const MINIMUM_AGE = 18;

async function verifyAge(dateOfBirth: string): Promise<boolean> {
  const age = calculateAge(new Date(dateOfBirth));
  return age >= MINIMUM_AGE;
}

// On exchange connection, verify user is verified
async function connectExchange(userId: string, exchange: ExchangeId) {
  const exchangeUser = await getExchangeUserInfo(exchange);

  if (exchangeUser.kycStatus !== 'verified') {
    throw new Error('You must complete KYC verification at the exchange first');
  }

  // Store connection
}
```

---

## Phase 4: Production Infrastructure (1-2 weeks)

### 4.1 AWS Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AWS PRODUCTION                                    │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │ CloudFront  │────▶│     ALB     │────▶│    ECS      │                   │
│  │    (CDN)    │     │   (HTTPS)   │     │  Fargate    │                   │
│  └─────────────┘     └─────────────┘     └──────┬──────┘                   │
│                                                  │                          │
│         ┌────────────────────────────────────────┼────────────────┐        │
│         │                                        │                │        │
│         ▼                                        ▼                ▼        │
│  ┌─────────────┐                         ┌─────────────┐  ┌─────────────┐  │
│  │   Aurora    │                         │ ElastiCache │  │  Secrets    │  │
│  │ PostgreSQL  │                         │   (Redis)   │  │  Manager    │  │
│  │  (Multi-AZ) │                         │   Cluster   │  └─────────────┘  │
│  └─────────────┘                         └─────────────┘                   │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ CloudWatch  │  │    WAF      │  │   X-Ray     │  │    KMS      │       │
│  │   (Logs)    │  │ (Firewall)  │  │  (Tracing)  │  │ (Encryption)│       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Terraform Configuration

```hcl
# infrastructure/terraform/main.tf

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }

  backend "s3" {
    bucket = "k2-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

module "vpc" {
  source = "./modules/vpc"

  name               = "k2-production"
  cidr               = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
}

module "ecs" {
  source = "./modules/ecs"

  cluster_name = "k2-production"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnet_ids

  services = {
    trading = {
      image          = "${aws_ecr_repository.trading.repository_url}:latest"
      cpu            = 512
      memory         = 1024
      desired_count  = 2
      port           = 3001
      health_check   = "/health"
    }
  }
}

module "rds" {
  source = "./modules/rds"

  identifier     = "k2-production"
  engine         = "aurora-postgresql"
  engine_version = "15.4"
  instance_class = "db.r6g.large"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  multi_az            = true
  deletion_protection = true

  # Encrypted by default with KMS
}

module "elasticache" {
  source = "./modules/elasticache"

  cluster_id      = "k2-production"
  engine          = "redis"
  node_type       = "cache.r6g.large"
  num_cache_nodes = 2

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
}
```

### 4.3 Monthly Cost Estimate

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS Fargate | 2 tasks × 0.5 vCPU × 1GB | ~$30 |
| Aurora PostgreSQL | db.r6g.large (Multi-AZ) | ~$200 |
| ElastiCache Redis | cache.r6g.large × 2 | ~$200 |
| ALB | Load balancer + data | ~$30 |
| CloudFront | CDN for mobile assets | ~$20 |
| Secrets Manager | 10 secrets | ~$5 |
| CloudWatch | Logs + metrics | ~$50 |
| **Total** | | **~$535/month** |

Scale up as traffic grows. Add ~$100-200/month for staging environment.

### 4.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Build and push Docker image
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -t k2-trading -f infrastructure/docker/Dockerfile.trading .
          docker tag k2-trading:latest $ECR_REGISTRY/k2-trading:${{ github.sha }}
          docker push $ECR_REGISTRY/k2-trading:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster k2-production \
            --service trading \
            --force-new-deployment
```

---

## Phase 5: Testing & QA (2-3 weeks)

### 5.1 Test Coverage Requirements

| Test Type | Coverage Target | Current |
|-----------|-----------------|---------|
| Unit tests (Risk Engine) | 100% | 0% |
| Unit tests (Order Manager) | 100% | 0% |
| Integration tests (Exchange adapters) | 90% | 0% |
| E2E tests (Mobile app) | 80% of P0 flows | 0% |
| Load tests | 1000 concurrent users | Not done |
| Security tests | OWASP Top 10 | Not done |

### 5.2 Critical Test Cases

```typescript
// tests/integration/order-flow.test.ts

describe('Order Flow', () => {
  it('should submit market order and receive fill', async () => {
    const order = await api.createOrder({
      instrument: 'BTC-USD',
      side: 'buy',
      type: 'market',
      quantity: '0.01',
    });

    expect(order.status).toBe('pending');

    // Wait for fill
    await waitFor(() => {
      const updated = api.getOrder(order.orderId);
      expect(updated.status).toBe('filled');
    });
  });

  it('should reject order exceeding risk limits', async () => {
    await expect(
      api.createOrder({
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '10000', // Exceeds max order size
      })
    ).rejects.toThrow('Order size exceeds limit');
  });

  it('should cancel open order', async () => {
    const order = await api.createOrder({
      instrument: 'BTC-USD',
      side: 'buy',
      type: 'limit',
      quantity: '0.01',
      price: '50000', // Below market, won't fill
    });

    const cancelled = await api.cancelOrder(order.orderId);
    expect(cancelled.status).toBe('cancelled');
  });
});
```

### 5.3 Load Testing

```javascript
// tests/performance/load-test.js (k6)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/ws';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 500 },  // Stay at 500
    { duration: '2m', target: 1000 }, // Peak
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  // Get quote
  const quoteRes = http.get('https://api.k2.app/v1/instruments/BTC-USD/quote');
  check(quoteRes, { 'quote status 200': (r) => r.status === 200 });

  // Get portfolio
  const portfolioRes = http.get('https://api.k2.app/v1/portfolio', {
    headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` },
  });
  check(portfolioRes, { 'portfolio status 200': (r) => r.status === 200 });

  sleep(1);
}
```

### 5.4 Mobile App Testing

```typescript
// tests/e2e/mobile/trade-flow.test.ts (Detox)

describe('Trading Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAsTestUser();
  });

  it('should complete a market buy order', async () => {
    // Navigate to markets
    await element(by.id('tab-markets')).tap();

    // Select BTC
    await element(by.text('BTC')).tap();

    // Tap buy
    await element(by.id('buy-button')).tap();

    // Enter quantity
    await element(by.id('quantity-input')).typeText('0.01');

    // Submit order
    await element(by.id('submit-order')).tap();

    // Verify confirmation
    await expect(element(by.text('Order Filled!'))).toBeVisible();
  });
});
```

---

## Phase 6: App Store Submission (1-2 weeks)

### 6.1 iOS (App Store)

**Requirements:**
- Apple Developer Account ($99/year)
- App Store Connect setup
- TestFlight beta testing (required before release)
- App Review guidelines compliance

**Trading App Specific:**
- Must include risk disclosures
- Cannot guarantee profits
- Must link to Terms of Service
- May require additional review for financial apps

**Submission Checklist:**
- [ ] App icons (all sizes)
- [ ] Screenshots (6.5", 5.5", iPad)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating (17+ for trading)
- [ ] Export compliance

### 6.2 Android (Play Store)

**Requirements:**
- Google Play Developer Account ($25 one-time)
- Play Console setup
- Internal/Closed testing track

**Financial App Requirements:**
- Must comply with "Financial Services" policy
- May require additional documentation
- Sensitive permissions review

### 6.3 Common Rejection Reasons

| Reason | Mitigation |
|--------|------------|
| Incomplete information | Include all disclosures, privacy policy |
| Misleading claims | Don't promise profits or guaranteed returns |
| Missing login | Provide demo account or clear login flow |
| Crashes | Thorough testing on multiple devices |
| Permissions | Only request necessary permissions |

---

## Phase 7: Soft Launch (1 week)

### 7.1 Beta Program

1. **Internal testing** (Week 1-2)
   - Team members only
   - Test with sandbox APIs
   - Find critical bugs

2. **Closed beta** (Week 3-4)
   - 50-100 invited users
   - Real exchange sandbox
   - Gather feedback

3. **Open beta** (Week 5-6)
   - TestFlight / Play Store beta
   - 500-1000 users
   - Monitor for issues

### 7.2 Launch Checklist

| Category | Item | Status |
|----------|------|--------|
| **Legal** | Terms of Service published | ⬜ |
| **Legal** | Privacy Policy published | ⬜ |
| **Legal** | Risk disclosures in app | ⬜ |
| **Legal** | Attorney sign-off | ⬜ |
| **Security** | Penetration test passed | ⬜ |
| **Security** | All secrets in Secrets Manager | ⬜ |
| **Security** | Audit logging enabled | ⬜ |
| **Infra** | Production environment ready | ⬜ |
| **Infra** | Monitoring/alerting configured | ⬜ |
| **Infra** | On-call rotation set up | ⬜ |
| **Infra** | Disaster recovery tested | ⬜ |
| **Testing** | All P0 E2E tests passing | ⬜ |
| **Testing** | Load test passed | ⬜ |
| **Testing** | No P0/P1 bugs open | ⬜ |
| **Exchanges** | Crypto.com API access approved | ⬜ |
| **Exchanges** | Kalshi API access approved | ⬜ |
| **Exchanges** | Tested in production sandbox | ⬜ |
| **App Store** | iOS app approved | ⬜ |
| **App Store** | Android app approved | ⬜ |

### 7.3 Monitoring & Alerting

```yaml
# infrastructure/monitoring/alerts.yml

alerts:
  - name: HighErrorRate
    condition: error_rate > 1%
    duration: 5m
    severity: critical
    notify: [pagerduty, slack]

  - name: HighLatency
    condition: p95_latency > 500ms
    duration: 5m
    severity: warning
    notify: [slack]

  - name: OrderFailureRate
    condition: order_rejection_rate > 5%
    duration: 5m
    severity: critical
    notify: [pagerduty, slack]

  - name: ExchangeDisconnect
    condition: exchange_connected == false
    duration: 1m
    severity: critical
    notify: [pagerduty, slack, sms]
```

---

## Summary: What's Actually Blocking You

### Immediate Blockers (Must resolve first)

| Blocker | Action | Timeline |
|---------|--------|----------|
| Exchange API access | Apply to Crypto.com and Kalshi | 1-2 weeks |
| Legal review | Engage fintech attorney | 2-4 weeks |

### Critical Path

```
Week 1-2:   Apply for exchange APIs + Engage attorney (parallel)
Week 2-4:   Exchange sandbox integration + Legal review (parallel)
Week 4-6:   Security hardening + Testing
Week 6-8:   Production infrastructure + App store submission
Week 8-10:  Beta testing
Week 10-12: Soft launch
```

### Budget Summary

| Category | Low | High |
|----------|-----|------|
| Legal | $15K | $40K |
| Security audit | $5K | $15K |
| Infrastructure (first year) | $6K | $12K |
| App store fees | $125 | $125 |
| **Total** | **$26K** | **$67K** |

Plus ongoing: ~$500-1000/month for infrastructure

### Realistic Timeline

**Best case (everything goes smoothly):** 10 weeks
**Realistic case (normal delays):** 14 weeks
**Conservative case (blockers):** 18+ weeks

The main variables are:
1. How fast exchanges approve your API access
2. How fast your attorney completes review
3. Whether app stores require revisions

---

## Recommendation

**Start today:**
1. Apply for Crypto.com Exchange API access
2. Apply for Kalshi API access
3. Schedule call with fintech attorney

**In parallel:**
4. Begin security hardening (doesn't need exchange access)
5. Write tests for existing code
6. Set up production infrastructure (Terraform)

The exchange API applications and legal review are your critical path. Everything else can happen in parallel.
