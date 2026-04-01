/**
 * Confetti.jsx — src/components/ui/Confetti.jsx
 *
 * simple randomized JS-driven confetti overlay for winning screens.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Dimensions } from 'react-native';

const NUM_CONFETTI = 40;
const COLORS = ['#FACC15', '#4ADE80', '#2dd4bf', '#a78bfa', '#f472b6', '#38bdf8'];

const ConfettiPiece = ({ windowWidth, windowHeight }) => {
  const animY = useRef(new Animated.Value(-20)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const rot   = useRef(new Animated.Value(0)).current;

  // randomized values
  const startX = Math.random() * windowWidth;
  const endX   = startX + (Math.random() * 200 - 100);
  const size   = Math.random() * 8 + 6;
  const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
  const duration = Math.random() * 1500 + 1500;
  const delay  = Math.random() * 500;
  
  const rotLimit = Math.random() > 0.5 ? 360 : -360;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animY, {
        toValue: windowHeight + 50,
        duration: duration,
        delay: delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(animX, {
        toValue: endX,
        duration: duration,
        delay: delay,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(rot, {
        toValue: rotLimit,
        duration: duration,
        delay: delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const rotateAnim = rot.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg']
  });

  return (
    <Animated.View style={{
      position: 'absolute',
      top: -20,
      left: startX,
      width: size,
      height: size,
      backgroundColor: color,
      transform: [
        { translateY: animY },
        { translateX: animX },
        { rotate: rotateAnim },
        { skewX: rotateAnim }
      ]
    }} />
  );
};

export default function Confetti() {
  const { width, height } = Dimensions.get('window');
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: NUM_CONFETTI }).map((_, i) => (
        <ConfettiPiece key={i} windowWidth={width} windowHeight={height} />
      ))}
    </View>
  );
}
