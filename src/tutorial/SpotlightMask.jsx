/**
 * SpotlightMask.jsx — src/tutorial/SpotlightMask.jsx
 *
 * Dims the whole screen except one rectangular "hole".
 * Implemented as 4 dark rectangles surrounding the spotlight rect.
 *
 * Props:
 *   rect   { x, y, width, height } — the lit area in page coords
 *   active — whether to show the mask at all
 *   padding — extra space around the lit rect (default 8)
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const DARK = 'rgba(0,0,0,0.75)';
const PAD  = 10;

export default function SpotlightMask({ rect, active, padding = PAD }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue:  active ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [active]);

  if (!active || !rect) {
    return null;
  }

  const x = Math.max(0, rect.x - padding);
  const y = Math.max(0, rect.y - padding);
  const w = rect.width  + padding * 2;
  const h = rect.height + padding * 2;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { opacity, zIndex: 90 }]}
      pointerEvents="none"
    >
      {/* Top */}
      <View style={[styles.dark, { top: 0, left: 0, right: 0, height: y }]} />
      {/* Bottom */}
      <View style={[styles.dark, { top: y + h, left: 0, right: 0, bottom: 0 }]} />
      {/* Left */}
      <View style={[styles.dark, { top: y, left: 0, width: x, height: h }]} />
      {/* Right */}
      <View style={[styles.dark, { top: y, left: x + w, right: 0, height: h }]} />
      {/* Spotlight border glow */}
      <View style={[styles.glow, { top: y - 2, left: x - 2, width: w + 4, height: h + 4 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dark: {
    position:        'absolute',
    backgroundColor: DARK,
  },
  glow: {
    position:    'absolute',
    borderWidth:  2,
    borderColor: 'rgba(37,106,244,0.6)',
    borderRadius: 12,
  },
});
