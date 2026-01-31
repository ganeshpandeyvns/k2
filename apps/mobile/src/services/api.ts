// ============================================================================
// API Service
// ============================================================================

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/v1'
  : 'https://api.k2.app/v1';

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
}

export const api = new ApiClient(API_BASE_URL);
