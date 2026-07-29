import {
  getCopingEffectiveness,
  getPeakSmokingHours,
  type CopingEffectiveness,
  type PeakWindow,
} from '@/services/insightService';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeBarChart } from '@/components/SafeCharts';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { resolveFeatureAccess } from '@/services/accessService';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

function hourLabel(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12} ${suffix}`;
}

export default function AdvancedInsights() {
  const theme = useTheme();
  const [peak, setPeak] = useState<PeakWindow[]>([]);
  const [coping, setCoping] = useState<CopingEffectiveness[]>([]);
  const [allowed, setAllowed] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      getPeakSmokingHours(),
      getCopingEffectiveness(),
      resolveFeatureAccess(),
    ])
      .then(([hours, strategies, access]) => {
        setPeak(hours);
        setCoping(strategies);
        setAllowed(access.canViewAdvancedInsights);
      })
      .catch((error) => {
        console.error('Error loading advanced insights:', error);
        setPeak([]);
        setCoping([]);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!allowed) {
    return (
      <Card
        mode='contained'
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Card.Content>
          <Text variant='titleLarge'>Pattern insights</Text>
          <Text style={[styles.copy, { color: theme.colors.onSurfaceVariant }]}>
            Premium identifies peak-risk hours and which coping strategies work best for you.
          </Text>
          <Button mode='outlined' onPress={() => router.push('/?paywall=true')}>
            See Premium
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (peak.length === 0 && coping.length === 0) {
    return (
      <Card
        mode='contained'
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Card.Content>
          <Text variant='titleLarge'>Pattern insights</Text>
          <Text style={[styles.copy, { color: theme.colors.onSurfaceVariant }]}>
            Keep recording cigarettes and rescue sessions. Insights appear after enough days to avoid misleading conclusions.
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card
      mode='contained'
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <Card.Content>
        <Text variant='titleLarge'>Your patterns</Text>
        {peak.length > 0 && (
          <>
            <Text style={styles.copy}>
              Your most frequently recorded time is around {hourLabel(peak[0].hour)}.
            </Text>
            <View accessible accessibilityLabel={`Peak smoking hours: ${peak.map((item) => `${hourLabel(item.hour)}, ${item.count}`).join('; ')}`}>
              <SafeBarChart
                data={peak.map((item) => ({
                  value: item.count,
                  label: hourLabel(item.hour),
                  frontColor: theme.colors.primary,
                }))}
                height={130}
                barWidth={42}
                spacing={36}
                yAxisThickness={0}
                xAxisThickness={0}
                noOfSections={3}
                isAnimated
              />
            </View>
          </>
        )}
        {coping.map((item) => (
          <View key={item.strategy} style={styles.row}>
            <Text>{item.strategy.replace('_', ' ')}</Text>
            <Text>{item.rate}% helpful outcomes</Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
    overflow: 'hidden',
  },
  copy: { marginTop: 10, marginBottom: 16, lineHeight: 21 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
