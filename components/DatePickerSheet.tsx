import { useAppMotion } from '@/hooks/useAppMotion';
import { appSymbolSource } from '@/components/AppSymbol';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  IconButton,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

type DatePickerSheetProps = {
  maximumDate: Date;
  minimumDate: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
  value: Date;
  visible: boolean;
};

type CalendarCell = {
  date: Date;
  inMonth: boolean;
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function buildMonth(date: Date): CalendarCell[] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    return {
      date: cellDate,
      inMonth: cellDate.getMonth() === date.getMonth(),
    };
  });
}

export default function DatePickerSheet({
  maximumDate,
  minimumDate,
  onConfirm,
  onDismiss,
  value,
  visible,
}: DatePickerSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { reduceMotion } = useAppMotion();
  const [draft, setDraft] = useState(startOfDay(value));
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(value.getFullYear(), value.getMonth(), 1),
  );

  useEffect(() => {
    if (!visible) return;
    setDraft(startOfDay(value));
    setVisibleMonth(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [value, visible]);

  const cells = useMemo(() => buildMonth(visibleMonth), [visibleMonth]);
  const minimum = startOfDay(minimumDate).getTime();
  const maximum = startOfDay(maximumDate).getTime();
  const previousMonthDisabled =
    new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0,
    ).getTime() < minimum;
  const nextMonthDisabled =
    new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    ).getTime() > maximum;

  return (
    <Modal
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onDismiss}
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel='Close date picker'
          accessibilityRole='button'
          onPress={onDismiss}
          style={styles.backdrop}
        />
        <Surface
          elevation={4}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />
          <Text variant='headlineSmall' style={styles.title}>
            Choose your quit date
          </Text>
          <Text
            variant='bodyMedium'
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Pick a future date that feels meaningful and realistic.
          </Text>

          <View style={styles.monthHeader}>
            <IconButton
              accessibilityLabel='Previous month'
              disabled={previousMonthDisabled}
              icon={appSymbolSource('chevron-left')}
              onPress={() =>
                setVisibleMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                )
              }
            />
            <Text variant='titleMedium' style={styles.monthLabel}>
              {visibleMonth.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <IconButton
              accessibilityLabel='Next month'
              disabled={nextMonthDisabled}
              icon={appSymbolSource('chevron-right')}
              onPress={() =>
                setVisibleMonth(
                  (month) =>
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                )
              }
            />
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((weekday, index) => (
              <Text
                key={`${weekday}-${index}`}
                variant='labelMedium'
                style={[
                  styles.weekday,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendar}>
            {cells.map(({ date, inMonth }) => {
              const timestamp = startOfDay(date).getTime();
              const disabled =
                !inMonth || timestamp < minimum || timestamp > maximum;
              const selected = sameDay(date, draft);
              return (
                <View key={date.toISOString()} style={styles.cell}>
                  <TouchableRipple
                    accessibilityLabel={date.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    accessibilityRole='button'
                    accessibilityState={{ disabled, selected }}
                    borderless
                    disabled={disabled}
                    onPress={() => setDraft(startOfDay(date))}
                    style={[
                      styles.day,
                      selected && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      variant='bodyMedium'
                      style={{
                        color: selected
                          ? theme.colors.onPrimary
                          : disabled
                            ? theme.colors.onSurfaceDisabled
                            : theme.colors.onSurface,
                        fontWeight: selected ? '700' : '400',
                      }}
                    >
                      {inMonth ? date.getDate() : ''}
                    </Text>
                  </TouchableRipple>
                </View>
              );
            })}
          </View>

          <Surface
            elevation={0}
            style={[
              styles.selection,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              variant='labelMedium'
              style={{ color: theme.colors.onPrimaryContainer }}
            >
              Selected date
            </Text>
            <Text
              variant='titleMedium'
              style={[
                styles.selectionValue,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {draft.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Surface>

          <View style={styles.actions}>
            <Button mode='text' onPress={onDismiss}>
              Cancel
            </Button>
            <Button
              mode='contained'
              onPress={() => onConfirm(startOfDay(draft))}
              style={styles.confirm}
            >
              Use this date
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 14, 0.52)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 42,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    lineHeight: 21,
    marginTop: 5,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  monthLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    paddingVertical: 8,
    textAlign: 'center',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  day: {
    alignItems: 'center',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  selection: {
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  selectionValue: {
    fontWeight: '700',
    marginTop: 2,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  confirm: {
    borderRadius: 999,
  },
});
