// ============================================================================
// Market Row Component
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatCurrency, formatPercent } from '../utils/format';
import type { Instrument, Quote } from '@k2/types';

interface MarketRowProps {
  instrument: Instrument;
  quote?: Quote;
  onPress: () => void;
}

export function MarketRow({ instrument, quote, onPress }: MarketRowProps) {
  const isEvent = instrument.type === 'event';
  const change = parseFloat((quote as any)?.changePercent24h || (quote as any)?.change24h || '0');
  const isPositive = change >= 0;

  const price = isEvent
    ? `${(parseFloat((quote as any)?.yesPrice || quote?.lastPrice || '0') * 100).toFixed(0)}¢`
    : formatCurrency(quote?.lastPrice || '0');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{isEvent ? '📊' : '🪙'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.symbol}>{instrument.baseAsset}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {instrument.displayName}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>{price}</Text>
        <View style={[styles.changeBadge, isPositive ? styles.positive : styles.negative]}>
          <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
            {isPositive ? '+' : ''}{formatPercent(change.toString())}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    color: '#666666',
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
