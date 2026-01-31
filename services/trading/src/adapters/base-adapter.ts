// ============================================================================
// Base Exchange Adapter Interface
// ============================================================================

import type {
  ExchangeId,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  Order,
  Quote,
  OrderBook,
  Instrument,
  Balance,
  Position,
  OAuthTokens,
  Fill,
} from '@k2/types';

/**
 * Base interface that all exchange adapters must implement
 */
export interface BaseExchangeAdapter {
  readonly exchangeId: ExchangeId;

  // Connection management
  connect(tokens?: OAuthTokens): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Instrument data
  getInstruments(): Promise<Instrument[]>;

  // Market data
  getQuote(instrument: string): Promise<Quote>;
  getOrderBook(instrument: string, depth?: number): Promise<OrderBook>;
  subscribeQuotes(instruments: string[], callback: (quote: Quote) => void): void;
  unsubscribeQuotes(instruments: string[]): void;

  // Trading
  submitOrder(request: CreateOrderRequest): Promise<CreateOrderResponse>;
  cancelOrder(request: CancelOrderRequest): Promise<CancelOrderResponse>;
  getOrder(orderId: string): Promise<Order | null>;
  getOrders(params?: GetOrdersParams): Promise<Order[]>;

  // Account
  getBalances(): Promise<Balance[]>;
  getPositions(): Promise<Position[]>;

  // Callbacks
  onFill(callback: (orderId: string, fill: Omit<Fill, 'id' | 'orderId'>) => void): void;
  onOrderUpdate(callback: (order: Order) => void): void;
}

export interface GetOrdersParams {
  status?: string[];
  instrument?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
}

/**
 * Configuration for exchange adapter
 */
export interface ExchangeAdapterConfig {
  exchangeId: ExchangeId;
  sandboxMode: boolean;
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  oauthTokens?: OAuthTokens;
}
