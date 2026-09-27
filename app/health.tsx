import { AppSymbol, appSymbolSource } from '@/components/AppSymbol';
import {
  PremiumCard,
  ProgressRing,
  ScreenContainer,
  ScreenHeader,
  SkeletonCard,
  StatusPill,
} from '@/components/ui';
import {
  getRecoveryAnchor,
  type RecoveryAnchor,
} from '@/services/milestoneService';
import {
  formatElapsed,
  getHealthProgress,
  HEALTH_MILESTONES,
} from '@/utils/healthMilestones';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

export default function HealthPage() {
  const theme = useTheme();
  const [anchor, setAnchor] = useState<RecoveryAnchor | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      getRecoveryAnchor()
        .then(setAnchor)
        .catch((error) => console.error('Error loading recovery:', error))
        .finally(() => setLoading(false));
    }, []),
  );

  const progress = anchor ? getHealthProgress(anchor.since, now) : null;

  return (
    <ScreenContainer>
      <ScreenHeader
        title='Body recovery'
        subtitle='How your body responds after your last cigarette.'
        action={
          <IconButton
            accessibilityLabel='Close'
            icon={appSymbolSource('close')}
            onPress={() => router.back()}
          />
        }
      />
      {loading ? (
        <SkeletonCard />
      ) : !progress ? (
        <PremiumCard>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Set your baseline or record your first moment to start your
            recovery timeline.
          </Text>
        </PremiumCard>
      ) : (
        <>
          <PremiumCard
            style={{ backgroundColor: theme.colors.primaryContainer }}
          >
            <View style={styles.heroRow}>
              <ProgressRing
                progress={progress.progressToNext}
                size={112}
                accessibilityLabel={`${Math.round(progress.progressToNext * 100)} percent to the next milestone`}
              >
                <Text variant='titleLarge' style={styles.bold}>
                  {formatElapsed(progress.elapsedMs)}
                </Text>
              </ProgressRing>
              <View style={styles.heroCopy}>
                <Text variant='labelLarge'>
                  {anchor?.source === 'last_cigarette'
                    ? 'Since your last cigarette'
                    : 'Since you started tracking'}
                </Text>
                <Text variant='titleMedium' style={styles.bold}>
                  {progress.next
                    ? `Next: ${progress.next.title}`
                    : 'Every milestone reached'}
                </Text>
                <Text
                  variant='bodySmall'
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {progress.achieved.length} of {HEALTH_MILESTONES.length}{' '}
                  milestones reached
                </Text>
              </View>
            </View>
          </PremiumCard>

          {HEALTH_MILESTONES.map((milestone) => {
            const reached = progress.achieved.includes(milestone);
            const isNext = progress.next?.id === milestone.id;
            return (
              <PremiumCard key={milestone.id} style={styles.item}>
                <View
                  style={styles.itemRow}
                  accessible
                  accessibilityLabel={`${milestone.label}: ${milestone.title}. ${reached ? 'Reached' : 'Not reached yet'}`}
                >
                  <AppSymbol
                    name={reached ? 'check-circle' : 'heart-pulse'}
                    size={26}
                    color={
                      reached
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <View style={styles.itemCopy}>
                    <Text
                      variant='labelMedium'
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {milestone.label}
                    </Text>
                    <Text variant='titleSmall' style={styles.bold}>
                      {milestone.title}
                    </Text>
                    <Text
                      variant='bodySmall'
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {milestone.description}
                    </Text>
                  </View>
                  {isNext ? <StatusPill label='Next' tone='success' /> : null}
                </View>
              </PremiumCard>
            );
          })}
        </>
      )}
      <Text
        variant='bodySmall'
        style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}
      >
        General public-health information, not medical advice. Everyone
        recovers differently.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroCopy: { flex: 1, gap: 6 },
  bold: { fontWeight: '700' },
  item: { marginTop: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemCopy: { flex: 1, minWidth: 0, gap: 2 },
  disclaimer: { textAlign: 'center', marginTop: 24 },
});
