import CustomTabBar from '@/components/CustomTabBar';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
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
  return focused ? (
    <Ionicons name='home' size={size} color={color} />
  ) : (
    <Ionicons name='home-outline' size={size} color={color} />
  );
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
  return focused ? (
    <Ionicons name='stats-chart' size={size} color={color} />
  ) : (
    <Ionicons name='stats-chart-outline' size={size} color={color} />
  );
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    // Build the custom tab bar by using the `tabBar` property to provide the UI component.
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 220,
          },
        },
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
        name='stats'
        options={{
          title: 'Stats',
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
            <MaterialCommunityIcons
              name={focused ? 'cog' : 'cog-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
