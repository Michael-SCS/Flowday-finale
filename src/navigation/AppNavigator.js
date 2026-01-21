import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
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
import { useAuth } from '../auth/AuthProvider';

const Tab = createBottomTabNavigator();
const TOUR_STORAGE_KEY = 'fluu_hasSeenMascotTour';
const TOUR_PENDING_KEY = 'fluu_mascotTourPending';

function TabIcon({ name, focused, tabColor, size, isDark }) {
  const iconColor = focused ? tabColor : isDark ? `${tabColor}CC` : `${tabColor}B3`;

  return (
    <View
      style={{
        width: 44,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <Ionicons name={name} size={size} color={iconColor} />
    </View>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const { themeColor, themeMode } = useSettings();
  const { t } = useI18n();
  const accent = getAccentColor(themeColor);
  const tabNavRef = useRef(null);
  const [showTour, setShowTour] = useState(false);
  const { isPro } = useProStatus();
  const isDark = themeMode === 'dark';
  const tabBarBackground = isDark ? '#000000' : '#ffffff';
  const tabBarBorder = isDark ? '#111827' : '#e5e7eb';
  const { user } = useAuth();
  const tourStorageKey = useMemo(() => {
    if (!user?.id) return null;
    return `${TOUR_STORAGE_KEY}_${user.id}`;
  }, [user?.id]);

  const tourPendingKey = useMemo(() => {
    if (!user?.id) return null;
    return `${TOUR_PENDING_KEY}_${user.id}`;
  }, [user?.id]);

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

    if (!tourStorageKey || !tourPendingKey) {
      setShowTour(false);
      return () => {
        mounted = false;
      };
    }

    // Only auto-show the mascot tour when the user is coming from Register/Onboarding
    // (pending flag set). Returning users who log in should not see it again.
    AsyncStorage.multiGet([tourStorageKey, tourPendingKey])
      .then((pairs) => {
        if (!mounted) return;
        const map = new Map(pairs);
        const hasSeen = map.get(tourStorageKey);
        const pending = map.get(tourPendingKey);

        if (pending === 'true' && !hasSeen) {
          setShowTour(true);
        } else {
          setShowTour(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setShowTour(false);
      });

    return () => {
      mounted = false;
    };
  }, [tourStorageKey, tourPendingKey]);

  return (
    <TourProvider value={tourValue}>
      <Tab.Navigator
      ref={tabNavRef}
      initialRouteName="Calendar"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        tabBarStyle: {
          height: 60 + insets.bottom,   // 🔥 CLAVE
          paddingBottom: insets.bottom, // 🔥 CLAVE
          paddingTop: 6,
          backgroundColor: tabBarBackground,
          borderTopColor: tabBarBorder,
        },
      }}
    >
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: ({ focused }) => {
            const tabColor = accent;
            return (
              <Text style={{ color: focused ? tabColor : isDark ? '#64748b' : '#94A3B8', fontSize: 11, fontWeight: '800' }}>
                {t('calendar.title')}
              </Text>
            );
          },
          tabBarIcon: ({ focused, size }) => {
            const tabColor = accent;
            return <TabIcon name="calendar-outline" focused={focused} tabColor={tabColor} size={size} isDark={isDark} />;
          },
        }}
      />

      <Tab.Screen
        name="Pomodoro"
        component={PomodoroScreen}
        options={{
          tabBarLabel: ({ focused }) => {
            const tabColor = accent;
            return (
              <Text style={{ color: focused ? tabColor : isDark ? '#64748b' : '#94A3B8', fontSize: 11, fontWeight: '800' }}>
                {t('pomodoro.title')}
              </Text>
            );
          },
          tabBarIcon: ({ focused, size }) => {
            const tabColor = accent;
            return <TabIcon name="timer-outline" focused={focused} tabColor={tabColor} size={size} isDark={isDark} />;
          },
        }}
      />

      {/* Premium tab hidden in navbar by request */}

      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused }) => {
            const tabColor = accent;
            return (
              <Text style={{ color: focused ? tabColor : isDark ? '#64748b' : '#94A3B8', fontSize: 11, fontWeight: '800' }}>
                {t('profile.personalInfo')}
              </Text>
            );
          },
          tabBarIcon: ({ focused, size }) => {
            const tabColor = accent;
            return <TabIcon name="person-outline" focused={focused} tabColor={tabColor} size={size} isDark={isDark} />;
          },
        }}
      />
      {isPro === true && (
        <Tab.Screen
          name="Estadísticas"
          component={AdvancedStatsScreen}
          options={{
            tabBarLabel: ({ focused }) => {
              const tabColor = accent;
              return (
                <Text style={{ color: focused ? tabColor : isDark ? '#64748b' : '#94A3B8', fontSize: 11, fontWeight: '800' }}>
                  {t('premium.statsTitle')}
                </Text>
              );
            },
            tabBarIcon: ({ focused, size }) => {
              const tabColor = accent;
              return <TabIcon name="stats-chart" focused={focused} tabColor={tabColor} size={size} isDark={isDark} />;
            },
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
