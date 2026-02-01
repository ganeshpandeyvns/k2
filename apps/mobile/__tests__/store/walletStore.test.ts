// ============================================================================
// Wallet Store Tests
// ============================================================================

import { useWalletStore } from '../../src/store/walletStore';

// Helper to wrap state updates
const act = (fn: () => void) => fn();

describe('walletStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useWalletStore.setState({
        addresses: {},
        pendingSends: [],
        swapHistory: [],
      });
    });
  });

  describe('getAddress', () => {
    it('should generate address for new asset', () => {
      const { getAddress } = useWalletStore.getState();
      const address = getAddress('BTC');

      expect(address).toBeDefined();
      expect(address.length).toBeGreaterThan(0);
    });

    it('should return same address for same asset', () => {
      const { getAddress } = useWalletStore.getState();

      const address1 = getAddress('ETH');
      const address2 = getAddress('ETH');

      expect(address1).toBe(address2);
    });

    it('should generate different addresses for different assets', () => {
      const { getAddress } = useWalletStore.getState();

      const btcAddress = getAddress('BTC');
      const ethAddress = getAddress('ETH');

      expect(btcAddress).not.toBe(ethAddress);
    });
  });

  describe('generateAddress', () => {
    it('should generate BTC-style address', () => {
      const { generateAddress } = useWalletStore.getState();
      const address = generateAddress('BTC');

      expect(address).toMatch(/^[13]/); // Starts with 1 or 3
    });

    it('should generate ETH-style address', () => {
      const { generateAddress } = useWalletStore.getState();
      const address = generateAddress('ETH');

      expect(address).toMatch(/^0x/);
      expect(address.length).toBe(42);
    });

    it('should generate SOL-style address', () => {
      const { generateAddress } = useWalletStore.getState();
      const address = generateAddress('SOL');

      // SOL addresses are typically 32-44 chars
      expect(address.length).toBeGreaterThanOrEqual(32);
      expect(address.length).toBeLessThanOrEqual(44);
    });
  });

  describe('simulateSend', () => {
    it('should create pending send and complete it', async () => {
      const { simulateSend } = useWalletStore.getState();

      const result = await simulateSend('ETH', '0xabc123...', 1.5, 5250, 0.002);

      expect(result.status).toBe('completed');
      expect(result.asset).toBe('ETH');
      expect(result.amount).toBe(1.5);
      expect(result.txHash).toBeDefined();
    });

    it('should add completed send to pendingSends', async () => {
      await useWalletStore.getState().simulateSend('BTC', '1abc...', 0.1, 7000, 0.0001);

      const { pendingSends } = useWalletStore.getState();
      expect(pendingSends.length).toBe(1);
      expect(pendingSends[0].status).toBe('completed');
    });
  });

  describe('simulateSwap', () => {
    it('should create completed swap transaction', async () => {
      const { simulateSwap } = useWalletStore.getState();

      const result = await simulateSwap('ETH', 'USDC', 1.0, 3500, 3500, 0.5);

      expect(result.status).toBe('completed');
      expect(result.fromAsset).toBe('ETH');
      expect(result.toAsset).toBe('USDC');
      expect(result.fromAmount).toBe(1.0);
      expect(result.toAmount).toBe(3500);
    });

    it('should add swap to history', async () => {
      await useWalletStore.getState().simulateSwap('SOL', 'USDC', 10, 1800, 180, 1.0);

      const { swapHistory } = useWalletStore.getState();
      expect(swapHistory.length).toBe(1);
      expect(swapHistory[0].fromAsset).toBe('SOL');
    });
  });

  describe('clearHistory', () => {
    it('should clear pending sends and swap history', async () => {
      // Add some history
      await useWalletStore.getState().simulateSend('ETH', '0x...', 1, 3500, 0.002);
      await useWalletStore.getState().simulateSwap('ETH', 'USDC', 1, 3500, 3500, 0.5);

      act(() => {
        useWalletStore.getState().clearHistory();
      });

      const { pendingSends, swapHistory } = useWalletStore.getState();
      expect(pendingSends.length).toBe(0);
      expect(swapHistory.length).toBe(0);
    });

    it('should preserve addresses', async () => {
      // Generate an address
      useWalletStore.getState().getAddress('BTC');

      act(() => {
        useWalletStore.getState().clearHistory();
      });

      const { addresses } = useWalletStore.getState();
      expect(addresses.BTC).toBeDefined();
    });
  });
});
