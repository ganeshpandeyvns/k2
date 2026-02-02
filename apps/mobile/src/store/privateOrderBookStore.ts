// ============================================================================
// Private Order Book Store - Pre-IPO & ATS Secondary Market Trading
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Order types
export type OrderSide = 'bid' | 'ask';
export type OrderStatus =
  | 'pending'      // Order placed, waiting for match
  | 'matched'      // Found a counterparty, awaiting settlement
  | 'settling'     // Settlement in progress (manual process)
  | 'settled'      // Complete
  | 'cancelled'    // User cancelled
  | 'expired';     // Order expired (optional TTL)

export interface PrivateOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;           // Price per share
  quantity: number;        // Number of shares
  filledQuantity: number;  // Shares filled so far
  total: number;           // price * quantity
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;      // Optional expiration
  matchedOrderId?: string; // ID of matched counterparty order
  settlementNotes?: string;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];  // Sorted by price descending (highest first)
  asks: OrderBookEntry[];  // Sorted by price ascending (lowest first)
  lastTradePrice?: number;
  spread?: number;
  spreadPercent?: number;
}

// Demo order book data for Pre-IPO stocks
const DEMO_ORDER_BOOKS: Record<string, { bids: OrderBookEntry[]; asks: OrderBookEntry[] }> = {
  SPACEX: {
    bids: [
      { price: 112.00, quantity: 150, orderCount: 3 },
      { price: 111.50, quantity: 280, orderCount: 5 },
      { price: 111.00, quantity: 420, orderCount: 8 },
      { price: 110.50, quantity: 350, orderCount: 6 },
      { price: 110.00, quantity: 500, orderCount: 12 },
    ],
    asks: [
      { price: 113.00, quantity: 120, orderCount: 2 },
      { price: 113.50, quantity: 200, orderCount: 4 },
      { price: 114.00, quantity: 350, orderCount: 7 },
      { price: 114.50, quantity: 280, orderCount: 5 },
      { price: 115.00, quantity: 450, orderCount: 9 },
    ],
  },
  STRIPE: {
    bids: [
      { price: 27.50, quantity: 500, orderCount: 8 },
      { price: 27.25, quantity: 750, orderCount: 12 },
      { price: 27.00, quantity: 1200, orderCount: 18 },
      { price: 26.75, quantity: 800, orderCount: 10 },
      { price: 26.50, quantity: 1500, orderCount: 22 },
    ],
    asks: [
      { price: 28.00, quantity: 400, orderCount: 6 },
      { price: 28.25, quantity: 600, orderCount: 9 },
      { price: 28.50, quantity: 900, orderCount: 14 },
      { price: 28.75, quantity: 700, orderCount: 11 },
      { price: 29.00, quantity: 1100, orderCount: 16 },
    ],
  },
  OPENAI: {
    bids: [
      { price: 184.00, quantity: 80, orderCount: 2 },
      { price: 183.50, quantity: 120, orderCount: 3 },
      { price: 183.00, quantity: 200, orderCount: 5 },
      { price: 182.50, quantity: 150, orderCount: 4 },
      { price: 182.00, quantity: 250, orderCount: 6 },
    ],
    asks: [
      { price: 186.00, quantity: 60, orderCount: 2 },
      { price: 186.50, quantity: 100, orderCount: 3 },
      { price: 187.00, quantity: 150, orderCount: 4 },
      { price: 187.50, quantity: 120, orderCount: 3 },
      { price: 188.00, quantity: 200, orderCount: 5 },
    ],
  },
  ANTHROPIC: {
    bids: [
      { price: 141.50, quantity: 100, orderCount: 3 },
      { price: 141.00, quantity: 180, orderCount: 5 },
      { price: 140.50, quantity: 250, orderCount: 7 },
      { price: 140.00, quantity: 300, orderCount: 8 },
      { price: 139.50, quantity: 400, orderCount: 10 },
    ],
    asks: [
      { price: 143.00, quantity: 90, orderCount: 2 },
      { price: 143.50, quantity: 150, orderCount: 4 },
      { price: 144.00, quantity: 220, orderCount: 6 },
      { price: 144.50, quantity: 180, orderCount: 5 },
      { price: 145.00, quantity: 280, orderCount: 7 },
    ],
  },
  DATABRICKS: {
    bids: [
      { price: 81.50, quantity: 200, orderCount: 4 },
      { price: 81.00, quantity: 350, orderCount: 7 },
      { price: 80.50, quantity: 500, orderCount: 10 },
      { price: 80.00, quantity: 400, orderCount: 8 },
      { price: 79.50, quantity: 600, orderCount: 12 },
    ],
    asks: [
      { price: 83.00, quantity: 180, orderCount: 3 },
      { price: 83.50, quantity: 280, orderCount: 5 },
      { price: 84.00, quantity: 400, orderCount: 8 },
      { price: 84.50, quantity: 320, orderCount: 6 },
      { price: 85.00, quantity: 500, orderCount: 10 },
    ],
  },
  DISCORD: {
    bids: [
      { price: 34.75, quantity: 400, orderCount: 6 },
      { price: 34.50, quantity: 600, orderCount: 9 },
      { price: 34.25, quantity: 800, orderCount: 12 },
      { price: 34.00, quantity: 700, orderCount: 10 },
      { price: 33.75, quantity: 1000, orderCount: 15 },
    ],
    asks: [
      { price: 35.50, quantity: 350, orderCount: 5 },
      { price: 35.75, quantity: 500, orderCount: 7 },
      { price: 36.00, quantity: 700, orderCount: 10 },
      { price: 36.25, quantity: 550, orderCount: 8 },
      { price: 36.50, quantity: 800, orderCount: 12 },
    ],
  },
  CANVA: {
    bids: [
      { price: 48.25, quantity: 300, orderCount: 5 },
      { price: 48.00, quantity: 450, orderCount: 7 },
      { price: 47.75, quantity: 600, orderCount: 10 },
      { price: 47.50, quantity: 500, orderCount: 8 },
      { price: 47.25, quantity: 750, orderCount: 12 },
    ],
    asks: [
      { price: 49.50, quantity: 250, orderCount: 4 },
      { price: 49.75, quantity: 380, orderCount: 6 },
      { price: 50.00, quantity: 520, orderCount: 8 },
      { price: 50.25, quantity: 420, orderCount: 7 },
      { price: 50.50, quantity: 650, orderCount: 10 },
    ],
  },
  FIGMA: {
    bids: [
      { price: 41.50, quantity: 350, orderCount: 6 },
      { price: 41.25, quantity: 500, orderCount: 8 },
      { price: 41.00, quantity: 700, orderCount: 11 },
      { price: 40.75, quantity: 550, orderCount: 9 },
      { price: 40.50, quantity: 800, orderCount: 13 },
    ],
    asks: [
      { price: 42.75, quantity: 300, orderCount: 5 },
      { price: 43.00, quantity: 450, orderCount: 7 },
      { price: 43.25, quantity: 600, orderCount: 9 },
      { price: 43.50, quantity: 480, orderCount: 8 },
      { price: 43.75, quantity: 700, orderCount: 11 },
    ],
  },
  // ATS Tokens Order Books
  TZROP: {
    bids: [
      { price: 2.82, quantity: 5000, orderCount: 12 },
      { price: 2.80, quantity: 8000, orderCount: 18 },
      { price: 2.78, quantity: 12000, orderCount: 25 },
      { price: 2.75, quantity: 10000, orderCount: 20 },
      { price: 2.72, quantity: 15000, orderCount: 30 },
    ],
    asks: [
      { price: 2.88, quantity: 4500, orderCount: 10 },
      { price: 2.90, quantity: 7000, orderCount: 15 },
      { price: 2.92, quantity: 10000, orderCount: 22 },
      { price: 2.95, quantity: 8500, orderCount: 18 },
      { price: 2.98, quantity: 12000, orderCount: 25 },
    ],
  },
  ASPD: {
    bids: [
      { price: 18.30, quantity: 200, orderCount: 4 },
      { price: 18.20, quantity: 350, orderCount: 6 },
      { price: 18.10, quantity: 500, orderCount: 8 },
      { price: 18.00, quantity: 400, orderCount: 7 },
      { price: 17.90, quantity: 600, orderCount: 10 },
    ],
    asks: [
      { price: 18.60, quantity: 180, orderCount: 3 },
      { price: 18.70, quantity: 300, orderCount: 5 },
      { price: 18.80, quantity: 450, orderCount: 7 },
      { price: 18.90, quantity: 350, orderCount: 6 },
      { price: 19.00, quantity: 550, orderCount: 9 },
    ],
  },
  OSTKO: {
    bids: [
      { price: 24.40, quantity: 800, orderCount: 8 },
      { price: 24.30, quantity: 1200, orderCount: 12 },
      { price: 24.20, quantity: 1500, orderCount: 15 },
      { price: 24.10, quantity: 1100, orderCount: 11 },
      { price: 24.00, quantity: 1800, orderCount: 18 },
    ],
    asks: [
      { price: 24.80, quantity: 700, orderCount: 7 },
      { price: 24.90, quantity: 1000, orderCount: 10 },
      { price: 25.00, quantity: 1400, orderCount: 14 },
      { price: 25.10, quantity: 1100, orderCount: 11 },
      { price: 25.20, quantity: 1600, orderCount: 16 },
    ],
  },
  BCAP: {
    bids: [
      { price: 8.85, quantity: 1500, orderCount: 6 },
      { price: 8.80, quantity: 2200, orderCount: 9 },
      { price: 8.75, quantity: 3000, orderCount: 12 },
      { price: 8.70, quantity: 2500, orderCount: 10 },
      { price: 8.65, quantity: 3500, orderCount: 14 },
    ],
    asks: [
      { price: 9.00, quantity: 1300, orderCount: 5 },
      { price: 9.05, quantity: 2000, orderCount: 8 },
      { price: 9.10, quantity: 2800, orderCount: 11 },
      { price: 9.15, quantity: 2300, orderCount: 9 },
      { price: 9.20, quantity: 3200, orderCount: 13 },
    ],
  },
  SPTL: {
    bids: [
      { price: 1.42, quantity: 8000, orderCount: 10 },
      { price: 1.40, quantity: 12000, orderCount: 15 },
      { price: 1.38, quantity: 15000, orderCount: 20 },
      { price: 1.36, quantity: 11000, orderCount: 14 },
      { price: 1.34, quantity: 18000, orderCount: 22 },
    ],
    asks: [
      { price: 1.48, quantity: 7000, orderCount: 8 },
      { price: 1.50, quantity: 10000, orderCount: 12 },
      { price: 1.52, quantity: 14000, orderCount: 18 },
      { price: 1.54, quantity: 11000, orderCount: 14 },
      { price: 1.56, quantity: 16000, orderCount: 20 },
    ],
  },
  EXODUS: {
    bids: [
      { price: 31.80, quantity: 600, orderCount: 6 },
      { price: 31.60, quantity: 900, orderCount: 9 },
      { price: 31.40, quantity: 1200, orderCount: 12 },
      { price: 31.20, quantity: 1000, orderCount: 10 },
      { price: 31.00, quantity: 1500, orderCount: 15 },
    ],
    asks: [
      { price: 32.50, quantity: 500, orderCount: 5 },
      { price: 32.70, quantity: 800, orderCount: 8 },
      { price: 32.90, quantity: 1100, orderCount: 11 },
      { price: 33.10, quantity: 900, orderCount: 9 },
      { price: 33.30, quantity: 1300, orderCount: 13 },
    ],
  },
};

// Generate a unique order ID
function generateOrderId(): string {
  return `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

interface PrivateOrderBookState {
  orders: PrivateOrder[];

  // Actions
  placeOrder: (
    symbol: string,
    side: OrderSide,
    price: number,
    quantity: number
  ) => PrivateOrder;
  cancelOrder: (orderId: string) => boolean;
  getOrderBook: (symbol: string) => OrderBook;
  getUserOrders: (symbol?: string) => PrivateOrder[];
  getPendingOrders: () => PrivateOrder[];
  getMatchedOrders: () => PrivateOrder[];

  // Matching & Settlement (simulated)
  checkForMatches: (symbol: string) => void;
  simulateSettlement: (orderId: string) => void;

  // Reset
  reset: () => void;
}

export const usePrivateOrderBookStore = create<PrivateOrderBookState>()(
  persist(
    (set, get) => ({
      orders: [],

      placeOrder: (symbol, side, price, quantity) => {
        const order: PrivateOrder = {
          id: generateOrderId(),
          symbol,
          side,
          price,
          quantity,
          filledQuantity: 0,
          total: price * quantity,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          orders: [order, ...state.orders],
        }));

        // Check for potential matches after placing order
        setTimeout(() => {
          get().checkForMatches(symbol);
        }, 500);

        return order;
      },

      cancelOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status !== 'pending') {
          return false;
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'cancelled' as OrderStatus, updatedAt: new Date().toISOString() }
              : o
          ),
        }));

        return true;
      },

      getOrderBook: (symbol) => {
        const demoBook = DEMO_ORDER_BOOKS[symbol];
        const userOrders = get().orders.filter(
          (o) => o.symbol === symbol && o.status === 'pending'
        );

        // Start with demo order book data
        let bids = demoBook?.bids ? [...demoBook.bids] : [];
        let asks = demoBook?.asks ? [...demoBook.asks] : [];

        // Add user's pending orders to the book
        userOrders.forEach((order) => {
          const entry = { price: order.price, quantity: order.quantity, orderCount: 1 };
          if (order.side === 'bid') {
            // Find existing price level or add new
            const existingIdx = bids.findIndex((b) => b.price === order.price);
            if (existingIdx >= 0) {
              bids[existingIdx] = {
                ...bids[existingIdx],
                quantity: bids[existingIdx].quantity + order.quantity,
                orderCount: bids[existingIdx].orderCount + 1,
              };
            } else {
              bids.push(entry);
            }
          } else {
            const existingIdx = asks.findIndex((a) => a.price === order.price);
            if (existingIdx >= 0) {
              asks[existingIdx] = {
                ...asks[existingIdx],
                quantity: asks[existingIdx].quantity + order.quantity,
                orderCount: asks[existingIdx].orderCount + 1,
              };
            } else {
              asks.push(entry);
            }
          }
        });

        // Sort bids descending, asks ascending
        bids.sort((a, b) => b.price - a.price);
        asks.sort((a, b) => a.price - b.price);

        // Calculate spread
        const bestBid = bids[0]?.price || 0;
        const bestAsk = asks[0]?.price || 0;
        const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : undefined;
        const spreadPercent = spread && bestBid > 0 ? (spread / bestBid) * 100 : undefined;

        return {
          symbol,
          bids: bids.slice(0, 10), // Top 10 levels
          asks: asks.slice(0, 10),
          lastTradePrice: demoBook ? (bestBid + bestAsk) / 2 : undefined,
          spread,
          spreadPercent,
        };
      },

      getUserOrders: (symbol) => {
        const orders = get().orders;
        if (symbol) {
          return orders.filter((o) => o.symbol === symbol);
        }
        return orders;
      },

      getPendingOrders: () => {
        return get().orders.filter((o) => o.status === 'pending');
      },

      getMatchedOrders: () => {
        return get().orders.filter((o) => o.status === 'matched' || o.status === 'settling');
      },

      checkForMatches: (symbol) => {
        const orders = get().orders;
        const pendingBids = orders.filter(
          (o) => o.symbol === symbol && o.side === 'bid' && o.status === 'pending'
        ).sort((a, b) => b.price - a.price); // Highest bid first

        const pendingAsks = orders.filter(
          (o) => o.symbol === symbol && o.side === 'ask' && o.status === 'pending'
        ).sort((a, b) => a.price - b.price); // Lowest ask first

        // Check for crossing orders (bid >= ask)
        for (const bid of pendingBids) {
          for (const ask of pendingAsks) {
            if (bid.price >= ask.price && bid.id !== ask.matchedOrderId) {
              // Match found! Update both orders
              set((state) => ({
                orders: state.orders.map((o) => {
                  if (o.id === bid.id || o.id === ask.id) {
                    return {
                      ...o,
                      status: 'matched' as OrderStatus,
                      matchedOrderId: o.id === bid.id ? ask.id : bid.id,
                      updatedAt: new Date().toISOString(),
                    };
                  }
                  return o;
                }),
              }));

              // Simulate settlement starting after a delay
              setTimeout(() => {
                get().simulateSettlement(bid.id);
                get().simulateSettlement(ask.id);
              }, 2000);

              return; // One match at a time
            }
          }
        }
      },

      simulateSettlement: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status !== 'matched') {
          return;
        }

        // Move to settling
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'settling' as OrderStatus,
                  settlementNotes: 'Settlement in progress. Manual verification required.',
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }));

        // Simulate settlement completion after delay (in real app, this would be manual)
        setTimeout(() => {
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'settled' as OrderStatus,
                    filledQuantity: o.quantity,
                    settlementNotes: 'Settlement complete. Shares transferred.',
                    updatedAt: new Date().toISOString(),
                  }
                : o
            ),
          }));
        }, 5000); // 5 second simulated settlement
      },

      reset: () => {
        set({ orders: [] });
      },
    }),
    {
      name: 'meru-private-orderbook',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

export function formatOrderStatus(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    matched: 'Matched',
    settling: 'Settling',
    settled: 'Settled',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return labels[status];
}

export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: '#F0B429',    // Gold/amber
    matched: '#3B82F6',    // Blue
    settling: '#8B5CF6',   // Purple
    settled: '#10B981',    // Green
    cancelled: '#6B7280',  // Gray
    expired: '#6B7280',    // Gray
  };
  return colors[status];
}

export function getBestBidAsk(symbol: string): { bestBid: number; bestAsk: number; spread: number } {
  const book = DEMO_ORDER_BOOKS[symbol];
  if (!book) {
    return { bestBid: 0, bestAsk: 0, spread: 0 };
  }
  const bestBid = book.bids[0]?.price || 0;
  const bestAsk = book.asks[0]?.price || 0;
  return {
    bestBid,
    bestAsk,
    spread: bestAsk - bestBid,
  };
}
