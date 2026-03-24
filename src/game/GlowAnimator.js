/**
 * GlowAnimator.js
 * 
 * Reusable pulsing glow animation hook.
 * Returns an Animated.Value (0→1→0.25 loop) when active=true.
 * Used by GridCell, SwapButton, DrawButton, FaceOffButton.
 */
import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export function useGlow(active) {
  const anim = useRef(new Animated.Value(0)).current;
  const loop = useRef(null);

  useEffect(() => {
    loop.current?.stop();
    if (active) {
      anim.setValue(0);
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1, duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.25, duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      loop.current.start();
    } else {
      anim.setValue(0);
    }
    return () => loop.current?.stop();
  }, [active]);

  return anim;
}
