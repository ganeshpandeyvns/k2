// ============================================================================
// Mock Kalshi Adapter Tests
// ============================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MockKalshiAdapter } from './mock-kalshi.js';

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('MockKalshiAdapter', () => {
  let adapter: MockKalshiAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new MockKalshiAdapter(mockLogger as any);
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('Connection', () => {
    it('should be connected by default (mock mode)', () => {
      expect(adapter.isConnected()).toBe(true);
    });

    it('should have correct exchange ID', () => {
      expect(adapter.exchangeId).toBe('kalshi');
    });

    it('should handle disconnect', async () => {
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('Instruments', () => {
    it('should return list of event instruments', async () => {
      const instruments = await adapter.getInstruments();

      expect(instruments.length).toBeGreaterThan(0);
      expect(instruments.every((i) => i.exchange === 'kalshi')).toBe(true);
      expect(instruments.every((i) => i.type === 'event')).toBe(true);
    });

    it('should include event metadata', async () => {
      const instruments = await adapter.getInstruments();
      const btcEvent = instruments.find((i) => i.id.includes('BTC'));

      expect(btcEvent).toBeDefined();
      expect(btcEvent?.metadata?.eventTitle).toBeDefined();
      expect(btcEvent?.metadata?.eventDescription).toBeDefined();
      expect(btcEvent?.metadata?.expirationDate).toBeDefined();
      expect(btcEvent?.metadata?.settlementSource).toBeDefined();
      expect(btcEvent?.metadata?.category).toBeDefined();
    });

    it('should have YES as base asset for event contracts', async () => {
      const instruments = await adapter.getInstruments();

      for (const instrument of instruments) {
        expect(instrument.baseAsset).toBe('YES');
        expect(instrument.quoteAsset).toBe('USD');
      }
    });
  });

  describe('Quotes', () => {
    it('should return event quote with yes/no prices', async () => {
      const quote = await adapter.getQuote('KXBTC-25DEC31-B100000') as any;

      expect(quote.instrument).toBe('KXBTC-25DEC31-B100000');
      expect(quote.yesPrice).toBeDefined();
      expect(quote.noPrice).toBeDefined();

      // Yes + No should equal approximately 1.00 (100 cents)
      const total = parseFloat(quote.yesPrice) + parseFloat(quote.noPrice);
      expect(total).toBeCloseTo(1.0, 1);
    });

    it('should have prices between 0 and 1', async () => {
      const quote = await adapter.getQuote('KXBTC-25DEC31-B100000') as any;

      expect(parseFloat(quote.yesPrice)).toBeGreaterThanOrEqual(0.01);
      expect(parseFloat(quote.yesPrice)).toBeLessThanOrEqual(0.99);
      expect(parseFloat(quote.noPrice)).toBeGreaterThanOrEqual(0.01);
      expect(parseFloat(quote.noPrice)).toBeLessThanOrEqual(0.99);
    });

    it('should include volume and open interest', async () => {
      const quote = await adapter.getQuote('KXBTC-25DEC31-B100000') as any;

      expect(quote.volume24h).toBeDefined();
      expect(quote.openInterest).toBeDefined();
    });
  });

  describe('Order Book', () => {
    it('should return order book for event contract', async () => {
      const orderBook = await adapter.getOrderBook('KXBTC-25DEC31-B100000');

      expect(orderBook.instrument).toBe('KXBTC-25DEC31-B100000');
      expect(orderBook.bids.length).toBeGreaterThan(0);
      expect(orderBook.asks.length).toBeGreaterThan(0);
    });

    it('should have prices in 0-1 range for events', async () => {
      const orderBook = await adapter.getOrderBook('KXBTC-25DEC31-B100000', 5);

      for (const bid of orderBook.bids) {
        const price = parseFloat(bid.price);
        expect(price).toBeGreaterThanOrEqual(0.01);
        expect(price).toBeLessThanOrEqual(0.99);
      }

      for (const ask of orderBook.asks) {
        const price = parseFloat(ask.price);
        expect(price).toBeGreaterThanOrEqual(0.01);
        expect(price).toBeLessThanOrEqual(0.99);
      }
    });
  });

  describe('Order Submission', () => {
    it('should accept event contract order', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'event-order-test',
        instrument: 'KXBTC-25DEC31-B100000',
        side: 'buy',
        type: 'market',
        quantity: '10', // 10 contracts
      });

      expect(response.orderId).toBeDefined();
      expect(response.status).toBe('open');
    });

    it('should accept limit order with price', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'event-limit-order',
        instrument: 'KXBTC-25DEC31-B100000',
        side: 'buy',
        type: 'limit',
        quantity: '5',
        price: '0.45', // 45 cents
      });

      expect(response.orderId).toBeDefined();
    });

    it('should fill market orders', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'event-fill-test',
        instrument: 'KXBTC-25DEC31-B100000',
        side: 'buy',
        type: 'market',
        quantity: '10',
      });

      // Wait for fill
      await new Promise((resolve) => setTimeout(resolve, 300));

      const order = await adapter.getOrder(response.orderId);
      expect(order?.status).toBe('filled');
    });

    it('should calculate correct fees for event contracts', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'event-fee-test',
        instrument: 'KXBTC-25DEC31-B100000',
        side: 'buy',
        type: 'market',
        quantity: '100', // 100 contracts
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      const order = await adapter.getOrder(response.orderId);

      // Fee should be 1 cent per contract = $1.00
      expect(parseFloat(order?.fees || '0')).toBeCloseTo(1.0, 1);
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel limit order', async () => {
      const submitResponse = await adapter.submitOrder({
        clientOrderId: 'event-cancel-test',
        instrument: 'KXFED-25MAR-RATECUT',
        side: 'buy',
        type: 'limit',
        quantity: '10',
        price: '0.50',
      });

      const cancelResponse = await adapter.cancelOrder({
        orderId: submitResponse.orderId,
      });

      expect(cancelResponse.status).toBe('cancelled');
    });
  });

  describe('Account Data', () => {
    it('should return USD balance only', async () => {
      const balances = await adapter.getBalances();

      expect(balances.length).toBe(1);
      expect(balances[0].currency).toBe('USD');
      expect(balances[0].exchange).toBe('kalshi');
    });

    it('should return event positions with potential payout', async () => {
      const positions = await adapter.getPositions();

      expect(positions.length).toBeGreaterThan(0);

      for (const position of positions) {
        expect(position.exchange).toBe('kalshi');
        expect(position.eventSide).toBeDefined();
        expect(position.potentialPayout).toBeDefined();
      }
    });

    it('should show yes/no side for event positions', async () => {
      const positions = await adapter.getPositions();
      const btcPosition = positions.find((p) => p.instrument.includes('BTC'));

      if (btcPosition) {
        expect(['yes', 'no']).toContain(btcPosition.eventSide);
      }
    });
  });

  describe('Quote Subscriptions', () => {
    it('should receive event price updates', async () => {
      const quotes: any[] = [];
      adapter.subscribeQuotes(['KXBTC-25DEC31-B100000'], (quote) => quotes.push(quote));

      await new Promise((resolve) => setTimeout(resolve, 2500));

      adapter.unsubscribeQuotes(['KXBTC-25DEC31-B100000']);

      expect(quotes.length).toBeGreaterThan(0);
    });
  });

  describe('Event-Specific Behavior', () => {
    it('should use whole number quantities (contracts)', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'whole-contract-test',
        instrument: 'KXBTC-25DEC31-B100000',
        side: 'buy',
        type: 'market',
        quantity: '25', // Should be accepted as-is
      });

      const order = await adapter.getOrder(response.orderId);
      expect(order?.quantity).toBe('25');
    });

    it('should have different prices for different events', async () => {
      const btcQuote = await adapter.getQuote('KXBTC-25DEC31-B100000') as any;
      const fedQuote = await adapter.getQuote('KXFED-25MAR-RATECUT') as any;

      // These should have different probability levels
      expect(btcQuote.yesPrice).not.toBe(fedQuote.yesPrice);
    });
  });
});
