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

// Generate fake chart data for demo
export const generateChartData = (
  basePrice: number,
  volatility: number = 0.02,
  points: number = 24,
  trend: 'up' | 'down' | 'neutral' = 'neutral'
): number[] => {
  const data: number[] = [basePrice];
  let price = basePrice;

  const trendBias = trend === 'up' ? 0.001 : trend === 'down' ? -0.001 : 0;

  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.5) * volatility + trendBias;
    price = price * (1 + change);
    data.push(price);
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
