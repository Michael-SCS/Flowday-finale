import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ImageBackground, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: '1',
    title: 'Bienvenido a Flowday',
    subtitle: 'Organiza tu día y crea hábitos sostenibles.',
    image: require('../../../assets/onboarding/onboarding_1.png'),
  },
  {
    key: '2',
    title: 'Sencillo y amigable',
    subtitle: 'Crea tareas, checklists y rastrea tu progreso.',
    image: require('../../../assets/onboarding/onboarding_2.png'),
  },
  {
    key: '3',
    title: 'Personalízalo',
    subtitle: 'Responde unas preguntas y te armamos un plan inicial.',
    image: require('../../../assets/onboarding/onboarding_3.png'),
  },
];

export default function OnboardingSlides({ navigation }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef(null);
  const [index, setIndex] = useState(0);

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
              navigation.navigate('Register');
            }
          }}
        >
          <Text style={styles.continueText}>Continuar</Text>
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
  continueBtn: { backgroundColor: '#2563eb', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  continueText: { color: '#fff', fontWeight: '700' },
});
