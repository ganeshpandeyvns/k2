// ============================================================================
// Private Access Store - Invite Code Management for Private Listings
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRIVATE_LISTINGS } from '../utils/mockPrivateStockData';

// ============================================================================
// Demo Invite Codes
// ============================================================================

interface InviteCode {
  code: string;
  listingIds: string[];
  expiresAt?: string;
  maxUses?: number;
}

const DEMO_INVITE_CODES: InviteCode[] = [
  {
    code: '123456',
    listingIds: ['SPACEX-B', 'STRIPE-SPV'],
  },
  {
    code: 'MERU01',
    listingIds: ['SPACEX-B', 'OPENAI-A'],
  },
  {
    code: 'ALPHA1',
    listingIds: ['SPACEX-B', 'STRIPE-SPV', 'OPENAI-A', 'ANTHRO-C', 'UNICORN-III'],
  },
  {
    code: 'VIP100',
    listingIds: ['SPACEX-B', 'STRIPE-SPV', 'OPENAI-A', 'ANTHRO-C', 'UNICORN-III'],
  },
];

// ============================================================================
// Store Interface
// ============================================================================

interface PrivateAccessState {
  // Unlocked listings for current user
  unlockedListingIds: string[];

  // Code entry state
  enteredCode: string;
  isValidating: boolean;
  lastError: string | null;
  lastSuccessCode: string | null;

  // Track code usage
  usedCodes: string[];

  // Actions
  setEnteredCode: (code: string) => void;
  validateAndUnlock: (code: string) => Promise<{ success: boolean; unlockedCount: number; error?: string }>;
  isListingUnlocked: (listingId: string) => boolean;
  getUnlockedListings: () => typeof PRIVATE_LISTINGS;
  getLockedListings: () => typeof PRIVATE_LISTINGS;
  clearError: () => void;
  reset: () => void;

  // Profile state loaders (alan persists, mike resets)
  loadAlanState: () => void;
  loadMikeState: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const usePrivateAccessStore = create<PrivateAccessState>()(
  persist(
    (set, get) => ({
      unlockedListingIds: [],
      enteredCode: '',
      isValidating: false,
      lastError: null,
      lastSuccessCode: null,
      usedCodes: [],

      setEnteredCode: (code) => set({ enteredCode: code, lastError: null }),

      validateAndUnlock: async (code) => {
        set({ isValidating: true, lastError: null });

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // DEMO MODE: Accept ANY 6-digit numeric code
        const isValidFormat = /^\d{6}$/.test(code);

        if (!isValidFormat) {
          set({
            isValidating: false,
            lastError: 'Please enter a valid 6-digit code.',
          });
          return { success: false, unlockedCount: 0, error: 'Invalid format' };
        }

        // Check if we have a specific invite code that matches
        const inviteCode = DEMO_INVITE_CODES.find(
          (c) => c.code.toUpperCase() === code.toUpperCase()
        );

        // Check expiration for specific codes
        if (inviteCode?.expiresAt && new Date(inviteCode.expiresAt) < new Date()) {
          set({
            isValidating: false,
            lastError: 'This invite code has expired.',
          });
          return { success: false, unlockedCount: 0, error: 'Code expired' };
        }

        // DEMO: Any valid 6-digit code unlocks all listings
        const { unlockedListingIds, usedCodes } = get();
        const allListingIds = PRIVATE_LISTINGS.map((l) => l.id);
        const newUnlocked = allListingIds.filter(
          (id) => !unlockedListingIds.includes(id)
        );

        set({
          unlockedListingIds: [...unlockedListingIds, ...newUnlocked],
          usedCodes: usedCodes.includes(code) ? usedCodes : [...usedCodes, code],
          isValidating: false,
          lastSuccessCode: code,
          enteredCode: '',
        });

        return { success: true, unlockedCount: newUnlocked.length };
      },

      isListingUnlocked: (listingId) => {
        return get().unlockedListingIds.includes(listingId);
      },

      getUnlockedListings: () => {
        const { unlockedListingIds } = get();
        return PRIVATE_LISTINGS.filter((listing) =>
          unlockedListingIds.includes(listing.id)
        );
      },

      getLockedListings: () => {
        const { unlockedListingIds } = get();
        return PRIVATE_LISTINGS.filter(
          (listing) =>
            listing.isPubliclyVisible && !unlockedListingIds.includes(listing.id)
        );
      },

      clearError: () => set({ lastError: null }),

      reset: () =>
        set({
          unlockedListingIds: [],
          enteredCode: '',
          isValidating: false,
          lastError: null,
          lastSuccessCode: null,
          usedCodes: [],
        }),

      // Alan's state persists (keep unlocked listings)
      loadAlanState: () => {
        // Don't reset - keep whatever is already unlocked
        // Alan's data persists across sessions
      },

      // Mike's state resets (clear unlocked listings)
      loadMikeState: () => {
        set({
          unlockedListingIds: [],
          enteredCode: '',
          isValidating: false,
          lastError: null,
          lastSuccessCode: null,
          usedCodes: [],
        });
      },
    }),
    {
      name: 'meru-private-access',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unlockedListingIds: state.unlockedListingIds,
        usedCodes: state.usedCodes,
      }),
    }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

export function hasAnyUnlockedListings(): boolean {
  return usePrivateAccessStore.getState().unlockedListingIds.length > 0;
}

export function getUnlockedCount(): number {
  return usePrivateAccessStore.getState().unlockedListingIds.length;
}

export function getTotalListingsCount(): number {
  return PRIVATE_LISTINGS.filter((l) => l.isPubliclyVisible).length;
}
