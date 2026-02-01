// ============================================================================
// Input Validation Utilities
// ============================================================================

/**
 * Sanitizes numeric input for amounts
 * - Removes non-numeric characters except decimal point
 * - Prevents multiple decimal points
 * - Limits decimal places
 */
export function sanitizeAmountInput(
  text: string,
  maxDecimalPlaces: number = 8
): string | null {
  // Remove non-numeric characters except decimal point
  const sanitized = text.replace(/[^0-9.]/g, '');

  // Check for multiple decimal points
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return null; // Invalid - multiple decimals
  }

  // Check decimal places limit
  if (parts[1] && parts[1].length > maxDecimalPlaces) {
    return null; // Exceeds max decimal places
  }

  return sanitized;
}

/**
 * Validates wallet address format by chain
 */
export function validateAddress(address: string, asset: string): boolean {
  if (!address || address.length < 10) return false;

  const validations: Record<string, (a: string) => boolean> = {
    // Bitcoin - Legacy (1...), SegWit (3...), Native SegWit (bc1...)
    BTC: (a) =>
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(a) ||
      /^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(a),

    // Ethereum and EVM-compatible chains
    ETH: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
    USDC: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
    USDT: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
    MATIC: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),
    AVAX: (a) => /^0x[a-fA-F0-9]{40}$/.test(a),

    // Solana
    SOL: (a) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a),

    // XRP
    XRP: (a) => /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a),

    // Cardano
    ADA: (a) => /^addr1[a-zA-Z0-9]{50,}$/.test(a),

    // Polkadot
    DOT: (a) => /^1[a-zA-Z0-9]{47}$/.test(a),
  };

  const validator = validations[asset];

  // For demo mode, accept addresses > 20 chars if no specific validator
  return validator ? validator(address) : address.length > 20;
}

/**
 * Checks if an amount is valid for a transaction
 */
export function isValidTransactionAmount(
  amount: number,
  minAmount: number = 0,
  maxAmount: number = Infinity
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (amount < minAmount) {
    return { valid: false, error: `Minimum amount is ${minAmount}` };
  }

  if (amount > maxAmount) {
    return { valid: false, error: `Maximum amount is ${maxAmount}` };
  }

  return { valid: true };
}

/**
 * Validates that user has sufficient balance
 */
export function hasSufficientBalance(
  amount: number,
  balance: number,
  fee: number = 0
): { valid: boolean; error?: string } {
  const totalRequired = amount + fee;

  if (totalRequired > balance) {
    return {
      valid: false,
      error: `Insufficient balance. Need ${totalRequired.toFixed(6)} but have ${balance.toFixed(6)}`,
    };
  }

  return { valid: true };
}

/**
 * Checks if a transaction amount is considered "large" (over threshold)
 */
export function isLargeTransaction(
  amountUSD: number,
  threshold: number = 1000
): boolean {
  return amountUSD > threshold;
}

/**
 * Formats a crypto amount with appropriate decimal places
 */
export function formatCryptoAmount(amount: number, decimals: number = 6): string {
  if (amount === 0) return '0';

  // For very small amounts, use more precision
  if (amount < 0.000001) {
    return amount.toExponential(2);
  }

  // Remove trailing zeros
  return parseFloat(amount.toFixed(decimals)).toString();
}
