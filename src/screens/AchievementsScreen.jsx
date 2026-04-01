/**
 * AchievementsScreen.jsx — src/screens/AchievementsScreen.jsx
 * Logic-only component for the Achievements Screen.
 */
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { useAuth } from '../context/AuthContext';
import AchievementsLayout from './layouts/AchievementsLayout';

const ACHIEVEMENTS = [
  { id: 1,  title: 'First Strike',    desc: 'Win your first game',            icon: '🏆', color: 'rgba(234, 179, 8, 0.2)',    iconColor: '#EAB308', check: (p) => (p?.games_won || 0) >= 1 },
  { id: 2,  title: 'Iron Wall',       desc: 'Win 10 games',                   icon: '🛡️', color: colors.overlay.primaryMedium, iconColor: colors.primary, check: (p) => (p?.games_won || 0) >= 10 },
  { id: 3,  title: 'Swift Blade',     desc: 'Reach Level 5',                  icon: '⚡', color: 'rgba(16, 185, 129, 0.2)',   iconColor: '#10B981', check: (p) => (Math.floor((p?.score || 0) / 500) + 1) >= 5 },
  { id: 4,  title: 'Veteran',         desc: 'Play 50 games',                  icon: '🎖️', color: 'rgba(251, 191, 36, 0.2)',   iconColor: '#FBBF24', check: (p) => ((p?.games_won || 0) + (p?.games_lost || 0) + (p?.games_drawn || 0)) >= 50 },
  { id: 5,  title: 'Unstoppable',     desc: 'Win 50 games',                   icon: '🔥', color: 'rgba(239, 68, 68, 0.2)',    iconColor: '#EF4444', check: (p) => (p?.games_won || 0) >= 50 },
  { id: 6,  title: 'Legend',          desc: 'Reach 10,000 score',             icon: '👑', color: 'rgba(168, 85, 247, 0.2)',   iconColor: '#A855F7', check: (p) => (p?.score || 0) >= 10000 },
  { id: 7,  title: 'Beginner',        desc: 'Play your first game',           icon: '🎮', color: 'rgba(59, 130, 246, 0.2)',   iconColor: '#3B82F6', check: (p) => ((p?.games_won || 0) + (p?.games_lost || 0) + (p?.games_drawn || 0)) >= 1 },
  { id: 8,  title: 'Dedicated',       desc: 'Play 20 games',                  icon: '💪', color: 'rgba(20, 184, 166, 0.2)',   iconColor: '#14B8A6', check: (p) => ((p?.games_won || 0) + (p?.games_lost || 0) + (p?.games_drawn || 0)) >= 20 },
  { id: 9,  title: 'Strategist',      desc: 'Win 5 games',                    icon: '🧠', color: 'rgba(99, 102, 241, 0.2)',   iconColor: '#6366F1', check: (p) => (p?.games_won || 0) >= 5 },
  { id: 10, title: 'Rising Star',     desc: 'Reach Level 3',                  icon: '⭐', color: 'rgba(245, 158, 11, 0.2)',   iconColor: '#F59E0B', check: (p) => (Math.floor((p?.score || 0) / 500) + 1) >= 3 },
  { id: 11, title: 'Master',          desc: 'Reach Level 10',                 icon: '🎯', color: 'rgba(236, 72, 153, 0.2)',   iconColor: '#EC4899', check: (p) => (Math.floor((p?.score || 0) / 500) + 1) >= 10 },
  { id: 12, title: 'Champion',        desc: 'Win 100 games',                  icon: '🏅', color: 'rgba(234, 179, 8, 0.2)',    iconColor: '#EAB308', check: (p) => (p?.games_won || 0) >= 100 },
];

const AchievementsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const { profile } = useAuth();

  const achievements = ACHIEVEMENTS.map(ach => ({
    ...ach,
    unlocked: ach.check(profile),
  }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <AchievementsLayout
      {...{
        navigation, insets, containerW, achievements, unlockedCount
      }}
    />
  );
};

export default AchievementsScreen;
