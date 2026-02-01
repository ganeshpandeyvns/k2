// ============================================================================
// E2E API Integration Tests - Mobile App
// ============================================================================
// These tests verify the mobile app can communicate with the trading API
// Run with: pnpm test

const API_BASE_URL = 'http://localhost:3001/v1';

describe('Mobile App API Integration', () => {
  // Test API connectivity
  describe('API Connectivity', () => {
    it('should connect to trading API health endpoint', async () => {
      const response = await fetch('http://localhost:3001/health');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('healthy');
    });
  });

  // Test Instruments API
  describe('Instruments API', () => {
    it('should fetch all instruments for Markets screen', async () => {
      const response = await fetch(`${API_BASE_URL}/instruments`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // Verify instrument structure matches what mobile app expects
      const instrument = data.data[0];
      expect(instrument).toHaveProperty('id');
      expect(instrument).toHaveProperty('displayName');
      expect(instrument).toHaveProperty('type');
      expect(instrument).toHaveProperty('exchange');
    });

    it('should fetch crypto instruments for Crypto tab', async () => {
      const response = await fetch(`${API_BASE_URL}/instruments/crypto`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      data.data.forEach((instrument: any) => {
        expect(instrument.exchange).toBe('cryptocom');
        expect(instrument.type).toBe('crypto');
      });
    });

    it('should fetch event instruments for Events tab', async () => {
      const response = await fetch(`${API_BASE_URL}/instruments/events`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      data.data.forEach((instrument: any) => {
        expect(instrument.exchange).toBe('kalshi');
        expect(instrument.type).toBe('event');
      });
    });
  });

  // Test Quotes API
  describe('Quotes API', () => {
    it('should fetch live quote for InstrumentDetail screen', async () => {
      const response = await fetch(`${API_BASE_URL}/instruments/BTC-USD/quote`);
      const data = await response.json();

      expect(response.ok).toBe(true);

      // Verify quote structure for PriceCard component
      const quote = data.data;
      expect(quote).toHaveProperty('bidPrice');
      expect(quote).toHaveProperty('askPrice');
      expect(quote).toHaveProperty('lastPrice');
      expect(quote).toHaveProperty('change24h');
      expect(quote).toHaveProperty('changePercent24h');
      expect(quote).toHaveProperty('volume24h');
    });

    it('should fetch batch quotes for Watchlist', async () => {
      const watchlistInstruments = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

      const response = await fetch(`${API_BASE_URL}/instruments/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruments: watchlistInstruments }),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.length).toBe(watchlistInstruments.length);

      // Verify each quote can be rendered in MarketRow
      data.data.forEach((quote: any) => {
        expect(quote.instrument).toBeDefined();
        expect(quote.lastPrice).toBeDefined();
        expect(quote.changePercent24h).toBeDefined();
      });
    });
  });

  // Test Order Book API
  describe('Order Book API', () => {
    it('should fetch order book for Trade screen', async () => {
      const response = await fetch(`${API_BASE_URL}/instruments/BTC-USD/orderbook`);
      const data = await response.json();

      expect(response.ok).toBe(true);

      const orderBook = data.data;
      expect(Array.isArray(orderBook.bids)).toBe(true);
      expect(Array.isArray(orderBook.asks)).toBe(true);

      // Verify bid/ask structure
      if (orderBook.bids.length > 0) {
        const bid = orderBook.bids[0];
        expect(bid).toHaveProperty('price');
        expect(bid).toHaveProperty('size');
      }
    });
  });

  // Test Portfolio API
  describe('Portfolio API', () => {
    it('should fetch portfolio summary for Portfolio screen', async () => {
      const response = await fetch(`${API_BASE_URL}/portfolio`);
      const data = await response.json();

      expect(response.ok).toBe(true);

      // Verify portfolio structure
      const portfolio = data.data;
      expect(portfolio).toHaveProperty('totalValue');
      expect(portfolio).toHaveProperty('totalPnl');
      expect(portfolio).toHaveProperty('totalPnlPercent');
    });

    it('should fetch balances for Portfolio screen', async () => {
      const response = await fetch(`${API_BASE_URL}/portfolio/balances`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // Verify balance structure
      if (data.data.length > 0) {
        const balance = data.data[0];
        expect(balance).toHaveProperty('asset');
        expect(balance).toHaveProperty('free');
        expect(balance).toHaveProperty('locked');
      }
    });

    it('should fetch positions for Portfolio screen', async () => {
      const response = await fetch(`${API_BASE_URL}/portfolio/positions`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);

      // Verify position structure for PositionCard
      if (data.data.length > 0) {
        const position = data.data[0];
        expect(position).toHaveProperty('instrument');
        expect(position).toHaveProperty('quantity');
        expect(position).toHaveProperty('averagePrice');
        expect(position).toHaveProperty('unrealizedPnl');
      }
    });
  });

  // Test Orders API
  describe('Orders API', () => {
    it('should create order from Trade screen', async () => {
      const order = {
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.001',
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);

      // Verify order response for OrderConfirm screen
      const createdOrder = data.data;
      expect(createdOrder).toHaveProperty('orderId');
      expect(createdOrder).toHaveProperty('clientOrderId');
      expect(createdOrder).toHaveProperty('status');
      expect(createdOrder).toHaveProperty('createdAt');
    });

    it('should fetch open orders', async () => {
      const response = await fetch(`${API_BASE_URL}/orders/open`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should fetch order history', async () => {
      const response = await fetch(`${API_BASE_URL}/orders/history`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});
