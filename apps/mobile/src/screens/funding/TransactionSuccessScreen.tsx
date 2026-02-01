// ============================================================================
// Transaction Success Screen - Celebratory Confirmation
// ============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { formatCurrency } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'TransactionSuccess'>;

const { width } = Dimensions.get('window');

// Particle component for celebration effect
const Particle: React.FC<{ delay: number; startX: number }> = ({ delay, startX }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 150;
    const randomDuration = 1500 + Math.random() * 1000;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -300,
          duration: randomDuration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: randomX,
          duration: randomDuration,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
};

export const TransactionSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { type, amount, reference } = route.params || {
    type: 'deposit',
    amount: 0,
    reference: 'N/A',
  };

  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Play success haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate checkmark
    Animated.spring(checkmarkScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Animate content
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Main' as any);
  };

  const isDeposit = type === 'deposit';
  const title = isDeposit ? 'Deposit Successful' : 'Withdrawal Initiated';
  const subtitle = isDeposit
    ? 'Funds are now available in your account'
    : 'Your withdrawal is being processed';

  return (
    <SafeAreaView style={styles.container}>
      {/* Particles */}
      <View style={styles.particlesContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 50}
            startX={width / 2 - 4 + (Math.random() - 0.5) * 40}
          />
        ))}
      </View>

      {/* Success Icon */}
      <Animated.View
        style={[
          styles.checkmarkContainer,
          { transform: [{ scale: checkmarkScale }] },
        ]}
      >
        <LinearGradient
          colors={[MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]}
          style={styles.checkmarkCircle}
        >
          <Text style={styles.checkmarkIcon}>✓</Text>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>
            {isDeposit ? 'Amount Added' : 'Amount Withdrawn'}
          </Text>
          <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction Type</Text>
            <Text style={styles.detailValue}>
              {isDeposit ? 'Deposit' : 'Withdrawal'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={styles.detailValue}>{reference}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isDeposit ? 'Complete' : 'Processing'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Done Button */}
      <Animated.View style={[styles.bottomContainer, { opacity: contentOpacity }]}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneButtonGradient}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 250,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MeruTheme.colors.accent.primary,
  },
  checkmarkContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  checkmarkIcon: {
    fontSize: 48,
    color: MeruTheme.colors.background.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 8,
  },
  amount: {
    fontSize: 44,
    fontWeight: '700',
    color: MeruTheme.colors.accent.primary,
    letterSpacing: -1,
  },
  detailsCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 20,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: MeruTheme.colors.border.subtle,
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  doneButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  doneButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },
});
