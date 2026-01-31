// ============================================================================
// Instrument Detail Screen
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';
import type { RootStackParamList } from '../navigation/RootNavigator';

type DetailRouteProp = RouteProp<RootStackParamList, 'InstrumentDetail'>;

export function InstrumentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRouteProp>();
  const { instrumentId } = route.params;

  const isEvent = instrumentId.startsWith('KX');

  const { data: instrument } = useQuery({
    queryKey: ['instrument', instrumentId],
    queryFn: () => api.getInstrument(instrumentId),
  });

  const { data: quote } = useQuery({
    queryKey: ['quote', instrumentId],
    queryFn: () => api.getQuote(instrumentId),
    refetchInterval: 2000,
  });

  const { data: position } = useQuery({
    queryKey: ['position', instrumentId],
    queryFn: () => api.getPosition(instrumentId),
  });

  const change = parseFloat(quote?.changePercent24h || quote?.change24h || '0');
  const isPositive = change >= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.watchlistButton}>☆</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={styles.instrumentName}>{instrument?.displayName || instrumentId}</Text>
          <Text style={styles.price}>
            {isEvent
              ? `${(parseFloat(quote?.yesPrice || quote?.lastPrice || '0') * 100).toFixed(0)}¢`
              : formatCurrency(quote?.lastPrice || '0')}
          </Text>
          <View style={styles.changeRow}>
            <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
              {isPositive ? '+' : ''}{formatPercent(change.toString())}
            </Text>
            <Text style={styles.changeLabel}>24h</Text>
          </View>
        </View>

        {/* Event-specific info */}
        {isEvent && instrument?.metadata && (
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{instrument.metadata.eventTitle}</Text>
            <Text style={styles.eventDescription}>{instrument.metadata.eventDescription}</Text>
            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Expires</Text>
                <Text style={styles.metaValue}>
                  {new Date(instrument.metadata.expirationDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Settlement</Text>
                <Text style={styles.metaValue}>{instrument.metadata.settlementSource}</Text>
              </View>
            </View>
            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityFill,
                  { width: `${parseFloat(quote?.yesPrice || '0.5') * 100}%` },
                ]}
              />
            </View>
            <View style={styles.probabilityLabels}>
              <Text style={styles.yesLabel}>
                Yes {(parseFloat(quote?.yesPrice || '0.5') * 100).toFixed(0)}%
              </Text>
              <Text style={styles.noLabel}>
                No {(parseFloat(quote?.noPrice || '0.5') * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>24h High</Text>
              <Text style={styles.statValue}>{formatCurrency(quote?.high24h || '0')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>24h Low</Text>
              <Text style={styles.statValue}>{formatCurrency(quote?.low24h || '0')}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>24h Volume</Text>
              <Text style={styles.statValue}>{quote?.volume24h || '0'}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Bid / Ask</Text>
              <Text style={styles.statValue}>
                {formatCurrency(quote?.bidPrice || '0')} / {formatCurrency(quote?.askPrice || '0')}
              </Text>
            </View>
          </View>
        </View>

        {/* Your Position */}
        {position && (
          <View style={styles.positionCard}>
            <Text style={styles.positionTitle}>Your Position</Text>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Quantity</Text>
              <Text style={styles.positionValue}>{position.quantity}</Text>
            </View>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Avg Cost</Text>
              <Text style={styles.positionValue}>{formatCurrency(position.avgCost)}</Text>
            </View>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Market Value</Text>
              <Text style={styles.positionValue}>{formatCurrency(position.marketValue)}</Text>
            </View>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Unrealized P&L</Text>
              <Text
                style={[
                  styles.positionValue,
                  parseFloat(position.unrealizedPnl) >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {parseFloat(position.unrealizedPnl) >= 0 ? '+' : ''}
                {formatCurrency(position.unrealizedPnl)} ({formatPercent(position.unrealizedPnlPercent)})
              </Text>
            </View>
          </View>
        )}

        {/* About */}
        {!isEvent && (
          <View style={styles.about}>
            <Text style={styles.aboutTitle}>About {instrument?.baseAsset}</Text>
            <Text style={styles.aboutText}>
              {instrument?.baseAsset} is a cryptocurrency that can be traded on the {instrument?.exchange} exchange.
              Trading involves risk. Only trade with funds you can afford to lose.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Trade Buttons */}
      <View style={styles.footer}>
        {isEvent ? (
          <View style={styles.eventButtons}>
            <TouchableOpacity
              style={[styles.tradeButton, styles.yesButton]}
              onPress={() => navigation.navigate('Trade' as never, { instrumentId, side: 'buy' } as never)}
            >
              <Text style={styles.tradeButtonText}>Buy Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tradeButton, styles.noButton]}
              onPress={() => navigation.navigate('Trade' as never, { instrumentId, side: 'sell' } as never)}
            >
              <Text style={styles.tradeButtonText}>Buy No</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cryptoButtons}>
            <TouchableOpacity
              style={[styles.tradeButton, styles.buyButton]}
              onPress={() => navigation.navigate('Trade' as never, { instrumentId, side: 'buy' } as never)}
            >
              <Text style={styles.tradeButtonText}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tradeButton, styles.sellButton]}
              onPress={() => navigation.navigate('Trade' as never, { instrumentId, side: 'sell' } as never)}
            >
              <Text style={styles.tradeButtonText}>Sell</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#00D4AA',
  },
  watchlistButton: {
    fontSize: 24,
    color: '#666666',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instrumentName: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  change: {
    fontSize: 18,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 14,
    color: '#666666',
  },
  positive: {
    color: '#00D4AA',
  },
  negative: {
    color: '#FF4D4D',
  },
  eventInfo: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
  },
  eventMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  probabilityBar: {
    height: 8,
    backgroundColor: '#FF4D4D',
    borderRadius: 4,
    marginBottom: 8,
  },
  probabilityFill: {
    height: '100%',
    backgroundColor: '#00D4AA',
    borderRadius: 4,
  },
  probabilityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yesLabel: {
    fontSize: 14,
    color: '#00D4AA',
  },
  noLabel: {
    fontSize: 14,
    color: '#FF4D4D',
  },
  stats: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  positionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  positionLabel: {
    fontSize: 14,
    color: '#666666',
  },
  positionValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  about: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D0D',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  eventButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cryptoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tradeButton: {
    flex: 1,
    paddingVertical: 16,
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
  tradeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
