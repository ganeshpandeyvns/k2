// ============================================================================
// RWA Trade Screen - Buy/Sell Real World Asset Tokens
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useFundingStore } from '../store/fundingStore';
import { usePortfolioStore } from '../store/portfolioStore';
import {
  getRWATokenById,
  RWAToken,
  getCategoryIcon,
  getCategoryColor,
} from '../utils/mockRWAData';
import type { RootStackParamList } from '../navigation/RootNavigator';

type TradeRouteProp = RouteProp<RootStackParamList, 'RWATrade'>;

export function RWATradeScreen() {
  const navigation = useNavigation();
  const route = useRoute<TradeRouteProp>();
  const { tokenId, side } = route.params;
  const theme = useTheme();

  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get token data
  const token = useMemo(() => getRWATokenById(tokenId), [tokenId]);

  // Store access
  const { cashBalance, updateCashBalance } = useFundingStore();
  const { executeBuy, executeSell, getHolding } = usePortfolioStore();

  // Current holding
  const currentHolding = token ? getHolding(token.symbol) : null;

  if (!token) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
          Token not found
        </Text>
      </SafeAreaView>
    );
  }

  const amountNum = parseFloat(amount) || 0;
  // P002: Protect against division by zero
  const tokenQuantity = token.price > 0 ? amountNum / token.price : 0;
  const estimatedYield = token.yield ? (amountNum * token.yield / 100) : 0;

  // Validation
  const isBuy = side === 'buy';
  const maxBuyAmount = cashBalance;
  const maxSellAmount = currentHolding ? currentHolding.quantity * token.price : 0;
  const maxAmount = isBuy ? maxBuyAmount : maxSellAmount;

  const isValidAmount = amountNum >= token.minimumInvestment && amountNum <= maxAmount;
  const isBelowMinimum = amountNum > 0 && amountNum < token.minimumInvestment;

  // Quick amount pills
  const quickAmounts = [100, 500, 1000, 5000];

  const handleQuickAmount = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(value.toString());
  };

  const handleMax = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(Math.floor(maxAmount).toString());
  };

  // P001: Sanitize amount input - reject non-numeric chars, multiple decimals
  const handleAmountChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');
    // Only allow one decimal point
    const decimalCount = (cleaned.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = cleaned.split('.');
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places
    if (cleaned.includes('.')) {
      const [whole, decimal] = cleaned.split('.');
      cleaned = whole + '.' + (decimal || '').slice(0, 2);
    }
    setAmount(cleaned);
  };

  const handleSubmit = useCallback(async () => {
    if (!isValidAmount || isProcessing) return;

    // Large transaction confirmation
    if (amountNum >= 1000) {
      Alert.alert(
        'Confirm Transaction',
        `You are about to ${isBuy ? 'buy' : 'sell'} $${amountNum.toLocaleString()} worth of ${token.symbol}.\n\nThis will ${isBuy ? 'deduct' : 'credit'} $${amountNum.toLocaleString()} ${isBuy ? 'from' : 'to'} your account.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => executeOrder(),
          },
        ]
      );
    } else {
      executeOrder();
    }
  }, [isValidAmount, isProcessing, amountNum, isBuy, token.symbol]);

  const executeOrder = async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (isBuy) {
        // Execute buy
        executeBuy(token.symbol, tokenQuantity, token.price, token.name);
        updateCashBalance(-amountNum);
      } else {
        // Execute sell
        executeSell(token.symbol, tokenQuantity, token.price);
        updateCashBalance(amountNum);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to success
      navigation.navigate('TransactionSuccess' as never, {
        type: isBuy ? 'buy' : 'sell',
        amount: amountNum,
        asset: token.symbol,
        assetName: token.name,
        quantity: tokenQuantity,
        price: token.price,
      } as never);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke={theme.colors.text.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {isBuy ? 'Buy' : 'Sell'} {token.symbol}
          </Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Token Info Card */}
          <View style={[styles.tokenCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
            <View style={[styles.tokenIcon, { backgroundColor: getCategoryColor(token.category) + '20' }]}>
              <Text style={styles.tokenEmoji}>{getCategoryIcon(token.category)}</Text>
            </View>
            <View style={styles.tokenInfo}>
              <Text style={[styles.tokenSymbol, { color: theme.colors.text.primary }]}>{token.symbol}</Text>
              <Text style={[styles.tokenName, { color: theme.colors.text.tertiary }]} numberOfLines={1}>
                {token.name}
              </Text>
            </View>
            <View style={styles.tokenPrice}>
              <Text style={[styles.priceValue, { color: theme.colors.text.primary }]}>
                ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
              <Text style={[
                styles.priceChange,
                { color: token.change24h >= 0 ? theme.colors.success.primary : theme.colors.error.primary },
              ]}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </Text>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: theme.colors.text.tertiary }]}>Amount (USD)</Text>
            <View style={[styles.amountInputContainer, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
              <Text style={[styles.dollarSign, { color: theme.colors.text.tertiary }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.colors.text.primary }]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity style={styles.maxButton} onPress={handleMax}>
                <Text style={[styles.maxButtonText, { color: theme.colors.accent.primary }]}>MAX</Text>
              </TouchableOpacity>
            </View>

            {/* Min investment warning */}
            {isBelowMinimum && (
              <Text style={[styles.warningText, { color: theme.colors.error.primary }]}>
                Minimum investment: ${token.minimumInvestment.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Quick Amount Pills */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountPill,
                  { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
                  amountNum === value && { borderColor: theme.colors.accent.primary, backgroundColor: theme.colors.accent.glow },
                ]}
                onPress={() => handleQuickAmount(value)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    { color: theme.colors.text.secondary },
                    amountNum === value && { color: theme.colors.accent.primary },
                  ]}
                >
                  ${value.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Order Summary */}
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
            <Text style={[styles.summaryTitle, { color: theme.colors.text.primary }]}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Tokens to {isBuy ? 'receive' : 'sell'}</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                {tokenQuantity.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {token.symbol}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Price per token</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>

            {token.yield && isBuy && amountNum > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Est. annual yield</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.success.primary }]}>
                  +${estimatedYield.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({token.yield}% APY)
                </Text>
              </View>
            )}

            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border.subtle }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text.primary }]}>Total</Text>
              <Text style={[styles.totalValue, { color: theme.colors.text.primary }]}>
                ${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Balance Info */}
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>
              {isBuy ? 'Available balance' : 'Holdings value'}
            </Text>
            <Text style={[styles.balanceValue, { color: theme.colors.text.secondary }]}>
              ${maxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Risk Disclaimer */}
          <View style={[styles.disclaimer, { backgroundColor: theme.colors.background.elevated }]}>
            <Text style={[styles.disclaimerText, { color: theme.colors.text.muted }]}>
              RWA tokens represent fractional ownership. Values fluctuate. Not FDIC insured.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.background.primary, borderTopColor: theme.colors.border.subtle }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.accent.primary },
              (!isValidAmount || isProcessing) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValidAmount || isProcessing}
          >
            <Text style={styles.submitButtonText}>
              {isProcessing
                ? 'Processing...'
                : `${isBuy ? 'Buy' : 'Sell'} ${token.symbol}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenEmoji: {
    fontSize: 24,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: '700',
  },
  tokenName: {
    fontSize: 13,
    marginTop: 2,
  },
  tokenPrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceChange: {
    fontSize: 13,
    marginTop: 2,
  },
  amountSection: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
  },
  maxButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  maxButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 12,
    marginTop: 8,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickAmountPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  disclaimer: {
    padding: 12,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 11,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
