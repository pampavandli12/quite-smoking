import { requireOptionalNativeModule } from 'expo-modules-core';
import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export type SafeChartPoint = {
  value: number;
  label?: string;
  dataPointText?: string;
  accessibilityLabel?: string;
  frontColor?: string;
  tooltipLabel?: string;
};

export type SafeLinePointerConfig = {
  activatePointersOnLongPress?: boolean;
  autoAdjustPointerLabelPosition?: boolean;
  pointerColor?: string;
  pointerLabelComponent?: (items: SafeChartPoint[]) => ReactNode;
  pointerLabelHeight?: number;
  pointerLabelWidth?: number;
  pointerStripColor?: string;
  pointerStripHeight?: number;
  pointerStripWidth?: number;
  radius?: number;
};

type LineProps = {
  data: SafeChartPoint[];
  height: number;
  color: string;
  dataPointsColor: string;
  thickness: number;
  curved: boolean;
  initialSpacing: number;
  endSpacing: number;
  spacing: number;
  noOfSections: number;
  yAxisThickness: number;
  xAxisThickness: number;
  rulesColor: string;
  yAxisTextStyle: object;
  xAxisLabelTextStyle: object;
  isAnimated: boolean;
  animationDuration: number;
  showVerticalLines: boolean;
  hideRules: boolean;
  maxValue: number;
  width?: number;
  adjustToWidth?: boolean;
  areaChart?: boolean;
  curvature?: number;
  dataPointsRadius?: number;
  startFillColor?: string;
  endFillColor?: string;
  startOpacity?: number;
  endOpacity?: number;
  disableScroll?: boolean;
  formatYLabel?: (label: string) => string;
  pointerConfig?: SafeLinePointerConfig;
};

type BarProps = {
  data: SafeChartPoint[];
  height: number;
  barWidth: number;
  spacing: number;
  yAxisThickness: number;
  xAxisThickness: number;
  noOfSections: number;
  isAnimated: boolean;
};

type GiftedModule = {
  LineChart: ComponentType<LineProps>;
  BarChart: ComponentType<BarProps>;
};

function getGiftedCharts(): GiftedModule | null {
  if (!requireOptionalNativeModule('ExpoLinearGradient')) {
    return null;
  }

  // Deliberately lazy: older development clients do not contain ExpoLinearGradient.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-gifted-charts') as GiftedModule;
}

function ChartFallback({
  data,
  height,
}: {
  data: SafeChartPoint[];
  height: number;
}) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <View
      accessible
      accessibilityLabel={data
        .map((point) => point.accessibilityLabel ?? `${point.label}: ${point.value}`)
        .join(', ')}
      style={[styles.fallback, { height }]}
    >
      {data.map((point, index) => (
        <View key={`${point.label}-${index}`} style={styles.column}>
          <Text variant='labelSmall'>{point.value}</Text>
          <View
            style={[
              styles.bar,
              {
                backgroundColor: point.frontColor ?? theme.colors.primary,
                height: Math.max(2, (point.value / max) * (height - 48)),
              },
            ]}
          />
          <Text numberOfLines={1} variant='labelSmall'>
            {point.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SafeLineChart(props: LineProps) {
  const gifted = getGiftedCharts();
  return gifted ? (
    <gifted.LineChart {...props} />
  ) : (
    <ChartFallback data={props.data} height={props.height} />
  );
}

export function SafeBarChart(props: BarProps) {
  const gifted = getGiftedCharts();
  return gifted ? <gifted.BarChart {...props} /> : <ChartFallback data={props.data} height={props.height} />;
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    minWidth: 18,
  },
  bar: {
    borderRadius: 5,
    marginVertical: 4,
    maxWidth: 34,
    width: '70%',
  },
});
