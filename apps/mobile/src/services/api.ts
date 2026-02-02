// ============================================================================
// API Service
// ============================================================================

import {
  DEMO_STOCKS,
  DEMO_STOCK_QUOTES,
  STOCK_COMPANY_INFO,
  searchStocks as searchDemoStocks,
  type StockInstrument,
  type StockQuote,
  type StockCompanyInfo,
} from '../utils/mockStockData';
import { getMarketStatus, type MarketStatus } from '../utils/marketHours';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/v1'
  : 'https://api.k2.app/v1';

// Demo mode - set to true to use mock data
const DEMO_MODE = true;

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data;
  }

  // Instruments
  async getInstruments(type?: 'crypto' | 'event') {
    const query = type ? `?type=${type}` : '';
    return this.request<any[]>(`/instruments${query}`);
  }

  async getInstrument(instrumentId: string) {
    return this.request<any>(`/instruments/${instrumentId}`);
  }

  async getQuote(instrumentId: string) {
    return this.request<any>(`/instruments/${instrumentId}/quote`);
  }

  async getQuotes(instrumentIds: string[]) {
    return this.request<any[]>('/instruments/quotes', {
      method: 'POST',
      body: JSON.stringify({ instruments: instrumentIds }),
    });
  }

  // Portfolio
  async getPortfolio() {
    return this.request<any>('/portfolio');
  }

  async getBalances() {
    return this.request<any[]>('/portfolio/balances');
  }

  async getPositions() {
    return this.request<any[]>('/portfolio/positions');
  }

  async getPosition(instrumentId: string) {
    try {
      return await this.request<any>(`/portfolio/positions/instrument/${instrumentId}`);
    } catch {
      return null;
    }
  }

  // Orders
  async createOrder(order: {
    instrument: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    quantity: string;
    price?: string;
    eventSide?: 'yes' | 'no';
  }) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async cancelOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  async getOrder(orderId: string) {
    return this.request<any>(`/orders/${orderId}`);
  }

  async getOpenOrders() {
    return this.request<any[]>('/orders/open');
  }

  async getOrderHistory() {
    return this.request<any[]>('/orders/history');
  }

  // Watchlist
  async getWatchlistQuotes() {
    // For now, return mock data for default watchlist
    const instruments = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'KXBTC-25DEC31-B100000'];
    return this.getQuotes(instruments);
  }

  // ============================================================================
  // Stock Trading Endpoints
  // ============================================================================

  // Get all available stocks
  async getStocks(): Promise<StockInstrument[]> {
    if (DEMO_MODE) {
      return DEMO_STOCKS;
    }
    return this.request<StockInstrument[]>('/instruments/stocks');
  }

  // Search stocks by symbol or name
  async searchStocks(query: string): Promise<StockInstrument[]> {
    if (DEMO_MODE) {
      return searchDemoStocks(query);
    }
    return this.request<StockInstrument[]>(`/instruments/stocks/search?q=${encodeURIComponent(query)}`);
  }

  // Get stock details
  async getStock(symbol: string): Promise<StockInstrument | null> {
    if (DEMO_MODE) {
      return DEMO_STOCKS.find((s) => s.symbol === symbol) || null;
    }
    return this.request<StockInstrument>(`/instruments/stocks/${symbol}`);
  }

  // Get stock quote
  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    if (DEMO_MODE) {
      const quote = DEMO_STOCK_QUOTES[symbol];
      if (quote) {
        // Add small random fluctuation for realism
        const fluctuation = (Math.random() - 0.5) * 0.5;
        return {
          ...quote,
          price: quote.price + fluctuation,
          change: quote.change + fluctuation,
          changePercent: ((quote.change + fluctuation) / (quote.previousClose)) * 100,
        };
      }
      return null;
    }
    return this.request<StockQuote>(`/instruments/stocks/${symbol}/quote`);
  }

  // Get multiple stock quotes
  async getStockQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
    if (DEMO_MODE) {
      const quotes: Record<string, StockQuote> = {};
      for (const symbol of symbols) {
        const quote = DEMO_STOCK_QUOTES[symbol];
        if (quote) {
          // Add small random fluctuation for realism
          const fluctuation = (Math.random() - 0.5) * 0.5;
          quotes[symbol] = {
            ...quote,
            price: quote.price + fluctuation,
            change: quote.change + fluctuation,
            changePercent: ((quote.change + fluctuation) / (quote.previousClose)) * 100,
          };
        }
      }
      return quotes;
    }
    return this.request<Record<string, StockQuote>>('/instruments/stocks/quotes', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    });
  }

  // Get company info
  async getCompanyInfo(symbol: string): Promise<StockCompanyInfo | null> {
    if (DEMO_MODE) {
      return STOCK_COMPANY_INFO[symbol] || null;
    }
    return this.request<StockCompanyInfo>(`/instruments/stocks/${symbol}/company`);
  }

  // Get market status
  async getMarketStatus(): Promise<MarketStatus> {
    if (DEMO_MODE) {
      return getMarketStatus();
    }
    return this.request<MarketStatus>('/market/status');
  }

  // Create stock order
  async createStockOrder(order: {
    symbol: string;
    side: 'buy' | 'sell';
    orderType: 'market' | 'limit';
    amountType: 'dollars' | 'shares';
    amount: number;
    limitPrice?: number;
    extendedHours?: boolean;
    timeInForce?: 'day' | 'gtc';
  }): Promise<StockOrder> {
    if (DEMO_MODE) {
      // Simulate order execution in demo mode
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const quote = DEMO_STOCK_QUOTES[order.symbol];
      if (!quote) {
        throw new Error(`Unknown symbol: ${order.symbol}`);
      }

      const filledPrice = order.orderType === 'market'
        ? quote.price
        : order.limitPrice || quote.price;

      const filledQuantity = order.amountType === 'dollars'
        ? order.amount / filledPrice
        : order.amount;

      return {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        symbol: order.symbol,
        side: order.side,
        orderType: order.orderType,
        status: 'filled',
        requestedAmount: order.amount,
        amountType: order.amountType,
        filledQuantity,
        averagePrice: filledPrice,
        totalValue: filledQuantity * filledPrice,
        createdAt: new Date().toISOString(),
        filledAt: new Date().toISOString(),
      };
    }

    return this.request<StockOrder>('/orders/stocks', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Get stock order status
  async getStockOrder(orderId: string): Promise<StockOrder> {
    return this.request<StockOrder>(`/orders/stocks/${orderId}`);
  }

  // Cancel stock order
  async cancelStockOrder(orderId: string): Promise<void> {
    return this.request<void>(`/orders/stocks/${orderId}`, {
      method: 'DELETE',
    });
  }

  // Get stock positions
  async getStockPositions(): Promise<StockPosition[]> {
    if (DEMO_MODE) {
      // Return empty array for demo mode (user has no positions initially)
      return [];
    }
    return this.request<StockPosition[]>('/portfolio/stocks');
  }
}

// ============================================================================
// Stock Types
// ============================================================================

export interface StockOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  status: 'pending' | 'filled' | 'partial' | 'cancelled' | 'rejected';
  requestedAmount: number;
  amountType: 'dollars' | 'shares';
  filledQuantity: number;
  averagePrice: number;
  totalValue: number;
  limitPrice?: number;
  createdAt: string;
  filledAt?: string;
  cancelledAt?: string;
}

export interface StockPosition {
  symbol: string;
  name: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export const api = new ApiClient(API_BASE_URL);

// Re-export types from mock data for convenience
export type { StockInstrument, StockQuote, StockCompanyInfo } from '../utils/mockStockData';
export type { MarketStatus, MarketSession } from '../utils/marketHours';
