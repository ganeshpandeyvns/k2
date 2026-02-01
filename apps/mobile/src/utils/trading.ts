// ============================================================================
// Trading Utilities - Dollar Amount Order Calculations
// ============================================================================

export type InputMode = 'dollars' | 'shares';
export type OrderType = 'market' | 'limit';
export type OrderSide = 'buy' | 'sell';

/**
 * Calculate quantity from dollar amount
 * @param dollarAmount - The dollar amount to convert
 * @param price - Current price per unit
 * @returns The calculated quantity
 */
export function calculateQuantityFromDollars(
  dollarAmount: number,
  price: number
): number {
  if (price <= 0) return 0;
  if (dollarAmount <= 0) return 0;
  return dollarAmount / price;
}

/**
 * Calculate dollar amount from quantity
 * @param quantity - The quantity of asset
 * @param price - Current price per unit
 * @returns The dollar amount
 */
export function calculateDollarsFromQuantity(
  quantity: number,
  price: number
): number {
  if (quantity <= 0) return 0;
  if (price <= 0) return 0;
  return quantity * price;
}

/**
 * Format quantity for display (remove trailing zeros)
 * @param quantity - The quantity to format
 * @param decimals - Maximum decimal places (default 8)
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: number, decimals: number = 8): string {
  return quantity.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Validate dollar amount input
 * @param amount - The dollar amount string
 * @returns Validation result with error message if invalid
 */
export function validateDollarAmount(amount: string): {
  valid: boolean;
  error?: string;
  value: number;
} {
  const numericAmount = parseFloat(amount) || 0;

  if (!amount || amount.trim() === '') {
    return { valid: false, error: 'Please enter a dollar amount', value: 0 };
  }

  if (numericAmount <= 0) {
    return { valid: false, error: 'Please enter a valid dollar amount', value: 0 };
  }

  if (numericAmount < 1) {
    return { valid: false, error: 'Minimum order is $1.00', value: numericAmount };
  }

  return { valid: true, value: numericAmount };
}

/**
 * Validate quantity input
 * @param quantity - The quantity string
 * @returns Validation result with error message if invalid
 */
export function validateQuantity(quantity: string): {
  valid: boolean;
  error?: string;
  value: number;
} {
  const numericQuantity = parseFloat(quantity) || 0;

  if (!quantity || quantity.trim() === '') {
    return { valid: false, error: 'Please enter a quantity', value: 0 };
  }

  if (numericQuantity <= 0) {
    return { valid: false, error: 'Please enter a valid quantity', value: 0 };
  }

  return { valid: true, value: numericQuantity };
}

/**
 * Check if user has sufficient balance for a buy order
 * @param orderTotal - Total cost of the order
 * @param cashBalance - Available cash balance
 * @returns Whether the balance is sufficient
 */
export function hasSufficientCashBalance(
  orderTotal: number,
  cashBalance: number
): boolean {
  return orderTotal <= cashBalance;
}

/**
 * Check if user has sufficient holdings for a sell order
 * @param sellQuantity - Quantity to sell
 * @param holdingQuantity - Available holding quantity
 * @returns Whether holdings are sufficient
 */
export function hasSufficientHoldings(
  sellQuantity: number,
  holdingQuantity: number
): boolean {
  return sellQuantity <= holdingQuantity;
}

/**
 * Determine if an order is considered "large" and requires confirmation
 * @param orderTotal - Total value of the order
 * @param threshold - Threshold for large orders (default $1000)
 * @returns Whether the order is considered large
 */
export function isLargeOrder(orderTotal: number, threshold: number = 1000): boolean {
  return orderTotal > threshold;
}

/**
 * Get the effective order type based on input mode
 * Dollar-amount orders must be market orders
 * @param inputMode - Current input mode
 * @param selectedOrderType - User-selected order type
 * @returns The effective order type
 */
export function getEffectiveOrderType(
  inputMode: InputMode,
  selectedOrderType: OrderType
): OrderType {
  // Dollar-amount orders are always market orders
  if (inputMode === 'dollars') {
    return 'market';
  }
  return selectedOrderType;
}

/**
 * Check if limit orders are allowed based on input mode
 * @param inputMode - Current input mode
 * @returns Whether limit orders are allowed
 */
export function isLimitOrderAllowed(inputMode: InputMode): boolean {
  return inputMode !== 'dollars';
}

/**
 * Calculate order details based on input mode
 * @param inputMode - Current input mode
 * @param dollarAmount - Dollar amount (for dollar mode)
 * @param quantity - Quantity (for shares mode)
 * @param currentPrice - Current price per unit
 * @returns Order details including quantity and total
 */
export function calculateOrderDetails(
  inputMode: InputMode,
  dollarAmount: string,
  quantity: string,
  currentPrice: number
): {
  orderQuantity: number;
  orderTotal: number;
  isValid: boolean;
  error?: string;
} {
  if (inputMode === 'dollars') {
    const validation = validateDollarAmount(dollarAmount);
    if (!validation.valid) {
      return {
        orderQuantity: 0,
        orderTotal: 0,
        isValid: false,
        error: validation.error,
      };
    }
    const orderQuantity = calculateQuantityFromDollars(validation.value, currentPrice);
    return {
      orderQuantity,
      orderTotal: validation.value,
      isValid: true,
    };
  } else {
    const validation = validateQuantity(quantity);
    if (!validation.valid) {
      return {
        orderQuantity: 0,
        orderTotal: 0,
        isValid: false,
        error: validation.error,
      };
    }
    const orderTotal = calculateDollarsFromQuantity(validation.value, currentPrice);
    return {
      orderQuantity: validation.value,
      orderTotal,
      isValid: true,
    };
  }
}

/**
 * Sanitize numeric input (allow only numbers and one decimal point)
 * @param input - Raw input string
 * @param maxDecimals - Maximum decimal places allowed
 * @returns Sanitized input string or null if invalid
 */
export function sanitizeNumericInput(
  input: string,
  maxDecimals: number = 8
): string | null {
  // Remove non-numeric characters except decimal point
  const sanitized = input.replace(/[^0-9.]/g, '');

  // Check for multiple decimal points
  const parts = sanitized.split('.');
  if (parts.length > 2) return null;

  // Check decimal places
  if (parts[1]?.length > maxDecimals) return null;

  return sanitized;
}

/**
 * Generate order confirmation message
 * @param side - Order side (buy/sell)
 * @param quantity - Order quantity
 * @param asset - Asset symbol
 * @param total - Order total in dollars
 * @param inputMode - Input mode used
 * @returns Confirmation message string
 */
export function generateOrderConfirmationMessage(
  side: OrderSide,
  quantity: number,
  asset: string,
  total: number,
  inputMode: InputMode
): string {
  const formattedQty = formatQuantity(quantity, 6);
  const formattedTotal = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  if (inputMode === 'dollars') {
    return `This is a market order. The final price may differ slightly due to market conditions.\n\nEstimated: ${formattedQty} ${asset} for ${formattedTotal}`;
  }

  return `You are about to ${side} ${formattedQty} ${asset} for ${formattedTotal}.\n\nAre you sure you want to proceed?`;
}
