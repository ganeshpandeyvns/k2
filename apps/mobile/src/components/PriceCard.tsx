// ============================================================================
// Price Card Component - Watchlist Item
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatCurrency, formatPercent } from '../utils/format';

interface PriceCardProps {
  instrument: string;
  price: string;
  change: string;
  onPress: () => void;
}

export function PriceCard({ instrument, price, change, onPress }: PriceCardProps) {
  const isEvent = instrument.startsWith('KX');
  const changeNum = parseFloat(change);
  const isPositive = changeNum >= 0;

  // Extract base asset from instrument ID
  const displayName = isEvent
    ? instrument.split('-')[0].replace('KX', '')
    : instrument.split('-')[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{isEvent ? '📊' : '🪙'}</Text>
      </View>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.price}>
        {isEvent ? `${(parseFloat(price) * 100).toFixed(0)}¢` : formatCurrency(price)}
      </Text>
      <View style={[styles.changeBadge, isPositive ? styles.positive : styles.negative]}>
        <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
          {isPositive ? '+' : ''}{formatPercent(change)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positive: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
  },
  negative: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveText: {
    color: '#00D4AA',
  },
  negativeText: {
    color: '#FF4D4D',
  },
});
