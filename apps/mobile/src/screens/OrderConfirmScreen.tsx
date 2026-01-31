// ============================================================================
// Order Confirmation Screen
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import type { RootStackParamList } from '../navigation/RootNavigator';

type ConfirmRouteProp = RouteProp<RootStackParamList, 'OrderConfirm'>;

export function OrderConfirmScreen() {
  const navigation = useNavigation();
  const route = useRoute<ConfirmRouteProp>();
  const { orderId } = route.params;

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.getOrder(orderId),
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (order?.status === 'filled') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [order?.status]);

  const isFilled = order?.status === 'filled';
  const isPending = order?.status === 'pending' || order?.status === 'submitted' || order?.status === 'open';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={[styles.statusIcon, isFilled ? styles.successIcon : styles.pendingIcon]}>
          <Text style={styles.statusEmoji}>{isFilled ? '✓' : '⏳'}</Text>
        </View>

        {/* Status Text */}
        <Text style={styles.title}>
          {isFilled ? 'Order Filled!' : isPending ? 'Order Submitted' : `Order ${order?.status}`}
        </Text>
        <Text style={styles.subtitle}>
          {isFilled
            ? 'Your trade has been executed successfully.'
            : isPending
            ? 'Your order is being processed...'
            : 'Order status updated.'}
        </Text>

        {/* Order Details */}
        {order && (
          <View style={styles.orderCard}>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Instrument</Text>
              <Text style={styles.orderValue}>{order.instrument}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Side</Text>
              <Text style={[styles.orderValue, order.side === 'buy' ? styles.buyText : styles.sellText]}>
                {order.side.toUpperCase()}
              </Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Quantity</Text>
              <Text style={styles.orderValue}>{order.filledQuantity || order.quantity}</Text>
            </View>
            {order.avgFillPrice && (
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Fill Price</Text>
                <Text style={styles.orderValue}>{formatCurrency(order.avgFillPrice)}</Text>
              </View>
            )}
            {order.fees && parseFloat(order.fees) > 0 && (
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Fees</Text>
                <Text style={styles.orderValue}>{formatCurrency(order.fees)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Status</Text>
              <View style={[styles.statusBadge, styles[`status_${order.status}`]]}>
                <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order ID */}
        <Text style={styles.orderId}>Order ID: {orderId.slice(0, 8)}...</Text>
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Main' as never)}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Portfolio' as never)}
        >
          <Text style={styles.secondaryButtonText}>View Portfolio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
  },
  pendingIcon: {
    backgroundColor: 'rgba(255, 183, 77, 0.2)',
  },
  statusEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  orderCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 14,
    color: '#666666',
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buyText: {
    color: '#00D4AA',
  },
  sellText: {
    color: '#FF4D4D',
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  status_filled: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
  },
  status_open: {
    backgroundColor: 'rgba(255, 183, 77, 0.2)',
  },
  status_pending: {
    backgroundColor: 'rgba(255, 183, 77, 0.2)',
  },
  status_submitted: {
    backgroundColor: 'rgba(255, 183, 77, 0.2)',
  },
  status_cancelled: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
  },
  status_rejected: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  orderId: {
    fontSize: 12,
    color: '#666666',
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#00D4AA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#999999',
  },
});
