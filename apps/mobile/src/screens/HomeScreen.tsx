// ============================================================================
// Meru Home Screen - Premium Dashboard Experience
// ============================================================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency, formatPercent } from '../theme/meru';
import { formatCryptoQuantity } from '../utils/mockData';
import { DepositIcon, WithdrawIcon, SwapIcon, SendIcon, BellIcon } from '../components/icons/TabBarIcons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useFundingStore } from '../store/fundingStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { useUserProfileStore } from '../store/userProfileStore';
import { useTheme } from '../hooks/useTheme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { MiniChart, generateChartData } from '../components/MiniChart';
import { PortfolioChart } from '../components/PortfolioChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Demo prices for crypto assets
const DEMO_PRICES: Record<string, { price: number; change24h: number }> = {
  BTC: { price: 67234.89, change24h: 2.34 },
  ETH: { price: 3456.78, change24h: -1.23 },
  SOL: { price: 178.45, change24h: 5.67 },
  AVAX: { price: 42.89, change24h: 3.21 },
  USDC: { price: 1.00, change24h: 0.01 },
  USDT: { price: 1.00, change24h: -0.01 },
  DOGE: { price: 0.1234, change24h: 4.56 },
  XRP: { price: 0.5678, change24h: -2.34 },
  MATIC: { price: 0.89, change24h: 1.23 },
};

// Demo prices for event contracts (probability-based, 0-1 scale)
const EVENT_PRICES: Record<string, { probability: number; change24h: number }> = {
  'FED-RATE-MAR': { probability: 0.42, change24h: 8.5 },
  'BTC-100K-Q1': { probability: 0.28, change24h: -4.2 },
  'ETH-ETF-APR': { probability: 0.65, change24h: 12.3 },
  'AI-BREAKTHROUGH': { probability: 0.55, change24h: 3.1 },
};

// Check if symbol is an event contract
const isEventContract = (symbol: string): boolean => {
  return symbol in EVENT_PRICES || symbol.includes('-') && !symbol.endsWith('-USD');
};

const CHANGE_24H = 3247.89;
const CHANGE_PERCENT_24H = 2.61;

// Quick actions with navigation
const QUICK_ACTIONS: { id: string; IconComponent: React.FC<{ size?: number; color?: string }>; label: string; screen: keyof RootStackParamList }[] = [
  { id: 'deposit', IconComponent: DepositIcon, label: 'Deposit', screen: 'Deposit' },
  { id: 'withdraw', IconComponent: WithdrawIcon, label: 'Withdraw', screen: 'Withdraw' },
  { id: 'swap', IconComponent: SwapIcon, label: 'Swap', screen: 'Swap' },
  { id: 'send', IconComponent: SendIcon, label: 'Send', screen: 'Send' },
];

// Mock notifications data
const NOTIFICATIONS = [
  {
    id: '1',
    type: 'price_alert',
    title: 'BTC Price Alert',
    message: 'Bitcoin reached $67,000 - up 2.3% today',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    type: 'trade',
    title: 'Order Filled',
    message: 'Your buy order for 0.05 ETH was filled at $3,456',
    time: '1h ago',
    read: false,
  },
  {
    id: '3',
    type: 'deposit',
    title: 'Deposit Complete',
    message: '$500.00 has been added to your account',
    time: '3h ago',
    read: true,
  },
  {
    id: '4',
    type: 'event',
    title: 'Event Contract Update',
    message: 'FED-RATE-MAR probability moved to 42%',
    time: '5h ago',
    read: true,
  },
  {
    id: '5',
    type: 'promo',
    title: 'Earn Rewards',
    message: 'Refer a friend and earn $25 in BTC',
    time: '1d ago',
    read: true,
  },
];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get dynamic theme colors
  const theme = useTheme();

  // Get current user profile
  const currentProfile = useUserProfileStore((state) => state.getCurrentProfile());

  // Get cash balance from funding store
  const { cashBalance } = useFundingStore();

  // Get holdings from portfolio store
  const { holdings } = usePortfolioStore();

  // Calculate total holdings value using demo prices
  const holdingsValue = holdings.reduce((total, h) => {
    if (isEventContract(h.symbol)) {
      // Event contracts: value = quantity * probability * $1 (max payout)
      const eventInfo = EVENT_PRICES[h.symbol];
      const probability = eventInfo?.probability || 0.5;
      return total + h.quantity * probability;
    }
    const priceInfo = DEMO_PRICES[h.symbol];
    const price = priceInfo?.price || 0;
    return total + h.quantity * price;
  }, 0);

  // Calculate total portfolio value including cash deposits
  const totalPortfolioValue = holdingsValue + cashBalance;

  // Build assets array from holdings with current prices
  const ASSETS = holdings.map((h) => {
    const isEvent = isEventContract(h.symbol);

    if (isEvent) {
      const eventInfo = EVENT_PRICES[h.symbol] || { probability: 0.5, change24h: 0 };
      return {
        id: h.symbol,
        name: h.name,
        symbol: h.symbol,
        price: eventInfo.probability, // Store as probability (0-1)
        change24h: eventInfo.change24h,
        holdings: h.quantity,
        value: h.quantity * eventInfo.probability, // Value based on probability
        color: h.color,
        isEvent: true,
      };
    }

    const priceInfo = DEMO_PRICES[h.symbol] || { price: 0, change24h: 0 };
    return {
      id: h.symbol,
      name: h.name,
      symbol: h.symbol,
      price: priceInfo.price,
      change24h: priceInfo.change24h,
      holdings: h.quantity,
      value: h.quantity * priceInfo.price,
      color: h.color,
      isEvent: false,
    };
  });

  const handleQuickAction = (screen: keyof RootStackParamList) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate(screen as any);
  };

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [chartData, setChartData] = useState<Record<string, number[]>>({});

  useEffect(() => {
    // Generate chart data for each asset
    const data: Record<string, number[]> = {};
    ASSETS.forEach((asset) => {
      const trend = asset.change24h > 0 ? 'up' : asset.change24h < 0 ? 'down' : 'neutral';
      data[asset.id] = generateChartData(asset.price, 0.015, 24, trend);
    });
    setChartData(data);

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Regenerate chart data
    const data: Record<string, number[]> = {};
    ASSETS.forEach((asset) => {
      const trend = asset.change24h > 0 ? 'up' : asset.change24h < 0 ? 'down' : 'neutral';
      data[asset.id] = generateChartData(asset.price, 0.015, 24, trend);
    });
    setChartData(data);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
      {/* Background Gradient - Rich multi-layer effect */}
      <LinearGradient
        colors={[
          theme.colors.accent.primary + '18',
          theme.colors.accent.secondary + '08',
          theme.colors.background.primary,
          theme.colors.background.primary,
        ]}
        locations={[0, 0.15, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.colors.text.secondary }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: theme.colors.text.primary }]}>{currentProfile.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.notificationButton, { backgroundColor: theme.colors.background.secondary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowNotifications(true);
              }}
            >
              <View style={[styles.notificationDot, { backgroundColor: theme.colors.accent.primary }]} />
              <BellIcon size={22} color={theme.colors.text.primary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Portfolio Chart */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(slideAnim, 1.2) }],
          }}
        >
          <PortfolioChart
            currentValue={totalPortfolioValue}
            change24h={CHANGE_24H}
            changePercent24h={CHANGE_PERCENT_24H}
            holdings={holdings.map(h => ({ symbol: h.symbol, quantity: h.quantity }))}
            prices={Object.fromEntries(
              Object.entries(DEMO_PRICES).map(([k, v]) => [k, v.price])
            )}
          />
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.quickActionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 1.5) }],
            },
          ]}
        >
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={({ pressed }) => [
                styles.quickActionButton,
                pressed && styles.quickActionButtonPressed,
              ]}
              onPress={() => handleQuickAction(action.screen)}
            >
              <LinearGradient
                colors={[
                  theme.colors.background.tertiary,
                  theme.colors.background.secondary,
                ]}
                style={[styles.quickActionGradient, { borderColor: theme.colors.border.light }]}
              >
                <action.IconComponent size={26} color={theme.colors.accent.primary} />
              </LinearGradient>
              <Text style={[styles.quickActionLabel, { color: theme.colors.text.secondary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Assets Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 1.8) }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Your Assets</Text>
            <Pressable onPress={() => navigation.navigate('Portfolio' as never)}>
              <Text style={[styles.seeAllButton, { color: theme.colors.accent.primary }]}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.assetsContainer}>
            {ASSETS.map((asset, index) => (
              <Pressable
                key={asset.id}
                style={({ pressed }) => [
                  styles.assetCard,
                  { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
                  pressed && [styles.assetCardPressed, { backgroundColor: theme.colors.background.tertiary }],
                ]}
                onPress={() =>
                  navigation.navigate('InstrumentDetail' as never, {
                    instrumentId: asset.isEvent ? asset.symbol : `${asset.symbol}-USD`,
                  } as never)
                }
              >
                <View style={styles.assetLeft}>
                  <LinearGradient
                    colors={[asset.color, asset.color + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.assetIcon}
                  >
                    <Text style={styles.assetIconText}>
                      {asset.isEvent ? '📊' : asset.symbol[0]}
                    </Text>
                  </LinearGradient>
                  <View style={styles.assetInfo}>
                    <Text style={[styles.assetName, { color: theme.colors.text.primary }]}>{asset.name}</Text>
                    <Text style={[styles.assetHoldings, { color: theme.colors.text.tertiary }]}>
                      {asset.isEvent
                        ? `${Math.floor(asset.holdings)} contracts`
                        : `${formatCryptoQuantity(asset.holdings, asset.symbol)} ${asset.symbol}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.assetMiddle}>
                  <MiniChart
                    data={chartData[asset.id] || []}
                    width={60}
                    height={28}
                    positive={asset.change24h >= 0}
                    strokeWidth={1.5}
                  />
                </View>

                <View style={styles.assetRight}>
                  <Text style={[styles.assetValue, { color: theme.colors.text.primary }]}>
                    {asset.isEvent
                      ? `${(asset.price * 100).toFixed(0)}¢`
                      : formatCurrency(asset.value)}
                  </Text>
                  <Text
                    style={[
                      styles.assetChange,
                      {
                        color:
                          asset.change24h >= 0
                            ? theme.colors.success.primary
                            : theme.colors.error.primary,
                      },
                    ]}
                  >
                    {formatPercent(asset.change24h)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Market Movers */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, 2) }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Market Movers</Text>
            <Pressable onPress={() => navigation.navigate('Markets' as never)}>
              <Text style={[styles.seeAllButton, { color: theme.colors.accent.primary }]}>See All</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moversScrollContent}
          >
            {[
              { symbol: 'PEPE', name: 'Pepe', price: 0.0000089, change: 24.5, color: '#00a859' },
              { symbol: 'WIF', name: 'dogwifhat', price: 2.34, change: 18.2, color: '#ff6b35' },
              { symbol: 'BONK', name: 'Bonk', price: 0.000023, change: -12.3, color: '#ff9500' },
              { symbol: 'RENDER', name: 'Render', price: 8.45, change: 15.7, color: '#00d4aa' },
            ].map((token) => (
              <Pressable
                key={token.symbol}
                style={({ pressed }) => [
                  styles.moverCard,
                  { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
                  pressed && [styles.moverCardPressed, { backgroundColor: theme.colors.background.tertiary }],
                ]}
              >
                <LinearGradient
                  colors={[token.color, token.color + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.moverIcon}
                >
                  <Text style={styles.moverIconText}>
                    {token.symbol[0]}
                  </Text>
                </LinearGradient>
                <Text style={[styles.moverSymbol, { color: theme.colors.text.primary }]}>{token.symbol}</Text>
                <Text style={[styles.moverPrice, { color: theme.colors.text.secondary }]}>
                  ${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.moverChangeBadge,
                    {
                      backgroundColor:
                        token.change >= 0
                          ? theme.colors.success.glow
                          : theme.colors.error.glow,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.moverChange,
                      {
                        color:
                          token.change >= 0
                            ? theme.colors.success.primary
                            : theme.colors.error.primary,
                      },
                    ]}
                  >
                    {formatPercent(token.change)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowNotifications(false)}
          />
          <Animated.View style={[styles.notificationsPanel, { backgroundColor: theme.colors.background.elevated, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.notificationsPanelHeader}>
              <View style={styles.panelHandle} />
              <Text style={[styles.notificationsPanelTitle, { color: theme.colors.text.primary }]}>Notifications</Text>
              <Pressable
                style={[styles.markAllReadButton, { backgroundColor: theme.colors.background.tertiary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.markAllReadText, { color: theme.colors.accent.primary }]}>Mark all read</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              {NOTIFICATIONS.map((notification) => (
                <Pressable
                  key={notification.id}
                  style={({ pressed }) => [
                    styles.notificationItem,
                    { backgroundColor: pressed ? theme.colors.background.tertiary : 'transparent' },
                    !notification.read && { backgroundColor: theme.colors.accent.primary + '08' },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowNotifications(false);
                    // Navigate based on notification type
                    if (notification.type === 'trade') {
                      navigation.navigate('Portfolio' as never);
                    } else if (notification.type === 'deposit') {
                      navigation.navigate('Deposit' as never);
                    } else if (notification.type === 'price_alert') {
                      navigation.navigate('InstrumentDetail' as never, { instrumentId: 'BTC-USD' } as never);
                    }
                  }}
                >
                  <View style={[
                    styles.notificationIconContainer,
                    { backgroundColor: theme.colors.background.secondary },
                    notification.type === 'price_alert' && { backgroundColor: theme.colors.success.glow },
                    notification.type === 'trade' && { backgroundColor: theme.colors.accent.primary + '20' },
                    notification.type === 'deposit' && { backgroundColor: theme.colors.success.glow },
                    notification.type === 'event' && { backgroundColor: '#f59e0b' + '20' },
                    notification.type === 'promo' && { backgroundColor: theme.colors.accent.secondary + '20' },
                  ]}>
                    <Text style={styles.notificationIcon}>
                      {notification.type === 'price_alert' && '📈'}
                      {notification.type === 'trade' && '✓'}
                      {notification.type === 'deposit' && '💰'}
                      {notification.type === 'event' && '📊'}
                      {notification.type === 'promo' && '🎁'}
                    </Text>
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={[styles.notificationTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View style={[styles.unreadDot, { backgroundColor: theme.colors.accent.primary }]} />
                      )}
                    </View>
                    <Text style={[styles.notificationMessage, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={[styles.notificationTime, { color: theme.colors.text.tertiary }]}>
                      {notification.time}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MeruTheme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerLeft: {},
  greeting: {
    fontSize: 15,
    fontWeight: '400',
    color: MeruTheme.colors.text.secondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: MeruTheme.colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MeruTheme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MeruTheme.colors.accent.primary,
    zIndex: 1,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  quickActionGradient: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.light,
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionLabel: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.secondary,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: MeruTheme.colors.text.primary,
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
  },
  assetsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  assetCardPressed: {
    backgroundColor: MeruTheme.colors.background.tertiary,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  assetLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  assetInfo: {
    gap: 2,
  },
  assetName: {
    ...MeruTheme.typography.bodyMedium,
    color: MeruTheme.colors.text.primary,
  },
  assetHoldings: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
  },
  assetMiddle: {
    paddingHorizontal: 12,
  },
  assetRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  assetValue: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: MeruTheme.colors.text.primary,
  },
  assetChange: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  moversScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  moverCard: {
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.lg,
    padding: 16,
    width: 130,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  moverCardPressed: {
    backgroundColor: MeruTheme.colors.background.tertiary,
    transform: [{ scale: 0.97 }],
  },
  moverIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moverIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moverSymbol: {
    ...MeruTheme.typography.bodyMedium,
    color: MeruTheme.colors.text.primary,
  },
  moverPrice: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.secondary,
  },
  moverChangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moverChange: {
    ...MeruTheme.typography.captionSmall,
    fontWeight: '600',
  },
  // Notifications Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  notificationsPanel: {
    backgroundColor: MeruTheme.colors.background.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  notificationsPanelHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: MeruTheme.colors.border.subtle,
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: MeruTheme.colors.border.light,
    marginBottom: 16,
  },
  notificationsPanelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MeruTheme.colors.text.primary,
    marginBottom: 12,
  },
  markAllReadButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: MeruTheme.colors.background.tertiary,
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: MeruTheme.colors.accent.primary,
  },
  notificationsList: {
    paddingHorizontal: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: MeruTheme.colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MeruTheme.colors.accent.primary,
  },
  notificationMessage: {
    fontSize: 14,
    color: MeruTheme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: MeruTheme.colors.text.tertiary,
    marginTop: 6,
  },
});
