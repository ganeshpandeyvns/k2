// ============================================================================
// Swap Screen - Token Exchange
// ============================================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme } from '../../theme/meru';
import { useWalletStore } from '../../store/walletStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { cryptoAssets, formatCurrency, formatCrypto, getExchangeRate, calculateSwapOutput } from '../../utils/mockData';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const slippageOptions = [0.5, 1, 2];

export const SwapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { simulateSwap } = useWalletStore();
  const { executeSwap, getHolding, holdings } = usePortfolioStore();

  const [fromAsset, setFromAsset] = useState('ETH');
  const [toAsset, setToAsset] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  const numericFromAmount = parseFloat(fromAmount) || 0;
  const fromAssetInfo = cryptoAssets.find((a) => a.symbol === fromAsset) || cryptoAssets[0];
  const toAssetInfo = cryptoAssets.find((a) => a.symbol === toAsset) || cryptoAssets[1];

  // Get user's balance for the 'from' asset
  const fromHolding = getHolding(fromAsset);
  const fromBalance = fromHolding?.quantity || 0;

  const { toAmount, rate, priceImpact } = calculateSwapOutput(fromAsset, toAsset, numericFromAmount, slippage);
  const fromUSD = numericFromAmount * getExchangeRate(fromAsset, 'USD');

  const hasEnoughBalance = numericFromAmount <= fromBalance;
  const canSwap = numericFromAmount > 0 && hasEnoughBalance;

  const handleSwapDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate rotation
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });

    // Swap assets
    const tempAsset = fromAsset;
    setFromAsset(toAsset);
    setToAsset(tempAsset);
    setFromAmount('');
  };

  const executeSwapTransaction = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSwapping(true);

    try {
      // Record in wallet history
      await simulateSwap(fromAsset, toAsset, numericFromAmount, toAmount, rate, slippage);

      // Actually update holdings in portfolio
      executeSwap(fromAsset, numericFromAmount, toAsset, toAmount, toAssetInfo.name, toAssetInfo.color);

      setSwapSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsSwapping(false);
    }
  };

  const handleSwap = async () => {
    if (!canSwap) return;

    // Check if user has enough balance
    const fromHolding = getHolding(fromAsset);
    if (!fromHolding || fromHolding.quantity < numericFromAmount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Insufficient Balance', `You don't have enough ${fromAsset} for this swap.`);
      return;
    }

    // Confirm large swaps (over $1000)
    if (fromUSD > 1000) {
      Alert.alert(
        'Confirm Large Swap',
        `You are about to swap ${numericFromAmount.toFixed(6)} ${fromAsset} (~$${fromUSD.toFixed(2)}) for ${toAmount.toFixed(6)} ${toAsset}.\n\nAre you sure you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'destructive', onPress: executeSwapTransaction },
        ]
      );
      return;
    }

    executeSwapTransaction();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  if (swapSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Swap Complete!</Text>
          <Text style={styles.successDetail}>
            {formatCrypto(numericFromAmount, fromAsset)} → {formatCrypto(toAmount, toAsset)}
          </Text>
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
        <Text style={styles.headerTitle}>Swap</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* From Section */}
        <View style={styles.swapCard}>
          <Text style={styles.swapLabel}>From</Text>

          <TouchableOpacity
            style={styles.assetRow}
            onPress={() => setShowFromPicker(!showFromPicker)}
            activeOpacity={0.7}
          >
            <View style={[styles.assetIcon, { backgroundColor: fromAssetInfo.color }]}>
              <Text style={styles.assetIconText}>{fromAsset.charAt(0)}</Text>
            </View>
            <Text style={styles.assetSymbol}>{fromAsset}</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>

          {showFromPicker && (
            <View style={styles.assetPicker}>
              {cryptoAssets.slice(0, 6).filter(a => a.symbol !== toAsset).map((asset) => (
                <TouchableOpacity
                  key={asset.symbol}
                  style={styles.assetPickerItem}
                  onPress={() => {
                    setFromAsset(asset.symbol);
                    setShowFromPicker(false);
                  }}
                >
                  <View style={[styles.assetPickerIcon, { backgroundColor: asset.color }]}>
                    <Text style={styles.assetPickerIconText}>{asset.symbol.charAt(0)}</Text>
                  </View>
                  <Text style={styles.assetPickerText}>{asset.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={MeruTheme.colors.text.tertiary}
            value={fromAmount}
            onChangeText={(text) => {
              // Sanitize input - only allow numbers and one decimal point
              const sanitized = text.replace(/[^0-9.]/g, '');
              const parts = sanitized.split('.');
              if (parts.length > 2) return; // Multiple decimals
              if (parts[1]?.length > 8) return; // Max 8 decimal places for crypto
              setFromAmount(sanitized);
            }}
            keyboardType="decimal-pad"
          />

          {numericFromAmount > 0 && (
            <Text style={styles.amountUSD}>≈ {formatCurrency(fromUSD)}</Text>
          )}

          <View style={styles.balanceRow}>
            <Text style={styles.balanceText}>
              Balance: {formatCrypto(fromBalance, fromAsset)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFromAmount(fromBalance.toString());
              }}
            >
              <Text style={styles.maxButton}>MAX</Text>
            </TouchableOpacity>
          </View>
          {numericFromAmount > 0 && !hasEnoughBalance && (
            <Text style={styles.insufficientText}>Insufficient balance</Text>
          )}
        </View>

        {/* Swap Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity
            style={styles.swapDirectionButton}
            onPress={handleSwapDirection}
            activeOpacity={0.7}
          >
            <Animated.Text
              style={[
                styles.swapDirectionIcon,
                { transform: [{ rotate: rotateInterpolate }] },
              ]}
            >
              ⇅
            </Animated.Text>
          </TouchableOpacity>
        </View>

        {/* To Section */}
        <View style={styles.swapCard}>
          <Text style={styles.swapLabel}>To</Text>

          <TouchableOpacity
            style={styles.assetRow}
            onPress={() => setShowToPicker(!showToPicker)}
            activeOpacity={0.7}
          >
            <View style={[styles.assetIcon, { backgroundColor: toAssetInfo.color }]}>
              <Text style={styles.assetIconText}>{toAsset.charAt(0)}</Text>
            </View>
            <Text style={styles.assetSymbol}>{toAsset}</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>

          {showToPicker && (
            <View style={styles.assetPicker}>
              {cryptoAssets.slice(0, 6).filter(a => a.symbol !== fromAsset).map((asset) => (
                <TouchableOpacity
                  key={asset.symbol}
                  style={styles.assetPickerItem}
                  onPress={() => {
                    setToAsset(asset.symbol);
                    setShowToPicker(false);
                  }}
                >
                  <View style={[styles.assetPickerIcon, { backgroundColor: asset.color }]}>
                    <Text style={styles.assetPickerIconText}>{asset.symbol.charAt(0)}</Text>
                  </View>
                  <Text style={styles.assetPickerText}>{asset.symbol}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.toAmount}>
            {numericFromAmount > 0 ? toAmount.toFixed(6) : '0.00'}
          </Text>
        </View>

        {/* Rate Display */}
        {numericFromAmount > 0 && (
          <View style={styles.rateCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Rate</Text>
              <Text style={styles.rateValue}>
                1 {fromAsset} = {rate.toFixed(4)} {toAsset}
              </Text>
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Price Impact</Text>
              <Text style={[styles.rateValue, priceImpact > 1 && styles.rateWarning]}>
                {priceImpact.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}

        {/* Slippage Selector */}
        <View style={styles.slippageContainer}>
          <Text style={styles.slippageLabel}>Slippage Tolerance</Text>
          <View style={styles.slippageOptions}>
            {slippageOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.slippageOption,
                  slippage === option && styles.slippageOptionActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSlippage(option);
                }}
              >
                <Text
                  style={[
                    styles.slippageOptionText,
                    slippage === option && styles.slippageOptionTextActive,
                  ]}
                >
                  {option}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            Demo Mode — No real swaps will be executed
          </Text>
        </View>
      </ScrollView>

      {/* Swap Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.swapButton,
            (!canSwap || isSwapping) && styles.swapButtonDisabled,
          ]}
          onPress={handleSwap}
          disabled={!canSwap || isSwapping}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              canSwap && !isSwapping
                ? [MeruTheme.colors.accent.primary, MeruTheme.colors.accent.secondary]
                : ['#3a3a3a', '#2a2a2a']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.swapButtonGradient}
          >
            {isSwapping ? (
              <ActivityIndicator color={MeruTheme.colors.background.primary} />
            ) : (
              <Text style={styles.swapButtonText}>
                {canSwap ? `Swap ${fromAsset} for ${toAsset}` : 'Enter Amount'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    paddingBottom: 24,
  },
  swapCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 20,
    padding: 20,
  },
  swapLabel: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 12,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    marginLeft: 10,
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
  },
  assetPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  assetPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  assetPickerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetPickerIconText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  assetPickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  amountUSD: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 4,
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
  toAmount: {
    fontSize: 32,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: -16,
    zIndex: 10,
  },
  swapDirectionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MeruTheme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  swapDirectionIcon: {
    fontSize: 24,
    color: MeruTheme.colors.background.primary,
    fontWeight: '700',
  },
  rateCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rateLabel: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
  },
  rateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
  },
  rateWarning: {
    color: '#fbbf24',
  },
  slippageContainer: {
    marginTop: 20,
  },
  slippageLabel: {
    fontSize: 13,
    color: MeruTheme.colors.text.secondary,
    marginBottom: 12,
  },
  slippageOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  slippageOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  slippageOptionActive: {
    borderColor: MeruTheme.colors.accent.primary,
    backgroundColor: 'rgba(240, 180, 41, 0.1)',
  },
  slippageOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  slippageOptionTextActive: {
    color: MeruTheme.colors.accent.primary,
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
  swapButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  swapButtonDisabled: {
    shadowOpacity: 0,
  },
  swapButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: MeruTheme.colors.background.primary,
  },
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
  successDetail: {
    fontSize: 18,
    color: MeruTheme.colors.accent.primary,
  },
});
