// ============================================================================
// Order Manager Unit Tests
// ============================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OrderManager, OrderError } from './order-manager.js';
import type { CreateOrderRequest, Order, RiskCheckResult } from '@k2/types';

// Mock dependencies
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

const mockRedis = {
  set: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue(null),
  publish: vi.fn().mockResolvedValue(1),
};

const mockRiskEngine = {
  checkOrder: vi.fn(),
  recordOrderCreated: vi.fn(),
  recordOrderClosed: vi.fn(),
};

const mockExchangeRouter = {
  submitOrder: vi.fn(),
  cancelOrder: vi.fn(),
  getOrder: vi.fn(),
};

describe('OrderManager', () => {
  let orderManager: OrderManager;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementations
    mockRiskEngine.checkOrder.mockResolvedValue({
      passed: true,
      checks: [{ name: 'test', passed: true }],
    } as RiskCheckResult);

    mockExchangeRouter.submitOrder.mockResolvedValue({
      orderId: 'exchange-order-123',
      clientOrderId: 'client-123',
      status: 'open',
      createdAt: new Date().toISOString(),
    });

    orderManager = new OrderManager(
      mockExchangeRouter as any,
      mockRiskEngine as any,
      mockRedis as any,
      mockLogger as any
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createOrder', () => {
    it('should create a new order successfully', async () => {
      const request: CreateOrderRequest = {
        clientOrderId: 'client-123',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      };

      const response = await orderManager.createOrder('user-1', request);

      expect(response.clientOrderId).toBe('client-123');
      expect(response.status).toBe('pending');
      expect(response.orderId).toBeDefined();
      expect(mockRiskEngine.checkOrder).toHaveBeenCalled();
    });

    it('should reject duplicate client order IDs', async () => {
      const request: CreateOrderRequest = {
        clientOrderId: 'duplicate-id',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      };

      // First order succeeds
      await orderManager.createOrder('user-1', request);

      // Second order with same client ID should fail
      await expect(orderManager.createOrder('user-1', request)).rejects.toThrow(
        'Client order ID already exists'
      );
    });

    it('should reject order when risk check fails', async () => {
      mockRiskEngine.checkOrder.mockResolvedValue({
        passed: false,
        checks: [
          { name: 'order_size', passed: false, reason: 'Order too large' },
        ],
      } as RiskCheckResult);

      const request: CreateOrderRequest = {
        clientOrderId: 'risky-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '1000',
      };

      const response = await orderManager.createOrder('user-1', request);

      expect(response.status).toBe('rejected');
      expect(mockExchangeRouter.submitOrder).not.toHaveBeenCalled();
    });

    it('should route crypto orders to cryptocom', async () => {
      const request: CreateOrderRequest = {
        clientOrderId: 'crypto-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      };

      await orderManager.createOrder('user-1', request);

      // Let async submission happen
      await vi.advanceTimersByTimeAsync(100);

      expect(mockExchangeRouter.submitOrder).toHaveBeenCalledWith(
        'cryptocom',
        expect.objectContaining({ instrument: 'BTC-USD' })
      );
    });

    it('should route event orders to kalshi', async () => {
      const request: CreateOrderRequest = {
        clientOrderId: 'event-order',
        instrument: 'KXBTC-25DEC31-B100000',
        side: 'buy',
        type: 'market',
        quantity: '10',
      };

      await orderManager.createOrder('user-1', request);

      await vi.advanceTimersByTimeAsync(100);

      expect(mockExchangeRouter.submitOrder).toHaveBeenCalledWith(
        'kalshi',
        expect.objectContaining({ instrument: 'KXBTC-25DEC31-B100000' })
      );
    });

    it('should persist order to Redis', async () => {
      const request: CreateOrderRequest = {
        clientOrderId: 'persist-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      };

      await orderManager.createOrder('user-1', request);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('order:'),
        expect.any(String),
        'EX',
        expect.any(Number)
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an open order', async () => {
      // Create an order first
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'cancel-me',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: '0.1',
        price: '50000',
      });

      // Simulate order becoming open
      await vi.advanceTimersByTimeAsync(200);

      mockExchangeRouter.cancelOrder.mockResolvedValue({
        orderId: createResponse.orderId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      });

      const cancelResponse = await orderManager.cancelOrder('user-1', {
        orderId: createResponse.orderId,
      });

      expect(cancelResponse.status).toBe('cancelled');
    });

    it('should reject cancel for non-existent order', async () => {
      await expect(
        orderManager.cancelOrder('user-1', { orderId: 'non-existent' })
      ).rejects.toThrow('Order not found');
    });

    it('should reject cancel for another users order', async () => {
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'user1-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      await expect(
        orderManager.cancelOrder('user-2', { orderId: createResponse.orderId })
      ).rejects.toThrow('Not authorized');
    });

    it('should reject cancel for already filled order', async () => {
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'filled-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      // Simulate fill
      await vi.advanceTimersByTimeAsync(200);
      orderManager.processFill(createResponse.orderId, {
        price: '65000',
        quantity: '0.1',
        fee: '0.65',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      await expect(
        orderManager.cancelOrder('user-1', { orderId: createResponse.orderId })
      ).rejects.toThrow('Cannot cancel order in filled status');
    });
  });

  describe('getOrder', () => {
    it('should return order for owner', async () => {
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'get-order-test',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      const order = orderManager.getOrder('user-1', createResponse.orderId);

      expect(order).toBeDefined();
      expect(order?.clientOrderId).toBe('get-order-test');
    });

    it('should return undefined for non-owner', async () => {
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'private-order',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      const order = orderManager.getOrder('user-2', createResponse.orderId);

      expect(order).toBeUndefined();
    });

    it('should return undefined for non-existent order', () => {
      const order = orderManager.getOrder('user-1', 'non-existent');

      expect(order).toBeUndefined();
    });
  });

  describe('getOrders', () => {
    beforeEach(async () => {
      // Create several orders
      await orderManager.createOrder('user-1', {
        clientOrderId: 'order-1',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      await orderManager.createOrder('user-1', {
        clientOrderId: 'order-2',
        instrument: 'ETH-USD',
        side: 'sell',
        type: 'limit',
        quantity: '1',
        price: '3500',
      });

      await orderManager.createOrder('user-2', {
        clientOrderId: 'order-3',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.5',
      });
    });

    it('should return only users orders', () => {
      const orders = orderManager.getOrders('user-1');

      expect(orders.length).toBe(2);
      expect(orders.every((o) => o.userId === 'user-1')).toBe(true);
    });

    it('should filter by status', () => {
      const orders = orderManager.getOrders('user-1', { status: ['pending'] });

      expect(orders.every((o) => o.status === 'pending')).toBe(true);
    });

    it('should filter by instrument', () => {
      const orders = orderManager.getOrders('user-1', { instrument: 'BTC-USD' });

      expect(orders.every((o) => o.instrument === 'BTC-USD')).toBe(true);
    });

    it('should respect limit parameter', () => {
      const orders = orderManager.getOrders('user-1', { limit: 1 });

      expect(orders.length).toBe(1);
    });

    it('should sort by creation time descending', async () => {
      await vi.advanceTimersByTimeAsync(1000);

      await orderManager.createOrder('user-1', {
        clientOrderId: 'order-newest',
        instrument: 'SOL-USD',
        side: 'buy',
        type: 'market',
        quantity: '10',
      });

      const orders = orderManager.getOrders('user-1');

      expect(orders[0].clientOrderId).toBe('order-newest');
    });
  });

  describe('processFill', () => {
    it('should update order with fill details', async () => {
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'fill-test',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      orderManager.processFill(createResponse.orderId, {
        price: '65000',
        quantity: '0.1',
        fee: '1.30',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      const order = orderManager.getOrder('user-1', createResponse.orderId);

      expect(order?.status).toBe('filled');
      expect(order?.filledQuantity).toBe('0.1');
      expect(order?.remainingQuantity).toBe('0');
      expect(order?.avgFillPrice).toBe('65000.00000000');
      expect(order?.fees).toBe('1.3');
      expect(order?.fills.length).toBe(1);
    });

    it('should handle partial fills', async () => {
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'partial-fill',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: '1',
        price: '65000',
      });

      // First partial fill
      orderManager.processFill(createResponse.orderId, {
        price: '65000',
        quantity: '0.3',
        fee: '3.90',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      let order = orderManager.getOrder('user-1', createResponse.orderId);
      expect(order?.status).toBe('partial');
      expect(order?.filledQuantity).toBe('0.3');
      expect(order?.remainingQuantity).toBe('0.7');

      // Second partial fill
      orderManager.processFill(createResponse.orderId, {
        price: '64900',
        quantity: '0.7',
        fee: '9.09',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      order = orderManager.getOrder('user-1', createResponse.orderId);
      expect(order?.status).toBe('filled');
      expect(order?.filledQuantity).toBe('1');
      expect(order?.remainingQuantity).toBe('0');
      expect(order?.fills.length).toBe(2);

      // Check weighted average price
      // (0.3 * 65000 + 0.7 * 64900) / 1 = 64930
      expect(parseFloat(order?.avgFillPrice || '0')).toBeCloseTo(64930, 0);
    });

    it('should ignore fills for unknown orders', () => {
      // Should not throw
      orderManager.processFill('unknown-order', {
        price: '65000',
        quantity: '0.1',
        fee: '1.30',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ orderId: 'unknown-order' }),
        'Received fill for unknown order'
      );
    });
  });

  describe('Order Update Callbacks', () => {
    it('should notify on order updates', async () => {
      const callback = vi.fn();
      orderManager.onOrderUpdate('user-1', callback);

      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'callback-test',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      // Let async operations complete
      await vi.advanceTimersByTimeAsync(200);

      // Process a fill which should trigger callback
      orderManager.processFill(createResponse.orderId, {
        price: '65000',
        quantity: '0.1',
        fee: '1.30',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'filled' })
      );
    });

    it('should remove callback on offOrderUpdate', async () => {
      const callback = vi.fn();
      orderManager.onOrderUpdate('user-1', callback);
      orderManager.offOrderUpdate('user-1');

      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'no-callback',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: '0.1',
      });

      orderManager.processFill(createResponse.orderId, {
        price: '65000',
        quantity: '0.1',
        fee: '1.30',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      // Callback should not be called after removal
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Order State Machine', () => {
    it('should allow valid state transitions', async () => {
      const createResponse = await orderManager.createOrder('user-1', {
        clientOrderId: 'state-test',
        instrument: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: '0.1',
        price: '65000',
      });

      // Allow async submitToExchange to complete
      await vi.advanceTimersByTimeAsync(50);

      let order = orderManager.getOrder('user-1', createResponse.orderId);
      // Order transitions quickly from pending -> submitted -> open
      expect(['submitted', 'open']).toContain(order?.status);

      // Let order be fully submitted
      await vi.advanceTimersByTimeAsync(200);

      // Process partial fill
      orderManager.processFill(createResponse.orderId, {
        price: '65000',
        quantity: '0.05',
        fee: '0.65',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      order = orderManager.getOrder('user-1', createResponse.orderId);
      expect(order?.status).toBe('partial');

      // Complete fill
      orderManager.processFill(createResponse.orderId, {
        price: '65000',
        quantity: '0.05',
        fee: '0.65',
        feeCurrency: 'USD',
        side: 'buy',
        timestamp: new Date().toISOString(),
      });

      order = orderManager.getOrder('user-1', createResponse.orderId);
      expect(order?.status).toBe('filled');
    });
  });
});
