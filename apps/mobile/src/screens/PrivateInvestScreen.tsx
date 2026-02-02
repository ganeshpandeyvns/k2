// ============================================================================
// Private Invest Screen - Investment Flow for Pre-IPO & Startups
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency } from '../theme/meru';
import { useTheme } from '../hooks/useTheme';
import { useFundingStore } from '../store/fundingStore';
import {
  PRIVATE_STOCK_MAP,
  formatValuation,
  getRiskColor,
  getSectorIcon,
} from '../utils/mockPrivateStockData';
import {
  usePrivateOrderBookStore,
  OrderSide,
  getBestBidAsk,
} from '../store/privateOrderBookStore';

type OrderType = 'market' | 'limit';

type RouteParams = {
  PrivateInvest: {
    symbol: string;
    orderType?: OrderType;
    side?: OrderSide;
    suggestedPrice?: number;
  };
};

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

export function PrivateInvestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'PrivateInvest'>>();
  const { symbol, orderType: initialOrderType, side: initialSide, suggestedPrice } = route.params;
  const theme = useTheme();
  const { cashBalance } = useFundingStore();
  const { placeOrder } = usePrivateOrderBookStore();

  // Get private stock data
  const stock = PRIVATE_STOCK_MAP[symbol];
  const isStartup = stock?.category === 'startup';

  // State
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState(suggestedPrice?.toString() || '');
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType || 'market');
  const [orderSide, setOrderSide] = useState<OrderSide>(initialSide || 'bid');
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Get best bid/ask for the stock
  const { bestBid, bestAsk } = !isStartup ? getBestBidAsk(symbol) : { bestBid: 0, bestAsk: 0 };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!stock) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Private stock not found
          </Text>
        </View>
      </View>
    );
  }

  // Calculations based on order type
  const numericAmount = parseFloat(amount) || 0;
  const numericQuantity = parseFloat(quantity) || 0;
  const numericLimitPrice = parseFloat(limitPrice) || 0;

  // For limit orders: calculate total from quantity * price
  // For market orders: calculate shares from amount / price
  const isLimitOrder = orderType === 'limit' && !isStartup;
  const estimatedShares = isLimitOrder ? numericQuantity : numericAmount / stock.sharePrice;
  const orderTotal = isLimitOrder ? numericQuantity * numericLimitPrice : numericAmount;

  // Validation
  const isValidAmount = isLimitOrder
    ? numericQuantity > 0 && numericLimitPrice > 0 && orderTotal >= stock.minimumInvestment
    : numericAmount >= stock.minimumInvestment;
  const hasEnoughBalance = orderSide === 'bid' ? orderTotal <= cashBalance : true; // Asks don't need balance (selling)
  const canInvest = isValidAmount && hasEnoughBalance && acceptedTerms && !isProcessing;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setAmount(cleaned);
  };

  const handleQuantityChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setQuantity(cleaned);
  };

  const handlePriceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setLimitPrice(cleaned);
  };

  const handleQuickAmount = (quickAmount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(quickAmount.toString());
  };

  const handleInvest = async () => {
    if (!canInvest) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    if (isLimitOrder) {
      // Place limit order in order book
      const order = placeOrder(symbol, orderSide, numericLimitPrice, numericQuantity);
      setIsProcessing(false);

      Alert.alert(
        'Order Placed',
        `Your ${orderSide === 'bid' ? 'buy' : 'sell'} order for ${numericQuantity} shares at $${numericLimitPrice.toFixed(2)} has been placed.\n\nOrder ID: ${order.id}\n\nYour order will be matched when a counterparty is found. Settlement is manual and may take 1-5 business days.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      // Market order (direct investment)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);

      navigation.navigate('TransactionSuccess' as never, {
        type: 'private-investment',
        amount: numericAmount,
        asset: stock.name,
        shares: estimatedShares,
        isStartup,
      } as never);
    }
  };

  const handleConfirmInvest = () => {
    if (!canInvest) {
      if (!acceptedTerms) {
        Alert.alert('Terms Required', 'Please accept the investment terms to continue.');
        return;
      }
      if (!isValidAmount) {
        if (isLimitOrder) {
          Alert.alert('Invalid Order', `Please enter quantity and price. Total must be at least $${stock.minimumInvestment.toLocaleString()}`);
        } else {
          Alert.alert('Invalid Amount', `Minimum investment is $${stock.minimumInvestment.toLocaleString()}`);
        }
        return;
      }
      if (!hasEnoughBalance) {
        Alert.alert('Insufficient Funds', 'You don\'t have enough balance for this investment.');
        return;
      }
      return;
    }

    if (isLimitOrder) {
      Alert.alert(
        `Confirm ${orderSide === 'bid' ? 'Buy' : 'Sell'} Order`,
        `You are placing a ${orderSide === 'bid' ? 'buy' : 'sell'} order for ${stock.name}.\n\nQuantity: ${numericQuantity} shares\nLimit Price: $${numericLimitPrice.toFixed(2)}\nTotal: ${formatCurrency(orderTotal)}\n\nYour order will be matched when a counterparty at your price is found. Settlement typically takes 1-5 business days.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Place ${orderSide === 'bid' ? 'Buy' : 'Sell'} Order`, style: 'default', onPress: handleInvest },
        ]
      );
    } else {
      Alert.alert(
        'Confirm Investment',
        `You are about to invest ${formatCurrency(numericAmount)} in ${stock.name}.\n\nEstimated Shares: ${estimatedShares.toFixed(2)}\nLockup Period: ${stock.lockupPeriod || 'None'}\n\nThis is a demo investment and no real money will be transferred.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm Investment', style: 'default', onPress: handleInvest },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.background.secondary, theme.colors.background.primary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.text.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {isStartup ? 'Invest in Round' : 'Buy Shares'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.tertiary }]}>
            {stock.name}
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
          {/* Asset Card */}
          <Animated.View
            style={[
              styles.assetCard,
              { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={[styles.assetIcon, { backgroundColor: theme.colors.accent.glow }]}>
              <Text style={styles.assetIconText}>{getSectorIcon(stock.sector)}</Text>
            </View>
            <View style={styles.assetInfo}>
              <Text style={[styles.assetName, { color: theme.colors.text.primary }]}>{stock.name}</Text>
              <Text style={[styles.assetMeta, { color: theme.colors.text.tertiary }]}>
                {stock.fundingStage} · {formatValuation(stock.latestValuation)} valuation
              </Text>
            </View>
            <View style={styles.assetPrice}>
              <Text style={[styles.priceLabel, { color: theme.colors.text.tertiary }]}>Share Price</Text>
              <Text style={[styles.priceValue, { color: theme.colors.text.primary }]}>
                ${stock.sharePrice.toFixed(2)}
              </Text>
            </View>
          </Animated.View>

          {/* Order Type Toggle (Pre-IPO only) */}
          {!isStartup && (
            <Animated.View
              style={[
                styles.orderTypeSection,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Order Type</Text>
              <View style={[styles.toggleContainer, { backgroundColor: theme.colors.background.secondary }]}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    orderType === 'limit' && { backgroundColor: theme.colors.accent.primary },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOrderType('limit');
                  }}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: orderType === 'limit' ? theme.colors.background.primary : theme.colors.text.secondary },
                  ]}>
                    Limit Order
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    orderType === 'market' && { backgroundColor: theme.colors.accent.primary },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOrderType('market');
                  }}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: orderType === 'market' ? theme.colors.background.primary : theme.colors.text.secondary },
                  ]}>
                    Direct Purchase
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Bid/Ask Side Toggle (Limit Orders only) */}
          {isLimitOrder && (
            <Animated.View
              style={[
                styles.orderTypeSection,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Order Side</Text>
              <View style={[styles.toggleContainer, { backgroundColor: theme.colors.background.secondary }]}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    orderSide === 'bid' && { backgroundColor: theme.colors.success.primary },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOrderSide('bid');
                  }}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: orderSide === 'bid' ? theme.colors.background.primary : theme.colors.text.secondary },
                  ]}>
                    Buy (Bid)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    orderSide === 'ask' && { backgroundColor: theme.colors.error.primary },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOrderSide('ask');
                  }}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: orderSide === 'ask' ? theme.colors.background.primary : theme.colors.text.secondary },
                  ]}>
                    Sell (Ask)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Best Bid/Ask Reference */}
              <View style={[styles.bidAskReference, { backgroundColor: theme.colors.background.tertiary }]}>
                <View style={styles.bidAskItem}>
                  <Text style={[styles.bidAskLabel, { color: theme.colors.success.primary }]}>Best Bid</Text>
                  <Text style={[styles.bidAskValue, { color: theme.colors.text.primary }]}>
                    {bestBid > 0 ? `$${bestBid.toFixed(2)}` : 'No bids'}
                  </Text>
                </View>
                <View style={[styles.bidAskDivider, { backgroundColor: theme.colors.border.subtle }]} />
                <View style={styles.bidAskItem}>
                  <Text style={[styles.bidAskLabel, { color: theme.colors.error.primary }]}>Best Ask</Text>
                  <Text style={[styles.bidAskValue, { color: theme.colors.text.primary }]}>
                    {bestAsk > 0 ? `$${bestAsk.toFixed(2)}` : 'No asks'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Limit Order Inputs (Quantity + Price) */}
          {isLimitOrder ? (
            <Animated.View
              style={[
                styles.limitOrderInputs,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Quantity Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Quantity (Shares)</Text>
                <View style={[styles.limitInputWrapper, { backgroundColor: theme.colors.background.secondary, borderColor: quantity ? theme.colors.accent.primary : theme.colors.border.subtle }]}>
                  <TextInput
                    style={[styles.limitInput, { color: theme.colors.text.primary }]}
                    value={quantity}
                    onChangeText={handleQuantityChange}
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.muted}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                  <Text style={[styles.inputSuffix, { color: theme.colors.text.tertiary }]}>shares</Text>
                </View>
              </View>

              {/* Price Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Limit Price</Text>
                <View style={[styles.limitInputWrapper, { backgroundColor: theme.colors.background.secondary, borderColor: limitPrice ? theme.colors.accent.primary : theme.colors.border.subtle }]}>
                  <Text style={[styles.dollarSign, { color: theme.colors.text.tertiary }]}>$</Text>
                  <TextInput
                    style={[styles.limitInput, { color: theme.colors.text.primary }]}
                    value={limitPrice}
                    onChangeText={handlePriceChange}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.text.muted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={[styles.inputSuffix, { color: theme.colors.text.tertiary }]}>per share</Text>
                </View>
                <View style={styles.priceHints}>
                  <TouchableOpacity
                    style={[styles.priceHintButton, { backgroundColor: theme.colors.background.tertiary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (bestBid > 0) setLimitPrice(bestBid.toFixed(2));
                    }}
                  >
                    <Text style={[styles.priceHintText, { color: theme.colors.success.primary }]}>Bid ${bestBid.toFixed(2)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priceHintButton, { backgroundColor: theme.colors.background.tertiary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLimitPrice(stock.sharePrice.toFixed(2));
                    }}
                  >
                    <Text style={[styles.priceHintText, { color: theme.colors.text.secondary }]}>Market ${stock.sharePrice.toFixed(2)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.priceHintButton, { backgroundColor: theme.colors.background.tertiary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (bestAsk > 0) setLimitPrice(bestAsk.toFixed(2));
                    }}
                  >
                    <Text style={[styles.priceHintText, { color: theme.colors.error.primary }]}>Ask ${bestAsk.toFixed(2)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Order Total */}
              {numericQuantity > 0 && numericLimitPrice > 0 && (
                <View style={[styles.orderTotalCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
                  <Text style={[styles.orderTotalLabel, { color: theme.colors.text.tertiary }]}>Order Total</Text>
                  <Text style={[styles.orderTotalValue, { color: theme.colors.accent.primary }]}>
                    {formatCurrency(orderTotal)}
                  </Text>
                  <Text style={[styles.orderTotalMeta, { color: theme.colors.text.muted }]}>
                    {numericQuantity} shares × ${numericLimitPrice.toFixed(2)}
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <>
              {/* Amount Input (Market Orders / Startups) */}
              <Animated.View
                style={[
                  styles.amountSection,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Investment Amount</Text>
                <View style={[styles.amountInputWrapper, { backgroundColor: theme.colors.background.secondary, borderColor: amount ? theme.colors.accent.primary : theme.colors.border.subtle }]}>
                  <Text style={[styles.dollarSign, { color: theme.colors.text.tertiary }]}>$</Text>
                  <TextInput
                    style={[styles.amountInput, { color: theme.colors.text.primary }]}
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.text.muted}
                    keyboardType="decimal-pad"
                    autoFocus
                  />
                </View>
                <Text style={[styles.minLabel, { color: theme.colors.text.tertiary }]}>
                  Minimum: ${stock.minimumInvestment.toLocaleString()}
                </Text>
              </Animated.View>

              {/* Quick Amounts */}
              <Animated.View
                style={[
                  styles.quickAmounts,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                {QUICK_AMOUNTS.filter(a => a >= stock.minimumInvestment).map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
                      numericAmount === quickAmount && { borderColor: theme.colors.accent.primary, backgroundColor: theme.colors.accent.glow },
                    ]}
                    onPress={() => handleQuickAmount(quickAmount)}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      { color: theme.colors.text.secondary },
                      numericAmount === quickAmount && { color: theme.colors.accent.primary },
                    ]}>
                      ${quickAmount >= 1000 ? `${quickAmount / 1000}K` : quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </>
          )}

          {/* Estimated Shares (Market orders only) */}
          {!isLimitOrder && numericAmount > 0 && (
            <Animated.View
              style={[
                styles.estimateCard,
                { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
                { opacity: fadeAnim },
              ]}
            >
              <View style={styles.estimateRow}>
                <Text style={[styles.estimateLabel, { color: theme.colors.text.tertiary }]}>Estimated Shares</Text>
                <Text style={[styles.estimateValue, { color: theme.colors.text.primary }]}>
                  {estimatedShares.toFixed(4)} shares
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={[styles.estimateLabel, { color: theme.colors.text.tertiary }]}>Price per Share</Text>
                <Text style={[styles.estimateValue, { color: theme.colors.text.primary }]}>
                  ${stock.sharePrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.estimateRow}>
                <Text style={[styles.estimateLabel, { color: theme.colors.text.tertiary }]}>Lockup Period</Text>
                <Text style={[styles.estimateValue, { color: theme.colors.accent.primary }]}>
                  {stock.lockupPeriod || 'None'}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Balance Info */}
          {(orderSide === 'bid' || !isLimitOrder) && (
            <Animated.View
              style={[
                styles.balanceCard,
                { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>Available Balance</Text>
                <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>
                  {formatCurrency(cashBalance)}
                </Text>
              </View>
              {(isLimitOrder ? orderTotal > 0 : numericAmount > 0) && (
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>After {isLimitOrder ? 'Order' : 'Investment'}</Text>
                  <Text style={[
                    styles.balanceValue,
                    { color: hasEnoughBalance ? theme.colors.success.primary : theme.colors.error.primary }
                  ]}>
                    {formatCurrency(cashBalance - orderTotal)}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Sell Order Notice */}
          {isLimitOrder && orderSide === 'ask' && (
            <Animated.View
              style={[
                styles.sellNotice,
                { backgroundColor: theme.colors.error.primary + '15', borderColor: theme.colors.error.primary },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={[styles.sellNoticeTitle, { color: theme.colors.error.primary }]}>
                📤 Selling Shares
              </Text>
              <Text style={[styles.sellNoticeText, { color: theme.colors.text.secondary }]}>
                You're placing an ask order. When matched, you'll receive {formatCurrency(orderTotal)} for your {numericQuantity || 0} shares.
              </Text>
            </Animated.View>
          )}

          {/* Terms Checkbox */}
          <Animated.View
            style={[
              styles.termsSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.termsRow}
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
              <Text style={[styles.termsText, { color: theme.colors.text.secondary }]}>
                I understand this is a{' '}
                <Text style={{ color: theme.colors.error.primary }}>{stock.riskLevel.toLowerCase()} risk</Text>
                {' '}investment with a{' '}
                <Text style={{ color: theme.colors.accent.primary }}>{stock.lockupPeriod?.toLowerCase() || 'no'}</Text>
                {' '}lockup period. I acknowledge that I may lose my entire investment.
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Risk Warning */}
          <Animated.View
            style={[
              styles.warningCard,
              { backgroundColor: getRiskColor(stock.riskLevel) + '15', borderColor: getRiskColor(stock.riskLevel) },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.warningTitle, { color: getRiskColor(stock.riskLevel) }]}>
              ⚠️ {stock.riskLevel} Risk Investment
            </Text>
            <Text style={[styles.warningText, { color: theme.colors.text.secondary }]}>
              Private investments are illiquid and highly speculative. Only invest money you can afford to lose entirely.
            </Text>
          </Animated.View>

          {/* Demo Notice */}
          <View style={[styles.demoNotice, { backgroundColor: theme.colors.accent.glow }]}>
            <Text style={[styles.demoText, { color: theme.colors.accent.primary }]}>
              Demo Mode - No real money will be transferred
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.subtle }]}>
          <TouchableOpacity
            style={[
              styles.investButton,
              { backgroundColor: isLimitOrder
                  ? (orderSide === 'bid' ? theme.colors.success.primary : theme.colors.error.primary)
                  : theme.colors.accent.primary
              },
              !canInvest && { opacity: 0.5 },
            ]}
            onPress={handleConfirmInvest}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={[styles.investButtonText, { color: theme.colors.background.primary }]}>
                {isLimitOrder ? 'Placing Order...' : 'Processing...'}
              </Text>
            ) : (
              <Text style={[styles.investButtonText, { color: theme.colors.background.primary }]}>
                {isLimitOrder
                  ? (isValidAmount
                      ? `${orderSide === 'bid' ? 'Buy' : 'Sell'} ${numericQuantity} @ $${numericLimitPrice.toFixed(2)}`
                      : `Enter Quantity & Price`)
                  : (isValidAmount
                      ? `Invest ${formatCurrency(numericAmount)}`
                      : `Min ${formatCurrency(stock.minimumInvestment)}`)
                }
              </Text>
            )}
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
    padding: 20,
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
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assetIconText: {
    fontSize: 24,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  assetMeta: {
    fontSize: 12,
  },
  assetPrice: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: '300',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
  },
  minLabel: {
    fontSize: 11,
    marginTop: 8,
    marginLeft: 4,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  estimateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  estimateLabel: {
    fontSize: 14,
  },
  estimateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
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
    borderTopWidth: 1,
  },
  investButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  investButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Order Type Toggle Styles
  orderTypeSection: {
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Bid/Ask Reference
  bidAskReference: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
  },
  bidAskItem: {
    flex: 1,
    alignItems: 'center',
  },
  bidAskDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  bidAskLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  bidAskValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Limit Order Inputs
  limitOrderInputs: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  limitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  limitInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  inputSuffix: {
    fontSize: 14,
    marginLeft: 8,
  },
  priceHints: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  priceHintButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priceHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderTotalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  orderTotalLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  orderTotalValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  orderTotalMeta: {
    fontSize: 12,
  },
  // Sell Notice
  sellNotice: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sellNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sellNoticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
