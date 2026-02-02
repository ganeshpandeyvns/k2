// ============================================================================
// Onboarding Success Screen - Celebration + Return to Trade
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { MeruTheme } from '../../theme/meru';
import { useFundingStore } from '../../store/fundingStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SuccessRouteProp = RouteProp<RootStackParamList, 'OnboardingSuccess'>;

export function OnboardingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SuccessRouteProp>();

  const returnTo = route.params?.returnTo;
  const paymentMethods = useFundingStore((state) => state.paymentMethods);
  const linkedBank = paymentMethods[0];

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Staggered animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (returnTo) {
      // Navigate back to the original destination
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' as any },
          {
            name: returnTo.screen as any,
            params: returnTo.params
          },
        ],
      });
    } else {
      // Default: go to home
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as any }],
      });
    }
  };

  const handleAddFunds = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Go to deposit screen, then return to trade
    navigation.reset({
      index: 1,
      routes: [
        { name: 'MainTabs' as any },
        {
          name: 'Deposit' as any,
          params: { returnTo }
        },
      ],
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background */}
      <LinearGradient
        colors={[
          MeruTheme.colors.success.primary + '20',
          MeruTheme.colors.accent.primary + '10',
          MeruTheme.colors.background.primary,
        ]}
        locations={[0, 0.3, 0.6]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.successCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[MeruTheme.colors.success.primary, MeruTheme.colors.success.secondary]}
            style={styles.successGradient}
          >
            <Animated.Text
              style={[
                styles.checkmark,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              ✓
            </Animated.Text>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Your account is ready for trading
          </Text>
        </Animated.View>

        {/* Completed Items */}
        <Animated.View style={[styles.completedSection, { opacity: fadeAnim }]}>
          <View style={styles.completedItem}>
            <View style={styles.completedIcon}>
              <Text style={styles.completedCheck}>✓</Text>
            </View>
            <Text style={styles.completedText}>Identity verified</Text>
          </View>

          <View style={styles.completedItem}>
            <View style={styles.completedIcon}>
              <Text style={styles.completedCheck}>✓</Text>
            </View>
            <Text style={styles.completedText}>
              {linkedBank
                ? `${linkedBank.name} ••••${linkedBank.lastFour} linked`
                : 'Bank account linked'}
            </Text>
          </View>
        </Animated.View>

        {/* What's Next */}
        <Animated.View style={[styles.nextSection, { opacity: fadeAnim }]}>
          <Text style={styles.nextTitle}>What's next?</Text>
          <Text style={styles.nextText}>
            Add funds to your account to start trading crypto and event contracts.
          </Text>
        </Animated.View>
      </View>

      {/* CTA Buttons */}
      <Animated.View style={[styles.ctaContainer, { opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleAddFunds}
        >
          <LinearGradient
            colors={MeruTheme.colors.accent.gradient as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.primaryButtonText}>Add Funds & Start Trading</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.secondaryButtonText}>
            {returnTo ? 'Continue to Asset' : 'Explore First'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
    shadowColor: MeruTheme.colors.success.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  successGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 56,
    fontWeight: '700',
    color: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  completedSection: {
    width: '100%',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  completedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MeruTheme.colors.success.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  completedCheck: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  completedText: {
    fontSize: 16,
    color: MeruTheme.colors.text.primary,
    fontWeight: '500',
  },
  nextSection: {
    width: '100%',
    alignItems: 'center',
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextText: {
    fontSize: 15,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.text.inverse,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.light,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
});
