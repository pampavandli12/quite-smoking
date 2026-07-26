import { StyleSheet } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';

const FEATURES = [
  {
    icon: 'chart-bar',
    title: 'Full smoking history',
    description:
      'See all your past cigarette logs with daily, weekly, and monthly breakdowns.',
  },
  {
    icon: 'currency-inr',
    title: 'Money saved',
    description:
      "Watch your savings grow as you stay smoke-free. It's not just good for your health, but also your wallet!",
  },
  {
    icon: 'calendar-check',
    title: 'Smoke-free streaks',
    description:
      'Track your streak, hit milestones, and feel the momentum of every smoke-free day.',
  },
  {
    icon: 'fire',
    title: 'Trigger analysis',
    description:
      'Discover what situations and emotions drive your cravings the most.',
  },
  {
    icon: 'clock-time-eleven-outline',
    title: 'Peak smoking hours',
    description:
      'See exactly which hours of the day you smoke most — awareness is the first step.',
  },
];

const BENEFITS = [
  '7 days completely free',
  'Cancel anytime',
  'Full access to all features',
];

export function PaywallFeatures() {
  return (
    <Surface style={styles.section} elevation={0}>
      <Text variant='titleLarge' style={styles.sectionTitle}>
        What You&apos;ll Get
      </Text>

      {FEATURES.map((feature) => (
        <Surface key={feature.title} style={styles.featureItem} elevation={0}>
          <Icon source={feature.icon} size={24} color='#4CAF50' />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant='bodyLarge' style={styles.featureTitle}>
              {feature.title}
            </Text>
            <Text variant='bodyMedium' style={styles.featureDescription}>
              {feature.description}
            </Text>
          </Surface>
        </Surface>
      ))}
    </Surface>
  );
}

export function PaywallBenefits() {
  const theme = useTheme();

  return (
    <Surface
      style={[
        styles.benefitsCard,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
      elevation={0}
    >
      {BENEFITS.map((benefit) => (
        <Surface key={benefit} style={styles.benefitRow} elevation={0}>
          <Icon source='check-circle' size={20} color='#4CAF50' />
          <Text variant='bodyMedium' style={styles.benefitText}>
            {benefit}
          </Text>
        </Surface>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    opacity: 0.7,
  },
  benefitsCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  benefitText: {
    marginLeft: 12,
  },
});
