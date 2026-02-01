// ============================================================================
// Portfolio Store Tests
// ============================================================================

import { usePortfolioStore } from '../../src/store/portfolioStore';

// Helper to wrap state updates
const act = (fn: () => void) => fn();

describe('portfolioStore', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    act(() => {
      usePortfolioStore.getState().clearAll();
    });
  });

  describe('getHolding', () => {
    it('should return undefined for non-existent holding', () => {
      const holding = usePortfolioStore.getState().getHolding('UNKNOWN');
      expect(holding).toBeUndefined();
    });

    it('should return existing holding', () => {
      const holding = usePortfolioStore.getState().getHolding('BTC');
      expect(holding).toBeDefined();
      expect(holding?.symbol).toBe('BTC');
    });
  });

  describe('executeBuy', () => {
    it('should add new holding when buying new asset', () => {
      const { executeBuy, getHolding } = usePortfolioStore.getState();

      // Buy a new asset that doesn't exist
      const tx = executeBuy('DOGE', 1000, 0.15, 'Dogecoin', '#c3a634');

      expect(tx).toBeDefined();
      expect(tx.type).toBe('buy');
      expect(tx.asset).toBe('DOGE');
      expect(tx.quantity).toBe(1000);
      expect(tx.price).toBe(0.15);
      expect(tx.total).toBe(150);
      expect(tx.status).toBe('completed');

      const holding = getHolding('DOGE');
      expect(holding).toBeDefined();
      expect(holding?.quantity).toBe(1000);
      expect(holding?.avgCost).toBe(0.15);
    });

    it('should update existing holding with averaged cost', () => {
      const { executeBuy, getHolding } = usePortfolioStore.getState();

      // Get initial BTC holding
      const initialHolding = getHolding('BTC');
      const initialQty = initialHolding?.quantity || 0;
      const initialAvgCost = initialHolding?.avgCost || 0;

      // Buy more BTC at different price
      executeBuy('BTC', 0.5, 70000);

      const updatedHolding = getHolding('BTC');
      expect(updatedHolding?.quantity).toBe(initialQty + 0.5);

      // Check average cost calculation
      const expectedAvgCost =
        (initialAvgCost * initialQty + 70000 * 0.5) / (initialQty + 0.5);
      expect(updatedHolding?.avgCost).toBeCloseTo(expectedAvgCost, 2);
    });

    it('should record transaction in history', () => {
      const { executeBuy, getTransactionHistory } = usePortfolioStore.getState();

      executeBuy('XRP', 100, 0.50);

      const history = getTransactionHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].type).toBe('buy');
      expect(history[0].asset).toBe('XRP');
    });
  });

  describe('executeSell', () => {
    it('should return null when selling more than available', () => {
      const { executeSell, getHolding } = usePortfolioStore.getState();

      const btcHolding = getHolding('BTC');
      const currentQty = btcHolding?.quantity || 0;

      // Try to sell more than available
      const result = executeSell('BTC', currentQty + 100, 70000);

      expect(result).toBeNull();
    });

    it('should return null when selling non-existent asset', () => {
      const { executeSell } = usePortfolioStore.getState();

      const result = executeSell('UNKNOWN', 1, 100);

      expect(result).toBeNull();
    });

    it('should reduce holding quantity when selling', () => {
      const { executeSell, getHolding } = usePortfolioStore.getState();

      const initialHolding = getHolding('BTC');
      const initialQty = initialHolding?.quantity || 0;

      const sellQty = 0.1;
      const tx = executeSell('BTC', sellQty, 70000);

      expect(tx).toBeDefined();
      expect(tx?.type).toBe('sell');
      expect(tx?.quantity).toBe(sellQty);

      const updatedHolding = getHolding('BTC');
      expect(updatedHolding?.quantity).toBeCloseTo(initialQty - sellQty, 6);
    });

    it('should remove holding when selling all', () => {
      const { executeBuy, executeSell, getHolding } = usePortfolioStore.getState();

      // Add a small holding
      executeBuy('TEST', 1.0, 10);
      expect(getHolding('TEST')).toBeDefined();

      // Sell all of it
      executeSell('TEST', 1.0, 12);

      // Should be removed (quantity <= 0.000001)
      expect(getHolding('TEST')).toBeUndefined();
    });
  });

  describe('executeSwap', () => {
    it('should reduce from-asset and increase to-asset', () => {
      const { executeSwap, getHolding, executeBuy } = usePortfolioStore.getState();

      // Ensure we have ETH
      const initialEth = getHolding('ETH');
      const ethQty = initialEth?.quantity || 0;

      // Swap some ETH for USDC
      const swapQty = 1.0;
      const receiveQty = 3500; // ~$3500 USDC

      const tx = executeSwap('ETH', swapQty, 'USDC', receiveQty, 'USD Coin', '#2775ca');

      expect(tx).toBeDefined();
      expect(tx.type).toBe('swap');
      expect(tx.asset).toBe('ETH');
      expect(tx.toAsset).toBe('USDC');

      // ETH should be reduced
      const updatedEth = getHolding('ETH');
      expect(updatedEth?.quantity).toBeCloseTo(ethQty - swapQty, 6);

      // USDC should be added/increased
      const usdc = getHolding('USDC');
      expect(usdc).toBeDefined();
      expect(usdc?.quantity).toBeGreaterThanOrEqual(receiveQty);
    });
  });

  describe('executeSend', () => {
    it('should return null when sending more than available', () => {
      const { executeSend, getHolding } = usePortfolioStore.getState();

      const btcHolding = getHolding('BTC');
      const currentQty = btcHolding?.quantity || 0;

      const result = executeSend('BTC', currentQty + 10, '0x123...', 70000);

      expect(result).toBeNull();
    });

    it('should reduce holding when sending', () => {
      const { executeSend, getHolding } = usePortfolioStore.getState();

      const initialHolding = getHolding('ETH');
      const initialQty = initialHolding?.quantity || 0;

      const sendQty = 0.5;
      const tx = executeSend('ETH', sendQty, '0xabc123...', 3500);

      expect(tx).toBeDefined();
      expect(tx?.type).toBe('send');
      expect(tx?.toAddress).toBe('0xabc123...');

      const updatedHolding = getHolding('ETH');
      expect(updatedHolding?.quantity).toBeCloseTo(initialQty - sendQty, 6);
    });
  });

  describe('executeReceive', () => {
    it('should add new holding when receiving new asset', () => {
      const { executeReceive, getHolding } = usePortfolioStore.getState();

      const tx = executeReceive('DOT', 50, '0xsender...', 7.5, 'Polkadot', '#e6007a');

      expect(tx).toBeDefined();
      expect(tx.type).toBe('receive');

      const holding = getHolding('DOT');
      expect(holding).toBeDefined();
      expect(holding?.quantity).toBe(50);
    });

    it('should increase existing holding when receiving', () => {
      const { executeReceive, getHolding } = usePortfolioStore.getState();

      const initialHolding = getHolding('BTC');
      const initialQty = initialHolding?.quantity || 0;

      executeReceive('BTC', 0.1, '0xsender...', 70000);

      const updatedHolding = getHolding('BTC');
      expect(updatedHolding?.quantity).toBeCloseTo(initialQty + 0.1, 6);
    });
  });

  describe('getTotalValue', () => {
    it('should calculate total portfolio value', () => {
      const { getTotalValue, getHolding } = usePortfolioStore.getState();

      const prices = {
        BTC: 70000,
        ETH: 3500,
        SOL: 180,
        AVAX: 45,
      };

      const totalValue = getTotalValue(prices);

      // Calculate expected value
      const btc = getHolding('BTC');
      const eth = getHolding('ETH');
      const sol = getHolding('SOL');
      const avax = getHolding('AVAX');

      const expected =
        (btc?.quantity || 0) * 70000 +
        (eth?.quantity || 0) * 3500 +
        (sol?.quantity || 0) * 180 +
        (avax?.quantity || 0) * 45;

      expect(totalValue).toBeCloseTo(expected, 2);
    });
  });
});
