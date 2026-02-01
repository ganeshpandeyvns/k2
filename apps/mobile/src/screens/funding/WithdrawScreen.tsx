// ============================================================================
// Withdraw Screen - Cash Out Flow
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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { AmountInput } from '../../components/funding/AmountInput';
import { PaymentMethodCardCompact } from '../../components/funding/PaymentMethodCard';
import { useFundingStore } from '../../store/fundingStore';
import { formatCurrency } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const WithdrawScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { paymentMethods, cashBalance, simulateWithdraw } = useFundingStore();

  const defaultMethod = paymentMethods.find((m) => m.isDefault) || paymentMethods[0];
  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount >= 10 && numericAmount <= cashBalance;

  const executeWithdraw = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);

    try {
      const tx = await simulateWithdraw(numericAmount, defaultMethod!.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TransactionSuccess' as any, {
        type: 'withdraw',
        amount: numericAmount,
        reference: tx.reference,
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  }, [defaultMethod, numericAmount, navigation, simulateWithdraw]);

  const handleWithdraw = useCallback(() => {
    if (!defaultMethod || !isValidAmount) return;

    // Confirm large transactions (over $1000)
    if (numericAmount > 1000) {
      Alert.alert(
        'Confirm Large Withdrawal',
        `You are about to withdraw ${formatCurrency(numericAmount)}.\n\nThis is a large transaction. Are you sure you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'destructive', onPress: executeWithdraw },
        ]
      );
      return;
    }

    executeWithdraw();
  }, [defaultMethod, numericAmount, isValidAmount, executeWithdraw]);

  const handleMax = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(cashBalance.toString());
  };

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
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Available Balance */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Available to withdraw</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {formatCurrency(cashBalance)}
            </Text>
            <TouchableOpacity
              style={styles.maxButton}
              onPress={handleMax}
              activeOpacity={0.7}
            >
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <AmountInput
          value={amount}
          onChange={setAmount}
          maxAmount={cashBalance}
          showQuickAmounts={false}
        />

        {/* Destination */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>To</Text>
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

        {/* Processing Time Notice */}
        <View style={styles.timeNotice}>
          <Text style={styles.timeNoticeIcon}>🕐</Text>
          <View>
            <Text style={styles.timeNoticeTitle}>Processing Time</Text>
            <Text style={styles.timeNoticeText}>
              1-3 business days to arrive
            </Text>
          </View>
        </View>

        {/* Amount Validation */}
        {numericAmount > cashBalance && (
          <View style={styles.errorNotice}>
            <Text style={styles.errorNoticeText}>
              Amount exceeds available balance
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            (!isValidAmount || isProcessing || !defaultMethod) && styles.withdrawButtonDisabled,
          ]}
          onPress={handleWithdraw}
          disabled={!isValidAmount || isProcessing || !defaultMethod}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isValidAmount && !isProcessing && defaultMethod
                ? [MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]
                : ['#3a3a3a', '#2a2a2a']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.withdrawButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color={MeruTheme.colors.background.primary} />
            ) : (
              <Text style={styles.withdrawButtonText}>
                Withdraw {formatCurrency(numericAmount)}
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
    paddingTop: 8,
  },
  balanceContainer: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  maxButton: {
    backgroundColor: 'rgba(240, 180, 41, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  maxButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: MeruTheme.colors.accent.primary,
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
  timeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  timeNoticeIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  timeNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 2,
  },
  timeNoticeText: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
  },
  errorNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  errorNoticeText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  withdrawButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  withdrawButtonDisabled: {
    shadowOpacity: 0,
  },
  withdrawButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonText: {
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
