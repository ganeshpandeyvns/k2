// ============================================================================
// PortfolioChart - Large interactive portfolio value chart
// Uses a single master dataset so time ranges are logically connected
// ============================================================================

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { MeruTheme, formatCurrency } from '../theme/meru';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const CHART_PADDING = 16;

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

interface Holding {
  symbol: string;
  quantity: number;
}

interface PortfolioChartProps {
  currentValue: number;
  change24h: number;
  changePercent24h: number;
  holdings?: Holding[];
  prices?: Record<string, number>;
}

// ============================================================================
// Master Historical Data Generation
// Generates 2 years of daily data, all time ranges slice from this
// ============================================================================

// Realistic 2-year price patterns (730 days of daily multipliers)
// Pattern: Bear market -> Bottom -> Recovery -> Bull run -> Current
const generateMasterPattern = (seed: number): number[] => {
  const days = 730; // 2 years
  const data: number[] = [];

  // Use seed for consistent randomness
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 0.1) * 10000;
    return x - Math.floor(x);
  };

  // Define market phases with realistic crypto patterns
  // Phase 1: Days 0-120 - Bear market decline (ATH to -60%)
  // Phase 2: Days 120-240 - Bottom consolidation (-60% to -55%)
  // Phase 3: Days 240-450 - Recovery (-55% to -20%)
  // Phase 4: Days 450-600 - Bull run (-20% to +5%)
  // Phase 5: Days 600-730 - Recent period (+5% to current)

  let value = 1.0; // Start at "ATH" (will scale later)

  for (let day = 0; day < days; day++) {
    const progress = day / days;
    let targetMultiplier: number;
    let volatility: number;

    if (day < 120) {
      // Bear market: decline from 1.0 to 0.4
      const phaseProgress = day / 120;
      targetMultiplier = 1.0 - (0.6 * phaseProgress);
      volatility = 0.025;
    } else if (day < 240) {
      // Bottom: consolidate around 0.4
      const phaseProgress = (day - 120) / 120;
      targetMultiplier = 0.4 + (0.05 * Math.sin(phaseProgress * Math.PI * 3));
      volatility = 0.015;
    } else if (day < 450) {
      // Recovery: 0.4 to 0.8
      const phaseProgress = (day - 240) / 210;
      targetMultiplier = 0.4 + (0.4 * phaseProgress);
      volatility = 0.02;
    } else if (day < 600) {
      // Bull run: 0.8 to 1.05
      const phaseProgress = (day - 450) / 150;
      targetMultiplier = 0.8 + (0.25 * phaseProgress);
      volatility = 0.018;
    } else {
      // Recent: slight consolidation around 1.0
      const phaseProgress = (day - 600) / 130;
      targetMultiplier = 1.0 + (0.02 * Math.sin(phaseProgress * Math.PI * 2));
      volatility = 0.012;
    }

    // Add daily noise
    const noise = (seededRandom(day) - 0.5) * volatility * 2;

    // Mean reversion towards target
    const reversion = (targetMultiplier - value) * 0.1;

    value = value + reversion + noise;

    // Clamp to reasonable bounds
    value = Math.max(0.3, Math.min(1.2, value));

    data.push(value);
  }

  // Normalize so last value is exactly 1.0
  const lastValue = data[data.length - 1];
  return data.map(v => v / lastValue);
};

// Cache the master data
let cachedMasterData: number[] | null = null;
let cachedSeed: number = 0;

const getMasterData = (currentValue: number): number[] => {
  // Use currentValue to create a consistent seed
  const seed = Math.floor(currentValue / 1000) + 42;

  if (!cachedMasterData || cachedSeed !== seed) {
    cachedMasterData = generateMasterPattern(seed);
    cachedSeed = seed;
  }

  return cachedMasterData;
};

// Get data for specific time range by slicing master data
const getChartData = (
  currentValue: number,
  range: TimeRange,
  displayPoints: number = 60
): number[] => {
  const masterData = getMasterData(currentValue);

  // Map time ranges to number of days
  const daysMap: Record<TimeRange, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    'ALL': 730,
  };

  const days = daysMap[range];

  // For ranges less than the display points, we need to interpolate
  // For 1D, use the last day but add intraday variation
  if (range === '1D') {
    // Get last 2 days to show transition
    const lastTwoDays = masterData.slice(-2);
    const startValue = lastTwoDays[0];
    const endValue = lastTwoDays[1];

    // Generate 24-hour intraday pattern
    const intradayData: number[] = [];
    for (let i = 0; i < displayPoints; i++) {
      const progress = i / (displayPoints - 1);
      // Smooth transition with some intraday noise
      const baseValue = startValue + (endValue - startValue) * progress;
      const intradayNoise = Math.sin(progress * Math.PI * 4) * 0.005 +
                           Math.sin(progress * Math.PI * 8) * 0.003;
      intradayData.push((baseValue + intradayNoise) * currentValue);
    }
    intradayData[intradayData.length - 1] = currentValue;
    return intradayData;
  }

  // Slice the last N days from master data
  const startIndex = Math.max(0, masterData.length - days);
  const slicedData = masterData.slice(startIndex);

  // Downsample or interpolate to display points
  const result: number[] = [];
  for (let i = 0; i < displayPoints; i++) {
    const progress = i / (displayPoints - 1);
    const sourceIndex = progress * (slicedData.length - 1);
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, slicedData.length - 1);
    const t = sourceIndex - lowerIndex;

    const interpolatedValue = slicedData[lowerIndex] * (1 - t) + slicedData[upperIndex] * t;
    result.push(interpolatedValue * currentValue);
  }

  // Ensure last point is exactly current value
  result[result.length - 1] = currentValue;

  return result;
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  currentValue,
  change24h,
  changePercent24h,
  holdings,
  prices,
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [touchX, setTouchX] = useState<number | null>(null);

  const chartWidth = SCREEN_WIDTH - CHART_PADDING * 2;

  const { data, isPositive, startValue } = useMemo(() => {
    const data = getChartData(currentValue, selectedRange);
    const startValue = data[0];
    const isPositive = data[data.length - 1] >= startValue;
    return { data, isPositive, startValue };
  }, [currentValue, selectedRange]);

  const { linePath, areaPath, touchValue } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '', touchValue: null };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 4;
    const cWidth = chartWidth - padding * 2;
    const cHeight = CHART_HEIGHT - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * cWidth;
      const y = padding + cHeight - ((value - min) / range) * cHeight;
      return { x, y, value };
    });

    // Smooth bezier curve
    const linePath = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;

      const prev = points[index - 1];
      const tension = 0.3;
      const cp1x = prev.x + (point.x - prev.x) * tension;
      const cp2x = point.x - (point.x - prev.x) * tension;

      return `${path} C ${cp1x} ${prev.y} ${cp2x} ${point.y} ${point.x} ${point.y}`;
    }, '');

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

    // Calculate touch value
    let touchValue = null;
    if (touchX !== null) {
      const index = Math.round((touchX / chartWidth) * (data.length - 1));
      const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
      touchValue = {
        value: data[clampedIndex],
        x: points[clampedIndex].x,
        y: points[clampedIndex].y,
      };
    }

    return { linePath, areaPath, touchValue };
  }, [data, chartWidth, touchX]);

  const color = isPositive
    ? MeruTheme.colors.success.primary
    : MeruTheme.colors.error.primary;

  // Calculate change for selected range
  const rangeChange = currentValue - startValue;
  const rangeChangePercent = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;

  const ranges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  return (
    <View style={styles.container}>
      {/* Value Display */}
      <View style={styles.valueContainer}>
        <Text style={styles.valueLabel}>Portfolio Value</Text>
        <Text style={styles.valueAmount}>
          {formatCurrency(touchValue?.value ?? currentValue)}
        </Text>
        <View style={styles.changeRow}>
          <Text style={[styles.changeAmount, { color }]}>
            {rangeChange >= 0 ? '+' : ''}{formatCurrency(rangeChange)}
          </Text>
          <View style={[styles.changeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.changePercent, { color }]}>
              {rangeChangePercent >= 0 ? '+' : ''}{rangeChangePercent.toFixed(2)}%
            </Text>
          </View>
          <Text style={styles.rangeLabel}>{selectedRange}</Text>
        </View>
      </View>

      {/* Chart */}
      <View
        style={styles.chartContainer}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => setTouchX(e.nativeEvent.locationX)}
        onResponderMove={(e) => setTouchX(e.nativeEvent.locationX)}
        onResponderRelease={() => setTouchX(null)}
      >
        <Svg width={chartWidth} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <Stop offset="50%" stopColor={color} stopOpacity={0.1} />
              <Stop offset="100%" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <Line
              key={ratio}
              x1={0}
              y1={CHART_HEIGHT * ratio}
              x2={chartWidth}
              y2={CHART_HEIGHT * ratio}
              stroke={MeruTheme.colors.border.subtle}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}

          {/* Area fill */}
          <Path d={areaPath} fill="url(#portfolioGradient)" />

          {/* Main line */}
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Touch indicator */}
          {touchValue && (
            <>
              <Line
                x1={touchValue.x}
                y1={0}
                x2={touchValue.x}
                y2={CHART_HEIGHT}
                stroke={MeruTheme.colors.text.tertiary}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <Circle
                cx={touchValue.x}
                cy={touchValue.y}
                r={6}
                fill={MeruTheme.colors.background.primary}
                stroke={color}
                strokeWidth={3}
              />
            </>
          )}
        </Svg>
      </View>

      {/* Time Range Selector */}
      <View style={styles.rangeSelector}>
        {ranges.map((range) => (
          <Pressable
            key={range}
            style={[
              styles.rangeButton,
              selectedRange === range && styles.rangeButtonActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedRange(range);
            }}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedRange === range && styles.rangeButtonTextActive,
              ]}
            >
              {range}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CHART_PADDING,
  },
  valueContainer: {
    marginBottom: 16,
  },
  valueLabel: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  valueAmount: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: MeruTheme.colors.text.primary,
    marginBottom: 10,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeAmount: {
    ...MeruTheme.typography.bodyMedium,
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changePercent: {
    ...MeruTheme.typography.caption,
    fontWeight: '600',
  },
  rangeLabel: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
    marginLeft: 4,
  },
  chartContainer: {
    marginBottom: 16,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: MeruTheme.colors.background.secondary,
    borderRadius: MeruTheme.radius.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: MeruTheme.colors.border.subtle,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: MeruTheme.radius.lg,
  },
  rangeButtonActive: {
    backgroundColor: MeruTheme.colors.background.elevated,
    shadowColor: MeruTheme.colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  rangeButtonText: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
    fontWeight: '500',
  },
  rangeButtonTextActive: {
    color: MeruTheme.colors.accent.primary,
    fontWeight: '700',
  },
});
