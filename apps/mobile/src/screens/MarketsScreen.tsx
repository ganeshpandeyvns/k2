// ============================================================================
// Meru Markets Screen - Premium Trading Experience
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MeruTheme, formatCurrency, formatPercent } from '../theme/meru';
import { MiniChart, generateChartData } from '../components/MiniChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'crypto' | 'events' | 'trending';

// Demo market data with more details
const CRYPTO_MARKETS = [
  { id: 'BTC-USD', symbol: 'BTC', name: 'Bitcoin', price: 67234.89, change24h: 2.34, volume: '24.5B', marketCap: '1.32T', color: '#f7931a' },
  { id: 'ETH-USD', symbol: 'ETH', name: 'Ethereum', price: 3456.78, change24h: -1.23, volume: '12.8B', marketCap: '415B', color: '#627eea' },
  { id: 'SOL-USD', symbol: 'SOL', name: 'Solana', price: 178.45, change24h: 5.67, volume: '3.2B', marketCap: '78B', color: '#00ffa3' },
  { id: 'AVAX-USD', symbol: 'AVAX', name: 'Avalanche', price: 42.89, change24h: 3.21, volume: '890M', marketCap: '16B', color: '#e84142' },
  { id: 'LINK-USD', symbol: 'LINK', name: 'Chainlink', price: 18.67, change24h: -0.89, volume: '456M', marketCap: '11B', color: '#375bd2' },
  { id: 'DOT-USD', symbol: 'DOT', name: 'Polkadot', price: 8.45, change24h: 1.56, volume: '234M', marketCap: '10.5B', color: '#e6007a' },
  { id: 'MATIC-USD', symbol: 'MATIC', name: 'Polygon', price: 0.89, change24h: 4.32, volume: '567M', marketCap: '8.2B', color: '#8247e5' },
  { id: 'UNI-USD', symbol: 'UNI', name: 'Uniswap', price: 12.34, change24h: -2.11, volume: '189M', marketCap: '7.4B', color: '#ff007a' },
];

const EVENT_MARKETS = [
  { id: 'FED-RATE-MAR', symbol: 'FED', name: 'Fed Rate Cut March', price: 0.42, change24h: 8.5, volume: '12M', expires: 'Mar 15', color: '#00d4aa' },
  { id: 'BTC-100K-Q1', symbol: 'BTC100K', name: 'BTC $100K Q1 2025', price: 0.28, change24h: -4.2, volume: '8M', expires: 'Mar 31', color: '#f7931a' },
  { id: 'ETH-ETF-APR', symbol: 'ETHETF', name: 'ETH ETF Approval', price: 0.65, change24h: 12.3, volume: '5M', expires: 'Apr 30', color: '#627eea' },
  { id: 'AI-BREAKTHROUGH', symbol: 'AIGPT5', name: 'GPT-5 Release 2025', price: 0.55, change24h: 3.1, volume: '3M', expires: 'Dec 31', color: '#10a37f' },
];

const TRENDING = [
  { id: 'PEPE-USD', symbol: 'PEPE', name: 'Pepe', price: 0.0000089, change24h: 24.5, volume: '1.2B', color: '#00a859' },
  { id: 'WIF-USD', symbol: 'WIF', name: 'dogwifhat', price: 2.34, change24h: 18.2, volume: '890M', color: '#ff6b35' },
  { id: 'BONK-USD', symbol: 'BONK', name: 'Bonk', price: 0.000023, change24h: 15.3, volume: '678M', color: '#ff9500' },
  { id: 'RENDER-USD', symbol: 'RENDER', name: 'Render', price: 8.45, change24h: 12.7, volume: '345M', color: '#00d4aa' },
];

export function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState<Record<string, number[]>>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Generate chart data for all markets
    const data: Record<string, number[]> = {};
    [...CRYPTO_MARKETS, ...EVENT_MARKETS, ...TRENDING].forEach((market) => {
      const trend = market.change24h > 0 ? 'up' : market.change24h < 0 ? 'down' : 'neutral';
      data[market.id] = generateChartData(market.price, 0.02, 24, trend);
    });
    setChartData(data);

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getMarkets = () => {
    switch (activeTab) {
      case 'crypto':
        return CRYPTO_MARKETS;
      case 'events':
        return EVENT_MARKETS;
      case 'trending':
        return TRENDING;
      default:
        return CRYPTO_MARKETS;
    }
  };

  const filteredMarkets = getMarkets().filter((market) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      market.symbol.toLowerCase().includes(query) ||
      market.name.toLowerCase().includes(query)
    );
  });

  const renderMarketItem = ({ item, index }: { item: any; index: number }) => {
    const isEvent = activeTab === 'events';

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: Animated.multiply(
                slideAnim,
                new Animated.Value(1 + index * 0.1)
              ),
            },
          ],
        }}
      >
        <Pressable
          style={({ pressed }) => [
            styles.marketCard,
            pressed && styles.marketCardPressed,
          ]}
          onPress={() =>
            navigation.navigate('InstrumentDetail' as never, {
              instrumentId: item.id,
            } as never)
          }
        >
          {/* Left: Icon & Info */}
          <View style={styles.marketLeft}>
            <View style={[styles.marketIcon, { backgroundColor: item.color + '20' }]}>
              <Text style={[styles.marketIconText, { color: item.color }]}>
                {item.symbol.slice(0, 2)}
              </Text>
            </View>
            <View style={styles.marketInfo}>
              <Text style={styles.marketSymbol}>{item.symbol}</Text>
              <Text style={styles.marketName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          </View>

          {/* Middle: Chart */}
          <View style={styles.marketChart}>
            <MiniChart
              data={chartData[item.id] || []}
              width={70}
              height={32}
              positive={item.change24h >= 0}
              strokeWidth={1.5}
            />
          </View>

          {/* Right: Price & Change */}
          <View style={styles.marketRight}>
            <Text style={styles.marketPrice}>
              {isEvent ? `${(item.price * 100).toFixed(0)}¢` : formatCurrency(item.price)}
            </Text>
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor:
                    item.change24h >= 0
                      ? MeruTheme.colors.success.glow
                      : MeruTheme.colors.error.glow,
                },
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  {
                    color:
                      item.change24h >= 0
                        ? MeruTheme.colors.success.primary
                        : MeruTheme.colors.error.primary,
                  },
                ]}
              >
                {formatPercent(item.change24h)}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'crypto', label: 'Crypto', icon: '₿' },
    { id: 'events', label: 'Events', icon: '📊' },
    { id: 'trending', label: 'Trending', icon: '🔥' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background */}
      <LinearGradient
        colors={[
          MeruTheme.colors.background.secondary,
          MeruTheme.colors.background.primary,
        ]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.title}>Markets</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Search */}
      <Animated.View
        style={[
          styles.searchContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search markets..."
            placeholderTextColor={MeruTheme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View
        style={[
          styles.tabsContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.tabsWrapper}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.id && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Market Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>24h Volume</Text>
          <Text style={styles.statValue}>$89.4B</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>BTC Dom</Text>
          <Text style={styles.statValue}>52.3%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Fear/Greed</Text>
          <Text style={[styles.statValue, { color: MeruTheme.colors.success.primary }]}>
            74 Greed
          </Text>
        </View>
      </View>

      {/* Market List */}
      <FlatList
        data={filteredMarkets}
        keyExtractor={(item) => item.id}
        renderItem={renderMarketItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No markets found</Text>
            <Text style={styles.emptySubtitle}>Try a different search term</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    ...MeruTheme.typography.h1,
    color: MeruTheme.colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MeruTheme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 18,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    ...MeruTheme.typography.body,
    color: MeruTheme.colors.text.primary,
    paddingVertical: 14,
  },
  clearIcon: {
    fontSize: 14,
    color: MeruTheme.colors.text.tertiary,
    padding: 4,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: MeruTheme.radius.md,
    gap: 6,
  },
  tabActive: {
    backgroundColor: MeruTheme.colors.background.elevated,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
  },
  tabLabelActive: {
    color: MeruTheme.colors.text.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 20,
    height: 2,
    backgroundColor: MeruTheme.colors.accent.primary,
    borderRadius: 1,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.md,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...MeruTheme.typography.captionSmall,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 2,
  },
  statValue: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.primary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: MeruTheme.colors.border.subtle,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 8,
  },
  marketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  marketCardPressed: {
    backgroundColor: MeruTheme.colors.background.tertiary,
    transform: [{ scale: 0.98 }],
  },
  marketLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  marketIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  marketInfo: {
    flex: 1,
  },
  marketSymbol: {
    ...MeruTheme.typography.bodyMedium,
    color: MeruTheme.colors.text.primary,
  },
  marketName: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
  },
  marketChart: {
    paddingHorizontal: 8,
  },
  marketRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  marketPrice: {
    ...MeruTheme.typography.number,
    color: MeruTheme.colors.text.primary,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    ...MeruTheme.typography.captionSmall,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...MeruTheme.typography.h3,
    color: MeruTheme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...MeruTheme.typography.body,
    color: MeruTheme.colors.text.tertiary,
  },
});
