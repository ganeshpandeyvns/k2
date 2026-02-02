// ============================================================================
// Funding Store - Zustand
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PaymentMethod {
  id: string;
  type: 'bank' | 'card';
  name: string;
  lastFour: string;
  bankId: string;
  isDefault: boolean;
  status: 'verified' | 'pending';
  accountType?: 'checking' | 'savings';
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'send' | 'receive' | 'swap';
  amount: number;
  asset?: string;
  toAsset?: string;
  toAddress?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  reference: string;
  methodId?: string;
  networkFee?: number;
}

interface FundingState {
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  cashBalance: number;
  pendingDeposit: { amount: number; methodId: string } | null;

  // Actions
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultMethod: (id: string) => void;
  addTransaction: (tx: Transaction) => void;
  updateCashBalance: (delta: number) => void;
  setCashBalance: (amount: number) => void;
  simulateDeposit: (amount: number, methodId: string) => Promise<Transaction>;
  simulateWithdraw: (amount: number, methodId: string) => Promise<Transaction>;
  clearPendingDeposit: () => void;

  // Profile state loaders
  loadAlexState: () => void;
  loadMikeState: () => void;
}

const generateReference = () =>
  `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

const generateTxId = () =>
  `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useFundingStore = create<FundingState>()(
  persist(
    (set, get) => ({
      paymentMethods: [],
      transactions: [],
      cashBalance: 0,
      pendingDeposit: null,

      addPaymentMethod: (method) =>
        set((state) => {
          // If this is the first method, make it default
          const isFirst = state.paymentMethods.length === 0;
          const newMethod = { ...method, isDefault: isFirst || method.isDefault };

          // If new method is default, remove default from others
          const updatedMethods = newMethod.isDefault
            ? state.paymentMethods.map((m) => ({ ...m, isDefault: false }))
            : state.paymentMethods;

          return {
            paymentMethods: [...updatedMethods, newMethod],
          };
        }),

      removePaymentMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((m) => m.id !== id),
        })),

      setDefaultMethod: (id) =>
        set((state) => ({
          paymentMethods: state.paymentMethods.map((m) => ({
            ...m,
            isDefault: m.id === id,
          })),
        })),

      addTransaction: (tx) =>
        set((state) => ({
          transactions: [tx, ...state.transactions],
        })),

      updateCashBalance: (delta) =>
        set((state) => ({
          cashBalance: Math.max(0, state.cashBalance + delta),
        })),

      setCashBalance: (amount) =>
        set({ cashBalance: Math.max(0, amount) }),

      simulateDeposit: async (amount, methodId) => {
        // Set pending state
        set({ pendingDeposit: { amount, methodId } });

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1800));

        const tx: Transaction = {
          id: generateTxId(),
          type: 'deposit',
          amount,
          status: 'completed',
          timestamp: new Date().toISOString(),
          reference: generateReference(),
          methodId,
        };

        set((state) => ({
          transactions: [tx, ...state.transactions],
          cashBalance: state.cashBalance + amount,
          pendingDeposit: null,
        }));

        return tx;
      },

      simulateWithdraw: async (amount, methodId) => {
        const { cashBalance } = get();

        if (amount > cashBalance) {
          throw new Error('Insufficient funds');
        }

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const tx: Transaction = {
          id: generateTxId(),
          type: 'withdraw',
          amount,
          status: 'completed',
          timestamp: new Date().toISOString(),
          reference: generateReference(),
          methodId,
        };

        set((state) => ({
          transactions: [tx, ...state.transactions],
          cashBalance: state.cashBalance - amount,
        }));

        return tx;
      },

      clearPendingDeposit: () =>
        set({ pendingDeposit: null }),

      // Load Alex's funded state with linked bank
      loadAlexState: () =>
        set({
          paymentMethods: [
            {
              id: 'alex-chase-001',
              type: 'bank',
              name: 'Chase',
              lastFour: '4521',
              bankId: 'chase',
              isDefault: true,
              status: 'verified',
              accountType: 'checking',
            },
          ],
          transactions: [
            {
              id: 'tx_alex_001',
              type: 'deposit',
              amount: 5000,
              status: 'completed',
              timestamp: '2024-01-10T10:00:00Z',
              reference: 'REF8X7K2M9N1',
              methodId: 'alex-chase-001',
            },
            {
              id: 'tx_alex_002',
              type: 'deposit',
              amount: 5000,
              status: 'completed',
              timestamp: '2024-01-05T14:30:00Z',
              reference: 'REF3P9Q1R5S7',
              methodId: 'alex-chase-001',
            },
          ],
          cashBalance: 10000,
          pendingDeposit: null,
        }),

      // Load Mike's fresh state - no bank, no funds
      loadMikeState: () =>
        set({
          paymentMethods: [],
          transactions: [],
          cashBalance: 0,
          pendingDeposit: null,
        }),
    }),
    {
      name: 'meru-funding-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        paymentMethods: state.paymentMethods,
        transactions: state.transactions,
        cashBalance: state.cashBalance,
      }),
    }
  )
);
