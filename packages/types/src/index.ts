// ============================================================================
// K2 Trading Platform - Shared Types
// ============================================================================

// ----------------------------------------------------------------------------
// Common Types
// ----------------------------------------------------------------------------

export type UUID = string;
export type Timestamp = string; // ISO 8601
export type Decimal = string; // String to avoid floating point issues

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Timestamp;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// User & Auth Types
// ----------------------------------------------------------------------------

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  kycStatus: KycStatus;
  preferences: UserPreferences;
}

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface UserPreferences {
  defaultCurrency: string;
  notifications: NotificationPreferences;
  tradingDefaults: TradingDefaults;
}

export interface NotificationPreferences {
  orderFills: boolean;
  priceAlerts: boolean;
  marketing: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export interface TradingDefaults {
  defaultOrderType: OrderType;
  confirmBeforeSubmit: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface Session {
  userId: UUID;
  sessionId: UUID;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  osVersion: string;
}

// ----------------------------------------------------------------------------
// Exchange Connection Types (Non-Custodial OAuth)
// ----------------------------------------------------------------------------

export type ExchangeId = 'cryptocom' | 'kalshi';

export interface ExchangeConnection {
  id: UUID;
  userId: UUID;
  exchange: ExchangeId;
  status: ConnectionStatus;
  connectedAt: Timestamp;
  lastSyncAt?: Timestamp;
  permissions: ExchangePermission[];
}

export type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'error';

export type ExchangePermission = 'read_balances' | 'read_orders' | 'place_orders' | 'cancel_orders';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
  scope: string[];
}

// ----------------------------------------------------------------------------
// Instrument Types
// ----------------------------------------------------------------------------

export type InstrumentType = 'crypto' | 'event';

export interface Instrument {
  id: string; // e.g., "BTC-USD" or "KXBTC-24DEC31-B100000"
  type: InstrumentType;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
  exchange: ExchangeId;
  status: InstrumentStatus;
  tradingInfo: TradingInfo;
  metadata: InstrumentMetadata;
}

export type InstrumentStatus = 'active' | 'halted' | 'delisted';

export interface TradingInfo {
  minOrderSize: Decimal;
  maxOrderSize: Decimal;
  tickSize: Decimal;
  lotSize: Decimal;
  makerFee: Decimal;
  takerFee: Decimal;
}

export interface InstrumentMetadata {
  // Crypto-specific
  coinGeckoId?: string;
  iconUrl?: string;

  // Event-specific
  eventTitle?: string;
  eventDescription?: string;
  expirationDate?: Timestamp;
  settlementSource?: string;
  category?: EventCategory;
}

export type EventCategory =
  | 'crypto'
  | 'economics'
  | 'politics'
  | 'climate'
  | 'sports'
  | 'entertainment'
  | 'science';

// ----------------------------------------------------------------------------
// Market Data Types
// ----------------------------------------------------------------------------

export interface Quote {
  instrument: string;
  bidPrice: Decimal;
  bidSize: Decimal;
  askPrice: Decimal;
  askSize: Decimal;
  lastPrice: Decimal;
  lastSize: Decimal;
  timestamp: Timestamp;
}

export interface CryptoQuote extends Quote {
  change24h: Decimal;
  changePercent24h: Decimal;
  high24h: Decimal;
  low24h: Decimal;
  volume24h: Decimal;
  vwap24h: Decimal;
}

export interface EventQuote extends Quote {
  yesPrice: Decimal; // 0-100 (cents)
  noPrice: Decimal;  // 0-100 (cents)
  yesBid: Decimal;
  yesAsk: Decimal;
  change24h: Decimal;
  volume24h: Decimal;
  openInterest: Decimal;
}

export interface OrderBookLevel {
  price: Decimal;
  size: Decimal;
}

export interface OrderBook {
  instrument: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  sequence: number;
  timestamp: Timestamp;
}

export interface OHLCV {
  instrument: string;
  interval: CandleInterval;
  open: Decimal;
  high: Decimal;
  low: Decimal;
  close: Decimal;
  volume: Decimal;
  timestamp: Timestamp;
}

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

// ----------------------------------------------------------------------------
// Order Types
// ----------------------------------------------------------------------------

export interface Order {
  id: UUID;
  clientOrderId: UUID;
  userId: UUID;
  instrument: string;
  exchange: ExchangeId;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: Decimal;
  filledQuantity: Decimal;
  remainingQuantity: Decimal;
  price?: Decimal; // For limit orders
  avgFillPrice?: Decimal;
  timeInForce: TimeInForce;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fills: Fill[];
  fees: Decimal;
  feeCurrency: string;
  externalOrderId?: string; // Exchange's order ID
  rejectReason?: string;
}

export type OrderSide = 'buy' | 'sell';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

export type OrderStatus =
  | 'pending'      // Created locally, not yet sent
  | 'submitted'    // Sent to exchange
  | 'open'         // Acknowledged by exchange, working
  | 'partial'      // Partially filled
  | 'filled'       // Fully executed
  | 'cancelled'    // Cancelled by user or system
  | 'rejected'     // Rejected by exchange or risk
  | 'expired';     // Time-in-force expired

export type TimeInForce =
  | 'gtc'  // Good til cancelled
  | 'ioc'  // Immediate or cancel
  | 'fok'  // Fill or kill
  | 'day'; // Day order

export interface Fill {
  id: UUID;
  orderId: UUID;
  price: Decimal;
  quantity: Decimal;
  fee: Decimal;
  feeCurrency: string;
  side: OrderSide;
  timestamp: Timestamp;
  externalTradeId?: string;
}

// Event-specific order types
export interface EventOrder extends Order {
  eventSide: EventSide; // Yes or No
  maxCost: Decimal;     // Max USD to spend
  potentialPayout: Decimal;
}

export type EventSide = 'yes' | 'no';

// ----------------------------------------------------------------------------
// Order Submission Types
// ----------------------------------------------------------------------------

export interface CreateOrderRequest {
  clientOrderId: UUID;
  instrument: string;
  side: OrderSide;
  type: OrderType;
  quantity: Decimal;
  price?: Decimal;
  timeInForce?: TimeInForce;
  // Event-specific
  eventSide?: EventSide;
}

export interface CreateOrderResponse {
  orderId: UUID;
  clientOrderId: UUID;
  status: OrderStatus;
  createdAt: Timestamp;
}

export interface CancelOrderRequest {
  orderId: UUID;
}

export interface CancelOrderResponse {
  orderId: UUID;
  status: OrderStatus;
  cancelledAt: Timestamp;
}

// ----------------------------------------------------------------------------
// Risk Types
// ----------------------------------------------------------------------------

export interface RiskCheckResult {
  passed: boolean;
  checks: RiskCheck[];
}

export interface RiskCheck {
  name: string;
  passed: boolean;
  reason?: string;
  limit?: Decimal;
  actual?: Decimal;
}

export interface RiskLimits {
  maxOrderSize: Decimal;
  maxOrderNotional: Decimal;
  maxDailyVolume: Decimal;
  maxOpenOrders: number;
  maxPositionSize: Decimal;
  velocityLimit: VelocityLimit;
}

export interface VelocityLimit {
  maxOrdersPerMinute: number;
  maxOrdersPerHour: number;
}

// ----------------------------------------------------------------------------
// Portfolio Types
// ----------------------------------------------------------------------------

export interface Portfolio {
  userId: UUID;
  totalValue: Decimal;
  totalCost: Decimal;
  totalPnl: Decimal;
  totalPnlPercent: Decimal;
  lastUpdated: Timestamp;
  positions: Position[];
  balances: Balance[];
}

export interface Position {
  instrument: string;
  exchange: ExchangeId;
  quantity: Decimal;
  avgCost: Decimal;
  marketValue: Decimal;
  unrealizedPnl: Decimal;
  unrealizedPnlPercent: Decimal;
  realizedPnl: Decimal;
  // Event-specific
  eventSide?: EventSide;
  potentialPayout?: Decimal;
}

export interface Balance {
  exchange: ExchangeId;
  currency: string;
  total: Decimal;
  available: Decimal;
  held: Decimal; // In open orders
}

// ----------------------------------------------------------------------------
// Watchlist Types
// ----------------------------------------------------------------------------

export interface Watchlist {
  id: UUID;
  userId: UUID;
  name: string;
  instruments: string[];
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// Alert Types
// ----------------------------------------------------------------------------

export interface PriceAlert {
  id: UUID;
  userId: UUID;
  instrument: string;
  condition: AlertCondition;
  targetPrice: Decimal;
  status: AlertStatus;
  triggeredAt?: Timestamp;
  createdAt: Timestamp;
}

export type AlertCondition = 'above' | 'below' | 'crosses';
export type AlertStatus = 'active' | 'triggered' | 'cancelled' | 'expired';

// ----------------------------------------------------------------------------
// Notification Types
// ----------------------------------------------------------------------------

export interface Notification {
  id: UUID;
  userId: UUID;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Timestamp;
}

export type NotificationType =
  | 'order_filled'
  | 'order_cancelled'
  | 'order_rejected'
  | 'price_alert'
  | 'event_settled'
  | 'deposit_received'
  | 'withdrawal_complete'
  | 'system';

// ----------------------------------------------------------------------------
// WebSocket Message Types
// ----------------------------------------------------------------------------

export type WsMessageType =
  | 'auth'
  | 'subscribe'
  | 'unsubscribe'
  | 'subscribed'
  | 'unsubscribed'
  | 'price'
  | 'orderbook_snapshot'
  | 'orderbook_update'
  | 'order_update'
  | 'portfolio_update'
  | 'heartbeat'
  | 'pong'
  | 'error'
  | 'connected';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  channel?: string;
  data?: T;
  timestamp: Timestamp;
}

export interface WsAuthMessage {
  type: 'auth';
  token: string;
}

export interface WsSubscribeMessage {
  type: 'subscribe';
  channel: 'prices' | 'orderbook' | 'orders' | 'portfolio';
  instruments?: string[];
  instrument?: string;
  depth?: number;
}

export interface WsPriceUpdate {
  instrument: string;
  instrumentType: InstrumentType;
  price: Decimal;
  bid: Decimal;
  ask: Decimal;
  change24h: Decimal;
  changePercent24h: Decimal;
  volume24h: Decimal;
  // Event-specific
  yesPrice?: Decimal;
  noPrice?: Decimal;
}

export interface WsOrderUpdate {
  id: UUID;
  clientOrderId: UUID;
  status: OrderStatus;
  filledQuantity: Decimal;
  avgFillPrice?: Decimal;
  remainingQuantity: Decimal;
  lastFill?: Fill;
}

// ----------------------------------------------------------------------------
// Audit & Logging Types
// ----------------------------------------------------------------------------

export interface AuditLog {
  id: UUID;
  userId?: UUID;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'order_create'
  | 'order_cancel'
  | 'exchange_connect'
  | 'exchange_disconnect'
  | 'settings_update'
  | 'alert_create'
  | 'alert_delete';

// ----------------------------------------------------------------------------
// Exchange Adapter Interface Types
// ----------------------------------------------------------------------------

export interface ExchangeAdapter {
  exchangeId: ExchangeId;

  // Connection
  connect(tokens: OAuthTokens): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Market Data
  getInstruments(): Promise<Instrument[]>;
  getQuote(instrument: string): Promise<Quote>;
  getOrderBook(instrument: string, depth?: number): Promise<OrderBook>;
  subscribeQuotes(instruments: string[], callback: (quote: Quote) => void): void;
  unsubscribeQuotes(instruments: string[]): void;

  // Trading
  submitOrder(order: CreateOrderRequest): Promise<CreateOrderResponse>;
  cancelOrder(request: CancelOrderRequest): Promise<CancelOrderResponse>;
  getOrder(orderId: string): Promise<Order>;
  getOrders(params?: GetOrdersParams): Promise<Order[]>;

  // Account
  getBalances(): Promise<Balance[]>;
  getPositions(): Promise<Position[]>;
}

export interface GetOrdersParams {
  status?: OrderStatus[];
  instrument?: string;
  startTime?: Timestamp;
  endTime?: Timestamp;
  limit?: number;
}

// ----------------------------------------------------------------------------
// Configuration Types
// ----------------------------------------------------------------------------

export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  wsBaseUrl: string;
  exchanges: ExchangeConfig[];
}

export interface ExchangeConfig {
  id: ExchangeId;
  name: string;
  enabled: boolean;
  sandboxMode: boolean;
  apiBaseUrl: string;
  wsBaseUrl: string;
  oauthConfig?: OAuthConfig;
}

export interface OAuthConfig {
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}
