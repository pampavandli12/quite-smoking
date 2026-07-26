import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Card, Icon, Surface, Text, useTheme } from 'react-native-paper';
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

export type { StatsPeriod } from '@/utils/statistics';

type StatsTimelineChartProps = {
  chartData: number[];
  currentTotal: number;
  onPeriodChange: (period: StatsPeriod) => void;
  period: StatsPeriod;
  previousTotal: number;
  smokingSettings: SmokingBaseline | null;
};

const EMPTY_DATA = [0];
const MONTH_LABELS = ['W1', 'W2', 'W3', 'W4'];
const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const YEAR_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getChartLabels(period: StatsPeriod) {
  if (period === 'week') {
    return WEEK_LABELS;
  }

  if (period === 'month') {
    return MONTH_LABELS;
  }

  return YEAR_LABELS;
}

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
  const [layout, setLayout] = useState<{ width: number; x: number } | null>(
    null,
  );
  const selectedIndex = PERIODS.indexOf(period);
  const animatedPosition = useSharedValue(0);

  useEffect(() => {
    if (layout) {
      animatedPosition.value = withSpring(selectedIndex * (layout.width / 3), {
        damping: 35,
        mass: 1,
        overshootClamping: false,
      });
    }
  }, [selectedIndex, layout, animatedPosition]);

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedPosition.value }],
  }));

  return (
    <Surface
      style={[
        styles.periodSelectorContainer,
        {
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
      elevation={0}
    >
      <View
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setLayout({ width, x: 0 });
        }}
        style={styles.periodSelectorWrapper}
      >
        {layout && (
          <Animated.View
            style={[
              styles.periodSelectorBackground,
              {
                width: layout.width / 3,
                backgroundColor: theme.colors.primary,
              },
              animatedBackgroundStyle,
            ]}
          />
        )}

        {PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => onPeriodChange(p)}
            style={styles.periodButton}
          >
            <Text
              variant='labelLarge'
              style={[
                styles.periodButtonText,
                {
                  color:
                    p === period
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                  fontWeight: p === period ? '700' : '500',
                },
              ]}
            >
              {PERIOD_LABELS[p]}
            </Text>
          </Pressable>
        ))}
      </View>
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
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const average = getAverage(period, currentTotal);
  const comparisonLabel = getComparisonLabel(period);
  const percentageChange = getPercentageChange(currentTotal, previousTotal);
  const { cigarettesSaved, moneySaved } = getSavings(
    smokingSettings,
    period,
    currentTotal,
  );

  const costPerCigaretteDisplay =
    smokingSettings && smokingSettings.costPerCigaretteCents
      ? (smokingSettings.costPerCigaretteCents / 100).toFixed(2)
      : '0.00';

  const chartConfig = useMemo(
    () => ({
      backgroundColor: theme.colors.surface,
      backgroundGradientFrom: theme.colors.surface,
      backgroundGradientTo: theme.colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => {
        const primary = theme.colors.primary;
        return `${primary}${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, '0')}`;
      },
      labelColor: () => theme.colors.onSurface,
      strokeWidth: 3,
      propsForBackgroundLines: {
        stroke: 'transparent',
      },
      propsForLabels: {
        fontSize: period === 'year' ? 10 : 11,
        fontWeight: '400',
      },
      propsForDots: {
        r: '5',
        strokeWidth: '3',
        stroke: theme.colors.primary,
        fill: theme.colors.surface,
      },
    }),
    [
      period,
      theme.colors.onSurface,
      theme.colors.primary,
      theme.colors.surface,
    ],
  );

  const data = useMemo(
    () => ({
      labels: getChartLabels(period),
      datasets: [
        {
          data: chartData.length > 0 ? chartData : EMPTY_DATA,
        },
      ],
    }),
    [chartData, period],
  );

  return (
    <>
      <AnimatedPeriodSelector
        period={period}
        onPeriodChange={onPeriodChange}
      />

      {/* Money Saved Card */}
      {smokingSettings &&
        (currentTotal > 0 || chartData.some((v) => v > 0)) && (
          <Card
            style={[
              styles.moneySavedCard,
              {
                backgroundColor:
                  moneySaved >= 0
                    ? theme.dark
                      ? 'rgba(76, 175, 80, 0.15)'
                      : '#E8F5E9'
                    : theme.dark
                      ? 'rgba(244, 67, 54, 0.15)'
                      : '#FFEBEE',
                marginBottom: 24,
              },
            ]}
          >
            <Card.Content>
              <View style={styles.moneySavedContent}>
                <Surface
                  style={[
                    styles.moneySavedIconContainer,
                    {
                      backgroundColor:
                        moneySaved >= 0 ? theme.colors.primary : '#F44336',
                    },
                  ]}
                  elevation={0}
                >
                  <Text style={styles.moneySavedIcon}>
                    <Icon
                      source='cash'
                      size={40}
                      color={
                        theme.dark
                          ? theme.colors.onPrimary
                          : theme.colors.surface
                      }
                    />
                  </Text>
                </Surface>

                <View style={styles.moneySavedTextContainer}>
                  <Text
                    variant='bodyMedium'
                    style={[
                      styles.moneySavedLabel,
                      { color: theme.colors.onSurface, opacity: 0.8 },
                    ]}
                  >
                    {moneySaved >= 0 ? 'Money Saved' : 'Money Spent'}{' '}
                    {period === 'week'
                      ? 'This Week'
                      : period === 'month'
                        ? 'This Month'
                        : 'This Year'}
                  </Text>
                  <Text
                    variant='displaySmall'
                    style={[
                      styles.moneySavedAmount,
                      {
                        color:
                          moneySaved >= 0 ? theme.colors.primary : '#F44336',
                      },
                    ]}
                  >
                    {moneySaved >= 0 ? '₹' : '-₹'}
                    {Math.abs(moneySaved)}
                  </Text>
                  <Text
                    variant='bodySmall'
                    style={[
                      styles.moneySavedFormula,
                      { color: theme.colors.onSurfaceVariant, opacity: 0.7 },
                    ]}
                  >
                    ₹{costPerCigaretteDisplay}/cigarette ×{' '}
                    {moneySaved >= 0 ? '' : '+'}
                    {Math.abs(cigarettesSaved)}{' '}
                    {moneySaved >= 0 ? 'avoided' : 'extra'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

      <Surface style={styles.chartContainer} elevation={0}>
        <LineChart
          data={data}
          width={width + 16}
          height={240}
          chartConfig={chartConfig}
          style={styles.chart}
          bezier
          withDots
          withShadow={false}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={false}
          withVerticalLabels
          withHorizontalLabels
          segments={4}
          fromZero
          yAxisSuffix=''
        />
      </Surface>

      <Surface style={styles.statsRow} elevation={0}>
        <Card style={styles.statCardHalf}>
          <Card.Content>
            <Text variant='bodyMedium' style={styles.statLabel}>
              {getAverageLabel(period)}
            </Text>
            <Surface style={styles.statValueRow} elevation={0}>
              <Text variant='headlineLarge' style={styles.statNumber}>
                {average}
              </Text>
              <Text variant='bodyMedium'>
                {' '}
                {average === 1 ? 'cigarette' : 'cigarettes'}
              </Text>
            </Surface>
            {previousTotal > 0 && (
              <Surface style={styles.changeRow} elevation={0}>
                <Icon
                  source={
                    percentageChange < 0 ? 'trending-down' : 'trending-up'
                  }
                  size={16}
                  color={percentageChange < 0 ? '#4CAF50' : '#F44336'}
                />
                <Text
                  variant='bodySmall'
                  style={
                    percentageChange < 0
                      ? styles.changeTextGreen
                      : styles.changeTextRed
                  }
                >
                  {percentageChange > 0 ? '+' : ''}
                  {percentageChange}% vs {comparisonLabel}
                </Text>
              </Surface>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.statCardHalf}>
          <Card.Content>
            <Text variant='bodyMedium' style={styles.statLabel}>
              {getTotalLabel(period)}
            </Text>
            <Surface style={styles.statValueRow} elevation={0}>
              <Text variant='headlineLarge' style={styles.statNumber}>
                {currentTotal}
              </Text>
              <Text variant='bodyMedium'>
                {' '}
                {currentTotal === 1 ? 'cigarette' : 'cigarettes'}
              </Text>
            </Surface>
            {previousTotal > 0 && (
              <Surface style={styles.changeRow} elevation={0}>
                <Icon
                  source={
                    percentageChange < 0 ? 'trending-down' : 'trending-up'
                  }
                  size={16}
                  color={percentageChange < 0 ? '#4CAF50' : '#F44336'}
                />
                <Text
                  variant='bodySmall'
                  style={
                    percentageChange < 0
                      ? styles.changeTextGreen
                      : styles.changeTextRed
                  }
                >
                  {percentageChange > 0 ? '+' : ''}
                  {percentageChange}% vs {comparisonLabel}
                </Text>
              </Surface>
            )}
          </Card.Content>
        </Card>
      </Surface>
    </>
  );
}

const styles = StyleSheet.create({
  periodSelectorContainer: {
    marginBottom: 20,
    borderRadius: 20,
    padding: 4,
    overflow: 'hidden',
  },
  periodSelectorWrapper: {
    flexDirection: 'row',
    height: 40,
    position: 'relative',
  },
  periodSelectorBackground: {
    position: 'absolute',
    height: 40,
    borderRadius: 16,
    top: 0,
    left: 0,
  },
  periodButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  periodButtonText: {
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 24,
    marginHorizontal: -16,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  chart: {
    marginLeft: -16,
    marginRight: -16,
    borderRadius: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  statCardHalf: {
    flex: 1,
  },
  statLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  statNumber: {
    fontWeight: 'bold',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  changeTextGreen: {
    color: '#4CAF50',
  },
  changeTextRed: {
    color: '#F44336',
  },
  moneySavedCard: {
    borderRadius: 16,
    marginBottom: 24,
  },
  moneySavedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  moneySavedIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moneySavedIcon: {
    fontSize: 28,
  },
  moneySavedTextContainer: {
    flex: 1,
  },
  moneySavedLabel: {
    marginBottom: 4,
    fontWeight: '500',
  },
  moneySavedAmount: {
    fontWeight: '700',
    marginBottom: 4,
  },
  moneySavedFormula: {
    fontWeight: '400',
  },
});
