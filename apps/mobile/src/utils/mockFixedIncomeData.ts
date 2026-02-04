// ============================================================================
// Mock Fixed Income Data - Demo mode
// ============================================================================
// Tokenized fixed income instruments across multiple categories:
// - Treasuries (US Government)
// - Corporate Investment Grade
// - Corporate High Yield
// - Municipal Bonds
// - Money Market
// ============================================================================

export type FixedIncomeCategory =
  | 'treasuries'
  | 'corporate-ig'
  | 'corporate-hy'
  | 'municipal'
  | 'money-market';

export type CreditRating =
  | 'AAA' | 'AA+' | 'AA' | 'AA-'
  | 'A+' | 'A' | 'A-'
  | 'BBB+' | 'BBB' | 'BBB-'
  | 'BB+' | 'BB' | 'BB-'
  | 'B+' | 'B' | 'B-'
  | 'CCC' | 'CC' | 'C' | 'D'
  | 'NR';

export type CouponFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'zero';

export interface FixedIncomeInstrument {
  // Identity
  id: string;
  symbol: string;
  name: string;

  // Classification
  category: FixedIncomeCategory;
  issuer: string;
  issuerType: 'sovereign' | 'agency' | 'corporate' | 'municipal';
  sector?: string;

  // Pricing
  price: number;
  priceChange24h: number;
  yield: number;
  yieldToMaturity: number;
  spreadToBenchmark: number;

  // Coupon Details
  couponRate: number;
  couponFrequency: CouponFrequency;
  nextCouponDate: string;
  accruedInterest: number;

  // Maturity & Duration
  maturityDate: string;
  yearsToMaturity: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;

  // Credit
  creditRating: CreditRating;
  ratingAgency: string;

  // Call Features
  isCallable: boolean;
  callDate?: string;
  callPrice?: number;

  // Trading
  minimumInvestment: number;
  faceValue: number;
  settlementDays: number;

  // Platform Info
  platform: string;
  blockchain: string;
  tokenized: boolean;

  // Risk
  riskLevel: 'low' | 'medium' | 'high';

  // Metadata
  description: string;
}

// ============================================================================
// Treasury Bonds
// ============================================================================
const TREASURY_INSTRUMENTS: FixedIncomeInstrument[] = [
  {
    id: 'FI-UST-3M',
    symbol: 'TBILL-3M',
    name: '3-Month Treasury Bill',
    category: 'treasuries',
    issuer: 'US Treasury',
    issuerType: 'sovereign',
    price: 98.75,
    priceChange24h: 0.01,
    yield: 5.15,
    yieldToMaturity: 5.15,
    spreadToBenchmark: 0,
    couponRate: 0,
    couponFrequency: 'zero',
    nextCouponDate: 'N/A',
    accruedInterest: 0,
    maturityDate: '2026-05-03',
    yearsToMaturity: 0.25,
    duration: 0.25,
    modifiedDuration: 0.24,
    convexity: 0.06,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1000,
    settlementDays: 1,
    platform: 'OpenEden',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: 'Short-term US Treasury Bill with 3-month maturity. Zero-coupon instrument sold at discount.',
  },
  {
    id: 'FI-UST-2Y',
    symbol: 'UST-2Y',
    name: '2-Year Treasury Note',
    category: 'treasuries',
    issuer: 'US Treasury',
    issuerType: 'sovereign',
    price: 99.25,
    priceChange24h: 0.05,
    yield: 4.85,
    yieldToMaturity: 4.92,
    spreadToBenchmark: 0,
    couponRate: 4.75,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-05-15',
    accruedInterest: 12.45,
    maturityDate: '2028-02-15',
    yearsToMaturity: 2.03,
    duration: 1.95,
    modifiedDuration: 1.86,
    convexity: 4.25,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1000,
    settlementDays: 1,
    platform: 'Ondo Finance',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: 'US Treasury Note maturing in 2028, backed by full faith and credit of the US Government.',
  },
  {
    id: 'FI-UST-5Y',
    symbol: 'UST-5Y',
    name: '5-Year Treasury Note',
    category: 'treasuries',
    issuer: 'US Treasury',
    issuerType: 'sovereign',
    price: 97.50,
    priceChange24h: 0.12,
    yield: 4.65,
    yieldToMaturity: 4.78,
    spreadToBenchmark: 0,
    couponRate: 4.25,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-04-30',
    accruedInterest: 8.75,
    maturityDate: '2031-01-31',
    yearsToMaturity: 4.99,
    duration: 4.52,
    modifiedDuration: 4.32,
    convexity: 22.85,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1000,
    settlementDays: 1,
    platform: 'Backed Finance',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: '5-Year US Treasury Note with moderate duration. Core holding for fixed income portfolios.',
  },
  {
    id: 'FI-UST-10Y',
    symbol: 'UST-10Y',
    name: '10-Year Treasury Note',
    category: 'treasuries',
    issuer: 'US Treasury',
    issuerType: 'sovereign',
    price: 94.80,
    priceChange24h: 0.25,
    yield: 4.45,
    yieldToMaturity: 4.62,
    spreadToBenchmark: 0,
    couponRate: 4.00,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-05-15',
    accruedInterest: 10.25,
    maturityDate: '2036-02-15',
    yearsToMaturity: 10.03,
    duration: 8.45,
    modifiedDuration: 8.08,
    convexity: 82.15,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1000,
    settlementDays: 1,
    platform: 'Franklin Templeton',
    blockchain: 'Stellar',
    tokenized: true,
    riskLevel: 'low',
    description: '10-Year US Treasury Note. Benchmark rate for mortgages and corporate bonds.',
  },
  {
    id: 'FI-TIPS-5Y',
    symbol: 'TIPS-5Y',
    name: '5-Year TIPS',
    category: 'treasuries',
    issuer: 'US Treasury',
    issuerType: 'sovereign',
    price: 101.25,
    priceChange24h: 0.08,
    yield: 2.15,
    yieldToMaturity: 2.25,
    spreadToBenchmark: -250,
    couponRate: 2.00,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-04-15',
    accruedInterest: 5.50,
    maturityDate: '2031-04-15',
    yearsToMaturity: 5.2,
    duration: 4.85,
    modifiedDuration: 4.74,
    convexity: 26.45,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1000,
    settlementDays: 1,
    platform: 'Ondo Finance',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: 'Treasury Inflation-Protected Securities. Principal adjusts with CPI inflation.',
  },
];

// ============================================================================
// Corporate Investment Grade Bonds
// ============================================================================
const CORPORATE_IG_INSTRUMENTS: FixedIncomeInstrument[] = [
  {
    id: 'FI-AAPL-29',
    symbol: 'AAPL-4.375-29',
    name: 'Apple Inc. 4.375% 2029',
    category: 'corporate-ig',
    issuer: 'Apple Inc.',
    issuerType: 'corporate',
    sector: 'Technology',
    price: 96.80,
    priceChange24h: 0.08,
    yield: 5.10,
    yieldToMaturity: 5.25,
    spreadToBenchmark: 45,
    couponRate: 4.375,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-05-01',
    accruedInterest: 8.75,
    maturityDate: '2029-05-01',
    yearsToMaturity: 3.24,
    duration: 2.95,
    modifiedDuration: 2.81,
    convexity: 10.25,
    creditRating: 'AA+',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 1000,
    faceValue: 1000,
    settlementDays: 2,
    platform: 'Obligate',
    blockchain: 'Polygon',
    tokenized: true,
    riskLevel: 'low',
    description: 'Senior unsecured notes issued by Apple Inc., one of the world\'s most valuable companies.',
  },
  {
    id: 'FI-MSFT-28',
    symbol: 'MSFT-3.5-28',
    name: 'Microsoft 3.5% 2028',
    category: 'corporate-ig',
    issuer: 'Microsoft Corp.',
    issuerType: 'corporate',
    sector: 'Technology',
    price: 95.25,
    priceChange24h: 0.05,
    yield: 5.05,
    yieldToMaturity: 5.18,
    spreadToBenchmark: 40,
    couponRate: 3.50,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-06-15',
    accruedInterest: 5.25,
    maturityDate: '2028-06-15',
    yearsToMaturity: 2.36,
    duration: 2.25,
    modifiedDuration: 2.14,
    convexity: 6.15,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 1000,
    faceValue: 1000,
    settlementDays: 2,
    platform: 'Backed Finance',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: 'Investment-grade corporate bond from Microsoft with AAA credit rating.',
  },
  {
    id: 'FI-JPM-30',
    symbol: 'JPM-4.25-30',
    name: 'JPMorgan 4.25% 2030',
    category: 'corporate-ig',
    issuer: 'JPMorgan Chase',
    issuerType: 'corporate',
    sector: 'Financials',
    price: 94.50,
    priceChange24h: 0.15,
    yield: 5.35,
    yieldToMaturity: 5.52,
    spreadToBenchmark: 75,
    couponRate: 4.25,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-03-15',
    accruedInterest: 18.75,
    maturityDate: '2030-09-15',
    yearsToMaturity: 4.61,
    duration: 4.15,
    modifiedDuration: 3.94,
    convexity: 19.85,
    creditRating: 'A+',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 1000,
    faceValue: 1000,
    settlementDays: 2,
    platform: 'Centrifuge',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: 'Senior unsecured notes from JPMorgan Chase, the largest US bank.',
  },
  {
    id: 'FI-JNJ-31',
    symbol: 'JNJ-3.75-31',
    name: 'Johnson & Johnson 3.75% 2031',
    category: 'corporate-ig',
    issuer: 'Johnson & Johnson',
    issuerType: 'corporate',
    sector: 'Healthcare',
    price: 92.80,
    priceChange24h: 0.10,
    yield: 4.95,
    yieldToMaturity: 5.12,
    spreadToBenchmark: 55,
    couponRate: 3.75,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-04-01',
    accruedInterest: 15.25,
    maturityDate: '2031-10-01',
    yearsToMaturity: 5.66,
    duration: 5.05,
    modifiedDuration: 4.81,
    convexity: 28.65,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 1000,
    faceValue: 1000,
    settlementDays: 2,
    platform: 'Obligate',
    blockchain: 'Polygon',
    tokenized: true,
    riskLevel: 'low',
    description: 'AAA-rated healthcare giant with 60+ years of dividend growth.',
  },
  {
    id: 'FI-IG-POOL',
    symbol: 'IG-BOND-ETF',
    name: 'Investment Grade Bond Pool',
    category: 'corporate-ig',
    issuer: 'Backed Finance',
    issuerType: 'corporate',
    sector: 'Diversified',
    price: 98.50,
    priceChange24h: 0.12,
    yield: 5.45,
    yieldToMaturity: 5.58,
    spreadToBenchmark: 85,
    couponRate: 5.25,
    couponFrequency: 'monthly',
    nextCouponDate: '2026-02-28',
    accruedInterest: 2.15,
    maturityDate: '2028-12-31',
    yearsToMaturity: 2.91,
    duration: 2.65,
    modifiedDuration: 2.51,
    convexity: 8.45,
    creditRating: 'A',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 500,
    faceValue: 1000,
    settlementDays: 1,
    platform: 'Backed Finance',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'medium',
    description: 'Diversified pool of investment-grade corporate bonds with monthly distributions.',
  },
];

// ============================================================================
// Corporate High Yield Bonds
// ============================================================================
const CORPORATE_HY_INSTRUMENTS: FixedIncomeInstrument[] = [
  {
    id: 'FI-HY-POOL',
    symbol: 'HY-BOND-POOL',
    name: 'High Yield Corporate Pool',
    category: 'corporate-hy',
    issuer: 'Centrifuge',
    issuerType: 'corporate',
    sector: 'Diversified',
    price: 94.25,
    priceChange24h: 0.34,
    yield: 8.50,
    yieldToMaturity: 9.15,
    spreadToBenchmark: 425,
    couponRate: 7.50,
    couponFrequency: 'quarterly',
    nextCouponDate: '2026-03-15',
    accruedInterest: 15.25,
    maturityDate: '2027-03-01',
    yearsToMaturity: 1.08,
    duration: 0.98,
    modifiedDuration: 0.91,
    convexity: 1.25,
    creditRating: 'BB',
    ratingAgency: 'S&P',
    isCallable: true,
    callDate: '2026-09-01',
    callPrice: 102.00,
    minimumInvestment: 1000,
    faceValue: 1000,
    settlementDays: 2,
    platform: 'Centrifuge',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'high',
    description: 'Diversified pool of high-yield corporate bonds offering enhanced income potential.',
  },
  {
    id: 'FI-NFLX-28',
    symbol: 'NFLX-5.875-28',
    name: 'Netflix 5.875% 2028',
    category: 'corporate-hy',
    issuer: 'Netflix Inc.',
    issuerType: 'corporate',
    sector: 'Media',
    price: 98.75,
    priceChange24h: 0.22,
    yield: 6.15,
    yieldToMaturity: 6.32,
    spreadToBenchmark: 155,
    couponRate: 5.875,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-05-15',
    accruedInterest: 12.50,
    maturityDate: '2028-11-15',
    yearsToMaturity: 2.78,
    duration: 2.55,
    modifiedDuration: 2.40,
    convexity: 7.85,
    creditRating: 'BB+',
    ratingAgency: 'S&P',
    isCallable: true,
    callDate: '2027-05-15',
    callPrice: 100.00,
    minimumInvestment: 1000,
    faceValue: 1000,
    settlementDays: 2,
    platform: 'Maple Finance',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'medium',
    description: 'High-yield bond from streaming giant Netflix, upgraded from junk status.',
  },
  {
    id: 'FI-ENERGY-HY',
    symbol: 'ENERGY-HY',
    name: 'Energy Sector High Yield',
    category: 'corporate-hy',
    issuer: 'Energy Credit Partners',
    issuerType: 'corporate',
    sector: 'Energy',
    price: 91.50,
    priceChange24h: 0.45,
    yield: 9.25,
    yieldToMaturity: 10.05,
    spreadToBenchmark: 525,
    couponRate: 8.00,
    couponFrequency: 'quarterly',
    nextCouponDate: '2026-03-31',
    accruedInterest: 6.75,
    maturityDate: '2027-06-30',
    yearsToMaturity: 1.41,
    duration: 1.28,
    modifiedDuration: 1.17,
    convexity: 2.15,
    creditRating: 'B+',
    ratingAgency: 'S&P',
    isCallable: true,
    callDate: '2026-06-30',
    callPrice: 104.00,
    minimumInvestment: 2500,
    faceValue: 1000,
    settlementDays: 2,
    platform: 'Goldfinch',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'high',
    description: 'Diversified energy sector high-yield bonds. Higher risk, higher income potential.',
  },
];

// ============================================================================
// Municipal Bonds
// ============================================================================
const MUNICIPAL_INSTRUMENTS: FixedIncomeInstrument[] = [
  {
    id: 'FI-MUNI-CA',
    symbol: 'CA-GO-5-30',
    name: 'California GO 5% 2030',
    category: 'municipal',
    issuer: 'State of California',
    issuerType: 'municipal',
    price: 102.50,
    priceChange24h: 0.05,
    yield: 3.85,
    yieldToMaturity: 4.10,
    spreadToBenchmark: -80,
    couponRate: 5.00,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-06-01',
    accruedInterest: 6.25,
    maturityDate: '2030-06-01',
    yearsToMaturity: 4.33,
    duration: 3.85,
    modifiedDuration: 3.70,
    convexity: 17.25,
    creditRating: 'AA-',
    ratingAgency: 'S&P',
    isCallable: true,
    callDate: '2028-06-01',
    callPrice: 100.00,
    minimumInvestment: 5000,
    faceValue: 5000,
    settlementDays: 3,
    platform: 'MuniChain',
    blockchain: 'Polygon',
    tokenized: true,
    riskLevel: 'low',
    description: 'Tax-exempt general obligation bond from California. Interest exempt from federal and CA state taxes.',
  },
  {
    id: 'FI-MUNI-NY',
    symbol: 'NYC-GO-4.5-29',
    name: 'NYC GO 4.5% 2029',
    category: 'municipal',
    issuer: 'City of New York',
    issuerType: 'municipal',
    price: 99.75,
    priceChange24h: 0.08,
    yield: 4.05,
    yieldToMaturity: 4.18,
    spreadToBenchmark: -70,
    couponRate: 4.50,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-04-01',
    accruedInterest: 18.75,
    maturityDate: '2029-10-01',
    yearsToMaturity: 3.66,
    duration: 3.35,
    modifiedDuration: 3.22,
    convexity: 13.45,
    creditRating: 'AA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 5000,
    faceValue: 5000,
    settlementDays: 3,
    platform: 'MuniChain',
    blockchain: 'Polygon',
    tokenized: true,
    riskLevel: 'low',
    description: 'Tax-exempt NYC general obligation bond. Triple tax-free for NY residents.',
  },
  {
    id: 'FI-MUNI-TX',
    symbol: 'TX-REV-4.75-31',
    name: 'Texas Revenue 4.75% 2031',
    category: 'municipal',
    issuer: 'State of Texas',
    issuerType: 'municipal',
    price: 98.25,
    priceChange24h: 0.12,
    yield: 4.25,
    yieldToMaturity: 4.42,
    spreadToBenchmark: -45,
    couponRate: 4.75,
    couponFrequency: 'semi-annual',
    nextCouponDate: '2026-05-01',
    accruedInterest: 11.85,
    maturityDate: '2031-11-01',
    yearsToMaturity: 5.74,
    duration: 5.05,
    modifiedDuration: 4.84,
    convexity: 28.95,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: true,
    callDate: '2029-05-01',
    callPrice: 100.00,
    minimumInvestment: 5000,
    faceValue: 5000,
    settlementDays: 3,
    platform: 'MuniChain',
    blockchain: 'Polygon',
    tokenized: true,
    riskLevel: 'low',
    description: 'AAA-rated Texas revenue bond. No state income tax in Texas.',
  },
];

// ============================================================================
// Money Market Instruments
// ============================================================================
const MONEY_MARKET_INSTRUMENTS: FixedIncomeInstrument[] = [
  {
    id: 'FI-MM-PRIME',
    symbol: 'MM-PRIME',
    name: 'Prime Money Market',
    category: 'money-market',
    issuer: 'Franklin Templeton',
    issuerType: 'corporate',
    price: 1.00,
    priceChange24h: 0.00,
    yield: 5.25,
    yieldToMaturity: 5.25,
    spreadToBenchmark: 0,
    couponRate: 0,
    couponFrequency: 'monthly',
    nextCouponDate: '2026-02-28',
    accruedInterest: 0.43,
    maturityDate: 'N/A',
    yearsToMaturity: 0,
    duration: 0.08,
    modifiedDuration: 0.08,
    convexity: 0.01,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1,
    settlementDays: 0,
    platform: 'Benji',
    blockchain: 'Stellar',
    tokenized: true,
    riskLevel: 'low',
    description: 'Ultra-stable money market fund. $1 NAV with daily liquidity.',
  },
  {
    id: 'FI-MM-GOVT',
    symbol: 'MM-GOVT',
    name: 'Government Money Market',
    category: 'money-market',
    issuer: 'Ondo Finance',
    issuerType: 'sovereign',
    price: 1.00,
    priceChange24h: 0.00,
    yield: 5.15,
    yieldToMaturity: 5.15,
    spreadToBenchmark: -10,
    couponRate: 0,
    couponFrequency: 'monthly',
    nextCouponDate: '2026-02-28',
    accruedInterest: 0.42,
    maturityDate: 'N/A',
    yearsToMaturity: 0,
    duration: 0.05,
    modifiedDuration: 0.05,
    convexity: 0.01,
    creditRating: 'AAA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1,
    settlementDays: 0,
    platform: 'Ondo Finance',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: '100% government securities. Highest safety with competitive yield.',
  },
  {
    id: 'FI-MM-USDC',
    symbol: 'USDC-YIELD',
    name: 'USDC Yield Vault',
    category: 'money-market',
    issuer: 'Circle',
    issuerType: 'corporate',
    price: 1.00,
    priceChange24h: 0.00,
    yield: 5.35,
    yieldToMaturity: 5.35,
    spreadToBenchmark: 10,
    couponRate: 0,
    couponFrequency: 'monthly',
    nextCouponDate: '2026-02-28',
    accruedInterest: 0.44,
    maturityDate: 'N/A',
    yearsToMaturity: 0,
    duration: 0.03,
    modifiedDuration: 0.03,
    convexity: 0.01,
    creditRating: 'AA',
    ratingAgency: 'S&P',
    isCallable: false,
    minimumInvestment: 100,
    faceValue: 1,
    settlementDays: 0,
    platform: 'Circle',
    blockchain: 'Ethereum',
    tokenized: true,
    riskLevel: 'low',
    description: 'USDC-denominated yield vault backed by T-Bills and repos.',
  },
];

// ============================================================================
// Combined Export
// ============================================================================
export const FIXED_INCOME_INSTRUMENTS: FixedIncomeInstrument[] = [
  ...TREASURY_INSTRUMENTS,
  ...CORPORATE_IG_INSTRUMENTS,
  ...CORPORATE_HY_INSTRUMENTS,
  ...MUNICIPAL_INSTRUMENTS,
  ...MONEY_MARKET_INSTRUMENTS,
];

// ============================================================================
// Category Information
// ============================================================================
export interface FixedIncomeCategoryInfo {
  id: FixedIncomeCategory;
  name: string;
  shortName: string;
  description: string;
  riskRange: string;
  yieldRange: string;
  color: string;
}

export const FIXED_INCOME_CATEGORIES: FixedIncomeCategoryInfo[] = [
  {
    id: 'treasuries',
    name: 'US Treasuries',
    shortName: 'Treasuries',
    description: 'US Government backed securities',
    riskRange: 'Very Low',
    yieldRange: '4.5% - 5.2%',
    color: '#2196F3',
  },
  {
    id: 'corporate-ig',
    name: 'Corporate Investment Grade',
    shortName: 'Corp IG',
    description: 'High-quality corporate bonds (BBB- and above)',
    riskRange: 'Low - Medium',
    yieldRange: '5.0% - 5.8%',
    color: '#4CAF50',
  },
  {
    id: 'corporate-hy',
    name: 'Corporate High Yield',
    shortName: 'High Yield',
    description: 'Higher risk, higher income corporate bonds',
    riskRange: 'Medium - High',
    yieldRange: '6.0% - 10.0%',
    color: '#FF9800',
  },
  {
    id: 'municipal',
    name: 'Municipal Bonds',
    shortName: 'Munis',
    description: 'Tax-advantaged state and local bonds',
    riskRange: 'Low',
    yieldRange: '3.8% - 4.5%',
    color: '#9C27B0',
  },
  {
    id: 'money-market',
    name: 'Money Market',
    shortName: 'Money Mkt',
    description: 'Ultra-short term, stable value',
    riskRange: 'Very Low',
    yieldRange: '5.1% - 5.4%',
    color: '#00BCD4',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getFixedIncomeById(id: string): FixedIncomeInstrument | undefined {
  return FIXED_INCOME_INSTRUMENTS.find((i) => i.id === id);
}

export function getFixedIncomeBySymbol(symbol: string): FixedIncomeInstrument | undefined {
  return FIXED_INCOME_INSTRUMENTS.find((i) => i.symbol === symbol);
}

export function getFixedIncomeByCategory(category: FixedIncomeCategory): FixedIncomeInstrument[] {
  return FIXED_INCOME_INSTRUMENTS.filter((i) => i.category === category);
}

export function getCategoryInfo(category: FixedIncomeCategory): FixedIncomeCategoryInfo | undefined {
  return FIXED_INCOME_CATEGORIES.find((c) => c.id === category);
}

export function getCategoryColor(category: FixedIncomeCategory): string {
  const info = getCategoryInfo(category);
  return info?.color || '#6366f1';
}

export function getCategoryLabel(category: FixedIncomeCategory): string {
  const info = getCategoryInfo(category);
  return info?.name || category;
}

export function getRatingColor(rating: CreditRating): string {
  if (['AAA', 'AA+', 'AA', 'AA-'].includes(rating)) return '#4CAF50'; // Green - High quality
  if (['A+', 'A', 'A-'].includes(rating)) return '#8BC34A'; // Light green
  if (['BBB+', 'BBB', 'BBB-'].includes(rating)) return '#FF9800'; // Orange - Investment grade cutoff
  if (['BB+', 'BB', 'BB-'].includes(rating)) return '#FF5722'; // Deep orange - Speculative
  return '#F44336'; // Red - High risk
}

export function formatYield(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatPrice(price: number): string {
  return price >= 100 ? `$${price.toFixed(2)}` : `${price.toFixed(3)}`;
}

export function formatSpread(bps: number): string {
  if (bps === 0) return 'Benchmark';
  return bps > 0 ? `+${bps} bps` : `${bps} bps`;
}

export function calculateDirtyPrice(cleanPrice: number, accruedInterest: number, faceValue: number): number {
  return (cleanPrice / 100) * faceValue + accruedInterest;
}

export function calculateAnnualIncome(faceValue: number, couponRate: number): number {
  return (faceValue * couponRate) / 100;
}

export function formatDuration(duration: number): string {
  return `${duration.toFixed(2)} yrs`;
}

// ============================================================================
// Market Statistics
// ============================================================================
export function getFixedIncomeStats() {
  const instruments = FIXED_INCOME_INSTRUMENTS;

  const avgYield = instruments.reduce((sum, i) => sum + i.yield, 0) / instruments.length;
  const avgDuration = instruments.filter(i => i.duration > 0).reduce((sum, i) => sum + i.duration, 0) /
    instruments.filter(i => i.duration > 0).length;

  const totalByCategory = FIXED_INCOME_CATEGORIES.map(cat => ({
    category: cat.id,
    count: instruments.filter(i => i.category === cat.id).length,
    avgYield: instruments.filter(i => i.category === cat.id).reduce((sum, i) => sum + i.yield, 0) /
      instruments.filter(i => i.category === cat.id).length,
  }));

  return {
    totalInstruments: instruments.length,
    avgYield,
    avgDuration,
    byCategory: totalByCategory,
  };
}
