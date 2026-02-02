// ============================================================================
// Private Access Store Tests - Regression Suite
// ============================================================================
// Tests for invite code validation and private listing access control.
// Added to catch regressions in private asset access control.
// ============================================================================

import { usePrivateAccessStore } from '../../src/store/privateAccessStore';

// Helper to wrap state updates (matches pattern from other tests)
const act = (fn: () => void) => fn();

// Reset store before each test
beforeEach(() => {
  usePrivateAccessStore.getState().reset();
});

describe('Private Access Store', () => {
  describe('Initial State', () => {
    it('should start with no unlocked listings', () => {
      const state = usePrivateAccessStore.getState();
      expect(state.unlockedListingIds).toEqual([]);
      expect(state.usedCodes).toEqual([]);
      expect(state.enteredCode).toBe('');
      expect(state.isValidating).toBe(false);
      expect(state.lastError).toBeNull();
    });
  });

  describe('Code Entry', () => {
    it('should update entered code', () => {
      const { setEnteredCode } = usePrivateAccessStore.getState();

      act(() => {
        setEnteredCode('123456');
      });

      expect(usePrivateAccessStore.getState().enteredCode).toBe('123456');
    });

    it('should clear error when entering new code', () => {
      const store = usePrivateAccessStore.getState();

      // Set an error first
      usePrivateAccessStore.setState({ lastError: 'Some error' });

      act(() => {
        store.setEnteredCode('999999');
      });

      expect(usePrivateAccessStore.getState().lastError).toBeNull();
    });
  });

  describe('Code Validation', () => {
    it('should reject invalid format (non 6-digit)', async () => {
      const { validateAndUnlock } = usePrivateAccessStore.getState();

      const result = await validateAndUnlock('12345'); // 5 digits
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid format');

      const state = usePrivateAccessStore.getState();
      expect(state.lastError).toBe('Please enter a valid 6-digit code.');
      expect(state.unlockedListingIds).toEqual([]);
    });

    it('should reject non-numeric codes', async () => {
      const { validateAndUnlock } = usePrivateAccessStore.getState();

      const result = await validateAndUnlock('abcdef');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid format');
    });

    it('should accept valid 6-digit code and unlock all listings', async () => {
      const { validateAndUnlock } = usePrivateAccessStore.getState();

      const result = await validateAndUnlock('123456');
      expect(result.success).toBe(true);
      expect(result.unlockedCount).toBeGreaterThan(0);

      const state = usePrivateAccessStore.getState();
      expect(state.unlockedListingIds.length).toBeGreaterThan(0);
      expect(state.usedCodes).toContain('123456');
      expect(state.lastSuccessCode).toBe('123456');
    });

    it('should not re-unlock already unlocked listings', async () => {
      const { validateAndUnlock } = usePrivateAccessStore.getState();

      // First unlock
      const result1 = await validateAndUnlock('123456');
      const firstUnlockCount = result1.unlockedCount;

      // Second unlock with same code
      const result2 = await validateAndUnlock('654321');
      expect(result2.success).toBe(true);
      expect(result2.unlockedCount).toBe(0); // Already unlocked
    });
  });

  describe('Listing Access Check', () => {
    it('should correctly report locked listings', () => {
      const { isListingUnlocked } = usePrivateAccessStore.getState();
      expect(isListingUnlocked('SPACEX-B')).toBe(false);
    });

    it('should correctly report unlocked listings after validation', async () => {
      const store = usePrivateAccessStore.getState();

      await store.validateAndUnlock('123456');

      expect(store.isListingUnlocked('SPACEX-B')).toBe(true);
    });
  });

  describe('Profile State Management', () => {
    it('should reset state for Mike (new user)', async () => {
      const store = usePrivateAccessStore.getState();

      // First unlock some listings
      await store.validateAndUnlock('123456');
      expect(usePrivateAccessStore.getState().unlockedListingIds.length).toBeGreaterThan(0);

      // Load Mike's state (should reset)
      act(() => {
        store.loadMikeState();
      });

      const newState = usePrivateAccessStore.getState();
      expect(newState.unlockedListingIds).toEqual([]);
      expect(newState.usedCodes).toEqual([]);
      expect(newState.enteredCode).toBe('');
      expect(newState.lastSuccessCode).toBeNull();
    });

    it('should preserve state for Alan (verified user)', async () => {
      const store = usePrivateAccessStore.getState();

      // Unlock some listings
      await store.validateAndUnlock('123456');
      const unlockedCount = usePrivateAccessStore.getState().unlockedListingIds.length;

      // Load Alan's state (should preserve)
      act(() => {
        store.loadAlanState();
      });

      // Alan's state preserves unlocked listings
      const newState = usePrivateAccessStore.getState();
      expect(newState.unlockedListingIds.length).toBe(unlockedCount);
    });
  });

  describe('Reset Functionality', () => {
    it('should fully reset store state', async () => {
      const store = usePrivateAccessStore.getState();

      // Make some changes
      await store.validateAndUnlock('123456');
      store.setEnteredCode('999999');

      // Reset
      act(() => {
        store.reset();
      });

      const state = usePrivateAccessStore.getState();
      expect(state.unlockedListingIds).toEqual([]);
      expect(state.usedCodes).toEqual([]);
      expect(state.enteredCode).toBe('');
      expect(state.isValidating).toBe(false);
      expect(state.lastError).toBeNull();
      expect(state.lastSuccessCode).toBeNull();
    });
  });

  describe('Locked/Unlocked Listing Filters', () => {
    it('should return correct locked listings before any unlock', () => {
      const { getLockedListings, getUnlockedListings } = usePrivateAccessStore.getState();

      const locked = getLockedListings();
      const unlocked = getUnlockedListings();

      expect(unlocked).toEqual([]);
      expect(locked.length).toBeGreaterThan(0);
    });

    it('should move listings from locked to unlocked after validation', async () => {
      const store = usePrivateAccessStore.getState();

      const lockedBefore = store.getLockedListings().length;
      expect(lockedBefore).toBeGreaterThan(0);

      await store.validateAndUnlock('123456');

      const unlockedAfter = store.getUnlockedListings().length;
      expect(unlockedAfter).toBeGreaterThan(0);
    });
  });
});

describe('Regression: Private Access Bug Fixes', () => {
  beforeEach(() => {
    usePrivateAccessStore.getState().reset();
  });

  it('REGRESSION: New user should always see locked listings', async () => {
    // This test ensures that even if unlockedListingIds has values,
    // new users (Mike) should see all listings as locked
    const store = usePrivateAccessStore.getState();

    // Simulate having unlocked listings somehow
    usePrivateAccessStore.setState({
      unlockedListingIds: ['SPACEX-B', 'STRIPE-SPV'],
    });

    // Load Mike's state (new user)
    act(() => {
      store.loadMikeState();
    });

    // Mike should have empty unlocked listings
    const state = usePrivateAccessStore.getState();
    expect(state.unlockedListingIds).toEqual([]);

    // isListingUnlocked should return false for all
    expect(state.isListingUnlocked('SPACEX-B')).toBe(false);
    expect(state.isListingUnlocked('STRIPE-SPV')).toBe(false);
  });

  it('REGRESSION: clearError should only clear error state', () => {
    const store = usePrivateAccessStore.getState();

    // Set up some state
    usePrivateAccessStore.setState({
      lastError: 'Test error',
      enteredCode: '123456',
      usedCodes: ['111111'],
    });

    // Clear error
    act(() => {
      store.clearError();
    });

    const state = usePrivateAccessStore.getState();
    expect(state.lastError).toBeNull();
    // Other state should remain
    expect(state.enteredCode).toBe('123456');
    expect(state.usedCodes).toContain('111111');
  });
});
