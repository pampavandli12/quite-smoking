import { useState } from 'react';
import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Icon,
  Surface,
  IconButton,
  type TextInputIconProps,
} from 'react-native-paper';
import { router } from 'expo-router';
import { setSmokingSettings } from '@/db/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SmokingSetupScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [cigarettesPerDay, setCigarettesPerDay] = useState('');
  const [costPerCigarette, setCostPerCigarette] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = () => {
    const cpd = parseInt(cigarettesPerDay, 10);
    const cost = parseFloat(costPerCigarette);
    return !isNaN(cpd) && cpd > 0 && !isNaN(cost) && cost > 0;
  };

  const handleSave = async () => {
    if (!valid()) {
      Alert.alert('Validation', 'Please enter valid values for both fields.');
      return;
    }

    setSaving(true);
    try {
      const cpd = parseInt(cigarettesPerDay, 10);
      const cost = parseFloat(costPerCigarette);
      const res = await setSmokingSettings(cpd, cost);
      if (res && res.success) {
        router.replace('/');
      } else {
        console.error('Save failed', res);
        Alert.alert('Error', 'Failed to save settings. Please try again.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const searchAccessory = (accessoryProps: Partial<TextInputIconProps>) => (
    <TextInput.Icon {...accessoryProps} icon='currency-inr' />
  );
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
      scrollEnabled={true}
    >
      {/* Main Heading */}
      <Text variant='headlineMedium' style={{ marginTop: 16 }}>
        Let&apos;s set your baseline
      </Text>

      {/* Description */}
      <Text
        variant='bodyMedium'
        style={{
          marginBottom: 24,
          marginTop: 8,
          color: theme.colors.tertiary,
        }}
      >
        This data helps us calculate your daily streaks and the money you save
        by staying smoke-free.
      </Text>

      {/* cigarettes per day */}
      <Surface
        style={[
          styles.configCard,
          { borderColor: theme.colors.outlineVariant },
        ]}
        elevation={0}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Icon source='calendar' size={24} />
          <Text
            variant='titleMedium'
            style={[styles.configTitle, { color: theme.colors.onSurface }]}
          >
            Cigarettes per day
          </Text>
        </View>

        {/* Cigarettes per day input */}
        <View style={styles.inputWrapper}>
          <IconButton
            icon='minus'
            style={[
              styles.inputButton,
              { borderColor: theme.colors.outlineVariant },
            ]}
            size={20}
            onPress={() =>
              setCigarettesPerDay((prev) => {
                const num = parseInt(prev || '0', 10) - 1;
                return num > 0 ? num.toString() : '';
              })
            }
          />
          <TextInput
            value={cigarettesPerDay}
            onChangeText={(t) => setCigarettesPerDay(t.replace(/[^0-9]/g, ''))}
            keyboardType='numeric'
            mode='outlined'
            outlineColor='transparent'
            activeOutlineColor='transparent'
            style={[
              styles.input,
              { fontSize: 24, backgroundColor: theme.colors.surfaceVariant },
            ]}
          />
          <IconButton
            icon='plus'
            size={20}
            style={[
              styles.inputButton,
              { borderColor: theme.colors.outlineVariant },
            ]}
            onPress={() =>
              setCigarettesPerDay((prev) => {
                const num = parseInt(prev || '0', 10) + 1;
                return num.toString();
              })
            }
          />
        </View>
      </Surface>
      {/* cost per cigarette */}
      <Surface
        style={[
          styles.configCard,
          { borderColor: theme.colors.outlineVariant },
        ]}
        elevation={0}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Icon source='cash' size={24} />
          <Text
            variant='titleMedium'
            style={[styles.configTitle, { color: theme.colors.onSurface }]}
          >
            Cost per cigarette
          </Text>
        </View>

        {/* Cigarettes per day input */}
        <View style={styles.inputWrapper}>
          <TextInput
            value={costPerCigarette}
            onChangeText={(t) =>
              setCostPerCigarette(t.replace(/[^0-9\.]/g, ''))
            }
            left={searchAccessory({ size: 24, color: theme.colors.tertiary })}
            keyboardType='decimal-pad'
            mode='outlined'
            outlineColor='transparent'
            activeOutlineColor='transparent'
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceVariant,
                fontSize: 24,
                flex: 1,
              },
            ]}
          />
        </View>
      </Surface>
      {/* Start Tracking Button */}
      <Button
        mode='contained'
        onPress={handleSave}
        disabled={!valid() || saving}
        loading={saving}
        style={styles.startButton}
        contentStyle={styles.startButtonContent}
      >
        Continue
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  configCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  configTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  inputButton: {
    opacity: 0.5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    width: 50,
    height: 50,
    borderRadius: 49,
  },
  input: {
    fontSize: 24,
    fontWeight: '900',
  },
  startButton: {
    marginTop: 35,
    borderRadius: 10,
  },
  startButtonContent: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
