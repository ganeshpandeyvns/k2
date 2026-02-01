// ============================================================================
// Deposit Screen - Premium Funding Flow
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { AmountInput } from '../../components/funding/AmountInput';
import { PaymentMethodCardCompact } from '../../components/funding/PaymentMethodCard';
import { useFundingStore, PaymentMethod } from '../../store/fundingStore';
import { useKYCStore } from '../../store/kycStore';
import { formatCurrency } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DepositScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { paymentMethods, simulateDeposit } = useFundingStore();
  const { status: kycStatus } = useKYCStore();

  const defaultMethod = paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount >= 10;

  const handleDeposit = useCallback(async () => {
    if (!defaultMethod) {
      navigation.navigate('PaymentMethods' as any);
      return;
    }

    // Check KYC status
    if (kycStatus !== 'verified') {
      navigation.navigate('KYC' as any);
      return;
    }

    if (!isValidAmount) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);

    try {
      const tx = await simulateDeposit(numericAmount, defaultMethod.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TransactionSuccess' as any, {
        type: 'deposit',
        amount: numericAmount,
        reference: tx.reference,
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  }, [defaultMethod, numericAmount, isValidAmount, kycStatus, navigation, simulateDeposit]);

  const handleChangeMethod = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PaymentMethods' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Funds</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          showQuickAmounts={true}
        />

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>From</Text>
          {defaultMethod ? (
            <PaymentMethodCardCompact
              method={defaultMethod}
              onPress={handleChangeMethod}
            />
          ) : (
            <TouchableOpacity
              style={styles.addMethodCard}
              onPress={() => navigation.navigate('AddBank' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.addMethodIcon}>
                <Text style={styles.addMethodIconText}>+</Text>
              </View>
              <Text style={styles.addMethodText}>Add Bank Account</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Fee Notice */}
        <View style={styles.feeNotice}>
          <Text style={styles.feeNoticeIcon}>⚡</Text>
          <Text style={styles.feeNoticeText}>
            No fees · Instant transfer
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.depositButton,
            (!isValidAmount || isProcessing) && styles.depositButtonDisabled,
          ]}
          onPress={handleDeposit}
          disabled={!isValidAmount || isProcessing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isValidAmount && !isProcessing
                ? [MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]
                : ['#3a3a3a', '#2a2a2a']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.depositButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color={MeruTheme.colors.background.primary} />
            ) : (
              <Text style={styles.depositButtonText}>
                {defaultMethod
                  ? `Deposit ${formatCurrency(numericAmount)}`
                  : 'Add Payment Method'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Demo Mode Badge */}
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>
            Demo Mode — No real money
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MeruTheme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: MeruTheme.colors.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginTop: 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: MeruTheme.colors.accent.primary,
    borderStyle: 'dashed',
  },
  addMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(240, 180, 41, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMethodIconText: {
    fontSize: 24,
    color: MeruTheme.colors.accent.primary,
    fontWeight: '300',
  },
  addMethodText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
  },
  chevron: {
    fontSize: 24,
    color: MeruTheme.colors.accent.primary,
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  feeNoticeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  feeNoticeText: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  depositButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  depositButtonDisabled: {
    shadowOpacity: 0,
  },
  depositButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },
  demoBadge: {
    alignItems: 'center',
    marginTop: 12,
  },
  demoBadgeText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
  },
});
