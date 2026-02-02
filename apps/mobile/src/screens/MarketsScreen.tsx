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
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency, formatPercent } from '../theme/meru';
import { MiniChart, generateChartData } from '../components/MiniChart';
import {
  CryptoIcon,
  EventsIcon,
  TrendingIcon,
  SearchIcon,
  FilterIcon,
  StocksIcon,
  PrivateIcon,
} from '../components/icons/TabBarIcons';
import { useTheme } from '../hooks/useTheme';
import { DEMO_STOCKS, DEMO_STOCK_QUOTES, formatMarketCap } from '../utils/mockStockData';
import { getMarketStatus, getSessionIcon } from '../utils/marketHours';
import {
  PRE_IPO_COMPANIES,
  STARTUP_COMPANIES,
  ATS_TOKENS,
  PRIVATE_LISTINGS,
  formatValuation,
  getRiskColor,
  getSectorIcon,
  getATSPlatformIcon,
  getTokenTypeLabel,
  getDealTypeLabel,
  getDealStatusColor,
  getDaysUntilClose,
  formatVolume,
  PrivateStockInstrument,
  ATSToken,
  PrivateListing,
} from '../utils/mockPrivateStockData';
import { usePrivateAccessStore, getUnlockedCount, getTotalListingsCount } from '../store/privateAccessStore';
import { InviteCodeModal } from '../components/InviteCodeModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'crypto' | 'stocks' | 'events' | 'private' | 'trending';
type PrivateSubTab = 'pre-ipo' | 'startups' | 'secondary-ats' | 'private-listing';

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

// Stock market data - derived from mock data
const STOCK_MARKETS = DEMO_STOCKS.slice(0, 12).map((stock) => {
  const quote = DEMO_STOCK_QUOTES[stock.symbol];
  return {
    id: `STOCK-${stock.symbol}`,
    symbol: stock.symbol,
    name: stock.name,
    price: quote?.price || 100,
    change24h: quote?.changePercent || 0,
    volume: formatMarketCap(quote?.volume || 0),
    marketCap: formatMarketCap(quote?.marketCap || 0),
    exchange: stock.exchange,
    color: getStockColor(stock.symbol),
    type: 'stock' as const,
  };
});

// Get a consistent color for each stock based on sector/symbol
function getStockColor(symbol: string): string {
  const colors: Record<string, string> = {
    AAPL: '#555555',
    MSFT: '#00a4ef',
    GOOGL: '#4285f4',
    AMZN: '#ff9900',
    META: '#0084ff',
    NVDA: '#76b900',
    TSLA: '#cc0000',
    JPM: '#0a66c2',
    BAC: '#e31837',
    V: '#1a1f71',
    MA: '#ff5f00',
    JNJ: '#d51900',
  };
  return colors[symbol] || '#6366f1';
}

export function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('crypto');
  const [privateSubTab, setPrivateSubTab] = useState<PrivateSubTab>('pre-ipo');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartData, setChartData] = useState<Record<string, number[]>>({});
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Get dynamic theme colors
  const theme = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Generate chart data for all markets
    const data: Record<string, number[]> = {};
    [...CRYPTO_MARKETS, ...EVENT_MARKETS, ...TRENDING, ...STOCK_MARKETS].forEach((market) => {
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

  // Market status for stocks
  const marketStatus = getMarketStatus();

  // Private access store for invite codes
  const { unlockedListingIds, getUnlockedListings, getLockedListings } = usePrivateAccessStore();

  const getMarkets = () => {
    switch (activeTab) {
      case 'crypto':
        return CRYPTO_MARKETS;
      case 'stocks':
        return STOCK_MARKETS;
      case 'events':
        return EVENT_MARKETS;
      case 'private':
        if (privateSubTab === 'pre-ipo') return PRE_IPO_COMPANIES;
        if (privateSubTab === 'startups') return STARTUP_COMPANIES;
        if (privateSubTab === 'secondary-ats') return ATS_TOKENS;
        if (privateSubTab === 'private-listing') return PRIVATE_LISTINGS;
        return PRE_IPO_COMPANIES;
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

  // Render private stock item (different layout)
  const renderPrivateStockItem = ({ item, index }: { item: PrivateStockInstrument; index: number }) => {
    const isStartup = item.category === 'startup';
    const priceChange = item.priceChange30d;

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
            styles.privateCard,
            { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
            pressed && [styles.marketCardPressed, { backgroundColor: theme.colors.background.tertiary }],
          ]}
          onPress={() =>
            navigation.navigate('PrivateStockDetail' as never, {
              symbol: item.symbol,
            } as never)
          }
        >
          {/* Top Row: Icon, Name, Valuation */}
          <View style={styles.privateTopRow}>
            <View style={styles.privateLeft}>
              <View style={[styles.privateIcon, { backgroundColor: theme.colors.accent.glow }]}>
                <Text style={[styles.privateIconText, { color: theme.colors.accent.primary }]}>
                  {getSectorIcon(item.sector)}
                </Text>
              </View>
              <View style={styles.privateInfo}>
                <View style={styles.symbolRow}>
                  <Text style={[styles.marketSymbol, { color: theme.colors.text.primary }]}>{item.name}</Text>
                </View>
                <View style={styles.privateBadges}>
                  <View style={[styles.stageBadge, { backgroundColor: theme.colors.background.elevated }]}>
                    <Text style={[styles.stageText, { color: theme.colors.text.secondary }]}>
                      {item.fundingStage}
                    </Text>
                  </View>
                  <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.riskLevel) + '20' }]}>
                    <Text style={[styles.riskText, { color: getRiskColor(item.riskLevel) }]}>
                      {item.riskLevel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.privateRight}>
              <Text style={[styles.valuationLabel, { color: theme.colors.text.tertiary }]}>Valuation</Text>
              <Text style={[styles.valuationValue, { color: theme.colors.text.primary }]}>
                {formatValuation(item.latestValuation)}
              </Text>
            </View>
          </View>

          {/* Bottom Row: Share Price, Change, Min Investment / Round Info */}
          <View style={styles.privateBottomRow}>
            <View style={styles.privateMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Share Price</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                ${item.sharePrice.toFixed(2)}
              </Text>
            </View>
            <View style={styles.privateMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>30d Change</Text>
              <Text style={[
                styles.metricValue,
                { color: priceChange >= 0 ? theme.colors.success.primary : theme.colors.error.primary }
              ]}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
              </Text>
            </View>
            {isStartup && item.currentRound ? (
              <View style={styles.privateMetric}>
                <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Round Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.background.elevated }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: theme.colors.accent.primary,
                          width: `${Math.min(100, (item.currentRound.raised / item.currentRound.targetRaise) * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.progressText, { color: theme.colors.accent.primary }]}>
                    {Math.round((item.currentRound.raised / item.currentRound.targetRaise) * 100)}%
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.privateMetric}>
                <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Min Investment</Text>
                <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                  ${item.minimumInvestment.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Startup: Current Round Info */}
          {isStartup && item.currentRound && (
            <View style={[styles.roundInfo, { backgroundColor: theme.colors.accent.glow, borderColor: theme.colors.accent.primary }]}>
              <Text style={[styles.roundText, { color: theme.colors.accent.primary }]}>
                {item.currentRound.stage} · Raising {formatValuation(item.currentRound.targetRaise)} · Closes {item.currentRound.closingDate.split('-').slice(1).join('/')}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  // Render ATS Token item
  const renderATSTokenItem = ({ item, index }: { item: ATSToken; index: number }) => {
    const priceChangeColor = item.priceChange24h >= 0 ? theme.colors.success.primary : theme.colors.error.primary;

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
            styles.atsCard,
            { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
            pressed && [styles.marketCardPressed, { backgroundColor: theme.colors.background.tertiary }],
          ]}
          onPress={() =>
            navigation.navigate('ATSTokenDetail' as never, {
              symbol: item.symbol,
            } as never)
          }
        >
          <View style={styles.atsTopRow}>
            <View style={styles.atsLeft}>
              <Text style={styles.atsPlatformIcon}>{getATSPlatformIcon(item.platform)}</Text>
              <View style={styles.atsInfo}>
                <Text style={[styles.marketSymbol, { color: theme.colors.text.primary }]}>{item.symbol}</Text>
                <Text style={[styles.marketName, { color: theme.colors.text.tertiary }]}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.atsRight}>
              <Text style={[styles.atsPrice, { color: theme.colors.text.primary }]}>
                ${item.currentPrice.toFixed(2)}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: item.priceChange24h >= 0 ? theme.colors.success.glow : theme.colors.error.glow }]}>
                <Text style={[styles.changeText, { color: priceChangeColor }]}>
                  {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.atsBottomRow}>
            <View style={styles.atsMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Volume 24h</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {formatVolume(item.volume24h)}
              </Text>
            </View>
            <View style={styles.atsMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Market Cap</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {formatValuation(item.marketCap)}
              </Text>
            </View>
            <View style={styles.atsMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Platform</Text>
              <Text style={[styles.metricValue, { color: theme.colors.accent.primary }]}>
                {item.platform}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Render Private Listing item (with locked/unlocked state)
  const renderPrivateListingItem = ({ item, index }: { item: PrivateListing; index: number }) => {
    const isUnlocked = unlockedListingIds.includes(item.id);
    const daysLeft = getDaysUntilClose(item.closingDate);
    const progressPercent = (item.amountRaised / item.targetRaise) * 100;
    const statusColor = getDealStatusColor(item.status);

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
            styles.listingCard,
            { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
            pressed && [styles.marketCardPressed, { backgroundColor: theme.colors.background.tertiary }],
            !isUnlocked && styles.listingCardLocked,
          ]}
          onPress={() => {
            if (isUnlocked) {
              navigation.navigate('PrivateListingDetail' as never, { id: item.id } as never);
            } else {
              // Show invite code modal
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowInviteModal(true);
            }
          }}
        >
          {/* Blur overlay for locked items */}
          {!isUnlocked && (
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockIcon}>🔐</Text>
              <Text style={[styles.lockedTitle, { color: theme.colors.text.primary }]}>
                INVITE ONLY
              </Text>
              <Text style={[styles.lockedSubtitle, { color: theme.colors.accent.primary }]}>
                Tap to enter your 6-digit code
              </Text>
            </View>
          )}

          <View style={[!isUnlocked && styles.blurredContent]}>
            <View style={styles.listingTopRow}>
              <View style={styles.listingLeft}>
                <View style={[styles.listingIcon, { backgroundColor: theme.colors.accent.glow }]}>
                  <Text style={styles.listingIconText}>{getSectorIcon(item.sector)}</Text>
                </View>
                <View style={styles.listingInfo}>
                  <Text style={[styles.marketSymbol, { color: theme.colors.text.primary }]}>{item.name}</Text>
                  <Text style={[styles.marketName, { color: theme.colors.text.tertiary }]}>
                    {getDealTypeLabel(item.dealType)} · {item.targetCompany}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {item.status.replace('-', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.listingProgress}>
              <View style={[styles.listingProgressBar, { backgroundColor: theme.colors.background.elevated }]}>
                <View
                  style={[
                    styles.listingProgressFill,
                    { backgroundColor: theme.colors.accent.primary, width: `${Math.min(progressPercent, 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.listingProgressText, { color: theme.colors.text.secondary }]}>
                {formatCurrency(item.amountRaised)} / {formatCurrency(item.targetRaise)} ({progressPercent.toFixed(0)}%)
              </Text>
            </View>

            <View style={styles.listingBottomRow}>
              <View style={styles.listingMetric}>
                <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Min</Text>
                <Text style={[styles.metricValue, { color: theme.colors.accent.primary }]}>
                  {formatCurrency(item.minimumInvestment)}
                </Text>
              </View>
              <View style={styles.listingMetric}>
                <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Investors</Text>
                <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                  {item.investorCount}
                </Text>
              </View>
              <View style={styles.listingMetric}>
                <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Closes</Text>
                <Text style={[styles.metricValue, { color: daysLeft <= 5 ? theme.colors.error.primary : theme.colors.text.primary }]}>
                  {daysLeft} days
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderMarketItem = ({ item, index }: { item: any; index: number }) => {
    const isEvent = activeTab === 'events';
    const isStock = activeTab === 'stocks';
    const isPrivate = activeTab === 'private';

    // Handle private subtabs with different renderers
    if (isPrivate) {
      if (privateSubTab === 'secondary-ats') {
        return renderATSTokenItem({ item: item as ATSToken, index });
      }
      if (privateSubTab === 'private-listing') {
        return renderPrivateListingItem({ item: item as PrivateListing, index });
      }
      return renderPrivateStockItem({ item: item as PrivateStockInstrument, index });
    }

    // For stocks, navigate with the symbol directly
    const instrumentId = isStock ? item.symbol : item.id;

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
            { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
            pressed && [styles.marketCardPressed, { backgroundColor: theme.colors.background.tertiary }],
          ]}
          onPress={() =>
            navigation.navigate('InstrumentDetail' as never, {
              instrumentId,
              assetType: isStock ? 'stock' : isEvent ? 'event' : 'crypto',
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
              <View style={styles.symbolRow}>
                <Text style={[styles.marketSymbol, { color: theme.colors.text.primary }]}>{item.symbol}</Text>
                {isStock && (
                  <View style={[styles.exchangeBadge, { backgroundColor: theme.colors.background.elevated }]}>
                    <Text style={[styles.exchangeText, { color: theme.colors.text.tertiary }]}>
                      {item.exchange}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.marketName, { color: theme.colors.text.tertiary }]} numberOfLines={1}>
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
            <Text style={[styles.marketPrice, { color: theme.colors.text.primary }]}>
              {isEvent ? `${(item.price * 100).toFixed(0)}¢` : formatCurrency(item.price)}
            </Text>
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor:
                    item.change24h >= 0
                      ? theme.colors.success.glow
                      : theme.colors.error.glow,
                },
              ]}
            >
              <Text
                style={[
                  styles.changeText,
                  {
                    color:
                      item.change24h >= 0
                        ? theme.colors.success.primary
                        : theme.colors.error.primary,
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

  const tabs: { id: TabType; label: string; IconComponent: React.FC<{ size?: number; color?: string; focused?: boolean }> }[] = [
    { id: 'crypto', label: 'Crypto', IconComponent: CryptoIcon },
    { id: 'stocks', label: 'Stocks', IconComponent: StocksIcon },
    { id: 'private', label: 'Private', IconComponent: PrivateIcon },
    { id: 'events', label: 'Events', IconComponent: EventsIcon },
    { id: 'trending', label: 'Trending', IconComponent: TrendingIcon },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
      {/* Background */}
      <LinearGradient
        colors={[
          theme.colors.background.secondary,
          theme.colors.background.primary,
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
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Markets</Text>
        <View style={styles.headerRight}>
          <Pressable style={[styles.filterButton, { backgroundColor: theme.colors.background.secondary }]}>
            <FilterIcon size={20} color={theme.colors.text.secondary} />
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
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
          <View style={styles.searchIconWrapper}>
            <SearchIcon size={18} color={theme.colors.text.tertiary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search markets..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearIcon, { color: theme.colors.text.tertiary }]}>✕</Text>
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
        <View style={[styles.tabsWrapper, { backgroundColor: theme.colors.background.secondary }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.tab,
                  isActive && [styles.tabActive, { backgroundColor: theme.colors.background.elevated }],
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id);
                }}
              >
                <tab.IconComponent
                  size={16}
                  focused={isActive}
                  color={isActive ? theme.colors.accent.primary : theme.colors.text.tertiary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: theme.colors.text.tertiary },
                    isActive && [styles.tabLabelActive, { color: theme.colors.text.primary }],
                  ]}
                >
                  {tab.label}
                </Text>
                {isActive && <View style={[styles.tabIndicator, { backgroundColor: theme.colors.accent.primary }]} />}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Private Subtabs */}
      {activeTab === 'private' && (
        <View style={styles.subTabsContainer}>
          <View style={[styles.subTabsWrapper, { backgroundColor: theme.colors.background.secondary }]}>
            <Pressable
              style={[
                styles.subTab,
                privateSubTab === 'pre-ipo' && [styles.subTabActive, { backgroundColor: theme.colors.accent.glow }],
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPrivateSubTab('pre-ipo');
              }}
            >
              <Text style={[
                styles.subTabLabel,
                { color: theme.colors.text.tertiary },
                privateSubTab === 'pre-ipo' && { color: theme.colors.accent.primary, fontWeight: '600' },
              ]}>
                Pre-IPO
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.subTab,
                privateSubTab === 'startups' && [styles.subTabActive, { backgroundColor: theme.colors.accent.glow }],
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPrivateSubTab('startups');
              }}
            >
              <Text style={[
                styles.subTabLabel,
                { color: theme.colors.text.tertiary },
                privateSubTab === 'startups' && { color: theme.colors.accent.primary, fontWeight: '600' },
              ]}>
                Startups
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.subTab,
                privateSubTab === 'secondary-ats' && [styles.subTabActive, { backgroundColor: theme.colors.accent.glow }],
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPrivateSubTab('secondary-ats');
              }}
            >
              <Text style={[
                styles.subTabLabel,
                { color: theme.colors.text.tertiary },
                privateSubTab === 'secondary-ats' && { color: theme.colors.accent.primary, fontWeight: '600' },
              ]}>
                ATS
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.subTab,
                privateSubTab === 'private-listing' && [styles.subTabActive, { backgroundColor: theme.colors.accent.glow }],
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPrivateSubTab('private-listing');
              }}
            >
              <Text style={[
                styles.subTabLabel,
                { color: theme.colors.text.tertiary },
                privateSubTab === 'private-listing' && { color: theme.colors.accent.primary, fontWeight: '600' },
              ]}>
                {unlockedListingIds.length > 0 ? 'Private' : 'Private 🔒'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Market Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
        {activeTab === 'stocks' ? (
          <>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Market</Text>
              <Text style={[styles.statValue, { color: marketStatus.session === 'regular' ? theme.colors.success.primary : theme.colors.text.muted }]}>
                {getSessionIcon(marketStatus.session)} {marketStatus.sessionLabel}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>S&P 500</Text>
              <Text style={[styles.statValue, { color: theme.colors.success.primary }]}>+0.85%</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>NASDAQ</Text>
              <Text style={[styles.statValue, { color: theme.colors.success.primary }]}>+1.23%</Text>
            </View>
          </>
        ) : activeTab === 'private' ? (
          privateSubTab === 'secondary-ats' ? (
            <>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Tokens</Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {ATS_TOKENS.length}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Total MCap</Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>$472M</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Settlement</Text>
                <Text style={[styles.statValue, { color: theme.colors.success.primary }]}>T+0/T+1</Text>
              </View>
            </>
          ) : privateSubTab === 'private-listing' ? (
            <>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Deals</Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {unlockedListingIds.length}/{PRIVATE_LISTINGS.length}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Access</Text>
                <Text style={[styles.statValue, { color: unlockedListingIds.length > 0 ? theme.colors.success.primary : theme.colors.text.muted }]}>
                  {unlockedListingIds.length > 0 ? 'Unlocked' : 'Invite Only'}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Total Raise</Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>$148M</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>
                  {privateSubTab === 'pre-ipo' ? 'Companies' : 'Active Rounds'}
                </Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {privateSubTab === 'pre-ipo' ? PRE_IPO_COMPANIES.length : STARTUP_COMPANIES.length}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Total Value</Text>
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {privateSubTab === 'pre-ipo' ? '$598B' : '$17.5B'}
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Avg Return</Text>
                <Text style={[styles.statValue, { color: theme.colors.success.primary }]}>
                  {privateSubTab === 'pre-ipo' ? '+12.4%' : '+18.7%'}
                </Text>
              </View>
            </>
          )
        ) : (
          <>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>24h Volume</Text>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>$89.4B</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>BTC Dom</Text>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>52.3%</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Fear/Greed</Text>
              <Text style={[styles.statValue, { color: theme.colors.success.primary }]}>
                74 Greed
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Market List */}
      <FlatList
        data={filteredMarkets}
        keyExtractor={(item) => item.id || item.symbol}
        renderItem={renderMarketItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <SearchIcon size={48} color={theme.colors.text.tertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>No markets found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text.tertiary }]}>Try a different search term</Text>
          </View>
        }
      />

      {/* Invite Code Modal */}
      <InviteCodeModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={(count) => {
          // Haptic feedback on success
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
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
  searchIconWrapper: {
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
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marketSymbol: {
    ...MeruTheme.typography.bodyMedium,
    color: MeruTheme.colors.text.primary,
  },
  exchangeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: MeruTheme.colors.background.elevated,
  },
  exchangeText: {
    fontSize: 9,
    fontWeight: '600',
    color: MeruTheme.colors.text.tertiary,
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
  emptyIconWrapper: {
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
  // Private Subtabs
  subTabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subTabsWrapper: {
    flexDirection: 'row',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.md,
    padding: 4,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: MeruTheme.radius.sm,
  },
  subTabActive: {
    backgroundColor: MeruTheme.colors.accent.glow,
  },
  subTabLabel: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
  },
  // Private Stock Card
  privateCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  privateTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  privateLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  privateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateIconText: {
    fontSize: 20,
  },
  privateInfo: {
    flex: 1,
  },
  privateBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: MeruTheme.colors.background.elevated,
  },
  stageText: {
    fontSize: 10,
    fontWeight: '600',
    color: MeruTheme.colors.text.secondary,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  privateRight: {
    alignItems: 'flex-end',
  },
  valuationLabel: {
    fontSize: 10,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 2,
  },
  valuationValue: {
    ...MeruTheme.typography.bodyMedium,
    color: MeruTheme.colors.text.primary,
    fontWeight: '600',
  },
  privateBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  privateMetric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 2,
  },
  metricValue: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.primary,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: MeruTheme.colors.background.elevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
  },
  roundInfo: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: MeruTheme.radius.sm,
    borderWidth: 1,
  },
  roundText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  // ATS Token Card Styles
  atsCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  atsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  atsLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  atsPlatformIcon: {
    fontSize: 28,
  },
  atsInfo: {
    flex: 1,
  },
  atsRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  atsPrice: {
    ...MeruTheme.typography.number,
    fontSize: 18,
    fontWeight: '700',
  },
  atsBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
  },
  atsMetric: {
    flex: 1,
    alignItems: 'center',
  },
  // Private Listing Card Styles
  listingCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
    position: 'relative',
    overflow: 'hidden',
  },
  listingCardLocked: {
    opacity: 1,
    minHeight: 140,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 10, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: MeruTheme.radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(240, 180, 41, 0.3)',
    borderStyle: 'dashed',
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 6,
  },
  lockedSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  blurredContent: {
    opacity: 0.3,
  },
  listingTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingIconText: {
    fontSize: 20,
  },
  listingInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listingProgress: {
    marginBottom: 12,
  },
  listingProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  listingProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  listingProgressText: {
    fontSize: 11,
    textAlign: 'center',
  },
  listingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: MeruTheme.colors.border.subtle,
  },
  listingMetric: {
    flex: 1,
    alignItems: 'center',
  },
});
