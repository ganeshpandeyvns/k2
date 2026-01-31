// ============================================================================
// Order Management System (OMS)
// ============================================================================

import { v4 as uuid } from 'uuid';
import type { Redis } from 'ioredis';
import type { Logger } from 'pino';
import type {
  Order,
  OrderStatus,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  Fill,
  RiskCheckResult,
} from '@k2/types';
import type { ExchangeRouter } from './exchange-router.js';
import type { RiskEngine } from './risk-engine.js';

// Order state machine transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['submitted', 'rejected', 'cancelled'],
  submitted: ['open', 'filled', 'partial', 'rejected', 'cancelled'],
  open: ['partial', 'filled', 'cancelled', 'expired'],
  partial: ['filled', 'cancelled', 'expired'],
  filled: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: [], // Terminal state
  expired: [], // Terminal state
};

export class OrderManager {
  private orders: Map<string, Order> = new Map();
  private ordersByClientId: Map<string, string> = new Map();
  private orderUpdateCallbacks: Map<string, (order: Order) => void> = new Map();

  constructor(
    private exchangeRouter: ExchangeRouter,
    private riskEngine: RiskEngine,
    private redis: Redis,
    private logger: Logger
  ) {}

  /**
   * Create and submit a new order
   */
  async createOrder(
    userId: string,
    request: CreateOrderRequest
  ): Promise<CreateOrderResponse> {
    const orderId = uuid();
    const now = new Date().toISOString();

    // Check for duplicate client order ID
    if (this.ordersByClientId.has(request.clientOrderId)) {
      throw new OrderError('DUPLICATE_CLIENT_ORDER_ID', 'Client order ID already exists');
    }

    // Determine exchange based on instrument
    const exchange = this.determineExchange(request.instrument);

    // Create order object
    const order: Order = {
      id: orderId,
      clientOrderId: request.clientOrderId,
      userId,
      instrument: request.instrument,
      exchange,
      side: request.side,
      type: request.type,
      status: 'pending',
      quantity: request.quantity,
      filledQuantity: '0',
      remainingQuantity: request.quantity,
      price: request.price,
      timeInForce: request.timeInForce || 'gtc',
      createdAt: now,
      updatedAt: now,
      fills: [],
      fees: '0',
      feeCurrency: 'USD',
    };

    // Run pre-trade risk checks
    const riskResult = await this.riskEngine.checkOrder(userId, order);
    if (!riskResult.passed) {
      order.status = 'rejected';
      order.rejectReason = this.formatRiskRejectReason(riskResult);
      this.storeOrder(order);

      this.logger.warn({ orderId, riskResult }, 'Order rejected by risk engine');

      return {
        orderId,
        clientOrderId: request.clientOrderId,
        status: 'rejected',
        createdAt: now,
      };
    }

    // Store order
    this.storeOrder(order);

    // Submit to exchange asynchronously
    this.submitToExchange(order).catch((err) => {
      this.logger.error({ orderId, err }, 'Failed to submit order to exchange');
    });

    this.logger.info({ orderId, instrument: order.instrument, side: order.side }, 'Order created');

    return {
      orderId,
      clientOrderId: request.clientOrderId,
      status: 'pending',
      createdAt: now,
    };
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(
    userId: string,
    request: CancelOrderRequest
  ): Promise<CancelOrderResponse> {
    const order = this.orders.get(request.orderId);

    if (!order) {
      throw new OrderError('ORDER_NOT_FOUND', 'Order not found');
    }

    if (order.userId !== userId) {
      throw new OrderError('UNAUTHORIZED', 'Not authorized to cancel this order');
    }

    if (!this.canTransitionTo(order.status, 'cancelled')) {
      throw new OrderError(
        'INVALID_STATE',
        `Cannot cancel order in ${order.status} status`
      );
    }

    // Send cancel to exchange
    try {
      await this.exchangeRouter.cancelOrder(order.exchange, {
        orderId: order.externalOrderId || order.id,
      });
    } catch (err) {
      // If exchange says order is already done, that's fine
      this.logger.warn({ orderId: order.id, err }, 'Cancel request failed');
    }

    // Update local state
    this.updateOrderStatus(order.id, 'cancelled');

    return {
      orderId: order.id,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    };
  }

  /**
   * Get an order by ID
   */
  getOrder(userId: string, orderId: string): Order | undefined {
    const order = this.orders.get(orderId);
    if (order && order.userId === userId) {
      return order;
    }
    return undefined;
  }

  /**
   * Get all orders for a user
   */
  getOrders(userId: string, filters?: OrderFilters): Order[] {
    const orders = Array.from(this.orders.values())
      .filter((o) => o.userId === userId)
      .filter((o) => !filters?.status || filters.status.includes(o.status))
      .filter((o) => !filters?.instrument || o.instrument === filters.instrument)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return orders.slice(0, filters?.limit || 100);
  }

  /**
   * Register callback for order updates
   */
  onOrderUpdate(userId: string, callback: (order: Order) => void): void {
    this.orderUpdateCallbacks.set(userId, callback);
  }

  /**
   * Remove order update callback
   */
  offOrderUpdate(userId: string): void {
    this.orderUpdateCallbacks.delete(userId);
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private determineExchange(instrument: string): 'cryptocom' | 'kalshi' {
    // Kalshi instruments start with "KX" or have specific event format
    if (instrument.startsWith('KX') || instrument.includes('-B') || instrument.includes('-YES') || instrument.includes('-NO')) {
      return 'kalshi';
    }
    return 'cryptocom';
  }

  private storeOrder(order: Order): void {
    this.orders.set(order.id, order);
    this.ordersByClientId.set(order.clientOrderId, order.id);

    // Persist to Redis for recovery
    this.redis.set(`order:${order.id}`, JSON.stringify(order), 'EX', 86400 * 7).catch(() => {});
  }

  private async submitToExchange(order: Order): Promise<void> {
    try {
      this.updateOrderStatus(order.id, 'submitted');

      const response = await this.exchangeRouter.submitOrder(order.exchange, {
        clientOrderId: order.clientOrderId,
        instrument: order.instrument,
        side: order.side,
        type: order.type,
        quantity: order.quantity,
        price: order.price,
        timeInForce: order.timeInForce,
      });

      // Update with external order ID
      const updated = this.orders.get(order.id);
      if (updated) {
        updated.externalOrderId = response.orderId;
        updated.status = response.status;
        updated.updatedAt = new Date().toISOString();
        this.notifyOrderUpdate(updated);
      }

      this.logger.info(
        { orderId: order.id, externalOrderId: response.orderId },
        'Order submitted to exchange'
      );
    } catch (err: any) {
      this.updateOrderStatus(order.id, 'rejected', err.message);
      throw err;
    }
  }

  private updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    rejectReason?: string
  ): void {
    const order = this.orders.get(orderId);
    if (!order) return;

    if (!this.canTransitionTo(order.status, status)) {
      this.logger.warn(
        { orderId, from: order.status, to: status },
        'Invalid order state transition'
      );
      return;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (rejectReason) {
      order.rejectReason = rejectReason;
    }

    this.storeOrder(order);
    this.notifyOrderUpdate(order);
  }

  /**
   * Process a fill from the exchange
   */
  processFill(orderId: string, fill: Omit<Fill, 'id' | 'orderId'>): void {
    const order = this.orders.get(orderId);
    if (!order) {
      this.logger.warn({ orderId }, 'Received fill for unknown order');
      return;
    }

    const fullFill: Fill = {
      id: uuid(),
      orderId,
      ...fill,
    };

    order.fills.push(fullFill);

    // Update quantities
    const filledQty = parseFloat(order.filledQuantity) + parseFloat(fill.quantity);
    order.filledQuantity = filledQty.toString();
    order.remainingQuantity = (parseFloat(order.quantity) - filledQty).toString();

    // Calculate average fill price
    const totalValue = order.fills.reduce(
      (sum, f) => sum + parseFloat(f.price) * parseFloat(f.quantity),
      0
    );
    order.avgFillPrice = (totalValue / filledQty).toFixed(8);

    // Update fees
    const totalFees = order.fills.reduce((sum, f) => sum + parseFloat(f.fee), 0);
    order.fees = totalFees.toString();

    // Update status
    if (parseFloat(order.remainingQuantity) === 0) {
      order.status = 'filled';
    } else {
      order.status = 'partial';
    }

    order.updatedAt = new Date().toISOString();
    this.storeOrder(order);
    this.notifyOrderUpdate(order);

    this.logger.info(
      {
        orderId,
        fillPrice: fill.price,
        fillQty: fill.quantity,
        filledQty: order.filledQuantity,
        status: order.status,
      },
      'Order fill processed'
    );
  }

  private canTransitionTo(current: OrderStatus, next: OrderStatus): boolean {
    return VALID_TRANSITIONS[current]?.includes(next) ?? false;
  }

  private formatRiskRejectReason(result: RiskCheckResult): string {
    const failed = result.checks.filter((c) => !c.passed);
    return failed.map((c) => c.reason).join('; ');
  }

  private notifyOrderUpdate(order: Order): void {
    const callback = this.orderUpdateCallbacks.get(order.userId);
    if (callback) {
      callback({ ...order });
    }

    // Publish to Redis for other services
    this.redis
      .publish('order:updates', JSON.stringify(order))
      .catch(() => {});
  }
}

// --------------------------------------------------------------------------
// Supporting Types
// --------------------------------------------------------------------------

interface OrderFilters {
  status?: OrderStatus[];
  instrument?: string;
  limit?: number;
}

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'OrderError';
  }
}
