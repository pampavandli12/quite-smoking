import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

export const designTokens = {
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 10, md: 16, lg: 22, pill: 999 },
  motion: {
    instant: 0,
    fast: 140,
    standard: 220,
    slow: 360,
    spring: { damping: 24, stiffness: 220, mass: 0.8 },
  },
} as const;

export type AppTheme = MD3Theme & {
  appColors: {
    success: string;
    successContainer: string;
    warning: string;
    warningContainer: string;
    info: string;
    premium: string;
    premiumContainer: string;
    heroStart: string;
    heroEnd: string;
  };
};

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  roundness: designTokens.radius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#215C4A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#CDE9DE',
    onPrimaryContainer: '#0A392D',
    secondary: '#49766F',
    secondaryContainer: '#D1E8E3',
    tertiary: '#6A6551',
    background: '#F7F5EF',
    surface: '#FFFCF7',
    surfaceVariant: '#EAECE6',
    surfaceDisabled: '#DDDCD6',
    onSurface: '#1B201D',
    onSurfaceVariant: '#5D6661',
    outline: '#7A8580',
    outlineVariant: '#D8DDD8',
    error: '#B3524E',
    errorContainer: '#FFDAD7',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#F5F7F1',
      level2: '#EEF3EC',
      level3: '#E7EEE7',
    },
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      ...MD3LightTheme.fonts.default,
      fontFamily: 'Roboto_400Regular',
    },
  },
  appColors: {
    success: '#2D7258',
    successContainer: '#D8F2E5',
    warning: '#9A681C',
    warningContainer: '#FBE9C8',
    info: '#35736C',
    premium: '#8A681E',
    premiumContainer: '#F7E8B7',
    heroStart: '#174A3C',
    heroEnd: '#2D7165',
  },
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  roundness: designTokens.radius.md,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#9AD7C4',
    onPrimary: '#07382C',
    primaryContainer: '#1C5142',
    onPrimaryContainer: '#CDE9DE',
    secondary: '#AFCEC7',
    secondaryContainer: '#304E48',
    tertiary: '#D3C9A8',
    background: '#111714',
    surface: '#18201C',
    surfaceVariant: '#27322D',
    onSurface: '#E4EAE5',
    onSurfaceVariant: '#BBC6C0',
    outline: '#87938D',
    outlineVariant: '#39453F',
    error: '#FFB4AF',
    errorContainer: '#733330',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#1B2520',
      level2: '#202C26',
      level3: '#26332C',
    },
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    default: {
      ...MD3DarkTheme.fonts.default,
      fontFamily: 'Roboto_400Regular',
    },
  },
  appColors: {
    success: '#8ED3B2',
    successContainer: '#1A4F3C',
    warning: '#E9C176',
    warningContainer: '#563F17',
    info: '#92D4CB',
    premium: '#E7C76C',
    premiumContainer: '#4F421D',
    heroStart: '#173E34',
    heroEnd: '#245B52',
  },
};
