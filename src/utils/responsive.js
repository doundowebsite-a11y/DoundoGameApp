import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints
const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

export const getDeviceType = () => {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'phone';
};

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Utility to get responsive sizing
export const getResponsiveLayout = () => {
  const deviceType = getDeviceType();
  const scrWidth = width;
  const scrHeight = height;

  let boardSize;
  let marginHorizontal;

  if (deviceType === 'desktop') {
    // Desktop: center layout with side margins
    boardSize = Math.min(600, scrHeight * 0.7); 
    marginHorizontal = (scrWidth - boardSize) / 2;
  } else if (deviceType === 'tablet') {
    // Tablet: larger board spacing
    boardSize = Math.min(scrWidth * 0.8, scrHeight * 0.7);
    marginHorizontal = (scrWidth - boardSize) / 2;
  } else {
    // Phones: compact grid
    boardSize = scrWidth * 0.95;
    marginHorizontal = (scrWidth - boardSize) / 2;
  }

  return {
    boardSize,
    marginHorizontal,
    deviceType,
    width: scrWidth,
    height: scrHeight,
  };
};

export const wp = (percentage) => {
  return (percentage * width) / 100;
};

export const hp = (percentage) => {
  return (percentage * height) / 100;
};

import { useState, useEffect } from 'react';

export const useDimensions = () => {
  const [dims, setDims] = useState(() => Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);
  return dims;
};

export const getBoardMetrics = (screenWidth) => {
  const containerW = Math.min(screenWidth, 448);
  const boardPadding = 16; 
  const gap = 6;
  const tilePadding = 8; 
  const usable = containerW - boardPadding * 2 - tilePadding * 2 - gap * 3;
  const tileSize = Math.floor(usable / 4);
  return { containerW, tileSize, gap, tilePadding };
};
