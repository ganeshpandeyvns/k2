// ============================================================================
// Trading Utilities Tests - Dollar Amount Order Calculations
// ============================================================================

import {
  calculateQuantityFromDollars,
  calculateDollarsFromQuantity,
  formatQuantity,
  validateDollarAmount,
  validateQuantity,
  hasSufficientCashBalance,
  hasSufficientHoldings,
  isLargeOrder,
  getEffectiveOrderType,
  isLimitOrderAllowed,
  calculateOrderDetails,
  sanitizeNumericInput,
  generateOrderConfirmationMessage,
} from '../../src/utils/trading';

describe('Trading Utilities', () => {
  // ==========================================================================
  // Dollar to Quantity Calculation
  // ==========================================================================
  describe('calculateQuantityFromDollars', () => {
    it('should calculate correct quantity for valid inputs', () => {
      // $100 at $50,000/BTC = 0.002 BTC
      expect(calculateQuantityFromDollars(100, 50000)).toBe(0.002);

      // $500 at $3,500/ETH = ~0.1428 ETH
      expect(calculateQuantityFromDollars(500, 3500)).toBeCloseTo(0.142857, 5);

      // $1000 at $100/SOL = 10 SOL
      expect(calculateQuantityFromDollars(1000, 100)).toBe(10);
    });

    it('should handle small dollar amounts', () => {
      // $1 at $67,000/BTC
      const qty = calculateQuantityFromDollars(1, 67000);
      expect(qty).toBeCloseTo(0.0000149, 6);
    });

    it('should handle large dollar amounts', () => {
      // $100,000 at $50,000/BTC = 2 BTC
      expect(calculateQuantityFromDollars(100000, 50000)).toBe(2);
    });

    it('should return 0 for zero price', () => {
      expect(calculateQuantityFromDollars(100, 0)).toBe(0);
    });

    it('should return 0 for negative price', () => {
      expect(calculateQuantityFromDollars(100, -50000)).toBe(0);
    });

    it('should return 0 for zero dollar amount', () => {
      expect(calculateQuantityFromDollars(0, 50000)).toBe(0);
    });

    it('should return 0 for negative dollar amount', () => {
      expect(calculateQuantityFromDollars(-100, 50000)).toBe(0);
    });

    it('should handle fractional dollar amounts', () => {
      // $50.50 at $100/unit = 0.505
      expect(calculateQuantityFromDollars(50.5, 100)).toBe(0.505);
    });

    it('should handle very small prices (meme coins)', () => {
      // $10 at $0.0001/SHIB = 100,000 SHIB
      expect(calculateQuantityFromDollars(10, 0.0001)).toBe(100000);
    });
  });

  // ==========================================================================
  // Quantity to Dollar Calculation
  // ==========================================================================
  describe('calculateDollarsFromQuantity', () => {
    it('should calculate correct dollar amount', () => {
      // 0.5 BTC at $60,000 = $30,000
      expect(calculateDollarsFromQuantity(0.5, 60000)).toBe(30000);

      // 10 ETH at $3,500 = $35,000
      expect(calculateDollarsFromQuantity(10, 3500)).toBe(35000);
    });

    it('should handle small quantities', () => {
      // 0.001 BTC at $60,000 = $60
      expect(calculateDollarsFromQuantity(0.001, 60000)).toBe(60);
    });

    it('should return 0 for zero quantity', () => {
      expect(calculateDollarsFromQuantity(0, 60000)).toBe(0);
    });

    it('should return 0 for negative quantity', () => {
      expect(calculateDollarsFromQuantity(-1, 60000)).toBe(0);
    });

    it('should return 0 for zero price', () => {
      expect(calculateDollarsFromQuantity(1, 0)).toBe(0);
    });
  });

  // ==========================================================================
  // Quantity Formatting
  // ==========================================================================
  describe('formatQuantity', () => {
    it('should remove trailing zeros', () => {
      expect(formatQuantity(0.5)).toBe('0.5');
      expect(formatQuantity(1.0)).toBe('1');
      expect(formatQuantity(0.00100000)).toBe('0.001');
    });

    it('should handle whole numbers', () => {
      expect(formatQuantity(10)).toBe('10');
      expect(formatQuantity(100)).toBe('100');
    });

    it('should respect decimal limit', () => {
      expect(formatQuantity(0.123456789, 6)).toBe('0.123457'); // rounded
      expect(formatQuantity(0.123456789, 4)).toBe('0.1235');
    });

    it('should handle very small numbers', () => {
      expect(formatQuantity(0.00000001, 8)).toBe('0.00000001');
    });

    it('should handle zero', () => {
      expect(formatQuantity(0)).toBe('0');
    });
  });

  // ==========================================================================
  // Dollar Amount Validation
  // ==========================================================================
  describe('validateDollarAmount', () => {
    it('should accept valid dollar amounts', () => {
      expect(validateDollarAmount('100')).toEqual({
        valid: true,
        value: 100,
      });

      expect(validateDollarAmount('1.50')).toEqual({
        valid: true,
        value: 1.5,
      });

      expect(validateDollarAmount('10000')).toEqual({
        valid: true,
        value: 10000,
      });
    });

    it('should reject empty input', () => {
      const result = validateDollarAmount('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a dollar amount');
    });

    it('should reject whitespace-only input', () => {
      const result = validateDollarAmount('   ');
      expect(result.valid).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = validateDollarAmount('0');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid dollar amount');
    });

    it('should reject amounts below $1 minimum', () => {
      const result = validateDollarAmount('0.99');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Minimum order is $1.00');
      expect(result.value).toBe(0.99);
    });

    it('should accept exactly $1', () => {
      const result = validateDollarAmount('1');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });

    it('should handle invalid string input', () => {
      const result = validateDollarAmount('abc');
      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
    });
  });

  // ==========================================================================
  // Quantity Validation
  // ==========================================================================
  describe('validateQuantity', () => {
    it('should accept valid quantities', () => {
      expect(validateQuantity('0.5')).toEqual({
        valid: true,
        value: 0.5,
      });

      expect(validateQuantity('10')).toEqual({
        valid: true,
        value: 10,
      });
    });

    it('should reject empty input', () => {
      const result = validateQuantity('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a quantity');
    });

    it('should reject zero quantity', () => {
      const result = validateQuantity('0');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid quantity');
    });

    it('should accept very small quantities', () => {
      const result = validateQuantity('0.00000001');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(0.00000001);
    });
  });

  // ==========================================================================
  // Balance Checks
  // ==========================================================================
  describe('hasSufficientCashBalance', () => {
    it('should return true when balance is sufficient', () => {
      expect(hasSufficientCashBalance(100, 500)).toBe(true);
      expect(hasSufficientCashBalance(500, 500)).toBe(true); // exact amount
    });

    it('should return false when balance is insufficient', () => {
      expect(hasSufficientCashBalance(600, 500)).toBe(false);
      expect(hasSufficientCashBalance(500.01, 500)).toBe(false);
    });

    it('should handle zero balance', () => {
      expect(hasSufficientCashBalance(1, 0)).toBe(false);
      expect(hasSufficientCashBalance(0, 0)).toBe(true);
    });
  });

  describe('hasSufficientHoldings', () => {
    it('should return true when holdings are sufficient', () => {
      expect(hasSufficientHoldings(0.5, 1)).toBe(true);
      expect(hasSufficientHoldings(1, 1)).toBe(true); // exact amount
    });

    it('should return false when holdings are insufficient', () => {
      expect(hasSufficientHoldings(1.5, 1)).toBe(false);
      expect(hasSufficientHoldings(0.00000002, 0.00000001)).toBe(false);
    });
  });

  // ==========================================================================
  // Large Order Detection
  // ==========================================================================
  describe('isLargeOrder', () => {
    it('should detect orders over default threshold ($1000)', () => {
      expect(isLargeOrder(1001)).toBe(true);
      expect(isLargeOrder(5000)).toBe(true);
    });

    it('should not flag orders at or below threshold', () => {
      expect(isLargeOrder(1000)).toBe(false);
      expect(isLargeOrder(999)).toBe(false);
      expect(isLargeOrder(100)).toBe(false);
    });

    it('should respect custom threshold', () => {
      expect(isLargeOrder(501, 500)).toBe(true);
      expect(isLargeOrder(500, 500)).toBe(false);
      expect(isLargeOrder(10001, 10000)).toBe(true);
    });
  });

  // ==========================================================================
  // Order Type Enforcement
  // ==========================================================================
  describe('getEffectiveOrderType', () => {
    it('should force market order for dollar input mode', () => {
      expect(getEffectiveOrderType('dollars', 'limit')).toBe('market');
      expect(getEffectiveOrderType('dollars', 'market')).toBe('market');
    });

    it('should respect selected order type for shares mode', () => {
      expect(getEffectiveOrderType('shares', 'limit')).toBe('limit');
      expect(getEffectiveOrderType('shares', 'market')).toBe('market');
    });
  });

  describe('isLimitOrderAllowed', () => {
    it('should disallow limit orders in dollar mode', () => {
      expect(isLimitOrderAllowed('dollars')).toBe(false);
    });

    it('should allow limit orders in shares mode', () => {
      expect(isLimitOrderAllowed('shares')).toBe(true);
    });
  });

  // ==========================================================================
  // Order Details Calculation
  // ==========================================================================
  describe('calculateOrderDetails', () => {
    it('should calculate correct details for dollar mode', () => {
      const result = calculateOrderDetails('dollars', '100', '', 50000);

      expect(result.isValid).toBe(true);
      expect(result.orderTotal).toBe(100);
      expect(result.orderQuantity).toBe(0.002);
      expect(result.error).toBeUndefined();
    });

    it('should calculate correct details for shares mode', () => {
      const result = calculateOrderDetails('shares', '', '0.5', 60000);

      expect(result.isValid).toBe(true);
      expect(result.orderQuantity).toBe(0.5);
      expect(result.orderTotal).toBe(30000);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid dollar amount', () => {
      const result = calculateOrderDetails('dollars', '0.50', '', 50000);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Minimum order is $1.00');
    });

    it('should return error for invalid quantity', () => {
      const result = calculateOrderDetails('shares', '', '0', 50000);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid quantity');
    });

    it('should return error for empty dollar amount', () => {
      const result = calculateOrderDetails('dollars', '', '', 50000);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a dollar amount');
    });

    it('should handle high-value orders', () => {
      const result = calculateOrderDetails('dollars', '50000', '', 67000);

      expect(result.isValid).toBe(true);
      expect(result.orderTotal).toBe(50000);
      expect(result.orderQuantity).toBeCloseTo(0.746268, 5);
    });
  });

  // ==========================================================================
  // Input Sanitization
  // ==========================================================================
  describe('sanitizeNumericInput', () => {
    it('should allow valid numeric input', () => {
      expect(sanitizeNumericInput('123.45')).toBe('123.45');
      expect(sanitizeNumericInput('100')).toBe('100');
      expect(sanitizeNumericInput('0.5')).toBe('0.5');
    });

    it('should remove non-numeric characters', () => {
      expect(sanitizeNumericInput('$100')).toBe('100');
      expect(sanitizeNumericInput('1,000.50')).toBe('1000.50');
      expect(sanitizeNumericInput('abc123def')).toBe('123');
    });

    it('should reject multiple decimal points', () => {
      expect(sanitizeNumericInput('1.2.3')).toBeNull();
      expect(sanitizeNumericInput('..5')).toBeNull();
    });

    it('should enforce max decimal places', () => {
      expect(sanitizeNumericInput('1.123456789', 8)).toBeNull();
      expect(sanitizeNumericInput('1.12345678', 8)).toBe('1.12345678');
      expect(sanitizeNumericInput('1.123', 2)).toBeNull();
      expect(sanitizeNumericInput('1.12', 2)).toBe('1.12');
    });

    it('should handle empty input', () => {
      expect(sanitizeNumericInput('')).toBe('');
    });
  });

  // ==========================================================================
  // Confirmation Message Generation
  // ==========================================================================
  describe('generateOrderConfirmationMessage', () => {
    it('should generate market order message for dollar mode', () => {
      const message = generateOrderConfirmationMessage(
        'buy',
        0.002,
        'BTC',
        100,
        'dollars'
      );

      expect(message).toContain('market order');
      expect(message).toContain('0.002 BTC');
      expect(message).toContain('$100.00');
    });

    it('should generate standard message for shares mode', () => {
      const message = generateOrderConfirmationMessage(
        'buy',
        0.5,
        'ETH',
        1750,
        'shares'
      );

      expect(message).toContain('buy');
      expect(message).toContain('0.5 ETH');
      expect(message).toContain('$1,750.00');
      expect(message).toContain('proceed');
    });

    it('should handle sell orders', () => {
      const message = generateOrderConfirmationMessage(
        'sell',
        1,
        'SOL',
        180,
        'shares'
      );

      expect(message).toContain('sell');
      expect(message).toContain('1 SOL');
    });

    it('should format large numbers with commas', () => {
      const message = generateOrderConfirmationMessage(
        'buy',
        1,
        'BTC',
        67000,
        'shares'
      );

      expect(message).toContain('$67,000.00');
    });
  });

  // ==========================================================================
  // Integration / Edge Cases
  // ==========================================================================
  describe('Integration scenarios', () => {
    it('should handle complete buy order flow in dollar mode', () => {
      const currentPrice = 67234.89;
      const dollarAmount = '500';
      const cashBalance = 1000;

      // Calculate order details
      const details = calculateOrderDetails('dollars', dollarAmount, '', currentPrice);
      expect(details.isValid).toBe(true);

      // Check balance
      expect(hasSufficientCashBalance(details.orderTotal, cashBalance)).toBe(true);

      // Check if large order
      expect(isLargeOrder(details.orderTotal)).toBe(false);

      // Verify market order enforcement
      expect(getEffectiveOrderType('dollars', 'limit')).toBe('market');

      // Expected quantity: $500 / $67,234.89 ≈ 0.007437
      expect(details.orderQuantity).toBeCloseTo(0.007437, 5);
    });

    it('should handle complete sell order flow in shares mode', () => {
      const currentPrice = 3456.78;
      const quantity = '2.5';
      const holdings = 3.0;

      // Calculate order details
      const details = calculateOrderDetails('shares', '', quantity, currentPrice);
      expect(details.isValid).toBe(true);

      // Check holdings
      expect(hasSufficientHoldings(details.orderQuantity, holdings)).toBe(true);

      // Verify limit orders allowed
      expect(isLimitOrderAllowed('shares')).toBe(true);

      // Expected total: 2.5 * $3,456.78 = $8,641.95
      expect(details.orderTotal).toBeCloseTo(8641.95, 2);
    });

    it('should reject order when cash balance insufficient', () => {
      const currentPrice = 67000;
      const dollarAmount = '5000';
      const cashBalance = 1000;

      const details = calculateOrderDetails('dollars', dollarAmount, '', currentPrice);
      expect(details.isValid).toBe(true);
      expect(hasSufficientCashBalance(details.orderTotal, cashBalance)).toBe(false);
    });

    it('should flag large dollar orders for confirmation', () => {
      const details = calculateOrderDetails('dollars', '2500', '', 50000);
      expect(details.isValid).toBe(true);
      expect(isLargeOrder(details.orderTotal)).toBe(true);
    });
  });
});
