// ============================================================================
// Mock RWA (Real World Asset) Token Data - Demo mode
// ============================================================================
// Tokenized real-world assets across multiple categories:
// - Real Estate
// - Commodities (Gold, Silver, Oil)
// - Treasury Bonds
// - Corporate Bonds
// - Private Credit
// - Carbon Credits
// - Art & Collectibles
// ============================================================================

export type RWACategory =
  | 'real-estate'
  | 'commodities'
  | 'treasury-bonds'
  | 'corporate-bonds'
  | 'private-credit'
  | 'carbon-credits'
  | 'art-collectibles';

export type InvestorTier = 'retail' | 'institutional';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface RWAAssetDetails {
  // Real Estate
  location?: string;
  propertyType?: string;
  sqft?: number;
  occupancyRate?: number;

  // HELOC / Home Equity
  loanType?: string;
  ltv?: number;              // Loan-to-Value ratio
  avgFico?: number;          // Average FICO score
  delinquencyRate?: number;
  poolSize?: number;         // Number of loans in pool

  // Commodities
  purity?: string;
  custodian?: string;
  storageLocation?: string;

  // Bonds
  couponRate?: number;
  rating?: string;
  maturityDate?: string;
  issuerType?: string;

  // Art
  artist?: string;
  vintage?: number;
  medium?: string;
  dimensions?: string;
  provenance?: string;

  // Carbon
  standard?: string;
  vintage_year?: number;
  projectType?: string;
  registry?: string;
}

export interface RWAToken {
  id: string;
  symbol: string;
  name: string;
  category: RWACategory;
  price: number;
  change24h: number;
  change7d: number;
  yield?: number;           // APY for yield-bearing assets
  totalSupply: number;
  circulatingSupply: number;
  marketCap: number;
  volume24h: number;
  minimumInvestment: number;
  investorTier: InvestorTier;
  issuer: string;
  platform: string;
  blockchain: string;
  assetDetails: RWAAssetDetails;
  description: string;
  riskLevel: RiskLevel;
  auditor?: string;
  regulatoryStatus?: string;
}

// ============================================================================
// Real Estate Tokens
// ============================================================================
const REAL_ESTATE_TOKENS: RWAToken[] = [
  {
    id: 'RWA-RE-1',
    symbol: 'REALT-NYC',
    name: 'Manhattan Class A Office',
    category: 'real-estate',
    price: 52.45,
    change24h: 0.34,
    change7d: 1.23,
    yield: 7.2,
    totalSupply: 100000,
    circulatingSupply: 85000,
    marketCap: 4458250,
    volume24h: 125600,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'RealT Inc.',
    platform: 'RealT',
    blockchain: 'Ethereum',
    assetDetails: {
      location: 'Midtown Manhattan, NY',
      propertyType: 'Class A Office',
      sqft: 125000,
      occupancyRate: 94.5,
    },
    description: 'Fractional ownership in a Class A office building in Midtown Manhattan with long-term corporate tenants.',
    riskLevel: 'medium',
    auditor: 'Deloitte',
    regulatoryStatus: 'SEC Reg D 506(c)',
  },
  {
    id: 'RWA-RE-2',
    symbol: 'REALT-MIA',
    name: 'Miami Beach Luxury Condo',
    category: 'real-estate',
    price: 28.90,
    change24h: 0.85,
    change7d: 2.15,
    yield: 5.8,
    totalSupply: 50000,
    circulatingSupply: 42000,
    marketCap: 1213800,
    volume24h: 45200,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'RealT Inc.',
    platform: 'RealT',
    blockchain: 'Ethereum',
    assetDetails: {
      location: 'South Beach, Miami',
      propertyType: 'Luxury Residential',
      sqft: 2800,
      occupancyRate: 100,
    },
    description: 'Tokenized luxury beachfront condo generating rental income from short-term vacation rentals.',
    riskLevel: 'medium',
    auditor: 'EY',
  },
  {
    id: 'RWA-RE-3',
    symbol: 'LABS-AUS',
    name: 'Austin Tech Campus',
    category: 'real-estate',
    price: 85.20,
    change24h: -0.42,
    change7d: 0.89,
    yield: 6.5,
    totalSupply: 200000,
    circulatingSupply: 180000,
    marketCap: 15336000,
    volume24h: 289000,
    minimumInvestment: 250,
    investorTier: 'retail',
    issuer: 'Lofty AI',
    platform: 'Lofty',
    blockchain: 'Algorand',
    assetDetails: {
      location: 'Austin, TX',
      propertyType: 'Tech Office Campus',
      sqft: 450000,
      occupancyRate: 98.2,
    },
    description: 'Multi-building tech campus with Fortune 500 tenants on long-term leases.',
    riskLevel: 'low',
    auditor: 'KPMG',
  },
  // HELOC / Home Equity Tokens
  {
    id: 'RWA-RE-4',
    symbol: 'HELOC-AA',
    name: 'Prime HELOC Pool A',
    category: 'real-estate',
    price: 100.25,
    change24h: 0.05,
    change7d: 0.12,
    yield: 8.5,
    totalSupply: 500000,
    circulatingSupply: 425000,
    marketCap: 42606250,
    volume24h: 1250000,
    minimumInvestment: 500,
    investorTier: 'retail',
    issuer: 'Figure Technologies',
    platform: 'Figure',
    blockchain: 'Provenance',
    assetDetails: {
      loanType: 'HELOC - Prime',
      ltv: 65,
      avgFico: 780,
      delinquencyRate: 0.3,
      poolSize: 2500,
      location: 'US Nationwide',
    },
    description: 'Tokenized pool of prime Home Equity Lines of Credit with high FICO scores and low LTV ratios.',
    riskLevel: 'low',
    auditor: 'KPMG',
    regulatoryStatus: 'SEC Reg D',
  },
  {
    id: 'RWA-RE-5',
    symbol: 'HELOC-BB',
    name: 'Enhanced HELOC Pool',
    category: 'real-estate',
    price: 98.75,
    change24h: 0.15,
    change7d: 0.35,
    yield: 10.2,
    totalSupply: 300000,
    circulatingSupply: 265000,
    marketCap: 26168750,
    volume24h: 850000,
    minimumInvestment: 1000,
    investorTier: 'retail',
    issuer: 'Figure Technologies',
    platform: 'Figure',
    blockchain: 'Provenance',
    assetDetails: {
      loanType: 'HELOC - Near Prime',
      ltv: 75,
      avgFico: 720,
      delinquencyRate: 1.2,
      poolSize: 1800,
      location: 'US Nationwide',
    },
    description: 'Higher-yield HELOC pool with slightly elevated risk profile and enhanced returns.',
    riskLevel: 'medium',
    auditor: 'Deloitte',
    regulatoryStatus: 'SEC Reg D',
  },
  {
    id: 'RWA-RE-6',
    symbol: 'HEL-INST',
    name: 'Institutional Home Equity',
    category: 'real-estate',
    price: 1000.00,
    change24h: 0.02,
    change7d: 0.08,
    yield: 7.8,
    totalSupply: 50000,
    circulatingSupply: 42000,
    marketCap: 42000000,
    volume24h: 2500000,
    minimumInvestment: 25000,
    investorTier: 'institutional',
    issuer: 'Redwood Trust',
    platform: 'Centrifuge',
    blockchain: 'Ethereum',
    assetDetails: {
      loanType: 'Home Equity Loan - Institutional',
      ltv: 60,
      avgFico: 800,
      delinquencyRate: 0.15,
      poolSize: 5000,
      location: 'US - Major Metro Areas',
    },
    description: 'Institutional-grade home equity loan pool with premium credit quality and conservative underwriting.',
    riskLevel: 'low',
    auditor: 'PwC',
    regulatoryStatus: 'Accredited Investors Only',
  },
  {
    id: 'RWA-RE-7',
    symbol: 'MRTG-SEC',
    name: 'Securitized Mortgage Pool',
    category: 'real-estate',
    price: 99.50,
    change24h: 0.08,
    change7d: 0.22,
    yield: 6.5,
    totalSupply: 1000000,
    circulatingSupply: 920000,
    marketCap: 91540000,
    volume24h: 3200000,
    minimumInvestment: 250,
    investorTier: 'retail',
    issuer: 'Homebase',
    platform: 'Homebase',
    blockchain: 'Ethereum',
    assetDetails: {
      loanType: 'Residential Mortgage Pool',
      ltv: 70,
      avgFico: 760,
      delinquencyRate: 0.5,
      poolSize: 8000,
      location: 'US Nationwide',
    },
    description: 'Diversified pool of conforming residential mortgages tokenized for fractional ownership.',
    riskLevel: 'low',
    auditor: 'EY',
    regulatoryStatus: 'SEC Registered',
  },
];

// ============================================================================
// Commodities Tokens
// ============================================================================
const COMMODITIES_TOKENS: RWAToken[] = [
  {
    id: 'RWA-COM-1',
    symbol: 'PAXG',
    name: 'Pax Gold',
    category: 'commodities',
    price: 2089.50,
    change24h: 1.23,
    change7d: 2.45,
    totalSupply: 485000,
    circulatingSupply: 472000,
    marketCap: 986234000,
    volume24h: 45200000,
    minimumInvestment: 50,
    investorTier: 'retail',
    issuer: 'Paxos Trust Company',
    platform: 'Paxos',
    blockchain: 'Ethereum',
    assetDetails: {
      purity: '99.99% LBMA-certified',
      custodian: 'Brink\'s',
      storageLocation: 'London Vaults',
    },
    description: 'Each PAXG token is backed by one fine troy ounce of a London Good Delivery gold bar stored in professional vaults.',
    riskLevel: 'low',
    auditor: 'Withum',
    regulatoryStatus: 'NYDFS Regulated',
  },
  {
    id: 'RWA-COM-2',
    symbol: 'SLVT',
    name: 'Silver Token',
    category: 'commodities',
    price: 24.67,
    change24h: -0.45,
    change7d: 1.89,
    totalSupply: 2500000,
    circulatingSupply: 2100000,
    marketCap: 51807000,
    volume24h: 3450000,
    minimumInvestment: 50,
    investorTier: 'retail',
    issuer: 'Cache Gold',
    platform: 'Cache',
    blockchain: 'Ethereum',
    assetDetails: {
      purity: '99.9% Fine Silver',
      custodian: 'Loomis',
      storageLocation: 'Singapore Vault',
    },
    description: 'Tokenized silver backed 1:1 by physical silver bars held in secure vaults.',
    riskLevel: 'low',
    auditor: 'BDO',
  },
  {
    id: 'RWA-COM-3',
    symbol: 'OILT',
    name: 'Oil Commodity Token',
    category: 'commodities',
    price: 78.45,
    change24h: 2.34,
    change7d: 4.56,
    totalSupply: 500000,
    circulatingSupply: 425000,
    marketCap: 33341250,
    volume24h: 8900000,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'Petrotoken',
    platform: 'Petrotoken',
    blockchain: 'Polygon',
    assetDetails: {
      purity: 'WTI Crude Oil',
      custodian: 'Cushing Storage',
      storageLocation: 'Cushing, Oklahoma',
    },
    description: 'Token backed by physical WTI crude oil in strategic storage facilities.',
    riskLevel: 'medium',
  },
  {
    id: 'RWA-COM-4',
    symbol: 'AGRI',
    name: 'Agricultural Commodities Fund',
    category: 'commodities',
    price: 45.80,
    change24h: 0.67,
    change7d: -1.23,
    yield: 3.5,
    totalSupply: 1000000,
    circulatingSupply: 850000,
    marketCap: 38930000,
    volume24h: 1250000,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'AgriToken',
    platform: 'AgriToken',
    blockchain: 'Ethereum',
    assetDetails: {
      purity: 'Mixed Agricultural Basket',
    },
    description: 'Diversified basket of agricultural commodities including wheat, corn, soybeans, and coffee.',
    riskLevel: 'medium',
  },
];

// ============================================================================
// Treasury Bonds Tokens
// ============================================================================
const TREASURY_BONDS_TOKENS: RWAToken[] = [
  {
    id: 'RWA-TB-1',
    symbol: 'BENJI',
    name: 'Franklin OnChain US Govt Money Fund',
    category: 'treasury-bonds',
    price: 1.00,
    change24h: 0.00,
    change7d: 0.00,
    yield: 5.25,
    totalSupply: 350000000,
    circulatingSupply: 320000000,
    marketCap: 320000000,
    volume24h: 12500000,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'Franklin Templeton',
    platform: 'Benji',
    blockchain: 'Stellar',
    assetDetails: {
      couponRate: 5.25,
      rating: 'AAA',
      issuerType: 'US Government',
    },
    description: 'The first US-registered fund to use a public blockchain for processing transactions and recording share ownership.',
    riskLevel: 'low',
    auditor: 'PwC',
    regulatoryStatus: 'SEC Registered Fund',
  },
  {
    id: 'RWA-TB-2',
    symbol: 'USYC',
    name: 'US Yield Coin',
    category: 'treasury-bonds',
    price: 1.00,
    change24h: 0.00,
    change7d: 0.00,
    yield: 4.95,
    totalSupply: 180000000,
    circulatingSupply: 165000000,
    marketCap: 165000000,
    volume24h: 8500000,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'Ondo Finance',
    platform: 'Ondo',
    blockchain: 'Ethereum',
    assetDetails: {
      couponRate: 4.95,
      rating: 'AAA',
      issuerType: 'US Treasury',
      maturityDate: 'Short-term rolling',
    },
    description: 'Tokenized exposure to short-dated US Treasuries with daily liquidity.',
    riskLevel: 'low',
    auditor: 'Ernst & Young',
  },
  {
    id: 'RWA-TB-3',
    symbol: 'TBILL',
    name: 'OpenEden T-Bill Vault',
    category: 'treasury-bonds',
    price: 1.00,
    change24h: 0.00,
    change7d: 0.00,
    yield: 5.15,
    totalSupply: 95000000,
    circulatingSupply: 89000000,
    marketCap: 89000000,
    volume24h: 4200000,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'OpenEden',
    platform: 'OpenEden',
    blockchain: 'Ethereum',
    assetDetails: {
      couponRate: 5.15,
      rating: 'AAA',
      issuerType: 'US Treasury Bills',
      maturityDate: 'Rolling T-Bills',
    },
    description: 'Direct exposure to US Treasury Bills through a tokenized vault structure.',
    riskLevel: 'low',
    auditor: 'Deloitte',
  },
];

// ============================================================================
// Corporate Bonds Tokens
// ============================================================================
const CORPORATE_BONDS_TOKENS: RWAToken[] = [
  {
    id: 'RWA-CB-1',
    symbol: 'BOND-IG',
    name: 'Investment Grade Bond Pool',
    category: 'corporate-bonds',
    price: 98.50,
    change24h: 0.12,
    change7d: 0.45,
    yield: 6.2,
    totalSupply: 50000000,
    circulatingSupply: 42000000,
    marketCap: 41370000,
    volume24h: 2100000,
    minimumInvestment: 1000,
    investorTier: 'retail',
    issuer: 'Backed Finance',
    platform: 'Backed',
    blockchain: 'Ethereum',
    assetDetails: {
      couponRate: 6.2,
      rating: 'A',
      issuerType: 'Corporate - Investment Grade',
      maturityDate: '2028-06-15',
    },
    description: 'Diversified pool of investment-grade corporate bonds from blue-chip companies.',
    riskLevel: 'medium',
    auditor: 'KPMG',
  },
  {
    id: 'RWA-CB-2',
    symbol: 'BOND-HY',
    name: 'High Yield Corporate Bonds',
    category: 'corporate-bonds',
    price: 94.25,
    change24h: 0.34,
    change7d: -0.89,
    yield: 8.5,
    totalSupply: 30000000,
    circulatingSupply: 25000000,
    marketCap: 23562500,
    volume24h: 1850000,
    minimumInvestment: 1000,
    investorTier: 'retail',
    issuer: 'Centrifuge',
    platform: 'Centrifuge',
    blockchain: 'Ethereum',
    assetDetails: {
      couponRate: 8.5,
      rating: 'BB',
      issuerType: 'Corporate - High Yield',
      maturityDate: '2027-03-01',
    },
    description: 'Diversified high-yield corporate bond exposure with enhanced returns.',
    riskLevel: 'high',
    auditor: 'BDO',
  },
  {
    id: 'RWA-CB-3',
    symbol: 'AAPL-BD',
    name: 'Apple Inc. 4.375% 2029',
    category: 'corporate-bonds',
    price: 96.80,
    change24h: 0.08,
    change7d: 0.25,
    yield: 5.1,
    totalSupply: 10000000,
    circulatingSupply: 8500000,
    marketCap: 8228000,
    volume24h: 450000,
    minimumInvestment: 1000,
    investorTier: 'retail',
    issuer: 'Obligate',
    platform: 'Obligate',
    blockchain: 'Polygon',
    assetDetails: {
      couponRate: 4.375,
      rating: 'AA+',
      issuerType: 'Apple Inc.',
      maturityDate: '2029-05-01',
    },
    description: 'Tokenized Apple Inc. corporate bond with semi-annual coupon payments.',
    riskLevel: 'low',
    auditor: 'EY',
  },
];

// ============================================================================
// Private Credit Tokens (Institutional Only)
// ============================================================================
const PRIVATE_CREDIT_TOKENS: RWAToken[] = [
  {
    id: 'RWA-PC-1',
    symbol: 'MAPLE-SL',
    name: 'Maple Finance Senior Loan',
    category: 'private-credit',
    price: 1000.00,
    change24h: 0.00,
    change7d: 0.05,
    yield: 12.5,
    totalSupply: 100000,
    circulatingSupply: 85000,
    marketCap: 85000000,
    volume24h: 2500000,
    minimumInvestment: 25000,
    investorTier: 'institutional',
    issuer: 'Maple Finance',
    platform: 'Maple',
    blockchain: 'Ethereum',
    assetDetails: {
      rating: 'Unrated - Senior Secured',
      issuerType: 'Institutional Direct Lending',
    },
    description: 'Senior secured lending pool for institutional crypto-native borrowers with full collateralization.',
    riskLevel: 'medium',
    auditor: 'Deloitte',
    regulatoryStatus: 'Accredited Investors Only',
  },
  {
    id: 'RWA-PC-2',
    symbol: 'GOLD-MEZ',
    name: 'Goldfinch Mezzanine',
    category: 'private-credit',
    price: 1000.00,
    change24h: 0.02,
    change7d: 0.12,
    yield: 15.0,
    totalSupply: 50000,
    circulatingSupply: 42000,
    marketCap: 42000000,
    volume24h: 1200000,
    minimumInvestment: 50000,
    investorTier: 'institutional',
    issuer: 'Goldfinch',
    platform: 'Goldfinch',
    blockchain: 'Ethereum',
    assetDetails: {
      rating: 'Unrated - Mezzanine',
      issuerType: 'Emerging Market Lending',
    },
    description: 'Mezzanine debt financing for emerging market fintech lenders.',
    riskLevel: 'high',
    regulatoryStatus: 'Accredited Investors Only',
  },
  {
    id: 'RWA-PC-3',
    symbol: 'CENT-RE',
    name: 'Centrifuge Real Estate Credit',
    category: 'private-credit',
    price: 1000.00,
    change24h: 0.01,
    change7d: 0.08,
    yield: 10.5,
    totalSupply: 75000,
    circulatingSupply: 68000,
    marketCap: 68000000,
    volume24h: 1800000,
    minimumInvestment: 25000,
    investorTier: 'institutional',
    issuer: 'Centrifuge',
    platform: 'Centrifuge',
    blockchain: 'Ethereum',
    assetDetails: {
      rating: 'Investment Grade Equivalent',
      issuerType: 'Commercial Real Estate Loans',
    },
    description: 'Securitized commercial real estate bridge loans with institutional-grade underwriting.',
    riskLevel: 'medium',
    auditor: 'KPMG',
    regulatoryStatus: 'Accredited Investors Only',
  },
];

// ============================================================================
// Carbon Credits Tokens
// ============================================================================
const CARBON_CREDITS_TOKENS: RWAToken[] = [
  {
    id: 'RWA-CC-1',
    symbol: 'KLIMA',
    name: 'Klima Carbon Token',
    category: 'carbon-credits',
    price: 3.45,
    change24h: 2.10,
    change7d: 5.67,
    totalSupply: 18000000,
    circulatingSupply: 15500000,
    marketCap: 53475000,
    volume24h: 4250000,
    minimumInvestment: 50,
    investorTier: 'retail',
    issuer: 'KlimaDAO',
    platform: 'KlimaDAO',
    blockchain: 'Polygon',
    assetDetails: {
      standard: 'Verra VCS',
      vintage_year: 2020,
      projectType: 'Mixed - Nature Based',
      registry: 'Verra',
    },
    description: 'Each KLIMA is backed by at least one tonne of verified carbon offsets in the Klima treasury.',
    riskLevel: 'high',
  },
  {
    id: 'RWA-CC-2',
    symbol: 'MCO2',
    name: 'Moss Carbon Credit',
    category: 'carbon-credits',
    price: 8.90,
    change24h: -0.80,
    change7d: 1.25,
    totalSupply: 5000000,
    circulatingSupply: 4200000,
    marketCap: 37380000,
    volume24h: 1850000,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'Moss Earth',
    platform: 'Moss',
    blockchain: 'Ethereum',
    assetDetails: {
      standard: 'Verra VCS',
      vintage_year: 2019,
      projectType: 'Amazon Rainforest REDD+',
      registry: 'Verra',
    },
    description: 'Tokenized carbon credits from Amazon rainforest preservation projects.',
    riskLevel: 'medium',
    auditor: 'SGS',
  },
  {
    id: 'RWA-CC-3',
    symbol: 'TCO2',
    name: 'Toucan Base Carbon',
    category: 'carbon-credits',
    price: 1.25,
    change24h: 1.45,
    change7d: 3.20,
    totalSupply: 22000000,
    circulatingSupply: 19500000,
    marketCap: 24375000,
    volume24h: 2100000,
    minimumInvestment: 50,
    investorTier: 'retail',
    issuer: 'Toucan Protocol',
    platform: 'Toucan',
    blockchain: 'Polygon',
    assetDetails: {
      standard: 'Verra VCS',
      vintage_year: 2018,
      projectType: 'Renewable Energy',
      registry: 'Verra',
    },
    description: 'Base carbon tokens representing 1 tonne of CO2 equivalent from verified projects.',
    riskLevel: 'medium',
  },
];

// ============================================================================
// Art & Collectibles Tokens
// ============================================================================
const ART_COLLECTIBLES_TOKENS: RWAToken[] = [
  {
    id: 'RWA-ART-1',
    symbol: 'PICASSO-23',
    name: 'Picasso "Femme au Chapeau"',
    category: 'art-collectibles',
    price: 145.00,
    change24h: 0.12,
    change7d: 0.45,
    totalSupply: 10000,
    circulatingSupply: 8500,
    marketCap: 1232500,
    volume24h: 45000,
    minimumInvestment: 250,
    investorTier: 'retail',
    issuer: 'Masterworks',
    platform: 'Masterworks',
    blockchain: 'Ethereum',
    assetDetails: {
      artist: 'Pablo Picasso',
      vintage: 1962,
      medium: 'Oil on canvas',
      dimensions: '130 x 97 cm',
      provenance: 'Christie\'s 2019',
    },
    description: 'Fractional ownership in Pablo Picasso\'s "Femme au Chapeau" from 1962.',
    riskLevel: 'high',
    auditor: 'Christie\'s Appraisal',
  },
  {
    id: 'RWA-ART-2',
    symbol: 'WARHOL-45',
    name: 'Warhol "Campbell\'s Soup"',
    category: 'art-collectibles',
    price: 89.50,
    change24h: 0.34,
    change7d: 1.12,
    totalSupply: 20000,
    circulatingSupply: 18000,
    marketCap: 1611000,
    volume24h: 62000,
    minimumInvestment: 250,
    investorTier: 'retail',
    issuer: 'Masterworks',
    platform: 'Masterworks',
    blockchain: 'Ethereum',
    assetDetails: {
      artist: 'Andy Warhol',
      vintage: 1968,
      medium: 'Screenprint on paper',
      dimensions: '89 x 58.4 cm',
      provenance: 'Sotheby\'s 2020',
    },
    description: 'Fractional ownership in Andy Warhol\'s iconic Campbell\'s Soup screenprint.',
    riskLevel: 'high',
    auditor: 'Sotheby\'s Appraisal',
  },
  {
    id: 'RWA-ART-3',
    symbol: 'BASQ-88',
    name: 'Basquiat "Untitled 1982"',
    category: 'art-collectibles',
    price: 215.00,
    change24h: -0.25,
    change7d: 2.34,
    totalSupply: 5000,
    circulatingSupply: 4200,
    marketCap: 903000,
    volume24h: 28000,
    minimumInvestment: 500,
    investorTier: 'retail',
    issuer: 'Freeport',
    platform: 'Freeport',
    blockchain: 'Ethereum',
    assetDetails: {
      artist: 'Jean-Michel Basquiat',
      vintage: 1982,
      medium: 'Acrylic and oilstick on canvas',
      dimensions: '193 x 239 cm',
      provenance: 'Phillips 2021',
    },
    description: 'Fractional ownership in Jean-Michel Basquiat\'s powerful 1982 painting.',
    riskLevel: 'high',
    auditor: 'Phillips Appraisal',
  },
  {
    id: 'RWA-ART-4',
    symbol: 'ROLEX-SUB',
    name: 'Rolex Submariner Collection',
    category: 'art-collectibles',
    price: 32.50,
    change24h: 0.85,
    change7d: 1.45,
    totalSupply: 50000,
    circulatingSupply: 45000,
    marketCap: 1462500,
    volume24h: 125000,
    minimumInvestment: 100,
    investorTier: 'retail',
    issuer: 'Rally',
    platform: 'Rally',
    blockchain: 'Polygon',
    assetDetails: {
      vintage: 1969,
      provenance: 'Authenticated Collection',
    },
    description: 'Fractional ownership in a curated collection of vintage Rolex Submariner watches.',
    riskLevel: 'medium',
    auditor: 'Watchbox Authentication',
  },
];

// ============================================================================
// Combined RWA Tokens Export
// ============================================================================
export const RWA_TOKENS: RWAToken[] = [
  ...REAL_ESTATE_TOKENS,
  ...COMMODITIES_TOKENS,
  ...TREASURY_BONDS_TOKENS,
  ...CORPORATE_BONDS_TOKENS,
  ...PRIVATE_CREDIT_TOKENS,
  ...CARBON_CREDITS_TOKENS,
  ...ART_COLLECTIBLES_TOKENS,
];

// ============================================================================
// Category Information
// ============================================================================
export interface RWACategoryInfo {
  id: RWACategory;
  name: string;
  icon: string;
  color: string;
  description: string;
  tokenCount: number;
  totalMarketCap: number;
}

export const RWA_CATEGORIES: RWACategoryInfo[] = [
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: '🏢',
    color: '#4CAF50',
    description: 'Tokenized commercial and residential properties',
    tokenCount: REAL_ESTATE_TOKENS.length,
    totalMarketCap: REAL_ESTATE_TOKENS.reduce((sum, t) => sum + t.marketCap, 0),
  },
  {
    id: 'commodities',
    name: 'Commodities',
    icon: '🪙',
    color: '#FFD700',
    description: 'Precious metals, oil, and agricultural products',
    tokenCount: COMMODITIES_TOKENS.length,
    totalMarketCap: COMMODITIES_TOKENS.reduce((sum, t) => sum + t.marketCap, 0),
  },
  {
    id: 'treasury-bonds',
    name: 'Treasury Bonds',
    icon: '🏛️',
    color: '#2196F3',
    description: 'US Government backed securities',
    tokenCount: TREASURY_BONDS_TOKENS.length,
    totalMarketCap: TREASURY_BONDS_TOKENS.reduce((sum, t) => sum + t.marketCap, 0),
  },
  {
    id: 'corporate-bonds',
    name: 'Corporate Bonds',
    icon: '📊',
    color: '#9C27B0',
    description: 'Investment grade and high yield corporate debt',
    tokenCount: CORPORATE_BONDS_TOKENS.length,
    totalMarketCap: CORPORATE_BONDS_TOKENS.reduce((sum, t) => sum + t.marketCap, 0),
  },
  {
    id: 'private-credit',
    name: 'Private Credit',
    icon: '🔐',
    color: '#FF5722',
    description: 'Institutional direct lending and mezzanine debt',
    tokenCount: PRIVATE_CREDIT_TOKENS.length,
    totalMarketCap: PRIVATE_CREDIT_TOKENS.reduce((sum, t) => sum + t.marketCap, 0),
  },
  {
    id: 'carbon-credits',
    name: 'Carbon Credits',
    icon: '🌱',
    color: '#00BCD4',
    description: 'Verified carbon offset tokens',
    tokenCount: CARBON_CREDITS_TOKENS.length,
    totalMarketCap: CARBON_CREDITS_TOKENS.reduce((sum, t) => sum + t.marketCap, 0),
  },
  {
    id: 'art-collectibles',
    name: 'Art & Collectibles',
    icon: '🎨',
    color: '#E91E63',
    description: 'Fractionalized fine art and luxury collectibles',
    tokenCount: ART_COLLECTIBLES_TOKENS.length,
    totalMarketCap: ART_COLLECTIBLES_TOKENS.reduce((sum, t) => sum + t.marketCap, 0),
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getRWATokenById(id: string): RWAToken | undefined {
  return RWA_TOKENS.find((t) => t.id === id);
}

export function getRWATokenBySymbol(symbol: string): RWAToken | undefined {
  return RWA_TOKENS.find((t) => t.symbol === symbol);
}

export function getRWATokensByCategory(category: RWACategory): RWAToken[] {
  return RWA_TOKENS.filter((t) => t.category === category);
}

export function getRWARetailTokens(): RWAToken[] {
  return RWA_TOKENS.filter((t) => t.investorTier === 'retail');
}

export function getRWAInstitutionalTokens(): RWAToken[] {
  return RWA_TOKENS.filter((t) => t.investorTier === 'institutional');
}

export function searchRWATokens(query: string): RWAToken[] {
  const q = query.toLowerCase();
  return RWA_TOKENS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.issuer.toLowerCase().includes(q)
  );
}

export function getCategoryIcon(category: RWACategory): string {
  const icons: Record<RWACategory, string> = {
    'real-estate': '🏢',
    'commodities': '🪙',
    'treasury-bonds': '🏛️',
    'corporate-bonds': '📊',
    'private-credit': '🔐',
    'carbon-credits': '🌱',
    'art-collectibles': '🎨',
  };
  return icons[category] || '📈';
}

export function getCategoryColor(category: RWACategory): string {
  const colors: Record<RWACategory, string> = {
    'real-estate': '#4CAF50',
    'commodities': '#FFD700',
    'treasury-bonds': '#2196F3',
    'corporate-bonds': '#9C27B0',
    'private-credit': '#FF5722',
    'carbon-credits': '#00BCD4',
    'art-collectibles': '#E91E63',
  };
  return colors[category] || '#6366f1';
}

export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'low':
      return '#4CAF50';
    case 'medium':
      return '#FF9800';
    case 'high':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
}

export function formatRWAMarketCap(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toLocaleString()}`;
}

export function formatRWAVolume(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString();
}

// ============================================================================
// Total RWA Market Stats
// ============================================================================
export function getRWAMarketStats() {
  const totalMarketCap = RWA_TOKENS.reduce((sum, t) => sum + t.marketCap, 0);
  const totalVolume24h = RWA_TOKENS.reduce((sum, t) => sum + t.volume24h, 0);
  const totalTokens = RWA_TOKENS.length;
  const retailTokens = getRWARetailTokens().length;
  const institutionalTokens = getRWAInstitutionalTokens().length;

  // Calculate weighted average yield
  const yieldTokens = RWA_TOKENS.filter(t => t.yield);
  const avgYield = yieldTokens.length > 0
    ? yieldTokens.reduce((sum, t) => sum + (t.yield || 0), 0) / yieldTokens.length
    : 0;

  return {
    totalMarketCap,
    totalVolume24h,
    totalTokens,
    retailTokens,
    institutionalTokens,
    avgYield,
  };
}
