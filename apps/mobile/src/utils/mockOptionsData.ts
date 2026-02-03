// ============================================================================
// Mock Options Data - Stock Options Chain Generation
// ============================================================================

export interface StockOption {
  id: string;
  underlyingSymbol: string;
  underlyingName: string;
  type: 'call' | 'put';
  strikePrice: number;
  expirationDate: string;
  premium: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  inTheMoney: boolean;
  daysToExpiry: number;
}

export interface OptionsChain {
  underlyingSymbol: string;
  underlyingName: string;
  underlyingPrice: number;
  change24h: number;
  expirationDates: string[];
  options: StockOption[];
}

// Stock data for options (from existing mock data)
const OPTIONABLE_STOCKS: { symbol: string; name: string; price: number; change: number }[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 178.45, change: 1.33 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.89, change: -0.87 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.25, change: 0.95 },
  { symbol: 'AMZN', name: 'Amazon.com', price: 185.67, change: 2.15 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.32, change: 3.45 },
  { symbol: 'META', name: 'Meta Platforms', price: 512.78, change: 1.78 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.89, change: -2.34 },
  { symbol: 'AMD', name: 'AMD Inc.', price: 165.45, change: 1.56 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 625.34, change: 0.45 },
  { symbol: 'COIN', name: 'Coinbase Global', price: 205.67, change: 4.23 },
];

// Generate strike prices around the current stock price
function generateStrikes(stockPrice: number, count: number = 11): number[] {
  const strikes: number[] = [];

  // Determine strike increment based on price
  let increment: number;
  if (stockPrice < 50) increment = 2.5;
  else if (stockPrice < 200) increment = 5;
  else if (stockPrice < 500) increment = 10;
  else increment = 25;

  // Find the ATM strike (round to nearest increment)
  const atmStrike = Math.round(stockPrice / increment) * increment;

  // Generate strikes around ATM
  const halfCount = Math.floor(count / 2);
  for (let i = -halfCount; i <= halfCount; i++) {
    strikes.push(atmStrike + (i * increment));
  }

  return strikes.filter(s => s > 0);
}

// Generate expiration dates (weekly and monthly)
function generateExpirationDates(): string[] {
  const dates: string[] = [];
  const today = new Date();

  // Next 4 Fridays (weekly options)
  for (let i = 1; i <= 4; i++) {
    const date = new Date(today);
    const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilFriday + (7 * (i - 1)));
    dates.push(date.toISOString().split('T')[0]);
  }

  // Monthly options (3rd Friday of next 2 months)
  for (let i = 1; i <= 2; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() + i);
    date.setDate(1);
    // Find first Friday
    while (date.getDay() !== 5) {
      date.setDate(date.getDate() + 1);
    }
    // Move to 3rd Friday
    date.setDate(date.getDate() + 14);
    const dateStr = date.toISOString().split('T')[0];
    if (!dates.includes(dateStr)) {
      dates.push(dateStr);
    }
  }

  return dates.sort();
}

// Calculate days to expiry
function daysToExpiry(expirationDate: string): number {
  const expiry = new Date(expirationDate);
  const today = new Date();
  const diff = expiry.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Simple Black-Scholes approximation for option pricing
function calculateOptionPremium(
  stockPrice: number,
  strikePrice: number,
  daysToExp: number,
  type: 'call' | 'put',
  volatility: number = 0.30
): { premium: number; delta: number; gamma: number; theta: number; vega: number } {
  const T = daysToExp / 365;
  const r = 0.05; // Risk-free rate

  if (T === 0) {
    // At expiration
    const intrinsic = type === 'call'
      ? Math.max(0, stockPrice - strikePrice)
      : Math.max(0, strikePrice - stockPrice);
    return { premium: intrinsic, delta: type === 'call' ? (intrinsic > 0 ? 1 : 0) : (intrinsic > 0 ? -1 : 0), gamma: 0, theta: 0, vega: 0 };
  }

  // Simplified pricing (approximation)
  const moneyness = stockPrice / strikePrice;
  const timeValue = volatility * stockPrice * Math.sqrt(T);

  let intrinsicValue: number;
  let delta: number;

  if (type === 'call') {
    intrinsicValue = Math.max(0, stockPrice - strikePrice);
    // Approximate delta
    if (moneyness > 1.1) delta = 0.85 + (moneyness - 1.1) * 0.5;
    else if (moneyness > 0.9) delta = 0.5 + (moneyness - 1) * 3.5;
    else delta = 0.15 - (0.9 - moneyness) * 0.5;
    delta = Math.min(0.99, Math.max(0.01, delta));
  } else {
    intrinsicValue = Math.max(0, strikePrice - stockPrice);
    // Put delta (negative)
    if (moneyness < 0.9) delta = -0.85 - (0.9 - moneyness) * 0.5;
    else if (moneyness < 1.1) delta = -0.5 + (moneyness - 1) * 3.5;
    else delta = -0.15 + (moneyness - 1.1) * 0.5;
    delta = Math.max(-0.99, Math.min(-0.01, delta));
  }

  // Calculate premium
  const premium = intrinsicValue + timeValue * Math.abs(delta) * (1 + Math.random() * 0.1);

  // Greeks (simplified)
  const gamma = Math.exp(-Math.pow(Math.log(moneyness), 2) / (2 * volatility * volatility * T)) / (stockPrice * volatility * Math.sqrt(T)) * 0.1;
  const theta = -premium / daysToExp * 0.7; // Simplified theta
  const vega = stockPrice * Math.sqrt(T) * 0.01 * Math.exp(-Math.pow(Math.log(moneyness), 2) / 4);

  return {
    premium: Math.max(0.01, Number(premium.toFixed(2))),
    delta: Number(delta.toFixed(2)),
    gamma: Number(Math.abs(gamma).toFixed(4)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2)),
  };
}

// Generate a single option
function generateOption(
  symbol: string,
  name: string,
  stockPrice: number,
  type: 'call' | 'put',
  strikePrice: number,
  expirationDate: string
): StockOption {
  const days = daysToExpiry(expirationDate);
  const iv = 0.20 + Math.random() * 0.25; // 20-45% IV
  const pricing = calculateOptionPremium(stockPrice, strikePrice, days, type, iv);

  // Generate bid/ask spread (tighter for ATM, wider for OTM)
  const moneyness = Math.abs(stockPrice / strikePrice - 1);
  const spreadPercent = 0.02 + moneyness * 0.1 + (days < 7 ? 0.02 : 0);
  const spread = Math.max(0.01, pricing.premium * spreadPercent);

  const bid = Math.max(0.01, Number((pricing.premium - spread / 2).toFixed(2)));
  const ask = Number((pricing.premium + spread / 2).toFixed(2));

  // Determine if ITM
  const inTheMoney = type === 'call'
    ? stockPrice > strikePrice
    : stockPrice < strikePrice;

  // Generate volume and OI (higher for ATM options)
  const atmFactor = Math.exp(-moneyness * 10);
  const volume = Math.floor(100 + Math.random() * 5000 * atmFactor);
  const openInterest = Math.floor(1000 + Math.random() * 20000 * atmFactor);

  return {
    id: `${symbol}-${type.toUpperCase()}-${strikePrice}-${expirationDate}`,
    underlyingSymbol: symbol,
    underlyingName: name,
    type,
    strikePrice,
    expirationDate,
    premium: pricing.premium,
    bid,
    ask,
    volume,
    openInterest,
    impliedVolatility: Number((iv * 100).toFixed(1)),
    delta: pricing.delta,
    gamma: pricing.gamma,
    theta: pricing.theta,
    vega: pricing.vega,
    inTheMoney,
    daysToExpiry: days,
  };
}

// Generate full options chain for a stock
export function generateOptionsChain(symbol: string): OptionsChain | null {
  const stock = OPTIONABLE_STOCKS.find(s => s.symbol === symbol);
  if (!stock) return null;

  const strikes = generateStrikes(stock.price);
  const expirationDates = generateExpirationDates();
  const options: StockOption[] = [];

  expirationDates.forEach(expDate => {
    strikes.forEach(strike => {
      options.push(generateOption(stock.symbol, stock.name, stock.price, 'call', strike, expDate));
      options.push(generateOption(stock.symbol, stock.name, stock.price, 'put', strike, expDate));
    });
  });

  return {
    underlyingSymbol: stock.symbol,
    underlyingName: stock.name,
    underlyingPrice: stock.price,
    change24h: stock.change,
    expirationDates,
    options,
  };
}

// Get options for a specific expiration and type
export function getOptionsForExpiration(
  chain: OptionsChain,
  expirationDate: string,
  type: 'call' | 'put'
): StockOption[] {
  return chain.options
    .filter(opt => opt.expirationDate === expirationDate && opt.type === type)
    .sort((a, b) => a.strikePrice - b.strikePrice);
}

// Get a specific option by ID
export function getOptionById(optionId: string): StockOption | null {
  const [symbol] = optionId.split('-');
  const chain = generateOptionsChain(symbol);
  if (!chain) return null;

  return chain.options.find(opt => opt.id === optionId) || null;
}

// Get list of stocks with options
export function getOptionableStocks(): { symbol: string; name: string; price: number; change: number }[] {
  return OPTIONABLE_STOCKS;
}

// Check if a stock has options
export function hasOptions(symbol: string): boolean {
  return OPTIONABLE_STOCKS.some(s => s.symbol === symbol);
}

// Calculate break-even price for an option
export function calculateBreakeven(option: StockOption): number {
  if (option.type === 'call') {
    return option.strikePrice + option.ask;
  } else {
    return option.strikePrice - option.ask;
  }
}

// Calculate max loss for buying an option
export function calculateMaxLoss(option: StockOption, contracts: number): number {
  return option.ask * 100 * contracts; // Premium paid × 100 shares per contract
}

// Calculate P/L for an option position at a given stock price
export function calculateOptionPL(
  option: StockOption,
  contracts: number,
  currentStockPrice: number,
  entryPremium: number
): { pl: number; plPercent: number } {
  let intrinsicValue: number;

  if (option.type === 'call') {
    intrinsicValue = Math.max(0, currentStockPrice - option.strikePrice);
  } else {
    intrinsicValue = Math.max(0, option.strikePrice - currentStockPrice);
  }

  // Current value (intrinsic + remaining time value estimate)
  const timeValueFactor = option.daysToExpiry / 30;
  const currentValue = intrinsicValue + (option.premium - intrinsicValue) * timeValueFactor * 0.5;

  const totalCost = entryPremium * 100 * contracts;
  const currentTotalValue = currentValue * 100 * contracts;
  const pl = currentTotalValue - totalCost;
  const plPercent = (pl / totalCost) * 100;

  return {
    pl: Number(pl.toFixed(2)),
    plPercent: Number(plPercent.toFixed(2)),
  };
}

// Format option symbol for display
export function formatOptionSymbol(option: StockOption): string {
  const date = new Date(option.expirationDate);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();

  return `${option.underlyingSymbol} ${month} ${day} $${option.strikePrice} ${option.type.toUpperCase()}`;
}

// Get option moneyness label
export function getMoneyness(option: StockOption, stockPrice: number): 'ITM' | 'ATM' | 'OTM' {
  const diff = Math.abs(stockPrice - option.strikePrice);
  const threshold = stockPrice * 0.02; // 2% threshold for ATM

  if (diff <= threshold) return 'ATM';

  if (option.type === 'call') {
    return stockPrice > option.strikePrice ? 'ITM' : 'OTM';
  } else {
    return stockPrice < option.strikePrice ? 'ITM' : 'OTM';
  }
}
