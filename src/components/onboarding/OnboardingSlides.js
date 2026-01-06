import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ImageBackground, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../../utils/i18n';

const ONBOARDING_VERSION = '2026-01-03-v1';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    image: require('../../../assets/onboarding/onboarding_1.png'),
  },
  {
    key: '2',
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    image: require('../../../assets/onboarding/onboarding_2.png'),
  },
  {
    key: '3',
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    image: require('../../../assets/onboarding/onboarding_3.png'),
  },
];

export default function OnboardingSlides({ navigation, route }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef(null);
  const [index, setIndex] = useState(0);
  const { t } = useI18n();

  const finishOnboardingSlides = async () => {
    // Mark onboarding as completed for this device so it doesn't show again.
    try { await AsyncStorage.setItem('device_onboarding_shown', 'true'); } catch {}
    try { await AsyncStorage.setItem('onboarding_version', ONBOARDING_VERSION); } catch {}
    // If we're continuing into the onboarding flow (e.g. Register), keep the flag.
    // Otherwise clear it so RootNavigator can leave the onboarding stack.
    const next = route?.params?.next;
    if (!next || !next.screen) {
      try { await AsyncStorage.removeItem('onboarding_in_progress'); } catch {}
    }

    if (next && next.screen) {
      try {
        navigation.replace(next.screen, next.params || undefined);
        return;
      } catch {
        try {
          navigation.navigate(next.screen, next.params || undefined);
          return;
        } catch {
          // fall through
        }
      }
    }

    // Reset to Login on the root navigator.
    try {
      const parent = navigation.getParent && navigation.getParent();
      if (parent && typeof parent.reset === 'function') {
        parent.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
    } catch {
      // ignore
    }

    try {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      try { navigation.navigate('Login'); } catch {}
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <ImageBackground source={item.image} style={styles.image} imageStyle={{ resizeMode: 'cover' }}>
        {/* full-screen image */}
      </ImageBackground>
    </View>
  );

  const onViewable = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setIndex(viewableItems[0].index);
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={viewConfigRef.current}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            if (index < slides.length - 1) {
              flatRef.current.scrollToIndex({ index: index + 1, animated: true });
            } else {
              // After the last slide, go to Login.
              finishOnboardingSlides();
            }
          }}
        >
          <Text style={styles.continueText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: { width, height, alignItems: 'center', justifyContent: 'center' },
  image: { width, height },
  textBox: { display: 'none' },
  title: { display: 'none' },
  subtitle: { display: 'none' },
  footer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center', paddingBottom: 20 },
  dots: { display: 'none' },
  dot: { display: 'none' },
  dotActive: { display: 'none' },
  continueBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 999,
    minWidth: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: { color: '#fff', fontWeight: '700' },
  
});
