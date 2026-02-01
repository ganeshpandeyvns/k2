// ============================================================================
// Trade Screen - Order Entry
// ============================================================================

import React, { useState, useCallback } from 'react';
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
import { useQuery, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { usePortfolioStore } from '../store/portfolioStore';
import { useFundingStore } from '../store/fundingStore';

// Demo prices for when API is unavailable
const DEMO_PRICES: Record<string, { lastPrice: string; change24h: string }> = {
  'BTC-USD': { lastPrice: '67234.89', change24h: '2.34' },
  'ETH-USD': { lastPrice: '3456.78', change24h: '-1.23' },
  'SOL-USD': { lastPrice: '178.45', change24h: '5.67' },
  'AVAX-USD': { lastPrice: '42.89', change24h: '3.21' },
  'DOGE-USD': { lastPrice: '0.1234', change24h: '1.45' },
  'XRP-USD': { lastPrice: '0.5678', change24h: '-0.89' },
};

// Demo instruments
const DEMO_INSTRUMENTS: Record<string, { displayName: string; baseAsset: string }> = {
  'BTC-USD': { displayName: 'Bitcoin', baseAsset: 'BTC' },
  'ETH-USD': { displayName: 'Ethereum', baseAsset: 'ETH' },
  'SOL-USD': { displayName: 'Solana', baseAsset: 'SOL' },
  'AVAX-USD': { displayName: 'Avalanche', baseAsset: 'AVAX' },
  'DOGE-USD': { displayName: 'Dogecoin', baseAsset: 'DOGE' },
  'XRP-USD': { displayName: 'XRP', baseAsset: 'XRP' },
};

type TradeScreenRouteProp = RouteProp<RootStackParamList, 'Trade'>;

type OrderSide = 'buy' | 'sell';
type OrderType = 'market' | 'limit';
type EventSide = 'yes' | 'no';
type InputMode = 'dollars' | 'shares';

export function TradeScreen() {
  const navigation = useNavigation();
  const route = useRoute<TradeScreenRouteProp>();
  const { instrumentId, side: initialSide } = route.params;

  const [side, setSide] = useState<OrderSide>(initialSide || 'buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [inputMode, setInputMode] = useState<InputMode>('dollars'); // Default to dollars like Robinhood
  const [quantity, setQuantity] = useState('');
  const [dollarAmount, setDollarAmount] = useState('');
  const [price, setPrice] = useState('');
  const [eventSide, setEventSide] = useState<EventSide>('yes');

  const { executeBuy, executeSell, getHolding } = usePortfolioStore();
  const { cashBalance, updateCashBalance } = useFundingStore();

  const isEvent = instrumentId.startsWith('KX');
  const baseAsset = instrumentId.split('-')[0]; // e.g., 'BTC' from 'BTC-USD'
  const currentHolding = getHolding(baseAsset);

  const { data: instrument } = useQuery({
    queryKey: ['instrument', instrumentId],
    queryFn: async () => {
      try {
        return await api.getInstrument(instrumentId);
      } catch {
        // Return demo data if API fails
        return DEMO_INSTRUMENTS[instrumentId] || { displayName: instrumentId, baseAsset: instrumentId.split('-')[0] };
      }
    },
  });

  const { data: quote } = useQuery({
    queryKey: ['quote', instrumentId],
    queryFn: async () => {
      try {
        return await api.getQuote(instrumentId);
      } catch {
        // Return demo prices if API fails
        return DEMO_PRICES[instrumentId] || { lastPrice: '100.00', change24h: '0.00' };
      }
    },
    refetchInterval: 5000, // Reduced frequency for demo mode
  });

  const submitOrder = useMutation({
    mutationFn: async (order: Parameters<typeof api.createOrder>[0]) => {
      try {
        return await api.createOrder(order);
      } catch {
        // Demo mode: simulate successful order
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          orderId: `demo_${Date.now()}`,
          status: 'filled',
          instrument: order.instrument,
          side: order.side,
          quantity: order.quantity,
          price: order.price || quote?.lastPrice || '0',
        };
      }
    },
    onSuccess: (data) => {
      const price = parseFloat(data.price || currentPrice);
      const qty = parseFloat(data.quantity);
      const totalCost = qty * price;

      // Update portfolio and cash balance based on order side
      if (!isEvent) {
        if (data.side === 'buy') {
          executeBuy(baseAsset, qty, price, instrument?.displayName);
          // Deduct USD from cash balance
          updateCashBalance(-totalCost);
        } else {
          executeSell(baseAsset, qty, price);
          // Add USD to cash balance
          updateCashBalance(totalCost);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Order Filled',
        `Your ${side} order for ${qty.toFixed(6)} ${baseAsset} at ${formatCurrency(price.toString())} has been filled.\n\nTotal: ${formatCurrency(totalCost.toString())}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Order Failed', error.message || 'Failed to submit order');
    },
  });

  // Derived values - must be defined before handleSubmit that uses them
  const currentPrice = quote?.lastPrice || '0';
  const currentPriceNum = parseFloat(currentPrice) || 0;

  // Calculate quantity from dollar amount (for dollar input mode)
  const calculatedQuantity = inputMode === 'dollars' && currentPriceNum > 0
    ? (parseFloat(dollarAmount || '0') / currentPriceNum)
    : parseFloat(quantity || '0');

  // For display and order submission
  const effectiveQuantity = inputMode === 'dollars'
    ? calculatedQuantity.toFixed(8).replace(/\.?0+$/, '')
    : quantity;

  const estimatedTotal = inputMode === 'dollars'
    ? dollarAmount || '0'
    : (parseFloat(quantity || '0') * currentPriceNum).toFixed(2);

  // Handle input mode change - clear values
  const handleInputModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setQuantity('');
    setDollarAmount('');
    // Force market order for dollar-amount trades
    if (mode === 'dollars') {
      setOrderType('market');
    }
  };

  const handleSubmit = useCallback(() => {
    // Validate input based on mode
    if (inputMode === 'dollars') {
      if (!dollarAmount || parseFloat(dollarAmount) <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid dollar amount');
        return;
      }
      if (parseFloat(dollarAmount) < 1) {
        Alert.alert('Minimum Order', 'Minimum order is $1.00');
        return;
      }
    } else {
      if (!quantity || parseFloat(quantity) <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
        return;
      }
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      Alert.alert('Invalid Price', 'Please enter a valid price for limit order');
      return;
    }

    const orderQuantity = inputMode === 'dollars' ? calculatedQuantity : parseFloat(quantity);
    const orderTotal = inputMode === 'dollars'
      ? parseFloat(dollarAmount)
      : orderQuantity * currentPriceNum;

    // Check balance for sell orders
    if (side === 'sell' && !isEvent) {
      const holdingQty = currentHolding?.quantity || 0;
      if (orderQuantity > holdingQty) {
        Alert.alert('Insufficient Balance', `You only have ${holdingQty.toFixed(6)} ${baseAsset} available to sell.`);
        return;
      }
    }

    // Check cash balance for buy orders
    if (side === 'buy' && !isEvent) {
      if (orderTotal > cashBalance) {
        Alert.alert(
          'Insufficient Funds',
          `This order costs ${formatCurrency(orderTotal.toString())} but you only have ${formatCurrency(cashBalance.toString())} available.\n\nDeposit funds to continue.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Deposit', onPress: () => navigation.navigate('Deposit' as never) },
          ]
        );
        return;
      }
    }

    const executeOrder = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      submitOrder.mutate({
        instrument: instrumentId,
        side,
        type: orderType,
        quantity: orderQuantity.toFixed(8),
        price: orderType === 'limit' ? price : undefined,
        eventSide: isEvent ? eventSide : undefined,
      });
    };

    // Confirm large transactions (over $1000)
    if (orderTotal > 1000) {
      Alert.alert(
        'Confirm Large Order',
        `You are about to ${side} ${orderQuantity.toFixed(6)} ${baseAsset} for ${formatCurrency(orderTotal.toString())}.\n\nAre you sure you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', style: 'destructive', onPress: executeOrder },
        ]
      );
      return;
    }

    // For market orders with dollar amount, show slippage warning
    if (inputMode === 'dollars' && orderType === 'market') {
      Alert.alert(
        'Market Order',
        `This is a market order. The final price may differ slightly from ${formatCurrency(currentPrice)} due to market conditions.\n\nEstimated: ${orderQuantity.toFixed(6)} ${baseAsset}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Place Order', onPress: executeOrder },
        ]
      );
      return;
    }

    executeOrder();
  }, [quantity, dollarAmount, inputMode, price, orderType, side, eventSide, instrumentId, isEvent, currentHolding, baseAsset, cashBalance, currentPrice, currentPriceNum, calculatedQuantity, navigation, submitOrder]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEvent ? 'Trade Event' : `Trade ${instrument?.baseAsset || ''}`}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Instrument Info */}
          <View style={styles.instrumentInfo}>
            <Text style={styles.instrumentName}>{instrument?.displayName}</Text>
            <Text style={styles.currentPrice}>{formatCurrency(currentPrice)}</Text>
          </View>

          {/* Buy/Sell Toggle (Crypto) or Yes/No Toggle (Events) */}
          {isEvent ? (
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, eventSide === 'yes' && styles.yesActive]}
                onPress={() => setEventSide('yes')}
              >
                <Text style={[styles.toggleText, eventSide === 'yes' && styles.toggleTextActive]}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, eventSide === 'no' && styles.noActive]}
                onPress={() => setEventSide('no')}
              >
                <Text style={[styles.toggleText, eventSide === 'no' && styles.toggleTextActive]}>
                  No
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, side === 'buy' && styles.buyActive]}
                onPress={() => setSide('buy')}
              >
                <Text style={[styles.toggleText, side === 'buy' && styles.toggleTextActive]}>
                  Buy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, side === 'sell' && styles.sellActive]}
                onPress={() => setSide('sell')}
              >
                <Text style={[styles.toggleText, side === 'sell' && styles.toggleTextActive]}>
                  Sell
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Order Type */}
          <View style={styles.orderTypeContainer}>
            <TouchableOpacity
              style={[styles.orderTypeButton, orderType === 'market' && styles.orderTypeActive]}
              onPress={() => setOrderType('market')}
            >
              <Text style={[styles.orderTypeText, orderType === 'market' && styles.orderTypeTextActive]}>
                Market
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                orderType === 'limit' && styles.orderTypeActive,
                inputMode === 'dollars' && styles.orderTypeDisabled,
              ]}
              onPress={() => {
                if (inputMode === 'dollars') {
                  Alert.alert(
                    'Limit Orders',
                    'Limit orders require entering a specific quantity. Switch to the shares/quantity input mode to place limit orders.'
                  );
                  return;
                }
                setOrderType('limit');
              }}
              disabled={inputMode === 'dollars'}
            >
              <Text style={[
                styles.orderTypeText,
                orderType === 'limit' && styles.orderTypeTextActive,
                inputMode === 'dollars' && styles.orderTypeTextDisabled,
              ]}>
                Limit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dollar Mode Disclosure */}
          {inputMode === 'dollars' && !isEvent && (
            <View style={styles.disclosureBox}>
              <Text style={styles.disclosureText}>
                Dollar orders execute at market price. The quantity of {baseAsset} you receive may vary slightly based on market conditions.
              </Text>
            </View>
          )}

          {/* Input Mode Toggle (Dollars vs Shares) - Only for crypto */}
          {!isEvent && (
            <View style={styles.inputModeContainer}>
              <TouchableOpacity
                style={[styles.inputModeButton, inputMode === 'dollars' && styles.inputModeActive]}
                onPress={() => handleInputModeChange('dollars')}
              >
                <Text style={[styles.inputModeText, inputMode === 'dollars' && styles.inputModeTextActive]}>
                  Dollars
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputModeButton, inputMode === 'shares' && styles.inputModeActive]}
                onPress={() => handleInputModeChange('shares')}
              >
                <Text style={[styles.inputModeText, inputMode === 'shares' && styles.inputModeTextActive]}>
                  {baseAsset}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Amount Input - Dollar mode */}
          {inputMode === 'dollars' && !isEvent && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount in USD</Text>
              <View style={styles.dollarInputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.dollarInput}
                  value={dollarAmount}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9.]/g, '');
                    const parts = sanitized.split('.');
                    if (parts.length > 2) return;
                    if (parts[1]?.length > 2) return; // Max 2 decimal places for USD
                    setDollarAmount(sanitized);
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                />
              </View>
              {calculatedQuantity > 0 && (
                <Text style={styles.calculatedQuantity}>
                  ≈ {calculatedQuantity.toFixed(6)} {baseAsset}
                </Text>
              )}
            </View>
          )}

          {/* Quantity Input - Shares mode or Events */}
          {(inputMode === 'shares' || isEvent) && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {isEvent ? 'Number of Contracts' : `Quantity (${baseAsset})`}
              </Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^0-9.]/g, '');
                  const parts = sanitized.split('.');
                  if (parts.length > 2) return;
                  if (parts[1]?.length > 8) return;
                  setQuantity(sanitized);
                }}
                placeholder={isEvent ? 'e.g., 10' : 'e.g., 0.5'}
                placeholderTextColor="#666666"
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Price Input (Limit Orders) */}
          {orderType === 'limit' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Limit Price</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={(text) => {
                  // Sanitize input - only allow numbers and one decimal point
                  const sanitized = text.replace(/[^0-9.]/g, '');
                  const parts = sanitized.split('.');
                  if (parts.length > 2) return; // Multiple decimals
                  if (parts[1]?.length > 2) return; // Max 2 decimal places for USD
                  setPrice(sanitized);
                }}
                placeholder={`e.g., ${currentPrice}`}
                placeholderTextColor="#666666"
                keyboardType="decimal-pad"
              />
            </View>
          )}

          {/* Order Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {orderType === 'market' ? 'Est. Price' : 'Limit Price'}
              </Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(orderType === 'limit' ? price || '0' : currentPrice)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {inputMode === 'dollars' ? `Est. ${baseAsset}` : 'Quantity'}
              </Text>
              <Text style={styles.summaryValue}>
                {inputMode === 'dollars'
                  ? `${calculatedQuantity.toFixed(6)} ${baseAsset}`
                  : `${quantity || '0'} ${isEvent ? 'contracts' : baseAsset}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Est. Total</Text>
              <Text style={styles.summaryValueLarge}>{formatCurrency(estimatedTotal)}</Text>
            </View>
            {isEvent && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Max Payout</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(parseFloat(quantity || '0').toString())}
                </Text>
              </View>
            )}
            {inputMode === 'dollars' && !isEvent && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order Type</Text>
                <Text style={styles.summaryValueHighlight}>Market Order</Text>
              </View>
            )}
          </View>

          {/* Risk Warning */}
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              {isEvent
                ? 'Event contracts settle at $1 or $0. You could lose your entire investment.'
                : 'Cryptocurrency prices are volatile. Only trade what you can afford to lose.'}
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isEvent
                ? eventSide === 'yes'
                  ? styles.yesButton
                  : styles.noButton
                : side === 'buy'
                ? styles.buyButton
                : styles.sellButton,
              submitOrder.isPending && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={submitOrder.isPending}
          >
            <Text style={styles.submitButtonText}>
              {submitOrder.isPending
                ? 'Submitting...'
                : isEvent
                ? `Buy ${eventSide.toUpperCase()}`
                : `${side === 'buy' ? 'Buy' : 'Sell'} ${instrument?.baseAsset || ''}`}
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
    backgroundColor: '#0D0D0D',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  closeButton: {
    fontSize: 16,
    color: '#00D4AA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  instrumentInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instrumentName: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  buyActive: {
    backgroundColor: '#00D4AA',
  },
  sellActive: {
    backgroundColor: '#FF4D4D',
  },
  yesActive: {
    backgroundColor: '#00D4AA',
  },
  noActive: {
    backgroundColor: '#FF4D4D',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  inputModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  inputModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  inputModeActive: {
    backgroundColor: '#333333',
  },
  inputModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  inputModeTextActive: {
    color: '#FFFFFF',
  },
  dollarInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '600',
    color: '#00D4AA',
    marginRight: 4,
  },
  dollarInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 16,
  },
  calculatedQuantity: {
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  disclosureBox: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  disclosureText: {
    fontSize: 12,
    color: '#00D4AA',
    textAlign: 'center',
    lineHeight: 18,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  orderTypeActive: {
    borderColor: '#00D4AA',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
  },
  orderTypeDisabled: {
    opacity: 0.4,
    borderColor: '#222222',
  },
  orderTypeText: {
    fontSize: 14,
    color: '#666666',
  },
  orderTypeTextActive: {
    color: '#00D4AA',
  },
  orderTypeTextDisabled: {
    color: '#444444',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
  },
  summary: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  summaryValueLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryValueHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
  },
  warning: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#FF4D4D',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#00D4AA',
  },
  sellButton: {
    backgroundColor: '#FF4D4D',
  },
  yesButton: {
    backgroundColor: '#00D4AA',
  },
  noButton: {
    backgroundColor: '#FF4D4D',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
