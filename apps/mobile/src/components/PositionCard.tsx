// ============================================================================
// Position Card Component
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatCurrency, formatPercent } from '../utils/format';
import type { Position } from '@k2/types';

interface PositionCardProps {
  position: Position;
  onPress: () => void;
}

export function PositionCard({ position, onPress }: PositionCardProps) {
  const isEvent = position.instrument.startsWith('KX');
  const isPositive = parseFloat(position.unrealizedPnl) >= 0;

  // Extract display name
  const displayName = isEvent
    ? position.instrument.split('-')[0].replace('KX', '') + ' Event'
    : position.instrument.split('-')[0];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{isEvent ? '📊' : '🪙'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.quantity}>
            {position.quantity} {isEvent ? 'contracts' : position.instrument.split('-')[0]}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.value}>{formatCurrency(position.marketValue)}</Text>
        <View style={styles.pnlRow}>
          <Text style={[styles.pnl, isPositive ? styles.positive : styles.negative]}>
            {isPositive ? '+' : ''}{formatCurrency(position.unrealizedPnl)}
          </Text>
          <Text style={[styles.pnlPercent, isPositive ? styles.positive : styles.negative]}>
            ({formatPercent(position.unrealizedPnlPercent)})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: '#0D0D0D',
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quantity: {
    fontSize: 13,
    color: '#666666',
  },
  right: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pnl: {
    fontSize: 13,
    fontWeight: '500',
  },
  pnlPercent: {
    fontSize: 12,
  },
  positive: {
    color: '#00D4AA',
  },
  negative: {
    color: '#FF4D4D',
  },
});
