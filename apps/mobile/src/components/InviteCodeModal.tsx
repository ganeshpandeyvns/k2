// ============================================================================
// Invite Code Modal - Premium Gated Access Entry
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Animated,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { usePrivateAccessStore } from '../store/privateAccessStore';

interface InviteCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (unlockedCount: number) => void;
}

export function InviteCodeModal({ visible, onClose, onSuccess }: InviteCodeModalProps) {
  const theme = useTheme();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { validateAndUnlock } = usePrivateAccessStore();

  useEffect(() => {
    if (visible) {
      setCode(['', '', '', '', '', '']);
      setError(null);
      setSuccess(false);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleSubmit(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode: string) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await validateAndUnlock(fullCode);

      if (result.success) {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success briefly then close
        setTimeout(() => {
          onSuccess(result.unlockedCount);
          onClose();
        }, 1200);
      } else {
        setError(result.error || 'Invalid code');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError('Something went wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable onPress={() => {}}>
            <LinearGradient
              colors={[theme.colors.background.elevated, theme.colors.background.secondary]}
              style={[styles.modal, { borderColor: theme.colors.border.light }]}
            >
              {/* Header Icon */}
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent.glow }]}>
                <Text style={styles.lockIcon}>{success ? '🎉' : '🔐'}</Text>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                {success ? 'Access Granted!' : 'Exclusive Access'}
              </Text>

              {/* Subtitle */}
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                {success
                  ? 'You now have access to exclusive private listings'
                  : 'Enter your 6-digit invite code from your onboarding email'}
              </Text>

              {!success && (
                <>
                  {/* Code Input */}
                  <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[
                          styles.codeInput,
                          {
                            backgroundColor: theme.colors.background.primary,
                            borderColor: digit
                              ? theme.colors.accent.primary
                              : error
                              ? theme.colors.error.primary
                              : theme.colors.border.medium,
                            color: theme.colors.text.primary,
                          },
                        ]}
                        value={digit}
                        onChangeText={(value) => handleCodeChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        editable={!isLoading}
                      />
                    ))}
                  </View>

                  {/* Error Message */}
                  {error && (
                    <View style={[styles.errorContainer, { backgroundColor: theme.colors.error.glow }]}>
                      <Text style={[styles.errorText, { color: theme.colors.error.primary }]}>
                        {error}
                      </Text>
                    </View>
                  )}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={theme.colors.accent.primary} />
                      <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
                        Validating...
                      </Text>
                    </View>
                  )}

                  {/* Helper Text */}
                  <Text style={[styles.helperText, { color: theme.colors.text.tertiary }]}>
                    Don't have a code? Contact your account manager for access to exclusive deals.
                  </Text>
                </>
              )}

              {/* Close Button */}
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: success
                      ? theme.colors.accent.primary
                      : theme.colors.background.primary,
                  },
                ]}
                onPress={handleClose}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    {
                      color: success ? theme.colors.text.inverse : theme.colors.text.primary,
                    },
                  ]}
                >
                  {success ? 'View Deals' : 'Cancel'}
                </Text>
              </Pressable>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
  },
  modal: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
