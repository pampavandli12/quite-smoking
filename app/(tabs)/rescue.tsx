import {
  completeCravingSession,
  countThisWeekRescueSessions,
  getIncompleteCravingSession,
  getRecommendedStrategy,
  startCravingSession,
} from '@/services/cravingService';
import type { CopingStrategy, CravingOutcome } from '@/services/types';
import {
  EmptyState,
  PremiumCard,
  ProgressRing,
  ScreenContainer,
  ScreenHeader,
  StatusPill,
} from '@/components/ui';
import { appSymbolSource } from '@/components/AppSymbol';
import { resolveFeatureAccess } from '@/services/accessService';
import { useAppMotion } from '@/hooks/useAppMotion';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  Button,
  Chip,
  SegmentedButtons,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

const triggers = ['stress', 'coffee', 'boredom', 'after meals', 'anxiety'];
const strategyLabels: Record<CopingStrategy, string> = {
  breathing: 'Slow breathing',
  walk: 'Take a short walk',
  water: 'Drink water',
  distraction: 'Quick distraction',
  urge_surfing: 'Ride the urge',
  custom: 'My own strategy',
};
const stepIndex = { 'check-in': 0, timer: 1, outcome: 2, complete: 3 } as const;
const intensityOptions = [2, 4, 6, 8, 10];
type Step = keyof typeof stepIndex;

export default function RescuePage() {
  const theme = useTheme();
  const { reduceMotion } = useAppMotion();
  const [step, setStep] = useState<Step>('check-in');
  const [trigger, setTrigger] = useState('stress');
  const [intensity, setIntensity] = useState('5');
  const [duration, setDuration] = useState('180');
  const [strategy, setStrategy] = useState<CopingStrategy>('breathing');
  const [sessionId, setSessionId] = useState<number>();
  const [remaining, setRemaining] = useState(180);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const breathing = useSharedValue(1);

  useEffect(() => {
    getRecommendedStrategy(trigger)
      .then(setStrategy)
      .catch(() => setStrategy('breathing'));
  }, [trigger]);

  useEffect(() => {
    getIncompleteCravingSession()
      .then((session) => {
        if (!session) return;
        setSessionId(session.id);
        setTrigger(session.trigger ?? 'stress');
        setIntensity(String(session.intensityBefore ?? 5));
        setDuration(String(session.selectedDurationSeconds));
        const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
        setRemaining(Math.max(0, session.selectedDurationSeconds - elapsed));
        setPaused(true);
        setStep('timer');
      })
      .catch((error) =>
        console.error('Error restoring rescue session:', error),
      );
  }, []);

  useEffect(() => {
    if (step !== 'timer' || paused || remaining <= 0) return;
    const timer = setInterval(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [paused, remaining, step]);

  useEffect(() => {
    if (
      step === 'timer' &&
      strategy === 'breathing' &&
      !paused &&
      !reduceMotion
    ) {
      breathing.value = withRepeat(
        withTiming(1.12, { duration: 3000 }),
        -1,
        true,
      );
    } else {
      breathing.value = withTiming(1);
    }
  }, [breathing, paused, reduceMotion, step, strategy]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathing.value }],
  }));

  const begin = useCallback(async () => {
    try {
      setErrorMessage('');
      const [access, used] = await Promise.all([
        resolveFeatureAccess(),
        countThisWeekRescueSessions(),
      ]);
      if (!access.canUseUnlimitedRescue && used >= 3) {
        router.push('/?paywall=true');
        return;
      }
      const seconds = Number(duration);
      const result = await startCravingSession({
        trigger,
        intensity: Number(intensity),
        durationSeconds: seconds,
        strategy,
      });
      if (!result.success) throw result.error;
      setSessionId(result.data.id);
      setRemaining(seconds);
      setPaused(false);
      setStep('timer');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error starting Rescue:', error);
      setErrorMessage('Rescue could not start. Please try again.');
    }
  }, [duration, intensity, strategy, trigger]);

  const finish = useCallback(
    async (outcome: CravingOutcome) => {
      if (!sessionId) return;
      const result = await completeCravingSession({
        id: sessionId,
        intensityAfter: Math.max(1, Number(intensity) - 2),
        outcome,
      });
      if (!result.success) {
        setErrorMessage('This check-in could not be saved. Please try again.');
        return;
      }
      setMessage(
        outcome === 'resisted'
          ? 'You made space between the urge and the action.'
          : outcome === 'delayed'
            ? 'Delaying is meaningful progress.'
            : 'Recorded without judgment. Your plan continues.',
      );
      setStep('complete');
      if (outcome !== 'smoked') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [intensity, sessionId],
  );

  const reset = () => {
    setStep('check-in');
    setSessionId(undefined);
    setPaused(false);
    setErrorMessage('');
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title='Craving rescue'
        subtitle='Pause, notice the urge, and choose what happens next.'
      />
      <View style={styles.progressHeading}>
        <Text
          variant='labelMedium'
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Rescue progress
        </Text>
        <StatusPill label={`Step ${stepIndex[step] + 1} of 4`} />
      </View>
      <View style={styles.stepTrack}>
        {Object.keys(stepIndex).map((key, index) => (
          <View
            key={key}
            style={[
              styles.stepBar,
              {
                backgroundColor:
                  index <= stepIndex[step]
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
              },
            ]}
          />
        ))}
      </View>

      {errorMessage ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {errorMessage}
        </Text>
      ) : null}

      <Animated.View
        key={step}
        entering={
          reduceMotion ? FadeIn.duration(80) : FadeInRight.duration(220)
        }
        exiting={reduceMotion ? undefined : FadeOutLeft.duration(140)}
      >
        {step === 'check-in' && (
          <PremiumCard style={styles.card}>
            <Text variant='titleLarge' style={styles.cardTitle}>
              What is behind this urge?
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Choose the closest match. There is no wrong answer.
            </Text>
            <View style={styles.chips}>
              {triggers.map((item) => (
                <Chip
                  key={item}
                  selected={trigger === item}
                  onPress={() => setTrigger(item)}
                >
                  {item}
                </Chip>
              ))}
            </View>
            <Text variant='titleMedium' style={styles.section}>
              How strong is it?
            </Text>
            <View
              accessibilityLabel={`Craving intensity ${intensity} out of 10`}
              accessibilityRole='radiogroup'
              style={styles.intensityRow}
            >
              {intensityOptions.map((value) => {
                const selected = intensity === String(value);
                return (
                  <TouchableRipple
                    accessibilityLabel={`${value} out of 10`}
                    accessibilityRole='radio'
                    accessibilityState={{ checked: selected }}
                    borderless
                    key={value}
                    onPress={() => setIntensity(String(value))}
                    style={[
                      styles.intensityButton,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: selected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <Text
                      variant='labelLarge'
                      style={{
                        color: selected
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface,
                        fontWeight: '700',
                      }}
                    >
                      {value}
                    </Text>
                  </TouchableRipple>
                );
              })}
            </View>
            <Surface
              elevation={0}
              style={[
                styles.recommendation,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <View
                style={[
                  styles.recommendationIcon,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text variant='titleMedium'>✦</Text>
              </View>
              <View style={styles.recommendationCopy}>
                <StatusPill label='Recommended' tone='success' />
                <Text variant='titleMedium' style={styles.strategy}>
                  {strategyLabels[strategy]}
                </Text>
              </View>
            </Surface>
            <SegmentedButtons
              value={duration}
              onValueChange={setDuration}
              buttons={[
                { value: '180', label: '3 minutes' },
                { value: '300', label: '5 minutes' },
              ]}
              style={styles.section}
            />
            <Button
              mode='contained'
              contentStyle={styles.button}
              onPress={begin}
            >
              Begin rescue
            </Button>
          </PremiumCard>
        )}

        {step === 'timer' && (
          <PremiumCard style={styles.card}>
            <View style={styles.centerContent}>
              <Animated.View style={breathingStyle}>
                <ProgressRing
                  progress={1 - remaining / Number(duration)}
                  size={210}
                  strokeWidth={14}
                  accessibilityLabel={`${remaining} seconds remaining`}
                >
                  <Text variant='displayMedium' style={styles.timer}>
                    {Math.floor(remaining / 60)}:
                    {String(remaining % 60).padStart(2, '0')}
                  </Text>
                  <Text variant='labelLarge'>
                    {paused ? 'Paused' : strategyLabels[strategy]}
                  </Text>
                </ProgressRing>
              </Animated.View>
              <Text
                style={[
                  styles.guidance,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {paused
                  ? 'Resume when you feel ready.'
                  : 'Breathe gently. An urge can rise and fall without requiring an action.'}
              </Text>
              <View style={styles.timerActions}>
                <Button
                  mode='outlined'
                  icon={appSymbolSource(paused ? 'play' : 'pause', {
                    filled: true,
                  })}
                  onPress={() => setPaused((value) => !value)}
                  style={styles.timerButton}
                >
                  {paused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                  mode='contained'
                  onPress={() => setStep('outcome')}
                  style={styles.timerButton}
                >
                  {remaining === 0 ? 'Continue' : 'Finish early'}
                </Button>
              </View>
            </View>
          </PremiumCard>
        )}

        {step === 'outcome' && (
          <PremiumCard style={styles.card}>
            <Text variant='titleLarge' style={styles.cardTitle}>
              What happened next?
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Whatever happened, recording it helps your plan learn.
            </Text>
            <Button
              contentStyle={styles.outcome}
              style={styles.section}
              mode='contained'
              onPress={() => finish('resisted')}
            >
              I resisted
            </Button>
            <Button
              contentStyle={styles.outcome}
              mode='outlined'
              onPress={() => finish('delayed')}
            >
              I delayed it
            </Button>
            <Button
              contentStyle={styles.outcome}
              mode='text'
              onPress={() => finish('smoked')}
            >
              I smoked
            </Button>
          </PremiumCard>
        )}

        {step === 'complete' && (
          <PremiumCard style={styles.card}>
            <View style={styles.centerContent}>
              <EmptyState
                icon='leaf-circle-outline'
                title='Check-in complete'
                message={message}
                actionLabel='Done'
                onAction={reset}
              />
            </View>
          </PremiumCard>
        )}
      </Animated.View>
      <Text
        variant='bodySmall'
        style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}
      >
        General behavioral support, not medical advice.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepTrack: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  stepBar: { flex: 1, height: 4, borderRadius: 2 },
  card: { marginTop: 6 },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  section: { marginTop: 20, marginBottom: 20 },
  intensityRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    width: '100%',
  },
  intensityButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
    overflow: 'hidden',
  },
  recommendation: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    padding: 14,
  },
  recommendationIcon: {
    alignItems: 'center',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  recommendationCopy: { alignItems: 'flex-start', flex: 1, minWidth: 0 },
  strategy: { fontWeight: '700', marginTop: 6 },
  button: { minHeight: 52 },
  centerContent: {
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  timer: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  guidance: {
    textAlign: 'center',
    marginVertical: 24,
    lineHeight: 22,
    maxWidth: 300,
  },
  timerActions: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    maxWidth: 520,
    width: '100%',
  },
  timerButton: {
    flex: 1,
    maxWidth: 180,
  },
  outcome: { minHeight: 52 },
  error: { marginBottom: 12 },
  disclaimer: { textAlign: 'center', marginTop: 24 },
});
