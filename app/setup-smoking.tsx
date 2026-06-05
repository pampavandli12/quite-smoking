import { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { setSmokingSettings } from '@/db/queries';

export default function SmokingSetupScreen() {
  const theme = useTheme();
  const [cigarettesPerDay, setCigarettesPerDay] = useState('');
  const [costPerCigarette, setCostPerCigarette] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = () => {
    const cpd = parseInt(cigarettesPerDay, 10);
    const cost = parseFloat(costPerCigarette);
    return !isNaN(cpd) && cpd > 0 && !isNaN(cost) && cost >= 0;
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>
        A couple quick questions
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Help us calculate your savings and streaks. These fields are required.
      </Text>

      <TextInput
        label="Cigarettes per day"
        value={cigarettesPerDay}
        onChangeText={(t) => setCigarettesPerDay(t.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        label="Cost per cigarette (e.g. 0.5)"
        value={costPerCigarette}
        onChangeText={(t) => setCostPerCigarette(t.replace(/[^0-9\.]/g, ''))}
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        disabled={!valid() || saving}
        loading={saving}
        style={styles.button}
      >
        Save and continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  title: {
    marginBottom: 8,
    fontWeight: '600',
  },
  subtitle: {
    marginBottom: 20,
    opacity: 0.8,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
});
