import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Icon,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';

type TriggerOption = {
  icon: string;
  label: string;
  value: string;
};

type TriggerBottomSheetProps = {
  loading?: boolean;
  onDismiss: () => void;
  onSelect: (trigger?: string) => void;
  visible: boolean;
};

const ANIMATION_DURATION = 220;

const triggerOptions: TriggerOption[] = [
  {
    label: 'Stress',
    value: 'stress',
    icon: 'lightning-bolt',
  },
  {
    label: 'Coffee',
    value: 'coffee',
    icon: 'coffee',
  },
  {
    label: 'Boredom',
    value: 'boredom',
    icon: 'clock-outline',
  },
  {
    label: 'After Meals',
    value: 'after meals',
    icon: 'silverware-fork-knife',
  },
  {
    label: 'Social',
    value: 'social situations',
    icon: 'account-group-outline',
  },
  {
    label: 'Anxiety',
    value: 'anxiety',
    icon: 'alert-circle-outline',
  },
  {
    label: 'Alcohol',
    value: 'alcohol',
    icon: 'water-outline',
  },
  {
    label: 'Habit',
    value: 'habit',
    icon: 'repeat',
  },
];

function TriggerButton({
  disabled,
  option,
  onPress,
}: {
  disabled?: boolean;
  option: TriggerOption;
  onPress: () => void;
}) {
  const theme = useTheme();
  const rippleColor = theme.colors.primary.replace(/[\d.]+\)$/, '0.12)');
  const surfaceColor = theme.colors.elevation?.level1 ?? theme.colors.surface;
  const iconBackground = theme.dark
    ? theme.colors.secondaryContainer
    : theme.colors.primaryContainer;

  return (
    <Surface
      elevation={1}
      mode='flat'
      style={[
        styles.triggerSurface,
        {
          backgroundColor: surfaceColor,
          borderColor: theme.colors.outlineVariant,
          opacity: disabled ? 0.54 : 1,
        },
      ]}
    >
      <TouchableRipple
        accessibilityRole='button'
        borderless
        disabled={disabled}
        onPress={onPress}
        rippleColor={rippleColor}
        style={styles.triggerButton}
      >
        <View style={styles.triggerContent}>
          <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
            <Icon
              source={option.icon}
              size={22}
              color={
                theme.dark
                  ? theme.colors.onSecondaryContainer
                  : theme.colors.onPrimaryContainer
              }
            />
          </View>
          <Text
            variant='titleSmall'
            style={[styles.triggerLabel, { color: theme.colors.onSurface }]}
          >
            {option.label}
          </Text>
        </View>
      </TouchableRipple>
    </Surface>
  );
}

export default function TriggerBottomSheet({
  loading = false,
  onDismiss,
  onSelect,
  visible,
}: TriggerBottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const progress = useSharedValue(0);
  const rippleColor = theme.colors.primary.replace(/[\d.]+\)$/, '0.12)');
  const sheetColor = theme.colors.elevation?.level2 ?? theme.colors.surface;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      progress.value = withTiming(1, { duration: ANIMATION_DURATION });
      return;
    }

    progress.value = withTiming(
      0,
      { duration: ANIMATION_DURATION },
      (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      },
    );
  }, [progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.value) * Math.min(height * 0.48, 420),
      },
    ],
  }));

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      animationType='none'
      onRequestClose={onDismiss}
      transparent
      visible={isMounted}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityRole='button'
            style={StyleSheet.absoluteFill}
            onPress={onDismiss}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: sheetColor,
              borderColor: theme.colors.outlineVariant,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />
          <Text variant='headlineSmall' style={styles.title}>
            What&apos;s your trigger?
          </Text>
          <Text
            variant='bodyMedium'
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Understanding triggers helps you quit faster
          </Text>

          <View style={styles.grid}>
            {triggerOptions.map((option) => (
              <TriggerButton
                disabled={loading}
                key={option.value}
                option={option}
                onPress={() => onSelect(option.value)}
              />
            ))}
          </View>

          <Surface
            elevation={0}
            mode='flat'
            style={[
              styles.skipSurface,
              {
                backgroundColor: 'transparent',
                borderColor: theme.colors.outlineVariant,
                opacity: loading ? 0.54 : 1,
              },
            ]}
          >
            <TouchableRipple
              accessibilityRole='button'
              borderless
              disabled={loading}
              onPress={() => onSelect()}
              rippleColor={rippleColor}
              style={styles.skipButton}
            >
              <View style={styles.skipContent}>
                <Text
                  variant='labelLarge'
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Skip - no specific trigger
                </Text>
              </View>
            </TouchableRipple>
          </Surface>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(139, 149, 167, 0.28)',
    borderRadius: 2,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  triggerSurface: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    width: '48%',
    marginBottom: 10,
    overflow: 'hidden',
  },
  triggerButton: {
    minHeight: 66,
  },
  triggerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 66,
    paddingHorizontal: 14,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  triggerLabel: {
    flex: 1,
    fontWeight: '600',
  },
  skipSurface: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  skipButton: {
    minHeight: 48,
  },
  skipContent: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
});
