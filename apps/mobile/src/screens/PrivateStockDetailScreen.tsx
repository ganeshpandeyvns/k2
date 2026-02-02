// ============================================================================
// Private Stock Detail Screen - Pre-IPO & Startup Investment Details
// ============================================================================

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency } from '../theme/meru';
import { useTheme } from '../hooks/useTheme';
import {
  PRIVATE_STOCK_MAP,
  formatValuation,
  getRiskColor,
  getSectorIcon,
  formatFundingProgress,
  PrivateStockInstrument,
} from '../utils/mockPrivateStockData';
import {
  usePrivateOrderBookStore,
  OrderBook,
  formatOrderStatus,
  getOrderStatusColor,
} from '../store/privateOrderBookStore';

type RouteParams = {
  PrivateStockDetail: {
    symbol: string;
  };
};

export function PrivateStockDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'PrivateStockDetail'>>();
  const { symbol } = route.params;
  const theme = useTheme();

  // Get private stock data
  const stock = PRIVATE_STOCK_MAP[symbol];

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

  if (!stock) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>
            Private stock not found
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.background.secondary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isStartup = stock.category === 'startup';
  const priceChange = stock.priceChange30d;

  // Order book for Pre-IPO stocks
  const { getOrderBook, getUserOrders } = usePrivateOrderBookStore();
  const orderBook = !isStartup ? getOrderBook(symbol) : null;
  const userOrders = getUserOrders(symbol);
  const pendingUserOrders = userOrders.filter(o => o.status === 'pending' || o.status === 'matched' || o.status === 'settling');

  const handleInvest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PrivateInvest' as never, { symbol: stock.symbol } as never);
  };

  const handlePlaceOrder = (side: 'bid' | 'ask') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PrivateInvest' as never, {
      symbol: stock.symbol,
      orderType: 'limit',
      side,
      suggestedPrice: side === 'bid' ? orderBook?.bids[0]?.price : orderBook?.asks[0]?.price,
    } as never);
  };

  const handleVisitWebsite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://${stock.website}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.background.secondary, theme.colors.background.primary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.text.primary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
            {stock.name}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.tertiary }]}>
            {stock.symbol} · {stock.sector}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.background.secondary }]}
          onPress={handleVisitWebsite}
        >
          <Text style={[styles.headerButtonText, { color: theme.colors.text.primary }]}>🔗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View
          style={[
            styles.heroCard,
            { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle },
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: theme.colors.accent.glow }]}>
              <Text style={styles.heroIconText}>{getSectorIcon(stock.sector)}</Text>
            </View>
            <View style={styles.heroBadges}>
              <View style={[styles.categoryBadge, { backgroundColor: isStartup ? '#10B98120' : '#6366F120' }]}>
                <Text style={[styles.categoryText, { color: isStartup ? '#10B981' : '#6366F1' }]}>
                  {isStartup ? 'STARTUP' : 'PRE-IPO'}
                </Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(stock.riskLevel) + '20' }]}>
                <Text style={[styles.riskText, { color: getRiskColor(stock.riskLevel) }]}>
                  {stock.riskLevel} Risk
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.heroValuation}>
            <Text style={[styles.valuationLabel, { color: theme.colors.text.tertiary }]}>Valuation</Text>
            <Text style={[styles.valuationAmount, { color: theme.colors.text.primary }]}>
              {formatValuation(stock.latestValuation)}
            </Text>
          </View>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Share Price</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                ${stock.sharePrice.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.heroMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>30d Change</Text>
              <Text style={[
                styles.metricValue,
                { color: priceChange >= 0 ? theme.colors.success.primary : theme.colors.error.primary }
              ]}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
              </Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.heroMetric}>
              <Text style={[styles.metricLabel, { color: theme.colors.text.tertiary }]}>Stage</Text>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {stock.fundingStage}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Current Round (Startups only) */}
        {isStartup && stock.currentRound && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Current Funding Round
              </Text>
              <View style={[styles.liveBadge, { backgroundColor: theme.colors.success.glow }]}>
                <View style={[styles.liveIndicator, { backgroundColor: theme.colors.success.primary }]} />
                <Text style={[styles.liveText, { color: theme.colors.success.primary }]}>LIVE</Text>
              </View>
            </View>
            <View style={[styles.roundCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.accent.primary }]}>
              <View style={styles.roundInfo}>
                <View style={styles.roundRow}>
                  <Text style={[styles.roundLabel, { color: theme.colors.text.tertiary }]}>Round</Text>
                  <Text style={[styles.roundValue, { color: theme.colors.text.primary }]}>{stock.currentRound.stage}</Text>
                </View>
                <View style={styles.roundRow}>
                  <Text style={[styles.roundLabel, { color: theme.colors.text.tertiary }]}>Target</Text>
                  <Text style={[styles.roundValue, { color: theme.colors.text.primary }]}>{formatValuation(stock.currentRound.targetRaise)}</Text>
                </View>
                <View style={styles.roundRow}>
                  <Text style={[styles.roundLabel, { color: theme.colors.text.tertiary }]}>Lead Investor</Text>
                  <Text style={[styles.roundValue, { color: theme.colors.text.primary }]}>{stock.currentRound.leadInvestor || 'TBD'}</Text>
                </View>
                <View style={styles.roundRow}>
                  <Text style={[styles.roundLabel, { color: theme.colors.text.tertiary }]}>Closing</Text>
                  <Text style={[styles.roundValue, { color: theme.colors.accent.primary }]}>{stock.currentRound.closingDate}</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: theme.colors.text.secondary }]}>
                    {formatValuation(stock.currentRound.raised)} raised
                  </Text>
                  <Text style={[styles.progressPercent, { color: theme.colors.accent.primary }]}>
                    {formatFundingProgress(stock.currentRound.raised, stock.currentRound.targetRaise)}%
                  </Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.background.elevated }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.colors.accent.primary,
                        width: `${formatFundingProgress(stock.currentRound.raised, stock.currentRound.targetRaise)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Order Book (Pre-IPO only) */}
        {!isStartup && orderBook && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Order Book
              </Text>
              {orderBook.spread && (
                <View style={[styles.spreadBadge, { backgroundColor: theme.colors.background.elevated }]}>
                  <Text style={[styles.spreadText, { color: theme.colors.text.secondary }]}>
                    Spread: ${orderBook.spread.toFixed(2)} ({orderBook.spreadPercent?.toFixed(2)}%)
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.orderBookCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
              {/* Order Book Header */}
              <View style={styles.orderBookHeader}>
                <View style={styles.orderBookSide}>
                  <Text style={[styles.orderBookHeaderText, { color: theme.colors.success.primary }]}>BIDS</Text>
                </View>
                <View style={styles.orderBookSide}>
                  <Text style={[styles.orderBookHeaderText, { color: theme.colors.error.primary }]}>ASKS</Text>
                </View>
              </View>

              {/* Column Headers */}
              <View style={styles.orderBookColumns}>
                <View style={styles.orderBookSide}>
                  <Text style={[styles.columnHeader, { color: theme.colors.text.tertiary }]}>Qty</Text>
                  <Text style={[styles.columnHeader, { color: theme.colors.text.tertiary }]}>Price</Text>
                </View>
                <View style={styles.orderBookSide}>
                  <Text style={[styles.columnHeader, { color: theme.colors.text.tertiary }]}>Price</Text>
                  <Text style={[styles.columnHeader, { color: theme.colors.text.tertiary }]}>Qty</Text>
                </View>
              </View>

              {/* Order Book Rows */}
              {Array.from({ length: Math.max(orderBook.bids.length, orderBook.asks.length, 5) }).map((_, idx) => {
                const bid = orderBook.bids[idx];
                const ask = orderBook.asks[idx];
                const maxQty = Math.max(
                  ...orderBook.bids.map(b => b.quantity),
                  ...orderBook.asks.map(a => a.quantity)
                );

                return (
                  <View key={idx} style={styles.orderBookRow}>
                    {/* Bid side */}
                    <View style={styles.orderBookSide}>
                      {bid && (
                        <>
                          <View style={[styles.depthBar, styles.depthBarBid, { width: `${(bid.quantity / maxQty) * 100}%`, backgroundColor: theme.colors.success.glow }]} />
                          <Text style={[styles.orderBookQty, { color: theme.colors.text.secondary }]}>
                            {bid.quantity}
                          </Text>
                          <Text style={[styles.orderBookPrice, { color: theme.colors.success.primary }]}>
                            ${bid.price.toFixed(2)}
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Ask side */}
                    <View style={styles.orderBookSide}>
                      {ask && (
                        <>
                          <View style={[styles.depthBar, styles.depthBarAsk, { width: `${(ask.quantity / maxQty) * 100}%`, backgroundColor: theme.colors.error.glow }]} />
                          <Text style={[styles.orderBookPrice, { color: theme.colors.error.primary }]}>
                            ${ask.price.toFixed(2)}
                          </Text>
                          <Text style={[styles.orderBookQty, { color: theme.colors.text.secondary }]}>
                            {ask.quantity}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Place Order Buttons */}
              <View style={styles.orderBookActions}>
                <TouchableOpacity
                  style={[styles.orderBookButton, { backgroundColor: theme.colors.success.glow, borderColor: theme.colors.success.primary }]}
                  onPress={() => handlePlaceOrder('bid')}
                >
                  <Text style={[styles.orderBookButtonText, { color: theme.colors.success.primary }]}>
                    Place Bid
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderBookButton, { backgroundColor: theme.colors.error.glow, borderColor: theme.colors.error.primary }]}
                  onPress={() => handlePlaceOrder('ask')}
                >
                  <Text style={[styles.orderBookButtonText, { color: theme.colors.error.primary }]}>
                    Place Ask
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* User's Pending Orders */}
        {pendingUserOrders.length > 0 && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Your Orders
            </Text>
            <View style={[styles.ordersCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
              {pendingUserOrders.map((order) => (
                <View key={order.id} style={styles.orderRow}>
                  <View style={styles.orderInfo}>
                    <View style={styles.orderTypeRow}>
                      <View style={[
                        styles.orderSideBadge,
                        { backgroundColor: order.side === 'bid' ? theme.colors.success.glow : theme.colors.error.glow }
                      ]}>
                        <Text style={[
                          styles.orderSideText,
                          { color: order.side === 'bid' ? theme.colors.success.primary : theme.colors.error.primary }
                        ]}>
                          {order.side.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.orderQty, { color: theme.colors.text.primary }]}>
                        {order.quantity} @ ${order.price.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={[styles.orderTotal, { color: theme.colors.text.tertiary }]}>
                      Total: {formatCurrency(order.total)}
                    </Text>
                  </View>
                  <View style={[styles.orderStatusBadge, { backgroundColor: getOrderStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.orderStatusText, { color: getOrderStatusColor(order.status) }]}>
                      {formatOrderStatus(order.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Pre-IPO Availability */}
        {!isStartup && stock.availableShares && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Secondary Market Availability
            </Text>
            <View style={[styles.availabilityCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
              <View style={styles.availabilityRow}>
                <Text style={[styles.availabilityLabel, { color: theme.colors.text.tertiary }]}>Available Shares</Text>
                <Text style={[styles.availabilityValue, { color: theme.colors.success.primary }]}>
                  {stock.availableShares.toLocaleString()} shares
                </Text>
              </View>
              <View style={styles.availabilityRow}>
                <Text style={[styles.availabilityLabel, { color: theme.colors.text.tertiary }]}>Estimated Value</Text>
                <Text style={[styles.availabilityValue, { color: theme.colors.text.primary }]}>
                  {formatCurrency(stock.availableShares * stock.sharePrice)}
                </Text>
              </View>
              <View style={styles.availabilityRow}>
                <Text style={[styles.availabilityLabel, { color: theme.colors.text.tertiary }]}>Lockup Period</Text>
                <Text style={[styles.availabilityValue, { color: theme.colors.text.primary }]}>
                  {stock.lockupPeriod || 'None'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Investment Details */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Investment Details
          </Text>
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Minimum Investment</Text>
              <Text style={[styles.detailValue, { color: theme.colors.accent.primary }]}>
                ${stock.minimumInvestment.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Total Raised</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {formatValuation(stock.totalRaised)}
              </Text>
            </View>
            <View style={[styles.detailDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Last Round</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {stock.lastRoundDate}
              </Text>
            </View>
            {stock.lastRoundSize && (
              <>
                <View style={[styles.detailDivider, { backgroundColor: theme.colors.border.subtle }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Last Round Size</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                    {formatValuation(stock.lastRoundSize)}
                  </Text>
                </View>
              </>
            )}
            <View style={[styles.detailDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Lockup Period</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                {stock.lockupPeriod || 'None'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Company Info */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Company Information
          </Text>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              {stock.description}
            </Text>
            <View style={[styles.infoDivider, { backgroundColor: theme.colors.border.subtle }]} />
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Founded</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{stock.foundedYear}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Headquarters</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{stock.headquarters}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Employees</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{stock.employees}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Website</Text>
                <Text style={[styles.infoValue, { color: theme.colors.accent.primary }]}>{stock.website}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Key Investors */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Key Investors
          </Text>
          <View style={styles.investorsList}>
            {stock.investors.map((investor, index) => (
              <View
                key={index}
                style={[styles.investorChip, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}
              >
                <Text style={[styles.investorText, { color: theme.colors.text.secondary }]}>
                  {investor}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Risk Disclosure */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.riskDisclosure, { backgroundColor: theme.colors.error.glow, borderColor: theme.colors.error.primary }]}>
            <Text style={[styles.riskDisclosureTitle, { color: theme.colors.error.primary }]}>
              ⚠️ Investment Risk Disclosure
            </Text>
            <Text style={[styles.riskDisclosureText, { color: theme.colors.text.secondary }]}>
              Private market investments are highly illiquid and speculative. You may lose your entire investment.
              These securities are not publicly traded and may have limited or no secondary market.
              Past performance is not indicative of future results.
            </Text>
          </View>
        </Animated.View>

        {/* Demo Mode Notice */}
        <View style={[styles.demoNotice, { backgroundColor: theme.colors.accent.glow }]}>
          <Text style={[styles.demoText, { color: theme.colors.accent.primary }]}>
            Demo Mode - This is a simulated investment for demonstration purposes only
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12, backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.subtle }]}>
        <View style={styles.actionInfo}>
          <Text style={[styles.actionLabel, { color: theme.colors.text.tertiary }]}>Min Investment</Text>
          <Text style={[styles.actionValue, { color: theme.colors.text.primary }]}>
            ${stock.minimumInvestment.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.investButton, { backgroundColor: theme.colors.accent.primary }]}
          onPress={handleInvest}
        >
          <Text style={[styles.investButtonText, { color: theme.colors.background.primary }]}>
            {isStartup ? 'Invest in Round' : 'Buy Shares'}
          </Text>
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
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  heroCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 28,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  heroValuation: {
    marginBottom: 20,
  },
  valuationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  valuationAmount: {
    fontSize: 36,
    fontWeight: '700',
  },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetric: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 32,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  roundCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  roundInfo: {
    marginBottom: 16,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roundLabel: {
    fontSize: 13,
  },
  roundValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  availabilityCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  availabilityLabel: {
    fontSize: 14,
  },
  availabilityValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailDivider: {
    height: 1,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoDivider: {
    height: 1,
    marginVertical: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  investorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  investorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  investorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  riskDisclosure: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  riskDisclosureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  riskDisclosureText: {
    fontSize: 12,
    lineHeight: 18,
  },
  demoNotice: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 11,
  },
  actionValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  investButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  investButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Order Book Styles
  spreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  spreadText: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderBookCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  orderBookHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  orderBookSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  orderBookHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  orderBookColumns: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  orderBookRow: {
    flexDirection: 'row',
    height: 28,
    alignItems: 'center',
  },
  depthBar: {
    position: 'absolute',
    height: '80%',
    borderRadius: 2,
  },
  depthBarBid: {
    right: 0,
  },
  depthBarAsk: {
    left: 0,
  },
  orderBookPrice: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    zIndex: 1,
  },
  orderBookQty: {
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
    zIndex: 1,
  },
  orderBookActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  orderBookButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  orderBookButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // User Orders Styles
  ordersCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  orderInfo: {
    flex: 1,
  },
  orderTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderSideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderSideText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderQty: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 12,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
