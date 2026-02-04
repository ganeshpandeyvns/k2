// ============================================================================
// Fixed Income Trade Screen - Buy/Sell Bonds
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MeruTheme } from '../theme/meru';
import { useFundingStore } from '../store/fundingStore';
import { usePortfolioStore } from '../store/portfolioStore';
import {
  FIXED_INCOME_INSTRUMENTS,
  FixedIncomeInstrument,
  formatYield,
  formatPrice,
  getCategoryLabel,
} from '../utils/mockFixedIncomeData';

type FixedIncomeTradeRouteProp = RouteProp<RootStackParamList, 'FixedIncomeTrade'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function FixedIncomeTradeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FixedIncomeTradeRouteProp>();
  const { instrumentId, side } = route.params;

  const cashBalance = useFundingStore(state => state.cashBalance);
  const updateCashBalance = useFundingStore(state => state.updateCashBalance);
  const executeBuy = usePortfolioStore(state => state.executeBuy);
  const executeSell = usePortfolioStore(state => state.executeSell);
  const getHolding = usePortfolioStore(state => state.getHolding);

  const instrument = FIXED_INCOME_INSTRUMENTS.find(i => i.id === instrumentId);
  const holding = getHolding(instrument?.symbol || '');

  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!instrument) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Instrument not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dirtyPrice = instrument.price + instrument.accruedInterest;
  const amountValue = parseFloat(amount) || 0;

  // Calculate units (face value units)
  const units = useMemo(() => {
    if (amountValue <= 0) return 0;
    return amountValue / dirtyPrice;
  }, [amountValue, dirtyPrice]);

  // Calculate estimated annual income
  const estimatedAnnualIncome = useMemo(() => {
    return units * instrument.faceValue * (instrument.couponRate / 100);
  }, [units, instrument.faceValue, instrument.couponRate]);

  const canTrade = useMemo(() => {
    if (amountValue < instrument.minimumInvestment) return false;
    if (side === 'buy' && amountValue > cashBalance) return false;
    if (side === 'sell' && (!holding || holding.quantity < units)) return false;
    return true;
  }, [amountValue, instrument.minimumInvestment, cashBalance, side, holding, units]);

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimals
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleTrade = async () => {
    if (!canTrade || isProcessing) return;

    // Confirm large transactions
    if (amountValue > 10000) {
      Alert.alert(
        'Confirm Transaction',
        `Are you sure you want to ${side} $${amountValue.toLocaleString()} of ${instrument.symbol}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: executeTrade },
        ]
      );
    } else {
      executeTrade();
    }
  };

  const executeTrade = async () => {
    setIsProcessing(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (side === 'buy') {
        // Deduct cash and add to portfolio
        updateCashBalance(-amountValue);
        executeBuy(
          instrument.symbol,
          units,
          dirtyPrice,
          instrument.name,
          '#4A90D9' // Blue color for fixed income
        );

        Alert.alert(
          'Order Executed',
          `Successfully purchased ${units.toFixed(4)} units of ${instrument.symbol} for $${amountValue.toLocaleString()}`,
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
      } else {
        // Sell and add cash
        const result = executeSell(instrument.symbol, units, dirtyPrice);
        if (result) {
          updateCashBalance(amountValue);
          Alert.alert(
            'Order Executed',
            `Successfully sold ${units.toFixed(4)} units of ${instrument.symbol} for $${amountValue.toLocaleString()}`,
            [{ text: 'Done', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Error', 'Insufficient holdings to sell');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to execute trade. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isBuy = side === 'buy';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isBuy ? 'Buy' : 'Sell'} {instrument.symbol}</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Instrument Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.instrumentName}>{instrument.name}</Text>
            <Text style={styles.categoryText}>{getCategoryLabel(instrument.category)}</Text>

            <View style={styles.priceRow}>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Price (Dirty)</Text>
                <Text style={styles.priceValue}>${dirtyPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Yield</Text>
                <Text style={[styles.priceValue, { color: MeruTheme.colors.success.primary }]}>
                  {formatYield(instrument.yield)}
                </Text>
              </View>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Amount (USD)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={MeruTheme.colors.text.tertiary}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {[1000, 5000, 10000, 25000].map(value => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(value)}
                >
                  <Text style={styles.quickAmountText}>${(value / 1000)}K</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Balance Info */}
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>
                {isBuy ? 'Available Cash' : 'Holdings'}
              </Text>
              <Text style={styles.balanceValue}>
                {isBuy
                  ? `$${cashBalance.toLocaleString()}`
                  : `${holding?.quantity.toFixed(4) || '0'} units`}
              </Text>
            </View>

            {/* Minimum Investment Warning */}
            {amountValue > 0 && amountValue < instrument.minimumInvestment && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Minimum investment: ${instrument.minimumInvestment.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Trade Summary */}
          {amountValue > 0 && (
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Units</Text>
                <Text style={styles.summaryValue}>{units.toFixed(4)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Face Value</Text>
                <Text style={styles.summaryValue}>
                  ${(units * instrument.faceValue).toLocaleString()}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Est. Annual Income</Text>
                <Text style={[styles.summaryValue, { color: MeruTheme.colors.success.primary }]}>
                  ${estimatedAnnualIncome.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Accrued Interest</Text>
                <Text style={styles.summaryValue}>
                  ${(units * instrument.accruedInterest).toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total {isBuy ? 'Cost' : 'Proceeds'}</Text>
                <Text style={styles.totalValue}>${amountValue.toLocaleString()}</Text>
              </View>
            </View>
          )}

          {/* Disclosure */}
          <View style={styles.disclosureCard}>
            <Text style={styles.disclosureText}>
              Fixed income investments involve interest rate risk, credit risk, and may lose value.
              Past performance is not indicative of future results.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Trade Button */}
        <View style={styles.tradeButtonContainer}>
          <TouchableOpacity
            style={[
              styles.tradeButton,
              isBuy ? styles.buyButton : styles.sellButton,
              (!canTrade || isProcessing) && styles.disabledButton,
            ]}
            onPress={handleTrade}
            disabled={!canTrade || isProcessing}
          >
            <Text style={styles.tradeButtonText}>
              {isProcessing
                ? 'Processing...'
                : `${isBuy ? 'Buy' : 'Sell'} ${instrument.symbol}`}
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
    backgroundColor: MeruTheme.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    color: MeruTheme.colors.accent.primary,
    fontWeight: '500',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 20,
    padding: 16,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
  },
  instrumentName: {
    fontSize: 18,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 60,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '600',
    color: MeruTheme.colors.text.tertiary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  quickAmounts: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 179, 71, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 71, 0.3)',
  },
  warningText: {
    fontSize: 13,
    color: '#FFB347',
    textAlign: 'center',
  },
  summarySection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: MeruTheme.colors.border.subtle,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  disclosureCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 12,
  },
  disclosureText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
  tradeButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: MeruTheme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
  },
  tradeButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: MeruTheme.colors.accent.primary,
  },
  sellButton: {
    backgroundColor: MeruTheme.colors.error.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  tradeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
