import type { TriggerCountRow } from '@/db';
import type { DetailedWeeklyBreakdownItem } from '@/utils/statistics';
import { StyleSheet, View } from 'react-native';
import { Card, Surface, Text } from 'react-native-paper';

type TopTriggersSectionProps = {
  triggers: TriggerCountRow[];
};

export function TopTriggersSection({ triggers }: TopTriggersSectionProps) {
  if (triggers.length === 0) {
    return null;
  }

  const maximumCount = triggers[0]?.count || 1;

  return (
    <Surface style={styles.section} elevation={0}>
      <Text variant='titleLarge' style={styles.sectionTitle}>
        Top Triggers
      </Text>
      <Text variant='bodyMedium' style={styles.sectionSubtitle}>
        What makes you reach for a cigarette
      </Text>

      {triggers.map((item, index) => (
        <Card key={item.trigger} style={styles.triggerCard}>
          <Card.Content style={styles.triggerCardContent}>
            <Surface style={styles.triggerLeft} elevation={0}>
              <Surface style={styles.triggerRank} elevation={0}>
                <Text variant='bodyMedium' style={styles.triggerRankText}>
                  {index + 1}
                </Text>
              </Surface>
              <Text variant='bodyLarge' style={styles.triggerName}>
                {item.trigger}
              </Text>
            </Surface>
            <Surface style={styles.triggerRight} elevation={0}>
              <Surface
                style={styles.triggerProgressBarContainer}
                elevation={0}
              >
                <View
                  style={[
                    styles.triggerProgressBarFilled,
                    { width: `${(item.count / maximumCount) * 100}%` },
                  ]}
                />
              </Surface>
              <Text variant='titleMedium' style={styles.triggerCount}>
                {item.count}
              </Text>
            </Surface>
          </Card.Content>
        </Card>
      ))}
    </Surface>
  );
}

type DailyBreakdownSectionProps = {
  breakdown: DetailedWeeklyBreakdownItem[];
};

export function DailyBreakdownSection({
  breakdown,
}: DailyBreakdownSectionProps) {
  if (breakdown.length === 0) {
    return null;
  }

  return (
    <Surface style={styles.section} elevation={0}>
      <Text variant='titleLarge' style={styles.sectionTitle}>
        Daily Breakdown
      </Text>

      {breakdown.map((item) => (
        <Card key={item.date} style={styles.dayCard}>
          <Card.Content style={styles.dayCardContent}>
            <Surface style={styles.dayLeft} elevation={0}>
              <Text variant='bodyLarge' style={styles.dayName}>
                {item.day}
              </Text>
              <Text variant='bodySmall' style={styles.dayDate}>
                {item.date}
              </Text>
            </Surface>
            <Surface style={styles.dayRight} elevation={0}>
              <Surface style={styles.progressBarContainer} elevation={0}>
                <View
                  style={[
                    styles.progressBarFilled,
                    { width: `${item.progress * 100}%` },
                  ]}
                />
              </Surface>
              <Text variant='titleMedium' style={styles.dayCount}>
                {item.count}
              </Text>
            </Surface>
          </Card.Content>
        </Card>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    opacity: 0.6,
    marginBottom: 16,
  },
  triggerCard: {
    marginBottom: 12,
  },
  triggerCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  triggerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerRankText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  triggerName: {
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  triggerProgressBarContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  triggerProgressBarFilled: {
    height: '100%',
    backgroundColor: '#4285F4',
    borderRadius: 6,
  },
  triggerCount: {
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
    color: '#4285F4',
  },
  dayCard: {
    marginBottom: 12,
  },
  dayCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLeft: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dayName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  dayDate: {
    opacity: 0.6,
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1.8,
    backgroundColor: 'transparent',
  },
  progressBarContainer: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8E8E8',
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: '#4285F4',
    borderRadius: 6,
  },
  dayCount: {
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
});
