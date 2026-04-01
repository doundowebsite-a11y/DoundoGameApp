/**
 * ProfileLayout.jsx — src/screens/layouts/ProfileLayout.jsx  (RESPONSIVE REFACTOR)
 *
 * Changes:
 * - Avatar size uses scale() — proportional on all devices
 * - Stat cards use flex instead of fixed widths
 * - Font sizes use scaleFont()
 * - Action buttons wrap properly on small screens
 * - XP bar height uses verticalScale
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { IconArrowBack } from '../../assets/icons/icons';
import BottomNav from '../../components/ui/BottomNav';
import { scale, verticalScale, scaleFont, isTablet } from '../../utils/scale';

const AVATARS = {
  1: require('../../assets/avatars/preset_1.jpg'),
  2: require('../../assets/avatars/preset_2.jpg'),
  3: require('../../assets/avatars/preset_3.jpg'),
  4: require('../../assets/avatars/preset_4.jpg'),
  5: require('../../assets/avatars/avatar_main.jpg'),
  6: require('../../assets/avatars/preset_2.jpg'),
};

const AVATAR_SIZE = scale(isTablet() ? 140 : 110);

const ProfileLayout = (props) => {
  const {
    navigation, insets, containerW, profile, level, levelTitle, xpInLevel, xpNeeded, xpProgress,
    wins, losses, draws, totalGames, winRate, score, achievements, unlockedCount,
    onShare, onSignOut, onViewAllAchievements,
  } = props;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconArrowBack size={scale(24)} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PLAYER PROFILE</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: scaleFont(20) }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={[styles.avatarGlow, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}>
            <Image
              source={AVATARS[profile?.avatar_preset] ?? AVATARS[1]}
              style={[styles.avatarImage, { borderRadius: AVATAR_SIZE / 2 }]}
            />
            <View style={styles.verifiedBadge}>
              <Text style={{ color: '#FFF', fontSize: scaleFont(10) }}>✓</Text>
            </View>
          </View>

          <Text style={styles.playerName} numberOfLines={1}>{profile?.username || 'Player'}</Text>
          <TouchableOpacity style={styles.levelBadge} onPress={() => navigation.navigate('LevelProgress')}>
            <Text style={styles.levelText}>{levelTitle.toUpperCase()}</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
              <Text style={styles.signOutButtonText}>🚪 Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>EXPERIENCE POINTS</Text>
            <Text style={styles.xpValue}>{xpInLevel} / {xpNeeded} XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress, 100)}%` }]} />
          </View>
        </View>

        {/* Stats Grid */}
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

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL GAMES</Text>
            <Text style={styles.statValue}>{totalGames}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DRAWS</Text>
            <Text style={styles.statValue}>{draws}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL SCORE</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
        </View>

        {/* Achievements Preview */}
        <View style={styles.achievementsSection}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.achievementsTitle}>ACHIEVEMENTS ({unlockedCount}/{achievements.length})</Text>
            <TouchableOpacity onPress={onViewAllAchievements}>
              <Text style={styles.viewAllText}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.achievementsList}>
            {achievements.slice(0, 3).map((ach) => (
              <View key={ach.id} style={[styles.achievementRow, !ach.unlocked && styles.achievementRowLocked]}>
                <View style={[styles.achievementIconBg, { backgroundColor: ach.color }]}>
                  <Text style={{ fontSize: scaleFont(20) }}>{ach.unlocked ? ach.icon : '🔒'}</Text>
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementLabel, !ach.unlocked && { color: colors.text.muted }]} numberOfLines={1}>
                    {ach.title}
                  </Text>
                  <Text style={styles.achievementDesc} numberOfLines={1}>{ach.desc}</Text>
                </View>
                {ach.unlocked && <Text style={styles.checkText}>✓</Text>}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      <BottomNav navigation={navigation} activeRoute="Profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.dark, alignSelf: 'center', width: '100%' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: scaleFont(16),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  scrollContent: { flexGrow: 1, paddingBottom: verticalScale(24) },

  heroSection: {
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    gap: scale(10),
  },
  avatarGlow: {
    borderWidth: 3,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.75,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  verifiedBadge: {
    position: 'absolute', bottom: scale(4), right: scale(4),
    width: scale(22), height: scale(22), borderRadius: scale(11),
    backgroundColor: colors.primary,
    borderWidth: 2, borderColor: colors.background.dark,
    alignItems: 'center', justifyContent: 'center',
  },
  playerName: { color: colors.text.primary, fontSize: scaleFont(26), fontWeight: '700', letterSpacing: -0.5 },
  levelBadge: {
    paddingHorizontal: scale(16), paddingVertical: scale(6),
    backgroundColor: colors.overlay.primaryMedium,
    borderRadius: 9999, borderWidth: 1, borderColor: colors.border.primaryMedium,
  },
  levelText: { color: colors.primary, fontSize: scaleFont(12), fontWeight: '700', letterSpacing: 2 },

  actionRow: { flexDirection: 'row', gap: scale(10), width: '100%', marginTop: scale(4) },
  editButton: {
    flex: 1, backgroundColor: colors.primary,
    paddingVertical: verticalScale(12), borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  editButtonText: { color: '#FFF', fontWeight: '700', fontSize: scaleFont(13) },
  signOutButton: {
    flex: 1, backgroundColor: colors.slate[800],
    paddingVertical: verticalScale(12), borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ef4444',
  },
  signOutButtonText: { color: '#ef4444', fontWeight: '700', fontSize: scaleFont(13) },
  shareButton: {
    flex: 1, backgroundColor: colors.slate[800],
    paddingVertical: verticalScale(12), borderRadius: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  shareButtonText: { color: colors.text.primary, fontWeight: '700', fontSize: scaleFont(13) },

  xpSection: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    gap: scale(10),
  },
  xpRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel:    { color: colors.text.primary, fontSize: scaleFont(12), fontWeight: '700', letterSpacing: 1 },
  xpValue:    { color: colors.primary, fontSize: scaleFont(12), fontWeight: '700' },
  xpBarBg:    { height: verticalScale(10), borderRadius: 9999, backgroundColor: colors.slate[800], overflow: 'hidden' },
  xpBarFill:  { height: '100%', borderRadius: 9999, backgroundColor: colors.primary },

  statsRow:          { flexDirection: 'row', gap: scale(10), paddingHorizontal: scale(20), paddingVertical: verticalScale(6) },
  statCard:          { flex: 1, backgroundColor: colors.slate[900], borderWidth: 1, borderColor: colors.border.subtle, borderRadius: scale(12), padding: scale(12), gap: scale(4) },
  statCardHighlight: { backgroundColor: colors.overlay.primaryLight, borderColor: colors.border.primaryFaded },
  statLabel:         { color: colors.text.muted, fontSize: scaleFont(9), fontWeight: '700', textTransform: 'uppercase' },
  statValue:         { color: colors.text.primary, fontSize: scaleFont(22), fontWeight: '900' },
  statTrend:         { fontSize: scaleFont(11), fontWeight: '500' },

  achievementsSection: { paddingVertical: verticalScale(12), gap: scale(12) },
  achievementsHeader:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  achievementsTitle: { color: colors.text.primary, fontSize: scaleFont(16), fontWeight: '700', letterSpacing: 1 },
  viewAllText:       { color: colors.primary, fontSize: scaleFont(12), fontWeight: '700' },
  achievementsList:  { paddingHorizontal: scale(20), gap: scale(8) },
  achievementRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.slate[900], borderRadius: scale(12),
    padding: scale(10), borderWidth: 1, borderColor: colors.border.subtle, gap: scale(12),
  },
  achievementRowLocked: { opacity: 0.6 },
  achievementIconBg: {
    width: scale(40), height: scale(40), borderRadius: scale(20),
    alignItems: 'center', justifyContent: 'center',
  },
  achievementInfo:  { flex: 1 },
  achievementLabel: { color: '#FFF', fontSize: scaleFont(13), fontWeight: '700' },
  achievementDesc:  { color: colors.text.muted, fontSize: scaleFont(11) },
  checkText:        { color: '#4ADE80', fontSize: scaleFont(16), fontWeight: '900', marginRight: scale(4) },
});

export default ProfileLayout;
