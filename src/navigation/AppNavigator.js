import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import CalendarScreen from '../components/Calendar';
import PomodoroScreen from '../components/Pomodoro';
import ProfileScreen from '../components/Profile';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n } from '../utils/i18n';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { themeColor } = useSettings();
  const { t } = useI18n();
  const accent = getAccentColor(themeColor);

  return (
    <Tab.Navigator
      initialRouteName="Calendario"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 60 + insets.bottom,   // 🔥 CLAVE
          paddingBottom: insets.bottom, // 🔥 CLAVE
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{
          tabBarLabel: t('calendar.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Pomodoro"
        component={PomodoroScreen}
        options={{
          tabBarLabel: t('pomodoro.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('profile.personalInfo'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
