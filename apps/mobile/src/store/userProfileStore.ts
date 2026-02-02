// ============================================================================
// User Profile Store - Manages demo user profiles (Alex & Mike F)
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  fullName: string;
  email: string;
  avatar: string | null;
  // Profile characteristics
  isVerified: boolean;      // KYC status
  hasBankLinked: boolean;   // Has payment method
  hasFunds: boolean;        // Has cash balance
  hasHoldings: boolean;     // Has portfolio holdings
}

// Demo Profile Definitions
export const DEMO_PROFILES: Record<string, UserProfile> = {
  alex: {
    id: 'demo-alan',
    name: 'Alan',
    fullName: 'Alan Swimmer',
    email: 'alan@demo.meru.app',
    avatar: null,
    isVerified: true,
    hasBankLinked: true,
    hasFunds: true,
    hasHoldings: true,
  },
  mike: {
    id: 'demo-mike',
    name: 'Mike',
    fullName: 'Mike Diedrichs',
    email: 'mike@demo.meru.app',
    avatar: null,
    isVerified: false,
    hasBankLinked: false,
    hasFunds: false,
    hasHoldings: false,
  },
};

interface UserProfileState {
  currentProfileId: 'alex' | 'mike';

  // Actions
  switchProfile: (profileId: 'alex' | 'mike') => void;
  getCurrentProfile: () => UserProfile;
  isCurrentProfileVerified: () => boolean;
  resetMikeProfile: () => void;
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      currentProfileId: 'alex', // Default to Alex

      switchProfile: (profileId) => {
        set({ currentProfileId: profileId });
      },

      getCurrentProfile: () => {
        const { currentProfileId } = get();
        return DEMO_PROFILES[currentProfileId];
      },

      isCurrentProfileVerified: () => {
        const profile = get().getCurrentProfile();
        return profile.isVerified;
      },

      // Reset Mike's profile to fresh state (for demo purposes)
      resetMikeProfile: () => {
        // This is called when Mike logs in to ensure fresh onboarding experience
        // The actual store resets happen in the individual stores
      },
    }),
    {
      name: 'meru-user-profile-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to check if current user needs onboarding
export const needsOnboarding = (): { needsKYC: boolean; needsBank: boolean } => {
  const profile = useUserProfileStore.getState().getCurrentProfile();
  return {
    needsKYC: !profile.isVerified,
    needsBank: !profile.hasBankLinked,
  };
};
