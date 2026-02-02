// ============================================================================
// KYC Store Tests - Regression Suite
// ============================================================================
// Tests for KYC verification status and profile state management.
// Added to catch regressions in KYC-based access control.
// ============================================================================

import { useKYCStore } from '../../src/store/kycStore';

// Helper to wrap state updates (matches pattern from other tests)
const act = (fn: () => void) => fn();

// Reset store before each test
beforeEach(() => {
  useKYCStore.getState().resetKYC();
});

describe('KYC Store', () => {
  describe('Initial State', () => {
    it('should start with no verification', () => {
      const state = useKYCStore.getState();
      expect(state.status).toBe('none');
      expect(state.personalInfo).toBeNull();
      expect(state.documents).toEqual([]);
      expect(state.selfieUri).toBeNull();
      expect(state.selfieVerified).toBe(false);
    });
  });

  describe('Personal Info', () => {
    it('should save personal info', () => {
      const { setPersonalInfo } = useKYCStore.getState();

      const info = {
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
        ssnLast4: '1234',
      };

      act(() => {
        setPersonalInfo(info);
      });

      expect(useKYCStore.getState().personalInfo).toEqual(info);
    });
  });

  describe('Document Upload', () => {
    it('should add document', () => {
      const { addDocument } = useKYCStore.getState();

      const doc = {
        type: 'drivers_license' as const,
        frontUri: 'file://test-front.jpg',
        backUri: 'file://test-back.jpg',
        uploadedAt: '2024-01-01T00:00:00Z',
      };

      act(() => {
        addDocument(doc);
      });

      const state = useKYCStore.getState();
      expect(state.documents).toHaveLength(1);
      expect(state.documents[0]).toEqual(doc);
    });

    it('should replace document of same type', () => {
      const { addDocument } = useKYCStore.getState();

      const doc1 = {
        type: 'drivers_license' as const,
        frontUri: 'file://old-front.jpg',
        uploadedAt: '2024-01-01T00:00:00Z',
      };

      const doc2 = {
        type: 'drivers_license' as const,
        frontUri: 'file://new-front.jpg',
        uploadedAt: '2024-01-02T00:00:00Z',
      };

      act(() => {
        addDocument(doc1);
        addDocument(doc2);
      });

      const state = useKYCStore.getState();
      expect(state.documents).toHaveLength(1);
      expect(state.documents[0].frontUri).toBe('file://new-front.jpg');
    });
  });

  describe('Status Management', () => {
    it('should update status', () => {
      const { setStatus } = useKYCStore.getState();

      act(() => {
        setStatus('pending', 'Verifying your identity...');
      });

      const state = useKYCStore.getState();
      expect(state.status).toBe('pending');
      expect(state.verificationMessage).toBe('Verifying your identity...');
    });

    it('should complete verification', () => {
      const { completeVerification } = useKYCStore.getState();

      act(() => {
        completeVerification();
      });

      const state = useKYCStore.getState();
      expect(state.status).toBe('verified');
      expect(state.selfieVerified).toBe(true);
      expect(state.verificationMessage).toBe('Identity verified successfully');
    });
  });

  describe('Simulation', () => {
    it('should simulate verification process', async () => {
      const { simulateVerification } = useKYCStore.getState();

      const promise = simulateVerification();

      // Should be pending during simulation
      expect(useKYCStore.getState().status).toBe('pending');

      await promise;

      // Should be verified after simulation
      const state = useKYCStore.getState();
      expect(state.status).toBe('verified');
      expect(state.selfieVerified).toBe(true);
    });
  });

  describe('Progress Calculation', () => {
    it('should return 0 for no progress', () => {
      const progress = useKYCStore.getState().getProgress();
      expect(progress).toBe(0);
    });

    it('should return 33 for personal info only', () => {
      const store = useKYCStore.getState();

      act(() => {
        store.setPersonalInfo({
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'US',
          },
        });
      });

      expect(store.getProgress()).toBe(33);
    });

    it('should return 66 for personal info and document', () => {
      const store = useKYCStore.getState();

      act(() => {
        store.setPersonalInfo({
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'US',
          },
        });
        store.addDocument({
          type: 'drivers_license',
          frontUri: 'file://test.jpg',
          uploadedAt: '2024-01-01T00:00:00Z',
        });
      });

      expect(store.getProgress()).toBe(66);
    });

    it('should return 100 for complete verification', () => {
      const store = useKYCStore.getState();

      act(() => {
        store.setPersonalInfo({
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'US',
          },
        });
        store.addDocument({
          type: 'drivers_license',
          frontUri: 'file://test.jpg',
          uploadedAt: '2024-01-01T00:00:00Z',
        });
        store.setSelfie('file://selfie.jpg');
      });

      expect(store.getProgress()).toBe(100);
    });
  });

  describe('Profile State Management', () => {
    it('should load Alan (verified) state', () => {
      const store = useKYCStore.getState();

      act(() => {
        store.loadAlexState();
      });

      const state = useKYCStore.getState();
      expect(state.status).toBe('verified');
      expect(state.personalInfo).not.toBeNull();
      expect(state.personalInfo?.firstName).toBe('Alan');
      expect(state.documents.length).toBeGreaterThan(0);
      expect(state.selfieVerified).toBe(true);
    });

    it('should load Mike (unverified) state', () => {
      const store = useKYCStore.getState();

      // First load Alan state
      act(() => {
        store.loadAlexState();
      });

      // Then load Mike state
      act(() => {
        store.loadMikeState();
      });

      const state = useKYCStore.getState();
      expect(state.status).toBe('none');
      expect(state.personalInfo).toBeNull();
      expect(state.documents).toEqual([]);
      expect(state.selfieVerified).toBe(false);
    });
  });

  describe('Reset', () => {
    it('should fully reset state', () => {
      const store = useKYCStore.getState();

      // Set up some state
      act(() => {
        store.setPersonalInfo({
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'US',
          },
        });
        store.setStatus('verified');
      });

      // Reset
      act(() => {
        store.resetKYC();
      });

      const state = useKYCStore.getState();
      expect(state.status).toBe('none');
      expect(state.personalInfo).toBeNull();
      expect(state.documents).toEqual([]);
      expect(state.selfieVerified).toBe(false);
    });
  });
});

describe('Regression: KYC Access Control', () => {
  beforeEach(() => {
    useKYCStore.getState().resetKYC();
  });

  it('REGRESSION: KYC status check for private asset access', () => {
    // Unverified user
    let state = useKYCStore.getState();
    let hasKYC = state.status === 'verified';
    expect(hasKYC).toBe(false);

    // Complete verification
    act(() => {
      state.completeVerification();
    });

    // Now verified
    state = useKYCStore.getState();
    hasKYC = state.status === 'verified';
    expect(hasKYC).toBe(true);
  });

  it('REGRESSION: Pending status should not grant access', () => {
    const store = useKYCStore.getState();

    act(() => {
      store.setStatus('pending');
    });

    const hasKYC = useKYCStore.getState().status === 'verified';
    expect(hasKYC).toBe(false);
  });

  it('REGRESSION: Rejected status should not grant access', () => {
    const store = useKYCStore.getState();

    act(() => {
      store.setStatus('rejected', 'Document verification failed');
    });

    const state = useKYCStore.getState();
    expect(state.status === 'verified').toBe(false);
    expect(state.verificationMessage).toBe('Document verification failed');
  });

  it('REGRESSION: Mike profile should always be unverified', () => {
    const store = useKYCStore.getState();

    // Even if somehow verified
    act(() => {
      store.completeVerification();
    });
    expect(useKYCStore.getState().status).toBe('verified');

    // Loading Mike state should reset
    act(() => {
      store.loadMikeState();
    });
    expect(useKYCStore.getState().status).toBe('none');
  });
});
