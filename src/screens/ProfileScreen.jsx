import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { IconArrowBack, IconFlash, IconHome, IconPerson } from '../assets/icons/icons';
import Button from '../components/ui/Button';
import BottomNav from '../components/ui/BottomNav';
import { useDimensions, getBoardMetrics } from '../utils/responsive';
import { useAuth } from '../context/AuthContext';

const ACHIEVEMENTS = [
  { id: 1, title: 'First Strike', icon: '🏆', color: 'rgba(234, 179, 8, 0.2)', iconColor: '#EAB308', unlocked: true },
  { id: 2, title: 'Iron Wall', icon: '🛡️', color: colors.overlay.primaryMedium, iconColor: colors.primary, unlocked: true },
  { id: 3, title: 'Swift Blade', icon: '⚡', color: 'rgba(16, 185, 129, 0.2)', iconColor: '#10B981', unlocked: true },
  { id: 4, title: 'Unknown', icon: '🔒', color: 'rgba(100, 116, 139, 0.2)', iconColor: colors.text.muted, unlocked: false },
];

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const { profile } = useAuth();

  const wins = profile?.games_won || 0;
  const losses = profile?.games_lost || 0;
  const draws = profile?.games_drawn || 0;
  const totalGames = wins + losses + draws;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
  const score = profile?.score || 0;
  
  const level = Math.floor(score / 500) + 1;
  const nextLevelXp = level * 500;
  const xpProgress = (score / nextLevelXp) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top, maxWidth: containerW }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconArrowBack size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PLAYER PROFILE</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
           <Text style={{fontSize: 20}}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>

        {/* Hero Profile Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarGlow}>
            <Image source={require('../assets/avatars/profile_hero.jpg')} style={styles.avatarImage} />
            <View style={styles.verifiedBadge}>
              <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
            </View>
          </View>

          <Text style={styles.playerName}>{profile?.username || 'Player'}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LEVEL {level}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>EXPERIENCE POINTS</Text>
            <Text style={styles.xpValue}>{score} / {nextLevelXp} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress, 100)}%` }]} />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>WINS</Text>
            <Text style={styles.statValue}>{wins}</Text>
            {wins > 0 && <Text style={[styles.statTrend, { color: '#10B981' }]}>⭐</Text>}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>LOSSES</Text>
            <Text style={styles.statValue}>{losses}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statLabel, { color: colors.primary }]}>WIN RATE</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{winRate}%</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.achievementsTitle}>ACHIEVEMENTS</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
            {ACHIEVEMENTS.map((ach) => (
              <View key={ach.id} style={[styles.achievementCard, !ach.unlocked && styles.achievementLocked]}>
                <View style={[styles.achievementIconBg, { backgroundColor: ach.color }]}>
                  <Text style={{ fontSize: 28 }}>{ach.icon}</Text>
                </View>
                <Text style={[styles.achievementLabel, !ach.unlocked && { color: colors.text.muted }]}>{ach.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>

      <BottomNav navigation={navigation} activeRoute="Profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)' } }),
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  // Hero
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: 12,
  },
  avatarGlow: {
    position: 'relative',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.overlay.primaryMedium,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border.primaryMedium,
  },
  levelText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: 14,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.slate[800],
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
    fontSize: 14,
  },
  // XP
  xpSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 12,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  xpValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  xpBarBg: {
    height: 12,
    borderRadius: 9999,
    backgroundColor: colors.slate[800],
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: colors.primary,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.slate[900],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  statCardHighlight: {
    backgroundColor: colors.overlay.primaryLight,
    borderColor: colors.border.primaryFaded,
  },
  statLabel: {
    color: colors.text.muted,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: typography.weights.bold,
  },
  statTrend: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Achievements
  achievementsSection: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  achievementsTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  achievementsScroll: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  achievementCard: {
    width: 128,
    aspectRatio: 1,
    backgroundColor: colors.slate[900],
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementLabel: {
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.dark,
    paddingTop: spacing.md,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)' } }),
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

export default ProfileScreen;
