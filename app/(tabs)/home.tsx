import {
  getTodayLogs,
  getTodayStats,
  getWeeklyBreakdown,
  getYesterdayStats,
  logSmokingEvent,
  getNonSmokingStreak,
  type SmokingLogTimestampRow,
} from '@/db';
import TriggerBottomSheet from '@/components/TriggerBottomSheet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Icon,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatSmokingLogTime(log: SmokingLogTimestampRow) {
  return new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCigaretteCount(count: number) {
  return `${count} ${count === 1 ? 'cigarette' : 'cigarettes'}`;
}

export default function HomePage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [todayCount, setTodayCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [todayLogs, setTodayLogs] = useState<SmokingLogTimestampRow[]>([]);
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [isTriggerSheetVisible, setIsTriggerSheetVisible] = useState(false);
  const weeklyTotal = useMemo(
    () => weeklyData.reduce((total, count) => total + count, 0),
    [weeklyData],
  );
  const weeklyAverage =
    weeklyData.length > 0 ? Math.round(weeklyTotal / 7) : 0;

  // Load data from database
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const [today, yesterday, logs, weekly, streakDays] = await Promise.all([
        getTodayStats(),
        getYesterdayStats(),
        getTodayLogs(),
        getWeeklyBreakdown(),
        getNonSmokingStreak(),
      ]);

      setTodayCount(today);
      setYesterdayCount(yesterday);
      setTodayLogs(logs);
      setWeeklyData(weekly);
      setStreak(streakDays);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTriggerSelect = useCallback(
    async (trigger?: string) => {
      try {
        setLogging(true);
        const result = await logSmokingEvent(trigger ? [trigger] : []);

        if (result.success) {
          setIsTriggerSheetVisible(false); // Reset streak to 0 when logging a cigarette
          setStreak(0);
          await loadStats();
        }
      } catch (error) {
        console.error('Error logging smoking event:', error);
      } finally {
        setLogging(false);
      }
    },
    [loadStats],
  );

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: 32,
      }}
    >
      <Surface style={styles.content} elevation={0}>
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Text variant='headlineSmall' style={styles.headerTitle}>
            Smoke Track
          </Text>
        </Surface>

        {/* Today's Count Card */}

        <Card style={styles.todayCard}>
          <Card.Content>
            <Surface style={styles.todayContent} elevation={0}>
              <Surface style={styles.todayLeft} elevation={0}>
                <Text variant='bodyMedium' style={styles.todayLabel}>
                  Today&apos;s Count
                </Text>

                <Text variant='displaySmall' style={styles.todayCount}>
                  {todayCount}
                </Text>
              </Surface>
            </Surface>
          </Card.Content>
        </Card>

        {/* Streak card */}
        <Card style={styles.streakCard}>
          <Card.Content>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Icon source='fire' size={40} color={theme.colors.primary} />
              <View>
                <Text variant='titleMedium' style={styles.streakLabel}>
                  Current Streak
                </Text>
                <Text variant='displaySmall' style={styles.streakCount}>
                  {streak}
                </Text>
                <Text variant='bodySmall' style={{ opacity: 0.7 }}>
                  {streak} day{streak !== 1 ? 's' : ''} smoke-free
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Log Smoking Button */}
        <Button
          mode='contained'
          style={styles.logButton}
          contentStyle={styles.logButtonContent}
          icon='plus'
          onPress={() => setIsTriggerSheetVisible(true)}
          loading={loading || logging}
          disabled={loading || logging}
        >
          Log Smoking
        </Button>

        {/* Detailed Statistics */}
        <Surface style={styles.section} elevation={0}>
          <Text variant='titleLarge' style={styles.sectionTitle}>
            Detailed Statistics
          </Text>

          <Card style={styles.statCard}>
            <Card.Content>
              <Surface style={styles.statRow} elevation={0}>
                <Text variant='titleMedium'>Today</Text>
                <Text variant='titleMedium' style={styles.countText}>
                  {formatCigaretteCount(todayCount)}
                </Text>
              </Surface>
              {todayLogs.length > 0 && (
                <Surface style={styles.timeRow} elevation={0}>
                  <Icon
                    source='clock-outline'
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text variant='bodySmall' style={styles.timeText}>
                    {todayLogs.map(formatSmokingLogTime).join(', ')}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content>
              <Surface style={styles.statRow} elevation={0}>
                <Text variant='titleMedium'>Yesterday</Text>
                <Text variant='titleMedium' style={styles.countText}>
                  {formatCigaretteCount(yesterdayCount)}
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        </Surface>

        {/* Weekly Insights */}
        <Surface style={styles.section} elevation={0}>
          <Text variant='titleLarge' style={styles.sectionTitle}>
            Weekly Insights
          </Text>

          <Surface style={styles.insightItem} elevation={0}>
            <Icon source='chart-line' size={20} color={theme.colors.primary} />
            <Text variant='bodyMedium' style={styles.insightText}>
              Average: {weeklyAverage} cigarettes per day
            </Text>
          </Surface>

          <Surface style={styles.insightItem} elevation={0}>
            <Icon
              source='calendar-week'
              size={20}
              color={theme.colors.primary}
            />
            <Text variant='bodyMedium' style={styles.insightText}>
              Total this week: {weeklyTotal} cigarettes
            </Text>
          </Surface>

          <Surface style={styles.insightItem} elevation={0}>
            <Icon source='information' size={20} color='#4285F4' />
            <Text variant='bodyMedium' style={styles.insightText}>
              Track your progress by logging each cigarette
            </Text>
          </Surface>
        </Surface>
      </Surface>
      <TriggerBottomSheet
        loading={logging}
        onDismiss={() => setIsTriggerSheetVisible(false)}
        onSelect={handleTriggerSelect}
        visible={isTriggerSheetVisible}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontWeight: '600',
  },
  todayCard: {
    marginBottom: 16,
  },
  todayContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  todayLeft: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  todayLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  todayCount: {
    fontWeight: 'bold',
    color: '#4285F4',
  },
  logButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  logButtonContent: {
    paddingVertical: 6,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  statCard: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  countText: {
    color: '#4285F4',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  timeText: {
    opacity: 0.7,
    flex: 1,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  insightText: {
    flex: 1,
  },
  streakCard: {
    marginBottom: 16,
  },
  streakLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  streakCount: {
    fontWeight: 'bold',
  },
});
