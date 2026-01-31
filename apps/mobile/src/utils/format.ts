// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: string | number, compact = false): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '$0.00';

  if (compact && Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }

  if (compact && Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: num < 1 ? 6 : 2,
  }).format(num);
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0.00%';

  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

/**
 * Format a large number with abbreviations
 */
export function formatNumber(value: string | number, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  if (Math.abs(num) >= 1000000000) {
    return `${(num / 1000000000).toFixed(decimals)}B`;
  }

  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`;
  }

  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`;
  }

  return num.toFixed(decimals);
}

/**
 * Format a crypto quantity (variable precision)
 */
export function formatQuantity(value: string | number, asset: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0';

  // Different assets have different typical precisions
  const precisionMap: Record<string, number> = {
    BTC: 8,
    ETH: 6,
    SOL: 4,
    USD: 2,
    USDC: 2,
    USDT: 2,
  };

  const precision = precisionMap[asset] || 4;
  return num.toFixed(precision).replace(/\.?0+$/, '');
}

/**
 * Format a date/time
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (includeTime) {
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(d);
}
