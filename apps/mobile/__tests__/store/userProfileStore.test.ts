// ============================================================================
// User Profile Store Tests - Regression Suite
// ============================================================================
// Tests for user profile switching and onboarding status checks.
// Added to catch regressions in profile-based access control.
// ============================================================================

import { useUserProfileStore, DEMO_PROFILES, needsOnboarding } from '../../src/store/userProfileStore';

// Helper to wrap state updates (matches pattern from other tests)
const act = (fn: () => void) => fn();

// Reset store before each test
beforeEach(() => {
  // Reset to Alex (default)
  useUserProfileStore.setState({ currentProfileId: 'alex' });
});

describe('User Profile Store', () => {
  describe('Demo Profiles', () => {
    it('should have Alan profile defined correctly', () => {
      expect(DEMO_PROFILES.alex).toBeDefined();
      expect(DEMO_PROFILES.alex.name).toBe('Alan');
      expect(DEMO_PROFILES.alex.isVerified).toBe(true);
      expect(DEMO_PROFILES.alex.hasBankLinked).toBe(true);
      expect(DEMO_PROFILES.alex.hasFunds).toBe(true);
      expect(DEMO_PROFILES.alex.hasHoldings).toBe(true);
    });

    it('should have Mike profile defined correctly', () => {
      expect(DEMO_PROFILES.mike).toBeDefined();
      expect(DEMO_PROFILES.mike.name).toBe('Mike');
      expect(DEMO_PROFILES.mike.isVerified).toBe(false);
      expect(DEMO_PROFILES.mike.hasBankLinked).toBe(false);
      expect(DEMO_PROFILES.mike.hasFunds).toBe(false);
      expect(DEMO_PROFILES.mike.hasHoldings).toBe(false);
    });
  });

  describe('Initial State', () => {
    it('should default to Alex profile', () => {
      const state = useUserProfileStore.getState();
      expect(state.currentProfileId).toBe('alex');
    });
  });

  describe('Profile Switching', () => {
    it('should switch to Mike profile', () => {
      const { switchProfile } = useUserProfileStore.getState();

      act(() => {
        switchProfile('mike');
      });

      expect(useUserProfileStore.getState().currentProfileId).toBe('mike');
    });

    it('should switch back to Alex profile', () => {
      const store = useUserProfileStore.getState();

      // Switch to Mike first
      act(() => {
        store.switchProfile('mike');
      });

      // Then switch back to Alex
      act(() => {
        store.switchProfile('alex');
      });

      expect(useUserProfileStore.getState().currentProfileId).toBe('alex');
    });
  });

  describe('getCurrentProfile', () => {
    it('should return Alan profile data when Alex is selected', () => {
      const profile = useUserProfileStore.getState().getCurrentProfile();

      expect(profile.name).toBe('Alan');
      expect(profile.email).toBe('alan@demo.meru.app');
      expect(profile.isVerified).toBe(true);
    });

    it('should return Mike profile data when Mike is selected', () => {
      const store = useUserProfileStore.getState();

      act(() => {
        store.switchProfile('mike');
      });

      const profile = store.getCurrentProfile();

      expect(profile.name).toBe('Mike');
      expect(profile.email).toBe('mike@demo.meru.app');
      expect(profile.isVerified).toBe(false);
    });
  });

  describe('isCurrentProfileVerified', () => {
    it('should return true for Alan (verified user)', () => {
      const isVerified = useUserProfileStore.getState().isCurrentProfileVerified();
      expect(isVerified).toBe(true);
    });

    it('should return false for Mike (new user)', () => {
      const store = useUserProfileStore.getState();

      act(() => {
        store.switchProfile('mike');
      });

      const isVerified = store.isCurrentProfileVerified();
      expect(isVerified).toBe(false);
    });
  });
});

describe('needsOnboarding Helper', () => {
  beforeEach(() => {
    useUserProfileStore.setState({ currentProfileId: 'alex' });
  });

  it('should return no onboarding needed for Alan', () => {
    const result = needsOnboarding();
    expect(result.needsKYC).toBe(false);
    expect(result.needsBank).toBe(false);
  });

  it('should return onboarding needed for Mike', () => {
    act(() => {
      useUserProfileStore.getState().switchProfile('mike');
    });

    const result = needsOnboarding();
    expect(result.needsKYC).toBe(true);
    expect(result.needsBank).toBe(true);
  });
});

describe('Regression: Profile-Based Access Control', () => {
  beforeEach(() => {
    useUserProfileStore.setState({ currentProfileId: 'alex' });
  });

  it('REGRESSION: Profile ID should be correct for access control checks', () => {
    // Alan's profile ID
    let profile = useUserProfileStore.getState().getCurrentProfile();
    expect(profile.id).toBe('demo-alan');

    // Switch to Mike
    act(() => {
      useUserProfileStore.getState().switchProfile('mike');
    });

    // Mike's profile ID
    profile = useUserProfileStore.getState().getCurrentProfile();
    expect(profile.id).toBe('demo-mike');
  });

  it('REGRESSION: New user check should work correctly', () => {
    // For Alan - not a new user
    let profile = useUserProfileStore.getState().getCurrentProfile();
    let isNewUser = profile.id === 'demo-mike' || !profile.isVerified;
    expect(isNewUser).toBe(false);

    // For Mike - is a new user
    act(() => {
      useUserProfileStore.getState().switchProfile('mike');
    });

    profile = useUserProfileStore.getState().getCurrentProfile();
    isNewUser = profile.id === 'demo-mike' || !profile.isVerified;
    expect(isNewUser).toBe(true);
  });

  it('REGRESSION: Profile characteristics should be immutable', () => {
    // Verify that DEMO_PROFILES are read-only and consistent
    const alexBefore = { ...DEMO_PROFILES.alex };
    const mikeBefore = { ...DEMO_PROFILES.mike };

    // Switch profiles multiple times
    const store = useUserProfileStore.getState();
    act(() => { store.switchProfile('mike'); });
    act(() => { store.switchProfile('alex'); });
    act(() => { store.switchProfile('mike'); });
    act(() => { store.switchProfile('alex'); });

    // Profiles should remain unchanged
    expect(DEMO_PROFILES.alex.isVerified).toBe(alexBefore.isVerified);
    expect(DEMO_PROFILES.alex.hasBankLinked).toBe(alexBefore.hasBankLinked);
    expect(DEMO_PROFILES.mike.isVerified).toBe(mikeBefore.isVerified);
    expect(DEMO_PROFILES.mike.hasBankLinked).toBe(mikeBefore.hasBankLinked);
  });
});
