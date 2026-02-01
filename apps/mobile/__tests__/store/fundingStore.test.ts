// ============================================================================
// Funding Store Tests
// ============================================================================

import { useFundingStore } from '../../src/store/fundingStore';

// Helper to wrap state updates
const act = (fn: () => void) => fn();

describe('fundingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useFundingStore.setState({
        paymentMethods: [],
        transactions: [],
        cashBalance: 0,
        pendingDeposit: null,
      });
    });
  });

  describe('cashBalance', () => {
    it('should start with zero balance', () => {
      const { cashBalance } = useFundingStore.getState();
      expect(cashBalance).toBe(0);
    });

    it('should update cash balance with positive delta', () => {
      const { updateCashBalance } = useFundingStore.getState();

      act(() => {
        updateCashBalance(1000);
      });

      expect(useFundingStore.getState().cashBalance).toBe(1000);
    });

    it('should update cash balance with negative delta', () => {
      act(() => {
        useFundingStore.getState().setCashBalance(500);
      });

      act(() => {
        useFundingStore.getState().updateCashBalance(-200);
      });

      expect(useFundingStore.getState().cashBalance).toBe(300);
    });

    it('should not allow negative balance', () => {
      act(() => {
        useFundingStore.getState().setCashBalance(100);
      });

      act(() => {
        useFundingStore.getState().updateCashBalance(-500);
      });

      // Should floor at 0, not go negative
      expect(useFundingStore.getState().cashBalance).toBe(0);
    });

    it('should set cash balance directly', () => {
      act(() => {
        useFundingStore.getState().setCashBalance(5000);
      });

      expect(useFundingStore.getState().cashBalance).toBe(5000);
    });
  });

  describe('paymentMethods', () => {
    it('should add payment method', () => {
      const { addPaymentMethod } = useFundingStore.getState();

      act(() => {
        addPaymentMethod({
          id: 'pm_1',
          type: 'bank',
          name: 'Chase Checking',
          lastFour: '4521',
          bankId: 'chase',
          isDefault: false,
          status: 'verified',
          accountType: 'checking',
        });
      });

      const { paymentMethods } = useFundingStore.getState();
      expect(paymentMethods.length).toBe(1);
      expect(paymentMethods[0].name).toBe('Chase Checking');
    });

    it('should set first payment method as default', () => {
      const { addPaymentMethod } = useFundingStore.getState();

      act(() => {
        addPaymentMethod({
          id: 'pm_1',
          type: 'bank',
          name: 'Chase',
          lastFour: '4521',
          bankId: 'chase',
          isDefault: false,
          status: 'verified',
        });
      });

      const { paymentMethods } = useFundingStore.getState();
      expect(paymentMethods[0].isDefault).toBe(true);
    });

    it('should remove payment method', () => {
      act(() => {
        useFundingStore.getState().addPaymentMethod({
          id: 'pm_1',
          type: 'bank',
          name: 'Chase',
          lastFour: '4521',
          bankId: 'chase',
          isDefault: true,
          status: 'verified',
        });
      });

      act(() => {
        useFundingStore.getState().removePaymentMethod('pm_1');
      });

      expect(useFundingStore.getState().paymentMethods.length).toBe(0);
    });

    it('should set default payment method', () => {
      act(() => {
        useFundingStore.getState().addPaymentMethod({
          id: 'pm_1',
          type: 'bank',
          name: 'Chase',
          lastFour: '4521',
          bankId: 'chase',
          isDefault: true,
          status: 'verified',
        });
        useFundingStore.getState().addPaymentMethod({
          id: 'pm_2',
          type: 'bank',
          name: 'Wells Fargo',
          lastFour: '9876',
          bankId: 'wells',
          isDefault: false,
          status: 'verified',
        });
      });

      act(() => {
        useFundingStore.getState().setDefaultMethod('pm_2');
      });

      const { paymentMethods } = useFundingStore.getState();
      const pm1 = paymentMethods.find((m) => m.id === 'pm_1');
      const pm2 = paymentMethods.find((m) => m.id === 'pm_2');

      expect(pm1?.isDefault).toBe(false);
      expect(pm2?.isDefault).toBe(true);
    });
  });

  describe('simulateDeposit', () => {
    it('should add deposit to cash balance', async () => {
      const { simulateDeposit } = useFundingStore.getState();

      const tx = await simulateDeposit(500, 'pm_1');

      expect(tx.type).toBe('deposit');
      expect(tx.amount).toBe(500);
      expect(tx.status).toBe('completed');
      expect(useFundingStore.getState().cashBalance).toBe(500);
    });

    it('should record deposit transaction', async () => {
      await useFundingStore.getState().simulateDeposit(1000, 'pm_1');

      const { transactions } = useFundingStore.getState();
      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe('deposit');
      expect(transactions[0].amount).toBe(1000);
    });
  });

  describe('simulateWithdraw', () => {
    beforeEach(() => {
      // Set up initial balance
      act(() => {
        useFundingStore.getState().setCashBalance(1000);
      });
    });

    it('should reduce cash balance on withdrawal', async () => {
      const tx = await useFundingStore.getState().simulateWithdraw(300, 'pm_1');

      expect(tx.type).toBe('withdraw');
      expect(tx.amount).toBe(300);
      expect(useFundingStore.getState().cashBalance).toBe(700);
    });

    it('should throw error when withdrawing more than balance', async () => {
      await expect(
        useFundingStore.getState().simulateWithdraw(2000, 'pm_1')
      ).rejects.toThrow('Insufficient funds');
    });

    it('should record withdrawal transaction', async () => {
      await useFundingStore.getState().simulateWithdraw(250, 'pm_1');

      const { transactions } = useFundingStore.getState();
      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe('withdraw');
    });
  });

  describe('addTransaction', () => {
    it('should add transaction to history', () => {
      act(() => {
        useFundingStore.getState().addTransaction({
          id: 'tx_test',
          type: 'deposit',
          amount: 100,
          status: 'completed',
          timestamp: new Date().toISOString(),
          reference: 'REF123',
        });
      });

      const { transactions } = useFundingStore.getState();
      expect(transactions.length).toBe(1);
      expect(transactions[0].id).toBe('tx_test');
    });

    it('should prepend new transactions (newest first)', () => {
      act(() => {
        useFundingStore.getState().addTransaction({
          id: 'tx_1',
          type: 'deposit',
          amount: 100,
          status: 'completed',
          timestamp: new Date().toISOString(),
          reference: 'REF1',
        });
      });

      act(() => {
        useFundingStore.getState().addTransaction({
          id: 'tx_2',
          type: 'withdraw',
          amount: 50,
          status: 'completed',
          timestamp: new Date().toISOString(),
          reference: 'REF2',
        });
      });

      const { transactions } = useFundingStore.getState();
      expect(transactions[0].id).toBe('tx_2'); // Most recent first
      expect(transactions[1].id).toBe('tx_1');
    });
  });
});
