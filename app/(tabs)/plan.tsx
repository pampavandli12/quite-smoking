import { getSmokingSettings } from '@/db';
import { AppSymbol } from '@/components/AppSymbol';
import DatePickerSheet from '@/components/DatePickerSheet';
import {
  EmptyState,
  PremiumCard,
  ProgressRing,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
  StatusPill,
} from '@/components/ui';
import {
  createQuitPlan,
  getActiveQuitPlan,
  listPlanWeeks,
  setQuitPlanStatus,
  type PlanWeek,
  type QuitPlan,
} from '@/services/quitPlanService';
import { getEffectivePlanWeek } from '@/utils/quitPlan';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

type PlanMode = 'gradual_reduction' | 'quit_date';

function dateFromToday(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function formatPlanDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PlanPage() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [plan, setPlan] = useState<QuitPlan | null>(null);
  const [weeks, setWeeks] = useState<PlanWeek[]>([]);
  const [mode, setMode] = useState<PlanMode>('gradual_reduction');
  const [motivation, setMotivation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedWeek, setExpandedWeek] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [quitDate, setQuitDate] = useState(() => dateFromToday(56));
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const active = await getActiveQuitPlan();
      setPlan(active ?? null);
      setWeeks(active ? await listPlanWeeks(active.id) : []);
      setErrorMessage('');
    } catch (error) {
      console.error('Error loading quit plan:', error);
      setErrorMessage('Your plan could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    const settings = await getSmokingSettings();
    if (!settings) return;
    if (mode === 'quit_date' && quitDate.getTime() <= Date.now()) {
      setErrorMessage('Choose a quit date in the future.');
      return;
    }
    const result = await createQuitPlan({
      mode,
      baselineCigarettesPerDay: settings.cigarettesPerDay,
      targetQuitAt: mode === 'quit_date' ? quitDate.getTime() : undefined,
      motivation,
    });
    if (!result.success) {
      setErrorMessage('Your plan could not be created. Please try again.');
      return;
    }
    load();
  };

  const effectiveWeek = getEffectivePlanWeek(weeks);
  const currentWeek = effectiveWeek
    ? weeks.findIndex((week) => week.id === effectiveWeek.id)
    : 0;
  const weeksUntilQuit = Math.max(
    1,
    Math.ceil((quitDate.getTime() - Date.now()) / 604800000),
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        title='Your plan'
        subtitle='A steady path shaped around your pace.'
        action={plan ? <StatusPill label={plan.status} tone={plan.status === 'active' ? 'success' : 'warning'} /> : undefined}
      />
      {errorMessage ? (
        <PremiumCard style={{ backgroundColor: theme.colors.errorContainer }}>
          <Text style={{ color: theme.colors.error }}>{errorMessage}</Text>
          <Button onPress={load}>Try again</Button>
        </PremiumCard>
      ) : null}

      {!plan && !loading ? (
        <>
          <SectionHeader title='Choose your path' subtitle='You can pause or adjust later without losing history.' />
          <View style={[styles.modeGrid, width < 360 && styles.modeGridStacked]}>
            <TouchableRipple
              borderless
              onPress={() => setMode('gradual_reduction')}
              style={[
                styles.modeCard,
                {
                  backgroundColor: mode === 'gradual_reduction' ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: mode === 'gradual_reduction' ? theme.colors.primary : theme.colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.modeContent}>
                <AppSymbol
                  name='stairs-up'
                  size={28}
                  color={theme.colors.primary}
                />
                <Text variant='titleMedium' style={styles.modeTitle}>Reduce gradually</Text>
                <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                  Smaller weekly targets over eight weeks.
                </Text>
              </View>
            </TouchableRipple>
            <TouchableRipple
              borderless
              onPress={() => setMode('quit_date')}
              style={[
                styles.modeCard,
                {
                  backgroundColor: mode === 'quit_date' ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: mode === 'quit_date' ? theme.colors.primary : theme.colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.modeContent}>
                <AppSymbol
                  name='flag-checkered'
                  size={28}
                  color={theme.colors.primary}
                />
                <Text variant='titleMedium' style={styles.modeTitle}>Set a quit date</Text>
                <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                  Work toward a clear smoke-free date.
                </Text>
              </View>
            </TouchableRipple>
          </View>
          {mode === 'quit_date' ? (
            <View style={styles.dateSection}>
              <SectionHeader
                title='Choose your quit date'
                subtitle='Your weekly targets will be built toward this date.'
              />
              <TouchableRipple
                accessibilityLabel={`Target quit date ${formatPlanDate(quitDate)}`}
                accessibilityRole='button'
                borderless
                onPress={() => setDatePickerVisible(true)}
                style={[
                  styles.dateField,
                  {
                    backgroundColor: theme.colors.elevation.level1,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.dateFieldContent}>
                  <View
                    style={[
                      styles.dateIcon,
                      { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <AppSymbol
                      name='calendar-heart'
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.dateCopy}>
                    <Text
                      variant='labelMedium'
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Target quit date
                    </Text>
                    <Text variant='titleMedium' style={styles.dateValue}>
                      {formatPlanDate(quitDate)}
                    </Text>
                    <Text
                      variant='bodySmall'
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {weeksUntilQuit} {weeksUntilQuit === 1 ? 'week' : 'weeks'} away
                    </Text>
                  </View>
                  <AppSymbol
                    name='chevron-right'
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              </TouchableRipple>
            </View>
          ) : null}
          <PremiumCard style={styles.motivation}>
            <Text variant='titleMedium' style={styles.modeTitle}>A reminder for difficult moments</Text>
            <TextInput
              mode='outlined'
              label='Why do you want to change?'
              value={motivation}
              onChangeText={setMotivation}
              multiline
              style={styles.input}
            />
            <Button mode='contained' contentStyle={styles.button} onPress={create}>
              Create my plan
            </Button>
          </PremiumCard>
        </>
      ) : plan ? (
        <>
          <PremiumCard style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
            <View style={styles.heroRow}>
              <ProgressRing
                progress={weeks.length ? (Math.max(0, currentWeek) + 1) / weeks.length : 0}
                accessibilityLabel={`Week ${Math.max(0, currentWeek) + 1} of ${weeks.length}`}
              >
                <Text variant='headlineLarge' style={styles.target}>
                  {effectiveWeek?.targetCigarettesPerDay ??
                    plan.currentDailyTarget}
                </Text>
                <Text variant='labelMedium'>per day</Text>
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <Text variant='titleLarge' style={styles.modeTitle}>Today&apos;s target</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                  Focus on today. The larger journey will follow.
                </Text>
                {plan.mode === 'quit_date' && plan.targetQuitAt ? (
                  <Text
                    variant='bodySmall'
                    style={[
                      styles.activeDate,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Target: {formatPlanDate(new Date(plan.targetQuitAt))}
                  </Text>
                ) : null}
                <StatusPill label={`Week ${Math.max(0, currentWeek) + 1} of ${weeks.length}`} tone='success' />
              </View>
            </View>
          </PremiumCard>

          {plan.motivation ? (
            <PremiumCard style={styles.motivation}>
              <View style={styles.reminder}>
                <AppSymbol
                  name='heart-outline'
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text variant='labelLarge'>Your reason</Text>
                  <Text variant='bodyLarge'>“{plan.motivation}”</Text>
                </View>
              </View>
            </PremiumCard>
          ) : null}

          <SectionHeader
            title={`${weeks.length}-week journey`}
            subtitle='Tap a week to see its focus.'
          />
          <View style={styles.timeline}>
            {weeks.map((week, index) => {
              const current = index === currentWeek;
              const complete = Boolean(week.completedAt) || index < currentWeek;
              const expanded = expandedWeek === week.id;
              return (
                <TouchableRipple
                  key={week.id}
                  borderless
                  onPress={() => setExpandedWeek(expanded ? undefined : week.id)}
                  style={[
                    styles.week,
                    {
                      backgroundColor: current ? theme.colors.primaryContainer : theme.colors.surface,
                      borderColor: current ? theme.colors.primary : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <View>
                    <View style={styles.weekRow}>
                      <View style={[styles.weekDot, { backgroundColor: complete || current ? theme.colors.primary : theme.colors.surfaceVariant }]}>
                        {complete ? (
                          <AppSymbol
                            name='check'
                            size={15}
                            color={theme.colors.onPrimary}
                          />
                        ) : (
                          <Text variant='labelSmall'>{index + 1}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant='titleSmall'>Week {index + 1}</Text>
                        <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                          Target {week.targetCigarettesPerDay} per day
                        </Text>
                      </View>
                      {current ? (
                        <StatusPill label='Current' tone='success' />
                      ) : (
                        <AppSymbol
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                        />
                      )}
                    </View>
                    {expanded ? (
                      <Text style={[styles.weekDetail, { color: theme.colors.onSurfaceVariant }]}>
                        {week.focusStrategy
                          ? `Practice ${week.focusStrategy.replace('_', ' ')} when ${week.focusTrigger ?? 'a craving'} appears.`
                          : 'Notice your strongest triggers and practice creating a short pause.'}
                      </Text>
                    ) : null}
                  </View>
                </TouchableRipple>
              );
            })}
          </View>
          <Button
            mode='outlined'
            style={styles.pause}
            onPress={async () => {
              await setQuitPlanStatus(plan.id, plan.status === 'paused' ? 'active' : 'paused');
              load();
            }}
          >
            {plan.status === 'paused' ? 'Resume plan' : 'Pause plan'}
          </Button>
        </>
      ) : (
        <EmptyState icon='calendar-heart' title='Preparing your plan' message='Your current plan is loading.' />
      )}
      <DatePickerSheet
        maximumDate={dateFromToday(365)}
        minimumDate={dateFromToday(1)}
        onConfirm={(date) => {
          setQuitDate(date);
          setDatePickerVisible(false);
          setErrorMessage('');
        }}
        onDismiss={() => setDatePickerVisible(false)}
        value={quitDate}
        visible={datePickerVisible}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modeGrid: { flexDirection: 'row', gap: 12 },
  modeGridStacked: { flexDirection: 'column' },
  modeCard: { flex: 1, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  modeContent: { padding: 18, minHeight: 180 },
  modeTitle: { fontWeight: '700', marginVertical: 8 },
  motivation: { marginTop: 16 },
  dateSection: { marginTop: 4 },
  dateField: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dateFieldContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 88,
    padding: 14,
  },
  dateIcon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  dateCopy: { flex: 1, minWidth: 0 },
  dateValue: { fontWeight: '700', marginVertical: 2 },
  input: { marginVertical: 16 },
  button: { minHeight: 52 },
  hero: { overflow: 'hidden' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  target: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  activeDate: { marginTop: 8 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  timeline: { gap: 10 },
  week: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 14 },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weekDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weekDetail: { marginLeft: 42, marginTop: 10, lineHeight: 20 },
  pause: { marginTop: 20 },
});
