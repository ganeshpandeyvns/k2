// ============================================================================
// Home Screen - Dashboard
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';
import { PriceCard } from '../components/PriceCard';
import { PositionCard } from '../components/PositionCard';

export function HomeScreen() {
  const navigation = useNavigation();

  const { data: portfolio, refetch, isRefetching } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const { data: watchlistQuotes } = useQuery({
    queryKey: ['watchlist-quotes'],
    queryFn: () => api.getWatchlistQuotes(),
    refetchInterval: 5000,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#00D4AA"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {/* Portfolio Summary */}
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
          <Text style={styles.portfolioValue}>
            {formatCurrency(portfolio?.totalValue || '0')}
          </Text>
          <View style={styles.pnlContainer}>
            <Text
              style={[
                styles.pnlValue,
                parseFloat(portfolio?.totalPnl || '0') >= 0
                  ? styles.positive
                  : styles.negative,
              ]}
            >
              {parseFloat(portfolio?.totalPnl || '0') >= 0 ? '+' : ''}
              {formatCurrency(portfolio?.totalPnl || '0')}
            </Text>
            <Text
              style={[
                styles.pnlPercent,
                parseFloat(portfolio?.totalPnlPercent || '0') >= 0
                  ? styles.positive
                  : styles.negative,
              ]}
            >
              ({formatPercent(portfolio?.totalPnlPercent || '0')})
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={() => navigation.navigate('Markets' as never)}
          >
            <Text style={styles.actionButtonText}>Buy Crypto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.eventButton]}
            onPress={() => navigation.navigate('Markets' as never)}
          >
            <Text style={styles.actionButtonText}>Trade Events</Text>
          </TouchableOpacity>
        </View>

        {/* Watchlist */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Watchlist</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.watchlistScroll}
          >
            {watchlistQuotes?.map((quote: any) => (
              <PriceCard
                key={quote.instrument}
                instrument={quote.instrument}
                price={quote.lastPrice}
                change={quote.changePercent24h}
                onPress={() =>
                  navigation.navigate('InstrumentDetail' as never, {
                    instrumentId: quote.instrument,
                  } as never)
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Positions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Positions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Portfolio' as never)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {portfolio?.positions?.slice(0, 3).map((position: any) => (
            <PositionCard
              key={position.instrument}
              position={position}
              onPress={() =>
                navigation.navigate('InstrumentDetail' as never, {
                  instrumentId: position.instrument,
                } as never)
              }
            />
          ))}
          {(!portfolio?.positions || portfolio.positions.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No positions yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Markets' as never)}
              >
                <Text style={styles.emptyButtonText}>Start Trading</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  portfolioCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pnlValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  pnlPercent: {
    fontSize: 14,
  },
  positive: {
    color: '#00D4AA',
  },
  negative: {
    color: '#FF4D4D',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#00D4AA',
  },
  eventButton: {
    backgroundColor: '#7B61FF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: 14,
    color: '#00D4AA',
  },
  watchlistScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
