// ============================================================================
// useTheme Hook - Dynamic Theme Application
// ============================================================================
// This hook provides the current theme colors that can be used throughout the app.
// It listens to the theme store and returns the active theme's colors.

import { useMemo } from 'react';
import { useThemeStore, PremiumTheme, PREMIUM_THEMES } from '../store/themeStore';
import { MeruTheme } from '../theme/meru';

// Create a dynamic theme object that merges the base theme with selected theme colors
export function useTheme() {
  const { currentThemeId, getCurrentTheme } = useThemeStore();

  const theme = useMemo(() => {
    const selectedTheme = getCurrentTheme();

    // Merge the selected theme colors with the base MeruTheme structure
    return {
      ...MeruTheme,
      colors: {
        background: selectedTheme.colors.background,
        accent: selectedTheme.colors.accent,
        success: selectedTheme.colors.success,
        error: selectedTheme.colors.error,
        text: selectedTheme.colors.text,
        border: selectedTheme.colors.border,
        chart: {
          line: selectedTheme.colors.accent.primary,
          gradient: [selectedTheme.colors.accent.primary + '66', selectedTheme.colors.accent.primary + '00'],
          grid: selectedTheme.colors.border.subtle,
          positive: selectedTheme.colors.success.primary,
          negative: selectedTheme.colors.error.primary,
        },
      },
      isDark: selectedTheme.isDark,
      themeId: selectedTheme.id,
      themeName: selectedTheme.name,
    };
  }, [currentThemeId]);

  return theme;
}

// Get current theme colors (for use in StyleSheet where hooks can't be used)
export function getThemeColors() {
  const { getCurrentTheme } = useThemeStore.getState();
  return getCurrentTheme().colors;
}

// Get theme by ID
export function getThemeById(id: string): PremiumTheme | undefined {
  return PREMIUM_THEMES.find((t) => t.id === id);
}

export type DynamicTheme = ReturnType<typeof useTheme>;
