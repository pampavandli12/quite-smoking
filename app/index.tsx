import { type AppTheme } from '@/app/theme';
import {
  AppSymbol,
  appSymbolSource,
  type AppSymbolName,
} from '@/components/AppSymbol';
import {
  PremiumCard,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui';
import { getSmokingSettings, getWeeklyBreakdown } from '@/db/queries';
import PurchaseService, {
  hasActivePremiumEntitlement,
} from '@/services/purchases';
import { URL_LINKS } from '@/utils/constants';
import { isUserCancelledPurchaseError } from '@/utils/purchaseErrors';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
  IconButton,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PAYWALL_BYPASS = Constants.expoConfig?.extra?.PAYWALL_BYPASS === 'true';
const PREMIUM_FEATURES: {
  icon: AppSymbolName;
  title: string;
  description: string;
}[] = [
  {
    icon: 'lifebuoy',
    title: 'Unlimited craving Rescue',
    description: 'Guided three- or five-minute support whenever an urge appears.',
  },
  {
    icon: 'chart-timeline-variant',
    title: 'Month and year Progress',
    description: 'Explore longer-term trends with responsive interactive charts.',
  },
  {
    icon: 'lightbulb-on-outline',
    title: 'Advanced pattern insights',
    description: 'See peak smoking hours and which coping strategies help most.',
  },
  {
    icon: 'file-chart-outline',
    title: 'Weekly PDF reports',
    description: 'Create private progress summaries entirely on your device.',
  },
];

function packageLabel(subscriptionPackage: PurchasesPackage) {
  const type = String(subscriptionPackage.packageType).toLowerCase();
  if (type === 'annual') return 'Yearly';
  if (type === 'monthly') return 'Monthly';
  if (type === 'weekly') return 'Weekly';
  if (type === 'three_month') return 'Three months';
  if (type === 'six_month') return 'Six months';
  if (type === 'lifetime') return 'Lifetime';
  return subscriptionPackage.product.title || 'Premium';
}

function periodLabel(period: string | null) {
  if (!period) return '';
  const match = /^P(\d+)([DWMY])$/.exec(period);
  if (!match) return '';
  const amount = Number(match[1]);
  const names: Record<string, [string, string]> = {
    D: ['day', 'days'],
    W: ['week', 'weeks'],
    M: ['month', 'months'],
    Y: ['year', 'years'],
  };
  const name = names[match[2]];
  return name ? `${amount} ${amount === 1 ? name[0] : name[1]}` : '';
}

export default function SubscriptionPage() {
  const { paywall } = useLocalSearchParams<{ paywall?: string }>();
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [subscriptionPackage, setSubscriptionPackage] =
    useState<PurchasesPackage | null>(null);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [purchaseUnavailableReason, setPurchaseUnavailableReason] = useState('');

  const dismissPaywall = useCallback(() => {
    router.replace('/(tabs)/home');
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const customerInfo = await PurchaseService.getCustomerInfo();
      if (customerInfo && hasActivePremiumEntitlement(customerInfo)) {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error checking customer information:', error);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadOfferings = useCallback(async () => {
    setOfferingsLoading(true);
    try {
      const availability = PurchaseService.getAvailability();
      if (!availability.available) {
        setPurchaseUnavailableReason(
          availability.reason ??
            'Subscriptions are temporarily unavailable. The free app remains available.',
        );
        setPackages([]);
        setSubscriptionPackage(null);
        return;
      }
      const offering = await PurchaseService.getOfferings();
      const available = offering?.availablePackages ?? [];
      setPurchaseUnavailableReason('');
      setPackages(available);
      setSubscriptionPackage(
        offering?.annual ?? offering?.monthly ?? available[0] ?? null,
      );
    } catch (error) {
      console.error('Error loading offerings:', error);
      setPackages([]);
      setSubscriptionPackage(null);
      setPurchaseUnavailableReason(
        'Subscriptions are temporarily unavailable. The free app remains available.',
      );
    } finally {
      setOfferingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      if (PAYWALL_BYPASS) {
        router.replace('/(tabs)/home');
        return;
      }
      try {
        const settings = await getSmokingSettings();
        if (!settings) {
          router.replace('/setup-smoking');
          return;
        }
        if (paywall !== 'true') {
          router.replace('/(tabs)/home');
          return;
        }
        const weekly = await getWeeklyBreakdown();
        setWeeklyTotal(weekly.reduce((sum, value) => sum + value, 0));
      } catch (error) {
        console.error('Error preparing Premium screen:', error);
      }
      void checkSubscription();
      void loadOfferings();
    })();
  }, [checkSubscription, loadOfferings, paywall]);

  const handleSubscribe = async () => {
    if (!subscriptionPackage) {
      Alert.alert(
        'Premium is unavailable',
        'Subscription packages could not be loaded. Please try again.',
      );
      return;
    }
    setLoading(true);
    try {
      const { success, customerInfo, error } =
        await PurchaseService.purchasePackage(subscriptionPackage);
      if (
        success &&
        customerInfo &&
        hasActivePremiumEntitlement(customerInfo)
      ) {
        Alert.alert('Premium is ready', 'Welcome to Quit Smoking Premium.', [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]);
      } else if (success && customerInfo) {
        Alert.alert(
          'Purchase needs confirmation',
          'Your store purchase completed, but Premium access has not been confirmed yet. Try Restore purchases in a moment.',
        );
      } else if (error && !isUserCancelledPurchaseError(error)) {
        Alert.alert(
          'Purchase could not be completed',
          'Nothing was charged. Please try again.',
        );
      }
    } catch (error) {
      console.error('Unexpected purchase error:', error);
      Alert.alert(
        'Purchase could not be completed',
        'Nothing was charged. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const { success, customerInfo, error } =
        await PurchaseService.restorePurchases();
      if (success && customerInfo) {
        if (PurchaseService.isMockMode()) {
          Alert.alert(
            'Development mode',
            'No store purchases are available to restore in development mode.',
          );
        } else if (hasActivePremiumEntitlement(customerInfo)) {
          Alert.alert('Purchase restored', 'Quit Smoking Premium is active.', [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)/home'),
            },
          ]);
        } else {
          Alert.alert(
            'No purchase found',
            'We could not find an active Premium purchase for this store account.',
          );
        }
      } else if (error) {
        Alert.alert('Restore unavailable', 'Please try again in a moment.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore unavailable', 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Unable to open paywall link:', error);
      Alert.alert('Link unavailable', 'Please try again later.');
    }
  };

  if (checking) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View
          style={[
            styles.loadingIcon,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <AppSymbol name='leaf' size={34} color={theme.colors.primary} />
        </View>
        <Text variant='headlineSmall' style={styles.loadingTitle}>
          Quit Smoking
        </Text>
        <ActivityIndicator color={theme.colors.primary} style={styles.spinner} />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          Checking Premium access…
        </Text>
        <Button mode='text' onPress={dismissPaywall} style={styles.loadingSkip}>
          Continue with free
        </Button>
      </View>
    );
  }

  const selectedPeriod = periodLabel(
    subscriptionPackage?.product.subscriptionPeriod ?? null,
  );
  const intro = subscriptionPackage?.product.introPrice;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <ScreenHeader
        action={
          <IconButton
            accessibilityLabel='Close Premium screen'
            icon={appSymbolSource('close')}
            mode='contained-tonal'
            onPress={dismissPaywall}
          />
        }
        subtitle='Deeper support, whenever you need it.'
        title='Quit Smoking'
      />

      <PremiumCard
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.primaryContainer,
          },
        ]}
      >
        <View
          style={[
            styles.premiumBadge,
            { backgroundColor: theme.appColors.premiumContainer },
          ]}
        >
          <AppSymbol
            name='crown-outline'
            size={17}
            color={theme.appColors.premium}
          />
          <Text
            variant='labelMedium'
            style={{ color: theme.appColors.premium, fontWeight: '700' }}
          >
            QUIT SMOKING PREMIUM
          </Text>
        </View>
        <Text variant='headlineMedium' style={styles.heroTitle}>
          More support when you need it most
        </Text>
        <Text
          variant='bodyLarge'
          style={[styles.heroCopy, { color: theme.colors.onPrimaryContainer }]}
        >
          Go beyond tracking with unlimited Rescue, deeper patterns, and private progress reports.
        </Text>
        {weeklyTotal > 0 && (
          <Surface
            elevation={0}
            style={[
              styles.preview,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View
              style={[
                styles.previewIcon,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <AppSymbol
                name='chart-timeline-variant'
                size={22}
                color={theme.colors.secondary}
              />
            </View>
            <Text style={[styles.previewCopy, { color: theme.colors.onSurfaceVariant }]}>
              You recorded <Text style={styles.previewStrong}>{weeklyTotal}</Text>{' '}
              {weeklyTotal === 1 ? 'moment' : 'moments'} this week. Premium helps turn them into deeper patterns.
            </Text>
          </Surface>
        )}
      </PremiumCard>

      <SectionHeader
        title='What Premium unlocks'
        subtitle='Free tracking, planning, and weekly basics remain available.'
      />
      <PremiumCard>
        {PREMIUM_FEATURES.map((feature, index) => (
          <View key={feature.title}>
            {index > 0 && <Divider />}
            <View style={styles.featureRow}>
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: theme.appColors.premiumContainer },
                ]}
              >
                <AppSymbol
                  name={feature.icon}
                  size={22}
                  color={theme.appColors.premium}
                />
              </View>
              <View style={styles.featureCopy}>
                <Text variant='titleSmall' style={styles.featureTitle}>
                  {feature.title}
                </Text>
                <Text
                  variant='bodySmall'
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    lineHeight: 19,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </PremiumCard>

      <View style={styles.chooseSection}>
        <SectionHeader
          title='Choose your Premium access'
          subtitle='Store pricing and renewal terms are shown exactly as provided.'
        />
        {offeringsLoading ? (
          <Surface
            elevation={0}
            style={[
              styles.offeringsLoading,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
          >
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Loading store options…
            </Text>
          </Surface>
        ) : packages.length > 0 ? (
          <View style={styles.packages}>
            {packages.map((item) => {
              const selected = subscriptionPackage?.identifier === item.identifier;
              const period = periodLabel(item.product.subscriptionPeriod);
              return (
                <TouchableRipple
                  accessibilityRole='radio'
                  accessibilityState={{ checked: selected }}
                  borderless
                  key={item.identifier}
                  onPress={() => setSubscriptionPackage(item)}
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: selected
                        ? theme.colors.primaryContainer
                        : theme.colors.elevation.level1,
                      borderColor: selected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.packageContent}>
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outline,
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: theme.colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.packageCopy}>
                      <Text variant='titleMedium' style={styles.packageTitle}>
                        {packageLabel(item)}
                      </Text>
                      {!!period && (
                        <Text
                          variant='bodySmall'
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          Billed every {period}
                        </Text>
                      )}
                    </View>
                    <Text variant='titleLarge' style={styles.packagePrice}>
                      {item.product.priceString}
                    </Text>
                  </View>
                </TouchableRipple>
              );
            })}
          </View>
        ) : (
          <Surface
            elevation={0}
            style={[
              styles.offeringsUnavailable,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <AppSymbol
              name='store-alert-outline'
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
            <View style={styles.unavailableCopy}>
              <Text variant='titleSmall'>Store options are unavailable</Text>
              <Text
                variant='bodySmall'
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {purchaseUnavailableReason ||
                  'You can continue using the free app and try again later.'}
              </Text>
            </View>
            <Button compact onPress={loadOfferings}>
              Retry
            </Button>
          </Surface>
        )}
      </View>

      {subscriptionPackage && (
        <Surface
          elevation={0}
          style={[
            styles.priceSummary,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text
            variant='labelLarge'
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {packageLabel(subscriptionPackage)} Premium
          </Text>
          <Text variant='displaySmall' style={styles.price}>
            {subscriptionPackage.product.priceString}
          </Text>
          {!!selectedPeriod && (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Renews every {selectedPeriod} unless cancelled.
            </Text>
          )}
          {intro && (
            <Text
              variant='bodySmall'
              style={[styles.intro, { color: theme.appColors.premium }]}
            >
              Store introductory offer: {intro.priceString} for {intro.cycles}{' '}
              {intro.cycles === 1 ? 'period' : 'periods'}, if eligible.
            </Text>
          )}
          <Text
            variant='bodySmall'
            style={[styles.storeCopy, { color: theme.colors.onSurfaceVariant }]}
          >
            Eligibility, exact renewal terms, and confirmation are shown by your app store before purchase.
          </Text>
        </Surface>
      )}

      <PremiumCard style={styles.privacyCard}>
        <View style={styles.privacyRow}>
          <View
            style={[
              styles.privacyIcon,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <AppSymbol
              name='shield-lock-outline'
              size={23}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.privacyCopy}>
            <Text variant='titleSmall' style={styles.featureTitle}>
              Private by design
            </Text>
            <Text
              variant='bodySmall'
              style={{ color: theme.colors.onSurfaceVariant, lineHeight: 19 }}
            >
              Your history, Rescue sessions, plans, and reports stay on this
              device unless you choose to export them. Google Play and
              RevenueCat process purchase history when you subscribe.
            </Text>
          </View>
        </View>
      </PremiumCard>

      <Button
        contentStyle={styles.primaryContent}
        disabled={loading || !subscriptionPackage}
        loading={loading}
        mode='contained'
        onPress={handleSubscribe}
        style={styles.primary}
      >
        {loading ? 'Processing…' : 'Continue with Premium'}
      </Button>
      <Button disabled={loading} mode='text' onPress={dismissPaywall}>
        Not now — continue with free
      </Button>
      <Button disabled={loading} mode='text' onPress={handleRestore}>
        Restore purchases
      </Button>

      <View style={styles.legalLinks}>
        <Button compact mode='text' onPress={() => openUrl(URL_LINKS.terms)}>
          Terms
        </Button>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>·</Text>
        <Button compact mode='text' onPress={() => openUrl(URL_LINKS.privacy)}>
          Privacy
        </Button>
      </View>
      <Text
        variant='bodySmall'
        style={[styles.legal, { color: theme.colors.onSurfaceVariant }]}
      >
        Your subscription is managed by your app store. Free tracking and planning remain available without a purchase.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  hero: {
    overflow: 'hidden',
  },
  premiumBadge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroTitle: {
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 16,
  },
  heroCopy: {
    lineHeight: 24,
    marginTop: 9,
  },
  preview: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 11,
    marginTop: 18,
    padding: 13,
    width: '100%',
  },
  previewIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  previewCopy: { flex: 1, lineHeight: 20 },
  previewStrong: { fontWeight: '800' },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    minHeight: 78,
    paddingVertical: 11,
  },
  featureIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  featureCopy: { flex: 1, minWidth: 0 },
  featureTitle: { fontWeight: '700', marginBottom: 3 },
  chooseSection: { marginTop: 0 },
  packages: { gap: 10, marginTop: 14 },
  packageCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  packageContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    padding: 14,
  },
  radioOuter: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioInner: { borderRadius: 5, height: 10, width: 10 },
  packageCopy: { flex: 1, minWidth: 0 },
  packageTitle: { fontWeight: '700' },
  packagePrice: {
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  offeringsLoading: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    padding: 18,
  },
  offeringsUnavailable: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 14,
  },
  unavailableCopy: { flex: 1, minWidth: 0 },
  priceSummary: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
    padding: 18,
  },
  price: {
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    marginVertical: 4,
  },
  intro: { fontWeight: '700', marginTop: 9, textAlign: 'center' },
  storeCopy: { lineHeight: 18, marginTop: 8, textAlign: 'center' },
  privacyCard: { marginTop: 16 },
  privacyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  privacyIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  privacyCopy: { flex: 1, minWidth: 0 },
  primary: { borderRadius: 999, marginTop: 20 },
  primaryContent: { minHeight: 54 },
  legalLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  legal: { lineHeight: 18, paddingHorizontal: 12, textAlign: 'center' },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  loadingTitle: { fontWeight: '700', marginTop: 16 },
  spinner: { marginBottom: 10, marginTop: 20 },
  loadingSkip: { marginTop: 10 },
});
