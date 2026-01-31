// ============================================================================
// Mock Crypto.com Exchange Adapter
// ============================================================================

import { v4 as uuid } from 'uuid';
import type { Logger } from 'pino';
import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.default || DecimalJS;
import type {
  ExchangeId,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  Order,
  Quote,
  CryptoQuote,
  OrderBook,
  OrderBookLevel,
  Instrument,
  Balance,
  Position,
  Fill,
  OrderStatus,
} from '@k2/types';
import type { BaseExchangeAdapter, GetOrdersParams } from './base-adapter.js';

// Simulated instruments
const MOCK_INSTRUMENTS: Instrument[] = [
  {
    id: 'BTC-USD',
    type: 'crypto',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    displayName: 'Bitcoin',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '0.0001',
      maxOrderSize: '100',
      tickSize: '0.01',
      lotSize: '0.0001',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'bitcoin',
      iconUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    },
  },
  {
    id: 'ETH-USD',
    type: 'crypto',
    baseAsset: 'ETH',
    quoteAsset: 'USD',
    displayName: 'Ethereum',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '0.001',
      maxOrderSize: '1000',
      tickSize: '0.01',
      lotSize: '0.001',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'ethereum',
      iconUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    },
  },
  {
    id: 'SOL-USD',
    type: 'crypto',
    baseAsset: 'SOL',
    quoteAsset: 'USD',
    displayName: 'Solana',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '0.01',
      maxOrderSize: '10000',
      tickSize: '0.001',
      lotSize: '0.01',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'solana',
      iconUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    },
  },
  {
    id: 'DOGE-USD',
    type: 'crypto',
    baseAsset: 'DOGE',
    quoteAsset: 'USD',
    displayName: 'Dogecoin',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '1000000',
      tickSize: '0.00001',
      lotSize: '1',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'dogecoin',
      iconUrl: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    },
  },
  {
    id: 'XRP-USD',
    type: 'crypto',
    baseAsset: 'XRP',
    quoteAsset: 'USD',
    displayName: 'XRP',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '100000',
      tickSize: '0.0001',
      lotSize: '1',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'ripple',
      iconUrl: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    },
  },
  {
    id: 'ADA-USD',
    type: 'crypto',
    baseAsset: 'ADA',
    quoteAsset: 'USD',
    displayName: 'Cardano',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '1',
      maxOrderSize: '100000',
      tickSize: '0.0001',
      lotSize: '1',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'cardano',
      iconUrl: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    },
  },
  {
    id: 'AVAX-USD',
    type: 'crypto',
    baseAsset: 'AVAX',
    quoteAsset: 'USD',
    displayName: 'Avalanche',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '0.01',
      maxOrderSize: '10000',
      tickSize: '0.01',
      lotSize: '0.01',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'avalanche-2',
      iconUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    },
  },
  {
    id: 'LINK-USD',
    type: 'crypto',
    baseAsset: 'LINK',
    quoteAsset: 'USD',
    displayName: 'Chainlink',
    exchange: 'cryptocom',
    status: 'active',
    tradingInfo: {
      minOrderSize: '0.1',
      maxOrderSize: '10000',
      tickSize: '0.001',
      lotSize: '0.1',
      makerFee: '0.001',
      takerFee: '0.002',
    },
    metadata: {
      coinGeckoId: 'chainlink',
      iconUrl: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    },
  },
];

// Base prices for simulation
const BASE_PRICES: Record<string, number> = {
  'BTC-USD': 65000,
  'ETH-USD': 3500,
  'SOL-USD': 150,
  'DOGE-USD': 0.15,
  'XRP-USD': 0.55,
  'ADA-USD': 0.60,
  'AVAX-USD': 40,
  'LINK-USD': 18,
};

export class MockCryptoComAdapter implements BaseExchangeAdapter {
  readonly exchangeId: ExchangeId = 'cryptocom';

  private connected = false;
  private orders: Map<string, Order> = new Map();
  private quoteSubscriptions: Map<string, (quote: Quote) => void> = new Map();
  private priceSimulationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private fillCallback?: (orderId: string, fill: Omit<Fill, 'id' | 'orderId'>) => void;
  private orderUpdateCallback?: (order: Order) => void;

  // Simulated account state
  private balances: Balance[] = [
    { exchange: 'cryptocom', currency: 'USD', total: '100000', available: '100000', held: '0' },
    { exchange: 'cryptocom', currency: 'BTC', total: '1.5', available: '1.5', held: '0' },
    { exchange: 'cryptocom', currency: 'ETH', total: '10', available: '10', held: '0' },
  ];

  private positions: Position[] = [
    {
      instrument: 'BTC-USD',
      exchange: 'cryptocom',
      quantity: '1.5',
      avgCost: '62000',
      marketValue: '97500',
      unrealizedPnl: '4500',
      unrealizedPnlPercent: '4.84',
      realizedPnl: '0',
    },
    {
      instrument: 'ETH-USD',
      exchange: 'cryptocom',
      quantity: '10',
      avgCost: '3200',
      marketValue: '35000',
      unrealizedPnl: '3000',
      unrealizedPnlPercent: '9.38',
      realizedPnl: '0',
    },
  ];

  constructor(private logger: Logger) {
    // Auto-connect in mock mode
    this.connected = true;
    this.logger.info('Mock Crypto.com adapter initialized');
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.logger.info('Mock Crypto.com connected');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.stopAllPriceSimulations();
    this.logger.info('Mock Crypto.com disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getInstruments(): Promise<Instrument[]> {
    return MOCK_INSTRUMENTS;
  }

  async getQuote(instrument: string): Promise<Quote> {
    const basePrice = BASE_PRICES[instrument] || 100;
    const price = this.simulatePrice(basePrice);
    const spread = basePrice * 0.0002; // 0.02% spread

    const quote: CryptoQuote = {
      instrument,
      bidPrice: (price - spread).toFixed(2),
      bidSize: (Math.random() * 10).toFixed(4),
      askPrice: (price + spread).toFixed(2),
      askSize: (Math.random() * 10).toFixed(4),
      lastPrice: price.toFixed(2),
      lastSize: (Math.random() * 2).toFixed(4),
      timestamp: new Date().toISOString(),
      change24h: (basePrice * 0.02 * (Math.random() - 0.5)).toFixed(2),
      changePercent24h: ((Math.random() - 0.5) * 4).toFixed(2),
      high24h: (basePrice * 1.03).toFixed(2),
      low24h: (basePrice * 0.97).toFixed(2),
      volume24h: (Math.random() * 10000).toFixed(2),
      vwap24h: price.toFixed(2),
    };

    return quote;
  }

  async getOrderBook(instrument: string, depth = 10): Promise<OrderBook> {
    const basePrice = BASE_PRICES[instrument] || 100;
    const midPrice = this.simulatePrice(basePrice);

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    for (let i = 0; i < depth; i++) {
      const bidPrice = midPrice * (1 - 0.0001 * (i + 1));
      const askPrice = midPrice * (1 + 0.0001 * (i + 1));

      bids.push({
        price: bidPrice.toFixed(2),
        size: (Math.random() * 5 + 0.1).toFixed(4),
      });

      asks.push({
        price: askPrice.toFixed(2),
        size: (Math.random() * 5 + 0.1).toFixed(4),
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

    // Simulate network latency
    await this.delay(50 + Math.random() * 100);

    const order: Order = {
      id: orderId,
      clientOrderId: request.clientOrderId,
      userId: 'mock-user',
      instrument: request.instrument,
      exchange: 'cryptocom',
      side: request.side,
      type: request.type,
      status: 'open',
      quantity: request.quantity,
      filledQuantity: '0',
      remainingQuantity: request.quantity,
      price: request.price,
      timeInForce: request.timeInForce || 'gtc',
      createdAt: now,
      updatedAt: now,
      fills: [],
      fees: '0',
      feeCurrency: 'USD',
      externalOrderId: `CDC-${orderId.slice(0, 8)}`,
    };

    this.orders.set(orderId, order);

    // Simulate fill for market orders
    if (request.type === 'market') {
      this.simulateFill(orderId);
    } else {
      // For limit orders, randomly fill after a delay
      setTimeout(() => {
        if (Math.random() > 0.3) {
          this.simulateFill(orderId);
        }
      }, 1000 + Math.random() * 4000);
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

    await this.delay(30 + Math.random() * 50);

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
    // Update market values based on current prices
    for (const position of this.positions) {
      const basePrice = BASE_PRICES[position.instrument];
      if (basePrice) {
        const currentPrice = this.simulatePrice(basePrice);
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
  // Private Simulation Methods
  // --------------------------------------------------------------------------

  private simulatePrice(basePrice: number): number {
    // Add small random walk
    const volatility = 0.0005; // 0.05% per tick
    const change = basePrice * volatility * (Math.random() - 0.5) * 2;
    return basePrice + change;
  }

  private startPriceSimulation(instrument: string): void {
    if (this.priceSimulationIntervals.has(instrument)) return;

    const interval = setInterval(async () => {
      const callback = this.quoteSubscriptions.get(instrument);
      if (callback) {
        const quote = await this.getQuote(instrument);
        callback(quote);
      }
    }, 500); // Update every 500ms

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

    await this.delay(100 + Math.random() * 200);

    const basePrice = BASE_PRICES[order.instrument] || 100;
    const fillPrice = order.price
      ? parseFloat(order.price)
      : this.simulatePrice(basePrice);

    const fillQty = order.remainingQuantity;
    const feeRate = 0.002; // 0.2% taker fee
    const fee = parseFloat(fillQty) * fillPrice * feeRate;

    const fill: Omit<Fill, 'id' | 'orderId'> = {
      price: fillPrice.toFixed(2),
      quantity: fillQty,
      fee: fee.toFixed(4),
      feeCurrency: 'USD',
      side: order.side,
      timestamp: new Date().toISOString(),
      externalTradeId: `CDC-TRADE-${uuid().slice(0, 8)}`,
    };

    // Update order
    order.status = 'filled';
    order.filledQuantity = order.quantity;
    order.remainingQuantity = '0';
    order.avgFillPrice = fillPrice.toFixed(2);
    order.fees = fee.toFixed(4);
    order.updatedAt = new Date().toISOString();
    order.fills.push({ id: uuid(), orderId, ...fill });

    // Notify callbacks
    if (this.fillCallback) {
      this.fillCallback(orderId, fill);
    }

    if (this.orderUpdateCallback) {
      this.orderUpdateCallback(order);
    }

    this.logger.debug(
      { orderId, fillPrice, fillQty, status: order.status },
      'Mock order filled'
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
