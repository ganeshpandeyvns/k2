// ============================================================================
// KYC Store - Zustand
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  ssnLast4?: string;
}

export interface UploadedDocument {
  type: 'passport' | 'drivers_license' | 'id_card';
  frontUri: string;
  backUri?: string;
  uploadedAt: string;
}

export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';

interface KYCState {
  status: KYCStatus;
  personalInfo: PersonalInfo | null;
  documents: UploadedDocument[];
  selfieUri: string | null;
  selfieVerified: boolean;
  verificationMessage: string | null;

  // Actions
  setPersonalInfo: (info: PersonalInfo) => void;
  addDocument: (doc: UploadedDocument) => void;
  setSelfie: (uri: string) => void;
  setStatus: (status: KYCStatus, message?: string) => void;
  completeVerification: () => void;
  simulateVerification: () => Promise<void>;
  resetKYC: () => void;
  getProgress: () => number;
}

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      status: 'none',
      personalInfo: null,
      documents: [],
      selfieUri: null,
      selfieVerified: false,
      verificationMessage: null,

      setPersonalInfo: (info) =>
        set({ personalInfo: info }),

      addDocument: (doc) =>
        set((state) => ({
          documents: [
            ...state.documents.filter((d) => d.type !== doc.type),
            doc,
          ],
        })),

      setSelfie: (uri) =>
        set({ selfieUri: uri }),

      setStatus: (status, message) =>
        set({ status, verificationMessage: message || null }),

      completeVerification: () =>
        set({
          status: 'verified',
          selfieVerified: true,
          verificationMessage: 'Identity verified successfully',
        }),

      simulateVerification: async () => {
        // Set to pending during verification
        set({ status: 'pending', verificationMessage: 'Verifying your identity...' });

        // Simulate AI verification processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Always succeed in demo mode
        set({
          status: 'verified',
          selfieVerified: true,
          verificationMessage: 'Identity verified successfully',
        });
      },

      resetKYC: () =>
        set({
          status: 'none',
          personalInfo: null,
          documents: [],
          selfieUri: null,
          selfieVerified: false,
          verificationMessage: null,
        }),

      getProgress: () => {
        const state = get();
        let progress = 0;

        if (state.personalInfo) progress += 33;
        if (state.documents.length > 0) progress += 33;
        if (state.selfieUri || state.selfieVerified) progress += 34;

        return progress;
      },
    }),
    {
      name: 'meru-kyc-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        status: state.status,
        personalInfo: state.personalInfo,
        documents: state.documents,
        selfieUri: state.selfieUri,
        selfieVerified: state.selfieVerified,
      }),
    }
  )
);
