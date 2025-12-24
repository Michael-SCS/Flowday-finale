import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ImageBackground, TouchableOpacity } from 'react-native';
import { useI18n } from '../../utils/i18n';

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

export default function OnboardingSlides({ navigation }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef(null);
  const [index, setIndex] = useState(0);
  const { t } = useI18n();

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
              // After the last slide, ask for language/theme before registration
              navigation.navigate('AppSettings', { from: 'slides' });
            }
          }}
        >
          <Text style={styles.continueText}>Continue</Text>
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
