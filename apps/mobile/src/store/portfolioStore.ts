// ============================================================================
// Portfolio Store - Tracks actual crypto holdings
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number; // Average cost basis per unit
  color: string;
}

export interface TradeTransaction {
  id: string;
  type: 'buy' | 'sell' | 'swap' | 'send' | 'receive';
  asset: string;
  quantity: number;
  price: number;
  total: number;
  toAsset?: string; // For swaps
  toQuantity?: number; // For swaps
  toAddress?: string; // For sends
  fromAddress?: string; // For receives
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

interface PortfolioState {
  holdings: Holding[];
  transactions: TradeTransaction[];

  // Actions
  getHolding: (symbol: string) => Holding | undefined;
  updateHolding: (symbol: string, quantity: number, avgCost?: number) => void;
  addHolding: (holding: Holding) => void;
  removeHolding: (symbol: string) => void;

  // Trade actions
  executeBuy: (symbol: string, quantity: number, price: number, name?: string, color?: string) => TradeTransaction;
  executeSell: (symbol: string, quantity: number, price: number) => TradeTransaction | null;
  executeSwap: (fromSymbol: string, fromQty: number, toSymbol: string, toQty: number, toName?: string, toColor?: string) => TradeTransaction;
  executeSend: (symbol: string, quantity: number, toAddress: string, price: number) => TradeTransaction | null;
  executeReceive: (symbol: string, quantity: number, fromAddress: string, price: number, name?: string, color?: string) => TradeTransaction;

  // Computed
  getTotalValue: (prices: Record<string, number>) => number;
  getTransactionHistory: () => TradeTransaction[];
  clearAll: () => void;

  // Profile state loaders
  loadAlexState: () => void;
  loadMikeState: () => void;
}

// Default demo holdings
const DEFAULT_HOLDINGS: Holding[] = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: 1.234, avgCost: 58000, color: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', quantity: 8.5, avgCost: 3200, color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', quantity: 45.2, avgCost: 155, color: '#00ffa3' },
  { symbol: 'AVAX', name: 'Avalanche', quantity: 120, avgCost: 38, color: '#e84142' },
];

const generateTxId = () =>
  `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Asset metadata for new assets
const ASSET_META: Record<string, { name: string; color: string }> = {
  BTC: { name: 'Bitcoin', color: '#f7931a' },
  ETH: { name: 'Ethereum', color: '#627eea' },
  SOL: { name: 'Solana', color: '#00ffa3' },
  AVAX: { name: 'Avalanche', color: '#e84142' },
  USDC: { name: 'USD Coin', color: '#2775ca' },
  USDT: { name: 'Tether', color: '#26a17b' },
  DOGE: { name: 'Dogecoin', color: '#c3a634' },
  XRP: { name: 'XRP', color: '#00aae4' },
  MATIC: { name: 'Polygon', color: '#8247e5' },
  DOT: { name: 'Polkadot', color: '#e6007a' },
  ADA: { name: 'Cardano', color: '#0d1e30' },
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: DEFAULT_HOLDINGS,
      transactions: [],

      getHolding: (symbol) => {
        return get().holdings.find((h) => h.symbol === symbol);
      },

      updateHolding: (symbol, quantity, avgCost) => {
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.symbol === symbol
              ? { ...h, quantity, ...(avgCost !== undefined ? { avgCost } : {}) }
              : h
          ),
        }));
      },

      addHolding: (holding) => {
        set((state) => ({
          holdings: [...state.holdings, holding],
        }));
      },

      removeHolding: (symbol) => {
        set((state) => ({
          holdings: state.holdings.filter((h) => h.symbol !== symbol),
        }));
      },

      executeBuy: (symbol, quantity, price, name, color) => {
        const { holdings, getHolding, updateHolding, addHolding } = get();
        const existing = getHolding(symbol);
        const total = quantity * price;

        if (existing) {
          // Update average cost
          const newQuantity = existing.quantity + quantity;
          const newAvgCost =
            (existing.avgCost * existing.quantity + price * quantity) / newQuantity;
          updateHolding(symbol, newQuantity, newAvgCost);
        } else {
          // Add new holding
          const meta = ASSET_META[symbol] || { name: name || symbol, color: color || '#888888' };
          addHolding({
            symbol,
            name: name || meta.name,
            quantity,
            avgCost: price,
            color: color || meta.color,
          });
        }

        const tx: TradeTransaction = {
          id: generateTxId(),
          type: 'buy',
          asset: symbol,
          quantity,
          price,
          total,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };

        set((state) => ({
          transactions: [tx, ...state.transactions],
        }));

        return tx;
      },

      executeSell: (symbol, quantity, price) => {
        const { getHolding, updateHolding, removeHolding } = get();
        const existing = getHolding(symbol);

        if (!existing || existing.quantity < quantity) {
          return null; // Insufficient balance
        }

        const newQuantity = existing.quantity - quantity;
        if (newQuantity <= 0.000001) {
          removeHolding(symbol);
        } else {
          updateHolding(symbol, newQuantity);
        }

        const tx: TradeTransaction = {
          id: generateTxId(),
          type: 'sell',
          asset: symbol,
          quantity,
          price,
          total: quantity * price,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };

        set((state) => ({
          transactions: [tx, ...state.transactions],
        }));

        return tx;
      },

      executeSwap: (fromSymbol, fromQty, toSymbol, toQty, toName, toColor) => {
        const { getHolding, updateHolding, removeHolding, addHolding } = get();

        // Reduce from holding
        const fromHolding = getHolding(fromSymbol);
        if (fromHolding) {
          const newFromQty = fromHolding.quantity - fromQty;
          if (newFromQty <= 0.000001) {
            removeHolding(fromSymbol);
          } else {
            updateHolding(fromSymbol, newFromQty);
          }
        }

        // Increase to holding
        const toHolding = getHolding(toSymbol);
        if (toHolding) {
          updateHolding(toSymbol, toHolding.quantity + toQty);
        } else {
          const meta = ASSET_META[toSymbol] || { name: toName || toSymbol, color: toColor || '#888888' };
          addHolding({
            symbol: toSymbol,
            name: toName || meta.name,
            quantity: toQty,
            avgCost: 0, // Swaps don't have a direct cost basis
            color: toColor || meta.color,
          });
        }

        const tx: TradeTransaction = {
          id: generateTxId(),
          type: 'swap',
          asset: fromSymbol,
          quantity: fromQty,
          price: 0,
          total: 0,
          toAsset: toSymbol,
          toQuantity: toQty,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };

        set((state) => ({
          transactions: [tx, ...state.transactions],
        }));

        return tx;
      },

      executeSend: (symbol, quantity, toAddress, price) => {
        const { getHolding, updateHolding, removeHolding } = get();
        const existing = getHolding(symbol);

        if (!existing || existing.quantity < quantity) {
          return null;
        }

        const newQuantity = existing.quantity - quantity;
        if (newQuantity <= 0.000001) {
          removeHolding(symbol);
        } else {
          updateHolding(symbol, newQuantity);
        }

        const tx: TradeTransaction = {
          id: generateTxId(),
          type: 'send',
          asset: symbol,
          quantity,
          price,
          total: quantity * price,
          toAddress,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };

        set((state) => ({
          transactions: [tx, ...state.transactions],
        }));

        return tx;
      },

      executeReceive: (symbol, quantity, fromAddress, price, name, color) => {
        const { getHolding, updateHolding, addHolding } = get();
        const existing = getHolding(symbol);

        if (existing) {
          updateHolding(symbol, existing.quantity + quantity);
        } else {
          const meta = ASSET_META[symbol] || { name: name || symbol, color: color || '#888888' };
          addHolding({
            symbol,
            name: name || meta.name,
            quantity,
            avgCost: price,
            color: color || meta.color,
          });
        }

        const tx: TradeTransaction = {
          id: generateTxId(),
          type: 'receive',
          asset: symbol,
          quantity,
          price,
          total: quantity * price,
          fromAddress,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };

        set((state) => ({
          transactions: [tx, ...state.transactions],
        }));

        return tx;
      },

      getTotalValue: (prices) => {
        return get().holdings.reduce((total, h) => {
          const price = prices[h.symbol] || 0;
          return total + h.quantity * price;
        }, 0);
      },

      getTransactionHistory: () => {
        return get().transactions;
      },

      clearAll: () =>
        set({
          holdings: DEFAULT_HOLDINGS,
          transactions: [],
        }),

      // Load Alex's portfolio state with holdings
      loadAlexState: () =>
        set({
          holdings: [
            { symbol: 'BTC', name: 'Bitcoin', quantity: 1.234, avgCost: 58000, color: '#f7931a' },
            { symbol: 'ETH', name: 'Ethereum', quantity: 8.5, avgCost: 3200, color: '#627eea' },
            { symbol: 'SOL', name: 'Solana', quantity: 45.2, avgCost: 155, color: '#00ffa3' },
            { symbol: 'AVAX', name: 'Avalanche', quantity: 120, avgCost: 38, color: '#e84142' },
            { symbol: 'FED-RATE-MAR', name: 'Fed Rate Cut - Mar', quantity: 50, avgCost: 0.35, color: '#f0b429' },
            { symbol: 'BTC-100K-Q1', name: 'BTC $100K Q1', quantity: 25, avgCost: 0.22, color: '#f7931a' },
          ],
          transactions: [
            {
              id: 'tx_alex_trade_001',
              type: 'buy',
              asset: 'BTC',
              quantity: 0.5,
              price: 62000,
              total: 31000,
              timestamp: '2024-01-20T10:30:00Z',
              status: 'completed',
            },
            {
              id: 'tx_alex_trade_002',
              type: 'buy',
              asset: 'ETH',
              quantity: 3.0,
              price: 3400,
              total: 10200,
              timestamp: '2024-01-18T14:15:00Z',
              status: 'completed',
            },
            {
              id: 'tx_alex_trade_003',
              type: 'buy',
              asset: 'SOL',
              quantity: 20,
              price: 165,
              total: 3300,
              timestamp: '2024-01-15T09:00:00Z',
              status: 'completed',
            },
          ],
        }),

      // Load Mike's fresh state - no holdings, no transactions
      loadMikeState: () =>
        set({
          holdings: [],
          transactions: [],
        }),
    }),
    {
      name: 'meru-portfolio-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
