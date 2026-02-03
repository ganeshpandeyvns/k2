// ============================================================================
// Instrument Detail Screen
// ============================================================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';
import { usePortfolioStore, TradeTransaction } from '../store/portfolioStore';
import { useKYCStore } from '../store/kycStore';
import { useFundingStore } from '../store/fundingStore';
import { SetupGateModal } from '../components/onboarding/SetupGateModal';
import type { RootStackParamList } from '../navigation/RootNavigator';
import {
  DEMO_STOCKS,
  DEMO_STOCK_QUOTES,
  STOCK_COMPANY_INFO,
  formatMarketCap,
  formatVolume,
} from '../utils/mockStockData';
import { getMarketStatus, getSessionColor, getSessionIcon } from '../utils/marketHours';
import { hasOptions } from '../utils/mockOptionsData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const CHART_PADDING = 20;

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

type DetailRouteProp = RouteProp<RootStackParamList, 'InstrumentDetail'>;

// ============================================================================
// Event Contract Descriptions - Accurate market information
// ============================================================================
const EVENT_CONTRACT_INFO: Record<string, {
  title: string;
  description: string;
  category: string;
  settlementSource: string;
  expires: string;
}> = {
  'FED-RATE-MAR': {
    title: 'Fed Interest Rate Cut - March 2025',
    description: 'This contract settles to $1 if the Federal Reserve announces a 25+ basis point cut to the federal funds rate at their March 2025 FOMC meeting. The contract settles to $0 if rates remain unchanged or increase.',
    category: 'Economics',
    settlementSource: 'Federal Reserve',
    expires: 'Mar 19, 2025',
  },
  'BTC-100K-Q1': {
    title: 'Bitcoin Reaches $100,000 by Q1 2025',
    description: 'This contract settles to $1 if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange (Coinbase, Binance, Kraken) before March 31, 2025 at 11:59 PM ET. Settlement is based on the highest recorded spot price.',
    category: 'Crypto',
    settlementSource: 'CoinGecko Aggregate',
    expires: 'Mar 31, 2025',
  },
  'ETH-ETF-APR': {
    title: 'Spot Ethereum ETF SEC Approval',
    description: 'This contract settles to $1 if the U.S. Securities and Exchange Commission (SEC) approves at least one spot Ethereum ETF application by April 30, 2025. The contract settles to $0 if no approval is granted by the deadline.',
    category: 'Crypto / Regulatory',
    settlementSource: 'SEC Official Filings',
    expires: 'Apr 30, 2025',
  },
  'AI-BREAKTHROUGH': {
    title: 'GPT-5 or Equivalent Release in 2025',
    description: 'This contract settles to $1 if OpenAI releases GPT-5 (or a successor model explicitly announced as the next generation after GPT-4) to the public before December 31, 2025. Public release includes API access or ChatGPT integration.',
    category: 'Technology / AI',
    settlementSource: 'OpenAI Official Announcements',
    expires: 'Dec 31, 2025',
  },
};

// Crypto asset descriptions
const CRYPTO_INFO: Record<string, {
  name: string;
  description: string;
  website?: string;
}> = {
  BTC: {
    name: 'Bitcoin',
    description: 'Bitcoin is a decentralized digital currency created in 2009. It operates on a peer-to-peer network without the need for intermediaries. Bitcoin uses proof-of-work consensus and has a fixed supply of 21 million coins.',
  },
  ETH: {
    name: 'Ethereum',
    description: 'Ethereum is a decentralized blockchain platform that enables smart contracts and decentralized applications (dApps). It transitioned to proof-of-stake in 2022, significantly reducing energy consumption.',
  },
  SOL: {
    name: 'Solana',
    description: 'Solana is a high-performance blockchain supporting smart contracts and decentralized applications. It uses a unique proof-of-history consensus combined with proof-of-stake, enabling high throughput and low transaction costs.',
  },
  AVAX: {
    name: 'Avalanche',
    description: 'Avalanche is a layer-1 blockchain platform known for its speed and low costs. It uses a novel consensus protocol and supports multiple virtual machines, making it compatible with Ethereum tools and applications.',
  },
  LINK: {
    name: 'Chainlink',
    description: 'Chainlink is a decentralized oracle network that provides real-world data to smart contracts on the blockchain. It enables smart contracts to securely interact with external data feeds, web APIs, and payment systems.',
  },
  DOT: {
    name: 'Polkadot',
    description: 'Polkadot is a multi-chain protocol that enables different blockchains to transfer messages and value in a trust-free fashion. It aims to create a web where independent blockchains can exchange information.',
  },
  MATIC: {
    name: 'Polygon',
    description: 'Polygon (formerly Matic Network) is a layer-2 scaling solution for Ethereum. It provides faster and cheaper transactions while leveraging the security of the Ethereum mainnet.',
  },
  UNI: {
    name: 'Uniswap',
    description: 'Uniswap is a leading decentralized exchange (DEX) protocol on Ethereum. It pioneered the automated market maker (AMM) model, allowing users to trade tokens directly from their wallets without intermediaries.',
  },
};

// ============================================================================
// Demo Prices - Used as fallback when API is unavailable
// ============================================================================
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
  LINK: { price: 14.52, change24h: 2.15 },
  DOT: { price: 7.23, change24h: -0.85 },
  UNI: { price: 9.87, change24h: 1.45 },
};

// Demo prices for event contracts (probability-based, 0-1 scale displayed as cents)
const EVENT_DEMO_PRICES: Record<string, { probability: number; change24h: number }> = {
  'FED-RATE-MAR': { probability: 0.42, change24h: 8.5 },
  'BTC-100K-Q1': { probability: 0.28, change24h: -4.2 },
  'ETH-ETF-APR': { probability: 0.65, change24h: 12.3 },
  'AI-BREAKTHROUGH': { probability: 0.55, change24h: 3.1 },
};

// ============================================================================
// Price Chart Data Generation (realistic patterns based on asset)
// ============================================================================

// Historical price patterns (normalized multipliers) for different time ranges
const ASSET_PRICE_PATTERNS: Record<string, Record<TimeRange, number[]>> = {
  BTC: {
    '1D': [0.985, 0.988, 0.992, 0.989, 0.995, 0.998, 0.996, 1.002, 1.005, 1.003, 1.008, 1.005, 1.010, 1.008, 1.012, 1.015, 1.012, 1.018, 1.015, 1.020, 1.018, 1.022, 1.019, 1.023],
    '1W': [0.945, 0.952, 0.948, 0.960, 0.955, 0.970, 0.965, 0.978, 0.985, 0.980, 0.992, 0.988, 0.995, 1.002, 0.998, 1.008, 1.005, 1.012, 1.008, 1.018, 1.015, 1.020, 1.018, 1.023],
    '1M': [0.88, 0.85, 0.87, 0.90, 0.88, 0.92, 0.95, 0.93, 0.96, 0.94, 0.98, 0.96, 1.00, 0.98, 1.02, 1.00, 1.04, 1.02, 1.05, 1.03, 1.06, 1.04, 1.02, 1.023],
    '3M': [0.75, 0.72, 0.78, 0.82, 0.79, 0.85, 0.88, 0.84, 0.90, 0.87, 0.92, 0.95, 0.92, 0.98, 0.95, 1.00, 0.97, 1.02, 0.99, 1.04, 1.01, 1.05, 1.02, 1.023],
    '1Y': [0.45, 0.42, 0.48, 0.52, 0.48, 0.55, 0.60, 0.55, 0.65, 0.70, 0.65, 0.72, 0.78, 0.75, 0.82, 0.88, 0.85, 0.92, 0.95, 0.98, 1.02, 1.00, 1.02, 1.023],
    'ALL': [0.25, 0.30, 0.28, 0.35, 0.40, 0.38, 0.45, 0.55, 0.50, 0.60, 0.65, 0.58, 0.70, 0.75, 0.68, 0.78, 0.85, 0.80, 0.90, 0.95, 0.92, 1.00, 1.02, 1.023],
  },
  ETH: {
    '1D': [1.008, 1.005, 1.010, 1.006, 1.012, 1.008, 1.005, 1.002, 0.998, 1.000, 0.996, 0.998, 0.994, 0.996, 0.992, 0.995, 0.990, 0.993, 0.988, 0.991, 0.986, 0.989, 0.985, 0.988],
    '1W': [1.035, 1.028, 1.022, 1.018, 1.025, 1.015, 1.020, 1.010, 1.015, 1.005, 1.010, 1.000, 1.005, 0.998, 1.002, 0.995, 1.000, 0.992, 0.996, 0.990, 0.994, 0.988, 0.990, 0.988],
    '1M': [1.12, 1.08, 1.10, 1.05, 1.08, 1.02, 1.05, 1.00, 1.03, 0.98, 1.02, 0.97, 1.00, 0.96, 0.99, 0.95, 0.98, 0.94, 0.97, 0.93, 0.96, 0.92, 0.95, 0.988],
    '3M': [1.25, 1.18, 1.22, 1.15, 1.20, 1.12, 1.18, 1.08, 1.15, 1.05, 1.12, 1.02, 1.08, 0.98, 1.05, 0.95, 1.02, 0.92, 0.98, 0.95, 0.96, 0.93, 0.95, 0.988],
    '1Y': [0.55, 0.52, 0.58, 0.65, 0.60, 0.72, 0.80, 0.75, 0.85, 0.92, 0.88, 0.95, 1.05, 1.00, 1.10, 1.05, 1.15, 1.08, 1.12, 1.05, 1.02, 0.98, 0.95, 0.988],
    'ALL': [0.20, 0.25, 0.30, 0.35, 0.42, 0.50, 0.58, 0.65, 0.72, 0.80, 0.75, 0.85, 0.92, 0.88, 0.98, 1.05, 1.00, 1.10, 1.05, 1.02, 0.98, 0.95, 0.92, 0.988],
  },
  SOL: {
    '1D': [0.965, 0.970, 0.975, 0.980, 0.985, 0.990, 0.988, 0.995, 1.000, 1.005, 1.010, 1.015, 1.020, 1.025, 1.030, 1.035, 1.040, 1.045, 1.050, 1.052, 1.055, 1.057, 1.055, 1.057],
    '1W': [0.88, 0.90, 0.92, 0.94, 0.96, 0.94, 0.98, 0.96, 1.00, 0.98, 1.02, 1.00, 1.04, 1.02, 1.05, 1.03, 1.06, 1.04, 1.055, 1.05, 1.058, 1.055, 1.056, 1.057],
    '1M': [0.72, 0.75, 0.78, 0.82, 0.85, 0.88, 0.85, 0.90, 0.92, 0.95, 0.92, 0.98, 0.95, 1.00, 0.98, 1.02, 1.00, 1.04, 1.02, 1.05, 1.04, 1.055, 1.05, 1.057],
    '3M': [0.45, 0.50, 0.55, 0.52, 0.60, 0.65, 0.62, 0.70, 0.75, 0.72, 0.80, 0.85, 0.82, 0.90, 0.88, 0.95, 0.92, 1.00, 0.98, 1.02, 1.00, 1.04, 1.05, 1.057],
    '1Y': [0.15, 0.12, 0.18, 0.22, 0.20, 0.28, 0.35, 0.30, 0.42, 0.50, 0.45, 0.55, 0.65, 0.60, 0.72, 0.80, 0.75, 0.88, 0.95, 1.00, 0.98, 1.02, 1.05, 1.057],
    'ALL': [0.08, 0.10, 0.12, 0.15, 0.18, 0.22, 0.28, 0.35, 0.30, 0.42, 0.50, 0.45, 0.58, 0.65, 0.60, 0.75, 0.85, 0.80, 0.92, 1.00, 0.98, 1.02, 1.05, 1.057],
  },
  DEFAULT: {
    '1D': [0.990, 0.992, 0.994, 0.996, 0.998, 1.000, 0.998, 1.002, 1.000, 1.004, 1.002, 1.006, 1.004, 1.008, 1.006, 1.010, 1.008, 1.012, 1.010, 1.015, 1.012, 1.018, 1.015, 1.02],
    '1W': [0.95, 0.96, 0.97, 0.96, 0.98, 0.97, 0.99, 0.98, 1.00, 0.99, 1.01, 1.00, 1.02, 1.01, 1.03, 1.02, 1.04, 1.03, 1.02, 1.01, 1.02, 1.015, 1.018, 1.02],
    '1M': [0.85, 0.87, 0.86, 0.89, 0.88, 0.91, 0.90, 0.93, 0.92, 0.95, 0.94, 0.97, 0.96, 0.99, 0.98, 1.01, 1.00, 1.03, 1.02, 1.01, 1.02, 1.015, 1.018, 1.02],
    '3M': [0.72, 0.75, 0.78, 0.76, 0.80, 0.82, 0.85, 0.83, 0.88, 0.90, 0.88, 0.92, 0.95, 0.93, 0.98, 1.00, 0.98, 1.02, 1.00, 1.01, 1.02, 1.015, 1.018, 1.02],
    '1Y': [0.50, 0.55, 0.52, 0.60, 0.58, 0.65, 0.70, 0.68, 0.75, 0.80, 0.78, 0.85, 0.88, 0.85, 0.92, 0.95, 0.92, 0.98, 1.00, 1.01, 1.02, 1.015, 1.018, 1.02],
    'ALL': [0.30, 0.35, 0.38, 0.42, 0.45, 0.50, 0.55, 0.60, 0.58, 0.65, 0.70, 0.68, 0.78, 0.82, 0.80, 0.88, 0.92, 0.90, 0.95, 1.00, 1.02, 1.015, 1.018, 1.02],
  },
};

// Generate smooth chart data with interpolation
const generatePriceChartData = (
  currentPrice: number,
  asset: string,
  range: TimeRange
): number[] => {
  const patterns = ASSET_PRICE_PATTERNS[asset] || ASSET_PRICE_PATTERNS.DEFAULT;
  const basePattern = patterns[range];

  // Interpolate to more points for smooth chart
  const targetPoints = 60;
  const result: number[] = [];

  for (let i = 0; i < targetPoints; i++) {
    const progress = i / (targetPoints - 1);
    const patternIndex = progress * (basePattern.length - 1);
    const lowerIndex = Math.floor(patternIndex);
    const upperIndex = Math.min(lowerIndex + 1, basePattern.length - 1);
    const t = patternIndex - lowerIndex;

    // Smooth interpolation
    const baseMultiplier = basePattern[lowerIndex] * (1 - t) + basePattern[upperIndex] * t;

    // Add micro-noise for realism
    const noise = (Math.sin(i * 0.8) * 0.003 + Math.sin(i * 2.1) * 0.002);
    const multiplier = baseMultiplier + noise;

    result.push(currentPrice * multiplier);
  }

  // Ensure last point is current price
  result[result.length - 1] = currentPrice;

  return result;
};

export function InstrumentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<DetailRouteProp>();
  const { instrumentId } = route.params;

  // State for chart
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [touchX, setTouchX] = useState<number | null>(null);

  // State for setup gate modal
  const [showGateModal, setShowGateModal] = useState(false);
  const [pendingTradeAction, setPendingTradeAction] = useState<{ side: 'buy' | 'sell' } | null>(null);

  // KYC and funding store for trade gate
  const kycStatus = useKYCStore((state) => state.status);
  const paymentMethods = useFundingStore((state) => state.paymentMethods);

  // Check if user needs onboarding (KYC or bank linking)
  const needsOnboarding = kycStatus !== 'verified' || paymentMethods.length === 0;

  // Handle trade button press with gate check
  const handleTradePress = (side: 'buy' | 'sell') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (needsOnboarding) {
      // Show gate modal
      setPendingTradeAction({ side });
      setShowGateModal(true);
    } else {
      // Proceed to trade
      navigation.navigate('Trade' as never, { instrumentId, side } as never);
    }
  };

  // Handle gate modal "Get Started" - navigate to onboarding
  const handleStartOnboarding = () => {
    setShowGateModal(false);
    navigation.navigate('Onboarding' as never, {
      returnTo: {
        screen: 'InstrumentDetail',
        params: { instrumentId },
      },
    } as never);
  };

  // Determine asset type
  const isEvent = instrumentId.startsWith('KX') || EVENT_CONTRACT_INFO[instrumentId] !== undefined;
  const isStock = DEMO_STOCKS.some((s) => s.symbol === instrumentId);
  const isCrypto = !isEvent && !isStock;

  // Get event info from our local data if available
  const eventInfo = EVENT_CONTRACT_INFO[instrumentId];

  // Get stock data if it's a stock
  const stockData = isStock ? DEMO_STOCKS.find((s) => s.symbol === instrumentId) : null;
  const stockQuote = isStock ? DEMO_STOCK_QUOTES[instrumentId] : null;
  const stockCompanyInfo = isStock ? STOCK_COMPANY_INFO[instrumentId] : null;

  // Get market status for stocks
  const marketStatus = isStock ? getMarketStatus() : null;

  // Get crypto info for the base asset
  const baseAsset = isStock ? instrumentId : instrumentId.split('-')[0];
  const cryptoInfo = isCrypto ? CRYPTO_INFO[baseAsset] : null;

  // Get transaction history from portfolio store
  const { transactions } = usePortfolioStore();

  // Filter transactions for this specific asset
  const assetTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Match by asset symbol
        if (tx.asset === baseAsset) return true;
        // For swaps, also include if this asset was the destination
        if (tx.type === 'swap' && tx.toAsset === baseAsset) return true;
        return false;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, baseAsset]);

  // Helper to format transaction date
  const formatTxDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Transaction type display info
  const getTxTypeInfo = (tx: TradeTransaction) => {
    const isSwapTo = tx.type === 'swap' && tx.toAsset === baseAsset;

    switch (tx.type) {
      case 'buy':
        return { label: 'Bought', icon: '↓', color: '#00D4AA', sign: '+' };
      case 'sell':
        return { label: 'Sold', icon: '↑', color: '#FF4D4D', sign: '-' };
      case 'send':
        return { label: 'Sent', icon: '→', color: '#FF9500', sign: '-' };
      case 'receive':
        return { label: 'Received', icon: '←', color: '#007AFF', sign: '+' };
      case 'swap':
        if (isSwapTo) {
          return { label: 'Swapped to', icon: '⇄', color: '#AF52DE', sign: '+' };
        }
        return { label: 'Swapped from', icon: '⇄', color: '#AF52DE', sign: '-' };
      default:
        return { label: tx.type, icon: '•', color: '#666666', sign: '' };
    }
  };

  // Get quantity for display (handle swaps specially)
  const getTxQuantity = (tx: TradeTransaction) => {
    if (tx.type === 'swap' && tx.toAsset === baseAsset) {
      return tx.toQuantity || 0;
    }
    return tx.quantity;
  };

  const { data: instrument } = useQuery({
    queryKey: ['instrument', instrumentId],
    queryFn: () => api.getInstrument(instrumentId),
  });

  const { data: quote } = useQuery({
    queryKey: ['quote', instrumentId],
    queryFn: () => api.getQuote(instrumentId),
    refetchInterval: 2000,
  });

  const { data: position } = useQuery({
    queryKey: ['position', instrumentId],
    queryFn: () => api.getPosition(instrumentId),
  });

  // Get demo price data for fallback
  const demoPrice = isEvent
    ? EVENT_DEMO_PRICES[instrumentId]
    : isStock
    ? stockQuote
    : DEMO_PRICES[baseAsset];

  // Calculate current price - use API data if available, otherwise demo prices
  const apiPrice = parseFloat(quote?.lastPrice || '0');
  const currentPrice = apiPrice > 0 ? apiPrice : (
    isEvent
      ? (demoPrice as { probability: number; change24h: number })?.probability || 0.5
      : isStock
      ? stockQuote?.price || 100
      : (demoPrice as { price: number; change24h: number })?.price || 100
  );

  // Calculate change - use API data if available, otherwise demo prices
  const apiChange = parseFloat(quote?.changePercent24h || quote?.change24h || '0');
  const change = apiChange !== 0 ? apiChange : (
    isStock
      ? (stockQuote?.changePercent || 0)
      : (demoPrice as { change24h?: number } | null)?.change24h || 0
  );
  const isPositive = change >= 0;

  // Generate chart data
  const chartWidth = SCREEN_WIDTH - CHART_PADDING * 2;
  const chartData = useMemo(() => {
    return generatePriceChartData(currentPrice, baseAsset, selectedRange);
  }, [currentPrice, baseAsset, selectedRange]);

  // Calculate chart paths
  const { linePath, areaPath, touchValue, chartMin, chartMax } = useMemo(() => {
    if (chartData.length < 2) return { linePath: '', areaPath: '', touchValue: null, chartMin: 0, chartMax: 0 };

    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 1;

    const padding = 4;
    const cWidth = chartWidth - padding * 2;
    const cHeight = CHART_HEIGHT - padding * 2;

    const points = chartData.map((value, index) => {
      const x = padding + (index / (chartData.length - 1)) * cWidth;
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
      const index = Math.round((touchX / chartWidth) * (chartData.length - 1));
      const clampedIndex = Math.max(0, Math.min(chartData.length - 1, index));
      touchValue = {
        value: chartData[clampedIndex],
        x: points[clampedIndex].x,
        y: points[clampedIndex].y,
      };
    }

    return { linePath, areaPath, touchValue, chartMin: min, chartMax: max };
  }, [chartData, chartWidth, touchX]);

  // Chart color based on performance
  const chartIsPositive = chartData.length > 1 && chartData[chartData.length - 1] >= chartData[0];
  const chartColor = chartIsPositive ? '#00D4AA' : '#FF4D4D';

  const timeRanges: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.watchlistButton}>☆</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Market Status Banner for Stocks */}
        {isStock && marketStatus && (
          <View style={[styles.marketStatusBanner, { backgroundColor: getSessionColor(marketStatus.session) + '20' }]}>
            <Text style={[styles.marketStatusIcon]}>{getSessionIcon(marketStatus.session)}</Text>
            <Text style={[styles.marketStatusText, { color: getSessionColor(marketStatus.session) }]}>
              {marketStatus.sessionLabel}
            </Text>
            <Text style={styles.marketStatusCountdown}>{marketStatus.countdown}</Text>
          </View>
        )}

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.instrumentHeader}>
            <Text style={styles.instrumentName}>
              {isStock ? stockData?.name : instrument?.displayName || instrumentId}
            </Text>
            {isStock && stockData && (
              <View style={styles.exchangeBadge}>
                <Text style={styles.exchangeBadgeText}>{stockData.exchange}</Text>
              </View>
            )}
          </View>
          <Text style={styles.price}>
            {isEvent
              ? `${(currentPrice * 100).toFixed(0)}¢`
              : formatCurrency(currentPrice)}
          </Text>
          <View style={styles.changeRow}>
            <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
              {isPositive ? '+' : ''}{formatPercent(change.toString())}
            </Text>
            <Text style={styles.changeLabel}>24h</Text>
            {isStock && stockQuote && (
              <Text style={[styles.changeDollar, isPositive ? styles.positive : styles.negative]}>
                ({isPositive ? '+' : ''}{formatCurrency(stockQuote.change)})
              </Text>
            )}
          </View>
        </View>

        {/* Price Chart */}
        <View style={styles.chartSection}>
          <View
            style={styles.chartContainer}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTouchX(e.nativeEvent.locationX);
            }}
            onResponderMove={(e) => setTouchX(e.nativeEvent.locationX)}
            onResponderRelease={() => setTouchX(null)}
          >
            {touchValue && (
              <View style={styles.touchValueContainer}>
                <Text style={styles.touchValuePrice}>
                  {isEvent
                    ? `${(touchValue.value * 100).toFixed(0)}¢`
                    : formatCurrency(touchValue.value)}
                </Text>
              </View>
            )}
            <Svg width={chartWidth} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <Stop offset="50%" stopColor={chartColor} stopOpacity={0.1} />
                  <Stop offset="100%" stopColor={chartColor} stopOpacity={0} />
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
                  stroke="#333333"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}

              {/* Area fill */}
              <Path d={areaPath} fill="url(#priceGradient)" />

              {/* Main line */}
              <Path
                d={linePath}
                stroke={chartColor}
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
                    stroke="#666666"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                  <Circle
                    cx={touchValue.x}
                    cy={touchValue.y}
                    r={6}
                    fill="#0D0D0D"
                    stroke={chartColor}
                    strokeWidth={3}
                  />
                </>
              )}
            </Svg>
          </View>

          {/* Time Range Selector */}
          <View style={styles.rangeSelector}>
            {timeRanges.map((range) => (
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

        {/* Event-specific info */}
        {isEvent && (
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>
              {eventInfo?.title || instrument?.metadata?.eventTitle || instrument?.displayName || instrumentId}
            </Text>
            <Text style={styles.eventDescription}>
              {eventInfo?.description || instrument?.metadata?.eventDescription || 'Event contract details loading...'}
            </Text>
            <View style={styles.eventMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Expires</Text>
                <Text style={styles.metaValue}>
                  {eventInfo?.expires ||
                   (instrument?.metadata?.expirationDate
                     ? new Date(instrument.metadata.expirationDate).toLocaleDateString()
                     : 'TBD')}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Settlement</Text>
                <Text style={styles.metaValue}>
                  {eventInfo?.settlementSource || instrument?.metadata?.settlementSource || 'Official Source'}
                </Text>
              </View>
            </View>
            {eventInfo?.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{eventInfo.category}</Text>
              </View>
            )}
            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityFill,
                  { width: `${currentPrice * 100}%` },
                ]}
              />
            </View>
            <View style={styles.probabilityLabels}>
              <Text style={styles.yesLabel}>
                Yes {(currentPrice * 100).toFixed(0)}%
              </Text>
              <Text style={styles.noLabel}>
                No {((1 - currentPrice) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}

        {/* Stats - Different for stocks vs crypto/events */}
        {isStock && stockQuote ? (
          <View style={styles.stats}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Open</Text>
                <Text style={styles.statValue}>{formatCurrency(stockQuote.open)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Prev Close</Text>
                <Text style={styles.statValue}>{formatCurrency(stockQuote.previousClose)}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Day High</Text>
                <Text style={styles.statValue}>{formatCurrency(stockQuote.high)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Day Low</Text>
                <Text style={styles.statValue}>{formatCurrency(stockQuote.low)}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>52W High</Text>
                <Text style={styles.statValue}>{formatCurrency(stockQuote.high52w)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>52W Low</Text>
                <Text style={styles.statValue}>{formatCurrency(stockQuote.low52w)}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Market Cap</Text>
                <Text style={styles.statValue}>{formatMarketCap(stockQuote.marketCap)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>P/E Ratio</Text>
                <Text style={styles.statValue}>
                  {stockQuote.peRatio ? stockQuote.peRatio.toFixed(2) : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Volume</Text>
                <Text style={styles.statValue}>{formatVolume(stockQuote.volume)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Avg Volume</Text>
                <Text style={styles.statValue}>{formatVolume(stockQuote.avgVolume)}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Dividend Yield</Text>
                <Text style={styles.statValue}>
                  {stockQuote.dividendYield ? `${stockQuote.dividendYield.toFixed(2)}%` : 'N/A'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Beta</Text>
                <Text style={styles.statValue}>{stockQuote.beta.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.stats}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>24h High</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(parseFloat(quote?.high24h || '0') || currentPrice * 1.02)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>24h Low</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(parseFloat(quote?.low24h || '0') || currentPrice * 0.98)}
                </Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>24h Volume</Text>
                <Text style={styles.statValue}>
                  {quote?.volume24h || (isEvent ? '1.2M contracts' : '$24.5M')}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Bid / Ask</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(parseFloat(quote?.bidPrice || '0') || currentPrice * 0.999)} / {formatCurrency(parseFloat(quote?.askPrice || '0') || currentPrice * 1.001)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Your Position */}
        {position && (
          <View style={styles.positionCard}>
            <Text style={styles.positionTitle}>Your Position</Text>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Quantity</Text>
              <Text style={styles.positionValue}>{position.quantity}</Text>
            </View>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Avg Cost</Text>
              <Text style={styles.positionValue}>{formatCurrency(position.avgCost)}</Text>
            </View>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Market Value</Text>
              <Text style={styles.positionValue}>{formatCurrency(position.marketValue)}</Text>
            </View>
            <View style={styles.positionRow}>
              <Text style={styles.positionLabel}>Unrealized P&L</Text>
              <Text
                style={[
                  styles.positionValue,
                  parseFloat(position.unrealizedPnl) >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {parseFloat(position.unrealizedPnl) >= 0 ? '+' : ''}
                {formatCurrency(position.unrealizedPnl)} ({formatPercent(position.unrealizedPnlPercent)})
              </Text>
            </View>
          </View>
        )}

        {/* About Section */}
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>
            About {isEvent ? 'This Contract' : isStock ? stockData?.name : (cryptoInfo?.name || instrument?.baseAsset || baseAsset)}
          </Text>
          <Text style={styles.aboutText}>
            {isEvent
              ? (eventInfo?.description ||
                 'This is a binary event contract. It pays $1 if the event occurs and $0 if it does not. Trade based on your prediction of the outcome.')
              : isStock
              ? (stockCompanyInfo?.description ||
                 `${stockData?.name} (${instrumentId}) is a publicly traded company on the ${stockData?.exchange}. Stock trading involves risk. Only trade with funds you can afford to lose.`)
              : (cryptoInfo?.description ||
                 `${instrument?.baseAsset || baseAsset} is a cryptocurrency that can be traded on supported exchanges. Trading involves risk. Only trade with funds you can afford to lose.`)}
          </Text>
          {isEvent && (
            <View style={styles.riskDisclosure}>
              <Text style={styles.riskText}>
                Event contracts are speculative instruments. Past performance does not guarantee future results. Only trade with funds you can afford to lose.
              </Text>
            </View>
          )}
        </View>

        {/* Transaction History */}
        {!isEvent && (
          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Your Activity</Text>
            {assetTransactions.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyActivityIcon}>📊</Text>
                <Text style={styles.emptyActivityText}>No transactions yet</Text>
                <Text style={styles.emptyActivitySubtext}>
                  Your {baseAsset} transactions will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.transactionList}>
                {assetTransactions.map((tx) => {
                  const typeInfo = getTxTypeInfo(tx);
                  const quantity = getTxQuantity(tx);
                  const isSwapTo = tx.type === 'swap' && tx.toAsset === baseAsset;

                  return (
                    <View key={tx.id} style={styles.transactionItem}>
                      <View style={styles.txLeft}>
                        <View style={[styles.txIconWrapper, { backgroundColor: typeInfo.color + '20' }]}>
                          <Text style={[styles.txIcon, { color: typeInfo.color }]}>{typeInfo.icon}</Text>
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={styles.txType}>{typeInfo.label}</Text>
                          <Text style={styles.txDate}>{formatTxDate(tx.timestamp)}</Text>
                        </View>
                      </View>
                      <View style={styles.txRight}>
                        <Text style={[styles.txQuantity, { color: typeInfo.color }]}>
                          {typeInfo.sign}{quantity.toFixed(quantity < 1 ? 6 : 4)} {isSwapTo ? tx.toAsset : tx.asset}
                        </Text>
                        {tx.total > 0 && (
                          <Text style={styles.txValue}>{formatCurrency(tx.total)}</Text>
                        )}
                        {tx.type === 'swap' && !isSwapTo && tx.toAsset && (
                          <Text style={styles.txSwapInfo}>→ {tx.toQuantity?.toFixed(4)} {tx.toAsset}</Text>
                        )}
                        {tx.type === 'swap' && isSwapTo && (
                          <Text style={styles.txSwapInfo}>← {tx.quantity.toFixed(4)} {tx.asset}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Trade Buttons */}
      <View style={styles.footer}>
        {isEvent ? (
          <View style={styles.eventButtons}>
            <TouchableOpacity
              style={[styles.tradeButton, styles.yesButton]}
              onPress={() => handleTradePress('buy')}
            >
              <Text style={styles.tradeButtonText}>Buy Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tradeButton, styles.noButton]}
              onPress={() => handleTradePress('sell')}
            >
              <Text style={styles.tradeButtonText}>Buy No</Text>
            </TouchableOpacity>
          </View>
        ) : isStock ? (
          /* Stock buttons - Buy, Sell, and Options */
          <View style={styles.stockButtonsContainer}>
            <View style={styles.stockButtons}>
              <TouchableOpacity
                style={[styles.tradeButton, styles.buyButton]}
                onPress={() => handleTradePress('buy')}
              >
                <Text style={styles.tradeButtonText}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tradeButton, styles.sellButton]}
                onPress={() => handleTradePress('sell')}
              >
                <Text style={styles.tradeButtonText}>Sell</Text>
              </TouchableOpacity>
            </View>
            {/* Options Trading Button - only for stocks with options */}
            {hasOptions(instrumentId) && (
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('OptionsChain' as never, { symbol: instrumentId } as never);
                }}
              >
                <View style={styles.optionsTextContainer}>
                  <Text style={styles.optionsButtonText}>Trade Options</Text>
                  <Text style={styles.optionsSubtext}>Calls & Puts</Text>
                </View>
                <Text style={styles.optionsArrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cryptoButtonsContainer}>
            {/* Primary Actions: Buy & Sell */}
            <View style={styles.cryptoButtons}>
              <TouchableOpacity
                style={[styles.tradeButton, styles.buyButton]}
                onPress={() => handleTradePress('buy')}
              >
                <Text style={styles.tradeButtonText}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tradeButton, styles.sellButton]}
                onPress={() => handleTradePress('sell')}
              >
                <Text style={styles.tradeButtonText}>Sell</Text>
              </TouchableOpacity>
            </View>
            {/* Secondary Actions: Swap & Send - Crypto only */}
            <View style={styles.secondaryButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Swap' as never, { fromAsset: baseAsset } as never)}
              >
                <Text style={styles.secondaryIcon}>⇄</Text>
                <Text style={styles.secondaryButtonText}>Swap</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Send' as never, { asset: baseAsset } as never)}
              >
                <Text style={styles.secondaryIcon}>↑</Text>
                <Text style={styles.secondaryButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Setup Gate Modal */}
      <SetupGateModal
        visible={showGateModal}
        onClose={() => setShowGateModal(false)}
        onGetStarted={handleStartOnboarding}
        assetName={instrument?.displayName || baseAsset}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#00D4AA',
  },
  watchlistButton: {
    fontSize: 24,
    color: '#666666',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  // Market Status Banner (for stocks)
  marketStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  marketStatusIcon: {
    fontSize: 14,
  },
  marketStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  marketStatusCountdown: {
    fontSize: 12,
    color: '#999999',
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instrumentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  instrumentName: {
    fontSize: 16,
    color: '#666666',
  },
  exchangeBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  exchangeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
  },
  changeDollar: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  change: {
    fontSize: 18,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 14,
    color: '#666666',
  },
  positive: {
    color: '#00D4AA',
  },
  negative: {
    color: '#FF4D4D',
  },
  // Chart styles
  chartSection: {
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  touchValueContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  touchValuePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeButtonActive: {
    backgroundColor: '#2A2A2A',
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  rangeButtonTextActive: {
    color: '#00D4AA',
    fontWeight: '700',
  },
  eventInfo: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
  },
  eventMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  probabilityBar: {
    height: 8,
    backgroundColor: '#FF4D4D',
    borderRadius: 4,
    marginBottom: 8,
  },
  probabilityFill: {
    height: '100%',
    backgroundColor: '#00D4AA',
    borderRadius: 4,
  },
  probabilityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yesLabel: {
    fontSize: 14,
    color: '#00D4AA',
  },
  noLabel: {
    fontSize: 14,
    color: '#FF4D4D',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D4AA',
  },
  stats: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  positionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  positionLabel: {
    fontSize: 14,
    color: '#666666',
  },
  positionValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  about: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#999999',
    lineHeight: 20,
  },
  riskDisclosure: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4D4D',
  },
  riskText: {
    fontSize: 12,
    color: '#FF9999',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D0D',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  eventButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  stockButtonsContainer: {
    gap: 12,
  },
  stockButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  optionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    padding: 16,
  },
  optionsTextContainer: {
    flex: 1,
  },
  optionsButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  optionsSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  optionsArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cryptoButtonsContainer: {
    gap: 12,
  },
  cryptoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 6,
  },
  secondaryIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tradeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#00D4AA',
  },
  sellButton: {
    backgroundColor: '#FF4D4D',
  },
  yesButton: {
    backgroundColor: '#00D4AA',
  },
  noButton: {
    backgroundColor: '#FF4D4D',
  },
  tradeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Transaction History Styles
  activitySection: {
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyActivity: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyActivityIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  transactionList: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 13,
    color: '#666666',
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txQuantity: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  txValue: {
    fontSize: 13,
    color: '#999999',
  },
  txSwapInfo: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});
