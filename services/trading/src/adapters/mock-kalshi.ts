// ============================================================================
// Mock Kalshi Exchange Adapter (Prediction Markets)
// ============================================================================

import { v4 as uuid } from 'uuid';
import type { Logger } from 'pino';
import type {
  ExchangeId,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  Order,
  Quote,
  EventQuote,
  OrderBook,
  OrderBookLevel,
  Instrument,
  Balance,
  Position,
  Fill,
  EventCategory,
} from '@k2/types';
import type { BaseExchangeAdapter, GetOrdersParams } from './base-adapter.js';

// Mock event market instruments
const MOCK_EVENT_INSTRUMENTS: Instrument[] = [
  {
    id: 'KXBTC-25DEC31-B100000',
    type: 'event',
    baseAsset: 'YES',
    quoteAsset: 'USD',
    displayName: 'BTC above $100K by Dec 31, 2025',
    exchange: 'kalshi',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '25000',
      tickSize: '0.01',
      lotSize: '1',
      makerFee: '0',
      takerFee: '0.01',
    },
    metadata: {
      eventTitle: 'Bitcoin Price Target',
      eventDescription: 'Will Bitcoin close above $100,000 USD on December 31, 2025?',
      expirationDate: '2025-12-31T23:59:59Z',
      settlementSource: 'CoinGecko BTC/USD closing price',
      category: 'crypto',
    },
  },
  {
    id: 'KXETH-25DEC31-B5000',
    type: 'event',
    baseAsset: 'YES',
    quoteAsset: 'USD',
    displayName: 'ETH above $5K by Dec 31, 2025',
    exchange: 'kalshi',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '25000',
      tickSize: '0.01',
      lotSize: '1',
      makerFee: '0',
      takerFee: '0.01',
    },
    metadata: {
      eventTitle: 'Ethereum Price Target',
      eventDescription: 'Will Ethereum close above $5,000 USD on December 31, 2025?',
      expirationDate: '2025-12-31T23:59:59Z',
      settlementSource: 'CoinGecko ETH/USD closing price',
      category: 'crypto',
    },
  },
  {
    id: 'KXFED-25MAR-RATECUT',
    type: 'event',
    baseAsset: 'YES',
    quoteAsset: 'USD',
    displayName: 'Fed rate cut by March 2025',
    exchange: 'kalshi',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '25000',
      tickSize: '0.01',
      lotSize: '1',
      makerFee: '0',
      takerFee: '0.01',
    },
    metadata: {
      eventTitle: 'Federal Reserve Interest Rate',
      eventDescription: 'Will the Federal Reserve cut interest rates by March 31, 2025?',
      expirationDate: '2025-03-31T23:59:59Z',
      settlementSource: 'Federal Reserve FOMC announcements',
      category: 'economics',
    },
  },
  {
    id: 'KXRECESSION-25Q4',
    type: 'event',
    baseAsset: 'YES',
    quoteAsset: 'USD',
    displayName: 'US Recession by Q4 2025',
    exchange: 'kalshi',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '25000',
      tickSize: '0.01',
      lotSize: '1',
      makerFee: '0',
      takerFee: '0.01',
    },
    metadata: {
      eventTitle: 'US Economic Recession',
      eventDescription: 'Will the NBER declare a US recession starting in 2025?',
      expirationDate: '2025-12-31T23:59:59Z',
      settlementSource: 'National Bureau of Economic Research',
      category: 'economics',
    },
  },
  {
    id: 'KXSP500-25DEC31-B6000',
    type: 'event',
    baseAsset: 'YES',
    quoteAsset: 'USD',
    displayName: 'S&P 500 above 6000 by Dec 31, 2025',
    exchange: 'kalshi',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '25000',
      tickSize: '0.01',
      lotSize: '1',
      makerFee: '0',
      takerFee: '0.01',
    },
    metadata: {
      eventTitle: 'S&P 500 Index Target',
      eventDescription: 'Will the S&P 500 close above 6000 on December 31, 2025?',
      expirationDate: '2025-12-31T23:59:59Z',
      settlementSource: 'S&P 500 official closing price',
      category: 'economics',
    },
  },
  {
    id: 'KXSOL-25DEC31-B500',
    type: 'event',
    baseAsset: 'YES',
    quoteAsset: 'USD',
    displayName: 'SOL above $500 by Dec 31, 2025',
    exchange: 'kalshi',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '25000',
      tickSize: '0.01',
      lotSize: '1',
      makerFee: '0',
      takerFee: '0.01',
    },
    metadata: {
      eventTitle: 'Solana Price Target',
      eventDescription: 'Will Solana close above $500 USD on December 31, 2025?',
      expirationDate: '2025-12-31T23:59:59Z',
      settlementSource: 'CoinGecko SOL/USD closing price',
      category: 'crypto',
    },
  },
];

// Base "yes" prices (0-99 cents representing probability)
const BASE_YES_PRICES: Record<string, number> = {
  'KXBTC-25DEC31-B100000': 45,    // 45% probability
  'KXETH-25DEC31-B5000': 62,      // 62% probability
  'KXFED-25MAR-RATECUT': 78,      // 78% probability
  'KXRECESSION-25Q4': 22,         // 22% probability
  'KXSP500-25DEC31-B6000': 55,    // 55% probability
  'KXSOL-25DEC31-B500': 18,       // 18% probability
};

export class MockKalshiAdapter implements BaseExchangeAdapter {
  readonly exchangeId: ExchangeId = 'kalshi';

  private connected = false;
  private orders: Map<string, Order> = new Map();
  private quoteSubscriptions: Map<string, (quote: Quote) => void> = new Map();
  private priceSimulationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private fillCallback?: (orderId: string, fill: Omit<Fill, 'id' | 'orderId'>) => void;
  private orderUpdateCallback?: (order: Order) => void;

  // Simulated account state
  private balances: Balance[] = [
    { exchange: 'kalshi', currency: 'USD', total: '5000', available: '5000', held: '0' },
  ];

  private positions: Position[] = [
    {
      instrument: 'KXBTC-25DEC31-B100000',
      exchange: 'kalshi',
      quantity: '100',
      avgCost: '0.42',
      marketValue: '45',
      unrealizedPnl: '3',
      unrealizedPnlPercent: '7.14',
      realizedPnl: '0',
      eventSide: 'yes',
      potentialPayout: '100', // $100 if event resolves YES
    },
    {
      instrument: 'KXFED-25MAR-RATECUT',
      exchange: 'kalshi',
      quantity: '50',
      avgCost: '0.75',
      marketValue: '39',
      unrealizedPnl: '1.50',
      unrealizedPnlPercent: '4.00',
      realizedPnl: '0',
      eventSide: 'yes',
      potentialPayout: '50',
    },
  ];

  constructor(private logger: Logger) {
    this.connected = true;
    this.logger.info('Mock Kalshi adapter initialized');
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.logger.info('Mock Kalshi connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.stopAllPriceSimulations();
    this.logger.info('Mock Kalshi disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getInstruments(): Promise<Instrument[]> {
    return MOCK_EVENT_INSTRUMENTS;
  }

  async getQuote(instrument: string): Promise<Quote> {
    const baseYesPrice = BASE_YES_PRICES[instrument] || 50;
    const yesPrice = this.simulateEventPrice(baseYesPrice);
    const noPrice = 100 - yesPrice; // Yes + No always = 100 (cents = $1)

    const spread = 1; // 1 cent spread

    const quote: EventQuote = {
      instrument,
      bidPrice: ((yesPrice - spread) / 100).toFixed(2),
      bidSize: Math.floor(Math.random() * 500 + 50).toString(),
      askPrice: ((yesPrice + spread) / 100).toFixed(2),
      askSize: Math.floor(Math.random() * 500 + 50).toString(),
      lastPrice: (yesPrice / 100).toFixed(2),
      lastSize: Math.floor(Math.random() * 20 + 1).toString(),
      timestamp: new Date().toISOString(),
      yesPrice: (yesPrice / 100).toFixed(2),
      noPrice: (noPrice / 100).toFixed(2),
      yesBid: ((yesPrice - spread) / 100).toFixed(2),
      yesAsk: ((yesPrice + spread) / 100).toFixed(2),
      change24h: ((Math.random() - 0.5) * 6 / 100).toFixed(2), // +/- 3 cents
      volume24h: Math.floor(Math.random() * 50000 + 1000).toString(),
      openInterest: Math.floor(Math.random() * 100000 + 10000).toString(),
    };

    return quote;
  }

  async getOrderBook(instrument: string, depth = 10): Promise<OrderBook> {
    const baseYesPrice = BASE_YES_PRICES[instrument] || 50;
    const midPrice = this.simulateEventPrice(baseYesPrice) / 100;

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    for (let i = 0; i < depth; i++) {
      const bidPrice = Math.max(0.01, midPrice - 0.01 * (i + 1));
      const askPrice = Math.min(0.99, midPrice + 0.01 * (i + 1));

      bids.push({
        price: bidPrice.toFixed(2),
        size: Math.floor(Math.random() * 200 + 10).toString(),
      });

      asks.push({
        price: askPrice.toFixed(2),
        size: Math.floor(Math.random() * 200 + 10).toString(),
      });
    }

    return {
      instrument,
      bids,
      asks,
      sequence: Date.now(),
      timestamp: new Date().toISOString(),
    };
  }

  subscribeQuotes(instruments: string[], callback: (quote: Quote) => void): void {
    for (const instrument of instruments) {
      this.quoteSubscriptions.set(instrument, callback);
      this.startPriceSimulation(instrument);
    }
  }

  unsubscribeQuotes(instruments: string[]): void {
    for (const instrument of instruments) {
      this.quoteSubscriptions.delete(instrument);
      this.stopPriceSimulation(instrument);
    }
  }

  async submitOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    const orderId = uuid();
    const now = new Date().toISOString();

    await this.delay(30 + Math.random() * 70);

    // For event markets, quantity is number of contracts (each pays $1 if correct)
    const order: Order = {
      id: orderId,
      clientOrderId: request.clientOrderId,
      userId: 'mock-user',
      instrument: request.instrument,
      exchange: 'kalshi',
      side: request.side, // 'buy' for buying contracts
      type: request.type,
      status: 'open',
      quantity: request.quantity, // Number of contracts
      filledQuantity: '0',
      remainingQuantity: request.quantity,
      price: request.price, // Price per contract (0.01 to 0.99)
      timeInForce: request.timeInForce || 'gtc',
      createdAt: now,
      updatedAt: now,
      fills: [],
      fees: '0',
      feeCurrency: 'USD',
      externalOrderId: `KALSHI-${orderId.slice(0, 8)}`,
    };

    this.orders.set(orderId, order);

    // Simulate fill
    if (request.type === 'market') {
      this.simulateFill(orderId);
    } else {
      setTimeout(() => {
        if (Math.random() > 0.2) {
          this.simulateFill(orderId);
        }
      }, 500 + Math.random() * 2000);
    }

    return {
      orderId,
      clientOrderId: request.clientOrderId,
      status: 'open',
      createdAt: now,
    };
  }

  async cancelOrder(request: CancelOrderRequest): Promise<CancelOrderResponse> {
    const order = this.orders.get(request.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    await this.delay(20 + Math.random() * 40);

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();

    if (this.orderUpdateCallback) {
      this.orderUpdateCallback(order);
    }

    return {
      orderId: order.id,
      status: 'cancelled',
      cancelledAt: order.updatedAt,
    };
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  async getOrders(params?: GetOrdersParams): Promise<Order[]> {
    let orders = Array.from(this.orders.values());

    if (params?.status) {
      orders = orders.filter((o) => params.status!.includes(o.status));
    }

    if (params?.instrument) {
      orders = orders.filter((o) => o.instrument === params.instrument);
    }

    return orders.slice(0, params?.limit || 100);
  }

  async getBalances(): Promise<Balance[]> {
    return this.balances;
  }

  async getPositions(): Promise<Position[]> {
    // Update market values
    for (const position of this.positions) {
      const basePrice = BASE_YES_PRICES[position.instrument];
      if (basePrice) {
        const currentPrice = this.simulateEventPrice(basePrice) / 100;
        const qty = parseFloat(position.quantity);
        const avgCost = parseFloat(position.avgCost);

        position.marketValue = (qty * currentPrice).toFixed(2);
        position.unrealizedPnl = (qty * (currentPrice - avgCost)).toFixed(2);
        position.unrealizedPnlPercent = (
          ((currentPrice - avgCost) / avgCost) *
          100
        ).toFixed(2);
      }
    }

    return this.positions;
  }

  onFill(callback: (orderId: string, fill: Omit<Fill, 'id' | 'orderId'>) => void): void {
    this.fillCallback = callback;
  }

  onOrderUpdate(callback: (order: Order) => void): void {
    this.orderUpdateCallback = callback;
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private simulateEventPrice(basePrice: number): number {
    // Event prices move slowly, +/- 1-2 cents
    const change = (Math.random() - 0.5) * 2;
    return Math.max(1, Math.min(99, Math.round(basePrice + change)));
  }

  private startPriceSimulation(instrument: string): void {
    if (this.priceSimulationIntervals.has(instrument)) return;

    const interval = setInterval(async () => {
      const callback = this.quoteSubscriptions.get(instrument);
      if (callback) {
        const quote = await this.getQuote(instrument);
        callback(quote);
      }
    }, 1000); // Event markets update slower

    this.priceSimulationIntervals.set(instrument, interval);
  }

  private stopPriceSimulation(instrument: string): void {
    const interval = this.priceSimulationIntervals.get(instrument);
    if (interval) {
      clearInterval(interval);
      this.priceSimulationIntervals.delete(instrument);
    }
  }

  private stopAllPriceSimulations(): void {
    for (const interval of this.priceSimulationIntervals.values()) {
      clearInterval(interval);
    }
    this.priceSimulationIntervals.clear();
  }

  private async simulateFill(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order || order.status === 'filled' || order.status === 'cancelled') {
      return;
    }

    await this.delay(50 + Math.random() * 100);

    const basePrice = BASE_YES_PRICES[order.instrument] || 50;
    const fillPrice = order.price
      ? parseFloat(order.price)
      : this.simulateEventPrice(basePrice) / 100;

    const fillQty = order.remainingQuantity;
    const contracts = parseFloat(fillQty);
    const fee = contracts * 0.01; // 1 cent per contract

    const fill: Omit<Fill, 'id' | 'orderId'> = {
      price: fillPrice.toFixed(2),
      quantity: fillQty,
      fee: fee.toFixed(2),
      feeCurrency: 'USD',
      side: order.side,
      timestamp: new Date().toISOString(),
      externalTradeId: `KALSHI-TRADE-${uuid().slice(0, 8)}`,
    };

    order.status = 'filled';
    order.filledQuantity = order.quantity;
    order.remainingQuantity = '0';
    order.avgFillPrice = fillPrice.toFixed(2);
    order.fees = fee.toFixed(2);
    order.updatedAt = new Date().toISOString();
    order.fills.push({ id: uuid(), orderId, ...fill });

    if (this.fillCallback) {
      this.fillCallback(orderId, fill);
    }

    if (this.orderUpdateCallback) {
      this.orderUpdateCallback(order);
    }

    this.logger.debug(
      { orderId, fillPrice, fillQty, status: order.status },
      'Mock Kalshi order filled'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
