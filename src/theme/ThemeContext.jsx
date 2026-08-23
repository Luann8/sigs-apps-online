import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { Colors, DarkColors, Spacing, BorderRadius, Typography, Shadows } from './colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const value = useMemo(() => ({
    isDark,
    theme,
    Colors: isDark ? DarkColors : Colors,
    Spacing,
    BorderRadius,
    Typography,
    Shadows,
  }), [isDark, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { isDark: false, theme: 'light', Colors, Spacing, BorderRadius, Typography, Shadows };
  }
  return ctx;
}
