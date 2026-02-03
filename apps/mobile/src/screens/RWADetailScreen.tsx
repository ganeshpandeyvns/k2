// ============================================================================
// RWA (Real World Asset) Detail Screen
// ============================================================================
// Shows detailed information about a tokenized real-world asset including
// price, yield, underlying asset details, and trading options.
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useKYCStore } from '../store/kycStore';
import { useFundingStore } from '../store/fundingStore';
import {
  getRWATokenById,
  RWAToken,
  getCategoryIcon,
  getCategoryColor,
  getRiskColor,
  formatRWAMarketCap,
  formatRWAVolume,
  RWA_CATEGORIES,
} from '../utils/mockRWAData';
import type { RootStackParamList } from '../navigation/RootNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 180;

type DetailRouteProp = RouteProp<RootStackParamList, 'RWADetail'>;

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

// Generate chart data for RWA tokens (more stable than crypto)
const generateRWAChartData = (currentPrice: number, range: TimeRange): number[] => {
  const points = 40;
  const data: number[] = [];

  // RWA tokens have lower volatility than crypto
  const volatilityByRange: Record<TimeRange, number> = {
    '1D': 0.002,
    '1W': 0.008,
    '1M': 0.02,
    '3M': 0.04,
    '1Y': 0.08,
    'ALL': 0.15,
  };

  const volatility = volatilityByRange[range];
  let price = currentPrice * (1 - volatility / 2); // Start a bit lower

  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.45) * volatility * currentPrice / points;
    price += change;
    data.push(price);
  }

  // Ensure last point is near current price
  data[points - 1] = currentPrice;
  return data;
};

// Simple SVG chart component
const PriceChart = ({
  data,
  width,
  height,
  isPositive,
  theme,
}: {
  data: number[];
  width: number;
  height: number;
  isPositive: boolean;
  theme: any;
}) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 20);
      return `${x},${y}`;
    })
    .join(' ');

  const gradientId = `rwa-chart-gradient-${isPositive ? 'up' : 'down'}`;
  const lineColor = isPositive ? theme.colors.success.primary : theme.colors.error.primary;

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={`M ${areaPoints} Z`} fill={`url(#${gradientId})`} />
      <Path
        d={`M ${points}`}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current price dot */}
      <Circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 20)}
        r={4}
        fill={lineColor}
      />
    </Svg>
  );
};

export function RWADetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRouteProp>();
  const { tokenId } = route.params;
  const theme = useTheme();

  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');

  // Get token data
  const token = useMemo(() => getRWATokenById(tokenId), [tokenId]);

  // KYC and funding status
  const kycStatus = useKYCStore((state) => state.status);
  const paymentMethods = useFundingStore((state) => state.paymentMethods);
  const hasKYC = kycStatus === 'verified';
  const hasBankLinked = paymentMethods.length > 0;

  // Generate chart data
  const chartData = useMemo(() => {
    if (!token) return [];
    return generateRWAChartData(token.price, selectedRange);
  }, [token, selectedRange]);

  if (!token) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
          Token not found
        </Text>
      </SafeAreaView>
    );
  }

  const isPositive = token.change24h >= 0;
  const categoryInfo = RWA_CATEGORIES.find((c) => c.id === token.category);

  const handleTrade = (side: 'buy' | 'sell') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check for institutional requirement
    if (token.investorTier === 'institutional' && (!hasKYC || !hasBankLinked)) {
      Alert.alert(
        'Accredited Investor Required',
        'This investment requires accredited investor verification. Please complete your profile verification.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: () => navigation.navigate('Settings' as never),
          },
        ]
      );
      return;
    }

    navigation.navigate('RWATrade' as never, { tokenId: token.id, side } as never);
  };

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.subtle }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke={theme.colors.text.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(token.category) + '20' }]}>
            <Text style={styles.categoryEmoji}>{getCategoryIcon(token.category)}</Text>
            <Text style={[styles.categoryName, { color: getCategoryColor(token.category) }]}>
              {categoryInfo?.name || token.category}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Token Info */}
        <View style={styles.tokenInfo}>
          <Text style={[styles.tokenSymbol, { color: theme.colors.text.primary }]}>{token.symbol}</Text>
          <Text style={[styles.tokenName, { color: theme.colors.text.secondary }]}>{token.name}</Text>

          {/* Institutional Badge */}
          {token.investorTier === 'institutional' && (
            <View style={[styles.proBadge, { backgroundColor: theme.colors.accent.glow }]}>
              <Text style={[styles.proText, { color: theme.colors.accent.primary }]}>
                ACCREDITED INVESTORS ONLY
              </Text>
            </View>
          )}
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: theme.colors.text.primary }]}>
            ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.changeRow}>
            <View
              style={[
                styles.changeBadge,
                { backgroundColor: isPositive ? theme.colors.success.primary + '20' : theme.colors.error.primary + '20' },
              ]}
            >
              <Text
                style={[styles.changeText, { color: isPositive ? theme.colors.success.primary : theme.colors.error.primary }]}
              >
                {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
              </Text>
            </View>
            <Text style={[styles.changeLabel, { color: theme.colors.text.tertiary }]}>24h</Text>
          </View>
        </View>

        {/* Yield Banner (if applicable) */}
        {token.yield && (
          <View style={[styles.yieldBanner, { backgroundColor: theme.colors.success.primary + '15', borderColor: theme.colors.success.primary + '30' }]}>
            <Text style={[styles.yieldLabel, { color: theme.colors.success.primary }]}>Annual Yield</Text>
            <Text style={[styles.yieldValue, { color: theme.colors.success.primary }]}>
              {token.yield.toFixed(2)}% APY
            </Text>
          </View>
        )}

        {/* Price Chart */}
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.background.secondary }]}>
          <PriceChart
            data={chartData}
            width={SCREEN_WIDTH - 48}
            height={CHART_HEIGHT}
            isPositive={isPositive}
            theme={theme}
          />

          {/* Time Range Selector */}
          <View style={styles.timeRangeContainer}>
            {timeRanges.map((range) => (
              <Pressable
                key={range}
                style={[
                  styles.timeRangeButton,
                  selectedRange === range && [styles.timeRangeButtonActive, { backgroundColor: theme.colors.accent.glow }],
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRange(range);
                }}
              >
                <Text
                  style={[
                    styles.timeRangeText,
                    { color: theme.colors.text.tertiary },
                    selectedRange === range && { color: theme.colors.accent.primary, fontWeight: '600' },
                  ]}
                >
                  {range}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Key Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Key Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Market Cap</Text>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{formatRWAMarketCap(token.marketCap)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>24h Volume</Text>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>${formatRWAVolume(token.volume24h)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Total Supply</Text>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{token.totalSupply.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Circulating</Text>
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{token.circulatingSupply.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Min Investment</Text>
              <Text style={[styles.statValue, { color: theme.colors.accent.primary }]}>${token.minimumInvestment.toLocaleString()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.colors.text.tertiary }]}>Risk Level</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(token.riskLevel) + '20' }]}>
                <Text style={[styles.riskText, { color: getRiskColor(token.riskLevel) }]}>
                  {token.riskLevel.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Asset Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Asset Details</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Issuer</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.issuer}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Platform</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.platform}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Blockchain</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.blockchain}</Text>
          </View>
          {token.auditor && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Auditor</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.auditor}</Text>
            </View>
          )}
          {token.regulatoryStatus && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Regulatory</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.regulatoryStatus}</Text>
            </View>
          )}

          {/* Asset-specific details */}
          {token.assetDetails.location && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Location</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.assetDetails.location}</Text>
            </View>
          )}
          {token.assetDetails.purity && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Purity</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.assetDetails.purity}</Text>
            </View>
          )}
          {token.assetDetails.custodian && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Custodian</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.assetDetails.custodian}</Text>
            </View>
          )}
          {token.assetDetails.rating && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Rating</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.assetDetails.rating}</Text>
            </View>
          )}
          {token.assetDetails.artist && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.text.tertiary }]}>Artist</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{token.assetDetails.artist}</Text>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={[styles.aboutCard, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>About</Text>
          <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
            {token.description}
          </Text>
        </View>

        {/* Risk Disclaimer */}
        <View style={[styles.disclaimerCard, { backgroundColor: theme.colors.background.elevated, borderColor: theme.colors.border.subtle }]}>
          <Text style={[styles.disclaimerTitle, { color: theme.colors.text.tertiary }]}>Risk Disclosure</Text>
          <Text style={[styles.disclaimerText, { color: theme.colors.text.muted }]}>
            Real World Asset tokens represent fractional ownership in underlying assets. Values may fluctuate.
            Tokenized assets may have limited liquidity. Past performance does not guarantee future results.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Trade Buttons */}
      <View style={[styles.tradeButtonContainer, { backgroundColor: theme.colors.background.primary, borderTopColor: theme.colors.border.subtle }]}>
        <TouchableOpacity
          style={[styles.sellButton, { backgroundColor: theme.colors.background.secondary, borderColor: theme.colors.border.subtle }]}
          onPress={() => handleTrade('sell')}
        >
          <Text style={[styles.sellButtonText, { color: theme.colors.text.primary }]}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyButton, { backgroundColor: theme.colors.accent.primary }]}
          onPress={() => handleTrade('buy')}
        >
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tokenInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenSymbol: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tokenName: {
    fontSize: 15,
    marginTop: 4,
  },
  proBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  proText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 14,
  },
  yieldBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  yieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  yieldValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeRangeButtonActive: {},
  timeRangeText: {
    fontSize: 13,
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {},
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  aboutCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  disclaimerCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
  },
  tradeButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
  },
  sellButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  sellButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
