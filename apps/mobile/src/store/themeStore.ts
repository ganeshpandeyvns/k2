// ============================================================================
// Theme Store - Premium Theme Management (Demo Feature)
// ============================================================================
// This is a demo feature for investor feedback.
// Users can switch between premium themes to see the app in different styles.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Premium Theme Definitions
// ============================================================================

export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    glass: string;
  };
  accent: {
    primary: string;
    secondary: string;
    tertiary: string;
    glow: string;
  };
  success: {
    primary: string;
    secondary: string;
    glow: string;
  };
  error: {
    primary: string;
    secondary: string;
    glow: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    inverse: string;
  };
  border: {
    subtle: string;
    light: string;
    medium: string;
    accent: string;
  };
}

export interface PremiumTheme {
  id: string;
  name: string;
  description: string;
  preview: string[]; // Gradient colors for preview
  isDark: boolean;
  colors: ThemeColors;
}

// Obsidian & Gold (Default) - The Meru signature
const obsidianGold: PremiumTheme = {
  id: 'obsidian-gold',
  name: 'Obsidian & Gold',
  description: 'The Meru signature - Elegant dark with warm gold accents',
  preview: ['#050507', '#f0b429', '#d4a028'],
  isDark: true,
  colors: {
    background: {
      primary: '#050507',
      secondary: '#0a0a0f',
      tertiary: '#12121a',
      elevated: '#1a1a24',
      glass: 'rgba(18, 18, 26, 0.85)',
    },
    accent: {
      primary: '#f0b429',
      secondary: '#d4a028',
      tertiary: '#ffd666',
      glow: 'rgba(240, 180, 41, 0.15)',
    },
    success: {
      primary: '#00d4aa',
      secondary: '#00b894',
      glow: 'rgba(0, 212, 170, 0.15)',
    },
    error: {
      primary: '#ff6b6b',
      secondary: '#ee5a5a',
      glow: 'rgba(255, 107, 107, 0.15)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.45)',
      muted: 'rgba(255, 255, 255, 0.25)',
      inverse: '#050507',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(240, 180, 41, 0.3)',
    },
  },
};

// Midnight Purple - Deep purples with electric accents
const midnightPurple: PremiumTheme = {
  id: 'midnight-purple',
  name: 'Midnight Purple',
  description: 'Deep luxury with electric violet accents',
  preview: ['#0d0a1a', '#9b59b6', '#8e44ad'],
  isDark: true,
  colors: {
    background: {
      primary: '#0d0a1a',
      secondary: '#13101f',
      tertiary: '#1a1628',
      elevated: '#241f35',
      glass: 'rgba(26, 22, 40, 0.85)',
    },
    accent: {
      primary: '#9b59b6',
      secondary: '#8e44ad',
      tertiary: '#bb8fce',
      glow: 'rgba(155, 89, 182, 0.15)',
    },
    success: {
      primary: '#2ecc71',
      secondary: '#27ae60',
      glow: 'rgba(46, 204, 113, 0.15)',
    },
    error: {
      primary: '#e74c3c',
      secondary: '#c0392b',
      glow: 'rgba(231, 76, 60, 0.15)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.45)',
      muted: 'rgba(255, 255, 255, 0.25)',
      inverse: '#0d0a1a',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(155, 89, 182, 0.3)',
    },
  },
};

// Ocean Blue - Cool blues with cyan highlights
const oceanBlue: PremiumTheme = {
  id: 'ocean-blue',
  name: 'Ocean Depths',
  description: 'Cool ocean tones with vibrant cyan accents',
  preview: ['#050a14', '#00b4d8', '#0077b6'],
  isDark: true,
  colors: {
    background: {
      primary: '#050a14',
      secondary: '#0a1020',
      tertiary: '#101828',
      elevated: '#182438',
      glass: 'rgba(16, 24, 40, 0.85)',
    },
    accent: {
      primary: '#00b4d8',
      secondary: '#0077b6',
      tertiary: '#48cae4',
      glow: 'rgba(0, 180, 216, 0.15)',
    },
    success: {
      primary: '#06d6a0',
      secondary: '#05c793',
      glow: 'rgba(6, 214, 160, 0.15)',
    },
    error: {
      primary: '#ef476f',
      secondary: '#d63d5a',
      glow: 'rgba(239, 71, 111, 0.15)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.45)',
      muted: 'rgba(255, 255, 255, 0.25)',
      inverse: '#050a14',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(0, 180, 216, 0.3)',
    },
  },
};

// Arctic White - Clean light theme with blue accents
const arcticWhite: PremiumTheme = {
  id: 'arctic-white',
  name: 'Arctic White',
  description: 'Clean and minimal with icy blue accents',
  preview: ['#f8fafc', '#2563eb', '#1d4ed8'],
  isDark: false,
  colors: {
    background: {
      primary: '#f8fafc',
      secondary: '#ffffff',
      tertiary: '#f1f5f9',
      elevated: '#ffffff',
      glass: 'rgba(248, 250, 252, 0.85)',
    },
    accent: {
      primary: '#2563eb', // Darker blue for better contrast
      secondary: '#1d4ed8',
      tertiary: '#3b82f6',
      glow: 'rgba(37, 99, 235, 0.15)',
    },
    success: {
      primary: '#059669', // Darker green
      secondary: '#047857',
      glow: 'rgba(5, 150, 105, 0.15)',
    },
    error: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      glow: 'rgba(220, 38, 38, 0.15)',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      tertiary: '#64748b',
      muted: '#94a3b8',
      inverse: '#ffffff',
    },
    border: {
      subtle: 'rgba(15, 23, 42, 0.08)',
      light: 'rgba(15, 23, 42, 0.12)',
      medium: 'rgba(15, 23, 42, 0.2)',
      accent: 'rgba(37, 99, 235, 0.4)',
    },
  },
};

// Rose Gold - Warm feminine luxury
const roseGold: PremiumTheme = {
  id: 'rose-gold',
  name: 'Rose Gold',
  description: 'Warm luxury with elegant rose gold accents',
  preview: ['#0f0a0c', '#b76e79', '#e8b4bc'],
  isDark: true,
  colors: {
    background: {
      primary: '#0f0a0c',
      secondary: '#151012',
      tertiary: '#1e171a',
      elevated: '#2a2024',
      glass: 'rgba(30, 23, 26, 0.85)',
    },
    accent: {
      primary: '#e8b4bc',
      secondary: '#b76e79',
      tertiary: '#f5d0d6',
      glow: 'rgba(232, 180, 188, 0.15)',
    },
    success: {
      primary: '#7dd3b3',
      secondary: '#5cc19c',
      glow: 'rgba(125, 211, 179, 0.15)',
    },
    error: {
      primary: '#e57373',
      secondary: '#d65c5c',
      glow: 'rgba(229, 115, 115, 0.15)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.45)',
      muted: 'rgba(255, 255, 255, 0.25)',
      inverse: '#0f0a0c',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(232, 180, 188, 0.3)',
    },
  },
};

// Emerald Night - Deep green luxury
const emeraldNight: PremiumTheme = {
  id: 'emerald-night',
  name: 'Emerald Night',
  description: 'Rich emerald tones with gold highlights',
  preview: ['#051510', '#10b981', '#047857'],
  isDark: true,
  colors: {
    background: {
      primary: '#051510',
      secondary: '#081f18',
      tertiary: '#0d2a22',
      elevated: '#143d32',
      glass: 'rgba(13, 42, 34, 0.85)',
    },
    accent: {
      primary: '#10b981',
      secondary: '#047857',
      tertiary: '#34d399',
      glow: 'rgba(16, 185, 129, 0.15)',
    },
    success: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      glow: 'rgba(251, 191, 36, 0.15)',
    },
    error: {
      primary: '#fb7185',
      secondary: '#f43f5e',
      glow: 'rgba(251, 113, 133, 0.15)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.45)',
      muted: 'rgba(255, 255, 255, 0.25)',
      inverse: '#051510',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      accent: 'rgba(16, 185, 129, 0.3)',
    },
  },
};

// Sunrise Gold - Bright and Vibrant Light Theme
const sunriseGold: PremiumTheme = {
  id: 'sunrise-gold',
  name: 'Sunrise Gold',
  description: 'Bright and energetic with warm gold and coral accents',
  preview: ['#ffffff', '#e67e00', '#d45500'],
  isDark: false,
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#fffaf5',
      tertiary: '#fff5eb',
      elevated: '#ffffff',
      glass: 'rgba(255, 255, 255, 0.95)',
    },
    accent: {
      primary: '#e67e00', // Darker orange for better contrast
      secondary: '#d45500',
      tertiary: '#ff9500',
      glow: 'rgba(230, 126, 0, 0.15)',
    },
    success: {
      primary: '#059669', // Darker green for better contrast
      secondary: '#047857',
      glow: 'rgba(5, 150, 105, 0.15)',
    },
    error: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      glow: 'rgba(220, 38, 38, 0.15)',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      tertiary: '#6b6b6b',
      muted: '#9a9a9a',
      inverse: '#ffffff',
    },
    border: {
      subtle: 'rgba(0, 0, 0, 0.08)',
      light: 'rgba(0, 0, 0, 0.12)',
      medium: 'rgba(0, 0, 0, 0.2)',
      accent: 'rgba(230, 126, 0, 0.4)',
    },
  },
};

// Pearl Mint - Clean Light Theme with Mint Accents
const pearlMint: PremiumTheme = {
  id: 'pearl-mint',
  name: 'Pearl Mint',
  description: 'Crisp white with refreshing mint green accents',
  preview: ['#ffffff', '#00a080', '#008060'],
  isDark: false,
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fffe',
      tertiary: '#f0fcf9',
      elevated: '#ffffff',
      glass: 'rgba(255, 255, 255, 0.95)',
    },
    accent: {
      primary: '#00a080', // Darker mint for better contrast
      secondary: '#008060',
      tertiary: '#00c49a',
      glow: 'rgba(0, 160, 128, 0.15)',
    },
    success: {
      primary: '#00a080',
      secondary: '#008060',
      glow: 'rgba(0, 160, 128, 0.15)',
    },
    error: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      glow: 'rgba(220, 38, 38, 0.15)',
    },
    text: {
      primary: '#1a2e35',
      secondary: '#3d5a66',
      tertiary: '#5d7a86',
      muted: '#8da0a8',
      inverse: '#ffffff',
    },
    border: {
      subtle: 'rgba(0, 80, 64, 0.08)',
      light: 'rgba(0, 80, 64, 0.12)',
      medium: 'rgba(0, 80, 64, 0.2)',
      accent: 'rgba(0, 160, 128, 0.4)',
    },
  },
};

export const PREMIUM_THEMES: PremiumTheme[] = [
  obsidianGold,
  midnightPurple,
  oceanBlue,
  roseGold,
  emeraldNight,
  arcticWhite,
  sunriseGold,
  pearlMint,
];

// ============================================================================
// Theme Store
// ============================================================================

interface ThemeState {
  currentThemeId: string;
  getCurrentTheme: () => PremiumTheme;
  setTheme: (themeId: string) => void;
  getThemeById: (id: string) => PremiumTheme | undefined;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentThemeId: 'obsidian-gold',

      getCurrentTheme: () => {
        const { currentThemeId } = get();
        return PREMIUM_THEMES.find((t) => t.id === currentThemeId) || obsidianGold;
      },

      setTheme: (themeId: string) => {
        const theme = PREMIUM_THEMES.find((t) => t.id === themeId);
        if (theme) {
          set({ currentThemeId: themeId });
        }
      },

      getThemeById: (id: string) => {
        return PREMIUM_THEMES.find((t) => t.id === id);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ currentThemeId: state.currentThemeId }),
    }
  )
);
