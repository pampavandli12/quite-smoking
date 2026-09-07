import {
  deleteSmokingLog,
  getNonSmokingStreak,
  getSmokingSettings,
  getTodayLogs,
  getTodayStats,
  getWeeklyBreakdown,
  getYesterdayStats,
  logSmokingEvent,
  type SmokingLogTimestampRow,
} from '@/db';
import TriggerBottomSheet from '@/components/TriggerBottomSheet';
import { AppSymbol, appSymbolSource } from '@/components/AppSymbol';
import {
  AnimatedNumber,
  MetricCard,
  PremiumCard,
  ProgressRing,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import { getActiveQuitPlan } from '@/services/quitPlanService';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';

type HomeSnapshot = {
  today: number;
  yesterday: number;
  logs: SmokingLogTimestampRow[];
  weekly: number[];
  streak: number;
  dailyTarget: number;
  moneySaved: number;
};

const initialSnapshot: HomeSnapshot = {
  today: 0,
  yesterday: 0,
  logs: [],
  weekly: [0, 0, 0, 0, 0, 0, 0],
  streak: 0,
  dailyTarget: 0,
  moneySaved: 0,
};

function timeLabel(timestamp: number | string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HomePage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [undoLogId, setUndoLogId] = useState<number>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [today, yesterday, logs, weekly, streak, settings, plan] =
        await Promise.all([
          getTodayStats(),
          getYesterdayStats(),
          getTodayLogs(),
          getWeeklyBreakdown(),
          getNonSmokingStreak(),
          getSmokingSettings(),
          getActiveQuitPlan(),
        ]);
      const dailyTarget =
        plan?.currentDailyTarget ?? settings?.cigarettesPerDay ?? 0;
      const avoided = Math.max(0, dailyTarget - today);
      setSnapshot({
        today,
        yesterday,
        logs,
        weekly,
        streak,
        dailyTarget,
        moneySaved: avoided * ((settings?.costPerCigaretteCents ?? 0) / 100),
      });
    } catch (error) {
      console.error('Error loading Home:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const weeklyTotal = useMemo(
    () => snapshot.weekly.reduce((sum, value) => sum + value, 0),
    [snapshot.weekly],
  );
  const progress =
    snapshot.dailyTarget > 0
      ? snapshot.today / snapshot.dailyTarget
      : snapshot.today > 0
        ? 1
        : 0;
  const supportiveCopy =
    snapshot.today === 0
      ? 'A fresh day. Take it one choice at a time.'
      : snapshot.dailyTarget > 0 && snapshot.today <= snapshot.dailyTarget
        ? 'You are still within today’s plan.'
        : 'Recorded without judgment. Your plan continues.';

  const handleLog = useCallback(
    async (trigger?: string) => {
      try {
        setLogging(true);
        const result = await logSmokingEvent(trigger ? [trigger] : []);
        if (result.success) {
          setUndoLogId(result.logId);
          setTriggerVisible(false);
          await load();
        }
      } finally {
        setLogging(false);
      }
    },
    [load],
  );

  return (
    <>
      <ScreenContainer>
        <ScreenHeader
          title='Today'
          subtitle={new Date().toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
          action={
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
              <AppSymbol name='leaf' size={22} color={theme.colors.primary} />
            </View>
          }
        />

        <Animated.View entering={FadeInDown.duration(260)}>
          <PremiumCard
            style={[
              styles.hero,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <View style={styles.heroRow}>
              <ProgressRing
                progress={progress}
                size={126}
                accessibilityLabel={`${snapshot.today} of ${snapshot.dailyTarget || 'no'} daily target`}
              >
                <Text variant='displaySmall' style={styles.heroNumber}>
                  <AnimatedNumber value={snapshot.today} />
                </Text>
                <Text variant='labelMedium'>
                  of {snapshot.dailyTarget || '—'}
                </Text>
              </ProgressRing>
              <View style={styles.heroCopy}>
                <Text variant='titleLarge' style={styles.heroTitle}>
                  Your daily rhythm
                </Text>
                <Text
                  variant='bodyMedium'
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {supportiveCopy}
                </Text>
                <View style={styles.smokeFreeRow}>
                  <AppSymbol
                    name='weather-sunset-up'
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text variant='labelLarge'>
                    {snapshot.streak} smoke-free day{snapshot.streak === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
            </View>
          </PremiumCard>
        </Animated.View>

        <View style={styles.actions}>
          <Button
            mode='contained'
            icon={appSymbolSource('lifebuoy')}
            style={styles.action}
            contentStyle={styles.actionContent}
            onPress={() => router.push('/(tabs)/rescue')}
          >
            I&apos;m craving
          </Button>
          <Button
            mode='outlined'
            icon={appSymbolSource('plus')}
            style={styles.action}
            contentStyle={styles.actionContent}
            loading={logging}
            disabled={loading || logging}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTriggerVisible(true);
            }}
          >
            I smoked
          </Button>
        </View>

        <View style={styles.metrics}>
          <MetricCard
            label='Current streak'
            value={snapshot.streak}
            unit='days'
            icon='fire'
            tone='success'
            accessibilityLabel={`${snapshot.streak} day smoke-free streak`}
          />
          <MetricCard
            label='Saved today'
            value={`₹${Math.round(snapshot.moneySaved)}`}
            icon='wallet-outline'
            tone='success'
            accessibilityLabel={`${Math.round(snapshot.moneySaved)} rupees saved today`}
          />
        </View>

        <SectionHeader
          title='Recent activity'
          subtitle='Your latest recorded moments'
          action={<Button compact onPress={() => router.push('/history')}>History</Button>}
        />
        <PremiumCard>
          {snapshot.logs.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Nothing recorded today. Your activity will appear here.
            </Text>
          ) : (
            snapshot.logs.slice(-3).reverse().map((log, index) => (
              <View
                key={log.id}
                style={[
                  styles.activityRow,
                  index > 0 && { borderTopColor: theme.colors.outlineVariant, borderTopWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <AppSymbol
                    name='clock-outline'
                    size={18}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant='titleSmall'>Cigarette recorded</Text>
                  <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                    {timeLabel(log.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </PremiumCard>

        <SectionHeader title='This week' subtitle='A gentle view of your pattern' />
        <PremiumCard>
          <View style={styles.insightRow}>
            <View>
              <Text variant='displaySmall' style={styles.insightNumber}>{weeklyTotal}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>recorded this week</Text>
            </View>
            <View style={[styles.insightIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
              <AppSymbol
                name='chart-timeline-variant'
                size={26}
                color={theme.colors.secondary}
              />
            </View>
          </View>
          <Button mode='text' onPress={() => router.push('/(tabs)/stats')}>
            Explore your progress
          </Button>
        </PremiumCard>
      </ScreenContainer>

      <TriggerBottomSheet
        loading={logging}
        visible={triggerVisible}
        onDismiss={() => setTriggerVisible(false)}
        onSelect={handleLog}
      />
      <Snackbar
        visible={typeof undoLogId === 'number'}
        duration={5000}
        onDismiss={() => setUndoLogId(undefined)}
        style={styles.snackbar}
        wrapperStyle={[
          styles.snackbarWrapper,
          { bottom: Math.max(insets.bottom, 12) + 74 },
        ]}
        action={{
          label: 'Undo',
          onPress: async () => {
            if (undoLogId) {
              await deleteSmokingLog(undoLogId);
              setUndoLogId(undefined);
              await load();
            }
          },
        }}
      >
        Recorded without judgment. Your plan continues.
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  hero: { overflow: 'hidden' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroNumber: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  heroCopy: { flex: 1, gap: 8 },
  heroTitle: { fontWeight: '700' },
  smokeFreeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  action: { flex: 1, borderRadius: 14 },
  actionContent: { minHeight: 52 },
  metrics: { flexDirection: 'row', gap: 12, marginTop: 12 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  activityIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightNumber: { fontWeight: '800' },
  insightIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  snackbar: {
    borderRadius: 16,
  },
  snackbarWrapper: {
    elevation: 24,
    zIndex: 100,
  },
});
