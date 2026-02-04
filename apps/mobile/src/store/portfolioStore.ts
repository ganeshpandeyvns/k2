// ============================================================================
// Portfolio Store - Tracks actual crypto holdings
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AssetType = 'crypto' | 'stock' | 'event' | 'fixed-income';

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number; // Average cost basis per unit
  color: string;
  assetType?: AssetType; // Optional for backwards compatibility
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
  // Queued order fields
  isQueued?: boolean; // True if order is queued for market open
  queuedExecutionDate?: string; // When the order will execute
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

  // Queued order (for stocks when market is closed)
  queueOrder: (
    type: 'buy' | 'sell',
    symbol: string,
    quantity: number,
    estimatedPrice: number,
    executionDate: string,
    name?: string
  ) => TradeTransaction;

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
const ASSET_META: Record<string, { name: string; color: string; assetType?: AssetType }> = {
  // Crypto
  BTC: { name: 'Bitcoin', color: '#f7931a', assetType: 'crypto' },
  ETH: { name: 'Ethereum', color: '#627eea', assetType: 'crypto' },
  SOL: { name: 'Solana', color: '#00ffa3', assetType: 'crypto' },
  AVAX: { name: 'Avalanche', color: '#e84142', assetType: 'crypto' },
  USDC: { name: 'USD Coin', color: '#2775ca', assetType: 'crypto' },
  USDT: { name: 'Tether', color: '#26a17b', assetType: 'crypto' },
  DOGE: { name: 'Dogecoin', color: '#c3a634', assetType: 'crypto' },
  XRP: { name: 'XRP', color: '#00aae4', assetType: 'crypto' },
  MATIC: { name: 'Polygon', color: '#8247e5', assetType: 'crypto' },
  DOT: { name: 'Polkadot', color: '#e6007a', assetType: 'crypto' },
  ADA: { name: 'Cardano', color: '#0d1e30', assetType: 'crypto' },

  // Stocks - Popular Tech
  AAPL: { name: 'Apple Inc.', color: '#A2AAAD', assetType: 'stock' },
  GOOGL: { name: 'Alphabet Inc.', color: '#4285F4', assetType: 'stock' },
  MSFT: { name: 'Microsoft Corp.', color: '#00A4EF', assetType: 'stock' },
  AMZN: { name: 'Amazon.com Inc.', color: '#FF9900', assetType: 'stock' },
  NVDA: { name: 'NVIDIA Corp.', color: '#76B900', assetType: 'stock' },
  META: { name: 'Meta Platforms Inc.', color: '#0081FB', assetType: 'stock' },
  TSLA: { name: 'Tesla Inc.', color: '#CC0000', assetType: 'stock' },
  AMD: { name: 'AMD Inc.', color: '#ED1C24', assetType: 'stock' },
  INTC: { name: 'Intel Corp.', color: '#0071C5', assetType: 'stock' },
  CRM: { name: 'Salesforce Inc.', color: '#00A1E0', assetType: 'stock' },

  // Stocks - Finance
  JPM: { name: 'JPMorgan Chase', color: '#117ACA', assetType: 'stock' },
  BAC: { name: 'Bank of America', color: '#012169', assetType: 'stock' },
  V: { name: 'Visa Inc.', color: '#1A1F71', assetType: 'stock' },
  MA: { name: 'Mastercard Inc.', color: '#EB001B', assetType: 'stock' },
  GS: { name: 'Goldman Sachs', color: '#6CACE4', assetType: 'stock' },

  // Stocks - Healthcare
  JNJ: { name: 'Johnson & Johnson', color: '#D51900', assetType: 'stock' },
  PFE: { name: 'Pfizer Inc.', color: '#0093D0', assetType: 'stock' },
  UNH: { name: 'UnitedHealth Group', color: '#002677', assetType: 'stock' },

  // Stocks - Consumer
  KO: { name: 'Coca-Cola Co.', color: '#F40009', assetType: 'stock' },
  PEP: { name: 'PepsiCo Inc.', color: '#004B93', assetType: 'stock' },
  MCD: { name: 'McDonald\'s Corp.', color: '#FFC72C', assetType: 'stock' },
  NKE: { name: 'Nike Inc.', color: '#111111', assetType: 'stock' },
  DIS: { name: 'Walt Disney Co.', color: '#113CCF', assetType: 'stock' },

  // Stocks - Energy
  XOM: { name: 'Exxon Mobil', color: '#ED1C24', assetType: 'stock' },
  CVX: { name: 'Chevron Corp.', color: '#0066B2', assetType: 'stock' },

  // Fixed Income - Treasuries
  'TBILL-3M': { name: '3-Month Treasury Bill', color: '#2196F3', assetType: 'fixed-income' },
  'UST-2Y': { name: '2-Year Treasury Note', color: '#2196F3', assetType: 'fixed-income' },
  'UST-5Y': { name: '5-Year Treasury Note', color: '#2196F3', assetType: 'fixed-income' },
  'UST-10Y': { name: '10-Year Treasury Note', color: '#2196F3', assetType: 'fixed-income' },
  'TIPS-5Y': { name: '5-Year TIPS', color: '#2196F3', assetType: 'fixed-income' },

  // Fixed Income - Corporate Investment Grade
  'AAPL-4.375-29': { name: 'Apple Inc. 4.375% 2029', color: '#4CAF50', assetType: 'fixed-income' },
  'MSFT-3.5-28': { name: 'Microsoft 3.5% 2028', color: '#4CAF50', assetType: 'fixed-income' },
  'JPM-4.25-30': { name: 'JPMorgan 4.25% 2030', color: '#4CAF50', assetType: 'fixed-income' },
  'JNJ-3.75-31': { name: 'Johnson & Johnson 3.75% 2031', color: '#4CAF50', assetType: 'fixed-income' },
  'IG-BOND-ETF': { name: 'Investment Grade Bond Pool', color: '#4CAF50', assetType: 'fixed-income' },

  // Fixed Income - Corporate High Yield
  'HY-BOND-POOL': { name: 'High Yield Corporate Pool', color: '#FF9800', assetType: 'fixed-income' },
  'NFLX-5.875-28': { name: 'Netflix 5.875% 2028', color: '#FF9800', assetType: 'fixed-income' },
  'ENERGY-HY': { name: 'Energy Sector High Yield', color: '#FF9800', assetType: 'fixed-income' },

  // Fixed Income - Municipal
  'CA-GO-5-30': { name: 'California GO 5% 2030', color: '#9C27B0', assetType: 'fixed-income' },
  'NYC-GO-4.5-29': { name: 'NYC GO 4.5% 2029', color: '#9C27B0', assetType: 'fixed-income' },
  'TX-REV-4.75-31': { name: 'Texas Revenue 4.75% 2031', color: '#9C27B0', assetType: 'fixed-income' },

  // Fixed Income - Money Market
  'MM-PRIME': { name: 'Prime Money Market', color: '#00BCD4', assetType: 'fixed-income' },
  'MM-GOVT': { name: 'Government Money Market', color: '#00BCD4', assetType: 'fixed-income' },
  'USDC-YIELD': { name: 'USDC Yield Vault', color: '#00BCD4', assetType: 'fixed-income' },
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
            assetType: meta.assetType || 'crypto',
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

      // Queue order for stocks when market is closed (doesn't update holdings until executed)
      queueOrder: (type, symbol, quantity, estimatedPrice, executionDate, name) => {
        const tx: TradeTransaction = {
          id: generateTxId(),
          type,
          asset: symbol,
          quantity,
          price: estimatedPrice,
          total: quantity * estimatedPrice,
          timestamp: new Date().toISOString(),
          status: 'pending',
          isQueued: true,
          queuedExecutionDate: executionDate,
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

      // Load Alex's portfolio state with holdings (crypto, stocks, events)
      loadAlexState: () =>
        set({
          holdings: [
            // Crypto holdings
            { symbol: 'BTC', name: 'Bitcoin', quantity: 1.234, avgCost: 58000, color: '#f7931a', assetType: 'crypto' },
            { symbol: 'ETH', name: 'Ethereum', quantity: 8.5, avgCost: 3200, color: '#627eea', assetType: 'crypto' },
            { symbol: 'SOL', name: 'Solana', quantity: 45.2, avgCost: 155, color: '#00ffa3', assetType: 'crypto' },
            { symbol: 'AVAX', name: 'Avalanche', quantity: 120, avgCost: 38, color: '#e84142', assetType: 'crypto' },
            // Stock holdings
            { symbol: 'AAPL', name: 'Apple Inc.', quantity: 25, avgCost: 175, color: '#A2AAAD', assetType: 'stock' },
            { symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 10, avgCost: 450, color: '#76B900', assetType: 'stock' },
            { symbol: 'TSLA', name: 'Tesla Inc.', quantity: 15, avgCost: 220, color: '#CC0000', assetType: 'stock' },
            // Event contract holdings
            { symbol: 'FED-RATE-MAR', name: 'Fed Rate Cut - Mar', quantity: 50, avgCost: 0.35, color: '#f0b429', assetType: 'event' },
            { symbol: 'BTC-100K-Q1', name: 'BTC $100K Q1', quantity: 25, avgCost: 0.22, color: '#f7931a', assetType: 'event' },
            // Fixed Income holdings
            { symbol: 'UST-2Y', name: '2-Year Treasury Note', quantity: 10000, avgCost: 99.25, color: '#2196F3', assetType: 'fixed-income' },
            { symbol: 'AAPL-4.375-29', name: 'Apple Inc. 4.375% 2029', quantity: 5000, avgCost: 96.80, color: '#4CAF50', assetType: 'fixed-income' },
            { symbol: 'MM-GOVT', name: 'Government Money Market', quantity: 15000, avgCost: 1.00, color: '#00BCD4', assetType: 'fixed-income' },
          ],
          transactions: [
            // Crypto transactions
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
            // Stock transactions
            {
              id: 'tx_alex_stock_001',
              type: 'buy',
              asset: 'AAPL',
              quantity: 25,
              price: 175,
              total: 4375,
              timestamp: '2024-01-10T11:00:00Z',
              status: 'completed',
            },
            {
              id: 'tx_alex_stock_002',
              type: 'buy',
              asset: 'NVDA',
              quantity: 10,
              price: 450,
              total: 4500,
              timestamp: '2024-01-08T14:30:00Z',
              status: 'completed',
            },
            {
              id: 'tx_alex_stock_003',
              type: 'buy',
              asset: 'TSLA',
              quantity: 15,
              price: 220,
              total: 3300,
              timestamp: '2024-01-05T10:15:00Z',
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
