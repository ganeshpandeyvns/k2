// ============================================================================
// Market Hours Utilities - US Stock Market Hours
// ============================================================================

export type MarketSession = 'pre' | 'regular' | 'after' | 'closed';

export interface MarketStatus {
  isOpen: boolean;
  session: MarketSession;
  sessionLabel: string;
  nextOpen: Date | null;
  nextClose: Date | null;
  countdown: string;
}

// US Market Holidays 2025 (NYSE/NASDAQ)
const MARKET_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents' Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas
];

// Early Close Days (1:00 PM ET)
const EARLY_CLOSE_2025 = [
  '2025-07-03', // Day before Independence Day
  '2025-11-28', // Day after Thanksgiving
  '2025-12-24', // Christmas Eve
];

/**
 * Convert a date to Eastern Time
 */
function toEasternTime(date: Date): Date {
  // Create a formatter for Eastern Time
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = etFormatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '0';

  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  );
}

/**
 * Get date string in YYYY-MM-DD format for Eastern Time
 */
function getETDateString(date: Date): string {
  const et = toEasternTime(date);
  const year = et.getFullYear();
  const month = String(et.getMonth() + 1).padStart(2, '0');
  const day = String(et.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const et = toEasternTime(date);
  const day = et.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if a date is a market holiday
 */
function isMarketHoliday(date: Date): boolean {
  const dateStr = getETDateString(date);
  return MARKET_HOLIDAYS_2025.includes(dateStr);
}

/**
 * Check if a date is an early close day
 */
function isEarlyClose(date: Date): boolean {
  const dateStr = getETDateString(date);
  return EARLY_CLOSE_2025.includes(dateStr);
}

/**
 * Get minutes since midnight in Eastern Time
 */
function getETMinutes(date: Date): number {
  const et = toEasternTime(date);
  return et.getHours() * 60 + et.getMinutes();
}

/**
 * Format countdown string
 */
function formatCountdown(ms: number): string {
  if (ms <= 0) return '';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get the next market open time
 */
function getNextMarketOpen(from: Date): Date {
  const et = toEasternTime(from);
  let next = new Date(et);

  // If it's before 9:30 AM on a trading day, market opens today
  const minutes = getETMinutes(from);
  if (minutes < 9 * 60 + 30 && !isWeekend(from) && !isMarketHoliday(from)) {
    next.setHours(9, 30, 0, 0);
    return next;
  }

  // Otherwise, find the next trading day
  next.setDate(next.getDate() + 1);
  next.setHours(9, 30, 0, 0);

  while (isWeekend(next) || isMarketHoliday(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Get the next market close time
 */
function getNextMarketClose(from: Date): Date {
  const et = toEasternTime(from);
  const next = new Date(et);

  const closeHour = isEarlyClose(from) ? 13 : 16;
  next.setHours(closeHour, 0, 0, 0);

  return next;
}

/**
 * Get current market status
 */
export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const minutes = getETMinutes(now);

  // Check if market is closed (weekend or holiday)
  if (isWeekend(now) || isMarketHoliday(now)) {
    const nextOpen = getNextMarketOpen(now);
    return {
      isOpen: false,
      session: 'closed',
      sessionLabel: 'Market Closed',
      nextOpen,
      nextClose: null,
      countdown: `Opens ${formatNextOpen(nextOpen)}`,
    };
  }

  // Market hours in minutes from midnight
  const preMarketOpen = 4 * 60; // 4:00 AM
  const regularOpen = 9 * 60 + 30; // 9:30 AM
  const regularClose = isEarlyClose(now) ? 13 * 60 : 16 * 60; // 4:00 PM (or 1:00 PM early)
  const afterHoursClose = 20 * 60; // 8:00 PM

  // Pre-market: 4:00 AM - 9:30 AM
  if (minutes >= preMarketOpen && minutes < regularOpen) {
    const msUntilOpen = (regularOpen - minutes) * 60 * 1000;
    return {
      isOpen: true,
      session: 'pre',
      sessionLabel: 'Pre-Market',
      nextOpen: null,
      nextClose: getNextMarketClose(now),
      countdown: `Regular hours in ${formatCountdown(msUntilOpen)}`,
    };
  }

  // Regular hours: 9:30 AM - 4:00 PM
  if (minutes >= regularOpen && minutes < regularClose) {
    const msUntilClose = (regularClose - minutes) * 60 * 1000;
    return {
      isOpen: true,
      session: 'regular',
      sessionLabel: 'Market Open',
      nextOpen: null,
      nextClose: getNextMarketClose(now),
      countdown: `Closes in ${formatCountdown(msUntilClose)}`,
    };
  }

  // After-hours: 4:00 PM - 8:00 PM
  if (minutes >= regularClose && minutes < afterHoursClose) {
    const msUntilClose = (afterHoursClose - minutes) * 60 * 1000;
    const nextOpen = getNextMarketOpen(now);
    return {
      isOpen: true,
      session: 'after',
      sessionLabel: 'After Hours',
      nextOpen,
      nextClose: null,
      countdown: `Extended hours end in ${formatCountdown(msUntilClose)}`,
    };
  }

  // Market closed (before 4 AM or after 8 PM)
  const nextOpen = getNextMarketOpen(now);
  return {
    isOpen: false,
    session: 'closed',
    sessionLabel: 'Market Closed',
    nextOpen,
    nextClose: null,
    countdown: `Opens ${formatNextOpen(nextOpen)}`,
  };
}

/**
 * Format next open time for display
 */
function formatNextOpen(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return `in ${formatCountdown(diffMs)}`;
  }

  // Format as day and time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return formatter.format(date) + ' ET';
}

/**
 * Get session badge color
 */
export function getSessionColor(session: MarketSession): string {
  switch (session) {
    case 'regular':
      return '#00D4AA'; // Green
    case 'pre':
    case 'after':
      return '#F0B429'; // Gold/Yellow
    case 'closed':
      return '#FF4D4D'; // Red
    default:
      return '#666666';
  }
}

/**
 * Get session badge icon
 */
export function getSessionIcon(session: MarketSession): string {
  switch (session) {
    case 'regular':
      return '🟢';
    case 'pre':
    case 'after':
      return '🟡';
    case 'closed':
      return '🔴';
    default:
      return '⚪';
  }
}

/**
 * Check if extended hours trading is currently available
 */
export function isExtendedHoursAvailable(now: Date = new Date()): boolean {
  const status = getMarketStatus(now);
  return status.session === 'pre' || status.session === 'after';
}

/**
 * Check if regular market hours
 */
export function isRegularHours(now: Date = new Date()): boolean {
  const status = getMarketStatus(now);
  return status.session === 'regular';
}

/**
 * Get trading availability message
 */
export function getTradingAvailabilityMessage(now: Date = new Date()): string {
  const status = getMarketStatus(now);

  switch (status.session) {
    case 'regular':
      return 'Market is open. Orders execute immediately.';
    case 'pre':
      return 'Pre-market trading available. Lower liquidity may affect execution.';
    case 'after':
      return 'After-hours trading available. Lower liquidity may affect execution.';
    case 'closed':
      return 'Market is closed. Orders will be queued for next market open.';
    default:
      return '';
  }
}
