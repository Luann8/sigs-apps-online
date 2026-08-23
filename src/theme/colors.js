export const Colors = {
  // Brand — Emerald & Deep Blue (mais aquecidos)
  primary: '#00796B',
  primaryLight: '#4DB6AC',
  primaryDark: '#004D40',
  secondary: '#1565C0',
  secondaryLight: '#1976D2',
  secondaryDark: '#0D47A1',

  // Gradient
  gradientStart: '#00796B',
  gradientEnd: '#1565C0',

  // Status
  success: '#2E7D32',
  successLight: '#43A047',
  successBg: '#E8F5E9',
  warning: '#E65100',
  warningLight: '#F57C00',
  warningBg: '#FFF3E0',
  error: '#C62828',
  errorLight: '#E53935',
  errorBg: '#FFEBEE',
  info: '#01579B',
  infoBg: '#E1F5FE',

  // Surfaces
  background: '#F4F6FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2F8',
  surfaceElevated: '#FAFBFF',
  border: '#DDE3EE',
  divider: '#E8EDF5',

  // Text
  textPrimary: '#0F2438',
  textSecondary: '#4A6480',
  textTertiary: '#7A96AE',
  textDisabled: '#B0C4D8',
  textOnPrimary: '#FFFFFF',

  // Specific types
  sanitaria: '#1565C0',
  sanitariaBg: '#E3F2FD',
  veterinaria: '#6A1B9A',
  veterinariaBg: '#F3E5F5',

  // UI
  shadow: 'rgba(15, 36, 56, 0.10)',
  shadowMd: 'rgba(15, 36, 56, 0.14)',
  overlay: 'rgba(0, 0, 0, 0.45)',
  tabBar: '#FFFFFF',
  tabBarActive: '#00796B',
  tabBarInactive: '#B0C4D8',

  // Calendar specific
  calToday: '#00796B',
  calSelected: '#00796B',
  calExpiring: '#E65100',
  calExpired: '#C62828',
  calActive: '#2E7D32',
};

export const DarkColors = {
  primary: '#4DB6AC',
  primaryLight: '#80CBC4',
  primaryDark: '#00796B',
  secondary: '#42A5F5',
  secondaryLight: '#64B5F6',
  secondaryDark: '#1E88E5',

  gradientStart: '#00796B',
  gradientEnd: '#1565C0',

  success: '#66BB6A',
  successLight: '#81C784',
  successBg: '#1B3A1D',
  warning: '#FFA726',
  warningLight: '#FFB74D',
  warningBg: '#3E2A0F',
  error: '#EF5350',
  errorLight: '#E57373',
  errorBg: '#3E1517',
  info: '#29B6F6',
  infoBg: '#0D2A3A',

  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',
  surfaceElevated: '#262626',
  border: '#3A3A3A',
  divider: '#2E2E2E',

  textPrimary: '#E0E0E0',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textDisabled: '#555555',
  textOnPrimary: '#FFFFFF',

  sanitaria: '#42A5F5',
  sanitariaBg: '#1A2E3E',
  veterinaria: '#AB47BC',
  veterinariaBg: '#2E1A33',

  shadow: 'rgba(0, 0, 0, 0.30)',
  shadowMd: 'rgba(0, 0, 0, 0.40)',
  overlay: 'rgba(0, 0, 0, 0.60)',
  tabBar: '#1E1E1E',
  tabBarActive: '#4DB6AC',
  tabBarInactive: '#666666',

  calToday: '#4DB6AC',
  calSelected: '#4DB6AC',
  calExpiring: '#FFA726',
  calExpired: '#EF5350',
  calActive: '#66BB6A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2, lineHeight: 26 },
  h4: { fontSize: 16, fontWeight: '600', letterSpacing: 0, lineHeight: 22 },
  body1: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3, lineHeight: 16 },
  button: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  overline: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },

  fontSizes: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const Shadows = {
  sm: {
    shadowColor: 'rgba(15, 36, 56, 0.10)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(15, 36, 56, 0.12)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(15, 36, 56, 0.16)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};
