// ============================================================================
// Onboarding Screen - Unified KYC + Bank Linking Hub
// Progress: KYC (50%) + Bank Linking (100%)
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';
import { useKYCStore } from '../../store/kycStore';
import { useFundingStore } from '../../store/fundingStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type OnboardingRouteProp = RouteProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OnboardingRouteProp>();

  // Get return destination from params
  const returnTo = route.params?.returnTo;

  // Store state
  const kycStatus = useKYCStore((state) => state.status);
  const paymentMethods = useFundingStore((state) => state.paymentMethods);

  // Derived state
  const kycComplete = kycStatus === 'verified';
  const bankComplete = paymentMethods.length > 0;

  // Progress calculation: KYC = 50%, Bank = 100%
  const progress = kycComplete ? (bankComplete ? 100 : 50) : 0;
  const currentStep = !kycComplete ? 1 : !bankComplete ? 2 : 2;

  // Animation
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(progressAnim, {
        toValue: progress,
        tension: 40,
        friction: 8,
        useNativeDriver: false,
      }),
    ]).start();
  }, [progress]);

  // Check if both steps complete - navigate to success
  useEffect(() => {
    if (kycComplete && bankComplete) {
      navigation.replace('OnboardingSuccess', { returnTo });
    }
  }, [kycComplete, bankComplete, returnTo]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!kycComplete) {
      // Go to KYC flow
      navigation.navigate('KYC' as any);
    } else if (!bankComplete) {
      // Go to bank linking
      navigation.navigate('AddBank' as any);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background */}
      <LinearGradient
        colors={[
          MeruTheme.colors.accent.primary + '15',
          MeruTheme.colors.background.primary,
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Complete Setup</Text>
        <View style={styles.headerRight} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Section */}
        <Animated.View style={[styles.progressSection, { opacity: fadeAnim }]}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            />
          </View>
          <Text style={styles.progressText}>Step {currentStep} of 2</Text>
        </Animated.View>

        {/* Info Text */}
        <Animated.View style={[styles.infoSection, { opacity: fadeAnim }]}>
          <Text style={styles.infoTitle}>Before you can trade</Text>
          <Text style={styles.infoSubtitle}>
            We need to verify your identity and link a bank account. This helps us keep your funds safe and comply with regulations.
          </Text>
        </Animated.View>

        {/* Steps */}
        <Animated.View style={[styles.stepsContainer, { opacity: fadeAnim }]}>
          {/* Step 1: Verify Identity */}
          <Pressable
            style={[
              styles.stepCard,
              kycComplete && styles.stepCardComplete,
              !kycComplete && styles.stepCardActive,
            ]}
            onPress={() => {
              if (!kycComplete) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('KYC' as any);
              }
            }}
          >
            <View style={[
              styles.stepIndicator,
              kycComplete && styles.stepIndicatorComplete,
              !kycComplete && styles.stepIndicatorActive,
            ]}>
              {kycComplete ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={styles.stepNumber}>1</Text>
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[
                styles.stepTitle,
                kycComplete && styles.stepTitleComplete,
              ]}>
                Verify Identity
              </Text>
              <Text style={styles.stepDescription}>
                {kycComplete
                  ? 'Identity verified'
                  : 'Personal info & ID verification'}
              </Text>
            </View>
            {!kycComplete && (
              <Text style={styles.stepArrow}>›</Text>
            )}
          </Pressable>

          {/* Step 2: Link Bank Account */}
          <Pressable
            style={[
              styles.stepCard,
              bankComplete && styles.stepCardComplete,
              kycComplete && !bankComplete && styles.stepCardActive,
              !kycComplete && styles.stepCardDisabled,
            ]}
            onPress={() => {
              if (kycComplete && !bankComplete) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('AddBank' as any);
              }
            }}
            disabled={!kycComplete}
          >
            <View style={[
              styles.stepIndicator,
              bankComplete && styles.stepIndicatorComplete,
              kycComplete && !bankComplete && styles.stepIndicatorActive,
              !kycComplete && styles.stepIndicatorDisabled,
            ]}>
              {bankComplete ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={[
                  styles.stepNumber,
                  !kycComplete && styles.stepNumberDisabled,
                ]}>2</Text>
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[
                styles.stepTitle,
                bankComplete && styles.stepTitleComplete,
                !kycComplete && styles.stepTitleDisabled,
              ]}>
                Link Bank Account
              </Text>
              <Text style={[
                styles.stepDescription,
                !kycComplete && styles.stepDescriptionDisabled,
              ]}>
                {bankComplete
                  ? `${paymentMethods[0].name} ••••${paymentMethods[0].lastFour} linked`
                  : 'Connect your bank to fund trades'}
              </Text>
            </View>
            {kycComplete && !bankComplete && (
              <Text style={styles.stepArrow}>›</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Benefits */}
        <Animated.View style={[styles.benefitsSection, { opacity: fadeAnim }]}>
          <Text style={styles.benefitsTitle}>Why we need this</Text>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <Text style={styles.benefitText}>Keep your account secure</Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Enable instant deposits</Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>📋</Text>
            <Text style={styles.benefitText}>Comply with financial regulations</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* CTA Button */}
      <Animated.View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16, opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={MeruTheme.colors.accent.gradient as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {!kycComplete ? 'Verify Identity' : 'Link Bank Account'}
            </Text>
          </LinearGradient>
        </Pressable>
        <Text style={styles.ctaSubtext}>Takes about 3 minutes</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MeruTheme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: MeruTheme.colors.text.primary,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  infoSubtitle: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
    lineHeight: 24,
  },
  stepsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  stepCardActive: {
    borderColor: MeruTheme.colors.accent.primary,
    backgroundColor: MeruTheme.colors.accent.glow,
  },
  stepCardComplete: {
    borderColor: MeruTheme.colors.success.primary + '40',
    backgroundColor: MeruTheme.colors.success.glow,
  },
  stepCardDisabled: {
    opacity: 0.5,
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MeruTheme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepIndicatorActive: {
    backgroundColor: MeruTheme.colors.accent.primary,
  },
  stepIndicatorComplete: {
    backgroundColor: MeruTheme.colors.success.primary,
  },
  stepIndicatorDisabled: {
    backgroundColor: MeruTheme.colors.background.tertiary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: MeruTheme.colors.text.inverse,
  },
  stepNumberDisabled: {
    color: MeruTheme.colors.text.tertiary,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    color: MeruTheme.colors.text.inverse,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 4,
  },
  stepTitleComplete: {
    color: MeruTheme.colors.success.primary,
  },
  stepTitleDisabled: {
    color: MeruTheme.colors.text.tertiary,
  },
  stepDescription: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  stepDescriptionDisabled: {
    color: MeruTheme.colors.text.muted,
  },
  stepArrow: {
    fontSize: 24,
    color: MeruTheme.colors.accent.primary,
    marginLeft: 8,
  },
  benefitsSection: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    color: MeruTheme.colors.text.primary,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: MeruTheme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
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
  ctaSubtext: {
    fontSize: 13,
    color: MeruTheme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 12,
  },
});
