import PurchaseService, {
  REVENUECAT_ENTITLEMENT_ID,
} from '@/services/purchases';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { getSmokingSettings } from '@/db/queries';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Divider,
  Icon,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { URL_LINKS } from '@/utils/constants';

const PAYWALL_BYPASS = Constants.expoConfig?.extra?.PAYWALL_BYPASS === 'true';
export default function SubscriptionPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [subscriptionPackage, setSubscriptionPackage] =
    useState<PurchasesPackage | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (PAYWALL_BYPASS) {
        router.replace('/(tabs)/home');
        return;
      }

      // Ensure user has provided cigarettes/day and cost before showing paywall
      try {
        const settings = await getSmokingSettings();
        if (!settings) {
          router.replace('/setup-smoking');
          return;
        }
      } catch (err) {
        console.error('Error checking smoking settings:', err);
      }

      checkSubscription();
      loadOfferings();
    })();
  }, []);

  const checkSubscription = async () => {
    try {
      const customerInfo = await PurchaseService.getCustomerInfo();
      console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));
      setChecking(false);
      if (
        customerInfo &&
        typeof customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !==
          'undefined'
      ) {
        router.replace('/(tabs)/home');
      }
    } catch {
      setChecking(false);
      // Error fetching customer info
      Alert.alert('Error', 'Failed to fetch customer information.');
    }
  };

  const loadOfferings = async () => {
    try {
      const offering = await PurchaseService.getOfferings();
      if (offering && offering.availablePackages.length > 0) {
        // Get monthly package or first available package
        const monthlyPackage =
          offering.monthly || offering.availablePackages[0];
        setSubscriptionPackage(monthlyPackage);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  };

  const priceString = useCallback(() => {
    if (!subscriptionPackage) return '';
    const price = subscriptionPackage.product.priceString;
    const period = 'monthly'; // Assuming monthly for simplicity
    return `${price}/${period}`;
  }, [subscriptionPackage]);
  const handleSubscribe = async () => {
    if (!subscriptionPackage) {
      Alert.alert(
        'Not Available',
        'Subscription packages are not available at the moment. Please try again later.',
      );
      return;
    }

    setLoading(true);
    try {
      const { success, customerInfo, error } =
        await PurchaseService.purchasePackage(subscriptionPackage);

      if (success && customerInfo) {
        Alert.alert('Success!', 'Welcome to Premium! 🎉', [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]);
      } else if (error && !error.userCancelled) {
        Alert.alert(
          'Purchase Failed',
          'Something went wrong. Please try again.',
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const { success, customerInfo } =
        await PurchaseService.restorePurchases();

      if (success && customerInfo) {
        // Check if we're in mock mode
        const isMock = PurchaseService.isMockMode();

        if (isMock) {
          // In mock mode, just show a message
          Alert.alert(
            'Mock Mode',
            'Running in development mode. No purchases to restore.',
          );
        } else {
          const hasEntitlement =
            typeof customerInfo.entitlements?.active?.[
              REVENUECAT_ENTITLEMENT_ID
            ] !== 'undefined';

          if (hasEntitlement) {
            Alert.alert('Success!', 'Your purchase has been restored! 🎉', [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)/home'),
              },
            ]);
          } else {
            Alert.alert(
              'No Purchases Found',
              "We couldn't find any previous purchases to restore.",
            );
          }
        }
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // Show loading indicator while checking subscription status
  if (checking) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text variant='bodyLarge' style={styles.loadingText}>
          Checking subscription status...
        </Text>
      </View>
    );
  }
  const redirectToPrivacyPolicy = () => {
    const url = URL_LINKS.privacy;
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err),
    );
  };
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
      ]}
    >
      {/* Header Image */}
      <Surface style={styles.headerImageContainer} elevation={0}>
        <Icon source='cigar-off' size={60} color={theme.colors.primary} />
        <Text variant='bodyLarge' style={styles.pillText}>
          7 days completely free
        </Text>
      </Surface>

      {/* Title Section */}
      <Surface style={styles.titleSection} elevation={0}>
        <Text variant='headlineMedium' style={styles.title}>
          Unlock your quit journey
        </Text>
        <Text variant='bodyLarge' style={styles.subtitle}>
          Try premium free — cancel anytime, no commitment.
        </Text>
      </Surface>

      <Divider style={styles.divider} />

      {/* What You'll Get Section */}
      <Surface style={styles.section} elevation={0}>
        <Text variant='titleLarge' style={styles.sectionTitle}>
          What You&apos;ll Get
        </Text>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source='chart-bar' size={24} color='#4CAF50' />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant='bodyLarge' style={styles.featureTitle}>
              Full smoking history
            </Text>
            <Text variant='bodyMedium' style={styles.featureDescription}>
              See all your past cigarette logs with daily, weekly, and monthly
              breakdowns.
            </Text>
          </Surface>
        </Surface>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source='fire' size={24} color='#4CAF50' />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant='bodyLarge' style={styles.featureTitle}>
              Trigger analysis
            </Text>
            <Text variant='bodyMedium' style={styles.featureDescription}>
              Discover what situations and emotions drive your cravings the
              most.
            </Text>
          </Surface>
        </Surface>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source='clock-time-eleven-outline' size={24} color='#4CAF50' />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant='bodyLarge' style={styles.featureTitle}>
              Peak smoking hours
            </Text>
            <Text variant='bodyMedium' style={styles.featureDescription}>
              See exactly which hours of the day you smoke most — awareness is
              the first step.
            </Text>
          </Surface>
        </Surface>

        <Surface style={styles.featureItem} elevation={0}>
          <Icon source='calendar-check' size={24} color='#4CAF50' />
          <Surface style={styles.featureTextContainer} elevation={0}>
            <Text variant='bodyLarge' style={styles.featureTitle}>
              Smoke-free streaks
            </Text>
            <Text variant='bodyMedium' style={styles.featureDescription}>
              Track your streak, hit milestones, and feel the momentum of every
              smoke-free day.
            </Text>
          </Surface>
        </Surface>
      </Surface>

      <Divider style={styles.divider} />

      {/* Pricing Section */}
      <Surface style={styles.pricingSection} elevation={0}>
        <Text variant='displaySmall' style={styles.price}>
          {priceString()}
        </Text>
        <Text variant='bodyMedium' style={styles.priceSubtext}>
          after 7-day free trial
        </Text>
      </Surface>

      {/* Benefits List */}
      <Surface
        style={[
          styles.benefitsCard,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
        elevation={0}
      >
        <Surface style={styles.benefitRow} elevation={0}>
          <Icon source='check-circle' size={20} color='#4CAF50' />
          <Text variant='bodyMedium' style={styles.benefitText}>
            7 days completely free
          </Text>
        </Surface>
        <Surface style={styles.benefitRow} elevation={0}>
          <Icon source='check-circle' size={20} color='#4CAF50' />
          <Text variant='bodyMedium' style={styles.benefitText}>
            Cancel anytime
          </Text>
        </Surface>
        <Surface style={styles.benefitRow} elevation={0}>
          <Icon source='check-circle' size={20} color='#4CAF50' />
          <Text variant='bodyMedium' style={styles.benefitText}>
            Full access to all features
          </Text>
        </Surface>
      </Surface>

      {/* Payment Methods */}
      <Surface style={styles.paymentSection} elevation={0}>
        <Surface style={styles.secureRow} elevation={0}>
          <Icon source='lock' size={16} color={theme.colors.onSurfaceVariant} />
          <Text variant='bodySmall' style={styles.secureText}>
            Secure payment processing
          </Text>
        </Surface>
      </Surface>

      {/* CTA Button */}
      <Button
        mode='contained'
        style={styles.ctaButton}
        contentStyle={styles.ctaButtonContent}
        onPress={handleSubscribe}
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Start 7-Day Free Trial'}
      </Button>

      {/* Restore Purchase Button */}
      <Button
        mode='text'
        style={styles.restoreButton}
        textColor={theme.colors.secondary}
        onPress={handleRestore}
        disabled={loading}
      >
        Restore Purchase
      </Button>

      {/* privacy policy */}
      <Button
        mode='text'
        style={styles.restoreButton}
        textColor={theme.colors.secondary}
        onPress={redirectToPrivacyPolicy}
        disabled={loading}
      >
        Privacy Policy
      </Button>
      {/* Terms */}
      <Text variant='bodySmall' style={styles.terms}>
        By continuing, you agree to our Terms of Service and Privacy Policy.
        Subscription automatically renews unless cancelled at least 24 hours
        before the end of the trial period.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerImageContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  divider: {
    marginVertical: 20,
  },
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
  pricingSection: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  price: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceSubtext: {
    opacity: 0.7,
    marginBottom: 8,
  },
  savings: {
    color: '#4CAF50',
    fontWeight: '600',
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
  paymentSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  paymentIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secureText: {
    marginLeft: 6,
    opacity: 0.7,
  },
  ctaButton: {
    marginBottom: 8,
    borderRadius: 8,
  },
  ctaButtonContent: {
    paddingVertical: 8,
  },
  restoreButton: {
    marginBottom: 8,
  },
  skipButton: {
    marginBottom: 16,
  },
  terms: {
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  pillText: {
    marginTop: 12,
    fontWeight: '600',
    fontSize: 14,
    backgroundColor: '#c8dfc9',
    color: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});
