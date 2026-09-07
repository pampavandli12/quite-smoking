import { type AppTheme } from '@/app/theme';
import { AppSymbol, type AppSymbolName } from '@/components/AppSymbol';
import { SafeLineChart, type SafeChartPoint } from '@/components/SafeCharts';
import { useAppMotion } from '@/hooks/useAppMotion';
import {
  calculateProgressAxisMax,
  calculateProgressChartLayout,
  formatProgressTooltip,
  getProgressChartFullLabel,
  getProgressChartLabels,
} from '@/utils/progressChart';
import {
  getAverage,
  getAverageLabel,
  getComparisonLabel,
  getPercentageChange,
  getSavings,
  getTotalLabel,
  type SmokingBaseline,
  type StatsPeriod,
} from '@/utils/statistics';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Card, Surface, Text, useTheme } from 'react-native-paper';

export type { StatsPeriod } from '@/utils/statistics';

type StatsTimelineChartProps = {
  chartData: number[];
  currentTotal: number;
  onPeriodChange: (period: StatsPeriod) => void;
  period: StatsPeriod;
  previousTotal: number;
  smokingSettings: SmokingBaseline | null;
};

type PeriodSelectorProps = {
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
};

const PERIODS: StatsPeriod[] = ['week', 'month', 'year'];
const PERIOD_LABELS: Record<StatsPeriod, string> = {
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

function AnimatedPeriodSelector({
  period,
  onPeriodChange,
}: PeriodSelectorProps) {
  const theme = useTheme();
  const { reduceMotion } = useAppMotion();
  const [width, setWidth] = useState(0);
  const selectedIndex = PERIODS.indexOf(period);
  const animatedPosition = useSharedValue(0);

  useEffect(() => {
    if (!width) return;
    const target = selectedIndex * (width / PERIODS.length);
    animatedPosition.value = reduceMotion
      ? withTiming(target, { duration: 80 })
      : withSpring(target, {
          damping: 24,
          mass: 0.8,
          stiffness: 220,
        });
  }, [animatedPosition, reduceMotion, selectedIndex, width]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedPosition.value }],
  }));

  return (
    <Surface
      style={[
        styles.periodSelector,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
      elevation={0}
    >
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.periodSelectorTrack}
      >
        {width > 0 && (
          <Animated.View
            style={[
              styles.periodIndicator,
              {
                backgroundColor: theme.colors.primary,
                width: width / PERIODS.length,
              },
              animatedBackgroundStyle,
            ]}
          />
        )}
        {PERIODS.map((item) => (
          <Pressable
            accessibilityRole='tab'
            accessibilityState={{ selected: item === period }}
            key={item}
            onPress={() => onPeriodChange(item)}
            style={styles.periodButton}
          >
            <Text
              variant='labelLarge'
              style={{
                color:
                  item === period
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
                fontWeight: item === period ? '700' : '500',
              }}
            >
              {PERIOD_LABELS[item]}
            </Text>
          </Pressable>
        ))}
      </View>
    </Surface>
  );
}

function SummaryCard({
  accessibilityLabel,
  icon,
  label,
  tone,
  unit,
  value,
}: {
  accessibilityLabel: string;
  icon: AppSymbolName;
  label: string;
  tone: string;
  unit: string;
  value: number;
}) {
  const theme = useTheme();
  return (
    <Card
      accessible
      accessibilityLabel={accessibilityLabel}
      mode='contained'
      style={[
        styles.summaryCard,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <Card.Content style={styles.summaryContent}>
        <View style={styles.summaryHeading}>
          <Text
            numberOfLines={2}
            variant='labelLarge'
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {label}
          </Text>
          <AppSymbol name={icon} size={20} color={tone} />
        </View>
        <Text variant='headlineLarge' style={[styles.summaryValue, { color: tone }]}>
          {value}
        </Text>
        <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
          {unit}
        </Text>
      </Card.Content>
    </Card>
  );
}

function PointTooltip({
  comparison,
  item,
}: {
  comparison: string;
  item?: SafeChartPoint;
}) {
  const theme = useTheme();
  if (!item) return null;
  const copy = formatProgressTooltip(
    item.tooltipLabel ?? item.label ?? 'Period',
    item.value,
    comparison,
  );
  return (
    <Surface
      style={[
        styles.tooltip,
        {
          backgroundColor: theme.colors.inverseSurface,
          shadowColor: theme.colors.shadow,
        },
      ]}
      elevation={3}
    >
      <Text variant='labelMedium' style={{ color: theme.colors.inverseOnSurface }}>
        {copy.title}
      </Text>
      <Text
        variant='titleSmall'
        style={[styles.tooltipValue, { color: theme.colors.inverseOnSurface }]}
      >
        {copy.value}
      </Text>
      <Text
        numberOfLines={1}
        variant='bodySmall'
        style={{ color: theme.colors.inverseOnSurface, opacity: 0.72 }}
      >
        {copy.comparison}
      </Text>
    </Surface>
  );
}

export default function StatsTimelineChart({
  chartData,
  currentTotal,
  onPeriodChange,
  period,
  previousTotal,
  smokingSettings,
}: StatsTimelineChartProps) {
  const theme = useTheme<AppTheme>();
  const { width: windowWidth } = useWindowDimensions();
  const { reduceMotion } = useAppMotion();
  const [chartWidth, setChartWidth] = useState(0);
  const average = getAverage(period, currentTotal);
  const comparisonLabel = getComparisonLabel(period);
  const percentageChange = getPercentageChange(currentTotal, previousTotal);
  const { cigarettesSaved, moneySaved } = getSavings(
    smokingSettings,
    period,
    currentTotal,
  );
  const labels = useMemo(
    () => getProgressChartLabels(period, chartWidth),
    [chartWidth, period],
  );
  const data = useMemo<SafeChartPoint[]>(
    () =>
      chartData.map((value, index) => {
        const fullLabel = getProgressChartFullLabel(period, index);
        return {
          value,
          label: labels[index] ?? '',
          tooltipLabel: fullLabel,
          accessibilityLabel: `${fullLabel}: ${value} ${
            value === 1 ? 'cigarette' : 'cigarettes'
          }`,
        };
      }),
    [chartData, labels, period],
  );
  const chartLayout = calculateProgressChartLayout(chartWidth, data.length);
  const axisMaximum = calculateProgressAxisMax(chartData);
  const hasData = chartData.some((value) => value > 0);
  const comparisonCopy =
    previousTotal > 0
      ? `${Math.abs(percentageChange)}% ${
          percentageChange <= 0 ? 'lower' : 'higher'
        } than ${comparisonLabel}`
      : `No complete ${comparisonLabel} comparison yet`;
  const timelineSummary = data
    .map((item) => item.accessibilityLabel)
    .filter(Boolean)
    .join(', ');
  const costPerCigaretteDisplay =
    smokingSettings?.costPerCigaretteCents
      ? (smokingSettings.costPerCigaretteCents / 100).toFixed(2)
      : '0.00';
  const stackSummaryCards = windowWidth < 350;

  const handleChartLayout = (event: LayoutChangeEvent) => {
    setChartWidth(Math.floor(event.nativeEvent.layout.width));
  };

  return (
    <>
      <AnimatedPeriodSelector period={period} onPeriodChange={onPeriodChange} />

      <View
        style={[
          styles.summaryRow,
          stackSummaryCards && styles.summaryRowStacked,
        ]}
      >
        <SummaryCard
          accessibilityLabel={`${average} cigarettes ${getAverageLabel(period).toLowerCase()}`}
          icon='chart-line'
          label={getAverageLabel(period)}
          tone={theme.colors.secondary}
          unit={average === 1 ? 'cigarette' : 'cigarettes'}
          value={average}
        />
        <SummaryCard
          accessibilityLabel={`${currentTotal} cigarettes ${getTotalLabel(period).toLowerCase()}`}
          icon='counter'
          label={getTotalLabel(period)}
          tone={theme.colors.primary}
          unit={currentTotal === 1 ? 'cigarette' : 'cigarettes'}
          value={currentTotal}
        />
      </View>

      {smokingSettings && (currentTotal > 0 || hasData) && (
        <Card
          mode='contained'
          style={[
            styles.savingsCard,
            {
              backgroundColor:
                moneySaved >= 0
                  ? theme.appColors.successContainer
                  : theme.appColors.warningContainer,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Card.Content style={styles.savingsContent}>
            <View
              style={[
                styles.savingsIcon,
                {
                  backgroundColor:
                    moneySaved >= 0
                      ? theme.appColors.success
                      : theme.appColors.warning,
                },
              ]}
            >
              <AppSymbol
                name='wallet-outline'
                size={28}
                color={theme.colors.surface}
              />
            </View>
            <View style={styles.savingsCopy}>
              <Text variant='labelLarge' style={{ color: theme.colors.onSurfaceVariant }}>
                {moneySaved >= 0 ? 'Estimated savings' : 'Above baseline'} ·{' '}
                {PERIOD_LABELS[period]}
              </Text>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                variant='headlineLarge'
                style={[
                  styles.savingsValue,
                  {
                    color:
                      moneySaved >= 0
                        ? theme.appColors.success
                        : theme.appColors.warning,
                  },
                ]}
              >
                {moneySaved >= 0 ? '₹' : '-₹'}
                {Math.abs(moneySaved)}
              </Text>
              <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                ₹{costPerCigaretteDisplay} × {Math.abs(cigarettesSaved)}{' '}
                {moneySaved >= 0 ? 'avoided' : 'above baseline'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      <Surface
        accessible
        accessibilityLabel={`Smoking timeline. ${timelineSummary || 'No recorded values.'}`}
        onLayout={handleChartLayout}
        style={[
          styles.chartCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        elevation={0}
      >
        <View style={styles.chartHeading}>
          <View style={styles.chartHeadingCopy}>
            <Text variant='titleMedium' style={styles.chartTitle}>
              Smoking timeline
            </Text>
            <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
              {period === 'week'
                ? 'Daily totals this week'
                : period === 'month'
                  ? 'Weekly totals this month'
                  : 'Monthly totals this year'}
            </Text>
          </View>
          <View
            style={[
              styles.chartIcon,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <AppSymbol
              name='chart-timeline-variant'
              size={21}
              color={theme.colors.secondary}
            />
          </View>
        </View>

        {!hasData ? (
          <View style={styles.chartEmpty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <AppSymbol
                name='chart-line-variant'
                size={28}
                color={theme.colors.secondary}
              />
            </View>
            <Text variant='titleSmall' style={styles.emptyTitle}>
              Not enough data yet
            </Text>
            <Text
              variant='bodySmall'
              style={[styles.emptyMessage, { color: theme.colors.onSurfaceVariant }]}
            >
              Recorded moments will form a trend here.
            </Text>
          </View>
        ) : data.length === 1 ? (
          <View style={styles.chartEmpty}>
            <Text
              variant='displaySmall'
              style={[styles.singleValue, { color: theme.colors.primary }]}
            >
              {data[0].value}
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {data[0].tooltipLabel} · keep recording to build a trend
            </Text>
          </View>
        ) : chartWidth > 0 ? (
          <SafeLineChart
            animationDuration={220}
            areaChart
            color={theme.colors.secondary}
            curvature={0.16}
            curved
            data={data}
            dataPointsColor={theme.colors.primary}
            dataPointsRadius={4}
            disableScroll
            endFillColor={theme.colors.surface}
            endOpacity={0}
            endSpacing={chartLayout.endSpacing}
            formatYLabel={(label) => String(Math.round(Number(label)))}
            height={220}
            hideRules={false}
            initialSpacing={chartLayout.initialSpacing}
            isAnimated={!reduceMotion}
            maxValue={axisMaximum}
            noOfSections={4}
            pointerConfig={{
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerColor: theme.colors.primary,
              pointerLabelComponent: (items) => (
                <PointTooltip comparison={comparisonCopy} item={items[0]} />
              ),
              pointerLabelHeight: 78,
              pointerLabelWidth: 166,
              pointerStripColor: theme.colors.outline,
              pointerStripHeight: 184,
              pointerStripWidth: 1,
              radius: 6,
            }}
            rulesColor={theme.colors.outlineVariant}
            showVerticalLines={false}
            spacing={chartLayout.spacing}
            startFillColor={theme.colors.secondaryContainer}
            startOpacity={theme.dark ? 0.22 : 0.34}
            thickness={3}
            width={chartLayout.plotWidth}
            xAxisLabelTextStyle={{
              color: theme.colors.onSurfaceVariant,
              fontSize: period === 'year' ? 9 : 11,
            }}
            xAxisThickness={0}
            yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
            yAxisThickness={0}
          />
        ) : (
          <View style={styles.chartPlaceholder} />
        )}
        {hasData && data.length > 1 && (
          <Text
            variant='bodySmall'
            style={[styles.chartHint, { color: theme.colors.onSurfaceVariant }]}
          >
            Touch and drag across the line to explore values.
          </Text>
        )}
      </Surface>
    </>
  );
}

const styles = StyleSheet.create({
  periodSelector: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 4,
  },
  periodSelectorTrack: {
    flexDirection: 'row',
    height: 44,
    position: 'relative',
  },
  periodIndicator: {
    borderRadius: 16,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  periodButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryRowStacked: {
    flexDirection: 'column',
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  summaryContent: {
    minHeight: 126,
    paddingVertical: 14,
  },
  summaryHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 38,
  },
  summaryValue: {
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginTop: 2,
  },
  savingsCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    overflow: 'hidden',
  },
  savingsContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  savingsIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  savingsCopy: {
    flex: 1,
    minWidth: 0,
  },
  savingsValue: {
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  chartCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
    overflow: 'hidden',
    paddingBottom: 14,
    paddingHorizontal: 8,
    paddingTop: 18,
  },
  chartHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 10,
  },
  chartHeadingCopy: {
    flex: 1,
    minWidth: 0,
  },
  chartTitle: {
    fontWeight: '700',
  },
  chartIcon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  chartEmpty: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
    width: 56,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptyMessage: {
    marginTop: 4,
    textAlign: 'center',
  },
  singleValue: {
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  chartPlaceholder: {
    height: 220,
  },
  chartHint: {
    paddingHorizontal: 10,
    paddingTop: 6,
    textAlign: 'center',
  },
  tooltip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: 166,
  },
  tooltipValue: {
    fontWeight: '700',
    marginVertical: 1,
  },
});
