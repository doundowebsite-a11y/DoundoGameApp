/**
 * HomeLayout.jsx — src/screens/layouts/HomeLayout.jsx  (RESPONSIVE REFACTOR)
 *
 * Changes from original:
 * - All pixel values replaced with scale() / verticalScale() / moderateScale()
 * - Profile card adapts to tablet: row layout preserved, font sizes scale
 * - Mode cards use verticalScale for height so they don't overflow small phones
 * - LiveCountBadge font scaled
 * - MatchmakingModal rendered OUTSIDE the maxWidth container (already correct)
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../theme/theme';
import BottomNav from '../../components/ui/BottomNav';
import MatchmakingModal from '../../components/ui/MatchmakingModal';
import { scale, verticalScale, moderateScale, scaleFont, isTablet } from '../../utils/scale';

const AVATAR_SOURCES = {
  1: require('../../assets/avatars/preset_1.jpg'),
  2: require('../../assets/avatars/preset_2.jpg'),
  3: require('../../assets/avatars/preset_3.jpg'),
  4: require('../../assets/avatars/preset_4.jpg'),
  5: require('../../assets/avatars/avatar_main.jpg'),
  6: require('../../assets/avatars/preset_2.jpg'),
};
const getAvatar = (p) => AVATAR_SOURCES[p] ?? AVATAR_SOURCES[1];

const LiveCountBadge = ({ count }) => {
  const isLow = count < 10;
  return (
    <View style={badge.wrap}>
      <View style={[badge.dot, isLow ? badge.dotLow : badge.dotHigh]} />
      <Text style={[badge.txt, isLow && badge.txtLow]}>
        {isLow ? 'LESS THAN 10 PLAYERS' : `${count.toLocaleString()} PLAYERS ONLINE`}
      </Text>
    </View>
  );
};

const badge = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: scale(5), marginTop: scale(4) },
  dot:     { width: scale(6), height: scale(6), borderRadius: scale(3) },
  dotHigh: { backgroundColor: '#4ADE80' },
  dotLow:  { backgroundColor: '#FACC15' },
  txt:     { color: '#FFF', fontSize: scaleFont(9), fontWeight: '800', letterSpacing: 1, opacity: 0.85 },
  txtLow:  { color: '#FACC15' },
});

const HomeLayout = (props) => {
  const {
    navigation, insets, username, avatar, level, xpPct, levelTitle, xpInLevel, xpNeeded,
    isSearching, liveCount, status, elapsed, opponent, showModal, error,
    onStartSearch, onCancelSearch, onAcceptBot, onExtendSearch,
  } = props;

  // Tablet: show 2-column grid of mode cards
  const tablet = isTablet();

  return (
    <View style={styles.outerFull}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerProfileInfo}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarBorder}>
              <Image source={getAvatar(avatar)} style={styles.avatarImg} resizeMode="cover" />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.headerName} numberOfLines={1}>{username}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('SettingsScreen')}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile / XP Card */}
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => navigation.navigate('LevelProgress')}
            activeOpacity={0.9}
          >
            <View style={styles.cardGlow} />
            <View style={styles.cardContent}>
              <View style={styles.levelCircleContainer}>
                <Svg
                  width={scale(76)}
                  height={scale(76)}
                  viewBox="0 0 80 80"
                  style={{ transform: [{ rotate: '-90deg' }] }}
                >
                  <Circle cx="40" cy="40" r="36" stroke="#1E293B" strokeWidth="4" fill="transparent" />
                  <Circle cx="40" cy="40" r="36" stroke={theme.colors.primary} strokeWidth="4"
                    fill="transparent" strokeDasharray="226"
                    strokeDashoffset={(1 - xpPct / 100) * 226} strokeLinecap="round" />
                </Svg>
                <View style={styles.levelTextContainer}>
                  <Text style={styles.levelNumber}>{level}</Text>
                </View>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>{username}</Text>
                <Text style={styles.playerTitle} numberOfLines={1}>{levelTitle}</Text>
                <View style={styles.xpRow}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${xpPct}%` }]} />
                  </View>
                  <Text style={styles.xpText}>{xpInLevel}/{xpNeeded} XP</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Mode Cards */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>CHOOSE YOUR MODE</Text>
            <View style={[styles.modesContainer, tablet && styles.modesTablet]}>

              {/* Vs Human */}
              <TouchableOpacity
                style={[styles.modeCard, styles.humanCard, tablet && styles.modeCardTablet]}
                activeOpacity={0.9}
                onPress={isSearching ? undefined : onStartSearch}
              >
                <View style={styles.humanGlow} />
                <Text style={styles.modeIcon}>👥</Text>
                <Text style={styles.modeTitle}>
                  {isSearching ? 'SEARCHING...' : 'PLAY VS HUMAN'}
                </Text>
                <Text style={styles.modeSub}>MULTIPLAYER</Text>
                <LiveCountBadge count={liveCount} />
              </TouchableOpacity>

              {/* Vs Bot */}
              <TouchableOpacity
                style={[styles.modeCard, styles.botCard, tablet && styles.modeCardTablet]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('LevelSelect')}
              >
                <View style={styles.botGlow} />
                <Text style={styles.modeIcon}>🤖</Text>
                <Text style={styles.modeTitle}>PLAYER VS COMPUTER</Text>
                <Text style={styles.modeSub}>SOLO TRAINING MODE</Text>
              </TouchableOpacity>

              {/* Tutorial */}
              <TouchableOpacity
                style={[styles.modeCard, styles.tutorialCard, tablet && styles.modeCardTablet]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Tutorial')}
              >
                <View style={styles.tutorialGlow} />
                <Text style={styles.modeIcon}>📖</Text>
                <Text style={styles.modeTitle}>HOW TO PLAY</Text>
                <Text style={styles.modeSub}>INTERACTIVE TUTORIAL</Text>
              </TouchableOpacity>

              {/* Daily Challenge */}
              <TouchableOpacity
                style={[styles.modeCard, styles.dailyCard, tablet && styles.modeCardTablet]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DailyChallenge')}
              >
                <View style={styles.dailyGlow} />
                <Text style={styles.modeIcon}>📅</Text>
                <Text style={styles.modeTitle}>DAILY CHALLENGE</Text>
                <Text style={styles.modeSub} numberOfLines={2}>SAME SEED EVERYONE. TRY TO BEAT THE HIGH SCORE!</Text>
              </TouchableOpacity>

              {/* Leaderboard */}
              <TouchableOpacity
                style={[styles.modeCard, styles.leaderboardCard, tablet && styles.modeCardTablet]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Leaderboard')}
              >
                <View style={styles.leaderboardGlow} />
                <Text style={styles.modeIcon}>🏆</Text>
                <Text style={styles.modeTitle}>GLOBAL LEADERBOARD</Text>
                <Text style={styles.modeSub}>TOP 50 PLAYERS WORLDWIDE</Text>
              </TouchableOpacity>

            </View>
          </View>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}
        </ScrollView>

        <BottomNav navigation={navigation} activeRoute="Home" />
      </View>

      <MatchmakingModal
        visible={showModal}
        status={status}
        elapsed={elapsed}
        opponent={opponent}
        liveCount={liveCount}
        onCancel={onCancelSearch}
        onAcceptBot={onAcceptBot}
        onExtendSearch={onExtendSearch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerFull: { flex: 1, backgroundColor: theme.colors.background.dark },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.background.dark,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderColor: 'rgba(37,106,244,0.1)',
  },
  headerProfileInfo: { flexDirection: 'row', alignItems: 'center', gap: scale(12), flex: 1 },
  avatarBorder: {
    width: scale(40), height: scale(40), borderRadius: scale(20),
    borderWidth: 2, borderColor: theme.colors.primary, overflow: 'hidden',
  },
  avatarImg:    { width: '100%', height: '100%' },
  headerName:   { color: '#FFF', fontSize: scaleFont(17), fontWeight: 'bold', lineHeight: scaleFont(22), flexShrink: 1 },
  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  statusDot:    { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: '#22C55E' },
  statusText:   { color: theme.colors.text.secondary, fontSize: scaleFont(12), fontWeight: '500' },
  settingsBtn:  { padding: scale(8), borderRadius: scale(12), backgroundColor: 'rgba(255,255,255,0.05)' },
  iconText:     { fontSize: scaleFont(20) },

  // Scroll
  scrollContent: { padding: scale(16), gap: scale(20), paddingBottom: verticalScale(24) },

  // Profile card
  profileCard: {
    backgroundColor: 'rgba(37,106,244,0.05)',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(37,106,244,0.1)',
    overflow: 'hidden',
    padding: scale(20),
  },
  cardGlow: {
    position: 'absolute', top: -scale(64), right: -scale(64),
    width: scale(128), height: scale(128),
    backgroundColor: 'rgba(37,106,244,0.15)', borderRadius: scale(64),
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: scale(16) },
  levelCircleContainer: {
    width: scale(76), height: scale(76),
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  levelTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  levelNumber:  { color: '#FFF', fontSize: scaleFont(20), fontWeight: 'bold' },
  playerInfo:   { flex: 1 },
  playerName:   { color: '#FFF', fontSize: scaleFont(22), fontWeight: 'bold' },
  playerTitle:  { color: theme.colors.primary, fontWeight: '500', marginBottom: verticalScale(6), fontSize: scaleFont(13) },
  xpRow:        { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  progressBarBg:{ height: verticalScale(6), flex: 1, backgroundColor: '#1E293B', borderRadius: scale(4), overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary },
  xpText:       { fontSize: scaleFont(10), fontWeight: 'bold', color: theme.colors.text.secondary, textTransform: 'uppercase' },

  // Sections
  sectionContainer: { gap: scale(12) },
  sectionLabel: {
    fontSize: scaleFont(13), fontWeight: 'bold',
    color: theme.colors.text.secondary, letterSpacing: 2, paddingHorizontal: scale(4),
  },

  // Mode cards — phone: single column
  modesContainer:  { gap: scale(12) },
  // Mode cards — tablet: 2-column wrap
  modesTablet:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  modeCard: {
    height: verticalScale(120),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: verticalScale(4),
    paddingHorizontal: scale(12),
  },
  // On tablet each card takes ~48% width with gap
  modeCardTablet: { width: '48%', height: verticalScale(140), marginBottom: scale(4) },

  modeIcon:  { fontSize: scaleFont(28), marginBottom: verticalScale(2) },
  modeTitle: { fontSize: scaleFont(14), fontWeight: '900', letterSpacing: 1.5, color: '#FFF', textAlign: 'center' },
  modeSub:   { fontSize: scaleFont(9), fontWeight: '700', letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

  humanCard:       { backgroundColor: '#1d5bd4', shadowColor: '#256af4', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  humanGlow:       { position: 'absolute', borderWidth: 80, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 160, top: -40, right: -40 },
  botCard:         { backgroundColor: '#0f3460', borderWidth: 1.5, borderColor: 'rgba(37,106,244,0.4)', shadowColor: '#0f3460', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  botGlow:         { position: 'absolute', borderWidth: 60, borderColor: 'rgba(37,106,244,0.12)', borderRadius: 120, top: -30, left: -30 },
  tutorialCard:    { backgroundColor: '#1a1060', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.45)', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  tutorialGlow:    { position: 'absolute', borderWidth: 60, borderColor: 'rgba(139,92,246,0.15)', borderRadius: 120, top: -30, right: -30 },
  dailyCard:       { backgroundColor: '#431407', borderWidth: 1.5, borderColor: 'rgba(251,146,60,0.45)', shadowColor: '#ea580c', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  dailyGlow:       { position: 'absolute', borderWidth: 60, borderColor: 'rgba(251,146,60,0.15)', borderRadius: 120, top: -30, right: -30 },
  leaderboardCard: { backgroundColor: '#1b3c20', borderWidth: 1.5, borderColor: 'rgba(34,197,94,0.45)', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  leaderboardGlow: { position: 'absolute', borderWidth: 60, borderColor: 'rgba(34,197,94,0.15)', borderRadius: 120, bottom: -30, left: -30 },

  // Error
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#ef4444', borderRadius: scale(10), padding: scale(12) },
  errorTxt:    { color: '#f87171', fontSize: scaleFont(13), textAlign: 'center' },
});

export default HomeLayout;
