import { Dimensions, PixelRatio } from 'react-native';

const BASE_WIDTH  = 375;
const BASE_HEIGHT = 812;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Clamp extreme tablet widths so paddings/fonts scale gracefully (max ~1.33x) instead of ballooning to 200%+ 
const EFFECTIVE_W = Math.min(SCREEN_W, 500);
const EFFECTIVE_H = Math.min(SCREEN_H, 1000);

export const scale         = (size) => (EFFECTIVE_W / BASE_WIDTH) * size;
export const verticalScale = (size) => (EFFECTIVE_H / BASE_HEIGHT) * size;
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
export const clamp         = (value, min, max) => Math.min(Math.max(value, min), max);
export const scaleFont     = (size) => clamp(moderateScale(size, 0.45), size * 0.85, size * 1.35);
export const hairline      = () => 1 / PixelRatio.get();
export const isTablet      = () => SCREEN_W >= 600;
export const isSmall       = () => SCREEN_W < 360;
export const isLarge       = () => SCREEN_W >= 414;
export const deviceType    = () => {
  if (SCREEN_W >= 600) return 'tablet';
  if (SCREEN_W >= 414) return 'large';
  if (SCREEN_W >= 360) return 'phone';
  return 'small';
};

export default { scale, verticalScale, moderateScale, scaleFont, isTablet, isSmall, isLarge, deviceType, clamp, hairline };