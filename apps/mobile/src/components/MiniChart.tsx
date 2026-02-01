// ============================================================================
// MiniChart - Sparkline style price chart
// ============================================================================

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MeruTheme } from '../theme/meru';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  showGradient?: boolean;
  strokeWidth?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  width = 80,
  height = 32,
  positive = true,
  showGradient = true,
  strokeWidth = 1.5,
}) => {
  const { linePath, areaPath, color } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '', color: MeruTheme.colors.text.muted };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth curve using cardinal spline
    const linePath = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;

      const prev = points[index - 1];
      const cp1x = prev.x + (point.x - prev.x) / 3;
      const cp2x = prev.x + (point.x - prev.x) * 2 / 3;

      return `${path} C ${cp1x} ${prev.y} ${cp2x} ${point.y} ${point.x} ${point.y}`;
    }, '');

    // Area path for gradient fill
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const color = positive
      ? MeruTheme.colors.success.primary
      : MeruTheme.colors.error.primary;

    return { linePath, areaPath, color };
  }, [data, width, height, positive]);

  if (data.length < 2) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  const gradientId = `gradient-${positive ? 'pos' : 'neg'}`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {showGradient && (
          <Path
            d={areaPath}
            fill={`url(#${gradientId})`}
          />
        )}

        <Path
          d={linePath}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// Smooth noise helper
const miniChartNoise = (x: number, seed: number): number => {
  const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

const miniChartInterpolate = (a: number, b: number, t: number): number => {
  const ft = t * Math.PI;
  const f = (1 - Math.cos(ft)) * 0.5;
  return a * (1 - f) + b * f;
};

const getMiniChartNoise = (x: number, seed: number): number => {
  const intX = Math.floor(x);
  const fracX = x - intX;
  const v1 = miniChartNoise(intX, seed);
  const v2 = miniChartNoise(intX + 1, seed);
  return miniChartInterpolate(v1, v2, fracX);
};

// Generate smooth, realistic chart data for mini sparklines
export const generateChartData = (
  basePrice: number,
  volatility: number = 0.02,
  points: number = 24,
  trend: 'up' | 'down' | 'neutral' = 'neutral'
): number[] => {
  const seed = Math.random() * 1000;
  const data: number[] = [];

  // Determine start and end based on trend
  const trendMultiplier = trend === 'up' ? 1 : trend === 'down' ? -1 : 0;
  const trendAmount = volatility * 2 * trendMultiplier;

  const startPrice = basePrice * (1 - trendAmount * 0.5);
  const endPrice = basePrice * (1 + trendAmount * 0.5);

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);

    // Smooth progression from start to end
    const trendValue = startPrice + (endPrice - startPrice) * progress;

    // Layer smooth noise for organic movement
    const noise1 = getMiniChartNoise(i * 0.2, seed) - 0.5;
    const noise2 = getMiniChartNoise(i * 0.5, seed + 50) - 0.5;

    const combinedNoise = noise1 * 0.7 + noise2 * 0.3;
    const noiseAmount = combinedNoise * volatility * basePrice;

    data.push(trendValue + noiseAmount);
  }

  // Ensure the trend direction is clear by adjusting endpoints
  if (trend === 'up') {
    data[data.length - 1] = Math.max(data[data.length - 1], data[0] * 1.01);
  } else if (trend === 'down') {
    data[data.length - 1] = Math.min(data[data.length - 1], data[0] * 0.99);
  }

  return data;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: MeruTheme.colors.background.tertiary,
    borderRadius: 4,
  },
});
