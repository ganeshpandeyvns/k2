// ============================================================================
// Mock Stock Data - Demo mode stock trading data
// ============================================================================

export interface StockInstrument {
  symbol: string;
  name: string;
  exchange: 'NYSE' | 'NASDAQ';
  sector: string;
  type: 'stock';
  fractionalEnabled: boolean;
  extendedHoursEnabled: boolean;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  high52w: number;
  low52w: number;
  dividendYield: number | null;
  beta: number;
}

export interface StockCompanyInfo {
  symbol: string;
  name: string;
  description: string;
  ceo: string;
  employees: number;
  headquarters: string;
  founded: number;
  website: string;
}

// ============================================================================
// Demo Stock Instruments
// ============================================================================

export const DEMO_STOCKS: StockInstrument[] = [
  // Tech Giants
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },

  // More Tech
  { symbol: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ', sector: 'Communication Services', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'CRM', name: 'Salesforce, Inc.', exchange: 'NYSE', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ', sector: 'Technology', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },

  // Finance
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE', sector: 'Financial Services', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'GS', name: 'Goldman Sachs Group', exchange: 'NYSE', sector: 'Financial Services', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', sector: 'Financial Services', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },

  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'UNH', name: 'UnitedHealth Group', exchange: 'NYSE', sector: 'Healthcare', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', sector: 'Healthcare', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'MRK', name: 'Merck & Co., Inc.', exchange: 'NYSE', sector: 'Healthcare', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'ABBV', name: 'AbbVie Inc.', exchange: 'NYSE', sector: 'Healthcare', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },

  // Consumer
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Defensive', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'KO', name: 'Coca-Cola Company', exchange: 'NYSE', sector: 'Consumer Defensive', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', exchange: 'NASDAQ', sector: 'Consumer Defensive', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'MCD', name: "McDonald's Corporation", exchange: 'NYSE', sector: 'Consumer Cyclical', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'NKE', name: 'NIKE, Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },

  // Energy & Industrial
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', sector: 'Energy', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', sector: 'Energy', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE', sector: 'Industrials', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
  { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE', sector: 'Industrials', type: 'stock', fractionalEnabled: true, extendedHoursEnabled: true },
];

// ============================================================================
// Demo Stock Quotes
// ============================================================================

export const DEMO_STOCK_QUOTES: Record<string, StockQuote> = {
  // Tech Giants
  AAPL: {
    symbol: 'AAPL',
    price: 178.45,
    change: 2.34,
    changePercent: 1.33,
    open: 176.50,
    high: 179.20,
    low: 175.80,
    previousClose: 176.11,
    volume: 52_340_000,
    avgVolume: 58_200_000,
    marketCap: 2_780_000_000_000,
    peRatio: 28.5,
    high52w: 199.62,
    low52w: 164.08,
    dividendYield: 0.56,
    beta: 1.28,
  },
  MSFT: {
    symbol: 'MSFT',
    price: 378.91,
    change: 4.56,
    changePercent: 1.22,
    open: 375.00,
    high: 380.50,
    low: 374.20,
    previousClose: 374.35,
    volume: 22_150_000,
    avgVolume: 25_400_000,
    marketCap: 2_810_000_000_000,
    peRatio: 35.2,
    high52w: 420.82,
    low52w: 309.45,
    dividendYield: 0.74,
    beta: 0.89,
  },
  GOOGL: {
    symbol: 'GOOGL',
    price: 141.89,
    change: -1.23,
    changePercent: -0.86,
    open: 143.50,
    high: 144.20,
    low: 141.00,
    previousClose: 143.12,
    volume: 28_450_000,
    avgVolume: 32_100_000,
    marketCap: 1_750_000_000_000,
    peRatio: 24.8,
    high52w: 153.78,
    low52w: 115.35,
    dividendYield: null,
    beta: 1.05,
  },
  AMZN: {
    symbol: 'AMZN',
    price: 178.23,
    change: 3.45,
    changePercent: 1.97,
    open: 175.00,
    high: 179.50,
    low: 174.80,
    previousClose: 174.78,
    volume: 45_230_000,
    avgVolume: 48_900_000,
    marketCap: 1_860_000_000_000,
    peRatio: 62.4,
    high52w: 191.70,
    low52w: 118.35,
    dividendYield: null,
    beta: 1.16,
  },
  META: {
    symbol: 'META',
    price: 485.12,
    change: 8.67,
    changePercent: 1.82,
    open: 478.00,
    high: 488.50,
    low: 476.20,
    previousClose: 476.45,
    volume: 15_670_000,
    avgVolume: 18_200_000,
    marketCap: 1_240_000_000_000,
    peRatio: 28.9,
    high52w: 531.49,
    low52w: 274.38,
    dividendYield: 0.42,
    beta: 1.24,
  },
  NVDA: {
    symbol: 'NVDA',
    price: 721.33,
    change: 15.89,
    changePercent: 2.25,
    open: 708.00,
    high: 725.80,
    low: 705.50,
    previousClose: 705.44,
    volume: 42_890_000,
    avgVolume: 52_300_000,
    marketCap: 1_780_000_000_000,
    peRatio: 65.2,
    high52w: 974.00,
    low52w: 373.56,
    dividendYield: 0.02,
    beta: 1.72,
  },
  TSLA: {
    symbol: 'TSLA',
    price: 245.67,
    change: -5.23,
    changePercent: -2.08,
    open: 252.00,
    high: 254.30,
    low: 243.80,
    previousClose: 250.90,
    volume: 98_120_000,
    avgVolume: 112_500_000,
    marketCap: 782_000_000_000,
    peRatio: 72.8,
    high52w: 299.29,
    low52w: 138.80,
    dividendYield: null,
    beta: 2.31,
  },
  // More Tech
  NFLX: {
    symbol: 'NFLX',
    price: 628.45,
    change: 12.34,
    changePercent: 2.00,
    open: 618.00,
    high: 632.50,
    low: 615.20,
    previousClose: 616.11,
    volume: 5_450_000,
    avgVolume: 6_200_000,
    marketCap: 272_000_000_000,
    peRatio: 42.5,
    high52w: 700.99,
    low52w: 344.73,
    dividendYield: null,
    beta: 1.42,
  },
  CRM: {
    symbol: 'CRM',
    price: 267.89,
    change: 3.21,
    changePercent: 1.21,
    open: 265.00,
    high: 269.50,
    low: 264.20,
    previousClose: 264.68,
    volume: 4_230_000,
    avgVolume: 5_100_000,
    marketCap: 260_000_000_000,
    peRatio: 45.8,
    high52w: 318.71,
    low52w: 212.00,
    dividendYield: null,
    beta: 1.18,
  },
  ORCL: {
    symbol: 'ORCL',
    price: 125.67,
    change: 1.89,
    changePercent: 1.53,
    open: 124.00,
    high: 126.50,
    low: 123.50,
    previousClose: 123.78,
    volume: 8_900_000,
    avgVolume: 10_200_000,
    marketCap: 345_000_000_000,
    peRatio: 32.4,
    high52w: 132.77,
    low52w: 99.26,
    dividendYield: 1.28,
    beta: 0.92,
  },
  ADBE: {
    symbol: 'ADBE',
    price: 542.34,
    change: -8.56,
    changePercent: -1.55,
    open: 552.00,
    high: 554.20,
    low: 540.00,
    previousClose: 550.90,
    volume: 3_120_000,
    avgVolume: 3_800_000,
    marketCap: 242_000_000_000,
    peRatio: 44.2,
    high52w: 638.25,
    low52w: 433.97,
    dividendYield: null,
    beta: 1.32,
  },
  INTC: {
    symbol: 'INTC',
    price: 31.45,
    change: -0.67,
    changePercent: -2.09,
    open: 32.20,
    high: 32.50,
    low: 31.20,
    previousClose: 32.12,
    volume: 45_670_000,
    avgVolume: 52_400_000,
    marketCap: 132_000_000_000,
    peRatio: null,
    high52w: 51.28,
    low52w: 29.73,
    dividendYield: 1.59,
    beta: 0.98,
  },
  AMD: {
    symbol: 'AMD',
    price: 156.78,
    change: 4.32,
    changePercent: 2.83,
    open: 153.00,
    high: 158.50,
    low: 152.20,
    previousClose: 152.46,
    volume: 52_340_000,
    avgVolume: 58_900_000,
    marketCap: 253_000_000_000,
    peRatio: 298.5,
    high52w: 227.30,
    low52w: 93.12,
    dividendYield: null,
    beta: 1.68,
  },
  // Finance
  JPM: {
    symbol: 'JPM',
    price: 198.45,
    change: 2.12,
    changePercent: 1.08,
    open: 196.50,
    high: 199.80,
    low: 195.90,
    previousClose: 196.33,
    volume: 8_450_000,
    avgVolume: 9_800_000,
    marketCap: 572_000_000_000,
    peRatio: 11.2,
    high52w: 205.88,
    low52w: 135.19,
    dividendYield: 2.32,
    beta: 1.12,
  },
  BAC: {
    symbol: 'BAC',
    price: 37.89,
    change: 0.45,
    changePercent: 1.20,
    open: 37.50,
    high: 38.20,
    low: 37.30,
    previousClose: 37.44,
    volume: 35_670_000,
    avgVolume: 42_100_000,
    marketCap: 298_000_000_000,
    peRatio: 12.5,
    high52w: 39.70,
    low52w: 24.96,
    dividendYield: 2.53,
    beta: 1.38,
  },
  GS: {
    symbol: 'GS',
    price: 456.78,
    change: 5.67,
    changePercent: 1.26,
    open: 452.00,
    high: 459.50,
    low: 450.80,
    previousClose: 451.11,
    volume: 2_340_000,
    avgVolume: 2_900_000,
    marketCap: 148_000_000_000,
    peRatio: 14.8,
    high52w: 479.36,
    low52w: 289.36,
    dividendYield: 2.19,
    beta: 1.35,
  },
  V: {
    symbol: 'V',
    price: 278.90,
    change: 3.45,
    changePercent: 1.25,
    open: 276.00,
    high: 280.50,
    low: 275.20,
    previousClose: 275.45,
    volume: 6_780_000,
    avgVolume: 7_500_000,
    marketCap: 565_000_000_000,
    peRatio: 29.8,
    high52w: 290.96,
    low52w: 227.68,
    dividendYield: 0.76,
    beta: 0.95,
  },
  MA: {
    symbol: 'MA',
    price: 456.23,
    change: 4.89,
    changePercent: 1.08,
    open: 452.00,
    high: 458.80,
    low: 450.50,
    previousClose: 451.34,
    volume: 2_890_000,
    avgVolume: 3_400_000,
    marketCap: 428_000_000_000,
    peRatio: 34.5,
    high52w: 490.00,
    low52w: 359.77,
    dividendYield: 0.58,
    beta: 1.08,
  },
  // Healthcare
  JNJ: {
    symbol: 'JNJ',
    price: 156.78,
    change: 1.23,
    changePercent: 0.79,
    open: 155.50,
    high: 157.50,
    low: 155.00,
    previousClose: 155.55,
    volume: 7_890_000,
    avgVolume: 8_500_000,
    marketCap: 378_000_000_000,
    peRatio: 15.2,
    high52w: 175.97,
    low52w: 143.13,
    dividendYield: 3.04,
    beta: 0.52,
  },
  UNH: {
    symbol: 'UNH',
    price: 512.34,
    change: -6.78,
    changePercent: -1.31,
    open: 520.00,
    high: 522.50,
    low: 510.00,
    previousClose: 519.12,
    volume: 3_450_000,
    avgVolume: 4_100_000,
    marketCap: 472_000_000_000,
    peRatio: 21.8,
    high52w: 554.70,
    low52w: 436.38,
    dividendYield: 1.42,
    beta: 0.68,
  },
  PFE: {
    symbol: 'PFE',
    price: 28.45,
    change: 0.34,
    changePercent: 1.21,
    open: 28.20,
    high: 28.80,
    low: 28.00,
    previousClose: 28.11,
    volume: 42_340_000,
    avgVolume: 48_200_000,
    marketCap: 160_000_000_000,
    peRatio: 12.8,
    high52w: 31.54,
    low52w: 25.20,
    dividendYield: 5.86,
    beta: 0.62,
  },
  MRK: {
    symbol: 'MRK',
    price: 125.67,
    change: 1.89,
    changePercent: 1.53,
    open: 124.00,
    high: 126.50,
    low: 123.50,
    previousClose: 123.78,
    volume: 8_900_000,
    avgVolume: 10_200_000,
    marketCap: 318_000_000_000,
    peRatio: 18.5,
    high52w: 134.63,
    low52w: 99.14,
    dividendYield: 2.45,
    beta: 0.45,
  },
  ABBV: {
    symbol: 'ABBV',
    price: 172.34,
    change: 2.45,
    changePercent: 1.44,
    open: 170.00,
    high: 173.50,
    low: 169.50,
    previousClose: 169.89,
    volume: 5_670_000,
    avgVolume: 6_800_000,
    marketCap: 304_000_000_000,
    peRatio: 22.4,
    high52w: 182.38,
    low52w: 135.85,
    dividendYield: 3.54,
    beta: 0.58,
  },
  // Consumer
  WMT: {
    symbol: 'WMT',
    price: 165.89,
    change: 1.23,
    changePercent: 0.75,
    open: 165.00,
    high: 166.80,
    low: 164.50,
    previousClose: 164.66,
    volume: 6_780_000,
    avgVolume: 7_900_000,
    marketCap: 446_000_000_000,
    peRatio: 28.5,
    high52w: 169.94,
    low52w: 143.89,
    dividendYield: 1.34,
    beta: 0.52,
  },
  KO: {
    symbol: 'KO',
    price: 61.23,
    change: 0.45,
    changePercent: 0.74,
    open: 60.80,
    high: 61.50,
    low: 60.50,
    previousClose: 60.78,
    volume: 12_340_000,
    avgVolume: 14_500_000,
    marketCap: 264_000_000_000,
    peRatio: 23.8,
    high52w: 64.99,
    low52w: 57.93,
    dividendYield: 3.04,
    beta: 0.58,
  },
  PEP: {
    symbol: 'PEP',
    price: 172.45,
    change: 1.67,
    changePercent: 0.98,
    open: 171.00,
    high: 173.50,
    low: 170.50,
    previousClose: 170.78,
    volume: 4_560_000,
    avgVolume: 5_200_000,
    marketCap: 236_000_000_000,
    peRatio: 25.2,
    high52w: 183.41,
    low52w: 155.83,
    dividendYield: 2.98,
    beta: 0.52,
  },
  MCD: {
    symbol: 'MCD',
    price: 289.56,
    change: 3.45,
    changePercent: 1.21,
    open: 286.50,
    high: 291.20,
    low: 285.80,
    previousClose: 286.11,
    volume: 3_120_000,
    avgVolume: 3_800_000,
    marketCap: 207_000_000_000,
    peRatio: 24.5,
    high52w: 302.39,
    low52w: 243.53,
    dividendYield: 2.25,
    beta: 0.68,
  },
  NKE: {
    symbol: 'NKE',
    price: 98.45,
    change: -1.23,
    changePercent: -1.23,
    open: 100.00,
    high: 100.80,
    low: 97.80,
    previousClose: 99.68,
    volume: 8_450_000,
    avgVolume: 9_800_000,
    marketCap: 148_000_000_000,
    peRatio: 28.5,
    high52w: 123.39,
    low52w: 88.66,
    dividendYield: 1.52,
    beta: 1.12,
  },
  DIS: {
    symbol: 'DIS',
    price: 112.34,
    change: 2.12,
    changePercent: 1.92,
    open: 110.50,
    high: 113.50,
    low: 109.80,
    previousClose: 110.22,
    volume: 9_780_000,
    avgVolume: 11_200_000,
    marketCap: 205_000_000_000,
    peRatio: 72.5,
    high52w: 123.74,
    low52w: 83.91,
    dividendYield: null,
    beta: 1.28,
  },
  // Energy & Industrial
  XOM: {
    symbol: 'XOM',
    price: 112.45,
    change: 1.89,
    changePercent: 1.71,
    open: 111.00,
    high: 113.50,
    low: 110.50,
    previousClose: 110.56,
    volume: 15_670_000,
    avgVolume: 18_200_000,
    marketCap: 448_000_000_000,
    peRatio: 13.5,
    high52w: 120.70,
    low52w: 95.77,
    dividendYield: 3.32,
    beta: 0.92,
  },
  CVX: {
    symbol: 'CVX',
    price: 156.78,
    change: 2.34,
    changePercent: 1.52,
    open: 155.00,
    high: 158.20,
    low: 154.50,
    previousClose: 154.44,
    volume: 7_890_000,
    avgVolume: 9_100_000,
    marketCap: 290_000_000_000,
    peRatio: 14.2,
    high52w: 171.70,
    low52w: 139.62,
    dividendYield: 4.02,
    beta: 1.08,
  },
  BA: {
    symbol: 'BA',
    price: 178.90,
    change: -3.45,
    changePercent: -1.89,
    open: 183.00,
    high: 184.50,
    low: 177.50,
    previousClose: 182.35,
    volume: 6_450_000,
    avgVolume: 7_800_000,
    marketCap: 108_000_000_000,
    peRatio: null,
    high52w: 267.54,
    low52w: 159.70,
    dividendYield: null,
    beta: 1.52,
  },
  CAT: {
    symbol: 'CAT',
    price: 345.67,
    change: 4.56,
    changePercent: 1.34,
    open: 342.00,
    high: 348.50,
    low: 340.80,
    previousClose: 341.11,
    volume: 2_340_000,
    avgVolume: 2_900_000,
    marketCap: 168_000_000_000,
    peRatio: 16.8,
    high52w: 367.87,
    low52w: 227.21,
    dividendYield: 1.52,
    beta: 1.05,
  },
};

// ============================================================================
// Company Information
// ============================================================================

export const STOCK_COMPANY_INFO: Record<string, StockCompanyInfo> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, and wearables, home, and accessories.',
    ceo: 'Tim Cook',
    employees: 164_000,
    headquarters: 'Cupertino, California',
    founded: 1976,
    website: 'https://apple.com',
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates through Productivity and Business Processes, Intelligent Cloud, and More Personal Computing segments.',
    ceo: 'Satya Nadella',
    employees: 221_000,
    headquarters: 'Redmond, Washington',
    founded: 1975,
    website: 'https://microsoft.com',
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    description: 'Alphabet Inc. provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets segments.',
    ceo: 'Sundar Pichai',
    employees: 182_000,
    headquarters: 'Mountain View, California',
    founded: 1998,
    website: 'https://abc.xyz',
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally. The company operates through North America, International, and AWS segments.',
    ceo: 'Andy Jassy',
    employees: 1_525_000,
    headquarters: 'Seattle, Washington',
    founded: 1994,
    website: 'https://amazon.com',
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    description: 'Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables worldwide.',
    ceo: 'Mark Zuckerberg',
    employees: 67_000,
    headquarters: 'Menlo Park, California',
    founded: 2004,
    website: 'https://meta.com',
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    description: 'NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally. The company operates through Graphics and Compute & Networking segments.',
    ceo: 'Jensen Huang',
    employees: 29_600,
    headquarters: 'Santa Clara, California',
    founded: 1993,
    website: 'https://nvidia.com',
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally.',
    ceo: 'Elon Musk',
    employees: 140_000,
    headquarters: 'Austin, Texas',
    founded: 2003,
    website: 'https://tesla.com',
  },
  JPM: {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    description: 'JPMorgan Chase & Co. operates as a financial services company worldwide. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management.',
    ceo: 'Jamie Dimon',
    employees: 309_000,
    headquarters: 'New York, New York',
    founded: 1799,
    website: 'https://jpmorganchase.com',
  },
};

// ============================================================================
// Stock Categories for Markets Screen
// ============================================================================

export const STOCK_CATEGORIES = [
  {
    id: 'popular',
    title: 'Most Popular',
    symbols: ['AAPL', 'TSLA', 'AMZN', 'NVDA', 'MSFT', 'META'],
  },
  {
    id: 'tech',
    title: 'Technology',
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'NFLX', 'CRM', 'ADBE', 'AMD', 'INTC'],
  },
  {
    id: 'finance',
    title: 'Financial Services',
    symbols: ['JPM', 'BAC', 'GS', 'V', 'MA'],
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    symbols: ['JNJ', 'UNH', 'PFE', 'MRK', 'ABBV'],
  },
  {
    id: 'consumer',
    title: 'Consumer',
    symbols: ['AMZN', 'TSLA', 'WMT', 'MCD', 'NKE', 'DIS', 'KO', 'PEP'],
  },
  {
    id: 'energy',
    title: 'Energy & Industrial',
    symbols: ['XOM', 'CVX', 'BA', 'CAT'],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getStockBySymbol(symbol: string): StockInstrument | undefined {
  return DEMO_STOCKS.find((s) => s.symbol === symbol);
}

export function getStockQuote(symbol: string): StockQuote | undefined {
  return DEMO_STOCK_QUOTES[symbol];
}

export function getCompanyInfo(symbol: string): StockCompanyInfo | undefined {
  return STOCK_COMPANY_INFO[symbol];
}

export function searchStocks(query: string): StockInstrument[] {
  const q = query.toLowerCase();
  return DEMO_STOCKS.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q)
  );
}

export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString();
}
