// ============================================================================
// Auth Store - Zustand
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface ExchangeConnection {
  exchange: 'cryptocom' | 'kalshi';
  status: 'active' | 'expired' | 'revoked';
  connectedAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  biometricsEnabled: boolean;
  exchangeConnections: ExchangeConnection[];

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setBiometricsEnabled: (enabled: boolean) => void;
  addExchangeConnection: (connection: ExchangeConnection) => void;
  removeExchangeConnection: (exchange: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false, // Start with WelcomeScreen
      biometricsEnabled: false,
      exchangeConnections: [],

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          biometricsEnabled: false,
          exchangeConnections: [],
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setBiometricsEnabled: (enabled) =>
        set({ biometricsEnabled: enabled }),

      addExchangeConnection: (connection) =>
        set((state) => ({
          exchangeConnections: [
            ...state.exchangeConnections.filter((c) => c.exchange !== connection.exchange),
            connection,
          ],
        })),

      removeExchangeConnection: (exchange) =>
        set((state) => ({
          exchangeConnections: state.exchangeConnections.filter(
            (c) => c.exchange !== exchange
          ),
        })),
    }),
    {
      name: 'meru-auth-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        biometricsEnabled: state.biometricsEnabled,
        exchangeConnections: state.exchangeConnections,
      }),
    }
  )
);
