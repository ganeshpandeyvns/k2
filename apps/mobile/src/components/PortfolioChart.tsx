// ============================================================================
// PortfolioChart - Large interactive portfolio value chart
// ============================================================================

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
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

// Generate realistic portfolio data
const generatePortfolioData = (baseValue: number, range: TimeRange): number[] => {
  const pointsMap: Record<TimeRange, number> = {
    '1D': 24,
    '1W': 7 * 24,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    'ALL': 730,
  };

  const volatilityMap: Record<TimeRange, number> = {
    '1D': 0.005,
    '1W': 0.008,
    '1M': 0.012,
    '3M': 0.015,
    '1Y': 0.02,
    'ALL': 0.025,
  };

  const points = pointsMap[range];
  const volatility = volatilityMap[range];

  // Start from a lower value and trend up to current
  const startValue = baseValue * (0.7 + Math.random() * 0.2);
  const data: number[] = [startValue];
  let price = startValue;

  const targetGrowth = (baseValue - startValue) / points;

  for (let i = 1; i < points; i++) {
    const randomChange = (Math.random() - 0.5) * volatility * price;
    const trendChange = targetGrowth * (1 + (Math.random() - 0.5) * 0.5);
    price = price + randomChange + trendChange;
    data.push(Math.max(price, startValue * 0.5));
  }

  // Ensure last point matches current value
  data.push(baseValue);

  // Reduce to display points
  const displayPoints = 60;
  const step = Math.ceil(data.length / displayPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
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
            onPress={() => setSelectedRange(range)}
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
    marginBottom: 4,
  },
  valueAmount: {
    ...MeruTheme.typography.numberHuge,
    color: MeruTheme.colors.text.primary,
    marginBottom: 8,
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
    borderRadius: MeruTheme.radius.lg,
    padding: 4,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: MeruTheme.radius.md,
  },
  rangeButtonActive: {
    backgroundColor: MeruTheme.colors.background.elevated,
  },
  rangeButtonText: {
    ...MeruTheme.typography.caption,
    color: MeruTheme.colors.text.tertiary,
  },
  rangeButtonTextActive: {
    color: MeruTheme.colors.text.primary,
    fontWeight: '600',
  },
});
