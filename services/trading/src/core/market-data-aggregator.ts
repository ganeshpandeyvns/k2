// ============================================================================
// Market Data Aggregator - Consolidates data from multiple exchanges
// ============================================================================

import type { Redis } from 'ioredis';
import type { Logger } from 'pino';
import type { Quote, ExchangeId } from '@k2/types';
import type { BaseExchangeAdapter } from '../adapters/base-adapter.js';

type QuoteCallback = (quote: Quote) => void;

interface Subscription {
  callback: QuoteCallback;
  client: any; // WebSocket or other client identifier
}

export class MarketDataAggregator {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private quoteCache: Map<string, Quote> = new Map();
  private running = false;

  constructor(
    private adapters: Record<ExchangeId, BaseExchangeAdapter>,
    private redis: Redis,
    private logger: Logger
  ) {}

  /**
   * Start the aggregator
   */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Set up quote handlers for each exchange
    for (const [exchangeId, adapter] of Object.entries(this.adapters)) {
      adapter.subscribeQuotes([], (quote: Quote) => {
        this.handleQuote(quote);
      });
    }

    this.logger.info('Market data aggregator started');
  }

  /**
   * Stop the aggregator
   */
  async stop(): Promise<void> {
    this.running = false;

    for (const adapter of Object.values(this.adapters)) {
      adapter.unsubscribeQuotes([]);
    }

    this.subscriptions.clear();
    this.logger.info('Market data aggregator stopped');
  }

  /**
   * Subscribe to quotes for an instrument
   */
  subscribe(instrument: string, callback: QuoteCallback, client: any): void {
    const subs = this.subscriptions.get(instrument) || [];
    subs.push({ callback, client });
    this.subscriptions.set(instrument, subs);

    // If this is the first subscriber, start exchange subscription
    if (subs.length === 1) {
      this.subscribeToExchange(instrument);
    }

    // Send cached quote immediately if available
    const cached = this.quoteCache.get(instrument);
    if (cached) {
      callback(cached);
    }

    this.logger.debug({ instrument, subscribers: subs.length }, 'Client subscribed to quotes');
  }

  /**
   * Unsubscribe from quotes
   */
  unsubscribe(instrument: string, client: any): void {
    const subs = this.subscriptions.get(instrument);
    if (!subs) return;

    const filtered = subs.filter((s) => s.client !== client);

    if (filtered.length === 0) {
      this.subscriptions.delete(instrument);
      this.unsubscribeFromExchange(instrument);
    } else {
      this.subscriptions.set(instrument, filtered);
    }

    this.logger.debug({ instrument, subscribers: filtered.length }, 'Client unsubscribed from quotes');
  }

  /**
   * Get cached quote
   */
  getCachedQuote(instrument: string): Quote | undefined {
    return this.quoteCache.get(instrument);
  }

  /**
   * Get all cached quotes
   */
  getAllCachedQuotes(): Quote[] {
    return Array.from(this.quoteCache.values());
  }

  /**
   * Fetch fresh quote (bypasses cache)
   */
  async fetchQuote(instrument: string): Promise<Quote> {
    const exchange = this.determineExchange(instrument);
    const adapter = this.adapters[exchange];
    const quote = await adapter.getQuote(instrument);
    this.handleQuote(quote);
    return quote;
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private handleQuote(quote: Quote): void {
    // Update cache
    this.quoteCache.set(quote.instrument, quote);

    // Store in Redis for other services
    this.redis
      .set(`quote:${quote.instrument}`, JSON.stringify(quote), 'EX', 60)
      .catch(() => {});

    // Publish to Redis pub/sub
    this.redis
      .publish('quotes', JSON.stringify(quote))
      .catch(() => {});

    // Notify subscribers
    const subs = this.subscriptions.get(quote.instrument);
    if (subs) {
      for (const { callback } of subs) {
        try {
          callback(quote);
        } catch (err) {
          this.logger.error({ err, instrument: quote.instrument }, 'Error in quote callback');
        }
      }
    }
  }

  private subscribeToExchange(instrument: string): void {
    const exchange = this.determineExchange(instrument);
    const adapter = this.adapters[exchange];

    adapter.subscribeQuotes([instrument], (quote: Quote) => {
      this.handleQuote(quote);
    });

    this.logger.debug({ instrument, exchange }, 'Subscribed to exchange quotes');
  }

  private unsubscribeFromExchange(instrument: string): void {
    const exchange = this.determineExchange(instrument);
    const adapter = this.adapters[exchange];

    adapter.unsubscribeQuotes([instrument]);

    this.logger.debug({ instrument, exchange }, 'Unsubscribed from exchange quotes');
  }

  private determineExchange(instrument: string): ExchangeId {
    // Kalshi instruments start with "KX"
    if (instrument.startsWith('KX')) {
      return 'kalshi';
    }
    return 'cryptocom';
  }
}
