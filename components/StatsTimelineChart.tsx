import {
  getMonthlyBreakdown,
  getPreviousWeekStats,
  getSmokingCountByDateRange,
  getWeeklyBreakdown,
  getWeekStats,
  getYearlyBreakdown,
} from '@/db';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Card, Icon, Surface, Text, useTheme } from 'react-native-paper';

export type StatsPeriod = 'week' | 'month' | 'year';

export type TimelineSummary = {
  average: number;
  comparisonLabel: string;
  currentTotal: number;
  percentageChange: number;
  period: StatsPeriod;
  previousTotal: number;
};

type StatsTimelineChartProps = {
  onSummaryChange?: (summary: TimelineSummary) => void;
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

function getRangeTotal(start: Date, end: Date) {
  return getSmokingCountByDateRange(start.toISOString(), end.toISOString());
}

async function getPreviousMonthStats() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  return getRangeTotal(start, end);
}

async function getPreviousYearStats() {
  const today = new Date();
  const start = new Date(today.getFullYear() - 1, 0, 1);
  const end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);

  return getRangeTotal(start, end);
}

function getAverage(period: StatsPeriod, total: number) {
  if (total <= 0) {
    return 0;
  }

  if (period === 'week') {
    return Math.round(total / 7);
  }

  if (period === 'month') {
    return Math.round(total / 4);
  }

  return Math.round(total / 12);
}

function getComparisonLabel(period: StatsPeriod) {
  if (period === 'week') {
    return 'last week';
  }

  if (period === 'month') {
    return 'last month';
  }

  return 'last year';
}

function getAverageLabel(period: StatsPeriod) {
  if (period === 'week') {
    return 'Daily Average';
  }

  if (period === 'month') {
    return 'Weekly Average';
  }

  return 'Monthly Average';
}

function getTotalLabel(period: StatsPeriod) {
  if (period === 'week') {
    return 'Total This Week';
  }

  if (period === 'month') {
    return 'Total This Month';
  }

  return 'Total This Year';
}

async function loadTimeline(period: StatsPeriod) {
  if (period === 'week') {
    const [currentTotal, previousTotal, data] = await Promise.all([
      getWeekStats(),
      getPreviousWeekStats(),
      getWeeklyBreakdown(),
    ]);

    return { currentTotal, previousTotal, data };
  }

  if (period === 'month') {
    const [data, previousTotal] = await Promise.all([
      getMonthlyBreakdown(),
      getPreviousMonthStats(),
    ]);

    return {
      currentTotal: data.reduce((sum, value) => sum + value, 0),
      previousTotal,
      data,
    };
  }

  const [data, previousTotal] = await Promise.all([
    getYearlyBreakdown(),
    getPreviousYearStats(),
  ]);

  return {
    currentTotal: data.reduce((sum, value) => sum + value, 0),
    previousTotal,
    data,
  };
}

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
  onSummaryChange,
}: StatsTimelineChartProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [currentTotal, setCurrentTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [chartData, setChartData] = useState<number[]>(EMPTY_DATA);

  const average = getAverage(period, currentTotal);
  const comparisonLabel = getComparisonLabel(period);
  const percentageChange =
    previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0;

  const summary = useMemo(
    () => ({
      average,
      comparisonLabel,
      currentTotal,
      percentageChange,
      period,
      previousTotal,
    }),
    [
      average,
      comparisonLabel,
      currentTotal,
      percentageChange,
      period,
      previousTotal,
    ],
  );

  const loadChart = useCallback(async () => {
    try {
      const timeline = await loadTimeline(period);
      setCurrentTotal(timeline.currentTotal);
      setPreviousTotal(timeline.previousTotal);
      setChartData(timeline.data);
    } catch (error) {
      console.error('Error loading timeline chart:', error);
      setCurrentTotal(0);
      setPreviousTotal(0);
      setChartData(EMPTY_DATA);
    }
  }, [period]);

  useEffect(() => {
    loadChart();
  }, [loadChart]);

  useFocusEffect(
    useCallback(() => {
      loadChart();
    }, [loadChart]),
  );

  useEffect(() => {
    onSummaryChange?.(summary);
  }, [onSummaryChange, summary]);

  const chartConfig = {
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
  };

  const data = {
    labels: getChartLabels(period),
    datasets: [
      {
        data: chartData.length > 0 ? chartData : EMPTY_DATA,
      },
    ],
  };

  return (
    <>
      <AnimatedPeriodSelector period={period} onPeriodChange={setPeriod} />

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
});
