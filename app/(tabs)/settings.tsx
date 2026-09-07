import { getSmokingSettings } from '@/db';
import { type AppTheme } from '@/app/theme';
import { AppSymbol, type AppSymbolName } from '@/components/AppSymbol';
import {
  PremiumCard,
  ScreenContainer,
  ScreenHeader,
  SectionHeader,
  StatusPill,
} from '@/components/ui';
import { resolveFeatureAccess } from '@/services/accessService';
import PurchaseService from '@/services/purchases';
import {
  disableNotifications,
  enableDailyCheckIn,
  getNotificationPreferences,
} from '@/services/notificationService';
import {
  getUserPreferences,
  saveUserPreferences,
  type MotionPreference,
} from '@/services/preferencesService';
import { exportWeeklyReport } from '@/services/reportService';
import { URL_LINKS } from '@/utils/constants';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import {
  Divider,
  SegmentedButtons,
  Switch,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

type SettingsRowProps = {
  icon: AppSymbolName;
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
};

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  trailing,
  danger = false,
}: SettingsRowProps) {
  const theme = useTheme();
  return (
    <TouchableRipple onPress={onPress} disabled={!onPress}>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: danger ? theme.colors.errorContainer : theme.colors.surfaceVariant }]}>
          <AppSymbol
            name={icon}
            size={20}
            color={danger ? theme.colors.error : theme.colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant='titleSmall' style={{ color: danger ? theme.colors.error : theme.colors.onSurface }}>{label}</Text>
          {value ? <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>{value}</Text> : null}
        </View>
        {trailing ??
          (onPress ? (
            <AppSymbol
              name='chevron-right'
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          ) : null)}
      </View>
    </TouchableRipple>
  );
}

export default function SettingsPage() {
  const theme = useTheme<AppTheme>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system');
  const [baseline, setBaseline] = useState('Not configured');
  const [accessTier, setAccessTier] = useState('free');
  const [purchaseSupportId, setPurchaseSupportId] = useState<string | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const [notifications, preferences, settings, access, supportId] =
        await Promise.all([
          getNotificationPreferences(),
          getUserPreferences(),
          getSmokingSettings(),
          resolveFeatureAccess(),
          PurchaseService.getAppUserID(),
        ]);
      setNotificationsEnabled(notifications?.enabled === 1);
      setHapticsEnabled(preferences.hapticsEnabled);
      setMotionPreference(preferences.motionPreference);
      setBaseline(
        settings
          ? `${settings.cigarettesPerDay}/day · ₹${(
              settings.costPerCigaretteCents / 100
            ).toFixed(2)} each`
          : 'Not configured',
      );
      setAccessTier(access.tier);
      setPurchaseSupportId(supportId);
    } catch (error) {
      console.error('Error loading Settings:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return PurchaseService.subscribeToCustomerInfoUpdates(() => {
        void load();
      });
    }, [load]),
  );

  const persistPreferences = async (
    nextMotion: MotionPreference,
    nextHaptics: boolean,
  ) => {
    setMotionPreference(nextMotion);
    setHapticsEnabled(nextHaptics);
    const result = await saveUserPreferences({
      motionPreference: nextMotion,
      hapticsEnabled: nextHaptics,
    });
    if (!result.success) Alert.alert('Could not save preference', 'Please try again.');
  };

  const toggleNotifications = async () => {
    const result = notificationsEnabled
      ? await disableNotifications()
      : await enableDailyCheckIn('20:00');
    if (result.success) {
      setNotificationsEnabled((value) => !value);
    } else {
      Alert.alert(
        'Notifications unavailable',
        result.error instanceof Error ? result.error.message : 'Please try again.',
      );
    }
  };

  const openUrl = async (url: string) => {
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Link unavailable', 'Please try again later.');
    }
  };

  const version = require('../../package.json').version as string;
  const manageSubscriptionUrl =
    Platform.OS === 'ios'
      ? URL_LINKS.appStoreSubscriptions
      : URL_LINKS.googlePlaySubscriptions;

  const requestPurchaseDataDeletion = () => {
    const identifierCopy = purchaseSupportId
      ? `\n\nPrivate purchase support ID: ${purchaseSupportId}`
      : '';
    void openUrl(
      `mailto:${URL_LINKS.feedback}?subject=${encodeURIComponent(
        'Purchase data deletion request - Quit Smoking',
      )}&body=${encodeURIComponent(
        `Please help me delete purchase data associated with this app.${identifierCopy}`,
      )}`,
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title='Settings' subtitle='Shape the experience around you.' />

      <PremiumCard
        style={[
          styles.premiumCard,
          { backgroundColor: theme.appColors.premiumContainer },
        ]}
      >
        <View style={styles.premiumRow}>
          <View style={[styles.crown, { backgroundColor: theme.appColors.premium }]}>
            <AppSymbol
              name='crown-outline'
              size={24}
              color={theme.colors.surface}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant='labelLarge' style={{ color: theme.appColors.premium }}>
              {accessTier === 'premium' ? 'Premium active' : accessTier === 'legacy' ? 'Legacy access' : 'Free plan'}
            </Text>
            <Text variant='bodySmall'>Your subscription and feature access.</Text>
          </View>
          <StatusPill label={accessTier} tone='premium' />
        </View>
        <SettingsRow icon='credit-card-outline' label='Premium and subscription' onPress={() => router.push('/?paywall=true')} />
        <Divider />
        <SettingsRow
          icon='external-link'
          label='Manage subscription'
          value='Cancel or change through your app store'
          onPress={() => openUrl(manageSubscriptionUrl)}
        />
      </PremiumCard>

      <SectionHeader title='Journey' />
      <PremiumCard>
        <SettingsRow icon='tune' label='Baseline and cost' value={baseline} onPress={() => router.push('/setup-smoking')} />
        <Divider />
        <SettingsRow icon='history' label='Smoking history' value='Review and correct entries' onPress={() => router.push('/history')} />
        <Divider />
        <SettingsRow
          icon='file-export-outline'
          label='Export weekly report'
          value='Private, on-device PDF'
          onPress={async () => {
            const access = await resolveFeatureAccess();
            if (!access.canExportReports) {
              router.push('/?paywall=true');
              return;
            }
            const result = await exportWeeklyReport();
            if (!result.success) {
              Alert.alert('Export unavailable', result.error instanceof Error ? result.error.message : 'Please try again.');
            }
          }}
        />
      </PremiumCard>

      <SectionHeader title='Preferences' />
      <PremiumCard>
        <SettingsRow
          icon='vibrate'
          label='Haptic feedback'
          value='Gentle feedback for meaningful actions'
          trailing={<Switch value={hapticsEnabled} onValueChange={(value) => persistPreferences(motionPreference, value)} />}
        />
        <Divider />
        <View style={styles.motion}>
          <Text variant='titleSmall'>Motion</Text>
          <Text variant='bodySmall' style={{ color: theme.colors.onSurfaceVariant }}>
            Reduced motion removes scaling and movement.
          </Text>
          <SegmentedButtons
            value={motionPreference}
            onValueChange={(value) => persistPreferences(value as MotionPreference, hapticsEnabled)}
            buttons={[
              { value: 'system', label: 'System' },
              { value: 'reduced', label: 'Reduced' },
              { value: 'full', label: 'Full' },
            ]}
            style={styles.motionControl}
          />
        </View>
      </PremiumCard>

      <SectionHeader title='Notifications' />
      <PremiumCard>
        <SettingsRow
          icon='bell-outline'
          label='Daily check-in'
          value={notificationsEnabled ? 'Scheduled for 8:00 PM' : 'Off'}
          trailing={<Switch value={notificationsEnabled} onValueChange={toggleNotifications} />}
        />
      </PremiumCard>

      <SectionHeader title='Support and privacy' />
      <PremiumCard>
        <SettingsRow
          icon='email-outline'
          label='Send feedback'
          onPress={() => openUrl(`mailto:${URL_LINKS.feedback}?subject=${encodeURIComponent('Feedback - Quit Smoking')}`)}
        />
        <Divider />
        <SettingsRow icon='file-document-outline' label='Terms and conditions' onPress={() => openUrl(URL_LINKS.terms)} />
        <Divider />
        <SettingsRow icon='shield-check-outline' label='Privacy policy' onPress={() => openUrl(URL_LINKS.privacy)} />
        <Divider />
        <SettingsRow
          icon='database-remove-outline'
          label='Purchase-data privacy request'
          value='Contact support with your private purchase ID'
          onPress={requestPurchaseDataDeletion}
        />
      </PremiumCard>

      <Text
        variant='bodySmall'
        style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}
      >
        Provides general behavioral tracking and support; not medical advice,
        diagnosis, or treatment.
      </Text>
      <Text variant='bodySmall' style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
        Version {version}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  premiumCard: { overflow: 'hidden' },
  premiumRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  crown: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  motion: { paddingVertical: 14 },
  motionControl: { marginTop: 12 },
  disclaimer: {
    lineHeight: 18,
    marginHorizontal: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  version: { textAlign: 'center', marginTop: 28 },
});
