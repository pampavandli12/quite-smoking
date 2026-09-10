import { AppSymbol } from '@/components/AppSymbol';
import {
  CURRENCY_LABELS,
  getCurrencySymbolName,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from '@/utils/currency';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';

type CurrencyPickerProps = {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  disabled?: boolean;
};

export function CurrencyPicker({
  value,
  onChange,
  disabled = false,
}: CurrencyPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {SUPPORTED_CURRENCIES.map((code) => {
        const selected = code === value;
        return (
          <View key={code} style={styles.cell}>
            <TouchableRipple
              accessibilityLabel={CURRENCY_LABELS[code]}
              accessibilityRole='radio'
              accessibilityState={{ selected, disabled }}
              borderless={false}
              disabled={disabled}
              onPress={() => onChange(code)}
              style={[
                styles.option,
                {
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                  backgroundColor: selected
                    ? theme.colors.primaryContainer
                    : theme.colors.surface,
                },
              ]}
            >
              <View style={styles.optionContent}>
                <AppSymbol
                  name={getCurrencySymbolName(code)}
                  size={20}
                  color={
                    selected
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  numberOfLines={1}
                  variant='labelLarge'
                  style={{
                    color: selected
                      ? theme.colors.primary
                      : theme.colors.onSurface,
                  }}
                >
                  {code}
                </Text>
              </View>
            </TouchableRipple>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  cell: {
    padding: 5,
    width: '50%',
  },
  option: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  optionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
});
