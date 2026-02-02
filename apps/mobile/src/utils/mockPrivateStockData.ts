// ============================================================================
// Mock Private Stock Data - Pre-IPO, Startups, ATS Tokens & Private Listings
// ============================================================================

export type PrivateStockCategory = 'pre-ipo' | 'startup' | 'secondary-ats' | 'private-listing';
export type ATSPlatform = 'tZERO' | 'Securitize' | 'INX';
export type TokenType = 'security-token' | 'preferred-equity' | 'reit-token' | 'fund-token' | 'digital-asset';
export type DealType = 'block-trade' | 'spv' | 'pre-ipo-allocation' | 'secondary-direct' | 'fund-commitment';
export type DealStatus = 'open' | 'closing-soon' | 'fully-subscribed' | 'closed';
export type FundingStage =
  | 'Seed'
  | 'Series A'
  | 'Series A Extension'
  | 'Series B'
  | 'Series B Extension'
  | 'Series C'
  | 'Series C Extension'
  | 'Series D'
  | 'Series E'
  | 'Series E+'
  | 'Series H'
  | 'Series I'
  | 'Pre-IPO';

export interface PrivateStockInstrument {
  symbol: string;
  name: string;
  category: PrivateStockCategory;
  sector: string;
  description: string;
  logo?: string;
  // Valuation info
  latestValuation: number; // Total company valuation
  sharePrice: number; // Price per share
  priceChange30d: number; // % change in last 30 days
  // Investment details
  minimumInvestment: number;
  availableShares?: number; // For Pre-IPO secondary market
  // Company info
  foundedYear: number;
  headquarters: string;
  employees: string;
  website: string;
  // Funding info
  fundingStage: FundingStage;
  totalRaised: number;
  lastRoundDate: string;
  lastRoundSize?: number;
  // For startups - current round info
  currentRound?: {
    stage: FundingStage;
    targetRaise: number;
    raised: number;
    closingDate: string;
    leadInvestor?: string;
  };
  // Key investors
  investors: string[];
  // Risk/opportunity
  riskLevel: 'High' | 'Very High' | 'Extreme';
  lockupPeriod?: string; // e.g., "1 year" or "Until IPO"
}

// ============================================================================
// ATS Token Interface (Secondary ATS - tZERO ecosystem)
// ============================================================================

export interface ATSToken {
  symbol: string;
  name: string;
  category: 'secondary-ats';
  platform: ATSPlatform;
  tokenType: TokenType;

  // Pricing (crypto-like)
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  volume24h: number;
  marketCap: number;

  // Token info
  totalSupply: number;
  circulatingSupply: number;

  // Underlying asset info
  underlyingAsset: string;
  issuer: string;
  issuanceDate: string;
  description: string;

  // Compliance
  accreditedOnly: boolean;
  jurisdiction: string[];

  // Trading
  minimumOrder: number;
  tradingHours: string;
  settlementTime: string;

  // Risk
  riskLevel: 'Medium' | 'High' | 'Very High';
}

// ============================================================================
// Private Listing Interface (Invite-only deals)
// ============================================================================

export interface PrivateListing {
  id: string;
  symbol: string;
  name: string;
  category: 'private-listing';
  dealType: DealType;

  // Deal details
  description: string;
  targetCompany: string;
  sector: string;

  // Access control
  requiredCodes: string[];
  isPubliclyVisible: boolean;

  // Investment terms
  minimumInvestment: number;
  maximumInvestment?: number;
  sharePrice: number;
  estimatedValuation: number;

  // Deal progress
  targetRaise: number;
  amountRaised: number;
  investorCount: number;

  // Timing
  openDate: string;
  closingDate: string;
  status: DealStatus;

  // Terms
  lockupPeriod: string;
  carriedInterest?: number;
  managementFee?: number;

  // Risk
  riskLevel: 'High' | 'Very High' | 'Extreme';

  // Documents (demo - just names)
  documents: string[];
}

// ============================================================================
// Pre-IPO Companies (Late-stage private companies with secondary market)
// ============================================================================

export const PRE_IPO_COMPANIES: PrivateStockInstrument[] = [
  {
    symbol: 'SPACEX',
    name: 'SpaceX',
    category: 'pre-ipo',
    sector: 'Aerospace',
    description: 'Leading space exploration company developing reusable rockets, Starlink satellite internet, and planning Mars colonization.',
    latestValuation: 180_000_000_000,
    sharePrice: 112.50,
    priceChange30d: 8.2,
    minimumInvestment: 10000,
    availableShares: 1250,
    foundedYear: 2002,
    headquarters: 'Hawthorne, CA',
    employees: '13,000+',
    website: 'spacex.com',
    fundingStage: 'Pre-IPO',
    totalRaised: 9_700_000_000,
    lastRoundDate: '2024-06',
    lastRoundSize: 750_000_000,
    investors: ['Founders Fund', 'Sequoia Capital', 'Google', 'Fidelity', 'T. Rowe Price'],
    riskLevel: 'High',
    lockupPeriod: 'Until IPO',
  },
  {
    symbol: 'STRIPE',
    name: 'Stripe',
    category: 'pre-ipo',
    sector: 'Fintech',
    description: 'Global payments infrastructure company powering millions of businesses with online payment processing.',
    latestValuation: 65_000_000_000,
    sharePrice: 27.85,
    priceChange30d: -2.1,
    minimumInvestment: 5000,
    availableShares: 3200,
    foundedYear: 2010,
    headquarters: 'San Francisco, CA',
    employees: '8,000+',
    website: 'stripe.com',
    fundingStage: 'Pre-IPO',
    totalRaised: 8_700_000_000,
    lastRoundDate: '2023-03',
    lastRoundSize: 6_500_000_000,
    investors: ['Sequoia', 'Andreessen Horowitz', 'General Catalyst', 'Tiger Global', 'GIC'],
    riskLevel: 'High',
    lockupPeriod: 'Until IPO',
  },
  {
    symbol: 'DATABRICKS',
    name: 'Databricks',
    category: 'pre-ipo',
    sector: 'Enterprise Software',
    description: 'Unified analytics platform combining data engineering, data science, and machine learning capabilities.',
    latestValuation: 43_000_000_000,
    sharePrice: 82.30,
    priceChange30d: 5.7,
    minimumInvestment: 5000,
    availableShares: 890,
    foundedYear: 2013,
    headquarters: 'San Francisco, CA',
    employees: '5,500+',
    website: 'databricks.com',
    fundingStage: 'Series I',
    totalRaised: 3_600_000_000,
    lastRoundDate: '2023-09',
    lastRoundSize: 500_000_000,
    investors: ['Andreessen Horowitz', 'Coatue', 'Tiger Global', 'Franklin Templeton', 'NVIDIA'],
    riskLevel: 'High',
    lockupPeriod: 'Until IPO',
  },
  {
    symbol: 'DISCORD',
    name: 'Discord',
    category: 'pre-ipo',
    sector: 'Social Media',
    description: 'Communication platform for communities, gamers, and friends with voice, video, and text features.',
    latestValuation: 15_000_000_000,
    sharePrice: 35.20,
    priceChange30d: 1.2,
    minimumInvestment: 2500,
    availableShares: 2100,
    foundedYear: 2015,
    headquarters: 'San Francisco, CA',
    employees: '1,000+',
    website: 'discord.com',
    fundingStage: 'Series H',
    totalRaised: 995_000_000,
    lastRoundDate: '2021-09',
    lastRoundSize: 500_000_000,
    investors: ['Greenoaks Capital', 'Index Ventures', 'Greylock', 'IVP', 'Benchmark'],
    riskLevel: 'High',
    lockupPeriod: 'Until IPO',
  },
  {
    symbol: 'OPENAI',
    name: 'OpenAI',
    category: 'pre-ipo',
    sector: 'Artificial Intelligence',
    description: 'AI research company building safe AGI, creators of ChatGPT and GPT-4 language models.',
    latestValuation: 157_000_000_000,
    sharePrice: 185.00,
    priceChange30d: 12.5,
    minimumInvestment: 25000,
    availableShares: 420,
    foundedYear: 2015,
    headquarters: 'San Francisco, CA',
    employees: '2,000+',
    website: 'openai.com',
    fundingStage: 'Pre-IPO',
    totalRaised: 11_300_000_000,
    lastRoundDate: '2024-10',
    lastRoundSize: 6_600_000_000,
    investors: ['Microsoft', 'Thrive Capital', 'Khosla Ventures', 'Tiger Global', 'SoftBank'],
    riskLevel: 'Very High',
    lockupPeriod: 'Until IPO',
  },
  {
    symbol: 'ANTHROPIC',
    name: 'Anthropic',
    category: 'pre-ipo',
    sector: 'Artificial Intelligence',
    description: 'AI safety company developing Claude, a helpful, harmless, and honest AI assistant.',
    latestValuation: 61_500_000_000,
    sharePrice: 142.75,
    priceChange30d: 15.3,
    minimumInvestment: 15000,
    availableShares: 680,
    foundedYear: 2021,
    headquarters: 'San Francisco, CA',
    employees: '1,000+',
    website: 'anthropic.com',
    fundingStage: 'Series E',
    totalRaised: 7_700_000_000,
    lastRoundDate: '2024-11',
    lastRoundSize: 2_000_000_000,
    investors: ['Amazon', 'Google', 'Spark Capital', 'Salesforce', 'Menlo Ventures'],
    riskLevel: 'Very High',
    lockupPeriod: 'Until IPO',
  },
  {
    symbol: 'CANVA',
    name: 'Canva',
    category: 'pre-ipo',
    sector: 'Design Software',
    description: 'Online design platform making graphic design accessible to everyone with drag-and-drop tools.',
    latestValuation: 26_000_000_000,
    sharePrice: 48.90,
    priceChange30d: -1.8,
    minimumInvestment: 5000,
    availableShares: 1850,
    foundedYear: 2012,
    headquarters: 'Sydney, Australia',
    employees: '4,000+',
    website: 'canva.com',
    fundingStage: 'Pre-IPO',
    totalRaised: 572_000_000,
    lastRoundDate: '2021-09',
    lastRoundSize: 200_000_000,
    investors: ['Sequoia China', 'Blackbird Ventures', 'Felicis', 'T. Rowe Price', 'Franklin Templeton'],
    riskLevel: 'High',
    lockupPeriod: 'Until IPO',
  },
  {
    symbol: 'FIGMA',
    name: 'Figma',
    category: 'pre-ipo',
    sector: 'Design Software',
    description: 'Collaborative interface design tool that has revolutionized how teams design together in the browser.',
    latestValuation: 12_500_000_000,
    sharePrice: 42.15,
    priceChange30d: 3.4,
    minimumInvestment: 5000,
    availableShares: 1100,
    foundedYear: 2012,
    headquarters: 'San Francisco, CA',
    employees: '1,500+',
    website: 'figma.com',
    fundingStage: 'Series E',
    totalRaised: 333_000_000,
    lastRoundDate: '2021-06',
    lastRoundSize: 200_000_000,
    investors: ['Andreessen Horowitz', 'Greylock', 'Kleiner Perkins', 'Index Ventures', 'KPCB'],
    riskLevel: 'High',
    lockupPeriod: 'Until IPO',
  },
];

// ============================================================================
// Startup Companies (Early-stage with active funding rounds)
// ============================================================================

export const STARTUP_COMPANIES: PrivateStockInstrument[] = [
  {
    symbol: 'ANYSPHERE',
    name: 'Anysphere (Cursor)',
    category: 'startup',
    sector: 'Developer Tools',
    description: 'Building Cursor, an AI-first code editor that helps developers write code faster with intelligent assistance.',
    latestValuation: 2_500_000_000,
    sharePrice: 8.50,
    priceChange30d: 22.4,
    minimumInvestment: 1000,
    foundedYear: 2022,
    headquarters: 'San Francisco, CA',
    employees: '50+',
    website: 'cursor.sh',
    fundingStage: 'Series B',
    totalRaised: 400_000_000,
    lastRoundDate: '2024-08',
    currentRound: {
      stage: 'Series B',
      targetRaise: 100_000_000,
      raised: 73_000_000,
      closingDate: '2025-03-15',
      leadInvestor: 'Andreessen Horowitz',
    },
    investors: ['a16z', 'Thrive Capital', 'Spark Capital', 'Stripe', 'OpenAI'],
    riskLevel: 'Very High',
    lockupPeriod: '1 year',
  },
  {
    symbol: 'PERPLEXITY',
    name: 'Perplexity AI',
    category: 'startup',
    sector: 'Artificial Intelligence',
    description: 'AI-powered answer engine that provides accurate, sourced answers to complex questions.',
    latestValuation: 9_000_000_000,
    sharePrice: 18.25,
    priceChange30d: 28.6,
    minimumInvestment: 2500,
    foundedYear: 2022,
    headquarters: 'San Francisco, CA',
    employees: '150+',
    website: 'perplexity.ai',
    fundingStage: 'Series B',
    totalRaised: 250_000_000,
    lastRoundDate: '2024-06',
    currentRound: {
      stage: 'Series C',
      targetRaise: 500_000_000,
      raised: 285_000_000,
      closingDate: '2025-02-28',
      leadInvestor: 'IVP',
    },
    investors: ['IVP', 'NEA', 'Databricks', 'NVIDIA', 'Bessemer'],
    riskLevel: 'Very High',
    lockupPeriod: '1 year',
  },
  {
    symbol: 'REPLIT',
    name: 'Replit',
    category: 'startup',
    sector: 'Developer Tools',
    description: 'Browser-based IDE and deployment platform making coding accessible with AI-powered development.',
    latestValuation: 1_160_000_000,
    sharePrice: 5.80,
    priceChange30d: 8.2,
    minimumInvestment: 1000,
    foundedYear: 2016,
    headquarters: 'San Francisco, CA',
    employees: '200+',
    website: 'replit.com',
    fundingStage: 'Series B',
    totalRaised: 222_000_000,
    lastRoundDate: '2023-04',
    currentRound: {
      stage: 'Series C',
      targetRaise: 150_000_000,
      raised: 45_000_000,
      closingDate: '2025-04-30',
      leadInvestor: 'Khosla Ventures',
    },
    investors: ['a16z', 'Coatue', 'Y Combinator', 'Peter Thiel', 'Bloomberg Beta'],
    riskLevel: 'Very High',
    lockupPeriod: '1 year',
  },
  {
    symbol: 'WATERSHED',
    name: 'Watershed',
    category: 'startup',
    sector: 'Climate Tech',
    description: 'Enterprise climate platform helping companies measure, reduce, and report carbon emissions.',
    latestValuation: 1_800_000_000,
    sharePrice: 12.40,
    priceChange30d: 4.1,
    minimumInvestment: 2500,
    foundedYear: 2019,
    headquarters: 'San Francisco, CA',
    employees: '300+',
    website: 'watershed.com',
    fundingStage: 'Series C',
    totalRaised: 200_000_000,
    lastRoundDate: '2024-02',
    currentRound: {
      stage: 'Series C Extension',
      targetRaise: 50_000_000,
      raised: 32_000_000,
      closingDate: '2025-03-31',
      leadInvestor: 'Greenoaks',
    },
    investors: ['Sequoia', 'Kleiner Perkins', 'Greenoaks', 'Stripe', 'Shopify'],
    riskLevel: 'High',
    lockupPeriod: '1 year',
  },
  {
    symbol: 'ABRIDGE',
    name: 'Abridge',
    category: 'startup',
    sector: 'Healthcare AI',
    description: 'AI-powered medical documentation that automatically generates clinical notes from doctor-patient conversations.',
    latestValuation: 850_000_000,
    sharePrice: 4.25,
    priceChange30d: 11.5,
    minimumInvestment: 1000,
    foundedYear: 2018,
    headquarters: 'Pittsburgh, PA',
    employees: '200+',
    website: 'abridge.com',
    fundingStage: 'Series C',
    totalRaised: 212_000_000,
    lastRoundDate: '2024-02',
    currentRound: {
      stage: 'Series C Extension',
      targetRaise: 75_000_000,
      raised: 28_000_000,
      closingDate: '2025-05-15',
      leadInvestor: 'Spark Capital',
    },
    investors: ['Spark Capital', 'Bessemer', 'Wittington Ventures', 'UPMC', 'CVS Health'],
    riskLevel: 'High',
    lockupPeriod: '1 year',
  },
  {
    symbol: 'ELECTRIC',
    name: 'Electric',
    category: 'startup',
    sector: 'IT Services',
    description: 'AI-powered IT support platform that automates IT management for small and mid-sized businesses.',
    latestValuation: 1_000_000_000,
    sharePrice: 6.15,
    priceChange30d: 2.8,
    minimumInvestment: 1000,
    foundedYear: 2016,
    headquarters: 'New York, NY',
    employees: '400+',
    website: 'electric.ai',
    fundingStage: 'Series D',
    totalRaised: 174_000_000,
    lastRoundDate: '2022-06',
    currentRound: {
      stage: 'Series E',
      targetRaise: 100_000_000,
      raised: 15_000_000,
      closingDate: '2025-06-30',
      leadInvestor: 'GGV Capital',
    },
    investors: ['Bessemer', 'GGV', '01 Advisors', 'Primary Ventures', 'Greenspring'],
    riskLevel: 'High',
    lockupPeriod: '1 year',
  },
  {
    symbol: 'MOONVALLEY',
    name: 'Moon Valley AI',
    category: 'startup',
    sector: 'Generative AI',
    description: 'AI video generation platform creating cinematic-quality videos from text and image prompts.',
    latestValuation: 500_000_000,
    sharePrice: 2.85,
    priceChange30d: 35.2,
    minimumInvestment: 500,
    foundedYear: 2023,
    headquarters: 'Toronto, Canada',
    employees: '40+',
    website: 'moonvalley.ai',
    fundingStage: 'Series A',
    totalRaised: 45_000_000,
    lastRoundDate: '2024-07',
    currentRound: {
      stage: 'Series A Extension',
      targetRaise: 30_000_000,
      raised: 12_000_000,
      closingDate: '2025-04-15',
      leadInvestor: 'Khosla Ventures',
    },
    investors: ['Khosla Ventures', 'General Catalyst', 'Y Combinator', 'Samsung Next'],
    riskLevel: 'Extreme',
    lockupPeriod: '2 years',
  },
  {
    symbol: 'HEBBIA',
    name: 'Hebbia',
    category: 'startup',
    sector: 'Enterprise AI',
    description: 'AI platform for knowledge workers that extracts insights from complex documents at enterprise scale.',
    latestValuation: 700_000_000,
    sharePrice: 4.90,
    priceChange30d: 18.7,
    minimumInvestment: 1000,
    foundedYear: 2020,
    headquarters: 'New York, NY',
    employees: '80+',
    website: 'hebbia.ai',
    fundingStage: 'Series B',
    totalRaised: 130_000_000,
    lastRoundDate: '2024-07',
    currentRound: {
      stage: 'Series B Extension',
      targetRaise: 50_000_000,
      raised: 22_000_000,
      closingDate: '2025-03-31',
      leadInvestor: 'a16z',
    },
    investors: ['a16z', 'Index Ventures', 'Google Ventures', 'Peter Thiel'],
    riskLevel: 'Very High',
    lockupPeriod: '1 year',
  },
];

// ============================================================================
// ATS Tokens (tZERO and other ATS platforms)
// ============================================================================

export const ATS_TOKENS: ATSToken[] = [
  {
    symbol: 'TZROP',
    name: 'tZERO Preferred',
    category: 'secondary-ats',
    platform: 'tZERO',
    tokenType: 'preferred-equity',
    currentPrice: 2.85,
    priceChange24h: 3.2,
    priceChange7d: 8.5,
    volume24h: 145000,
    marketCap: 85_000_000,
    totalSupply: 30_000_000,
    circulatingSupply: 25_000_000,
    underlyingAsset: 'tZERO Group Inc. Series A Preferred Stock',
    issuer: 'tZERO Group, Inc.',
    issuanceDate: '2018-08',
    description: 'Digital security token representing Series A Preferred Stock of tZERO Group, the leading regulated ATS for digital securities.',
    accreditedOnly: false,
    jurisdiction: ['US'],
    minimumOrder: 25,
    tradingHours: 'Market Hours (9:30 AM - 4:00 PM ET)',
    settlementTime: 'T+0 (Same day)',
    riskLevel: 'High',
  },
  {
    symbol: 'ASPD',
    name: 'Aspen Digital',
    category: 'secondary-ats',
    platform: 'tZERO',
    tokenType: 'reit-token',
    currentPrice: 18.45,
    priceChange24h: -1.2,
    priceChange7d: 2.3,
    volume24h: 52000,
    marketCap: 22_000_000,
    totalSupply: 1_200_000,
    circulatingSupply: 1_000_000,
    underlyingAsset: 'Fractional ownership in St. Regis Aspen Resort',
    issuer: 'Aspen Digital Inc.',
    issuanceDate: '2018-10',
    description: 'Tokenized real estate investment representing fractional ownership in the luxury St. Regis Aspen Resort property.',
    accreditedOnly: true,
    jurisdiction: ['US'],
    minimumOrder: 50,
    tradingHours: 'Market Hours (9:30 AM - 4:00 PM ET)',
    settlementTime: 'T+0 (Same day)',
    riskLevel: 'Medium',
  },
  {
    symbol: 'OSTKO',
    name: 'Overstock Digital',
    category: 'secondary-ats',
    platform: 'tZERO',
    tokenType: 'security-token',
    currentPrice: 24.60,
    priceChange24h: 1.8,
    priceChange7d: -3.2,
    volume24h: 89000,
    marketCap: 125_000_000,
    totalSupply: 5_100_000,
    circulatingSupply: 4_800_000,
    underlyingAsset: 'Overstock.com Digital Voting Series A-1 Preferred Stock',
    issuer: 'Overstock.com, Inc.',
    issuanceDate: '2016-12',
    description: 'First SEC-registered digital security. Blockchain-based preferred stock of Overstock.com with voting rights.',
    accreditedOnly: false,
    jurisdiction: ['US'],
    minimumOrder: 25,
    tradingHours: 'Market Hours (9:30 AM - 4:00 PM ET)',
    settlementTime: 'T+0 (Same day)',
    riskLevel: 'High',
  },
  {
    symbol: 'BCAP',
    name: 'Blockchain Capital',
    category: 'secondary-ats',
    platform: 'Securitize',
    tokenType: 'fund-token',
    currentPrice: 8.92,
    priceChange24h: 2.4,
    priceChange7d: 5.8,
    volume24h: 34000,
    marketCap: 45_000_000,
    totalSupply: 5_000_000,
    circulatingSupply: 4_200_000,
    underlyingAsset: 'LP Interest in Blockchain Capital III Fund',
    issuer: 'Blockchain Capital',
    issuanceDate: '2017-04',
    description: 'Security token representing limited partner interest in Blockchain Capital III, a venture fund investing in blockchain companies.',
    accreditedOnly: true,
    jurisdiction: ['US', 'EU'],
    minimumOrder: 100,
    tradingHours: '24/7 (Securitize Markets)',
    settlementTime: 'T+1',
    riskLevel: 'Very High',
  },
  {
    symbol: 'SPTL',
    name: 'SPiCE VC Token',
    category: 'secondary-ats',
    platform: 'Securitize',
    tokenType: 'fund-token',
    currentPrice: 1.45,
    priceChange24h: -0.8,
    priceChange7d: 1.2,
    volume24h: 18000,
    marketCap: 15_000_000,
    totalSupply: 10_000_000,
    circulatingSupply: 8_500_000,
    underlyingAsset: 'LP Interest in SPiCE VC Fund',
    issuer: 'SPiCE VC',
    issuanceDate: '2018-03',
    description: 'Tokenized venture capital fund focusing on blockchain and crypto infrastructure investments.',
    accreditedOnly: true,
    jurisdiction: ['US', 'EU', 'APAC'],
    minimumOrder: 50,
    tradingHours: '24/7 (Securitize Markets)',
    settlementTime: 'T+1',
    riskLevel: 'Very High',
  },
  {
    symbol: 'EXODUS',
    name: 'Exodus Movement',
    category: 'secondary-ats',
    platform: 'tZERO',
    tokenType: 'security-token',
    currentPrice: 32.15,
    priceChange24h: 4.6,
    priceChange7d: 12.3,
    volume24h: 156000,
    marketCap: 180_000_000,
    totalSupply: 5_600_000,
    circulatingSupply: 5_200_000,
    underlyingAsset: 'Exodus Movement Inc. Class A Common Stock',
    issuer: 'Exodus Movement Inc.',
    issuanceDate: '2021-04',
    description: 'Tokenized common stock of Exodus, the popular multi-asset cryptocurrency wallet company.',
    accreditedOnly: false,
    jurisdiction: ['US'],
    minimumOrder: 25,
    tradingHours: 'Market Hours (9:30 AM - 4:00 PM ET)',
    settlementTime: 'T+0 (Same day)',
    riskLevel: 'High',
  },
];

// ============================================================================
// Private Listings (Invite-only exclusive deals)
// ============================================================================

export const PRIVATE_LISTINGS: PrivateListing[] = [
  {
    id: 'SPACEX-B',
    symbol: 'SPACEX-B',
    name: 'SpaceX Series B Block',
    category: 'private-listing',
    dealType: 'block-trade',
    description: 'Direct secondary block purchase of SpaceX common shares from early employees. Rare opportunity to acquire pre-IPO shares at institutional pricing.',
    targetCompany: 'SpaceX',
    sector: 'Aerospace',
    requiredCodes: ['123456', 'MERU01', 'ALPHA1'],
    isPubliclyVisible: true,
    minimumInvestment: 50000,
    maximumInvestment: 500000,
    sharePrice: 108.50,
    estimatedValuation: 180_000_000_000,
    targetRaise: 5_000_000,
    amountRaised: 3_200_000,
    investorCount: 24,
    openDate: '2025-01-15',
    closingDate: '2025-02-15',
    status: 'closing-soon',
    lockupPeriod: '12 months',
    riskLevel: 'High',
    documents: ['Term Sheet', 'Subscription Agreement', 'Risk Factors', 'Investor Questionnaire'],
  },
  {
    id: 'STRIPE-SPV',
    symbol: 'STRIPE-SPV',
    name: 'Stripe Employee SPV',
    category: 'private-listing',
    dealType: 'spv',
    description: 'Special Purpose Vehicle acquiring Stripe shares from departing employees. SPV structure provides diversified exposure with professional management.',
    targetCompany: 'Stripe',
    sector: 'Fintech',
    requiredCodes: ['123456', 'ALPHA1'],
    isPubliclyVisible: true,
    minimumInvestment: 100000,
    maximumInvestment: 1000000,
    sharePrice: 26.50,
    estimatedValuation: 65_000_000_000,
    targetRaise: 10_000_000,
    amountRaised: 4_500_000,
    investorCount: 18,
    openDate: '2025-01-20',
    closingDate: '2025-02-28',
    status: 'open',
    lockupPeriod: 'Until IPO or liquidity event',
    carriedInterest: 20,
    managementFee: 2,
    riskLevel: 'Very High',
    documents: ['SPV Operating Agreement', 'Subscription Docs', 'Fee Schedule', 'Risk Disclosure'],
  },
  {
    id: 'OPENAI-A',
    symbol: 'OPENAI-A',
    name: 'OpenAI Tender Allocation',
    category: 'private-listing',
    dealType: 'pre-ipo-allocation',
    description: 'Pre-IPO allocation from tender offer. Extremely limited availability from recent employee tender. Priced at latest round valuation.',
    targetCompany: 'OpenAI',
    sector: 'Artificial Intelligence',
    requiredCodes: ['MERU01', 'ALPHA1'],
    isPubliclyVisible: true,
    minimumInvestment: 250000,
    maximumInvestment: 2000000,
    sharePrice: 86.00,
    estimatedValuation: 157_000_000_000,
    targetRaise: 25_000_000,
    amountRaised: 22_000_000,
    investorCount: 42,
    openDate: '2025-01-01',
    closingDate: '2025-02-10',
    status: 'closing-soon',
    lockupPeriod: '2 years',
    riskLevel: 'Very High',
    documents: ['Allocation Notice', 'Subscription Agreement', 'Tax Forms', 'Accreditation Verification'],
  },
  {
    id: 'ANTHRO-C',
    symbol: 'ANTHRO-C',
    name: 'Anthropic Direct Secondary',
    category: 'private-listing',
    dealType: 'secondary-direct',
    description: 'Direct secondary purchase of Anthropic shares from early investor selling portion of position. Claude AI creator valued at $61.5B.',
    targetCompany: 'Anthropic',
    sector: 'Artificial Intelligence',
    requiredCodes: ['ALPHA1'],
    isPubliclyVisible: true,
    minimumInvestment: 150000,
    maximumInvestment: 750000,
    sharePrice: 142.75,
    estimatedValuation: 61_500_000_000,
    targetRaise: 8_000_000,
    amountRaised: 2_100_000,
    investorCount: 8,
    openDate: '2025-01-25',
    closingDate: '2025-03-15',
    status: 'open',
    lockupPeriod: '18 months',
    riskLevel: 'Very High',
    documents: ['Purchase Agreement', 'Seller Disclosure', 'Risk Factors'],
  },
  {
    id: 'UNICORN-III',
    symbol: 'UNICORN-III',
    name: 'Unicorn Growth Fund III',
    category: 'private-listing',
    dealType: 'fund-commitment',
    description: 'Flagship growth equity fund targeting late-stage AI and fintech companies. Access to top-tier deal flow and co-investment opportunities.',
    targetCompany: 'Multiple (Fund)',
    sector: 'Multi-Sector',
    requiredCodes: ['ALPHA1'],
    isPubliclyVisible: true,
    minimumInvestment: 500000,
    sharePrice: 1.00,
    estimatedValuation: 0,
    targetRaise: 100_000_000,
    amountRaised: 45_000_000,
    investorCount: 32,
    openDate: '2024-12-01',
    closingDate: '2025-06-30',
    status: 'open',
    lockupPeriod: '10 years (fund life)',
    carriedInterest: 20,
    managementFee: 2,
    riskLevel: 'High',
    documents: ['PPM', 'LPA', 'Subscription Agreement', 'Side Letter'],
  },
];

// ============================================================================
// Combined exports
// ============================================================================

export const ALL_PRIVATE_STOCKS: PrivateStockInstrument[] = [
  ...PRE_IPO_COMPANIES,
  ...STARTUP_COMPANIES,
];

// Quick lookup by symbol
export const PRIVATE_STOCK_MAP: Record<string, PrivateStockInstrument> = {};
ALL_PRIVATE_STOCKS.forEach(stock => {
  PRIVATE_STOCK_MAP[stock.symbol] = stock;
});

// ATS Token lookup
export const ATS_TOKEN_MAP: Record<string, ATSToken> = {};
ATS_TOKENS.forEach(token => {
  ATS_TOKEN_MAP[token.symbol] = token;
});

// Private Listing lookup
export const PRIVATE_LISTING_MAP: Record<string, PrivateListing> = {};
PRIVATE_LISTINGS.forEach(listing => {
  PRIVATE_LISTING_MAP[listing.id] = listing;
});

// ============================================================================
// Helper functions
// ============================================================================

export function formatValuation(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(0)}M`;
  }
  return `$${value.toLocaleString()}`;
}

export function formatFundingProgress(raised: number, target: number): number {
  return Math.min(100, Math.round((raised / target) * 100));
}

export function getRiskColor(risk: 'High' | 'Very High' | 'Extreme'): string {
  switch (risk) {
    case 'High': return '#F0B429';
    case 'Very High': return '#FF6B35';
    case 'Extreme': return '#FF4D4D';
  }
}

export function getSectorIcon(sector: string): string {
  const icons: Record<string, string> = {
    'Aerospace': '🚀',
    'Fintech': '💳',
    'Enterprise Software': '💼',
    'Social Media': '💬',
    'Artificial Intelligence': '🤖',
    'Design Software': '🎨',
    'Developer Tools': '⚡',
    'Climate Tech': '🌱',
    'Healthcare AI': '🏥',
    'IT Services': '🖥️',
    'Generative AI': '✨',
    'Enterprise AI': '🧠',
    'Multi-Sector': '🎯',
  };
  return icons[sector] || '📈';
}

export function getATSPlatformIcon(platform: ATSPlatform): string {
  const icons: Record<ATSPlatform, string> = {
    'tZERO': '🔷',
    'Securitize': '🔶',
    'INX': '🟣',
  };
  return icons[platform];
}

export function getTokenTypeLabel(tokenType: TokenType): string {
  const labels: Record<TokenType, string> = {
    'security-token': 'Security Token',
    'preferred-equity': 'Preferred Equity',
    'reit-token': 'REIT Token',
    'fund-token': 'Fund Token',
    'digital-asset': 'Digital Asset',
  };
  return labels[tokenType];
}

export function getDealTypeLabel(dealType: DealType): string {
  const labels: Record<DealType, string> = {
    'block-trade': 'Block Trade',
    'spv': 'SPV',
    'pre-ipo-allocation': 'Pre-IPO Allocation',
    'secondary-direct': 'Direct Secondary',
    'fund-commitment': 'Fund Commitment',
  };
  return labels[dealType];
}

export function getDealStatusColor(status: DealStatus): string {
  switch (status) {
    case 'open': return '#22C55E';
    case 'closing-soon': return '#F0B429';
    case 'fully-subscribed': return '#3B82F6';
    case 'closed': return '#6B7280';
  }
}

export function getDaysUntilClose(closingDate: string): number {
  const close = new Date(closingDate);
  const now = new Date();
  const diff = close.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(0)}K`;
  }
  return `$${volume.toFixed(0)}`;
}
