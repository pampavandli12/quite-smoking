import type { TriggerCountRow } from '@/db';
import type { DetailedWeeklyBreakdownItem } from '@/utils/statistics';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Surface, Text, useTheme } from 'react-native-paper';

type TopTriggersSectionProps = {
  triggers: TriggerCountRow[];
};

function SectionCard({ children }: { children: ReactNode }) {
  const theme = useTheme();
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
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export function TopTriggersSection({ triggers }: TopTriggersSectionProps) {
  const theme = useTheme();
  if (triggers.length === 0) return null;
  const maximumCount = Math.max(1, ...triggers.map((item) => item.count));

  return (
    <View style={styles.section}>
      <Text variant='titleLarge' style={styles.sectionTitle}>
        Top triggers
      </Text>
      <Text
        variant='bodyMedium'
        style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        Patterns around your recorded moments
      </Text>
      <SectionCard>
        {triggers.map((item, index) => (
          <View
            accessible
            accessibilityLabel={`${item.trigger}, ${item.count} recorded ${
              item.count === 1 ? 'time' : 'times'
            }`}
            key={item.trigger}
            style={[
              styles.row,
              index > 0 && {
                borderTopColor: theme.colors.outlineVariant,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Surface
              style={[
                styles.rank,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}
              elevation={0}
            >
              <Text
                variant='labelLarge'
                style={{ color: theme.colors.onSecondaryContainer, fontWeight: '700' }}
              >
                {index + 1}
              </Text>
            </Surface>
            <View style={styles.rowCopy}>
              <Text variant='titleSmall' style={styles.capitalize}>
                {item.trigger}
              </Text>
              <View
                style={[
                  styles.track,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: theme.colors.secondary,
                      width: `${Math.min(100, (item.count / maximumCount) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Text
              variant='titleMedium'
              style={[styles.count, { color: theme.colors.primary }]}
            >
              {item.count}
            </Text>
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

type DailyBreakdownSectionProps = {
  breakdown: DetailedWeeklyBreakdownItem[];
};

export function DailyBreakdownSection({
  breakdown,
}: DailyBreakdownSectionProps) {
  const theme = useTheme();
  if (breakdown.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text variant='titleLarge' style={styles.sectionTitle}>
        Daily breakdown
      </Text>
      <Text
        variant='bodyMedium'
        style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        A day-by-day view of this week
      </Text>
      <SectionCard>
        {breakdown.map((item, index) => (
          <View
            accessible
            accessibilityLabel={`${item.day}, ${item.date}, ${item.count} ${
              item.count === 1 ? 'cigarette' : 'cigarettes'
            }`}
            key={item.date}
            style={[
              styles.row,
              index > 0 && {
                borderTopColor: theme.colors.outlineVariant,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View style={styles.dayCopy}>
              <Text variant='titleSmall'>{item.day}</Text>
              <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
                {item.date}
              </Text>
            </View>
            <View style={styles.dayTrack}>
              <View
                style={[
                  styles.track,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: theme.colors.secondary,
                      width: `${Math.min(100, Math.max(0, item.progress * 100))}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <Text variant='titleMedium' style={styles.count}>
              {item.count}
            </Text>
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionSubtitle: {
    marginBottom: 12,
    marginTop: 3,
  },
  card: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
  },
  rank: {
    alignItems: 'center',
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rowCopy: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  track: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
    height: '100%',
  },
  count: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
  dayCopy: {
    width: 92,
  },
  dayTrack: {
    flex: 1,
    minWidth: 48,
  },
});
