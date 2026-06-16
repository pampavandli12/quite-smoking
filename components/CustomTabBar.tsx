import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';

const BAR_HORIZONTAL_MARGIN = 56;
const BAR_PADDING = 8;
const MAX_TAB_WIDTH = 132;
const ACTIVE_DURATION = 180;
const INDICATOR_DURATION = 200;

type TabBarItemProps = {
  activeColor: string;
  icon?: BottomTabNavigationOptions['tabBarIcon'];
  inactiveColor: string;
  isFocused: boolean;
  label: string;
  onLongPress: () => void;
  onPress: () => void;
  testID: string;
};

function TabBarItem({
  activeColor,
  icon,
  inactiveColor,
  isFocused,
  label,
  onLongPress,
  onPress,
  testID,
}: TabBarItemProps) {
  const progress = useDerivedValue(() =>
    withTiming(isFocused ? 1 : 0, { duration: ACTIVE_DURATION }),
  );

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 3 * progress.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    maxHeight: 18 * (1 - progress.value),
    opacity: 1 - progress.value,
    transform: [{ translateY: 4 * progress.value }],
  }));

  const iconColor = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onLongPress={onLongPress}
      onPress={onPress}
      style={styles.pressable}
      testID={testID}
    >
      <View style={styles.item}>
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          {icon?.({
            focused: isFocused,
            color: iconColor,
            size: 24,
          })}
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[styles.label, { color: iconColor }, labelStyle]}
        >
          {label}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const active = theme.colors.primary;
  const inactive = theme.colors.onSurfaceVariant;
  const surface = theme.colors.elevation?.level2 ?? theme.colors.surface;
  const routeCount = state.routes.length;
  const containerWidth = Math.min(
    windowWidth - BAR_HORIZONTAL_MARGIN,
    routeCount * MAX_TAB_WIDTH + BAR_PADDING * 2,
  );
  const itemWidth = (containerWidth - BAR_PADDING * 2) / routeCount;
  const activeIndex = useDerivedValue(() =>
    withTiming(state.index, { duration: INDICATOR_DURATION }),
  );
  const activeBackground = theme.dark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(64, 91, 74, 0.12)';

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndex.value * itemWidth }],
    width: itemWidth,
  }));

  return (
    <View
      pointerEvents='box-none'
      style={[
        styles.floatingArea,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: surface,
            borderColor: theme.colors.outlineVariant,
            shadowColor: theme.colors.shadow,
            width: containerWidth,
          },
        ]}
      >
        <Animated.View
          pointerEvents='none'
          style={[
            styles.indicator,
            {
              backgroundColor: activeBackground,
            },
            indicatorStyle,
          ]}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const handlePress = () => {
            const tabPressEvent = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !tabPressEvent.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const handleLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabBarItem
              activeColor={active}
              icon={options.tabBarIcon}
              inactiveColor={inactive}
              isFocused={isFocused}
              key={route.key}
              label={label}
              onLongPress={handleLongPress}
              onPress={handlePress}
              testID={`tab-${route.name}`}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingArea: {
    alignItems: 'center',
    bottom: 0,
    left: 0,
    paddingHorizontal: 18,
    position: 'absolute',
    right: 0,
  },
  container: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 66,
    padding: 8,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.22,
    shadowRadius: 24,
  },
  pressable: {
    flex: 1,
  },
  item: {
    alignItems: 'center',
    borderRadius: 22,
    gap: 5,
    height: 50,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  indicator: {
    borderRadius: 22,
    bottom: 8,
    left: 8,
    position: 'absolute',
    top: 8,
  },
  iconWrap: {
    height: 24,
    width: 24,
  },
  label: {
    flexShrink: 1,
    fontFamily: 'Roboto_700Bold',
    fontSize: 13,
    includeFontPadding: false,
    letterSpacing: 0,
  },
});

export default CustomTabBar;
