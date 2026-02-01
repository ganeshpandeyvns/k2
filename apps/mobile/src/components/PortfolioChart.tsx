// ============================================================================
// PortfolioChart - Large interactive portfolio value chart
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

interface PortfolioChartProps {
  currentValue: number;
  change24h: number;
  changePercent24h: number;
}

// Perlin-like noise for smooth organic movement
const smoothNoise = (x: number, seed: number): number => {
  const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

// Interpolate smoothly between noise samples
const smoothInterpolate = (a: number, b: number, t: number): number => {
  const ft = t * Math.PI;
  const f = (1 - Math.cos(ft)) * 0.5;
  return a * (1 - f) + b * f;
};

// Generate smooth noise value at position
const getSmoothNoise = (x: number, seed: number): number => {
  const intX = Math.floor(x);
  const fracX = x - intX;
  const v1 = smoothNoise(intX, seed);
  const v2 = smoothNoise(intX + 1, seed);
  return smoothInterpolate(v1, v2, fracX);
};

// Generate realistic portfolio data with smooth organic movement
const generatePortfolioData = (baseValue: number, range: TimeRange): number[] => {
  const pointsMap: Record<TimeRange, number> = {
    '1D': 96,      // More points for smoother curves
    '1W': 168,
    '1M': 120,
    '3M': 180,
    '1Y': 365,
    'ALL': 730,
  };

  const volatilityMap: Record<TimeRange, number> = {
    '1D': 0.003,
    '1W': 0.006,
    '1M': 0.01,
    '3M': 0.012,
    '1Y': 0.018,
    'ALL': 0.022,
  };

  const points = pointsMap[range];
  const volatility = volatilityMap[range];

  // Generate a random seed for this chart instance
  const seed = Math.random() * 1000;

  // Start from a lower value and trend up to current
  const startValue = baseValue * (0.75 + Math.random() * 0.15);
  const data: number[] = [];

  // Calculate the overall trend needed
  const totalGrowth = baseValue - startValue;

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);

    // Base trend (smooth growth towards target)
    const trendValue = startValue + totalGrowth * progress;

    // Layer multiple noise frequencies for organic movement
    const noise1 = getSmoothNoise(i * 0.1, seed) - 0.5;       // Slow waves
    const noise2 = getSmoothNoise(i * 0.3, seed + 100) - 0.5; // Medium waves
    const noise3 = getSmoothNoise(i * 0.7, seed + 200) - 0.5; // Fast ripples

    // Combine noises with different weights
    const combinedNoise = noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1;

    // Apply volatility scaled by value
    const noiseAmount = combinedNoise * volatility * trendValue;

    // Add momentum (prices tend to continue their direction briefly)
    const momentum = i > 0 ? (data[i - 1] - (data[i - 2] || data[0])) * 0.3 : 0;

    const value = trendValue + noiseAmount + momentum;
    data.push(Math.max(value, startValue * 0.6));
  }

  // Ensure last point matches current value exactly
  data[data.length - 1] = baseValue;

  // Smooth the transition to final value
  const smoothPoints = Math.min(5, data.length - 1);
  for (let i = 1; i <= smoothPoints; i++) {
    const idx = data.length - 1 - i;
    const t = i / smoothPoints;
    data[idx] = data[idx] * t + baseValue * (1 - t) * 0.3 + data[idx] * 0.7;
  }

  // Reduce to display points while preserving key features
  const displayPoints = 80;
  if (data.length <= displayPoints) return data;

  const step = data.length / displayPoints;
  const result: number[] = [];
  for (let i = 0; i < displayPoints; i++) {
    const idx = Math.min(Math.floor(i * step), data.length - 1);
    result.push(data[idx]);
  }
  result[result.length - 1] = baseValue;

  return result;
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  currentValue,
  change24h,
  changePercent24h,
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [touchX, setTouchX] = useState<number | null>(null);

  const chartWidth = SCREEN_WIDTH - CHART_PADDING * 2;

  const { data, isPositive } = useMemo(() => {
    const data = generatePortfolioData(currentValue, selectedRange);
    const isPositive = data[data.length - 1] >= data[0];
    return { data, isPositive };
  }, [currentValue, selectedRange]);

  const { linePath, areaPath, min, max, touchValue } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '', min: 0, max: 0, touchValue: null };

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

    return { linePath, areaPath, min, max, touchValue };
  }, [data, chartWidth, touchX]);

  const color = isPositive
    ? MeruTheme.colors.success.primary
    : MeruTheme.colors.error.primary;

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
            {change24h >= 0 ? '+' : ''}{formatCurrency(change24h)}
          </Text>
          <View style={[styles.changeBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.changePercent, { color }]}>
              {changePercent24h >= 0 ? '+' : ''}{changePercent24h.toFixed(2)}%
            </Text>
          </View>
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
