// ============================================================================
// Validation Utilities Tests
// ============================================================================

import {
  sanitizeAmountInput,
  validateAddress,
  isValidTransactionAmount,
  hasSufficientBalance,
  isLargeTransaction,
  formatCryptoAmount,
} from '../../src/utils/validation';

describe('sanitizeAmountInput', () => {
  describe('valid inputs', () => {
    it('should accept plain numbers', () => {
      expect(sanitizeAmountInput('123')).toBe('123');
      expect(sanitizeAmountInput('0')).toBe('0');
    });

    it('should accept decimal numbers', () => {
      expect(sanitizeAmountInput('123.45')).toBe('123.45');
      expect(sanitizeAmountInput('0.001')).toBe('0.001');
    });

    it('should remove non-numeric characters', () => {
      expect(sanitizeAmountInput('$100')).toBe('100');
      expect(sanitizeAmountInput('1,234.56')).toBe('1234.56');
      expect(sanitizeAmountInput('abc123def')).toBe('123');
    });

    it('should handle leading decimal', () => {
      expect(sanitizeAmountInput('.5')).toBe('.5');
    });
  });

  describe('invalid inputs', () => {
    it('should reject multiple decimal points', () => {
      expect(sanitizeAmountInput('1.2.3')).toBeNull();
      expect(sanitizeAmountInput('..5')).toBeNull();
    });

    it('should reject too many decimal places', () => {
      expect(sanitizeAmountInput('1.123456789', 8)).toBeNull();
      expect(sanitizeAmountInput('1.123', 2)).toBeNull();
    });
  });

  describe('decimal place limits', () => {
    it('should respect custom decimal limits', () => {
      expect(sanitizeAmountInput('1.12', 2)).toBe('1.12');
      expect(sanitizeAmountInput('1.123', 3)).toBe('1.123');
      expect(sanitizeAmountInput('1.12345678', 8)).toBe('1.12345678');
    });
  });
});

describe('validateAddress', () => {
  describe('Bitcoin addresses', () => {
    it('should accept valid legacy addresses (starting with 1)', () => {
      expect(validateAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'BTC')).toBe(true);
    });

    it('should accept valid SegWit addresses (starting with 3)', () => {
      expect(validateAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 'BTC')).toBe(true);
    });

    it('should accept valid native SegWit addresses (bc1)', () => {
      expect(validateAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'BTC')).toBe(true);
    });

    it('should reject invalid BTC addresses', () => {
      expect(validateAddress('invalid', 'BTC')).toBe(false);
      expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f', 'BTC')).toBe(false);
    });
  });

  describe('Ethereum addresses', () => {
    it('should accept valid ETH addresses', () => {
      expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44E', 'ETH')).toBe(true);
    });

    it('should reject invalid ETH addresses', () => {
      expect(validateAddress('742d35Cc6634C0532925a3b844Bc454e4438f44E', 'ETH')).toBe(false); // Missing 0x
      expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44', 'ETH')).toBe(false); // Too short
      expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44EE', 'ETH')).toBe(false); // Too long
    });
  });

  describe('EVM-compatible tokens', () => {
    const validEVMAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44E';

    it('should accept valid USDC addresses', () => {
      expect(validateAddress(validEVMAddress, 'USDC')).toBe(true);
    });

    it('should accept valid USDT addresses', () => {
      expect(validateAddress(validEVMAddress, 'USDT')).toBe(true);
    });

    it('should accept valid MATIC addresses', () => {
      expect(validateAddress(validEVMAddress, 'MATIC')).toBe(true);
    });

    it('should accept valid AVAX addresses', () => {
      expect(validateAddress(validEVMAddress, 'AVAX')).toBe(true);
    });
  });

  describe('Solana addresses', () => {
    it('should accept valid SOL addresses', () => {
      expect(validateAddress('7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV', 'SOL')).toBe(true);
    });

    it('should reject invalid SOL addresses', () => {
      expect(validateAddress('short', 'SOL')).toBe(false);
      expect(validateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44E', 'SOL')).toBe(false);
    });
  });

  describe('unknown assets', () => {
    it('should accept addresses > 20 chars for unknown assets', () => {
      expect(validateAddress('this_is_a_long_address_for_unknown_asset', 'UNKNOWN')).toBe(true);
    });

    it('should reject short addresses for unknown assets', () => {
      expect(validateAddress('short', 'UNKNOWN')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should reject empty addresses', () => {
      expect(validateAddress('', 'ETH')).toBe(false);
    });

    it('should reject very short addresses', () => {
      expect(validateAddress('abc', 'ETH')).toBe(false);
    });
  });
});

describe('isValidTransactionAmount', () => {
  it('should accept valid positive amounts', () => {
    expect(isValidTransactionAmount(100)).toEqual({ valid: true });
    expect(isValidTransactionAmount(0.001)).toEqual({ valid: true });
  });

  it('should reject zero', () => {
    const result = isValidTransactionAmount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('greater than 0');
  });

  it('should reject negative amounts', () => {
    const result = isValidTransactionAmount(-50);
    expect(result.valid).toBe(false);
  });

  it('should reject NaN', () => {
    const result = isValidTransactionAmount(NaN);
    expect(result.valid).toBe(false);
  });

  it('should respect minimum amount', () => {
    expect(isValidTransactionAmount(5, 10).valid).toBe(false);
    expect(isValidTransactionAmount(10, 10).valid).toBe(true);
    expect(isValidTransactionAmount(15, 10).valid).toBe(true);
  });

  it('should respect maximum amount', () => {
    expect(isValidTransactionAmount(150, 0, 100).valid).toBe(false);
    expect(isValidTransactionAmount(100, 0, 100).valid).toBe(true);
    expect(isValidTransactionAmount(50, 0, 100).valid).toBe(true);
  });
});

describe('hasSufficientBalance', () => {
  it('should return valid when balance covers amount', () => {
    expect(hasSufficientBalance(100, 500)).toEqual({ valid: true });
  });

  it('should return valid when balance exactly equals amount', () => {
    expect(hasSufficientBalance(100, 100)).toEqual({ valid: true });
  });

  it('should return invalid when balance is insufficient', () => {
    const result = hasSufficientBalance(500, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Insufficient balance');
  });

  it('should account for fees', () => {
    // 100 amount + 10 fee = 110 needed, but only 100 balance
    const result = hasSufficientBalance(100, 100, 10);
    expect(result.valid).toBe(false);
  });

  it('should pass when balance covers amount plus fee', () => {
    expect(hasSufficientBalance(90, 100, 10)).toEqual({ valid: true });
  });
});

describe('isLargeTransaction', () => {
  it('should return true for amounts over default threshold ($1000)', () => {
    expect(isLargeTransaction(1001)).toBe(true);
    expect(isLargeTransaction(5000)).toBe(true);
  });

  it('should return false for amounts at or under threshold', () => {
    expect(isLargeTransaction(1000)).toBe(false);
    expect(isLargeTransaction(500)).toBe(false);
  });

  it('should respect custom threshold', () => {
    expect(isLargeTransaction(600, 500)).toBe(true);
    expect(isLargeTransaction(400, 500)).toBe(false);
  });
});

describe('formatCryptoAmount', () => {
  it('should format normal amounts', () => {
    expect(formatCryptoAmount(1.234567)).toBe('1.234567');
    expect(formatCryptoAmount(100)).toBe('100');
  });

  it('should remove trailing zeros', () => {
    expect(formatCryptoAmount(1.5)).toBe('1.5');
    expect(formatCryptoAmount(1.0)).toBe('1');
  });

  it('should handle zero', () => {
    expect(formatCryptoAmount(0)).toBe('0');
  });

  it('should use scientific notation for very small amounts', () => {
    const result = formatCryptoAmount(0.0000001);
    expect(result).toMatch(/e/); // Should contain 'e' for scientific notation
  });

  it('should respect custom decimal places', () => {
    expect(formatCryptoAmount(1.123456789, 4)).toBe('1.1235'); // Rounds
    expect(formatCryptoAmount(1.123456789, 2)).toBe('1.12');
  });
});
