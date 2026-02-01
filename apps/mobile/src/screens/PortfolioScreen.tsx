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
import { formatCurrency, formatPercent } from '../utils/format';
import { useFundingStore } from '../store/fundingStore';
import { usePortfolioStore, TradeTransaction } from '../store/portfolioStore';

// Demo prices for assets
const DEMO_PRICES: Record<string, number> = {
  BTC: 67234.89,
  ETH: 3456.78,
  SOL: 178.45,
  AVAX: 42.89,
  USDC: 1.00,
  USDT: 1.00,
  DOGE: 0.1234,
  XRP: 0.5678,
  MATIC: 0.89,
};

type TabType = 'positions' | 'activity' | 'history';

export function PortfolioScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('positions');
  const [refreshing, setRefreshing] = useState(false);

  // Get cash balance from funding store
  const { cashBalance, transactions: fundingTransactions } = useFundingStore();

  // Get holdings and transactions from portfolio store
  const { holdings, transactions: tradeTransactions } = usePortfolioStore();

  // Calculate totals from actual holdings
  const totalHoldingsValue = holdings.reduce((sum, h) => {
    const price = DEMO_PRICES[h.symbol] || 0;
    return sum + h.quantity * price;
  }, 0);

  const totalCostBasis = holdings.reduce((sum, h) => {
    return sum + h.quantity * h.avgCost;
  }, 0);

  const totalPnl = totalHoldingsValue - totalCostBasis;
  const totalValue = totalHoldingsValue + cashBalance;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  // Build positions from holdings
  const positions = holdings.map((h) => {
    const currentPrice = DEMO_PRICES[h.symbol] || 0;
    const marketValue = h.quantity * currentPrice;
    const costBasis = h.quantity * h.avgCost;
    const unrealizedPnl = marketValue - costBasis;
    const unrealizedPnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;

    return {
      instrument: `${h.symbol}-USD`,
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity.toString(),
      avgCost: h.avgCost.toString(),
      currentPrice: currentPrice.toString(),
      marketValue: marketValue.toString(),
      unrealizedPnl: unrealizedPnl.toString(),
      unrealizedPnlPercent: unrealizedPnlPercent.toString(),
      color: h.color,
    };
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderPositionCard = ({ item }: { item: typeof positions[0] }) => (
    <TouchableOpacity
      style={styles.positionCard}
      onPress={() =>
        navigation.navigate('InstrumentDetail' as never, {
          instrumentId: item.instrument,
        } as never)
      }
    >
      <View style={styles.positionLeft}>
        <View style={[styles.positionIcon, { backgroundColor: item.color + '30' }]}>
          <Text style={[styles.positionIconText, { color: item.color }]}>
            {item.symbol[0]}
          </Text>
        </View>
        <View>
          <Text style={styles.positionSymbol}>{item.symbol}</Text>
          <Text style={styles.positionQty}>{parseFloat(item.quantity).toFixed(6)}</Text>
        </View>
      </View>
      <View style={styles.positionRight}>
        <Text style={styles.positionValue}>{formatCurrency(item.marketValue)}</Text>
        <Text
          style={[
            styles.positionPnl,
            parseFloat(item.unrealizedPnl) >= 0 ? styles.positive : styles.negative,
          ]}
        >
          {parseFloat(item.unrealizedPnl) >= 0 ? '+' : ''}
          {formatCurrency(item.unrealizedPnl)} ({formatPercent(item.unrealizedPnlPercent)})
        </Text>
      </View>
    </TouchableOpacity>
  );

  const formatTxType = (type: string) => {
    const icons: Record<string, string> = {
      buy: '📈',
      sell: '📉',
      swap: '🔄',
      send: '📤',
      receive: '📥',
      deposit: '💰',
      withdraw: '🏦',
    };
    return icons[type] || '•';
  };

  const renderActivityItem = ({ item }: { item: TradeTransaction }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityLeft}>
        <Text style={styles.activityIcon}>{formatTxType(item.type)}</Text>
        <View>
          <Text style={styles.activityType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            {item.type === 'swap' ? ` ${item.asset} → ${item.toAsset}` : ` ${item.asset}`}
          </Text>
          <Text style={styles.activityDate}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.activityRight}>
        {item.type === 'swap' ? (
          <>
            <Text style={styles.activityAmountNegative}>-{item.quantity.toFixed(6)} {item.asset}</Text>
            <Text style={styles.activityAmountPositive}>+{item.toQuantity?.toFixed(6)} {item.toAsset}</Text>
          </>
        ) : (
          <Text
            style={[
              styles.activityAmount,
              item.type === 'sell' || item.type === 'send'
                ? styles.activityAmountNegative
                : styles.activityAmountPositive,
            ]}
          >
            {item.type === 'sell' || item.type === 'send' ? '-' : '+'}
            {item.quantity.toFixed(6)} {item.asset}
          </Text>
        )}
      </View>
    </View>
  );

  const renderFundingItem = ({ item }: { item: typeof fundingTransactions[0] }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityLeft}>
        <Text style={styles.activityIcon}>{formatTxType(item.type)}</Text>
        <View>
          <Text style={styles.activityType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={styles.activityDate}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.activityRight}>
        <Text
          style={[
            styles.activityAmount,
            item.type === 'withdraw' ? styles.activityAmountNegative : styles.activityAmountPositive,
          ]}
        >
          {item.type === 'withdraw' ? '-' : '+'}
          {formatCurrency(item.amount.toString())}
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'positions':
        return (
          <FlatList
            data={positions}
            keyExtractor={(item) => item.instrument}
            renderItem={renderPositionCard}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#00D4AA"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No positions yet</Text>
                <Text style={styles.emptySubtext}>Start trading to see your holdings here</Text>
              </View>
            }
          />
        );

      case 'activity':
        return (
          <FlatList
            data={tradeTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderActivityItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No activity yet</Text>
                <Text style={styles.emptySubtext}>Your trades and swaps will appear here</Text>
              </View>
            }
          />
        );

      case 'history':
        return (
          <FlatList
            data={fundingTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderFundingItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No funding history</Text>
                <Text style={styles.emptySubtext}>Deposits and withdrawals will appear here</Text>
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
              {formatCurrency(totalValue.toString())}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total P&L</Text>
            <Text
              style={[
                styles.summaryValue,
                totalPnl >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {totalPnl >= 0 ? '+' : ''}
              {formatCurrency(totalPnl.toString())}
              {' '}
              <Text style={styles.percentText}>
                ({formatPercent(totalPnlPercent.toString())})
              </Text>
            </Text>
          </View>
        </View>

        {/* Balances */}
        <View style={styles.balancesRow}>
          {cashBalance > 0 && (
            <View style={styles.balanceChip}>
              <Text style={styles.balanceLabel}>Cash</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(cashBalance.toString())}
              </Text>
            </View>
          )}
          <View style={styles.balanceChip}>
            <Text style={styles.balanceLabel}>Holdings</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(totalHoldingsValue.toString())}
            </Text>
          </View>
        </View>

        {/* Quick Funding Actions */}
        <View style={styles.fundingActions}>
          <TouchableOpacity
            style={styles.fundingButton}
            onPress={() => navigation.navigate('Deposit' as never)}
          >
            <Text style={styles.fundingButtonIcon}>↓</Text>
            <Text style={styles.fundingButtonText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fundingButton}
            onPress={() => navigation.navigate('Withdraw' as never)}
          >
            <Text style={styles.fundingButtonIcon}>↑</Text>
            <Text style={styles.fundingButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'positions' && styles.activeTab]}
          onPress={() => setActiveTab('positions')}
        >
          <Text style={[styles.tabText, activeTab === 'positions' && styles.activeTabText]}>
            Holdings ({holdings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Activity ({tradeTransactions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Funding
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
  fundingActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  fundingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  fundingButtonIcon: {
    fontSize: 16,
    color: '#00D4AA',
  },
  fundingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444444',
  },
  positionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  positionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positionQty: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  positionRight: {
    alignItems: 'flex-end',
  },
  positionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positionPnl: {
    fontSize: 13,
    marginTop: 2,
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityAmountPositive: {
    color: '#00D4AA',
  },
  activityAmountNegative: {
    color: '#FF4D4D',
  },
});
