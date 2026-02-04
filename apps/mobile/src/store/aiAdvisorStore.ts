// ============================================================================
// AI Advisor Store - Financial Assistant with Guardrails
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

export type QueryCategory =
  | 'portfolio-analysis'
  | 'market-insight'
  | 'investment-education'
  | 'product-info'
  | 'risk-assessment'
  | 'blocked'
  | 'off-topic';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  category?: QueryCategory;
  disclaimer?: string;
}

export interface PortfolioHealthScore {
  overall: number; // 0-100
  diversification: number;
  riskAdjusted: number;
  liquidity: number;
  growthPotential: number;
  lastUpdated: string;
}

export interface AdvisorInsight {
  id: string;
  title: string;
  summary: string;
  category: 'action' | 'warning' | 'opportunity' | 'education';
  priority: 'high' | 'medium' | 'low';
  relatedAssets?: string[];
  actionable: boolean;
  createdAt: string;
}

interface AIAdvisorState {
  // Chat history
  messages: ChatMessage[];

  // Portfolio health
  healthScore: PortfolioHealthScore | null;

  // Proactive insights
  insights: AdvisorInsight[];

  // Session state
  isTyping: boolean;
  hasAcceptedDisclaimer: boolean;
  sessionStarted: string | null;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  classifyQuery: (query: string) => QueryCategory;
  generateResponse: (query: string) => Promise<ChatMessage>;
  calculateHealthScore: (holdings: any[], cashBalance: number) => PortfolioHealthScore;
  generateInsights: (holdings: any[], cashBalance: number) => AdvisorInsight[];

  // State management
  setTyping: (typing: boolean) => void;
  acceptDisclaimer: () => void;
  clearHistory: () => void;
  startSession: () => void;
  dismissInsight: (id: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const FINANCIAL_DISCLAIMER =
  'This information is for educational purposes only and should not be considered financial advice. ' +
  'Please consult a licensed financial advisor before making investment decisions.';

const BLOCKED_TOPICS = [
  'personal loan',
  'gambling',
  'lottery',
  'casino',
  'betting advice',
  'tax evasion',
  'money laundering',
  'illegal',
  'insider trading',
  'pump and dump',
  'guarantee returns',
  'get rich quick',
  'weather',
  'sports scores',
  'recipes',
  'travel',
  'dating',
  'politics',
  'religion',
];

const PRODUCT_KEYWORDS = [
  'crypto', 'bitcoin', 'ethereum', 'stock', 'share', 'bond', 'treasury',
  'etf', 'option', 'rwa', 'token', 'portfolio', 'deposit', 'withdraw',
  'trade', 'buy', 'sell', 'swap', 'send', 'receive', 'kyc', 'verification',
  'fixed income', 'yield', 'dividend', 'interest', 'coupon', 'maturity',
];

// ============================================================================
// Helper Functions
// ============================================================================

const generateMessageId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateInsightId = () =>
  `ins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Classify user query into categories
function classifyUserQuery(query: string): QueryCategory {
  const lowerQuery = query.toLowerCase();

  // Check for blocked topics first
  for (const topic of BLOCKED_TOPICS) {
    if (lowerQuery.includes(topic)) {
      return 'blocked';
    }
  }

  // Check if it's about platform products
  const isProductRelated = PRODUCT_KEYWORDS.some(kw => lowerQuery.includes(kw));

  if (!isProductRelated) {
    // Check if it's generic financial question
    const financialTerms = [
      'invest', 'money', 'market', 'return', 'risk', 'allocation', 'diversif',
      'compound', 'interest', 'inflation', 'recession', 'bull', 'bear',
    ];
    const isFinancialGeneral = financialTerms.some(term => lowerQuery.includes(term));

    if (!isFinancialGeneral) {
      return 'off-topic';
    }
  }

  // Categorize the financial query
  if (lowerQuery.includes('my portfolio') || lowerQuery.includes('my holding') || lowerQuery.includes('my position')) {
    return 'portfolio-analysis';
  }

  if (lowerQuery.includes('market') && (lowerQuery.includes('trend') || lowerQuery.includes('outlook') || lowerQuery.includes('analysis'))) {
    return 'market-insight';
  }

  if (lowerQuery.includes('what is') || lowerQuery.includes('how does') || lowerQuery.includes('explain') || lowerQuery.includes('what are')) {
    return 'investment-education';
  }

  if (lowerQuery.includes('risk') && (lowerQuery.includes('assess') || lowerQuery.includes('profile') || lowerQuery.includes('level'))) {
    return 'risk-assessment';
  }

  // "How to" questions should go to product-info for contextual responses
  if (lowerQuery.includes('how to') || lowerQuery.includes('how do i') || lowerQuery.includes('how can i')) {
    return 'product-info';
  }

  // Questions about specific products
  if (lowerQuery.includes('buy') || lowerQuery.includes('sell') || lowerQuery.includes('trade') ||
      lowerQuery.includes('deposit') || lowerQuery.includes('withdraw')) {
    return 'product-info';
  }

  return 'product-info';
}

// Generate mock AI responses based on category and query content
function generateMockResponse(query: string, category: QueryCategory): string {
  const lowerQuery = query.toLowerCase();

  switch (category) {
    case 'blocked':
      return "I'm sorry, but I can't provide advice on that topic. I'm here to help you with financial questions related to your investments and the Meru platform.";

    case 'off-topic':
      return "I'm designed to help with financial and investment questions. I'd be happy to assist with questions about your portfolio, market insights, or any of the investment products available on Meru.";

    case 'portfolio-analysis':
      return "Based on your current portfolio allocation, here's what I observe:\n\n" +
        "**Diversification**: Your portfolio shows good diversification across asset classes. " +
        "However, you might want to consider adding some fixed-income exposure to balance risk.\n\n" +
        "**Risk Profile**: Your current allocation suggests a growth-oriented strategy. " +
        "This is suitable for a longer investment horizon.\n\n" +
        "Would you like me to explain any specific aspect of your portfolio?";

    case 'market-insight':
      return "Here's a brief market overview:\n\n" +
        "**Crypto Markets**: Bitcoin has shown resilience above key support levels. " +
        "Institutional interest continues to grow.\n\n" +
        "**Equity Markets**: Tech sector remains strong, though valuations are elevated. " +
        "Consider dollar-cost averaging if adding positions.\n\n" +
        "**Fixed Income**: With current yields, treasury bonds offer attractive risk-adjusted returns " +
        "for conservative allocations.";

    case 'investment-education':
      if (lowerQuery.includes('bond') || lowerQuery.includes('fixed income')) {
        return "**Fixed Income Basics**\n\n" +
          "Fixed income securities (bonds) are debt instruments where you lend money to an issuer " +
          "(government or corporation) in exchange for regular interest payments and return of principal at maturity.\n\n" +
          "**Key Terms:**\n" +
          "- **Coupon Rate**: The annual interest rate paid\n" +
          "- **Yield to Maturity (YTM)**: Total return if held to maturity\n" +
          "- **Duration**: Sensitivity to interest rate changes\n" +
          "- **Credit Rating**: Issuer's creditworthiness (AAA to D)\n\n" +
          "Would you like to explore our Fixed Income section?";
      }
      return "I'd be happy to explain that concept. What specific aspect would you like me to cover?\n\n" +
        "I can help with topics like:\n" +
        "- Asset allocation strategies\n" +
        "- Risk management principles\n" +
        "- Understanding different investment products\n" +
        "- Market mechanics and terminology";

    case 'risk-assessment':
      return "**Risk Assessment Framework**\n\n" +
        "When evaluating investment risk, consider these factors:\n\n" +
        "1. **Volatility**: How much does the asset price fluctuate?\n" +
        "2. **Liquidity**: Can you easily sell without significant price impact?\n" +
        "3. **Correlation**: Does it move with or against your other holdings?\n" +
        "4. **Time Horizon**: Can you weather short-term downturns?\n\n" +
        "Your current portfolio risk level appears **moderate**. Would you like a detailed risk breakdown?";

    case 'product-info':
    default:
      // Generate contextual responses based on what the user is asking about

      // How to buy questions
      if (lowerQuery.includes('how to buy') || lowerQuery.includes('how do i buy')) {
        // Stock-specific
        if (lowerQuery.includes('stock') || lowerQuery.includes('share')) {
          const stockMatch = lowerQuery.match(/buy\s+(\w+)\s+(stock|share)/i);
          const stockName = stockMatch ? stockMatch[1].toUpperCase() : 'stocks';
          return `**How to Buy ${stockName !== 'stocks' ? stockName + ' Stock' : 'Stocks'} on Meru**\n\n` +
            "1. Go to the **Markets** tab and select **Stocks**\n" +
            "2. Search for the stock symbol (e.g., AAPL for Apple)\n" +
            "3. Tap on the stock to view details\n" +
            "4. Press **Buy** and enter your desired amount\n" +
            "5. Review and confirm your order\n\n" +
            "**Note**: Stock orders during market hours (9:30 AM - 4:00 PM ET) execute immediately. " +
            "Orders placed outside market hours are queued for the next trading session.\n\n" +
            "Would you like me to guide you through placing your first stock order?";
        }

        // Crypto-specific
        if (lowerQuery.includes('crypto') || lowerQuery.includes('bitcoin') || lowerQuery.includes('btc') ||
            lowerQuery.includes('ethereum') || lowerQuery.includes('eth')) {
          return "**How to Buy Crypto on Meru**\n\n" +
            "1. Go to the **Markets** tab and select **Crypto**\n" +
            "2. Browse or search for your desired cryptocurrency\n" +
            "3. Tap on the asset to view price charts and details\n" +
            "4. Press **Buy** and enter the amount in USD\n" +
            "5. Review the order summary and confirm\n\n" +
            "**Tip**: Crypto markets are open 24/7, so your orders execute immediately. " +
            "Consider dollar-cost averaging for volatile assets.\n\n" +
            "Is there a specific crypto you'd like to learn more about?";
        }

        // Bond-specific
        if (lowerQuery.includes('bond') || lowerQuery.includes('treasury') || lowerQuery.includes('fixed income')) {
          return "**How to Buy Bonds on Meru**\n\n" +
            "1. Go to the **Markets** tab and select **Bonds**\n" +
            "2. Browse by category: Treasuries, Corporate IG, High Yield, or Municipal\n" +
            "3. Tap on a bond to see yield, duration, and credit rating\n" +
            "4. Press **Buy** and enter your investment amount\n" +
            "5. Review accrued interest and total cost, then confirm\n\n" +
            "**Key Terms**:\n" +
            "- **Yield**: Annual return percentage\n" +
            "- **Duration**: Interest rate sensitivity\n" +
            "- **Credit Rating**: Risk level (AAA is safest)\n\n" +
            "Would you like me to recommend some bonds based on your risk profile?";
        }
      }

      // Questions about specific products/tokens
      if (lowerQuery.includes('heloc') || lowerQuery.includes('home equity')) {
        return "**About HELOC on Meru**\n\n" +
          "Meru doesn't currently offer HELOC (Home Equity Line of Credit) products. " +
          "HELOCs are traditional banking products, not tokenized assets.\n\n" +
          "However, if you're interested in **real estate exposure**, we offer:\n\n" +
          "- **RWA Tokens**: Tokenized real estate like commercial buildings and residential properties\n" +
          "- **REITs**: Real Estate Investment Trusts through our stocks section\n\n" +
          "Would you like to explore our RWA real estate tokens?";
      }

      // RWA questions
      if (lowerQuery.includes('rwa') || lowerQuery.includes('real world asset') || lowerQuery.includes('tokenized')) {
        return "**RWA (Real World Asset) Tokens**\n\n" +
          "RWA tokens represent fractional ownership in real-world assets that have been tokenized on the blockchain.\n\n" +
          "**Available Categories on Meru:**\n" +
          "- **Real Estate**: Commercial and residential properties\n" +
          "- **Commodities**: Gold, silver, and other precious metals\n" +
          "- **Carbon Credits**: Verified carbon offset tokens\n" +
          "- **Art & Collectibles**: Fractionalized fine art\n\n" +
          "**Benefits**: Lower minimums, 24/7 trading, instant settlement\n\n" +
          "Go to Markets → RWA to explore available tokens.";
      }

      // Questions about options
      if (lowerQuery.includes('option')) {
        return "**Stock Options on Meru**\n\n" +
          "We offer simplified options trading for buying calls and puts:\n\n" +
          "- **Calls**: Profit when the stock price rises\n" +
          "- **Puts**: Profit when the stock price falls\n\n" +
          "**How to Trade Options:**\n" +
          "1. Go to a stock's detail page\n" +
          "2. Tap **Trade Options**\n" +
          "3. Select expiration date and strike price\n" +
          "4. Choose Call or Put, enter contracts\n" +
          "5. Review premium and confirm\n\n" +
          "**Note**: Options involve substantial risk. Max loss is limited to the premium paid.";
      }

      // Sell questions
      if (lowerQuery.includes('how to sell') || lowerQuery.includes('how do i sell')) {
        return "**How to Sell Assets on Meru**\n\n" +
          "1. Go to your **Portfolio** tab\n" +
          "2. Tap on the holding you want to sell\n" +
          "3. Press the **Sell** button\n" +
          "4. Enter the amount or select 'Sell All'\n" +
          "5. Review and confirm your order\n\n" +
          "**Tips**:\n" +
          "- Proceeds are credited to your cash balance immediately\n" +
          "- For stocks, market orders execute at current price\n" +
          "- Consider tax implications before selling\n\n" +
          "Which asset are you looking to sell?";
      }

      // Deposit/withdraw questions
      if (lowerQuery.includes('deposit') || lowerQuery.includes('add money') || lowerQuery.includes('fund')) {
        return "**How to Deposit Funds**\n\n" +
          "1. Go to **Portfolio** → **Deposit**\n" +
          "2. Select your payment method (bank transfer or card)\n" +
          "3. Enter the amount (minimum $10)\n" +
          "4. Confirm the transaction\n\n" +
          "**Processing Times**:\n" +
          "- ACH Bank Transfer: 1-3 business days\n" +
          "- Debit Card: Instant\n" +
          "- Wire Transfer: Same day\n\n" +
          "Your cash balance will be updated once the deposit clears.";
      }

      if (lowerQuery.includes('withdraw') || lowerQuery.includes('cash out')) {
        return "**How to Withdraw Funds**\n\n" +
          "1. Go to **Portfolio** → **Withdraw**\n" +
          "2. Select your linked bank account\n" +
          "3. Enter the withdrawal amount\n" +
          "4. Confirm the transaction\n\n" +
          "**Note**: Withdrawals are processed within 1-3 business days. " +
          "Ensure your bank account is verified before withdrawing.";
      }

      // Default product info response
      return "I'd be happy to help! Here's what's available on Meru:\n\n" +
        "**Crypto**: Bitcoin, Ethereum, Solana, and 50+ tokens\n" +
        "**Stocks**: Trade US equities commission-free\n" +
        "**Bonds**: Treasury, corporate, and municipal bonds\n" +
        "**RWA Tokens**: Real estate, commodities, and more\n" +
        "**Options**: Simplified calls and puts trading\n\n" +
        "What specifically would you like to know about?";
  }
}

// ============================================================================
// Store
// ============================================================================

export const useAIAdvisorStore = create<AIAdvisorState>()(
  persist(
    (set, get) => ({
      messages: [],
      healthScore: null,
      insights: [],
      isTyping: false,
      hasAcceptedDisclaimer: false,
      sessionStarted: null,

      addMessage: (message) => {
        const fullMessage: ChatMessage = {
          ...message,
          id: generateMessageId(),
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, fullMessage],
        }));

        return fullMessage;
      },

      classifyQuery: (query) => {
        return classifyUserQuery(query);
      },

      generateResponse: async (query) => {
        const { addMessage, classifyQuery, setTyping } = get();

        // Add user message
        addMessage({ role: 'user', content: query });

        // Simulate typing
        setTyping(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

        // Classify and generate response
        const category = classifyQuery(query);
        const responseContent = generateMockResponse(query, category);

        // Determine if disclaimer is needed
        const needsDisclaimer = category !== 'blocked' && category !== 'off-topic';

        const assistantMessage = addMessage({
          role: 'assistant',
          content: responseContent,
          category,
          disclaimer: needsDisclaimer ? FINANCIAL_DISCLAIMER : undefined,
        });

        setTyping(false);

        return assistantMessage;
      },

      calculateHealthScore: (holdings, cashBalance) => {
        // Calculate diversification score
        const assetTypes = new Set(holdings.map((h: any) => h.assetType || 'crypto'));
        const diversificationScore = Math.min(assetTypes.size * 25, 100);

        // Calculate liquidity score (based on cash ratio)
        const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * (h.avgCost || 100)), 0) + cashBalance;
        const cashRatio = totalValue > 0 ? (cashBalance / totalValue) * 100 : 0;
        const liquidityScore = Math.min(cashRatio * 5, 100); // 20% cash = 100 score

        // Mock risk-adjusted score
        const riskAdjustedScore = 70 + Math.random() * 20;

        // Mock growth potential
        const growthPotentialScore = 60 + Math.random() * 30;

        // Overall is weighted average
        const overall = Math.round(
          diversificationScore * 0.3 +
          riskAdjustedScore * 0.3 +
          liquidityScore * 0.2 +
          growthPotentialScore * 0.2
        );

        const healthScore: PortfolioHealthScore = {
          overall,
          diversification: Math.round(diversificationScore),
          riskAdjusted: Math.round(riskAdjustedScore),
          liquidity: Math.round(liquidityScore),
          growthPotential: Math.round(growthPotentialScore),
          lastUpdated: new Date().toISOString(),
        };

        set({ healthScore });

        return healthScore;
      },

      generateInsights: (holdings, cashBalance) => {
        const insights: AdvisorInsight[] = [];

        // Check for diversification
        const assetTypes = new Set(holdings.map((h: any) => h.assetType || 'crypto'));
        if (assetTypes.size < 3) {
          insights.push({
            id: generateInsightId(),
            title: 'Diversification Opportunity',
            summary: 'Your portfolio is concentrated in a few asset types. Consider adding fixed income or RWA tokens for better diversification.',
            category: 'opportunity',
            priority: 'medium',
            actionable: true,
            createdAt: new Date().toISOString(),
          });
        }

        // Check cash balance
        const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * (h.avgCost || 100)), 0) + cashBalance;
        const cashRatio = totalValue > 0 ? cashBalance / totalValue : 0;

        if (cashRatio < 0.05) {
          insights.push({
            id: generateInsightId(),
            title: 'Low Cash Reserve',
            summary: 'Your cash balance is below 5% of your portfolio. Consider maintaining some liquidity for opportunities.',
            category: 'warning',
            priority: 'high',
            actionable: true,
            createdAt: new Date().toISOString(),
          });
        }

        if (cashRatio > 0.3) {
          insights.push({
            id: generateInsightId(),
            title: 'High Cash Position',
            summary: 'You have over 30% in cash. In the current market environment, you might consider deploying some capital.',
            category: 'action',
            priority: 'low',
            actionable: true,
            createdAt: new Date().toISOString(),
          });
        }

        // Check for crypto concentration
        const cryptoHoldings = holdings.filter((h: any) => h.assetType === 'crypto');
        const cryptoValue = cryptoHoldings.reduce((sum: number, h: any) => sum + (h.quantity * (h.avgCost || 100)), 0);
        if (totalValue > 0 && cryptoValue / totalValue > 0.7) {
          insights.push({
            id: generateInsightId(),
            title: 'High Crypto Exposure',
            summary: 'Over 70% of your portfolio is in crypto. Consider balancing with lower-volatility assets like bonds.',
            category: 'warning',
            priority: 'medium',
            relatedAssets: cryptoHoldings.map((h: any) => h.symbol),
            actionable: true,
            createdAt: new Date().toISOString(),
          });
        }

        // Education insight
        if (!holdings.some((h: any) => h.assetType === 'bond')) {
          insights.push({
            id: generateInsightId(),
            title: 'New: Fixed Income Available',
            summary: 'Explore treasury bonds and corporate bonds for stable yield. Current rates are historically attractive.',
            category: 'education',
            priority: 'low',
            actionable: true,
            createdAt: new Date().toISOString(),
          });
        }

        set({ insights });

        return insights;
      },

      setTyping: (typing) => {
        set({ isTyping: typing });
      },

      acceptDisclaimer: () => {
        set({ hasAcceptedDisclaimer: true });
      },

      clearHistory: () => {
        set({ messages: [], sessionStarted: null });
      },

      startSession: () => {
        const { messages, addMessage } = get();

        // Only add welcome message if no messages exist
        if (messages.length === 0) {
          addMessage({
            role: 'assistant',
            content: "Hello! I'm your Meru Financial Advisor. I can help you with:\n\n" +
              "- Portfolio analysis and optimization\n" +
              "- Investment education and explanations\n" +
              "- Market insights and trends\n" +
              "- Information about Meru products\n\n" +
              "How can I assist you today?",
          });
        }

        set({ sessionStarted: new Date().toISOString() });
      },

      dismissInsight: (id) => {
        set((state) => ({
          insights: state.insights.filter(i => i.id !== id),
        }));
      },
    }),
    {
      name: 'meru-ai-advisor-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
        hasAcceptedDisclaimer: state.hasAcceptedDisclaimer,
        healthScore: state.healthScore,
      }),
    }
  )
);
