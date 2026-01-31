// ============================================================================
// Risk Engine - Pre-trade and Position Risk Checks
// ============================================================================

import type { Logger } from 'pino';
import type { Order, RiskCheckResult, RiskCheck, RiskLimits } from '@k2/types';
import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.default || DecimalJS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecimalType = any;

// Default risk limits (can be customized per user)
const DEFAULT_RISK_LIMITS: RiskLimits = {
  maxOrderSize: '100',           // Max quantity per order
  maxOrderNotional: '100000',    // Max USD value per order
  maxDailyVolume: '500000',      // Max daily trading volume
  maxOpenOrders: 50,             // Max concurrent open orders
  maxPositionSize: '1000000',    // Max position value
  velocityLimit: {
    maxOrdersPerMinute: 30,
    maxOrdersPerHour: 500,
  },
};

// Fat-finger protection thresholds
const FAT_FINGER_THRESHOLDS = {
  maxPriceDeviationPercent: 5,   // Max % deviation from last price
  minNotional: 1,                 // Min order value in USD
  maxQuantityDigits: 8,           // Prevent accidental huge quantities
};

export class RiskEngine {
  private userLimits: Map<string, RiskLimits> = new Map();
  private orderVelocity: Map<string, number[]> = new Map(); // userId -> timestamps
  private openOrderCounts: Map<string, number> = new Map();
  private dailyVolumes: Map<string, DecimalType> = new Map();

  // Mock price cache (in production, pull from market data service)
  private priceCache: Map<string, DecimalType> = new Map();

  constructor(private logger: Logger) {
    // Initialize mock prices for common instruments
    this.initializeMockPrices();
  }

  /**
   * Run all pre-trade risk checks for an order
   */
  async checkOrder(userId: string, order: Order): Promise<RiskCheckResult> {
    const limits = this.getUserLimits(userId);
    const checks: RiskCheck[] = [];

    // 1. Order size check
    checks.push(this.checkOrderSize(order, limits));

    // 2. Notional value check
    checks.push(await this.checkNotionalValue(order, limits));

    // 3. Fat-finger price check (for limit orders)
    if (order.price) {
      checks.push(await this.checkFatFingerPrice(order));
    }

    // 4. Velocity check
    checks.push(this.checkVelocity(userId, limits));

    // 5. Open orders check
    checks.push(this.checkOpenOrders(userId, limits));

    // 6. Daily volume check
    checks.push(await this.checkDailyVolume(userId, order, limits));

    // 7. Minimum notional check
    checks.push(await this.checkMinNotional(order));

    const passed = checks.every((c) => c.passed);

    if (!passed) {
      this.logger.warn(
        { userId, orderId: order.id, failedChecks: checks.filter((c) => !c.passed) },
        'Order failed risk checks'
      );
    }

    return { passed, checks };
  }

  /**
   * Update state after order is created
   */
  recordOrderCreated(userId: string, notional: DecimalType): void {
    // Track velocity
    const now = Date.now();
    const timestamps = this.orderVelocity.get(userId) || [];
    timestamps.push(now);
    // Keep only last hour of timestamps
    const oneHourAgo = now - 3600000;
    this.orderVelocity.set(
      userId,
      timestamps.filter((t) => t > oneHourAgo)
    );

    // Track open orders
    const count = this.openOrderCounts.get(userId) || 0;
    this.openOrderCounts.set(userId, count + 1);

    // Track daily volume
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}:${today}`;
    const current = this.dailyVolumes.get(key) || new Decimal(0);
    this.dailyVolumes.set(key, current.plus(notional));
  }

  /**
   * Update state after order completes/cancels
   */
  recordOrderClosed(userId: string): void {
    const count = this.openOrderCounts.get(userId) || 1;
    this.openOrderCounts.set(userId, Math.max(0, count - 1));
  }

  /**
   * Set custom risk limits for a user
   */
  setUserLimits(userId: string, limits: Partial<RiskLimits>): void {
    const current = this.getUserLimits(userId);
    this.userLimits.set(userId, { ...current, ...limits });
  }

  /**
   * Update price cache (called by market data service)
   */
  updatePrice(instrument: string, price: DecimalType): void {
    this.priceCache.set(instrument, price);
  }

  // --------------------------------------------------------------------------
  // Individual Risk Checks
  // --------------------------------------------------------------------------

  private checkOrderSize(order: Order, limits: RiskLimits): RiskCheck {
    const quantity = new Decimal(order.quantity);
    const maxSize = new Decimal(limits.maxOrderSize);

    const passed = quantity.lte(maxSize);

    return {
      name: 'order_size',
      passed,
      reason: passed ? undefined : `Order size ${quantity} exceeds limit ${maxSize}`,
      limit: limits.maxOrderSize,
      actual: order.quantity,
    };
  }

  private async checkNotionalValue(order: Order, limits: RiskLimits): Promise<RiskCheck> {
    const price = order.price
      ? new Decimal(order.price)
      : this.priceCache.get(order.instrument) || new Decimal(0);

    const notional = new Decimal(order.quantity).times(price);
    const maxNotional = new Decimal(limits.maxOrderNotional);

    const passed = notional.lte(maxNotional);

    return {
      name: 'notional_value',
      passed,
      reason: passed ? undefined : `Order notional $${notional.toFixed(2)} exceeds limit $${maxNotional}`,
      limit: limits.maxOrderNotional,
      actual: notional.toString(),
    };
  }

  private async checkFatFingerPrice(order: Order): Promise<RiskCheck> {
    if (!order.price) {
      return { name: 'fat_finger_price', passed: true };
    }

    const lastPrice = this.priceCache.get(order.instrument);
    if (!lastPrice || lastPrice.isZero()) {
      // Can't validate without market price, allow it
      return { name: 'fat_finger_price', passed: true };
    }

    const orderPrice = new Decimal(order.price);
    const deviation = orderPrice.minus(lastPrice).abs().div(lastPrice).times(100);
    const maxDeviation = FAT_FINGER_THRESHOLDS.maxPriceDeviationPercent;

    const passed = deviation.lte(maxDeviation);

    return {
      name: 'fat_finger_price',
      passed,
      reason: passed
        ? undefined
        : `Price ${orderPrice} deviates ${deviation.toFixed(2)}% from market price ${lastPrice} (max ${maxDeviation}%)`,
      limit: maxDeviation.toString(),
      actual: deviation.toString(),
    };
  }

  private checkVelocity(userId: string, limits: RiskLimits): RiskCheck {
    const now = Date.now();
    const timestamps = this.orderVelocity.get(userId) || [];

    // Check orders per minute
    const oneMinuteAgo = now - 60000;
    const ordersLastMinute = timestamps.filter((t) => t > oneMinuteAgo).length;

    if (ordersLastMinute >= limits.velocityLimit.maxOrdersPerMinute) {
      return {
        name: 'velocity_minute',
        passed: false,
        reason: `${ordersLastMinute} orders in last minute exceeds limit ${limits.velocityLimit.maxOrdersPerMinute}`,
        limit: limits.velocityLimit.maxOrdersPerMinute.toString(),
        actual: ordersLastMinute.toString(),
      };
    }

    // Check orders per hour
    const oneHourAgo = now - 3600000;
    const ordersLastHour = timestamps.filter((t) => t > oneHourAgo).length;

    if (ordersLastHour >= limits.velocityLimit.maxOrdersPerHour) {
      return {
        name: 'velocity_hour',
        passed: false,
        reason: `${ordersLastHour} orders in last hour exceeds limit ${limits.velocityLimit.maxOrdersPerHour}`,
        limit: limits.velocityLimit.maxOrdersPerHour.toString(),
        actual: ordersLastHour.toString(),
      };
    }

    return { name: 'velocity', passed: true };
  }

  private checkOpenOrders(userId: string, limits: RiskLimits): RiskCheck {
    const count = this.openOrderCounts.get(userId) || 0;
    const passed = count < limits.maxOpenOrders;

    return {
      name: 'open_orders',
      passed,
      reason: passed ? undefined : `${count} open orders, limit is ${limits.maxOpenOrders}`,
      limit: limits.maxOpenOrders.toString(),
      actual: count.toString(),
    };
  }

  private async checkDailyVolume(
    userId: string,
    order: Order,
    limits: RiskLimits
  ): Promise<RiskCheck> {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}:${today}`;
    const currentVolume = this.dailyVolumes.get(key) || new Decimal(0);

    const price = order.price
      ? new Decimal(order.price)
      : this.priceCache.get(order.instrument) || new Decimal(0);

    const orderNotional = new Decimal(order.quantity).times(price);
    const newTotal = currentVolume.plus(orderNotional);
    const maxDaily = new Decimal(limits.maxDailyVolume);

    const passed = newTotal.lte(maxDaily);

    return {
      name: 'daily_volume',
      passed,
      reason: passed
        ? undefined
        : `Daily volume would be $${newTotal.toFixed(2)}, limit is $${maxDaily}`,
      limit: limits.maxDailyVolume,
      actual: newTotal.toString(),
    };
  }

  private async checkMinNotional(order: Order): Promise<RiskCheck> {
    const price = order.price
      ? new Decimal(order.price)
      : this.priceCache.get(order.instrument) || new Decimal(0);

    const notional = new Decimal(order.quantity).times(price);
    const minNotional = FAT_FINGER_THRESHOLDS.minNotional;

    const passed = notional.gte(minNotional);

    return {
      name: 'min_notional',
      passed,
      reason: passed ? undefined : `Order notional $${notional.toFixed(2)} below minimum $${minNotional}`,
      limit: minNotional.toString(),
      actual: notional.toString(),
    };
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private getUserLimits(userId: string): RiskLimits {
    return this.userLimits.get(userId) || DEFAULT_RISK_LIMITS;
  }

  private initializeMockPrices(): void {
    // Initialize with realistic mock prices
    this.priceCache.set('BTC-USD', new Decimal('65000'));
    this.priceCache.set('ETH-USD', new Decimal('3500'));
    this.priceCache.set('SOL-USD', new Decimal('150'));
    this.priceCache.set('DOGE-USD', new Decimal('0.15'));
    this.priceCache.set('XRP-USD', new Decimal('0.55'));
    this.priceCache.set('ADA-USD', new Decimal('0.60'));
    this.priceCache.set('AVAX-USD', new Decimal('40'));
    this.priceCache.set('DOT-USD', new Decimal('8'));
    this.priceCache.set('MATIC-USD', new Decimal('0.90'));
    this.priceCache.set('LINK-USD', new Decimal('18'));

    // Event contract mock prices (in cents, 0-100)
    this.priceCache.set('KXBTC-24DEC31-B100000', new Decimal('0.45')); // 45 cents = 45% probability
    this.priceCache.set('KXETH-24DEC31-B5000', new Decimal('0.62'));
  }
}
