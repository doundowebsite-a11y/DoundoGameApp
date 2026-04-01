/**
 * useResponsive.js — src/hooks/useResponsive.js
 *
 * A hook-based version of the responsive scaling utility.
 * Using this over `utils/scale.js` ensures that when the device orientation changes
 * (or Split Screen is used on iPads), the scaling functions will use the updated Dimensions.
 */

import { useWindowDimensions, PixelRatio } from 'react-native';
import { useMemo } from 'react';

const BASE_WIDTH  = 375;
const BASE_HEIGHT = 812;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // If landscape, we'd normally swap, but standard scaling often works better 
  // keeping the "shortest" width as base width out of the box. 
  // By using raw width/height, we allow the layout flex system to adapt while items stretch.
  const SCREEN_W = width;
  const SCREEN_H = height;

  return useMemo(() => {
    // Horizontal scale — use for widths, horizontal padding/margin
    const scale = (size) => (SCREEN_W / BASE_WIDTH) * size;

    // Vertical scale — use for heights, vertical padding/margin
    const verticalScale = (size) => (SCREEN_H / BASE_HEIGHT) * size;

    // Moderate scale — interpolates between raw size and scaled size
    const moderateScale = (size, factor = 0.5) =>
      size + (scale(size) - size) * factor;

    // Font scaling with bounds
    const scaleFont = (size) =>
      clamp(moderateScale(size, 0.45), size * 0.85, size * 1.35);

    // Breakpoints
    const isTablet = SCREEN_W >= 600;
    const isSmall  = SCREEN_W < 360;
    const isLarge  = SCREEN_W >= 414;

    let deviceType = 'phone';
    if (isTablet) deviceType = 'tablet';
    else if (isLarge) deviceType = 'large';
    else if (isSmall) deviceType = 'small';

    const hairline = 1 / PixelRatio.get();

    return {
      scale,
      verticalScale,
      moderateScale,
      scaleFont,
      isTablet,
      isSmall,
      isLarge,
      deviceType,
      clamp,
      hairline,
      SCREEN_W,
      SCREEN_H,
    };
  }, [SCREEN_W, SCREEN_H]);
}
