// ============================================================================
// MERU Design System
// Alpine Luxury Fintech - Elevated Trading Experience
// ============================================================================

export const MeruTheme = {
  // Core Colors - Obsidian & Gold
  colors: {
    // Backgrounds - Deep, layered blacks
    background: {
      primary: '#050507',      // Deepest black - main bg
      secondary: '#0a0a0f',    // Card backgrounds
      tertiary: '#12121a',     // Elevated surfaces
      elevated: '#1a1a24',     // Modals, dropdowns
      glass: 'rgba(18, 18, 26, 0.85)', // Glassmorphism
    },

    // Accent - Warm Gold (The Meru signature)
    accent: {
      primary: '#f0b429',      // Main gold
      secondary: '#d4a028',    // Darker gold
      tertiary: '#ffd666',     // Light gold highlight
      glow: 'rgba(240, 180, 41, 0.15)', // Gold glow effect
      gradient: ['#f0b429', '#d4a028', '#b8860b'],
    },

    // Semantic - Trading colors
    success: {
      primary: '#00d4aa',      // Gains - Teal/Cyan
      secondary: '#00b894',
      glow: 'rgba(0, 212, 170, 0.15)',
    },
    error: {
      primary: '#ff6b6b',      // Losses - Soft coral red
      secondary: '#ee5a5a',
      glow: 'rgba(255, 107, 107, 0.15)',
    },

    // Text hierarchy
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.45)',
      muted: 'rgba(255, 255, 255, 0.25)',
      inverse: '#050507',
    },

    // Borders & Dividers
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(240, 180, 41, 0.3)',
    },

    // Chart colors
    chart: {
      line: '#f0b429',
      gradient: ['rgba(240, 180, 41, 0.4)', 'rgba(240, 180, 41, 0)'],
      grid: 'rgba(255, 255, 255, 0.04)',
      positive: '#00d4aa',
      negative: '#ff6b6b',
    },
  },

  // Typography - Refined & Premium
  typography: {
    // Display - Large headlines
    display: {
      fontFamily: 'System', // Will use SF Pro Display on iOS
      fontSize: 48,
      fontWeight: '700' as const,
      letterSpacing: -1.5,
      lineHeight: 56,
    },
    // Headlines
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
      lineHeight: 28,
    },
    // Body text
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    bodySemibold: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    // Small text
    caption: {
      fontSize: 13,
      fontWeight: '500' as const,
      letterSpacing: 0.2,
      lineHeight: 18,
    },
    captionSmall: {
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.3,
      lineHeight: 14,
    },
    // Numbers - Tabular for alignment
    number: {
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      fontVariant: ['tabular-nums'] as any,
    },
    numberLarge: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'] as any,
    },
    numberHuge: {
      fontSize: 40,
      fontWeight: '700' as const,
      letterSpacing: -1,
      fontVariant: ['tabular-nums'] as any,
    },
  },

  // Spacing scale (4px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },

  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 0,
    }),
  },

  // Animation timing
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      damping: 15,
      stiffness: 150,
    },
  },
};

// Demo user data
export const DemoUser = {
  id: 'demo-001',
  name: 'Alex',
  fullName: 'Alex Morgan',
  email: 'alex@demo.meru.app',
  avatar: null,
  preferences: {
    currency: 'USD',
    theme: 'dark',
  },
};

// Format helpers
export const formatCurrency = (value: number, compact = false): string => {
  if (compact && Math.abs(value) >= 1000000) {
    return '$' + (value / 1000000).toFixed(2) + 'M';
  }
  if (compact && Math.abs(value) >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return sign + value.toFixed(2) + '%';
};

export const formatNumber = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export type Theme = typeof MeruTheme;
