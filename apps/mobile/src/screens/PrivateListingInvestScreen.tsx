// ============================================================================
// Private Listing Invest Screen - Commitment Flow
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency } from '../theme/meru';
import { useTheme } from '../hooks/useTheme';
import {
  PRIVATE_LISTING_MAP,
  getDealTypeLabel,
  formatValuation,
  getSectorIcon,
  getRiskColor,
} from '../utils/mockPrivateStockData';
import { useFundingStore } from '../store/fundingStore';

type RouteParams = {
  PrivateListingInvest: {
    id: string;
  };
};

export function PrivateListingInvestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'PrivateListingInvest'>>();
  const { id } = route.params;
  const theme = useTheme();

  const { cashBalance } = useFundingStore();

  // Get listing data
  const listing = PRIVATE_LISTING_MAP[id];

  // State
  const [amount, setAmount] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!listing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Listing not found
          </Text>
        </View>
      </View>
    );
  }

  // Calculations
  const numericAmount = parseFloat(amount) || 0;
  const estimatedShares = listing.sharePrice > 0 ? numericAmount / listing.sharePrice : 0;

  // Validation
  const meetsMinimum = numericAmount >= listing.minimumInvestment;
  const meetsMaximum = !listing.maximumInvestment || numericAmount <= listing.maximumInvestment;
  const hasEnoughBalance = numericAmount <= cashBalance;
  const isValidAmount = meetsMinimum && meetsMaximum && hasEnoughBalance;
  const canInvest = isValidAmount && acceptedTerms && acceptedRisk && !isProcessing;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  const handleCommit = async () => {
    if (!canInvest) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsProcessing(true);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);

    navigation.navigate('TransactionSuccess' as never, {
      type: 'private-investment',
      amount: numericAmount,
      asset: listing.name,
      shares: estimatedShares,
      isStartup: false,
    } as never);
  };

  const handleConfirm = () => {
    if (!canInvest) {
      if (!meetsMinimum) {
        Alert.alert('Minimum Not Met', `Minimum investment is ${formatCurrency(listing.minimumInvestment)}`);
        return;
      }
      if (!meetsMaximum) {
        Alert.alert('Maximum Exceeded', `Maximum investment is ${formatCurrency(listing.maximumInvestment!)}`);
        return;
      }
      if (!hasEnoughBalance) {
        Alert.alert('Insufficient Funds', 'You don\'t have enough balance for this investment.');
        return;
      }
      if (!acceptedTerms || !acceptedRisk) {
        Alert.alert('Terms Required', 'Please accept all terms and risk disclosures to continue.');
        return;
      }
      return;
    }

    Alert.alert(
      'Confirm Investment Commitment',
      `You are committing ${formatCurrency(numericAmount)} to ${listing.name}.\n\nEstimated Shares: ${estimatedShares.toFixed(2)}\nLockup: ${listing.lockupPeriod}\n\nThis commitment is binding. Funds will be called when the deal closes.\n\nThis is a demo - no real funds will be transferred.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Commitment', onPress: handleCommit },
      ]
    );
  };

  const quickAmounts = [
    listing.minimumInvestment,
    listing.minimumInvestment * 2,
    listing.minimumInvestment * 5,
  ].filter(a => !listing.maximumInvestment || a <= listing.maximumInvestment);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.text.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Invest</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.tertiary }]}>
            {listing.name}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Deal Card */}
          <Animated.View
            style={[
              styles.dealCard,
              { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
            ]}
          >
            <View style={[styles.dealIcon, { backgroundColor: theme.colors.accent.glow }]}>
              <Text style={styles.dealIconText}>{getSectorIcon(listing.sector)}</Text>
            </View>
            <View style={styles.dealInfo}>
              <Text style={[styles.dealName, { color: theme.colors.text.primary }]}>{listing.name}</Text>
              <Text style={[styles.dealType, { color: theme.colors.text.tertiary }]}>
                {getDealTypeLabel(listing.dealType)} · {listing.targetCompany}
              </Text>
            </View>
            <View style={styles.dealPrice}>
              <Text style={[styles.priceLabel, { color: theme.colors.text.tertiary }]}>Share Price</Text>
              <Text style={[styles.priceValue, { color: theme.colors.text.primary }]}>
                ${listing.sharePrice.toFixed(2)}
              </Text>
            </View>
          </Animated.View>

          {/* Amount Input */}
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Investment Amount</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background.secondary, borderColor: amount ? theme.colors.accent.primary : theme.colors.border.subtle }]}>
              <Text style={[styles.dollarSign, { color: theme.colors.text.tertiary }]}>$</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="number-pad"
                autoFocus
              />
            </View>
            <View style={styles.amountHints}>
              <Text style={[styles.hintText, { color: theme.colors.text.tertiary }]}>
                Min: {formatCurrency(listing.minimumInvestment)}
              </Text>
              {listing.maximumInvestment && (
                <Text style={[styles.hintText, { color: theme.colors.text.tertiary }]}>
                  Max: {formatCurrency(listing.maximumInvestment)}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Quick Amounts */}
          <Animated.View style={[styles.quickAmounts, { opacity: fadeAnim }]}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
                  numericAmount === quickAmount && { borderColor: theme.colors.accent.primary, backgroundColor: theme.colors.accent.glow },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAmount(quickAmount.toString());
                }}
              >
                <Text style={[
                  styles.quickAmountText,
                  { color: theme.colors.text.secondary },
                  numericAmount === quickAmount && { color: theme.colors.accent.primary },
                ]}>
                  {formatCurrency(quickAmount)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Summary */}
          {numericAmount > 0 && (
            <Animated.View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Estimated Shares</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                  {estimatedShares.toFixed(2)} shares
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Price per Share</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                  ${listing.sharePrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Lockup Period</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.accent.primary }]}>
                  {listing.lockupPeriod}
                </Text>
              </View>
              {listing.carriedInterest && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Carry / Mgmt Fee</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                    {listing.carriedInterest}% / {listing.managementFee}%
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Balance */}
          <Animated.View
            style={[
              styles.balanceCard,
              { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
            ]}
          >
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>Available Balance</Text>
              <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>
                {formatCurrency(cashBalance)}
              </Text>
            </View>
            {numericAmount > 0 && (
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>After Commitment</Text>
                <Text style={[styles.balanceValue, { color: hasEnoughBalance ? theme.colors.success.primary : theme.colors.error.primary }]}>
                  {formatCurrency(cashBalance - numericAmount)}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Terms Checkboxes */}
          <Animated.View style={[styles.termsSection, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAcceptedTerms(!acceptedTerms);
              }}
            >
              <View style={[
                styles.checkbox,
                { backgroundColor: theme.colors.background.secondary, borderColor: acceptedTerms ? theme.colors.accent.primary : theme.colors.border.subtle },
                acceptedTerms && { backgroundColor: theme.colors.accent.primary },
              ]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkboxText, { color: theme.colors.text.secondary }]}>
                I have read and agree to the investment terms, subscription documents, and fee schedule.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAcceptedRisk(!acceptedRisk);
              }}
            >
              <View style={[
                styles.checkbox,
                { backgroundColor: theme.colors.background.secondary, borderColor: acceptedRisk ? theme.colors.accent.primary : theme.colors.border.subtle },
                acceptedRisk && { backgroundColor: theme.colors.accent.primary },
              ]}>
                {acceptedRisk && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.checkboxText, { color: theme.colors.text.secondary }]}>
                I understand this is a{' '}
                <Text style={{ color: getRiskColor(listing.riskLevel), fontWeight: '600' }}>
                  {listing.riskLevel.toLowerCase()} risk
                </Text>
                {' '}investment and I may lose my entire investment.
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Demo Notice */}
          <View style={[styles.demoNotice, { backgroundColor: theme.colors.accent.glow }]}>
            <Text style={[styles.demoText, { color: theme.colors.accent.primary }]}>
              Demo Mode - No real funds will be transferred
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background.primary }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.accent.primary },
              !canInvest && { opacity: 0.5 },
            ]}
            onPress={handleConfirm}
            disabled={isProcessing}
          >
            <Text style={[styles.submitButtonText, { color: theme.colors.background.primary }]}>
              {isProcessing
                ? 'Processing...'
                : isValidAmount
                  ? `Commit ${formatCurrency(numericAmount)}`
                  : `Min ${formatCurrency(listing.minimumInvestment)}`
              }
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dealIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dealIconText: {
    fontSize: 24,
  },
  dealInfo: {
    flex: 1,
  },
  dealName: {
    fontSize: 16,
    fontWeight: '600',
  },
  dealType: {
    fontSize: 12,
    marginTop: 2,
  },
  dealPrice: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  dollarSign: {
    fontSize: 32,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
  },
  amountHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  termsSection: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  demoNotice: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
