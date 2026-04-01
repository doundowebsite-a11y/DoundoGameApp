/**
 * LevelSelectScreen.jsx — src/screens/LevelSelectScreen.jsx
 * Logic-only component for the Level Selection Screen.
 */
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDimensions, getBoardMetrics } from '../utils/responsive';
import LevelSelectLayout from './layouts/LevelSelectLayout';

const LevelSelectScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);

  const [selected, setSelected] = useState('easy');
  const [playThree, setPlayThree] = useState(false);

  return (
    <LevelSelectLayout
      {...{
        navigation, insets, containerW, selected, playThree,
        onSelect: setSelected,
        onToggleThree: () => setPlayThree(!playThree),
        onStartGame: () => navigation.navigate('GameScreen', { difficulty: selected, matches: playThree ? 3 : 1 })
      }}
    />
  );
};

export default LevelSelectScreen;
