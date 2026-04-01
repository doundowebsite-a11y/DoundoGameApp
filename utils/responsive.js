import { Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { scale, isTablet } from './scale';

export const isWeb     = Platform.OS === 'web';
export const isIOS     = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const useDimensions = () => {
  const [dims, setDims] = useState(() => Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);
  return dims;
};

export const getBoardMetrics = (screenWidth) => {
  const { height: screenHeight } = Dimensions.get('window');
  // Scale proportionately but strictly cap height (containerW as grid is roughly 1:1) 
  // to guarantee opponent/cards NEVER overlap. Uses 40% on tablets and 35% on phones.
  const heightRatio = isTablet() ? 0.40 : 0.35;
  const maxW = Math.min(screenWidth * 0.94, screenHeight * heightRatio);
  const containerW = maxW;
  const gap         = scale(6);
  const tilePadding = scale(8);
  const boardPadH   = scale(12);
  const usable      = containerW - boardPadH * 2 - tilePadding * 2 - gap * 3;
  const tileSize    = Math.floor(usable / 4);
  return { containerW, tileSize, gap, tilePadding };
};

export const getResponsiveLayout = () => {
  const { width, height } = Dimensions.get('window');
  const deviceType = width >= 1024 ? 'desktop' : width >= 600 ? 'tablet' : width >= 414 ? 'large' : 'phone';
  const boardSize  =
    deviceType === 'desktop' ? Math.min(520, height * 0.7)
    : deviceType === 'tablet' ? Math.min(width * 0.75, height * 0.65)
    : width * 0.95;
  return { boardSize, marginHorizontal: (width - boardSize) / 2, deviceType, width, height };
};

export const getDeviceType = () => getResponsiveLayout().deviceType;
export const wp = (p) => (p * Dimensions.get('window').width)  / 100;
export const hp = (p) => (p * Dimensions.get('window').height) / 100;