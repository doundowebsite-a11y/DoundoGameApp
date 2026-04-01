/**
 * ProfileScreen.jsx — src/screens/ProfileScreen.jsx
 * Logic-only component for the Profile Screen.
 */
import React from 'react';
import { Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useDimensions, getBoardMetrics } from '../utils/responsive';
import { useAuth } from '../context/AuthContext';
import { getLevel, getLevelProgress, getLevelTitle } from '../utils/scoring';
import ProfileLayout from './layouts/ProfileLayout';

const ACHIEVEMENTS = [
  { id: 1, title: 'First Strike', desc: 'Win your first game', icon: '🏆', color: 'rgba(234, 179, 10, 0.2)', iconColor: '#EAB308', check: (p) => (p?.games_won || 0) >= 1 },
  { id: 2, title: 'Iron Wall', desc: 'Win 10 games', icon: '🛡️', color: 'rgba(37, 106, 244, 0.2)', iconColor: colors.primary, check: (p) => (p?.games_won || 0) >= 10 },
  { id: 3, title: 'Swift Blade', desc: 'Reach Level 5', icon: '⚡', color: 'rgba(16, 185, 129, 0.2)', iconColor: '#10B981', check: (p) => getLevel(p?.score || 0) >= 5 },
  { id: 4, title: 'Veteran', desc: 'Play 50 games', icon: '🎖️', color: 'rgba(251, 191, 36, 0.2)', iconColor: '#FBBF24', check: (p) => ((p?.games_won || 0) + (p?.games_lost || 0) + (p?.games_drawn || 0)) >= 50 },
  { id: 5, title: 'Unstoppable', desc: 'Win 50 games', icon: '🔥', color: 'rgba(239, 68, 68, 0.2)', iconColor: '#EF4444', check: (p) => (p?.games_won || 0) >= 50 },
  { id: 6, title: 'Legend', desc: 'Reach 10,000 score', icon: '👑', color: 'rgba(168, 85, 247, 0.2)', iconColor: '#A855F7', check: (p) => (p?.score || 0) >= 10000 },
];

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const { profile, signOut } = useAuth();

  const wins       = profile?.games_won || 0;
  const losses     = profile?.games_lost || 0;
  const draws      = profile?.games_drawn || 0;
  const totalGames = wins + losses + draws;
  const winRate    = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';
  const score      = profile?.score || 0;
  
  const level      = getLevel(score);
  const { xpInLevel, xpNeeded, xpPct: xpProgress } = getLevelProgress(score);
  const levelTitle = getLevelTitle(score);

  const achievements = ACHIEVEMENTS.map(ach => ({
    ...ach,
    unlocked: ach.check(profile),
  }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my Doundo profile! ${profile?.username || 'Player'} — Level ${level} | ${wins} wins | ${score} XP`,
      });
    } catch {}
  };

  return (
    <ProfileLayout
      {...{
        navigation, insets, containerW, profile, level, levelTitle, xpInLevel, xpNeeded, xpProgress,
        wins, losses, draws, totalGames, winRate, score, achievements, unlockedCount,
        onShare: handleShare,
        onSignOut: signOut,
        onViewAllAchievements: () => navigation.navigate('Achievements')
      }}
    />
  );
};

export default ProfileScreen;
