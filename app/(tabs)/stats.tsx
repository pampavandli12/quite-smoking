import {
  getDetailedWeeklyBreakdown,
  getTodayStats,
  getTop5Triggers,
  getTopTrigger,
  getYesterdayStats,
  type DetailedWeeklyBreakdownItem,
  type TriggerCountRow,
} from '@/db';
import StatsTimelineChart, {
  type StatsPeriod,
  type TimelineSummary,
} from '@/components/StatsTimelineChart';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

function getComparisonLabel(period: StatsPeriod) {
  return period === 'week'
    ? 'last week'
    : period === 'month'
      ? 'last month'
      : 'last year';
}

function getCurrentPeriodLabel(period: StatsPeriod) {
  return period === 'week' ? 'week' : period === 'month' ? 'month' : 'year';
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
  const percentageChange =
    previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : 0;

  // Generate health insight
  const generateHealthInsight = useCallback(async () => {
    try {
      const [today, yesterday, topTrigger] = await Promise.all([
        getTodayStats(),
        getYesterdayStats(),
        getTopTrigger(),
      ]);

      // Priority 1: Progress message if there's data
      if (today > 0 || yesterday > 0) {
        setHealthInsight(getProgressMessage(today, yesterday));
        return;
      }

      // Priority 2: Trigger message if there's a top trigger
      if (topTrigger) {
        setHealthInsight(getTriggerMessage(topTrigger));
        return;
      }

      // Priority 3: Fallback message
      setHealthInsight(getFallbackMessage());
    } catch (error) {
      console.error('Error generating health insight:', error);
      setHealthInsight(getFallbackMessage());
    }
  }, []);

  // Load stats from database
  const loadStats = useCallback(async () => {
    try {
      if (selectedPeriod === 'week') {
        const [breakdown, triggers] = await Promise.all([
          getDetailedWeeklyBreakdown(),
          getTop5Triggers(),
        ]);

        setDailyBreakdown(breakdown);
        setTopTriggers(triggers);
      } else {
        setDailyBreakdown([]);
        setTopTriggers([]);
      }

      // Generate health insight
      await generateHealthInsight();
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [generateHealthInsight, selectedPeriod]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reload stats when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const handleTimelineSummaryChange = useCallback(
    (summary: TimelineSummary) => {
      setSelectedPeriod(summary.period);
      setCurrentTotal(summary.currentTotal);
      setPreviousTotal(summary.previousTotal);
    },
    [],
  );

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

        <StatsTimelineChart onSummaryChange={handleTimelineSummaryChange} />

        {/* Top Triggers - Only for week view */}
        {selectedPeriod === 'week' && topTriggers.length > 0 && (
          <Surface style={styles.section} elevation={0}>
            <Text variant='titleLarge' style={styles.sectionTitle}>
              Top Triggers
            </Text>
            <Text variant='bodyMedium' style={styles.sectionSubtitle}>
              What makes you reach for a cigarette
            </Text>

            {topTriggers.map((item, index) => (
              <Card key={index} style={styles.triggerCard}>
                <Card.Content style={styles.triggerCardContent}>
                  <Surface style={styles.triggerLeft} elevation={0}>
                    <Surface style={styles.triggerRank} elevation={0}>
                      <Text variant='bodyMedium' style={styles.triggerRankText}>
                        {index + 1}
                      </Text>
                    </Surface>
                    <Text variant='bodyLarge' style={styles.triggerName}>
                      {item.trigger}
                    </Text>
                  </Surface>
                  <Surface style={styles.triggerRight} elevation={0}>
                    <Surface
                      style={styles.triggerProgressBarContainer}
                      elevation={0}
                    >
                      <View
                        style={[
                          styles.triggerProgressBarFilled,
                          {
                            width: `${(item.count / (topTriggers[0]?.count || 1)) * 100}%`,
                          },
                        ]}
                      />
                    </Surface>
                    <Text variant='titleMedium' style={styles.triggerCount}>
                      {item.count}
                    </Text>
                  </Surface>
                </Card.Content>
              </Card>
            ))}
          </Surface>
        )}

        {/* Daily Breakdown - Only for week view */}
        {selectedPeriod === 'week' && dailyBreakdown.length > 0 && (
          <Surface style={styles.section} elevation={0}>
            <Text variant='titleLarge' style={styles.sectionTitle}>
              Daily Breakdown
            </Text>

            {dailyBreakdown.map((item, index) => (
              <Card key={index} style={styles.dayCard}>
                <Card.Content style={styles.dayCardContent}>
                  <Surface style={styles.dayLeft} elevation={0}>
                    <Text variant='bodyLarge' style={styles.dayName}>
                      {item.day}
                    </Text>
                    <Text variant='bodySmall' style={styles.dayDate}>
                      {item.date}
                    </Text>
                  </Surface>
                  <Surface style={styles.dayRight} elevation={0}>
                    <Surface style={styles.progressBarContainer} elevation={0}>
                      <View
                        style={[
                          styles.progressBarFilled,
                          { width: `${item.progress * 100}%` },
                        ]}
                      />
                    </Surface>
                    <Text variant='titleMedium' style={styles.dayCount}>
                      {item.count}
                    </Text>
                  </Surface>
                </Card.Content>
              </Card>
            ))}
          </Surface>
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
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
  triggerCard: {
    marginBottom: 12,
  },
  triggerCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  triggerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerRankText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  triggerName: {
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  triggerProgressBarContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  triggerProgressBarFilled: {
    height: '100%',
    backgroundColor: '#4285F4',
    borderRadius: 6,
  },
  triggerCount: {
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
    color: '#4285F4',
  },
  dayCard: {
    marginBottom: 12,
  },
  dayCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLeft: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dayName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  dayDate: {
    opacity: 0.6,
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1.8,
    backgroundColor: 'transparent',
  },
  progressBarContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: '#4285F4',
    borderRadius: 6,
  },
  dayCount: {
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
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
