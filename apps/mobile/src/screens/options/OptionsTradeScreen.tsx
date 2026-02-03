// ============================================================================
// Options Trade Screen - Buy/Sell individual options
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { MeruTheme } from '../../theme/meru';
import { useFundingStore } from '../../store/fundingStore';
import Svg, { Path } from 'react-native-svg';
import {
  getOptionById,
  StockOption,
  calculateBreakeven,
  calculateMaxLoss,
  formatOptionSymbol,
} from '../../utils/mockOptionsData';

type OptionsTradeRouteProp = RouteProp<RootStackParamList, 'OptionsTrade'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Back Arrow Icon
const BackIcon = ({ size = 24, color = MeruTheme.colors.text.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 19l-7-7 7-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Info Icon
const InfoIcon = ({ size = 16, color = MeruTheme.colors.text.tertiary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4M12 8h.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Call/Put Icons
const CallIcon = ({ size = 20, color = MeruTheme.colors.success.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19V5M5 12l7-7 7 7"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PutIcon = ({ size = 20, color = MeruTheme.colors.error.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M19 12l-7 7-7-7"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CONTRACT_SIZE = 100; // Standard options contract size

export function OptionsTradeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OptionsTradeRouteProp>();
  const { optionId } = route.params;

  const [contracts, setContracts] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);

  const cashBalance = useFundingStore((state) => state.cashBalance);
  const updateCashBalance = useFundingStore((state) => state.updateCashBalance);

  // Get option details
  const option = useMemo(() => getOptionById(optionId), [optionId]);

  if (!option) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Option Not Found</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load option details</Text>
        </View>
      </SafeAreaView>
    );
  }

  const numContracts = parseInt(contracts) || 0;
  const totalCost = option.ask * CONTRACT_SIZE * numContracts;
  const maxLoss = calculateMaxLoss(option, numContracts);
  const breakeven = calculateBreakeven(option);

  const hasEnoughBalance = cashBalance >= totalCost;
  const canTrade = numContracts > 0 && hasEnoughBalance && !isProcessing;

  const formatExpirationDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleContractsChange = (value: string) => {
    // Only allow positive integers
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned === '' || parseInt(cleaned) <= 100) {
      setContracts(cleaned);
    }
  };

  const incrementContracts = () => {
    const current = parseInt(contracts) || 0;
    if (current < 100) {
      setContracts(String(current + 1));
    }
  };

  const decrementContracts = () => {
    const current = parseInt(contracts) || 0;
    if (current > 1) {
      setContracts(String(current - 1));
    }
  };

  const handleBuyOption = async () => {
    if (!canTrade) return;

    // Large transaction confirmation
    if (totalCost >= 1000) {
      Alert.alert(
        'Confirm Large Order',
        `You are about to spend $${totalCost.toLocaleString()} on ${numContracts} contract${numContracts > 1 ? 's' : ''}. This is the maximum amount you can lose.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: executeOrder },
        ]
      );
      return;
    }

    executeOrder();
  };

  const executeOrder = async () => {
    setIsProcessing(true);

    try {
      // Simulate order execution
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Deduct balance
      updateCashBalance(-totalCost);

      Alert.alert(
        'Order Confirmed',
        `You purchased ${numContracts} ${formatOptionSymbol(option)} contract${numContracts > 1 ? 's' : ''} for $${totalCost.toFixed(2)}`,
        [
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Order Failed', 'Unable to process your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const typeColor = option.type === 'call'
    ? MeruTheme.colors.success.primary
    : MeruTheme.colors.error.primary;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buy Option</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Option Summary Card */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                {option.type === 'call' ? (
                  <CallIcon color={typeColor} />
                ) : (
                  <PutIcon color={typeColor} />
                )}
                <Text style={[styles.typeText, { color: typeColor }]}>
                  {option.type.toUpperCase()}
                </Text>
              </View>
              <View style={styles.itmBadgeContainer}>
                {option.inTheMoney && (
                  <View style={[styles.itmBadge, { backgroundColor: typeColor + '20' }]}>
                    <Text style={[styles.itmText, { color: typeColor }]}>ITM</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={styles.optionSymbol}>{option.underlyingSymbol}</Text>
            <Text style={styles.optionName}>{option.underlyingName}</Text>

            <View style={styles.optionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Strike Price</Text>
                <Text style={styles.detailValue}>${option.strikePrice.toFixed(2)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expiration</Text>
                <Text style={styles.detailValue}>{formatExpirationDate(option.expirationDate)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Days to Expiry</Text>
                <Text style={styles.detailValue}>{option.daysToExpiry} days</Text>
              </View>
            </View>

            <View style={styles.premiumSection}>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Premium (per share)</Text>
                <Text style={styles.premiumValue}>${option.ask.toFixed(2)}</Text>
              </View>
              <View style={styles.bidAskRow}>
                <Text style={styles.bidAskText}>Bid: ${option.bid.toFixed(2)}</Text>
                <Text style={styles.bidAskText}>Ask: ${option.ask.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Contracts Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Number of Contracts</Text>
            <Text style={styles.inputHint}>Each contract = 100 shares</Text>
            <View style={styles.contractsInput}>
              <TouchableOpacity
                style={styles.contractButton}
                onPress={decrementContracts}
                disabled={numContracts <= 1}
              >
                <Text style={[
                  styles.contractButtonText,
                  numContracts <= 1 && styles.contractButtonDisabled
                ]}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.contractsTextInput}
                value={contracts}
                onChangeText={handleContractsChange}
                keyboardType="number-pad"
                maxLength={3}
              />
              <TouchableOpacity
                style={styles.contractButton}
                onPress={incrementContracts}
                disabled={numContracts >= 100}
              >
                <Text style={[
                  styles.contractButtonText,
                  numContracts >= 100 && styles.contractButtonDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Premium per Contract</Text>
              <Text style={styles.summaryValue}>
                ${(option.ask * CONTRACT_SIZE).toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Contracts</Text>
              <Text style={styles.summaryValue}>x {numContracts}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalValue}>${totalCost.toFixed(2)}</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Break-even</Text>
                <Text style={styles.metricValue}>${breakeven.toFixed(2)}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Max Loss</Text>
                <Text style={[styles.metricValue, { color: MeruTheme.colors.error.primary }]}>
                  ${maxLoss.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Greeks Info */}
          <View style={styles.greeksCard}>
            <View style={styles.greeksHeader}>
              <Text style={styles.greeksTitle}>Option Greeks</Text>
              <InfoIcon />
            </View>
            <View style={styles.greeksGrid}>
              <View style={styles.greekItem}>
                <Text style={styles.greekLabel}>Delta ({'\u0394'})</Text>
                <Text style={styles.greekValue}>{option.delta.toFixed(2)}</Text>
              </View>
              <View style={styles.greekItem}>
                <Text style={styles.greekLabel}>Gamma ({'\u0393'})</Text>
                <Text style={styles.greekValue}>{option.gamma.toFixed(4)}</Text>
              </View>
              <View style={styles.greekItem}>
                <Text style={styles.greekLabel}>Theta ({'\u0398'})</Text>
                <Text style={styles.greekValue}>{option.theta.toFixed(2)}</Text>
              </View>
              <View style={styles.greekItem}>
                <Text style={styles.greekLabel}>IV</Text>
                <Text style={styles.greekValue}>{option.impliedVolatility.toFixed(1)}%</Text>
              </View>
            </View>
          </View>

          {/* Risk Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>Options Risk Disclosure</Text>
            <Text style={styles.disclaimerText}>
              Options trading involves substantial risk of loss and is not suitable for all investors.
              The maximum loss when buying options is the premium paid.
              Options can expire worthless if the stock price doesn't move favorably before expiration.
            </Text>
          </View>

          {/* Balance Info */}
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={[
              styles.balanceValue,
              !hasEnoughBalance && styles.balanceInsufficient
            ]}>
              ${cashBalance.toFixed(2)}
            </Text>
          </View>
        </ScrollView>

        {/* Buy Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.buyButton,
              !canTrade && styles.buyButtonDisabled,
              { backgroundColor: canTrade ? typeColor : MeruTheme.colors.background.tertiary }
            ]}
            onPress={handleBuyOption}
            disabled={!canTrade}
          >
            <Text style={[
              styles.buyButtonText,
              !canTrade && styles.buyButtonTextDisabled
            ]}>
              {isProcessing
                ? 'Processing...'
                : !hasEnoughBalance
                ? 'Insufficient Balance'
                : numContracts === 0
                ? 'Enter Contracts'
                : `Buy ${numContracts} Contract${numContracts > 1 ? 's' : ''} for $${totalCost.toFixed(2)}`
              }
            </Text>
          </TouchableOpacity>
          <Text style={styles.demoModeText}>Demo Mode - No real money</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  optionCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  itmBadgeContainer: {
    minWidth: 40,
  },
  itmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itmText: {
    fontSize: 11,
    fontWeight: '700',
  },
  optionSymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: MeruTheme.colors.text.primary,
    marginBottom: 4,
  },
  optionName: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 16,
  },
  optionDetails: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  premiumSection: {
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 12,
    padding: 16,
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  premiumValue: {
    fontSize: 24,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  bidAskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bidAskText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 12,
  },
  contractsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contractButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MeruTheme.colors.background.tertiary,
  },
  contractButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  contractButtonDisabled: {
    color: MeruTheme.colors.text.tertiary,
  },
  contractsTextInput: {
    flex: 1,
    height: 56,
    fontSize: 24,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: MeruTheme.colors.accent.primary,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  metric: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  greeksCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  greeksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  greeksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  greeksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  greekItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  greekLabel: {
    fontSize: 11,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 4,
  },
  greekValue: {
    fontSize: 14,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
  },
  disclaimerCard: {
    backgroundColor: MeruTheme.colors.accent.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.accent.primary + '30',
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MeruTheme.colors.accent.primary,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: MeruTheme.colors.text.secondary,
    lineHeight: 18,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  balanceInsufficient: {
    color: MeruTheme.colors.error.primary,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  buyButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buyButtonTextDisabled: {
    color: MeruTheme.colors.text.tertiary,
  },
  demoModeText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    textAlign: 'center',
  },
});
