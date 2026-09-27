import { AppSymbol } from '@/components/AppSymbol';
import { AnimatedPressable, PremiumCard } from '@/components/ui';
import {
  getRecoveryAnchor,
  type RecoveryAnchor,
} from '@/services/milestoneService';
import { formatElapsed, getHealthProgress } from '@/utils/healthMilestones';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';

// Self-contained so a failure here can never break the rest of Home.
export default function RecoveryCard({ refreshToken }: { refreshToken: unknown }) {
  const theme = useTheme();
  const [anchor, setAnchor] = useState<RecoveryAnchor | null>(null);

  useEffect(() => {
    let active = true;
    getRecoveryAnchor()
      .then((value) => active && setAnchor(value))
      .catch((error) => console.error('Error loading recovery card:', error));
    return () => {
      active = false;
    };
  }, [refreshToken]);

  if (!anchor) return null;
  const progress = getHealthProgress(anchor.since);

  return (
    <AnimatedPressable
      accessibilityRole='button'
      accessibilityLabel={`Body recovery. ${formatElapsed(progress.elapsedMs)} since last cigarette. ${progress.next ? `Next milestone: ${progress.next.title}` : 'All milestones reached'}`}
      onPress={() => router.push('/health')}
      style={styles.wrapper}
    >
      <PremiumCard>
        <View style={styles.row}>
          <View
            style={[
              styles.icon,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <AppSymbol name='heart-pulse' size={22} color={theme.colors.secondary} />
          </View>
          <View style={styles.copy}>
            <Text variant='labelLarge' style={{ color: theme.colors.onSurfaceVariant }}>
              Body recovery · {formatElapsed(progress.elapsedMs)}
            </Text>
            <Text variant='titleSmall' style={styles.title}>
              {progress.next
                ? `Next: ${progress.next.title} (${progress.next.label})`
                : 'Every recovery milestone reached'}
            </Text>
          </View>
          <AppSymbol
            name='chevron-right'
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
        <ProgressBar
          progress={progress.progressToNext}
          style={styles.bar}
          color={theme.colors.primary}
        />
      </PremiumCard>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontWeight: '700' },
  bar: { marginTop: 14, height: 6, borderRadius: 3 },
});
