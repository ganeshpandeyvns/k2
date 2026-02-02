// ============================================================================
// ATS Token Detail Screen - Security Token Trading
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency } from '../theme/meru';
import { useTheme } from '../hooks/useTheme';
import {
  ATS_TOKEN_MAP,
  ATSToken,
  getATSPlatformIcon,
  getTokenTypeLabel,
  formatValuation,
  formatVolume,
} from '../utils/mockPrivateStockData';
import {
  usePrivateOrderBookStore,
  getBestBidAsk,
  OrderBookEntry,
} from '../store/privateOrderBookStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = {
  ATSTokenDetail: {
    symbol: string;
  };
};

export function ATSTokenDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ATSTokenDetail'>>();
  const { symbol } = route.params;
  const theme = useTheme();

  const { getOrderBook, getUserOrders } = usePrivateOrderBookStore();

  // Get token data
  const token = ATS_TOKEN_MAP[symbol];
  const orderBook = getOrderBook(symbol);
  const userOrders = getUserOrders(symbol);
  const { bestBid, bestAsk, spread } = getBestBidAsk(symbol);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!token) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Token not found
          </Text>
        </View>
      </View>
    );
  }

  const priceChangeColor = token.priceChange24h >= 0 ? theme.colors.success.primary : theme.colors.error.primary;
  const spreadPercent = bestBid > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0;

  const handleTrade = (side: 'bid' | 'ask') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ATSTokenTrade' as never, {
      symbol: token.symbol,
      side,
      suggestedPrice: side === 'bid' ? bestBid : bestAsk,
    } as never);
  };

  const renderOrderBookLevel = (entry: OrderBookEntry, side: 'bid' | 'ask', maxQty: number) => {
    const fillPercent = (entry.quantity / maxQty) * 100;
    const color = side === 'bid' ? theme.colors.success.primary : theme.colors.error.primary;

    return (
      <View key={`${side}-${entry.price}`} style={styles.orderBookRow}>
        <View
          style={[
            styles.orderBookFill,
            {
              backgroundColor: color + '20',
              width: `${fillPercent}%`,
              [side === 'bid' ? 'left' : 'right']: 0,
            },
          ]}
        />
        <Text style={[styles.orderBookPrice, { color }]}>${entry.price.toFixed(2)}</Text>
        <Text style={[styles.orderBookQty, { color: theme.colors.text.secondary }]}>
          {entry.quantity.toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.text.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.platformIcon}>{getATSPlatformIcon(token.platform)}</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>{token.symbol}</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.tertiary }]}>
            {token.platform} · {getTokenTypeLabel(token.tokenType)}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Price Section */}
        <Animated.View
          style={[
            styles.priceSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.tokenName, { color: theme.colors.text.primary }]}>{token.name}</Text>
          <Text style={[styles.currentPrice, { color: theme.colors.text.primary }]}>
            ${token.currentPrice.toFixed(2)}
          </Text>
          <View style={styles.priceChangeRow}>
            <Text style={[styles.priceChange, { color: priceChangeColor }]}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </Text>
            <Text style={[styles.priceChangeLabel, { color: theme.colors.text.tertiary }]}>24h</Text>
            <Text style={[styles.priceChange7d, { color: token.priceChange7d >= 0 ? theme.colors.success.primary : theme.colors.error.primary }]}>
              {token.priceChange7d >= 0 ? '+' : ''}{token.priceChange7d.toFixed(2)}%
            </Text>
            <Text style={[styles.priceChangeLabel, { color: theme.colors.text.tertiary }]}>7d</Text>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View
          style={[
            styles.statsRow,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Volume 24h</Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {formatVolume(token.volume24h)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Market Cap</Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {formatValuation(token.marketCap)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}>
            <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Spread</Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {spreadPercent.toFixed(2)}%
            </Text>
          </View>
        </Animated.View>

        {/* Order Book */}
        <Animated.View
          style={[
            styles.orderBookSection,
            { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Order Book</Text>

          <View style={styles.orderBookHeader}>
            <Text style={[styles.orderBookHeaderText, { color: theme.colors.text.tertiary }]}>Price</Text>
            <Text style={[styles.orderBookHeaderText, { color: theme.colors.text.tertiary }]}>Quantity</Text>
          </View>

          {/* Asks (reversed to show lowest at bottom) */}
          <View style={styles.asksContainer}>
            {[...orderBook.asks].reverse().slice(0, 5).map((entry) =>
              renderOrderBookLevel(entry, 'ask', Math.max(...orderBook.asks.map((a) => a.quantity)))
            )}
          </View>

          {/* Spread indicator */}
          <View style={[styles.spreadIndicator, { backgroundColor: theme.colors.background.tertiary }]}>
            <Text style={[styles.spreadText, { color: theme.colors.accent.primary }]}>
              Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(2)}%)
            </Text>
          </View>

          {/* Bids */}
          <View style={styles.bidsContainer}>
            {orderBook.bids.slice(0, 5).map((entry) =>
              renderOrderBookLevel(entry, 'bid', Math.max(...orderBook.bids.map((b) => b.quantity)))
            )}
          </View>
        </Animated.View>

        {/* Token Info */}
        <Animated.View
          style={[
            styles.infoSection,
            { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Token Information</Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Underlying Asset</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{token.underlyingAsset}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Issuer</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{token.issuer}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Issuance Date</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{token.issuanceDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Total Supply</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {token.totalSupply.toLocaleString()} tokens
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Circulating</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
              {token.circulatingSupply.toLocaleString()} tokens
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Settlement</Text>
            <Text style={[styles.infoValue, { color: theme.colors.success.primary }]}>{token.settlementTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Trading Hours</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{token.tradingHours}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Min Order</Text>
            <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>${token.minimumOrder}</Text>
          </View>

          {token.accreditedOnly && (
            <View style={[styles.accreditedBadge, { backgroundColor: theme.colors.accent.primary + '20' }]}>
              <Text style={[styles.accreditedText, { color: theme.colors.accent.primary }]}>
                Accredited Investors Only
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Description */}
        <Animated.View
          style={[
            styles.descriptionSection,
            { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>About</Text>
          <Text style={[styles.descriptionText, { color: theme.colors.text.secondary }]}>
            {token.description}
          </Text>
        </Animated.View>

        {/* Pending Orders */}
        {userOrders.length > 0 && (
          <Animated.View
            style={[
              styles.ordersSection,
              { backgroundColor: theme.colors.background.secondary, opacity: fadeAnim },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Your Orders</Text>
            {userOrders.slice(0, 5).map((order) => (
              <View key={order.id} style={styles.orderRow}>
                <View>
                  <Text style={[styles.orderType, { color: order.side === 'bid' ? theme.colors.success.primary : theme.colors.error.primary }]}>
                    {order.side === 'bid' ? 'BUY' : 'SELL'}
                  </Text>
                  <Text style={[styles.orderDetails, { color: theme.colors.text.secondary }]}>
                    {order.quantity} @ ${order.price.toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.orderStatusBadge, { backgroundColor: theme.colors.accent.glow }]}>
                  <Text style={[styles.orderStatus, { color: theme.colors.accent.primary }]}>
                    {order.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Demo Notice */}
        <View style={[styles.demoNotice, { backgroundColor: theme.colors.accent.glow }]}>
          <Text style={[styles.demoText, { color: theme.colors.accent.primary }]}>
            Demo Mode - Simulated ATS Trading
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.subtle }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.buyButton, { backgroundColor: theme.colors.success.primary }]}
          onPress={() => handleTrade('bid')}
        >
          <Text style={styles.actionButtonText}>Buy</Text>
          <Text style={styles.actionButtonPrice}>${bestAsk.toFixed(2)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.sellButton, { backgroundColor: theme.colors.error.primary }]}
          onPress={() => handleTrade('ask')}
        >
          <Text style={styles.actionButtonText}>Sell</Text>
          <Text style={styles.actionButtonPrice}>${bestBid.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceChange7d: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  priceChangeLabel: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderBookSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  orderBookHeaderText: {
    fontSize: 11,
    fontWeight: '500',
  },
  asksContainer: {
    marginBottom: 4,
  },
  bidsContainer: {
    marginTop: 4,
  },
  orderBookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    position: 'relative',
  },
  orderBookFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  orderBookPrice: {
    fontSize: 13,
    fontWeight: '600',
    zIndex: 1,
  },
  orderBookQty: {
    fontSize: 13,
    zIndex: 1,
  },
  spreadIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 4,
  },
  spreadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  infoLabel: {
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  accreditedBadge: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  accreditedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  ordersSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  orderType: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  demoNotice: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  demoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButton: {},
  sellButton: {},
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonPrice: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
