import { useEffect, useMemo, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TabActions } from '@react-navigation/native';

import CalendarScreen from '../components/Calendar';
import PomodoroScreen from '../components/Pomodoro';
import ProfileScreen from '../components/Profile';
import PremiumUpsellScreen from '../components/PremiumUpsell';
import AdvancedStatsScreen from '../components/AdvancedStats';
import MascotTour from '../components/MascotTour';
import { useSettings, getAccentColor } from '../utils/settingsContext';
import { useI18n } from '../utils/i18n';
import { TourProvider } from '../utils/tourContext';
import { useProStatus } from '../utils/proStatus';

const Tab = createBottomTabNavigator();
const TOUR_STORAGE_KEY = 'fluu_hasSeenMascotTour';

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { themeColor, themeMode } = useSettings();
  const { t } = useI18n();
  const accent = getAccentColor(themeColor);
  const tabNavRef = useRef(null);
  const [showTour, setShowTour] = useState(false);
  const { isPro } = useProStatus();
  const isDark = themeMode === 'dark';

  const tourValue = useMemo(
    () => ({
      showTour,
      openTour: () => setShowTour(true),
      closeTour: () => setShowTour(false),
    }),
    [showTour]
  );

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(TOUR_STORAGE_KEY)
      .then((value) => {
        if (!mounted) return;
        if (!value) {
          setShowTour(true);
        }
      })
      .catch(() => {
        if (!mounted) return;
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <TourProvider value={tourValue}>
      <Tab.Navigator
      ref={tabNavRef}
      initialRouteName="Calendar"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94A3B8',
        tabBarStyle: {
          height: 60 + insets.bottom,   // 🔥 CLAVE
          paddingBottom: insets.bottom, // 🔥 CLAVE
          paddingTop: 6,
          backgroundColor: isDark ? '#020617' : '#ffffff',
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
        },
      }}
    >
      <Tab.Screen
        name="Calendar"
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

      {/* Premium tab hidden in navbar by request */}

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
      {isPro === true && (
        <Tab.Screen
          name="Estadísticas"
          component={AdvancedStatsScreen}
          options={{
            tabBarLabel: t('premium.statsTitle'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
      )}
      </Tab.Navigator>

      <MascotTour
        visible={showTour}
        onClose={() => setShowTour(false)}
        onRequestTabChange={(tabName) => {
          if (tabName) {
            const nav = tabNavRef.current;
            try {
              if (nav && typeof nav.navigate === 'function') {
                nav.navigate(tabName);
                return;
              }
              if (nav && typeof nav.dispatch === 'function') {
                nav.dispatch(TabActions.jumpTo(tabName));
              }
            } catch {
              // ignore
            }
          }
        }}
      />
    </TourProvider>
  );
}
