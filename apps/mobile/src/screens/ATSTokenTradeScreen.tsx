// ============================================================================
// ATS Token Trade Screen - Place Buy/Sell Orders
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
  ATS_TOKEN_MAP,
  getATSPlatformIcon,
  getTokenTypeLabel,
} from '../utils/mockPrivateStockData';
import {
  usePrivateOrderBookStore,
  getBestBidAsk,
  OrderSide,
} from '../store/privateOrderBookStore';
import { useFundingStore } from '../store/fundingStore';

type OrderType = 'market' | 'limit';

type RouteParams = {
  ATSTokenTrade: {
    symbol: string;
    side: OrderSide;
    suggestedPrice?: number;
  };
};

export function ATSTokenTradeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ATSTokenTrade'>>();
  const { symbol, side: initialSide, suggestedPrice } = route.params;
  const theme = useTheme();

  const { placeOrder } = usePrivateOrderBookStore();
  const { cashBalance } = useFundingStore();

  // Get token data
  const token = ATS_TOKEN_MAP[symbol];
  const { bestBid, bestAsk } = getBestBidAsk(symbol);

  // State
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [orderSide, setOrderSide] = useState<OrderSide>(initialSide);
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState(suggestedPrice?.toString() || '');
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

  if (!token) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Token not found
          </Text>
        </View>
      </View>
    );
  }

  // Calculations
  const numericQuantity = parseFloat(quantity) || 0;
  const numericLimitPrice = parseFloat(limitPrice) || 0;
  const marketPrice = orderSide === 'bid' ? bestAsk : bestBid;
  const effectivePrice = orderType === 'market' ? marketPrice : numericLimitPrice;
  const orderTotal = numericQuantity * effectivePrice;

  // Validation
  const isValidOrder = numericQuantity > 0 &&
    (orderType === 'market' || numericLimitPrice > 0) &&
    orderTotal >= token.minimumOrder;
  const hasEnoughBalance = orderSide === 'bid' ? orderTotal <= cashBalance : true;
  const canSubmit = isValidOrder && hasEnoughBalance && !isProcessing;

  const handleQuantityChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setQuantity(cleaned);
  };

  const handlePriceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setLimitPrice(cleaned);
  };

  const handleSubmitOrder = async () => {
    if (!canSubmit) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    // Place the order
    const order = placeOrder(symbol, orderSide, effectivePrice, numericQuantity);

    // Simulate brief processing
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsProcessing(false);

    Alert.alert(
      'Order Placed',
      `Your ${orderSide === 'bid' ? 'buy' : 'sell'} order for ${numericQuantity} ${token.symbol} at $${effectivePrice.toFixed(2)} has been submitted.\n\nOrder ID: ${order.id}\n\nSettlement: ${token.settlementTime}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const handleConfirmOrder = () => {
    if (!canSubmit) {
      if (!isValidOrder) {
        Alert.alert('Invalid Order', `Please enter quantity${orderType === 'limit' ? ' and price' : ''}. Minimum order is $${token.minimumOrder}.`);
        return;
      }
      if (!hasEnoughBalance) {
        Alert.alert('Insufficient Funds', 'You don\'t have enough balance for this order.');
        return;
      }
      return;
    }

    Alert.alert(
      `Confirm ${orderSide === 'bid' ? 'Buy' : 'Sell'} Order`,
      `${orderType === 'market' ? 'Market' : 'Limit'} ${orderSide === 'bid' ? 'Buy' : 'Sell'}\n\nToken: ${token.symbol}\nQuantity: ${numericQuantity}\nPrice: $${effectivePrice.toFixed(2)}\nTotal: ${formatCurrency(orderTotal)}\n\nThis is a simulated order.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Place Order', onPress: handleSubmitOrder },
      ]
    );
  };

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
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            {orderSide === 'bid' ? 'Buy' : 'Sell'} {token.symbol}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.tertiary }]}>
            {token.platform} · {getTokenTypeLabel(token.tokenType)}
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
          {/* Token Card */}
          <Animated.View
            style={[
              styles.tokenCard,
              { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
            ]}
          >
            <Text style={styles.tokenIcon}>{getATSPlatformIcon(token.platform)}</Text>
            <View style={styles.tokenInfo}>
              <Text style={[styles.tokenName, { color: theme.colors.text.primary }]}>{token.name}</Text>
              <Text style={[styles.tokenPrice, { color: theme.colors.text.secondary }]}>
                ${token.currentPrice.toFixed(2)}
              </Text>
            </View>
            <View style={styles.bidAskDisplay}>
              <Text style={[styles.bidPrice, { color: theme.colors.success.primary }]}>
                Bid ${bestBid.toFixed(2)}
              </Text>
              <Text style={[styles.askPrice, { color: theme.colors.error.primary }]}>
                Ask ${bestAsk.toFixed(2)}
              </Text>
            </View>
          </Animated.View>

          {/* Order Side Toggle */}
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
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
                  { color: orderSide === 'bid' ? '#FFFFFF' : theme.colors.text.secondary },
                ]}>Buy</Text>
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
                  { color: orderSide === 'ask' ? '#FFFFFF' : theme.colors.text.secondary },
                ]}>Sell</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Order Type Toggle */}
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
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
                ]}>Limit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  orderType === 'market' && { backgroundColor: theme.colors.accent.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOrderType('market');
                  setLimitPrice(marketPrice.toFixed(2));
                }}
              >
                <Text style={[
                  styles.toggleText,
                  { color: orderType === 'market' ? theme.colors.background.primary : theme.colors.text.secondary },
                ]}>Market</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Quantity Input */}
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Quantity (Tokens)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background.secondary, borderColor: quantity ? theme.colors.accent.primary : theme.colors.border.subtle }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text.primary }]}
                value={quantity}
                onChangeText={handleQuantityChange}
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={[styles.inputSuffix, { color: theme.colors.text.tertiary }]}>{token.symbol}</Text>
            </View>
          </Animated.View>

          {/* Limit Price Input */}
          {orderType === 'limit' && (
            <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
              <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>Limit Price</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background.secondary, borderColor: limitPrice ? theme.colors.accent.primary : theme.colors.border.subtle }]}>
                <Text style={[styles.dollarSign, { color: theme.colors.text.tertiary }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text.primary }]}
                  value={limitPrice}
                  onChangeText={handlePriceChange}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.priceHints}>
                <TouchableOpacity
                  style={[styles.priceHint, { backgroundColor: theme.colors.background.tertiary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLimitPrice(bestBid.toFixed(2));
                  }}
                >
                  <Text style={[styles.priceHintText, { color: theme.colors.success.primary }]}>Bid ${bestBid.toFixed(2)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priceHint, { backgroundColor: theme.colors.background.tertiary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLimitPrice(token.currentPrice.toFixed(2));
                  }}
                >
                  <Text style={[styles.priceHintText, { color: theme.colors.text.secondary }]}>Mid ${token.currentPrice.toFixed(2)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.priceHint, { backgroundColor: theme.colors.background.tertiary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLimitPrice(bestAsk.toFixed(2));
                  }}
                >
                  <Text style={[styles.priceHintText, { color: theme.colors.error.primary }]}>Ask ${bestAsk.toFixed(2)}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Order Summary */}
          {numericQuantity > 0 && effectivePrice > 0 && (
            <Animated.View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: theme.colors.text.primary }]}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Quantity</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>{numericQuantity} {token.symbol}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Price</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>${effectivePrice.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.primary, fontWeight: '600' }]}>Total</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.accent.primary, fontSize: 20 }]}>
                  {formatCurrency(orderTotal)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Settlement</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.success.primary }]}>{token.settlementTime}</Text>
              </View>
            </Animated.View>
          )}

          {/* Balance */}
          {orderSide === 'bid' && (
            <Animated.View
              style={[
                styles.balanceCard,
                { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
              ]}
            >
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>Available</Text>
                <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>{formatCurrency(cashBalance)}</Text>
              </View>
              {orderTotal > 0 && (
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>After Order</Text>
                  <Text style={[styles.balanceValue, { color: hasEnoughBalance ? theme.colors.success.primary : theme.colors.error.primary }]}>
                    {formatCurrency(cashBalance - orderTotal)}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Demo Notice */}
          <View style={[styles.demoNotice, { backgroundColor: theme.colors.accent.glow }]}>
            <Text style={[styles.demoText, { color: theme.colors.accent.primary }]}>
              Demo Mode - Simulated ATS Trading
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background.primary }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: orderSide === 'bid' ? theme.colors.success.primary : theme.colors.error.primary },
              !canSubmit && { opacity: 0.5 },
            ]}
            onPress={handleConfirmOrder}
            disabled={isProcessing}
          >
            <Text style={styles.submitButtonText}>
              {isProcessing
                ? 'Processing...'
                : isValidOrder
                  ? `${orderSide === 'bid' ? 'Buy' : 'Sell'} ${numericQuantity} ${token.symbol}`
                  : `Min Order $${token.minimumOrder}`
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
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tokenIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
  },
  tokenPrice: {
    fontSize: 14,
    marginTop: 2,
  },
  bidAskDisplay: {
    alignItems: 'flex-end',
  },
  bidPrice: {
    fontSize: 12,
    fontWeight: '500',
  },
  askPrice: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  dollarSign: {
    fontSize: 24,
    marginRight: 4,
  },
  input: {
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
  priceHint: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priceHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
    paddingTop: 12,
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
    marginBottom: 16,
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
    color: '#FFFFFF',
  },
});
