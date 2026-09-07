import { designTokens, type AppTheme } from '@/app/theme';
import { AppSymbol, type AppSymbolName } from '@/components/AppSymbol';
import { useAppMotion } from '@/hooks/useAppMotion';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  Button,
  Card,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ScreenContainer({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useAppMotion();
  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.screen,
        { paddingTop: insets.top + designTokens.spacing.xl },
        style,
      ]}
    >
      <Animated.View
        entering={
          reduceMotion
            ? FadeIn.duration(80)
            : FadeIn.duration(designTokens.motion.standard)
        }
      >
        {children}
      </Animated.View>
    </ScrollView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text variant='headlineMedium' style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant='bodyMedium'
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function PremiumCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <Card
      mode='contained'
      style={[
        styles.card,
        {
          backgroundColor:
            theme.colors.elevation?.level1 ?? theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        style,
      ]}
    >
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export function AnimatedPressable({
  children,
  style,
  ...props
}: Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { reduceMotion } = useAppMotion();
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.08,
    transform: [{ scale: reduceMotion ? 1 : 1 - pressed.value * 0.02 }],
  }));
  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        pressed.value = withTiming(1, { duration: designTokens.motion.fast });
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withTiming(0, { duration: designTokens.motion.fast });
        props.onPressOut?.(event);
      }}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export type MetricCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  icon: AppSymbolName;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  tone?: 'default' | 'success' | 'warning' | 'premium';
  accessibilityLabel: string;
};

export function MetricCard({
  label,
  value,
  unit,
  icon,
  trend,
  tone = 'default',
  accessibilityLabel,
}: MetricCardProps) {
  const theme = useTheme<AppTheme>();
  const color =
    tone === 'success'
      ? theme.appColors.success
      : tone === 'warning'
        ? theme.appColors.warning
        : tone === 'premium'
          ? theme.appColors.premium
          : theme.colors.primary;
  return (
    <PremiumCard style={styles.metric} >
      <View accessible accessibilityLabel={accessibilityLabel}>
        <View style={styles.metricTop}>
          <Text variant='labelLarge' style={{ color: theme.colors.onSurfaceVariant }}>
            {label}
          </Text>
          <AppSymbol name={icon} size={20} color={color} />
        </View>
        <View style={styles.metricValue}>
          <Text variant='headlineMedium' style={{ color, fontWeight: '700' }}>
            {value}
          </Text>
          {unit ? <Text variant='bodyMedium'>{unit}</Text> : null}
        </View>
        {trend ? (
          <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
            {trend.label}
          </Text>
        ) : null}
      </View>
    </PremiumCard>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text variant='titleLarge' style={{ fontWeight: '700' }}>{title}</Text>
        {subtitle ? (
          <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'premium';
}) {
  const theme = useTheme<AppTheme>();
  const palette =
    tone === 'success'
      ? [theme.appColors.successContainer, theme.appColors.success]
      : tone === 'warning'
        ? [theme.appColors.warningContainer, theme.appColors.warning]
        : tone === 'premium'
          ? [theme.appColors.premiumContainer, theme.appColors.premium]
          : [theme.colors.surfaceVariant, theme.colors.onSurfaceVariant];
  return (
    <Surface style={[styles.pill, { backgroundColor: palette[0] }]} elevation={0}>
      <Text variant='labelMedium' style={{ color: palette[1], fontWeight: '700' }}>
        {label}
      </Text>
    </Surface>
  );
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  children,
  accessibilityLabel,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={theme.colors.surfaceVariant}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          rotation='-90'
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringContent}>{children}</View>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: AppSymbolName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.state}>
      <Surface style={[styles.stateIcon, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
        <AppSymbol name={icon} size={28} color={theme.colors.primary} />
      </Surface>
      <Text variant='titleMedium' style={{ fontWeight: '700' }}>{title}</Text>
      <Text style={[styles.stateMessage, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button mode='outlined' onPress={onAction}>{actionLabel}</Button>
      ) : null}
    </View>
  );
}

export function SkeletonCard() {
  const theme = useTheme();
  return (
    <View style={[styles.skeleton, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={[styles.skeletonLine, { backgroundColor: theme.colors.outlineVariant }]} />
      <View style={[styles.skeletonLineShort, { backgroundColor: theme.colors.outlineVariant }]} />
    </View>
  );
}

export type ScreenState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'empty' }
  | { status: 'error'; message: string; retry: () => void };

export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const { reduceMotion } = useAppMotion();
  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      displayRef.current = value;
      return;
    }
    const start = displayRef.current;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / designTokens.motion.standard);
      const next = Math.round(start + (value - start) * progress);
      displayRef.current = next;
      setDisplay(next);
      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [reduceMotion, value]);
  return <>{display}</>;
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerText: { flex: 1, gap: 4 },
  title: { fontWeight: '700', letterSpacing: -0.4 },
  card: { borderRadius: designTokens.radius.lg, borderWidth: StyleSheet.hairlineWidth },
  metric: { flex: 1, minWidth: 140 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricValue: { flexDirection: 'row', gap: 4, alignItems: 'baseline', marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 14 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: designTokens.radius.pill },
  ringContent: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  state: { alignItems: 'center', padding: 28, gap: 10 },
  stateIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  stateMessage: { textAlign: 'center', lineHeight: 21, marginBottom: 6 },
  skeleton: { height: 120, borderRadius: designTokens.radius.lg, padding: 20, gap: 12 },
  skeletonLine: { height: 16, width: '70%', borderRadius: 8 },
  skeletonLineShort: { height: 12, width: '42%', borderRadius: 8 },
});
