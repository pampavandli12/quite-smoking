import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  SymbolView,
  type SFSymbol,
  type SymbolWeight,
} from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import type { IconSource } from 'react-native-paper/lib/typescript/components/Icon';

type MaterialCommunityIconName = ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

type SymbolDefinition = {
  sf: SFSymbol;
  sfFilled?: SFSymbol;
  fallback: MaterialCommunityIconName;
  fallbackFilled?: MaterialCommunityIconName;
};

export const appSymbolCatalog = {
  'account-group-outline': { sf: 'person.2', fallback: 'account-group-outline' },
  'alert-circle-outline': { sf: 'exclamationmark.circle', fallback: 'alert-circle-outline' },
  'bell-outline': { sf: 'bell', fallback: 'bell-outline' },
  'calendar-check': { sf: 'calendar.badge.checkmark', fallback: 'calendar-check' },
  'calendar-heart': { sf: 'heart.text.square', fallback: 'calendar-heart' },
  'calendar-today': { sf: 'calendar', fallback: 'calendar-today' },
  'chart-line': { sf: 'chart.xyaxis.line', fallback: 'chart-line' },
  'chart-line-variant': { sf: 'chart.line.uptrend.xyaxis', fallback: 'chart-line-variant' },
  'chart-timeline-variant': { sf: 'chart.xyaxis.line', fallback: 'chart-timeline-variant' },
  check: { sf: 'checkmark', fallback: 'check' },
  'chevron-down': { sf: 'chevron.down', fallback: 'chevron-down' },
  'chevron-left': { sf: 'chevron.left', fallback: 'chevron-left' },
  'chevron-right': { sf: 'chevron.right', fallback: 'chevron-right' },
  'chevron-up': { sf: 'chevron.up', fallback: 'chevron-up' },
  'clock-outline': { sf: 'clock', fallback: 'clock-outline' },
  close: { sf: 'xmark', fallback: 'close' },
  'cloud-alert-outline': { sf: 'exclamationmark.icloud', fallback: 'cloud-alert-outline' },
  coffee: { sf: 'cup.and.saucer', fallback: 'coffee' },
  counter: { sf: 'number', fallback: 'counter' },
  'credit-card-outline': { sf: 'creditcard', fallback: 'credit-card-outline' },
  crown: { sf: 'crown', sfFilled: 'crown.fill', fallback: 'crown-outline', fallbackFilled: 'crown' },
  'crown-outline': { sf: 'crown', fallback: 'crown-outline' },
  'currency-inr': { sf: 'indianrupeesign', fallback: 'currency-inr' },
  'database-alert': { sf: 'externaldrive.badge.exclamationmark', fallback: 'database-alert' },
  'database-remove-outline': {
    sf: 'externaldrive.badge.minus',
    fallback: 'database-remove-outline',
  },
  'delete-outline': { sf: 'trash', fallback: 'delete-outline' },
  'email-outline': { sf: 'envelope', fallback: 'email-outline' },
  'external-link': { sf: 'arrow.up.right.square', fallback: 'open-in-new' },
  'file-chart-outline': { sf: 'doc.text', fallback: 'file-chart-outline' },
  'file-document-outline': { sf: 'doc.text', fallback: 'file-document-outline' },
  'file-export-outline': { sf: 'square.and.arrow.up', fallback: 'file-export-outline' },
  fire: { sf: 'flame', sfFilled: 'flame.fill', fallback: 'fire', fallbackFilled: 'fire' },
  'flag-checkered': { sf: 'flag.checkered', fallback: 'flag-checkered' },
  heart: { sf: 'heart', sfFilled: 'heart.fill', fallback: 'heart-outline', fallbackFilled: 'heart' },
  'heart-outline': { sf: 'heart', fallback: 'heart-outline' },
  history: { sf: 'clock.arrow.circlepath', fallback: 'history' },
  home: { sf: 'house', sfFilled: 'house.fill', fallback: 'home-outline', fallbackFilled: 'home' },
  leaf: { sf: 'leaf', sfFilled: 'leaf.fill', fallback: 'leaf', fallbackFilled: 'leaf' },
  'leaf-circle-outline': { sf: 'leaf.circle', sfFilled: 'leaf.circle.fill', fallback: 'leaf-circle-outline', fallbackFilled: 'leaf-circle' },
  lifebuoy: { sf: 'lifepreserver', fallback: 'lifebuoy' },
  'lightbulb-on-outline': { sf: 'lightbulb', fallback: 'lightbulb-on-outline' },
  'lightbulb-outline': { sf: 'lightbulb', fallback: 'lightbulb-outline' },
  'lightning-bolt': { sf: 'bolt', fallback: 'lightning-bolt' },
  minus: { sf: 'minus', fallback: 'minus' },
  pause: { sf: 'pause', sfFilled: 'pause.fill', fallback: 'pause', fallbackFilled: 'pause' },
  play: { sf: 'play', sfFilled: 'play.fill', fallback: 'play', fallbackFilled: 'play' },
  plus: { sf: 'plus', fallback: 'plus' },
  repeat: { sf: 'repeat', fallback: 'repeat' },
  refresh: { sf: 'arrow.clockwise', fallback: 'refresh' },
  settings: { sf: 'gearshape', sfFilled: 'gearshape.fill', fallback: 'cog-outline', fallbackFilled: 'cog' },
  'shield-check-outline': { sf: 'checkmark.shield', fallback: 'shield-check-outline' },
  'shield-lock-outline': { sf: 'lock.shield', fallback: 'shield-lock-outline' },
  'silverware-fork-knife': { sf: 'fork.knife', fallback: 'silverware-fork-knife' },
  stairs: { sf: 'figure.stairs', fallback: 'stairs-up' },
  'stairs-up': { sf: 'figure.stairs', fallback: 'stairs-up' },
  stats: { sf: 'chart.bar.xaxis', sfFilled: 'chart.bar.fill', fallback: 'chart-box-outline', fallbackFilled: 'chart-box' },
  'store-alert-outline': { sf: 'storefront', fallback: 'store-alert-outline' },
  tune: { sf: 'slider.horizontal.3', fallback: 'tune' },
  vibrate: { sf: 'iphone.radiowaves.left.and.right', fallback: 'vibrate' },
  'wallet-outline': { sf: 'creditcard', fallback: 'wallet-outline' },
  'water-outline': { sf: 'drop', fallback: 'water-outline' },
  'weather-sunset-up': { sf: 'sunrise', fallback: 'weather-sunset-up' },
} as const satisfies Record<string, SymbolDefinition>;

export type AppSymbolName = keyof typeof appSymbolCatalog;

export type AppSymbolProps = {
  name: AppSymbolName;
  size: number;
  color?: ColorValue;
  weight?: SymbolWeight;
  filled?: boolean;
  testID?: string;
};

export function resolveAppSymbol(name: AppSymbolName, filled = false) {
  const definition: SymbolDefinition = appSymbolCatalog[name];
  return {
    sf: filled && definition.sfFilled ? definition.sfFilled : definition.sf,
    fallback:
      filled && definition.fallbackFilled
        ? definition.fallbackFilled
        : definition.fallback,
  };
}

export function AppSymbol({
  name,
  size,
  color,
  weight = 'regular',
  filled = false,
  testID,
}: AppSymbolProps) {
  const symbol = resolveAppSymbol(name, filled);
  return (
    <SymbolView
      accessibilityElementsHidden
      importantForAccessibility='no'
      name={symbol.sf}
      size={size}
      tintColor={color}
      weight={weight}
      testID={testID}
      fallback={
        <MaterialCommunityIcons
          accessibilityElementsHidden
          importantForAccessibility='no'
          name={symbol.fallback}
          size={size}
          color={color}
          testID={testID}
        />
      }
    />
  );
}

export function appSymbolSource(
  name: AppSymbolName,
  options?: Pick<AppSymbolProps, 'filled' | 'weight'>,
): IconSource {
  const SymbolIcon = ({ size, color }: { size: number; color: string }) => (
    <AppSymbol
      name={name}
      size={size}
      color={color}
      filled={options?.filled}
      weight={options?.weight}
    />
  );
  return SymbolIcon;
}
