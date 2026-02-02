// ============================================================================
// Setup Gate Modal - Shown when user tries to trade without completing setup
// "Verify your identity & Link your bank account"
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';

interface SetupGateModalProps {
  visible: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  assetName?: string;
}

export function SetupGateModal({
  visible,
  onClose,
  onGetStarted,
  assetName,
}: SetupGateModalProps) {
  const insets = useSafeAreaInsets();

  // Animations
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGetStarted();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              paddingBottom: insets.bottom + 20,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={MeruTheme.colors.accent.gradient as [string, string, string]}
              style={styles.iconGradient}
            >
              <Text style={styles.icon}>🔐</Text>
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Complete Setup to Trade</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Before you can {assetName ? `buy ${assetName}` : 'trade'}, we need to:
          </Text>

          {/* Requirements */}
          <View style={styles.requirements}>
            <View style={styles.requirementRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.requirementText}>Verify your identity</Text>
            </View>
            <View style={styles.requirementRow}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.requirementText}>Link your bank account</Text>
            </View>
          </View>

          {/* Time estimate */}
          <View style={styles.timeEstimate}>
            <Text style={styles.timeIcon}>⏱</Text>
            <Text style={styles.timeText}>This only takes about 3 minutes</Text>
          </View>

          {/* CTA Button */}
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={MeruTheme.colors.accent.gradient as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          {/* Secondary action */}
          <Pressable onPress={handleClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Continue Exploring</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: MeruTheme.colors.background.elevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: MeruTheme.colors.border.medium,
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  requirements: {
    width: '100%',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MeruTheme.colors.accent.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: MeruTheme.colors.accent.primary,
  },
  requirementText: {
    fontSize: 16,
    color: MeruTheme.colors.text.primary,
    fontWeight: '500',
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timeText: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.text.inverse,
  },
  secondaryButton: {
    paddingVertical: 14,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
});
