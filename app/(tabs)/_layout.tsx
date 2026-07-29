import CustomTabBar from '@/components/CustomTabBar';
import { AppSymbol } from '@/components/AppSymbol';
import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';

function HomeIcon({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  return <AppSymbol name='home' size={size} color={color} filled={focused} />;
}

function StatsIcon({
  color,
  size,
  focused,
}: {
  color: string;
  size: number;
  focused: boolean;
}) {
  return <AppSymbol name='stats' size={size} color={color} filled={focused} />;
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    // Build the custom tab bar by using the `tabBar` property to provide the UI component.
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: HomeIcon,
        }}
      />
      <Tabs.Screen
        name='rescue'
        options={{
          title: 'Rescue',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <AppSymbol
              name='lifebuoy'
              size={size}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='plan'
        options={{
          title: 'Plan',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <AppSymbol
              name='calendar-check'
              size={size}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='stats'
        options={{
          title: 'Progress',
          headerShown: false,
          tabBarIcon: StatsIcon,
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <AppSymbol
              name='settings'
              size={size}
              color={color}
              filled={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
