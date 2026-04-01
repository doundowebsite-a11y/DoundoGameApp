/**
 * LevelProgressScreen.jsx — src/screens/LevelProgressScreen.jsx
 * Logic-only component for the Level Progress Screen.
 */
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { useAuth } from '../context/AuthContext';
import { getLevel, getLevelProgress, getLevelTitle } from '../utils/scoring';
import LevelProgressLayout from './layouts/LevelProgressLayout';

const LevelProgressScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const { profile } = useAuth();

  const score = profile?.score || 0;
  const currentLevel = getLevel(score);
  const { xpInLevel, xpNeeded, xpPct } = getLevelProgress(score);
  const currentTitle = getLevelTitle(score).split(' ').slice(2).join(' ').toUpperCase();

  return (
    <LevelProgressLayout
      {...{
        navigation, insets, containerW, currentLevel, xpInLevel, xpNeeded, xpPct, currentTitle
      }}
    />
  );
};

export default LevelProgressScreen;
