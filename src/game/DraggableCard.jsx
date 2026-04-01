import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { theme } from '../../theme/theme';
import { SymbolCard } from './SymbolCard';

export const DraggableCard = ({ card, onDropComplete }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Note: App needs to be wrapped in GestureHandlerRootView for this to work
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      // Spring back to origin if not dropped logically
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      
      if (onDropComplete) {
        // Trigger logic to check if dropped over a valid tile slot
        // onDropComplete(translateX.value, translateY.value, card);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isDragging.value ? 1.1 : 1) }
      ],
      zIndex: isDragging.value ? 100 : 1,
      elevation: isDragging.value ? 100 : 1, // Android
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.draggable, animatedStyle]}>
        <SymbolCard symbol={card.symbol} />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  draggable: {
    width: 60,
    height: 85,
    margin: theme.spacing.sm,
  }
});
