// ============================================================================
// Mock Crypto.com Adapter Tests
// ============================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MockCryptoComAdapter } from './mock-cryptocom.js';

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('MockCryptoComAdapter', () => {
  let adapter: MockCryptoComAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new MockCryptoComAdapter(mockLogger as any);
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  describe('Connection', () => {
    it('should be connected by default (mock mode)', () => {
      expect(adapter.isConnected()).toBe(true);
    });

    it('should have correct exchange ID', () => {
      expect(adapter.exchangeId).toBe('cryptocom');
    });

    it('should handle disconnect', async () => {
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });

    it('should handle reconnect', async () => {
      await adapter.disconnect();
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('Instruments', () => {
    it('should return list of crypto instruments', async () => {
      const instruments = await adapter.getInstruments();

      expect(instruments.length).toBeGreaterThan(0);
      expect(instruments.every((i) => i.exchange === 'cryptocom')).toBe(true);
      expect(instruments.every((i) => i.type === 'crypto')).toBe(true);
    });

    it('should include BTC-USD', async () => {
      const instruments = await adapter.getInstruments();
      const btc = instruments.find((i) => i.id === 'BTC-USD');

      expect(btc).toBeDefined();
      expect(btc?.baseAsset).toBe('BTC');
      expect(btc?.quoteAsset).toBe('USD');
      expect(btc?.displayName).toBe('Bitcoin');
    });

    it('should include trading info for each instrument', async () => {
      const instruments = await adapter.getInstruments();

      for (const instrument of instruments) {
        expect(instrument.tradingInfo).toBeDefined();
        expect(instrument.tradingInfo.minOrderSize).toBeDefined();
        expect(instrument.tradingInfo.maxOrderSize).toBeDefined();
        expect(instrument.tradingInfo.tickSize).toBeDefined();
      }
    });
  });

  describe('Quotes', () => {
    it('should return quote for valid instrument', async () => {
      const quote = await adapter.getQuote('BTC-USD');

      expect(quote.instrument).toBe('BTC-USD');
      expect(parseFloat(quote.lastPrice)).toBeGreaterThan(0);
      expect(parseFloat(quote.bidPrice)).toBeGreaterThan(0);
      expect(parseFloat(quote.askPrice)).toBeGreaterThan(0);
      expect(parseFloat(quote.bidPrice)).toBeLessThan(parseFloat(quote.askPrice));
    });

    it('should include 24h change data', async () => {
      const quote = await adapter.getQuote('BTC-USD') as any;

      expect(quote.change24h).toBeDefined();
      expect(quote.changePercent24h).toBeDefined();
      expect(quote.high24h).toBeDefined();
      expect(quote.low24h).toBeDefined();
      expect(quote.volume24h).toBeDefined();
    });

    it('should return different prices for different instruments', async () => {
      const btcQuote = await adapter.getQuote('BTC-USD');
      const ethQuote = await adapter.getQuote('ETH-USD');

      expect(parseFloat(btcQuote.lastPrice)).not.toBe(parseFloat(ethQuote.lastPrice));
    });
  });

  describe('Order Book', () => {
    it('should return order book with bids and asks', async () => {
      const orderBook = await adapter.getOrderBook('BTC-USD');

      expect(orderBook.instrument).toBe('BTC-USD');
      expect(orderBook.bids.length).toBeGreaterThan(0);
      expect(orderBook.asks.length).toBeGreaterThan(0);
      expect(orderBook.sequence).toBeDefined();
    });

    it('should respect depth parameter', async () => {
      const orderBook = await adapter.getOrderBook('BTC-USD', 5);

      expect(orderBook.bids.length).toBe(5);
      expect(orderBook.asks.length).toBe(5);
    });

    it('should have bids in descending price order', async () => {
      const orderBook = await adapter.getOrderBook('BTC-USD', 10);

      for (let i = 1; i < orderBook.bids.length; i++) {
        const prevPrice = parseFloat(orderBook.bids[i - 1].price);
        const currPrice = parseFloat(orderBook.bids[i].price);
        expect(prevPrice).toBeGreaterThanOrEqual(currPrice);
      }
    });

    it('should have asks in ascending price order', async () => {
      const orderBook = await adapter.getOrderBook('BTC-USD', 10);

      for (let i = 1; i < orderBook.asks.length; i++) {
        const prevPrice = parseFloat(orderBook.asks[i - 1].price);
        const currPrice = parseFloat(orderBook.asks[i].price);
        expect(prevPrice).toBeLessThanOrEqual(currPrice);
      }
    });
  });

  describe('Order Submission', () => {
    it('should accept market order', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'test-market-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      expect(response.orderId).toBeDefined();
      expect(response.clientOrderId).toBe('test-market-order');
      expect(response.status).toBe('open');
    });

    it('should accept limit order', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'test-limit-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: '0.1',
        price: '60000',
      });

      expect(response.orderId).toBeDefined();
      expect(response.status).toBe('open');
    });

    it('should fill market orders quickly', async () => {
      const response = await adapter.submitOrder({
        clientOrderId: 'fast-fill-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      // Wait for simulated fill
      await new Promise((resolve) => setTimeout(resolve, 500));

      const order = await adapter.getOrder(response.orderId);
      expect(order?.status).toBe('filled');
    });

    it('should generate unique order IDs', async () => {
      const responses = await Promise.all([
        adapter.submitOrder({
          clientOrderId: 'unique-1',
          instrument: 'BTC-USD',
          side: 'buy',
          type: 'market',
          quantity: '0.1',
        }),
        adapter.submitOrder({
          clientOrderId: 'unique-2',
          instrument: 'BTC-USD',
          side: 'buy',
          type: 'market',
          quantity: '0.1',
        }),
      ]);

      expect(responses[0].orderId).not.toBe(responses[1].orderId);
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel open order', async () => {
      const submitResponse = await adapter.submitOrder({
        clientOrderId: 'cancel-test',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: '0.1',
        price: '50000', // Far from market, won't fill
      });

      const cancelResponse = await adapter.cancelOrder({
        orderId: submitResponse.orderId,
      });

      expect(cancelResponse.status).toBe('cancelled');
    });

    it('should throw for non-existent order', async () => {
      await expect(
        adapter.cancelOrder({ orderId: 'non-existent' })
      ).rejects.toThrow('Order not found');
    });
  });

  describe('Order Retrieval', () => {
    it('should retrieve submitted order', async () => {
      const submitResponse = await adapter.submitOrder({
        clientOrderId: 'retrieve-test',
        instrument: 'ETH-USD',
        side: 'sell',
        type: 'limit',
        quantity: '1',
        price: '4000',
      });

      const order = await adapter.getOrder(submitResponse.orderId);

      expect(order).not.toBeNull();
      expect(order?.instrument).toBe('ETH-USD');
      expect(order?.side).toBe('sell');
      expect(order?.quantity).toBe('1');
    });

    it('should return null for non-existent order', async () => {
      const order = await adapter.getOrder('non-existent');
      expect(order).toBeNull();
    });

    it('should list orders with filters', async () => {
      await adapter.submitOrder({
        clientOrderId: 'filter-test-1',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      await adapter.submitOrder({
        clientOrderId: 'filter-test-2',
        instrument: 'ETH-USD',
        side: 'buy',
        type: 'market',
        quantity: '1',
      });

      const btcOrders = await adapter.getOrders({ instrument: 'BTC-USD' });
      expect(btcOrders.every((o) => o.instrument === 'BTC-USD')).toBe(true);
    });
  });

  describe('Account Data', () => {
    it('should return balances', async () => {
      const balances = await adapter.getBalances();

      expect(balances.length).toBeGreaterThan(0);
      expect(balances.every((b) => b.exchange === 'cryptocom')).toBe(true);

      const usdBalance = balances.find((b) => b.currency === 'USD');
      expect(usdBalance).toBeDefined();
      expect(parseFloat(usdBalance!.total)).toBeGreaterThan(0);
    });

    it('should return positions', async () => {
      const positions = await adapter.getPositions();

      expect(positions.length).toBeGreaterThan(0);
      expect(positions.every((p) => p.exchange === 'cryptocom')).toBe(true);

      const btcPosition = positions.find((p) => p.instrument === 'BTC-USD');
      expect(btcPosition).toBeDefined();
    });

    it('should include unrealized P&L in positions', async () => {
      const positions = await adapter.getPositions();

      for (const position of positions) {
        expect(position.unrealizedPnl).toBeDefined();
        expect(position.unrealizedPnlPercent).toBeDefined();
        expect(position.marketValue).toBeDefined();
      }
    });
  });

  describe('Quote Subscriptions', () => {
    it('should receive price updates via subscription', async () => {
      const quotes: any[] = [];
      const callback = (quote: any) => quotes.push(quote);

      adapter.subscribeQuotes(['BTC-USD'], callback);

      // Wait for a few updates
      await new Promise((resolve) => setTimeout(resolve, 1500));

      adapter.unsubscribeQuotes(['BTC-USD']);

      expect(quotes.length).toBeGreaterThan(0);
      expect(quotes.every((q) => q.instrument === 'BTC-USD')).toBe(true);
    });

    it('should stop updates after unsubscribe', async () => {
      const quotes: any[] = [];
      const callback = (quote: any) => quotes.push(quote);

      adapter.subscribeQuotes(['ETH-USD'], callback);
      await new Promise((resolve) => setTimeout(resolve, 600));

      const countBefore = quotes.length;
      adapter.unsubscribeQuotes(['ETH-USD']);

      await new Promise((resolve) => setTimeout(resolve, 600));
      const countAfter = quotes.length;

      // Should have stopped receiving updates
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('Fill Callbacks', () => {
    it('should trigger fill callback when order fills', async () => {
      const fills: any[] = [];
      adapter.onFill((orderId, fill) => fills.push({ orderId, fill }));

      const response = await adapter.submitOrder({
        clientOrderId: 'fill-callback-test',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      // Wait for fill
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(fills.length).toBeGreaterThan(0);
      expect(fills[0].orderId).toBe(response.orderId);
      expect(fills[0].fill.quantity).toBe('0.1');
    });
  });
});
