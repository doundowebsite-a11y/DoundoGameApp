/**
 * HandPointer.jsx — src/tutorial/HandPointer.jsx
 * Subtle bounce animation only — 4px up/down nudge.
 * mode="tap"  — gentle bob on the target
 * mode="drag" — same gentle bob (drag is shown by spotlight, not animation)
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export default function HandPointer({ targetX, targetY, visible }) {
  const nudge   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.8)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    loopRef.current?.stop?.();
    if (!visible) {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }

    // Fade + pop in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, friction: 5,  useNativeDriver: true }),
    ]).start(() => {
      // Subtle 4px nudge loop
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(nudge, { toValue: -4, duration: 500, useNativeDriver: true }),
          Animated.timing(nudge, { toValue:  0, duration: 500, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    });

    return () => { loopRef.current?.stop?.(); };
  }, [visible, targetX, targetY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          left:    (targetX ?? 0),
          top:     (targetY ?? 0),
          opacity,
          transform: [{ translateY: nudge }, { scale }],
        },
      ]}
    >
      <Text style={styles.emoji}>👆</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position:  'absolute',
    zIndex:     998,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 36,
    textShadowColor:  'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
});
