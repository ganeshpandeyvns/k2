// ============================================================================
// Biometrics Hook - Face ID / Touch ID Authentication
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';

export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | 'none';

interface BiometricsState {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
  isChecking: boolean;
}

interface UseBiometricsReturn extends BiometricsState {
  authenticate: (promptMessage?: string) => Promise<boolean>;
  getBiometricLabel: () => string;
  getBiometricIcon: () => string;
}

export function useBiometrics(): UseBiometricsReturn {
  const [state, setState] = useState<BiometricsState>({
    isAvailable: false,
    biometricType: 'none',
    isEnrolled: false,
    isChecking: true,
  });

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType: BiometricType = 'none';

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'faceId';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = Platform.OS === 'ios' ? 'touchId' : 'fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'faceId'; // Treat iris as face-based
      }

      setState({
        isAvailable: compatible && enrolled,
        biometricType,
        isEnrolled: enrolled,
        isChecking: false,
      });
    } catch (error) {
      console.warn('Biometric check failed:', error);
      setState((prev) => ({ ...prev, isChecking: false }));
    }
  };

  const authenticate = useCallback(
    async (promptMessage = 'Authenticate to access Meru'): Promise<boolean> => {
      if (!state.isAvailable) {
        return false;
      }

      try {
        // Haptic feedback on attempt
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false,
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          // Success haptic
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          // Failure haptic
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        return result.success;
      } catch (error) {
        console.warn('Biometric authentication failed:', error);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      }
    },
    [state.isAvailable]
  );

  const getBiometricLabel = useCallback((): string => {
    switch (state.biometricType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometrics';
    }
  }, [state.biometricType]);

  const getBiometricIcon = useCallback((): string => {
    switch (state.biometricType) {
      case 'faceId':
        return 'face-recognition';
      case 'touchId':
      case 'fingerprint':
        return 'fingerprint';
      default:
        return 'lock';
    }
  }, [state.biometricType]);

  return {
    ...state,
    authenticate,
    getBiometricLabel,
    getBiometricIcon,
  };
}
