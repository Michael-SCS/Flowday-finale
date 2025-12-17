import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CalendarScreen from '../components/Calendar';
import PomodoroScreen from '../components/Pomodoro';
import ProfileScreen from '../components/Profile';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: '#fb7185',
        tabBarInactiveTintColor: '#9ca3af',

        tabBarStyle: {
          backgroundColor: '#fff7ed',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Calendario':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;

            case 'Pomodoro':
              iconName = focused ? 'timer' : 'timer-outline';
              break;

            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;

            default:
              iconName = 'ellipse';
          }

          return (
            <Ionicons
              name={iconName}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
      />
      <Tab.Screen
        name="Pomodoro"
        component={PomodoroScreen}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
