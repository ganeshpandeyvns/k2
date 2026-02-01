// ============================================================================
// Wallet Store - Zustand
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingSend {
  id: string;
  asset: string;
  toAddress: string;
  amount: number;
  amountUSD: number;
  networkFee: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  txHash?: string;
}

export interface SwapTransaction {
  id: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  slippage: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

interface WalletState {
  addresses: Record<string, string>; // asset symbol -> wallet address
  pendingSends: PendingSend[];
  swapHistory: SwapTransaction[];

  // Actions
  getAddress: (asset: string) => string;
  generateAddress: (asset: string) => string;
  simulateSend: (
    asset: string,
    toAddress: string,
    amount: number,
    amountUSD: number,
    networkFee: number
  ) => Promise<PendingSend>;
  simulateSwap: (
    fromAsset: string,
    toAsset: string,
    fromAmount: number,
    toAmount: number,
    rate: number,
    slippage: number
  ) => Promise<SwapTransaction>;
  clearHistory: () => void;
}

// Generate a realistic-looking wallet address for different chains
const generateWalletAddress = (asset: string): string => {
  const randomHex = () =>
    Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

  const prefixes: Record<string, { prefix: string; length: number }> = {
    BTC: { prefix: '1', length: 34 },
    ETH: { prefix: '0x', length: 42 },
    SOL: { prefix: '', length: 44 },
    USDC: { prefix: '0x', length: 42 },
    USDT: { prefix: '0x', length: 42 },
    MATIC: { prefix: '0x', length: 42 },
    AVAX: { prefix: '0x', length: 42 },
    DOT: { prefix: '1', length: 48 },
    ADA: { prefix: 'addr1', length: 58 },
    XRP: { prefix: 'r', length: 34 },
  };

  const config = prefixes[asset] || { prefix: '0x', length: 42 };
  const hex = randomHex();
  return `${config.prefix}${hex}`.slice(0, config.length);
};

const generateTxHash = () =>
  `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;

const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      addresses: {},
      pendingSends: [],
      swapHistory: [],

      getAddress: (asset) => {
        const { addresses } = get();
        if (addresses[asset]) {
          return addresses[asset];
        }
        // Generate and store if doesn't exist
        return get().generateAddress(asset);
      },

      generateAddress: (asset) => {
        const address = generateWalletAddress(asset);
        set((state) => ({
          addresses: { ...state.addresses, [asset]: address },
        }));
        return address;
      },

      simulateSend: async (asset, toAddress, amount, amountUSD, networkFee) => {
        const sendTx: PendingSend = {
          id: generateId(),
          asset,
          toAddress,
          amount,
          amountUSD,
          networkFee,
          status: 'pending',
          timestamp: new Date().toISOString(),
        };

        // Add as pending
        set((state) => ({
          pendingSends: [sendTx, ...state.pendingSends],
        }));

        // Simulate network confirmation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update to completed
        const completedTx: PendingSend = {
          ...sendTx,
          status: 'completed',
          txHash: generateTxHash(),
        };

        set((state) => ({
          pendingSends: state.pendingSends.map((tx) =>
            tx.id === sendTx.id ? completedTx : tx
          ),
        }));

        return completedTx;
      },

      simulateSwap: async (
        fromAsset,
        toAsset,
        fromAmount,
        toAmount,
        rate,
        slippage
      ) => {
        const swapTx: SwapTransaction = {
          id: generateId(),
          fromAsset,
          toAsset,
          fromAmount,
          toAmount,
          rate,
          slippage,
          status: 'pending',
          timestamp: new Date().toISOString(),
        };

        // Simulate DEX processing
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const completedSwap: SwapTransaction = {
          ...swapTx,
          status: 'completed',
        };

        set((state) => ({
          swapHistory: [completedSwap, ...state.swapHistory],
        }));

        return completedSwap;
      },

      clearHistory: () =>
        set({
          pendingSends: [],
          swapHistory: [],
        }),
    }),
    {
      name: 'meru-wallet-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        addresses: state.addresses,
        pendingSends: state.pendingSends.filter((s) => s.status === 'completed'),
        swapHistory: state.swapHistory,
      }),
    }
  )
);
