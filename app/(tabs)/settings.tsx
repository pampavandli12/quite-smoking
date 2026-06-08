import { URL_LINKS } from '@/utils/constants';
import React from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import {
  useTheme,
  Text,
  Surface,
  Icon,
  Divider,
  TouchableRipple,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Settings = () => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Read version from package.json so it stays in sync
  let version = '1.0.0';
  try {
    // relative to this file: app/(tabs)/settings.tsx -> ../../package.json
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../../package.json');
    version = pkg?.version || version;
  } catch (e) {
    // ignore
  }

  const sendFeedback = async () => {
    const subject = encodeURIComponent('Feedback - Quit Smoking App');
    const mailto = `mailto:${URL_LINKS.feedback}?subject=${subject}`;
    try {
      await Linking.openURL(mailto);
    } catch (err) {
      console.error('Error opening mail app', err);
      Alert.alert('Error', 'Could not open mail app');
    }
  };

  const openUrl = async (url: string) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Cannot open link');
    } catch (err) {
      console.error('Error opening link', err);
      Alert.alert('Error', 'Unable to open link');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
    >
      <Text variant='headlineLarge' style={styles.title}>
        Settings
      </Text>

      <Surface
        style={[styles.card, { borderColor: theme.colors.outlineVariant }]}
        elevation={0}
      >
        <TouchableRipple onPress={sendFeedback}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon
                source='email-outline'
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant='titleMedium'
                style={[styles.rowText, { color: theme.colors.onSurface }]}
              >
                Send Feedback
              </Text>
            </View>
            <Icon
              source='chevron-right'
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableRipple>

        <Divider />

        <TouchableRipple onPress={() => openUrl(URL_LINKS.terms)}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon
                source='file-document-outline'
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant='titleMedium'
                style={[styles.rowText, { color: theme.colors.onSurface }]}
              >
                Terms and Conditions
              </Text>
            </View>
            <Icon
              source='chevron-right'
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableRipple>

        <Divider />

        <TouchableRipple onPress={() => openUrl(URL_LINKS.privacy)}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon
                source='shield-check-outline'
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant='titleMedium'
                style={[styles.rowText, { color: theme.colors.onSurface }]}
              >
                Privacy Policy
              </Text>
            </View>
            <Icon
              source='chevron-right'
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableRipple>
      </Surface>

      <View style={styles.versionWrap}>
        <Text
          variant='bodyMedium'
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Version {version}
        </Text>
      </View>
    </ScrollView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontWeight: '600',
  },
  versionWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
});
