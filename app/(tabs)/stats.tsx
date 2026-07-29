import {
  getDetailedWeeklyBreakdown,
  getTodayStats,
  getSmokingSettings,
  getTop5Triggers,
  getTopTrigger,
  getYesterdayStats,
  type TriggerCountRow,
} from '@/db';
import StatsTimelineChart, {
  type StatsPeriod,
} from '@/components/StatsTimelineChart';
import { AppSymbol } from '@/components/AppSymbol';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getComparisonLabel,
  getCurrentPeriodLabel,
  getPercentageChange,
  type DetailedWeeklyBreakdownItem,
  type SmokingBaseline,
} from '@/utils/statistics';
import { measureDevelopmentAsync } from '@/utils/developmentPerformance';
import {
  DailyBreakdownSection,
  TopTriggersSection,
} from '@/components/StatsBreakdownSections';
import { loadTimeline } from '@/services/statsTimeline';
import { resolveFeatureAccess } from '@/services/accessService';
import { router } from 'expo-router';
import AdvancedInsights from '@/components/AdvancedInsights';
import { PremiumCard, SkeletonCard } from '@/components/ui';

const fallbackMessages = [
  'Every recorded choice helps you understand your pattern.',
  'Pause and notice what was happening before each recorded moment.',
  'Small, repeatable changes can make your plan easier to follow.',
  'A difficult day does not erase the information you have gathered.',
  'Keep tracking without judgment and adjust one step at a time.',
];

function getProgressMessage(today: number, yesterday: number) {
  if (today < yesterday) {
    return 'You recorded fewer cigarettes today than yesterday. Small changes add up.';
  }

  if (today > yesterday) {
    return 'Today had more recorded moments. Your plan continues—notice what was happening around them.';
  }

  return 'Today matches yesterday. Keep observing your patterns without judgment.';
}

function getTriggerMessage(trigger: string) {
  switch (trigger) {
    case 'stress':
      return 'Stress seems to be your biggest trigger. Try deep breathing or a short walk instead 🧘';
    case 'coffee':
      return 'Coffee often makes you want to smoke. How about switching to tea once a day? ☕➡️🍵';
    case 'alcohol':
      return "Alcohol is a strong trigger for smoking. Plan ahead if you're going out 🍺";
    case 'after meals':
      return 'Smoking after meals is common. Try brushing your teeth or chewing gum instead 🪥';
    case 'boredom':
      return 'Boredom is a sneaky trigger. Keep your hands busy with a quick hobby or game 🎮';
    case 'work pressure':
      return 'Work pressure often drives smoking. Step away for a 2-minute walk instead 🚶';
    case 'driving':
      return 'Driving can be a strong trigger. Keep sugar-free mints in your car 🚗';
    case 'phone scrolling / gaming':
      return 'Scrolling or gaming often pairs with smoking. Try short breaks without a cigarette 📱';
    case 'anxiety':
      return 'Anxiety can make you reach for cigarettes. Try a 5-minute meditation instead 🧘';
    case 'social situations':
      return 'Social situations can be tough. Plan your response ahead of time 👥';
    default:
      return `Looks like "${trigger}" is your top trigger. Can you think of a healthy alternative? 💡`;
  }
}

function getFallbackMessage() {
  return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
}

export default function StatsPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>('week');
  const [currentTotal, setCurrentTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [dailyBreakdown, setDailyBreakdown] = useState<
    DetailedWeeklyBreakdownItem[]
  >([]);
  const [healthInsight, setHealthInsight] = useState('');
  const [topTriggers, setTopTriggers] = useState<TriggerCountRow[]>([]);
  const [chartData, setChartData] = useState<number[]>([0]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [timelineError, setTimelineError] = useState('');
  const [smokingSettings, setSmokingSettings] =
    useState<SmokingBaseline | null>(null);
  const statsRequestId = useRef(0);
  const hasLoadedRef = useRef(false);
  const percentageChange = getPercentageChange(currentTotal, previousTotal);

  // Load stats from database
  const loadStats = useCallback(async () => {
    const requestId = ++statsRequestId.current;
    if (!hasLoadedRef.current) {
      setInitialLoading(true);
    }
    setTimelineError('');

    try {
      await measureDevelopmentAsync(
        `StatsPage load (${selectedPeriod})`,
        async () => {
        const loadChart = async () => {
          try {
            const timeline = await loadTimeline(selectedPeriod);

            if (requestId === statsRequestId.current) {
              setCurrentTotal(timeline.currentTotal);
              setPreviousTotal(timeline.previousTotal);
              setChartData(timeline.data);
            }
          } catch (error) {
            console.error('Error loading timeline chart:', error);

            if (requestId === statsRequestId.current) {
              setTimelineError(
                'Your timeline could not be refreshed. Try again in a moment.',
              );
            }
          }
        };

        const loadDetails = async () => {
          try {
            if (selectedPeriod === 'week') {
              const [breakdown, triggers] = await Promise.all([
                getDetailedWeeklyBreakdown(),
                getTop5Triggers(),
              ]);

              if (requestId !== statsRequestId.current) {
                return;
              }

              setDailyBreakdown(breakdown);
              setTopTriggers(triggers);
            } else {
              if (requestId !== statsRequestId.current) {
                return;
              }
            }

            const [today, yesterday, topTrigger, settings] = await Promise.all([
              getTodayStats(),
              getYesterdayStats(),
              getTopTrigger(),
              getSmokingSettings(),
            ]);

            if (requestId !== statsRequestId.current) {
              return;
            }

            setHealthInsight(
              today > 0 || yesterday > 0
                ? getProgressMessage(today, yesterday)
                : topTrigger
                  ? getTriggerMessage(topTrigger)
                  : getFallbackMessage(),
            );
            setSmokingSettings(settings ?? null);
          } catch (error) {
            console.error('Error loading stats:', error);
          }
        };

        if (selectedPeriod !== 'week') {
          if (requestId === statsRequestId.current) {
            // Preserve the original immediate clearing before insight loading.
            setDailyBreakdown([]);
            setTopTriggers([]);
          }
        }

          await Promise.all([loadChart(), loadDetails()]);
        },
      );
    } finally {
      if (requestId === statsRequestId.current) {
        hasLoadedRef.current = true;
        setInitialLoading(false);
      }
    }
  }, [selectedPeriod]);

  // Load on initial focus and reload whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      loadStats();

      return () => {
        statsRequestId.current += 1;
      };
    }, [loadStats]),
  );

  const handlePeriodChange = useCallback(async (period: StatsPeriod) => {
    if (period !== 'week') {
      const access = await resolveFeatureAccess();
      if (!access.canViewFullExistingStats) {
        router.push('/?paywall=true');
        return;
      }
    }
    setSelectedPeriod(period);
  }, []);

  const comparisonLabel = getComparisonLabel(selectedPeriod);
  const currentPeriodLabel = getCurrentPeriodLabel(selectedPeriod);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 120,
      }}
    >
      <Surface style={styles.content} elevation={0}>
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Text variant='headlineSmall' style={styles.headerTitle}>
            Your progress
          </Text>
          <Text variant='bodyMedium' style={styles.headerSubtitle}>
            Patterns and wins from your local data
          </Text>
        </Surface>

        {initialLoading ? (
          <Surface style={styles.loadingGroup} elevation={0}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </Surface>
        ) : (
          <>
            {!!timelineError && (
              <PremiumCard style={styles.errorCard}>
                <Surface style={styles.errorRow} elevation={0}>
                  <AppSymbol
                    name='cloud-alert-outline'
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <View style={styles.errorCopy}>
                    <Text variant='titleSmall'>Progress needs a moment</Text>
                    <Text
                      variant='bodySmall'
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {timelineError}
                    </Text>
                  </View>
                  <Button compact mode='text' onPress={loadStats}>
                    Retry
                  </Button>
                </Surface>
              </PremiumCard>
            )}
            <StatsTimelineChart
              chartData={chartData}
              currentTotal={currentTotal}
              onPeriodChange={handlePeriodChange}
              period={selectedPeriod}
              previousTotal={previousTotal}
              smokingSettings={smokingSettings}
            />
          </>
        )}

        <AdvancedInsights />

        {selectedPeriod === 'week' && (
          <>
            <TopTriggersSection triggers={topTriggers} />
            <DailyBreakdownSection breakdown={dailyBreakdown} />
          </>
        )}

        {/* Your Goals */}
        <Card
          mode='contained'
          style={[
            styles.goalCard,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Card.Content>
            <Surface style={styles.goalHeader} elevation={0}>
              <Text variant='titleLarge' style={styles.goalTitle}>
                Your goals
              </Text>
              {previousTotal > 0 && (
                <Surface
                  style={[
                    styles.goalBadge,
                    { borderColor: theme.colors.primary },
                  ]}
                  elevation={0}
                >
                  <Text
                    variant='titleMedium'
                    style={[
                      styles.goalPercentage,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {Math.abs(percentageChange)}%
                  </Text>
                </Surface>
              )}
            </Surface>

            {previousTotal > 0 ? (
              <>
                <Text variant='bodyLarge' style={styles.goalDescription}>
                  {Math.abs(percentageChange)}%{' '}
                  {percentageChange < 0 ? 'less' : 'more'} than{' '}
                  {comparisonLabel}
                </Text>
                <Text
                  variant='bodyMedium'
                  style={[
                    styles.goalStatus,
                    {
                      color: percentageChange <= 0
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {percentageChange <= 0 ? 'Moving gently forward' : 'Your plan continues'}
                </Text>
              </>
            ) : (
              <Text variant='bodyLarge' style={styles.goalDescription}>
                {currentTotal > 0
                  ? `You've logged ${currentTotal} ${
                      currentTotal === 1 ? 'cigarette' : 'cigarettes'
                    } this ${currentPeriodLabel}. Keep tracking to see your progress!`
                  : 'Start tracking to set your goals and monitor progress 📊'}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Health Insight */}
        <Card
          mode='contained'
          style={[
            styles.insightCard,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Card.Content>
            <Surface style={styles.insightHeader} elevation={0}>
              <AppSymbol
                name='lightbulb-outline'
                size={20}
                color={theme.colors.primary}
              />
              <Text variant='titleMedium' style={styles.insightTitle}>
                Helpful insight
              </Text>
            </Surface>
            <Text variant='bodyMedium' style={styles.insightText}>
              {healthInsight ||
                'Track your progress to get personalized insights 💡'}
            </Text>
          </Card.Content>
        </Card>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  header: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  loadingGroup: {
    backgroundColor: 'transparent',
    gap: 12,
    marginBottom: 24,
  },
  errorCard: {
    marginBottom: 12,
  },
  errorRow: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
  },
  errorCopy: {
    flex: 1,
    minWidth: 0,
  },
  goalCard: {
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
    borderRadius: 22,
    overflow: 'hidden',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  goalTitle: {
    fontWeight: '600',
  },
  goalBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  goalPercentage: {
    fontWeight: 'bold',
  },
  goalDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  goalStatus: {
    fontWeight: '500',
  },
  insightCard: {
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    borderRadius: 22,
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  insightTitle: {
    fontWeight: '600',
  },
  insightText: {
    lineHeight: 20,
  },
});
