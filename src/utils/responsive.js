import { Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Hook — always fresh on rotation / foldable resize
export const useDimensions = () => {
  const [dims, setDims] = useState(() => Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);
  return dims;
};

// Board metrics derived from live screen width
export const getBoardMetrics = (screenWidth) => {
  const containerW = Math.min(screenWidth, 448);
  const boardPadding = 16;
  const gap = 6;
  const tilePadding = 8;
  const usable = containerW - boardPadding * 2 - tilePadding * 2 - gap * 3;
  const tileSize = Math.floor(usable / 4);
  return { containerW, tileSize, gap, tilePadding };
};

// Legacy helpers kept for backward compat
export const getResponsiveLayout = () => {
  const { width, height } = Dimensions.get('window');
  const deviceType = width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'phone';
  let boardSize =
    deviceType === 'desktop' ? Math.min(600, height * 0.7) :
    deviceType === 'tablet'  ? Math.min(width * 0.8, height * 0.7) :
    width * 0.95;
  return { boardSize, marginHorizontal: (width - boardSize) / 2, deviceType, width, height };
};

export const wp = (p) => (p * Dimensions.get('window').width) / 100;
export const hp = (p) => (p * Dimensions.get('window').height) / 100;
