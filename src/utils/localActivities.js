import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'FLOWDAY_ACTIVITIES';

export async function loadActivities() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : {};
}

export async function saveActivities(activities) {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(activities)
  );
}
