/* ═══════════════════════════════════════════════════════════════════
   ShuffleOverlay.jsx — Riffle shuffle animation on game start
   Shows card_back.svg cards splitting and interleaving
═══════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, Dimensions } from 'react-native';

const CARD_COUNT = 8;
const ANIM_DURATION = 2200;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ShuffleOverlay = ({ visible, onComplete }) => {
  // Each card has its own animated values
  const cardAnims = useRef(
    Array.from({ length: CARD_COUNT }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!visible) {
      hasStarted.current = false;
      return;
    }
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Phase 1: Cards gather in center (already there)
    // Phase 2: Split into left/right halves
    const splitAnims = cardAnims.map((anim, i) => {
      const isLeft = i < CARD_COUNT / 2;
      const offsetIdx = isLeft ? i : i - CARD_COUNT / 2;
      return Animated.parallel([
        Animated.timing(anim.translateX, {
          toValue: isLeft ? -60 - offsetIdx * 5 : 60 + offsetIdx * 5,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: isLeft ? -0.1 - offsetIdx * 0.02 : 0.1 + offsetIdx * 0.02,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
    });

    // Phase 3: Interleave (riffle) — cards come back together with stagger
    const riffleAnims = cardAnims.map((anim, i) => {
      const delay = i * 60;
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim.translateX, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: -i * 2,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    // Phase 4: Fan out to dealing positions
    const dealAnims = cardAnims.map((anim, i) => {
      return Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: i < 4 ? -120 : 120, // top 4 go up, bottom 4 go down
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: ((i % 4) - 1.5) * 45,
          duration: 400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]);
    });

    // Full sequence
    Animated.sequence([
      // Initial scale up
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Split
      Animated.parallel(splitAnims),
      Animated.delay(100),
      // Riffle
      Animated.parallel(riffleAnims),
      Animated.delay(200),
      // Deal out + fade
      Animated.parallel([
        ...dealAnims,
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 500,
          delay: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (onComplete) onComplete();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <Animated.View style={[styles.cardStack, { transform: [{ scale: scaleAnim }] }]}>
        {cardAnims.map((anim, i) => {
          const rotate = anim.rotate.interpolate({
            inputRange: [-1, 1],
            outputRange: ['-30deg', '30deg'],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.card,
                {
                  zIndex: i,
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    { rotate },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            >
              <Image
                source={require('../../assets/icons/card_back.svg')}
                style={styles.cardImage}
                resizeMode="contain"
              />
            </Animated.View>
          );
        })}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    backgroundColor: 'rgba(16, 22, 34, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStack: {
    width: 120,
    height: 170,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#1a2744',
    borderWidth: 1,
    borderColor: 'rgba(37, 106, 244, 0.4)',
    shadowColor: '#256af4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: '90%',
    height: '90%',
  },
});

export default ShuffleOverlay;
