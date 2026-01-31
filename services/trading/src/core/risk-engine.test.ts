// ============================================================================
// Risk Engine Unit Tests
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RiskEngine } from './risk-engine.js';
import type { Order } from '@k2/types';

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('RiskEngine', () => {
  let riskEngine: RiskEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    riskEngine = new RiskEngine(mockLogger as any);
  });

  describe('Order Size Check', () => {
    it('should pass when order size is within limits', async () => {
      const order = createMockOrder({
        quantity: '1',
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      expect(result.passed).toBe(true);
      const sizeCheck = result.checks.find((c) => c.name === 'order_size');
      expect(sizeCheck?.passed).toBe(true);
    });

    it('should fail when order size exceeds limit', async () => {
      const order = createMockOrder({
        quantity: '1000', // Exceeds default max of 100
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      expect(result.passed).toBe(false);
      const sizeCheck = result.checks.find((c) => c.name === 'order_size');
      expect(sizeCheck?.passed).toBe(false);
      expect(sizeCheck?.reason).toContain('exceeds limit');
    });

    it('should respect custom user limits', async () => {
      riskEngine.setUserLimits('user-custom', {
        maxOrderSize: '500',
        maxOrderNotional: '1000000',
        maxDailyVolume: '5000000',
        maxOpenOrders: 100,
        maxPositionSize: '10000000',
        velocityLimit: { maxOrdersPerMinute: 60, maxOrdersPerHour: 1000 },
      });

      const order = createMockOrder({
        quantity: '200', // Above default 100, but within custom 500
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-custom', order);

      const sizeCheck = result.checks.find((c) => c.name === 'order_size');
      expect(sizeCheck?.passed).toBe(true);
    });
  });

  describe('Notional Value Check', () => {
    it('should pass when notional is within limits', async () => {
      const order = createMockOrder({
        quantity: '0.1',
        price: '65000', // $6,500 notional
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      const notionalCheck = result.checks.find((c) => c.name === 'notional_value');
      expect(notionalCheck?.passed).toBe(true);
    });

    it('should fail when notional exceeds limit', async () => {
      const order = createMockOrder({
        quantity: '10',
        price: '65000', // $650,000 notional - exceeds $100,000 default
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      expect(result.passed).toBe(false);
      const notionalCheck = result.checks.find((c) => c.name === 'notional_value');
      expect(notionalCheck?.passed).toBe(false);
    });

    it('should use market price for market orders', async () => {
      const order = createMockOrder({
        quantity: '0.5',
        price: undefined, // Market order
        instrument: 'BTC-USD',
        type: 'market',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      // Should use cached BTC price (~65000) for calculation
      const notionalCheck = result.checks.find((c) => c.name === 'notional_value');
      expect(notionalCheck).toBeDefined();
    });
  });

  describe('Fat Finger Check', () => {
    it('should pass when price is close to market', async () => {
      const order = createMockOrder({
        quantity: '0.1',
        price: '65500', // Close to mock price of 65000
        instrument: 'BTC-USD',
        type: 'limit',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      const fatFingerCheck = result.checks.find((c) => c.name === 'fat_finger_price');
      expect(fatFingerCheck?.passed).toBe(true);
    });

    it('should fail when price deviates significantly from market', async () => {
      const order = createMockOrder({
        quantity: '0.1',
        price: '100000', // 54% above mock price of 65000
        instrument: 'BTC-USD',
        type: 'limit',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      expect(result.passed).toBe(false);
      const fatFingerCheck = result.checks.find((c) => c.name === 'fat_finger_price');
      expect(fatFingerCheck?.passed).toBe(false);
      expect(fatFingerCheck?.reason).toContain('deviates');
    });

    it('should skip fat finger check for market orders', async () => {
      const order = createMockOrder({
        quantity: '0.1',
        price: undefined,
        instrument: 'BTC-USD',
        type: 'market',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      // Fat finger check is only added for limit orders (when price exists)
      // For market orders, the check should not be present at all
      const fatFingerCheck = result.checks.find((c) => c.name === 'fat_finger_price');
      expect(fatFingerCheck).toBeUndefined();
      // Overall result should still pass
      expect(result.passed).toBe(true);
    });
  });

  describe('Velocity Check', () => {
    it('should pass when order rate is within limits', async () => {
      const order = createMockOrder({ instrument: 'BTC-USD' });

      const result = await riskEngine.checkOrder('user-1', order);

      const velocityCheck = result.checks.find((c) => c.name === 'velocity');
      expect(velocityCheck?.passed).toBe(true);
    });

    it('should track orders and enforce velocity limits', async () => {
      const order = createMockOrder({ instrument: 'BTC-USD' });

      // Simulate many rapid orders
      for (let i = 0; i < 35; i++) {
        riskEngine.recordOrderCreated('velocity-user', 1000 as any);
      }

      const result = await riskEngine.checkOrder('velocity-user', order);

      // Should fail velocity_minute check (default 30/min)
      const velocityCheck = result.checks.find(
        (c) => c.name === 'velocity_minute' || c.name === 'velocity'
      );
      expect(velocityCheck?.passed).toBe(false);
    });
  });

  describe('Open Orders Check', () => {
    it('should pass when open orders are within limits', async () => {
      const order = createMockOrder({ instrument: 'BTC-USD' });

      const result = await riskEngine.checkOrder('user-1', order);

      const openOrdersCheck = result.checks.find((c) => c.name === 'open_orders');
      expect(openOrdersCheck?.passed).toBe(true);
    });

    it('should fail when too many open orders', async () => {
      const order = createMockOrder({ instrument: 'BTC-USD' });

      // Simulate many open orders
      for (let i = 0; i < 55; i++) {
        riskEngine.recordOrderCreated('busy-user', 100 as any);
      }

      const result = await riskEngine.checkOrder('busy-user', order);

      const openOrdersCheck = result.checks.find((c) => c.name === 'open_orders');
      expect(openOrdersCheck?.passed).toBe(false);
    });

    it('should update count when orders are closed', async () => {
      const order = createMockOrder({ instrument: 'BTC-USD' });

      // Add and remove orders
      for (let i = 0; i < 60; i++) {
        riskEngine.recordOrderCreated('churn-user', 100 as any);
      }
      for (let i = 0; i < 20; i++) {
        riskEngine.recordOrderClosed('churn-user');
      }

      const result = await riskEngine.checkOrder('churn-user', order);

      // 60 - 20 = 40 open orders, within limit of 50
      const openOrdersCheck = result.checks.find((c) => c.name === 'open_orders');
      expect(openOrdersCheck?.passed).toBe(true);
    });
  });

  describe('Minimum Notional Check', () => {
    it('should pass when notional meets minimum', async () => {
      const order = createMockOrder({
        quantity: '0.001',
        price: '65000', // $65 notional
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      const minNotionalCheck = result.checks.find((c) => c.name === 'min_notional');
      expect(minNotionalCheck?.passed).toBe(true);
    });

    it('should fail when notional is below minimum', async () => {
      const order = createMockOrder({
        quantity: '0.00001',
        price: '65000', // $0.65 notional - below $1 minimum
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      const minNotionalCheck = result.checks.find((c) => c.name === 'min_notional');
      expect(minNotionalCheck?.passed).toBe(false);
    });
  });

  describe('Price Update', () => {
    it('should update cached prices', async () => {
      // Update price to a specific value
      const DecimalModule = await import('decimal.js');
      const Decimal = DecimalModule.default || DecimalModule;
      riskEngine.updatePrice('TEST-USD', new (Decimal as any)(123.45));

      // Create order with price that would fail fat-finger against 65000 but pass against 123.45
      const order = createMockOrder({
        quantity: '1',
        price: '125',
        instrument: 'TEST-USD',
        type: 'limit',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      const fatFingerCheck = result.checks.find((c) => c.name === 'fat_finger_price');
      expect(fatFingerCheck?.passed).toBe(true);
    });
  });

  describe('Combined Checks', () => {
    it('should pass all checks for valid order', async () => {
      const order = createMockOrder({
        quantity: '0.1',
        price: '65000',
        instrument: 'BTC-USD',
        type: 'limit',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      expect(result.passed).toBe(true);
      expect(result.checks.every((c) => c.passed)).toBe(true);
    });

    it('should fail if any critical check fails', async () => {
      const order = createMockOrder({
        quantity: '1000', // Exceeds size limit
        price: '65000',
        instrument: 'BTC-USD',
      });

      const result = await riskEngine.checkOrder('user-1', order);

      expect(result.passed).toBe(false);
      expect(result.checks.some((c) => !c.passed)).toBe(true);
    });

    it('should collect all failures, not just first', async () => {
      // Trigger multiple failures
      for (let i = 0; i < 35; i++) {
        riskEngine.recordOrderCreated('multi-fail-user', 1000 as any);
      }

      const order = createMockOrder({
        quantity: '1000', // Size limit
        price: '200000', // Fat finger
        instrument: 'BTC-USD',
        type: 'limit',
      });

      const result = await riskEngine.checkOrder('multi-fail-user', order);

      const failures = result.checks.filter((c) => !c.passed);
      expect(failures.length).toBeGreaterThan(1);
    });
  });
});

// Helper to create mock orders
function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-' + Math.random().toString(36).slice(2),
    clientOrderId: 'client-' + Math.random().toString(36).slice(2),
    userId: 'user-1',
    instrument: 'BTC-USD',
    exchange: 'cryptocom',
    side: 'buy',
    type: 'limit',
    status: 'pending',
    quantity: '1',
    filledQuantity: '0',
    remainingQuantity: '1',
    price: '65000',
    timeInForce: 'gtc',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fills: [],
    fees: '0',
    feeCurrency: 'USD',
    ...overrides,
  };
}
