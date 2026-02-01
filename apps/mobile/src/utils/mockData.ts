// ============================================================================
// Mock Data for Demo Mode
// ============================================================================

export interface MockBank {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const mockBanks: MockBank[] = [
  { id: 'chase', name: 'Chase', color: '#117ACA', icon: 'bank' },
  { id: 'bofa', name: 'Bank of America', color: '#012169', icon: 'bank' },
  { id: 'wells', name: 'Wells Fargo', color: '#D71E28', icon: 'bank' },
  { id: 'citi', name: 'Citibank', color: '#003B70', icon: 'bank' },
  { id: 'usbank', name: 'US Bank', color: '#D52B1E', icon: 'bank' },
  { id: 'pnc', name: 'PNC Bank', color: '#FF6600', icon: 'bank' },
  { id: 'capital', name: 'Capital One', color: '#D03027', icon: 'bank' },
  { id: 'td', name: 'TD Bank', color: '#34A853', icon: 'bank' },
  { id: 'schwab', name: 'Charles Schwab', color: '#00A0DF', icon: 'bank' },
  { id: 'fidelity', name: 'Fidelity', color: '#4A8B2C', icon: 'bank' },
  { id: 'ally', name: 'Ally Bank', color: '#6B2D5B', icon: 'bank' },
  { id: 'discover', name: 'Discover Bank', color: '#FF6600', icon: 'bank' },
];

export interface CryptoAsset {
  symbol: string;
  name: string;
  color: string;
  network: string;
  networkFee: number;
  minSend: number;
}

export const cryptoAssets: CryptoAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', network: 'Bitcoin', networkFee: 0.0001, minSend: 0.0001 },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', network: 'Ethereum', networkFee: 0.002, minSend: 0.001 },
  { symbol: 'SOL', name: 'Solana', color: '#14F195', network: 'Solana', networkFee: 0.00025, minSend: 0.01 },
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA', network: 'Ethereum', networkFee: 5, minSend: 1 },
  { symbol: 'USDT', name: 'Tether', color: '#26A17B', network: 'Ethereum', networkFee: 5, minSend: 1 },
  { symbol: 'MATIC', name: 'Polygon', color: '#8247E5', network: 'Polygon', networkFee: 0.01, minSend: 1 },
  { symbol: 'AVAX', name: 'Avalanche', color: '#E84142', network: 'Avalanche', networkFee: 0.01, minSend: 0.1 },
  { symbol: 'DOT', name: 'Polkadot', color: '#E6007A', network: 'Polkadot', networkFee: 0.1, minSend: 1 },
  { symbol: 'ADA', name: 'Cardano', color: '#0033AD', network: 'Cardano', networkFee: 0.17, minSend: 1 },
  { symbol: 'XRP', name: 'Ripple', color: '#23292F', network: 'Ripple', networkFee: 0.0001, minSend: 10 },
];

// Quick deposit amounts
export const quickAmounts = [50, 100, 500, 1000];

// Generate mock last 4 digits for bank accounts
export const generateLastFour = (): string =>
  Math.floor(1000 + Math.random() * 9000).toString();

// Generate mock transaction reference
export const generateReference = (): string =>
  `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

// Generate mock wallet address
export const generateWalletAddress = (asset: string): string => {
  const randomHex = () =>
    Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

  const prefixes: Record<string, { prefix: string; length: number }> = {
    BTC: { prefix: '1', length: 34 },
    ETH: { prefix: '0x', length: 42 },
    SOL: { prefix: '', length: 44 },
    USDC: { prefix: '0x', length: 42 },
    USDT: { prefix: '0x', length: 42 },
  };

  const config = prefixes[asset] || { prefix: '0x', length: 42 };
  const hex = randomHex();
  return `${config.prefix}${hex}`.slice(0, config.length);
};

// Format currency
export const formatCurrency = (amount: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

// Format crypto amount - Smart formatting that avoids floating point display issues
export const formatCrypto = (amount: number, symbol: string): string => {
  // Handle edge cases
  if (amount === 0) return `0 ${symbol}`;
  if (isNaN(amount)) return `0 ${symbol}`;

  const absAmount = Math.abs(amount);

  // Determine decimals based on asset type and amount size
  let decimals: number;
  if (['BTC'].includes(symbol)) {
    // BTC: show more decimals for small amounts, fewer for large
    if (absAmount >= 1) decimals = 4;
    else if (absAmount >= 0.01) decimals = 6;
    else decimals = 8;
  } else if (['ETH'].includes(symbol)) {
    // ETH: similar logic
    if (absAmount >= 10) decimals = 3;
    else if (absAmount >= 1) decimals = 4;
    else decimals = 6;
  } else if (['USDC', 'USDT', 'DAI'].includes(symbol)) {
    // Stablecoins: always 2 decimals
    decimals = 2;
  } else if (['SOL', 'AVAX', 'MATIC', 'DOT', 'ADA'].includes(symbol)) {
    // Mid-tier: 2-4 decimals based on amount
    if (absAmount >= 100) decimals = 2;
    else if (absAmount >= 1) decimals = 3;
    else decimals = 4;
  } else {
    // Default
    decimals = absAmount >= 1 ? 2 : 6;
  }

  // Format with locale for thousands separators, then trim trailing zeros
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return `${formatted} ${symbol}`;
};

// Format crypto quantity only (no symbol) - for display in asset rows
export const formatCryptoQuantity = (amount: number, symbol: string): string => {
  if (amount === 0) return '0';
  if (isNaN(amount)) return '0';

  const absAmount = Math.abs(amount);

  let decimals: number;
  if (['BTC'].includes(symbol)) {
    if (absAmount >= 1) decimals = 4;
    else if (absAmount >= 0.01) decimals = 6;
    else decimals = 8;
  } else if (['ETH'].includes(symbol)) {
    if (absAmount >= 10) decimals = 3;
    else if (absAmount >= 1) decimals = 4;
    else decimals = 6;
  } else if (['USDC', 'USDT', 'DAI'].includes(symbol)) {
    decimals = 2;
  } else if (['SOL', 'AVAX', 'MATIC', 'DOT', 'ADA'].includes(symbol)) {
    if (absAmount >= 100) decimals = 2;
    else if (absAmount >= 1) decimals = 3;
    else decimals = 4;
  } else {
    decimals = absAmount >= 1 ? 2 : 6;
  }

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

// Validate wallet address format (basic validation)
export const isValidAddress = (address: string, asset: string): boolean => {
  if (!address || address.length < 10) return false;

  const patterns: Record<string, RegExp> = {
    BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    USDC: /^0x[a-fA-F0-9]{40}$/,
    USDT: /^0x[a-fA-F0-9]{40}$/,
  };

  const pattern = patterns[asset] || patterns.ETH;
  return pattern.test(address);
};

// Mock exchange rates (for swap)
export const mockExchangeRates: Record<string, Record<string, number>> = {
  BTC: { USD: 43250, ETH: 22.5, SOL: 435, USDC: 43250, USDT: 43250 },
  ETH: { USD: 2340, BTC: 0.054, SOL: 23.4, USDC: 2340, USDT: 2340 },
  SOL: { USD: 98.5, BTC: 0.0023, ETH: 0.042, USDC: 98.5, USDT: 98.5 },
  USDC: { USD: 1, BTC: 0.0000231, ETH: 0.000427, SOL: 0.0102 },
  USDT: { USD: 1, BTC: 0.0000231, ETH: 0.000427, SOL: 0.0102 },
};

// Get exchange rate
export const getExchangeRate = (from: string, to: string): number => {
  if (from === to) return 1;
  if (to === 'USD') return mockExchangeRates[from]?.USD || 0;
  return mockExchangeRates[from]?.[to] || 0;
};

// Calculate swap output
export const calculateSwapOutput = (
  fromAsset: string,
  toAsset: string,
  fromAmount: number,
  slippage: number = 0.5
): { toAmount: number; rate: number; priceImpact: number } => {
  const rate = getExchangeRate(fromAsset, toAsset);
  const toAmount = fromAmount * rate * (1 - slippage / 100);
  const priceImpact = fromAmount > 10000 ? 0.1 : 0.01; // Mock price impact

  return { toAmount, rate, priceImpact };
};

// US States for address form
export const usStates = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

// Document types for KYC
export const documentTypes = [
  { id: 'drivers_license', name: "Driver's License", requiresBack: true },
  { id: 'passport', name: 'Passport', requiresBack: false },
  { id: 'id_card', name: 'State ID Card', requiresBack: true },
] as const;
