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
import { usePortfolioStore, TradeTransaction, AssetType } from '../store/portfolioStore';
import { useTheme } from '../hooks/useTheme';
import { FIXED_INCOME_INSTRUMENTS, getFixedIncomeBySymbol } from '../utils/mockFixedIncomeData';

// Demo prices for all asset types (crypto, stocks, events)
const DEMO_PRICES: Record<string, number> = {
  // Crypto
  BTC: 67234.89,
  ETH: 3456.78,
  SOL: 178.45,
  AVAX: 42.89,
  USDC: 1.00,
  USDT: 1.00,
  DOGE: 0.1234,
  XRP: 0.5678,
  MATIC: 0.89,
  LINK: 18.67,
  DOT: 8.45,
  UNI: 12.34,
  // Stocks (from DEMO_STOCK_QUOTES)
  AAPL: 178.45,
  MSFT: 378.91,
  GOOGL: 141.89,
  AMZN: 178.25,
  META: 505.75,
  NVDA: 450.00,
  TSLA: 220.00,
  JPM: 195.50,
  BAC: 35.25,
  V: 275.00,
  MA: 425.00,
  JNJ: 160.00,
  // Event Contracts (probability-based, 0-1 scale displayed as cents)
  'FED-RATE-MAR': 0.42,
  'BTC-100K-Q1': 0.28,
  'ETH-ETF-APR': 0.65,
  'AI-BREAKTHROUGH': 0.55,
  // Fixed Income (prices from mockFixedIncomeData)
  'TBILL-3M': 98.75,
  'UST-2Y': 99.25,
  'UST-5Y': 97.50,
  'UST-10Y': 94.80,
  'TIPS-5Y': 101.25,
  'AAPL-4.375-29': 96.80,
  'MSFT-3.5-28': 95.25,
  'JPM-4.25-30': 94.50,
  'JNJ-3.75-31': 92.80,
  'IG-BOND-ETF': 98.50,
  'HY-BOND-POOL': 94.25,
  'NFLX-5.875-28': 98.75,
  'ENERGY-HY': 91.50,
  'CA-GO-5-30': 102.50,
  'NYC-GO-4.5-29': 99.75,
  'TX-REV-4.75-31': 98.25,
  'MM-PRIME': 1.00,
  'MM-GOVT': 1.00,
  'USDC-YIELD': 1.00,
};

type TabType = 'positions' | 'activity' | 'history';
type AssetFilterType = 'all' | 'crypto' | 'stock' | 'fixed-income' | 'event';

// Helper to get bond yield for display
const getBondYield = (symbol: string): number | null => {
  const bond = getFixedIncomeBySymbol(symbol);
  return bond?.yield ?? null;
};

export function PortfolioScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('positions');
  const [assetFilter, setAssetFilter] = useState<AssetFilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

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
  const allPositions = holdings.map((h) => {
    const currentPrice = DEMO_PRICES[h.symbol] || 0;
    // For fixed income, quantity represents face value
    const isFixedIncome = h.assetType === 'fixed-income';
    const marketValue = isFixedIncome
      ? (h.quantity * currentPrice) / 100 // Bond price is per $100 face value
      : h.quantity * currentPrice;
    const costBasis = isFixedIncome
      ? (h.quantity * h.avgCost) / 100
      : h.quantity * h.avgCost;
    const unrealizedPnl = marketValue - costBasis;
    const unrealizedPnlPercent = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
    const bondYield = isFixedIncome ? getBondYield(h.symbol) : null;

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
      assetType: h.assetType || 'crypto',
      bondYield,
    };
  });

  // Filter positions based on asset type
  const positions = assetFilter === 'all'
    ? allPositions
    : allPositions.filter((p) => p.assetType === assetFilter);

  // Count by asset type for filter badges
  const assetCounts = {
    all: allPositions.length,
    crypto: allPositions.filter((p) => p.assetType === 'crypto').length,
    stock: allPositions.filter((p) => p.assetType === 'stock').length,
    'fixed-income': allPositions.filter((p) => p.assetType === 'fixed-income').length,
    event: allPositions.filter((p) => p.assetType === 'event').length,
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePositionPress = (item: typeof positions[0]) => {
    if (item.assetType === 'fixed-income') {
      // Find the fixed income instrument ID
      const bond = getFixedIncomeBySymbol(item.symbol);
      if (bond) {
        navigation.navigate('FixedIncomeDetail' as never, { instrumentId: bond.id } as never);
      }
    } else {
      navigation.navigate('InstrumentDetail' as never, { instrumentId: item.instrument } as never);
    }
  };

  const renderPositionCard = ({ item }: { item: typeof positions[0] }) => {
    const isFixedIncome = item.assetType === 'fixed-income';

    return (
      <TouchableOpacity
        style={[styles.positionCard, { backgroundColor: theme.colors.background.secondary }]}
        onPress={() => handlePositionPress(item)}
      >
        <View style={styles.positionLeft}>
          <View style={[styles.positionIcon, { backgroundColor: item.color + '30' }]}>
            <Text style={[styles.positionIconText, { color: item.color }]}>
              {isFixedIncome ? '📊' : item.symbol[0]}
            </Text>
          </View>
          <View>
            <Text style={[styles.positionSymbol, { color: theme.colors.text.primary }]}>{item.symbol}</Text>
            {isFixedIncome ? (
              <View style={styles.bondInfoRow}>
                <Text style={[styles.positionQty, { color: theme.colors.text.tertiary }]}>
                  ${parseFloat(item.quantity).toLocaleString()} face
                </Text>
                {item.bondYield && (
                  <Text style={[styles.bondYield, { color: theme.colors.success.primary }]}>
                    {item.bondYield.toFixed(2)}% yield
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[styles.positionQty, { color: theme.colors.text.tertiary }]}>
                {parseFloat(item.quantity).toFixed(6)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.positionRight}>
          <Text style={[styles.positionValue, { color: theme.colors.text.primary }]}>{formatCurrency(item.marketValue)}</Text>
          <Text
            style={[
              styles.positionPnl,
              { color: parseFloat(item.unrealizedPnl) >= 0 ? theme.colors.success.primary : theme.colors.error.primary },
            ]}
          >
            {parseFloat(item.unrealizedPnl) >= 0 ? '+' : ''}
            {formatCurrency(item.unrealizedPnl)} ({formatPercent(item.unrealizedPnlPercent)})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
    <View style={[styles.activityCard, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={styles.activityLeft}>
        <Text style={styles.activityIcon}>{formatTxType(item.type)}</Text>
        <View>
          <Text style={[styles.activityType, { color: theme.colors.text.primary }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            {item.type === 'swap' ? ` ${item.asset} → ${item.toAsset}` : ` ${item.asset}`}
          </Text>
          <Text style={[styles.activityDate, { color: theme.colors.text.tertiary }]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.activityRight}>
        {item.type === 'swap' ? (
          <>
            <Text style={[styles.activityAmountNegative, { color: theme.colors.error.primary }]}>-{item.quantity.toFixed(6)} {item.asset}</Text>
            <Text style={[styles.activityAmountPositive, { color: theme.colors.success.primary }]}>+{item.toQuantity?.toFixed(6)} {item.toAsset}</Text>
          </>
        ) : (
          <Text
            style={[
              styles.activityAmount,
              { color: item.type === 'sell' || item.type === 'send' ? theme.colors.error.primary : theme.colors.success.primary },
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
    <View style={[styles.activityCard, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={styles.activityLeft}>
        <Text style={styles.activityIcon}>{formatTxType(item.type)}</Text>
        <View>
          <Text style={[styles.activityType, { color: theme.colors.text.primary }]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
          <Text style={[styles.activityDate, { color: theme.colors.text.tertiary }]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.activityRight}>
        <Text
          style={[
            styles.activityAmount,
            { color: item.type === 'withdraw' ? theme.colors.error.primary : theme.colors.success.primary },
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
                tintColor={theme.colors.accent.primary}
              />
            }
            ListHeaderComponent={
              <View style={styles.assetFilters}>
                {(['all', 'crypto', 'stock', 'fixed-income', 'event'] as AssetFilterType[]).map((filter) => {
                  const count = assetCounts[filter];
                  if (filter !== 'all' && count === 0) return null;
                  const labels: Record<AssetFilterType, string> = {
                    all: 'All',
                    crypto: 'Crypto',
                    stock: 'Stocks',
                    'fixed-income': 'Bonds',
                    event: 'Events',
                  };
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.assetFilterChip,
                        { backgroundColor: theme.colors.background.secondary },
                        assetFilter === filter && { backgroundColor: theme.colors.accent.primary },
                      ]}
                      onPress={() => setAssetFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.assetFilterText,
                          { color: theme.colors.text.tertiary },
                          assetFilter === filter && { color: theme.colors.text.inverse },
                        ]}
                      >
                        {labels[filter]} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No positions yet</Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>Start trading to see your holdings here</Text>
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
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No activity yet</Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>Your trades and swaps will appear here</Text>
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
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No funding history</Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.text.tertiary }]}>Deposits and withdrawals will appear here</Text>
              </View>
            }
          />
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Portfolio</Text>
      </View>

      {/* Portfolio Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.background.secondary }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Total Value</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
              {formatCurrency(totalValue.toString())}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.colors.text.tertiary }]}>Total P&L</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totalPnl >= 0 ? theme.colors.success.primary : theme.colors.error.primary },
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
            <View style={[styles.balanceChip, { backgroundColor: theme.colors.background.primary }]}>
              <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>Cash</Text>
              <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>
                {formatCurrency(cashBalance.toString())}
              </Text>
            </View>
          )}
          <View style={[styles.balanceChip, { backgroundColor: theme.colors.background.primary }]}>
            <Text style={[styles.balanceLabel, { color: theme.colors.text.tertiary }]}>Holdings</Text>
            <Text style={[styles.balanceValue, { color: theme.colors.text.primary }]}>
              {formatCurrency(totalHoldingsValue.toString())}
            </Text>
          </View>
        </View>

        {/* Quick Funding Actions */}
        <View style={styles.fundingActions}>
          <TouchableOpacity
            style={[styles.fundingButton, { backgroundColor: theme.colors.background.primary }]}
            onPress={() => navigation.navigate('Deposit' as never)}
          >
            <Text style={[styles.fundingButtonIcon, { color: theme.colors.accent.primary }]}>↓</Text>
            <Text style={[styles.fundingButtonText, { color: theme.colors.text.primary }]}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fundingButton, { backgroundColor: theme.colors.background.primary }]}
            onPress={() => navigation.navigate('Withdraw' as never)}
          >
            <Text style={[styles.fundingButtonIcon, { color: theme.colors.accent.primary }]}>↑</Text>
            <Text style={[styles.fundingButtonText, { color: theme.colors.text.primary }]}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: theme.colors.background.secondary }, activeTab === 'positions' && { backgroundColor: theme.colors.accent.primary }]}
          onPress={() => setActiveTab('positions')}
        >
          <Text style={[styles.tabText, { color: theme.colors.text.tertiary }, activeTab === 'positions' && { color: theme.colors.text.inverse }]}>
            Holdings ({holdings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: theme.colors.background.secondary }, activeTab === 'activity' && { backgroundColor: theme.colors.accent.primary }]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, { color: theme.colors.text.tertiary }, activeTab === 'activity' && { color: theme.colors.text.inverse }]}>
            Activity ({tradeTransactions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: theme.colors.background.secondary }, activeTab === 'history' && { backgroundColor: theme.colors.accent.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, { color: theme.colors.text.tertiary }, activeTab === 'history' && { color: theme.colors.text.inverse }]}>
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
  assetFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  assetFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
  },
  assetFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  bondInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  bondYield: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D4AA',
  },
});
