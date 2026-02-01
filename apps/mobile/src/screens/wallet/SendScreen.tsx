// ============================================================================
// Send Screen - Crypto Transfer
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { useWalletStore } from '../../store/walletStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { cryptoAssets, formatCurrency, formatCrypto, isValidAddress, getExchangeRate } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SendScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Send'>>();

  const { simulateSend } = useWalletStore();
  const { executeSend, getHolding } = usePortfolioStore();

  const [selectedAsset, setSelectedAsset] = useState(route.params?.asset || 'ETH');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const assetInfo = cryptoAssets.find((a) => a.symbol === selectedAsset) || cryptoAssets[0];
  const numericAmount = parseFloat(amount) || 0;
  const usdValue = numericAmount * getExchangeRate(selectedAsset, 'USD');
  const networkFee = assetInfo.networkFee;
  const networkFeeUSD = networkFee * getExchangeRate(selectedAsset, 'USD');

  // Get user's balance for the selected asset
  const currentHolding = getHolding(selectedAsset);
  const availableBalance = currentHolding?.quantity || 0;

  // Validate address - check length and basic format per chain
  const validateAddress = (addr: string, asset: string): boolean => {
    if (!addr || addr.length < 10) return false;

    // Basic format validation per chain
    const validations: Record<string, (a: string) => boolean> = {
      BTC: (a) => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(a),
      ETH: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
      SOL: (a) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a),
      USDC: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
      USDT: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
      MATIC: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
      AVAX: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
    };

    const validator = validations[asset];
    // For demo mode, accept addresses > 20 chars if no specific validator
    return validator ? validator(addr) : addr.length > 20;
  };

  const isValidAddr = validateAddress(address, selectedAsset);
  const isValidAmount = numericAmount >= assetInfo.minSend;
  const hasEnoughBalance = numericAmount + networkFee <= availableBalance;
  const canSend = isValidAddr && isValidAmount && hasEnoughBalance;

  const handleReview = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    // Final balance check before sending
    if (!hasEnoughBalance) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSending(true);

    try {
      // Record in wallet history
      await simulateSend(selectedAsset, address, numericAmount, usdValue, networkFee);

      // Actually deduct from portfolio holdings
      const price = getExchangeRate(selectedAsset, 'USD');
      const result = executeSend(selectedAsset, numericAmount + networkFee, address, price);

      if (!result) {
        throw new Error('Insufficient balance');
      }

      setSendSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsSending(false);
    }
  };

  if (sendSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Sent!</Text>
          <Text style={styles.successAmount}>
            {formatCrypto(numericAmount, selectedAsset)}
          </Text>
          <Text style={styles.successSubtitle}>
            Transaction submitted to network
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showConfirmation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowConfirmation(false)}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Send</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.confirmContent}>
          {/* Amount Summary */}
          <View style={styles.confirmAmountContainer}>
            <View style={[styles.assetIcon, { backgroundColor: assetInfo.color }]}>
              <Text style={styles.assetIconText}>{selectedAsset.charAt(0)}</Text>
            </View>
            <Text style={styles.confirmAmount}>
              {formatCrypto(numericAmount, selectedAsset)}
            </Text>
            <Text style={styles.confirmUSD}>{formatCurrency(usdValue)}</Text>
          </View>

          {/* Details Card */}
          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>To</Text>
              <Text style={styles.confirmAddress} numberOfLines={1}>
                {address.slice(0, 8)}...{address.slice(-8)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Network</Text>
              <Text style={styles.confirmValue}>{assetInfo.network}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Network Fee</Text>
              <Text style={styles.confirmValue}>
                ~{formatCrypto(networkFee, selectedAsset)} ({formatCurrency(networkFeeUSD)})
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Total</Text>
              <Text style={styles.confirmTotal}>
                {formatCrypto(numericAmount + networkFee, selectedAsset)}
              </Text>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Please verify the address is correct. Transactions cannot be reversed.
            </Text>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmSend}
            disabled={isSending}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButtonGradient}
            >
              {isSending ? (
                <ActivityIndicator color={MeruTheme.colors.background.primary} />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Confirm & Send
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Send</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Asset Selector */}
          <Text style={styles.sectionLabel}>Asset</Text>
          <TouchableOpacity
            style={styles.assetSelector}
            onPress={() => setShowAssetPicker(!showAssetPicker)}
            activeOpacity={0.7}
          >
            <View style={[styles.assetIcon, { backgroundColor: assetInfo.color }]}>
              <Text style={styles.assetIconText}>{selectedAsset.charAt(0)}</Text>
            </View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>{assetInfo.name}</Text>
              <Text style={styles.assetSymbol}>{selectedAsset}</Text>
            </View>
            <Text style={styles.chevron}>{showAssetPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showAssetPicker && (
            <View style={styles.assetPickerContainer}>
              {cryptoAssets.slice(0, 6).map((asset) => (
                <TouchableOpacity
                  key={asset.symbol}
                  style={[
                    styles.assetOption,
                    selectedAsset === asset.symbol && styles.assetOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedAsset(asset.symbol);
                    setShowAssetPicker(false);
                  }}
                >
                  <View style={[styles.assetOptionIcon, { backgroundColor: asset.color }]}>
                    <Text style={styles.assetOptionIconText}>{asset.symbol.charAt(0)}</Text>
                  </View>
                  <Text style={styles.assetOptionText}>{asset.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recipient Address */}
          <Text style={styles.sectionLabel}>Recipient Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder={`Enter ${selectedAsset} address`}
            placeholderTextColor={MeruTheme.colors.text.tertiary}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={2}
          />

          {/* Amount */}
          <Text style={styles.sectionLabel}>Amount</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={MeruTheme.colors.text.tertiary}
              value={amount}
              onChangeText={(text) => {
                // Sanitize input - only allow numbers and one decimal point
                const sanitized = text.replace(/[^0-9.]/g, '');
                const parts = sanitized.split('.');
                if (parts.length > 2) return; // Multiple decimals
                if (parts[1]?.length > 8) return; // Max 8 decimal places for crypto
                setAmount(sanitized);
              }}
              keyboardType="decimal-pad"
            />
            <Text style={styles.amountSymbol}>{selectedAsset}</Text>
          </View>

          {/* Balance Row */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceText}>
              Balance: {formatCrypto(availableBalance, selectedAsset)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Set max minus network fee
                const maxSend = Math.max(0, availableBalance - networkFee);
                setAmount(maxSend.toString());
              }}
            >
              <Text style={styles.maxButton}>MAX</Text>
            </TouchableOpacity>
          </View>

          {numericAmount > 0 && (
            <Text style={styles.amountUSD}>≈ {formatCurrency(usdValue)}</Text>
          )}

          {/* Insufficient Balance Warning */}
          {numericAmount > 0 && !hasEnoughBalance && (
            <Text style={styles.insufficientText}>
              Insufficient balance (need {formatCrypto(numericAmount + networkFee, selectedAsset)} including fee)
            </Text>
          )}

          {/* Network Fee */}
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Network Fee</Text>
            <Text style={styles.feeValue}>
              ~{formatCrypto(networkFee, selectedAsset)} ({formatCurrency(networkFeeUSD)})
            </Text>
          </View>

          {/* Demo Notice */}
          <View style={styles.demoNotice}>
            <Text style={styles.demoNoticeText}>
              Demo Mode — No real crypto will be sent
            </Text>
          </View>
        </ScrollView>

        {/* Review Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.reviewButton,
              !canSend && styles.reviewButtonDisabled,
            ]}
            onPress={handleReview}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                canSend
                  ? [MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]
                  : ['#3a3a3a', '#2a2a2a']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.reviewButtonGradient}
            >
              <Text style={styles.reviewButtonText}>Review</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 12,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  assetInfo: {
    flex: 1,
    marginLeft: 14,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  assetSymbol: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  chevron: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
  },
  assetPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  assetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  assetOptionActive: {
    borderColor: MeruTheme.colors.accent.primary,
  },
  assetOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetOptionIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  assetOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  addressInput: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: MeruTheme.colors.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  amountSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
    marginLeft: 8,
  },
  amountUSD: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 8,
    textAlign: 'right',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  balanceText: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
  },
  maxButton: {
    fontSize: 13,
    fontWeight: '700',
    color: MeruTheme.colors.accent.primary,
  },
  insufficientText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  feeLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  feeValue: {
    fontSize: 14,
    color: MeruTheme.colors.text.primary,
    fontWeight: '500',
  },
  demoNotice: {
    alignItems: 'center',
    marginTop: 20,
  },
  demoNoticeText: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  reviewButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  reviewButtonDisabled: {
    shadowOpacity: 0,
  },
  reviewButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },

  // Confirmation styles
  confirmContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  confirmAmountContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  confirmAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginTop: 16,
  },
  confirmUSD: {
    fontSize: 18,
    color: MeruTheme.colors.text.secondary,
    marginTop: 4,
  },
  confirmCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 20,
    padding: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  confirmLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  confirmAddress: {
    fontSize: 13,
    fontWeight: '500',
    color: MeruTheme.colors.text.primary,
    maxWidth: 180,
  },
  confirmTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: MeruTheme.colors.accent.primary,
  },
  divider: {
    height: 1,
    backgroundColor: MeruTheme.colors.border.subtle,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#fbbf24',
    lineHeight: 20,
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },

  // Success styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 48,
    color: '#fff',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: MeruTheme.colors.text.secondary,
    textAlign: 'center',
  },
});
