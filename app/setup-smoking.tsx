import {
  AnimatedPressable,
  PremiumCard,
  ScreenContainer,
  StatusPill,
} from '@/components/ui';
import { AppSymbol, appSymbolSource } from '@/components/AppSymbol';
import { setSmokingSettings } from '@/db/queries';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import {
  areSmokingSettingsValid,
  parseSmokingSettings,
} from '@/utils/smokingSettings';

export default function SmokingSetupScreen() {
  const theme = useTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [cigarettesPerDay, setCigarettesPerDay] = useState('');
  const [costPerCigarette, setCostPerCigarette] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const dailyCountValid = Number(cigarettesPerDay) > 0;
  const allValid = useMemo(
    () => areSmokingSettingsValid(cigarettesPerDay, costPerCigarette),
    [cigarettesPerDay, costPerCigarette],
  );

  const save = async () => {
    if (!allValid) {
      setMessage('Add a valid daily count and cigarette cost to continue.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const parsed = parseSmokingSettings(cigarettesPerDay, costPerCigarette);
      const result = await setSmokingSettings(
        parsed.cigarettesPerDay,
        parsed.costPerCigarette,
      );
      if (result?.success) {
        router.replace('/');
      } else {
        setMessage('We could not save this yet. Your entries are still here—try again.');
      }
    } catch (error) {
      console.error('Unable to save smoking settings:', error);
      setMessage('We could not save this yet. Your entries are still here—try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScreenContainer style={styles.content}>
        <View style={styles.brand}>
          <View
            style={[styles.brandIcon, { backgroundColor: theme.colors.primaryContainer }]}
          >
            <AppSymbol name='leaf' size={30} color={theme.colors.primary} />
          </View>
          <StatusPill label={`Step ${step} of 2`} tone='premium' />
        </View>

        <Text variant='headlineLarge' style={styles.title}>
          {step === 1 ? 'Start with your usual day' : 'Make progress feel personal'}
        </Text>
        <Text
          variant='bodyLarge'
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          {step === 1
            ? 'A simple baseline helps show meaningful progress without judgment.'
            : 'Your cost helps estimate savings. You can change it anytime.'}
        </Text>

        <View style={styles.steps}>
          {[1, 2].map((value) => (
            <View
              key={value}
              style={[
                styles.stepLine,
                {
                  backgroundColor:
                    value <= step ? theme.colors.primary : theme.colors.surfaceVariant,
                },
              ]}
            />
          ))}
        </View>

        <PremiumCard style={styles.card}>
          {step === 1 ? (
            <>
              <AppSymbol name='calendar-today' size={28} color={theme.colors.primary} />
              <Text variant='titleLarge' style={styles.cardTitle}>
                Cigarettes per day
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Think of a typical day, not your best or hardest one.
              </Text>
              <View style={styles.counter}>
                <AnimatedPressable
                  accessibilityLabel='Decrease daily cigarettes'
                  disabled={!dailyCountValid}
                  onPress={() =>
                    setCigarettesPerDay((value) =>
                      Math.max(0, Number(value || 0) - 1).toString().replace(/^0$/, ''),
                    )
                  }
                  style={[styles.counterButton, { borderColor: theme.colors.outlineVariant }]}
                >
                  <AppSymbol name='minus' size={24} />
                </AnimatedPressable>
                <TextInput
                  accessibilityLabel='Cigarettes per day'
                  keyboardType='number-pad'
                  mode='flat'
                  onChangeText={(value) =>
                    setCigarettesPerDay(value.replace(/[^0-9]/g, ''))
                  }
                  style={[styles.numberInput, { backgroundColor: theme.colors.surfaceVariant }]}
                  value={cigarettesPerDay}
                />
                <AnimatedPressable
                  accessibilityLabel='Increase daily cigarettes'
                  onPress={() =>
                    setCigarettesPerDay((value) => String(Number(value || 0) + 1))
                  }
                  style={[styles.counterButton, { borderColor: theme.colors.outlineVariant }]}
                >
                  <AppSymbol name='plus' size={24} />
                </AnimatedPressable>
              </View>
            </>
          ) : (
            <>
              <AppSymbol name='wallet-outline' size={28} color={theme.colors.primary} />
              <Text variant='titleLarge' style={styles.cardTitle}>
                Cost per cigarette
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Use your usual average. Your currency can be updated in Settings.
              </Text>
              <TextInput
                accessibilityLabel='Cost per cigarette'
                keyboardType='decimal-pad'
                left={<TextInput.Icon icon={appSymbolSource('currency-inr')} />}
                mode='outlined'
                onChangeText={(value) => setCostPerCigarette(value.replace(/[^0-9.]/g, ''))}
                placeholder='0.00'
                style={styles.costInput}
                value={costPerCigarette}
              />
            </>
          )}
        </PremiumCard>

        {!!message && (
          <Text
            accessibilityLiveRegion='polite'
            style={[styles.message, { color: theme.colors.error }]}
          >
            {message}
          </Text>
        )}

        <View style={styles.actions}>
          {step === 2 && (
            <Button mode='text' onPress={() => setStep(1)}>
              Back
            </Button>
          )}
          <Button
            contentStyle={styles.buttonContent}
            disabled={(step === 1 && !dailyCountValid) || saving}
            loading={saving}
            mode='contained'
            onPress={() => (step === 1 ? setStep(2) : save())}
            style={styles.primary}
          >
            {step === 1 ? 'Continue' : 'Start my journey'}
          </Button>
        </View>
        <Text
          variant='bodySmall'
          style={[styles.privacy, { color: theme.colors.onSurfaceVariant }]}
        >
          Your information stays on this device.
        </Text>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: 32 },
  brand: { alignItems: 'center', gap: 12, marginBottom: 24 },
  brandIcon: { alignItems: 'center', borderRadius: 999, height: 58, justifyContent: 'center', width: 58 },
  title: { fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' },
  subtitle: { lineHeight: 24, marginTop: 10, textAlign: 'center' },
  steps: { flexDirection: 'row', gap: 8, marginVertical: 24 },
  stepLine: { borderRadius: 999, flex: 1, height: 5 },
  card: { padding: 22 },
  cardTitle: { fontWeight: '700', marginBottom: 6, marginTop: 14 },
  counter: { alignItems: 'center', flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: 24 },
  counterButton: { alignItems: 'center', borderRadius: 999, borderWidth: 1, height: 52, justifyContent: 'center', width: 52 },
  numberInput: { fontSize: 28, fontWeight: '700', height: 60, textAlign: 'center', width: 110 },
  costInput: { marginTop: 24 },
  message: { marginTop: 12, textAlign: 'center' },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 22 },
  primary: { borderRadius: 999, flex: 1 },
  buttonContent: { minHeight: 52 },
  privacy: { marginTop: 18, textAlign: 'center' },
});
