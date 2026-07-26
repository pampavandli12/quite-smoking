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
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Card, Icon, Surface, Text, useTheme } from 'react-native-paper';
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

const fallbackMessages = [
  'Every cigarette skipped is a victory 🏆',
  'Within 20 minutes of not smoking, your heart rate drops ❤️',
  'Your lungs start to heal the moment you reduce smoking 🫁',
  "You're stronger than your cravings 💪",
  'Small steps every day lead to big changes 🌟',
];

function getProgressMessage(today: number, yesterday: number) {
  if (today < yesterday) {
    return 'Great job! You smoked fewer cigarettes today than yesterday 🎉';
  }

  if (today > yesterday) {
    return 'You smoked more today than yesterday. Think about what triggered it 💭';
  }

  return 'Consistent! You smoked the same as yesterday. Try to cut down tomorrow 💪';
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
  const [smokingSettings, setSmokingSettings] =
    useState<SmokingBaseline | null>(null);
  const statsRequestId = useRef(0);
  const percentageChange = getPercentageChange(currentTotal, previousTotal);

  // Load stats from database
  const loadStats = useCallback(async () => {
    const requestId = ++statsRequestId.current;

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
              setCurrentTotal(0);
              setPreviousTotal(0);
              setChartData([0]);
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

            const [today, yesterday, topTrigger] = await Promise.all([
              getTodayStats(),
              getYesterdayStats(),
              getTopTrigger(),
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
  }, [selectedPeriod]);

  // Preserve the chart's original mount-only settings refresh behavior.
  useEffect(() => {
    getSmokingSettings()
      .then((settings) => {
        if (settings) {
          setSmokingSettings(settings);
        }
      })
      .catch((error) => {
        console.error('Error loading smoking settings:', error);
      });
  }, []);

  // Load on initial focus and reload whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      loadStats();

      return () => {
        statsRequestId.current += 1;
      };
    }, [loadStats]),
  );

  const handlePeriodChange = useCallback((period: StatsPeriod) => {
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
            Smoking Statistics
          </Text>
          <Text variant='bodyMedium' style={styles.headerSubtitle}>
            Track your progress
          </Text>
        </Surface>

        <StatsTimelineChart
          chartData={chartData}
          currentTotal={currentTotal}
          onPeriodChange={handlePeriodChange}
          period={selectedPeriod}
          previousTotal={previousTotal}
          smokingSettings={smokingSettings}
        />

        {selectedPeriod === 'week' && (
          <>
            <TopTriggersSection triggers={topTriggers} />
            <DailyBreakdownSection breakdown={dailyBreakdown} />
          </>
        )}

        {/* Your Goals */}
        <Card style={styles.goalCard}>
          <Card.Content>
            <Surface style={styles.goalHeader} elevation={0}>
              <Text variant='titleLarge' style={styles.goalTitle}>
                Your Goals
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
                    { color: percentageChange <= 0 ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  {percentageChange <= 0 ? 'On track' : 'Need improvement'}
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
          style={[
            styles.insightCard,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Card.Content>
            <Surface style={styles.insightHeader} elevation={0}>
              <Icon
                source='lightbulb-outline'
                size={20}
                color={theme.colors.primary}
              />
              <Text variant='titleMedium' style={styles.insightTitle}>
                Health Insight
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
  goalCard: {
    marginBottom: 24,
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
    marginBottom: 16,
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
