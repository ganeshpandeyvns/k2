// ============================================================================
// Exchange Router - Routes orders to appropriate exchange adapters
// ============================================================================

import type { Logger } from 'pino';
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
} from '@k2/types';
import type { BaseExchangeAdapter } from '../adapters/base-adapter.js';

export class ExchangeRouter {
  constructor(
    private adapters: Record<ExchangeId, BaseExchangeAdapter>,
    private logger: Logger
  ) {}

  /**
   * Get adapter for a specific exchange
   */
  getAdapter(exchange: ExchangeId): BaseExchangeAdapter {
    const adapter = this.adapters[exchange];
    if (!adapter) {
      throw new Error(`No adapter configured for exchange: ${exchange}`);
    }
    return adapter;
  }

  /**
   * Submit order to exchange
   */
  async submitOrder(
    exchange: ExchangeId,
    request: CreateOrderRequest
  ): Promise<CreateOrderResponse> {
    const adapter = this.getAdapter(exchange);

    this.logger.debug(
      { exchange, instrument: request.instrument, side: request.side },
      'Routing order to exchange'
    );

    const startTime = Date.now();
    const response = await adapter.submitOrder(request);
    const latency = Date.now() - startTime;

    this.logger.info(
      { exchange, orderId: response.orderId, latencyMs: latency },
      'Order submitted to exchange'
    );

    return response;
  }

  /**
   * Cancel order on exchange
   */
  async cancelOrder(
    exchange: ExchangeId,
    request: CancelOrderRequest
  ): Promise<CancelOrderResponse> {
    const adapter = this.getAdapter(exchange);
    return adapter.cancelOrder(request);
  }

  /**
   * Get order status from exchange
   */
  async getOrder(exchange: ExchangeId, orderId: string): Promise<Order | null> {
    const adapter = this.getAdapter(exchange);
    return adapter.getOrder(orderId);
  }

  /**
   * Get quote for instrument
   */
  async getQuote(exchange: ExchangeId, instrument: string): Promise<Quote> {
    const adapter = this.getAdapter(exchange);
    return adapter.getQuote(instrument);
  }

  /**
   * Get order book for instrument
   */
  async getOrderBook(
    exchange: ExchangeId,
    instrument: string,
    depth?: number
  ): Promise<OrderBook> {
    const adapter = this.getAdapter(exchange);
    return adapter.getOrderBook(instrument, depth);
  }

  /**
   * Get all available instruments from an exchange
   */
  async getInstruments(exchange: ExchangeId): Promise<Instrument[]> {
    const adapter = this.getAdapter(exchange);
    return adapter.getInstruments();
  }

  /**
   * Get all instruments from all exchanges
   */
  async getAllInstruments(): Promise<Instrument[]> {
    const results = await Promise.all(
      Object.entries(this.adapters).map(async ([exchange, adapter]) => {
        try {
          return await adapter.getInstruments();
        } catch (err) {
          this.logger.error({ exchange, err }, 'Failed to fetch instruments');
          return [];
        }
      })
    );
    return results.flat();
  }

  /**
   * Get balances from exchange
   */
  async getBalances(exchange: ExchangeId): Promise<Balance[]> {
    const adapter = this.getAdapter(exchange);
    return adapter.getBalances();
  }

  /**
   * Get positions from exchange
   */
  async getPositions(exchange: ExchangeId): Promise<Position[]> {
    const adapter = this.getAdapter(exchange);
    return adapter.getPositions();
  }

  /**
   * Get balances from all exchanges
   */
  async getAllBalances(): Promise<Balance[]> {
    const results = await Promise.all(
      Object.entries(this.adapters).map(async ([exchange, adapter]) => {
        try {
          return await adapter.getBalances();
        } catch (err) {
          this.logger.error({ exchange, err }, 'Failed to fetch balances');
          return [];
        }
      })
    );
    return results.flat();
  }

  /**
   * Get positions from all exchanges
   */
  async getAllPositions(): Promise<Position[]> {
    const results = await Promise.all(
      Object.entries(this.adapters).map(async ([exchange, adapter]) => {
        try {
          return await adapter.getPositions();
        } catch (err) {
          this.logger.error({ exchange, err }, 'Failed to fetch positions');
          return [];
        }
      })
    );
    return results.flat();
  }

  /**
   * Subscribe to quote updates
   */
  subscribeQuotes(
    exchange: ExchangeId,
    instruments: string[],
    callback: (quote: Quote) => void
  ): void {
    const adapter = this.getAdapter(exchange);
    adapter.subscribeQuotes(instruments, callback);
  }

  /**
   * Unsubscribe from quote updates
   */
  unsubscribeQuotes(exchange: ExchangeId, instruments: string[]): void {
    const adapter = this.getAdapter(exchange);
    adapter.unsubscribeQuotes(instruments);
  }

  /**
   * Check if exchange is connected
   */
  isConnected(exchange: ExchangeId): boolean {
    const adapter = this.adapters[exchange];
    return adapter?.isConnected() ?? false;
  }

  /**
   * Get connection status for all exchanges
   */
  getConnectionStatus(): Record<ExchangeId, boolean> {
    const status: Record<string, boolean> = {};
    for (const [exchange, adapter] of Object.entries(this.adapters)) {
      status[exchange] = adapter.isConnected();
    }
    return status as Record<ExchangeId, boolean>;
  }
}
