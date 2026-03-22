import { withSpring, withTiming, Easing } from 'react-native-reanimated';

// Animation speed constants
export const ANIMATION_SPEEDS = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Reusable spring config
export const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const boardAnimations = {
  // Glow pulse for active tiles
  pulseGlow: (value) => {
    return withTiming(value, {
      duration: ANIMATION_SPEEDS.normal,
      easing: Easing.inOut(Easing.ease),
    });
  },
  
  // Card hover lift
  cardLift: (isHovered) => {
    return withSpring(isHovered ? -10 : 0, springConfig);
  },
  
  // Invalid move shake warning
  shakeError: () => {
    // Implement complex keyframe shake using Reanimated logic inside the component
  }
};
