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

  // Profile state loaders
  loadAlexState: () => void;
  loadMikeState: () => void;
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

      // Load Alan's verified state
      loadAlexState: () =>
        set({
          status: 'verified',
          personalInfo: {
            firstName: 'Alan',
            lastName: 'Swimmer',
            dateOfBirth: '1990-05-15',
            address: {
              street: '123 Mountain View Dr',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94102',
              country: 'US',
            },
            ssnLast4: '4521',
          },
          documents: [
            {
              type: 'drivers_license',
              frontUri: 'demo://alex-license-front',
              backUri: 'demo://alex-license-back',
              uploadedAt: '2024-01-15T10:00:00Z',
            },
          ],
          selfieUri: 'demo://alex-selfie',
          selfieVerified: true,
          verificationMessage: 'Identity verified successfully',
        }),

      // Load Mike's fresh/unverified state
      loadMikeState: () =>
        set({
          status: 'none',
          personalInfo: null,
          documents: [],
          selfieUri: null,
          selfieVerified: false,
          verificationMessage: null,
        }),
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
