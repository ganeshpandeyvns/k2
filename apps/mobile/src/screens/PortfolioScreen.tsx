// ============================================================================
// Portfolio Screen
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';
import { PositionCard } from '../components/PositionCard';

type TabType = 'positions' | 'orders' | 'history';

export function PortfolioScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('positions');

  const { data: portfolio, refetch, isRefetching } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });

  const { data: openOrders } = useQuery({
    queryKey: ['orders', 'open'],
    queryFn: () => api.getOpenOrders(),
  });

  const { data: orderHistory } = useQuery({
    queryKey: ['orders', 'history'],
    queryFn: () => api.getOrderHistory(),
    enabled: activeTab === 'history',
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'positions':
        return (
          <FlatList
            data={portfolio?.positions || []}
            keyExtractor={(item) => item.instrument}
            renderItem={({ item }) => (
              <PositionCard
                position={item}
                onPress={() =>
                  navigation.navigate('InstrumentDetail' as never, {
                    instrumentId: item.instrument,
                  } as never)
                }
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#00D4AA"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No positions yet</Text>
              </View>
            }
          />
        );

      case 'orders':
        return (
          <FlatList
            data={openOrders || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderInstrument}>{item.instrument}</Text>
                  <View style={[styles.orderStatus, styles[`status_${item.status}`]]}>
                    <Text style={styles.orderStatusText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderText}>
                    {item.side.toUpperCase()} {item.quantity} @ {formatCurrency(item.price || '0')}
                  </Text>
                  <Text style={styles.orderText}>
                    Filled: {item.filledQuantity} / {item.quantity}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No open orders</Text>
              </View>
            }
          />
        );

      case 'history':
        return (
          <FlatList
            data={orderHistory || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderInstrument}>{item.instrument}</Text>
                  <View style={[styles.orderStatus, styles[`status_${item.status}`]]}>
                    <Text style={styles.orderStatusText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderText}>
                    {item.side.toUpperCase()} {item.filledQuantity} @ {formatCurrency(item.avgFillPrice || '0')}
                  </Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No order history</Text>
              </View>
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
      </View>

      {/* Portfolio Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Value</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(portfolio?.totalValue || '0')}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total P&L</Text>
            <Text
              style={[
                styles.summaryValue,
                parseFloat(portfolio?.totalPnl || '0') >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {parseFloat(portfolio?.totalPnl || '0') >= 0 ? '+' : ''}
              {formatCurrency(portfolio?.totalPnl || '0')}
              {' '}
              <Text style={styles.percentText}>
                ({formatPercent(portfolio?.totalPnlPercent || '0')})
              </Text>
            </Text>
          </View>
        </View>

        {/* Balances */}
        <View style={styles.balancesRow}>
          {portfolio?.balances?.map((balance: any) => (
            <View key={`${balance.exchange}-${balance.currency}`} style={styles.balanceChip}>
              <Text style={styles.balanceLabel}>{balance.exchange}</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(balance.available)} {balance.currency}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'positions' && styles.activeTab]}
          onPress={() => setActiveTab('positions')}
        >
          <Text style={[styles.tabText, activeTab === 'positions' && styles.activeTabText]}>
            Positions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Open Orders ({openOrders?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryCard: {
    margin: 20,
    marginTop: 10,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  positive: {
    color: '#00D4AA',
  },
  negative: {
    color: '#FF4D4D',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  balancesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  balanceChip: {
    backgroundColor: '#0D0D0D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 10,
    color: '#666666',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  activeTab: {
    backgroundColor: '#00D4AA',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  orderCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInstrument: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  status_open: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
  },
  status_partial: {
    backgroundColor: 'rgba(255, 183, 77, 0.2)',
  },
  status_filled: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
  },
  status_cancelled: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
  },
  status_rejected: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderText: {
    fontSize: 14,
    color: '#999999',
  },
  orderDate: {
    fontSize: 12,
    color: '#666666',
  },
});
