import { appSymbolSource } from '@/components/AppSymbol';
import { MetricCard, PremiumCard, SectionHeader } from '@/components/ui';
import {
  getLifetimeImpact,
  getOnTargetStreak,
  type OnTargetStreak,
} from '@/services/impactService';
import { getUserPreferences } from '@/services/preferencesService';
import {
  completeSavingsGoal,
  createSavingsGoal,
  deleteSavingsGoal,
  getActiveSavingsGoal,
  type SavingsGoal,
} from '@/services/savingsGoalService';
import {
  CURRENCY_SYMBOLS,
  formatMoneyFromCents,
  type CurrencyCode,
} from '@/utils/currency';
import { designTokens } from '@/theme';
import type { LifetimeImpact } from '@/utils/impact';
import {
  getGoalProgress,
  MAX_GOAL_TITLE_LENGTH,
  validateSavingsGoal,
} from '@/utils/savingsGoal';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  HelperText,
  IconButton,
  Portal,
  ProgressBar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

type ImpactState = {
  impact: LifetimeImpact;
  onTarget: OnTargetStreak | null;
  goal: SavingsGoal | null;
  goalSavedCents: number;
  currencyCode: CurrencyCode;
};

function parseAmountToCents(value: string) {
  const amount = Number(value.replace(/,/g, '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
}

// Self-contained so a failure here can never break the rest of Home.
export default function ImpactSection({ refreshToken }: { refreshToken: unknown }) {
  const theme = useTheme();
  const [state, setState] = useState<ImpactState | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [impact, onTarget, goal, preferences] = await Promise.all([
        getLifetimeImpact(),
        getOnTargetStreak(),
        getActiveSavingsGoal(),
        getUserPreferences(),
      ]);
      if (!impact) {
        setState(null);
        return;
      }
      const goalImpact = goal ? await getLifetimeImpact(goal.createdAt) : null;
      setState({
        impact,
        onTarget,
        goal: goal ?? null,
        goalSavedCents: goalImpact?.moneySavedCents ?? 0,
        currencyCode: preferences.currencyCode,
      });
    } catch (error) {
      console.error('Error loading impact:', error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (!state) return null;
  const { impact, onTarget, goal, goalSavedCents, currencyCode } = state;
  const money = (cents: number) =>
    formatMoneyFromCents(cents, currencyCode, { compact: true });
  const progress = goal ? getGoalProgress(goalSavedCents, goal.targetAmountCents) : 0;

  const saveGoal = async () => {
    const input = { title, targetAmountCents: parseAmountToCents(amount) };
    const invalid = validateSavingsGoal(input);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    setSaving(true);
    const result = await createSavingsGoal(input);
    setSaving(false);
    if (!result.success) {
      setFormError('Your goal could not be saved. Please try again.');
      return;
    }
    setDialogVisible(false);
    setTitle('');
    setAmount('');
    setFormError('');
    await load();
  };

  const completeGoal = async () => {
    if (!goal) return;
    const result = await completeSavingsGoal(goal.id);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await load();
    }
  };

  // Re-read the currency so a change made in Settings is always reflected.
  const openGoalDialog = async () => {
    setFormError('');
    setDialogVisible(true);
    try {
      const preferences = await getUserPreferences();
      setState((current) =>
        current ? { ...current, currencyCode: preferences.currencyCode } : current,
      );
    } catch (error) {
      console.error('Error loading currency for goal:', error);
    }
  };

  const removeGoal = () => {
    if (!goal) return;
    Alert.alert('Remove goal?', `“${goal.title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteSavingsGoal(goal.id);
          if (result.success) await load();
        },
      },
    ]);
  };

  return (
    <>
      <SectionHeader title='Your impact' subtitle='Compared with your baseline' />
      <View style={styles.metrics}>
        <MetricCard
          label='Total saved'
          value={money(impact.moneySavedCents)}
          icon='piggy-bank-outline'
          tone='success'
          accessibilityLabel={`${money(impact.moneySavedCents)} saved in total`}
        />
        <MetricCard
          label='Not smoked'
          value={impact.cigarettesAvoided}
          icon='leaf'
          tone='success'
          accessibilityLabel={`${impact.cigarettesAvoided} cigarettes not smoked`}
        />
      </View>
      {onTarget ? (
        <View style={styles.metrics}>
          <MetricCard
            label='On-target streak'
            value={onTarget.streak}
            unit={onTarget.streak === 1 ? 'day' : 'days'}
            icon='target'
            trend={{
              direction: 'neutral',
              label: `Days within your plan's daily target`,
            }}
            accessibilityLabel={`${onTarget.streak} day streak within your plan's daily target`}
          />
        </View>
      ) : null}

      <PremiumCard style={styles.goalCard}>
        {goal ? (
          <>
            <View style={styles.goalHeader}>
              <View style={styles.goalCopy}>
                <Text variant='labelLarge' style={{ color: theme.colors.onSurfaceVariant }}>
                  Saving for
                </Text>
                <Text variant='titleMedium' style={styles.bold}>
                  {goal.title}
                </Text>
              </View>
              <IconButton
                accessibilityLabel='Remove goal'
                icon={appSymbolSource('delete-outline')}
                onPress={removeGoal}
              />
            </View>
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
              style={styles.bar}
            />
            <Text variant='bodySmall' style={[styles.goalAmounts, { color: theme.colors.onSurfaceVariant }]}>
              {money(Math.min(goalSavedCents, goal.targetAmountCents))} of{' '}
              {money(goal.targetAmountCents)} · {Math.round(progress * 100)}%
            </Text>
            {progress >= 1 ? (
              <Button mode='contained' icon={appSymbolSource('trophy-outline')} onPress={completeGoal}>
                Mark as achieved
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <Text variant='titleMedium' style={styles.bold}>
              Save for something you want
            </Text>
            <Text style={[styles.goalHint, { color: theme.colors.onSurfaceVariant }]}>
              Turn the money you don&apos;t spend on cigarettes into a reward.
            </Text>
            <Button mode='outlined' icon={appSymbolSource('plus')} onPress={openGoalDialog}>
              Set a savings goal
            </Button>
          </>
        )}
      </PremiumCard>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>New savings goal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode='outlined'
              label='What are you saving for?'
              value={title}
              maxLength={MAX_GOAL_TITLE_LENGTH}
              onChangeText={setTitle}
            />
            <TextInput
              mode='outlined'
              label='Target amount'
              value={amount}
              left={<TextInput.Affix text={CURRENCY_SYMBOLS[currencyCode]} />}
              keyboardType='decimal-pad'
              onChangeText={setAmount}
              style={styles.amountInput}
            />
            <HelperText type='error' visible={Boolean(formError)}>
              {formError}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button loading={saving} disabled={saving} onPress={saveGoal}>
              Save goal
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  goalCard: { marginTop: 0 },
  goalHeader: { flexDirection: 'row', alignItems: 'center' },
  goalCopy: { flex: 1, minWidth: 0 },
  bold: { fontWeight: '700' },
  bar: { marginTop: 10, height: 8, borderRadius: 4 },
  goalAmounts: { marginTop: 8, marginBottom: 12 },
  goalHint: { marginTop: 4, marginBottom: 14 },
  amountInput: { marginTop: 12 },
  // MD3 Dialog multiplies theme roundness by 7, which is far too round here.
  dialog: { borderRadius: designTokens.radius.lg },
});
