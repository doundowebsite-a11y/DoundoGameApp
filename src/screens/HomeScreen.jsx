import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme/theme';
import BottomNav from '../components/ui/BottomNav';
import MatchmakingModal from '../components/ui/MatchmakingModal';
import { useAuth } from '../context/AuthContext';
import useMatchmaking from '../hooks/useMatchmaking';

const AVATAR_SOURCES = {
  1: require('../assets/avatars/preset_1.jpg'),
  2: require('../assets/avatars/preset_2.jpg'),
  3: require('../assets/avatars/preset_3.jpg'),
  4: require('../assets/avatars/preset_4.jpg'),
  5: require('../assets/avatars/avatar_main.jpg'),
  6: require('../assets/avatars/preset_2.jpg'),
};
const getAvatar = (p) => AVATAR_SOURCES[p] ?? AVATAR_SOURCES[1];

const LiveCountBadge = ({ count }) => {
  const isLow = count < 10;
  return (
    <View style={[badge.wrap]}>
      <View style={[badge.dot, isLow ? badge.dotLow : badge.dotHigh]} />
      <Text style={[badge.txt, isLow && badge.txtLow]}>
        {isLow ? 'LESS THAN 10 PLAYERS' : `${count.toLocaleString()} PLAYERS ONLINE`}
      </Text>
    </View>
  );
};
const badge = StyleSheet.create({
  wrap:    { position: 'absolute', bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:     { width: 7, height: 7, borderRadius: 4 },
  dotHigh: { backgroundColor: '#4ADE80' },
  dotLow:  { backgroundColor: '#FACC15' },
  txt:     { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, opacity: 0.85 },
  txtLow:  { color: '#FACC15' },
});

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const username = profile?.username      || 'Gamer';
  const score    = profile?.score         || 0;
  const avatar   = profile?.avatar_preset || 1;
  const level    = Math.floor(score / 100) + 1;
  const xp       = score % 100;

  const { status, elapsed, liveCount, opponent, error, startSearch, cancelSearch } = useMatchmaking(navigation);

  const isSearching = status !== 'idle';
  const showModal   = status === 'searching' || status === 'found' || status === 'starting';

  return (
    // ── OUTER: full screen, no maxWidth ──────────────────────────
    // MatchmakingModal is a sibling of the inner container so it
    // can use position:absolute without being clipped by maxWidth.
    <View style={styles.outerFull}>

      {/* ── INNER: the actual constrained content ── */}
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

        <View style={styles.header}>
          <View style={styles.headerProfileInfo}>
            <View style={styles.avatarBorder}>
              <Image source={getAvatar(avatar)} style={styles.avatarImg} resizeMode="cover" />
            </View>
            <View>
              <Text style={styles.headerName}>{username}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('SettingsScreen')}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

          <View style={styles.profileCard}>
            <View style={styles.cardGlow} />
            <View style={styles.cardContent}>
              <View style={styles.levelCircleContainer}>
                <Svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx="40" cy="40" r="36" stroke="#1E293B" strokeWidth="4" fill="transparent" />
                  <Circle cx="40" cy="40" r="36" stroke={theme.colors.primary} strokeWidth="4"
                    fill="transparent" strokeDasharray="226"
                    strokeDashoffset={(1 - xp / 100) * 226} strokeLinecap="round" />
                </Svg>
                <View style={styles.levelTextContainer}>
                  <Text style={styles.levelNumber}>{level}</Text>
                </View>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{username}</Text>
                <Text style={styles.playerTitle}>Level {level} Explorer</Text>
                <View style={styles.xpRow}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${xp}%` }]} />
                  </View>
                  <Text style={styles.xpText}>{xp} / 100 XP</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>CHOOSE YOUR MODE</Text>
            <View style={styles.modesContainer}>

              <TouchableOpacity
                style={[styles.humanModeCard, isSearching && { opacity: 0.8 }]}
                activeOpacity={0.9}
                onPress={isSearching ? undefined : startSearch}
              >
                <View style={styles.humanModeGradient} />
                <Text style={[styles.iconTextLarge, { color: '#FFF' }]}>👥</Text>
                <Text style={styles.modeTitleText}>
                  {isSearching ? 'SEARCHING...' : 'PLAY AGAINST HUMAN'}
                </Text>
                <LiveCountBadge count={liveCount} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botModeCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LevelSelect')}
              >
                <Text style={[styles.iconTextLarge, { color: theme.colors.primary }]}>🤖</Text>
                <Text style={[styles.modeTitleText, { color: '#FFF' }]}>PLAYER VS COMPUTER</Text>
                <Text style={styles.botModeSubtitle}>SOLO TRAINING MODE</Text>
              </TouchableOpacity>

            </View>
          </View>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          <View style={[styles.sectionContainer, styles.recentSection]}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
              <TouchableOpacity><Text style={styles.viewAllText}>VIEW ALL</Text></TouchableOpacity>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityLeft}>
                <View style={styles.activityIconWrapper}><Text style={{ fontSize: 16 }}>🏆</Text></View>
                <View>
                  <Text style={styles.activityTitle}>Victory vs. Bot_Ultra</Text>
                  <Text style={styles.activityXp}>+150 XP</Text>
                </View>
              </View>
              <Text style={styles.activityTime}>2H AGO</Text>
            </View>
          </View>

        </ScrollView>

        <BottomNav navigation={navigation} activeRoute="Home" />

      </View>

      {/* ── MODAL: sibling of inner container, not clipped by maxWidth ── */}
      <MatchmakingModal
        visible={showModal}
        status={status}
        elapsed={elapsed}
        opponent={opponent}
        onCancel={cancelSearch}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  // Full screen outer wrapper — no maxWidth constraint
  outerFull: { flex: 1, backgroundColor: theme.colors.background.dark },

  // Inner constrained content
  container: { flex: 1, maxWidth: 448, alignSelf: 'center', width: '100%', backgroundColor: theme.colors.background.dark },

  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(37,106,244,0.1)' },
  headerProfileInfo:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBorder:     { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: theme.colors.primary, overflow: 'hidden' },
  avatarImg:        { width: '100%', height: '100%' },
  headerName:       { color: '#FFF', fontSize: 18, fontWeight: 'bold', lineHeight: 22 },
  statusRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  statusText:       { color: theme.colors.text.secondary, fontSize: 12, fontWeight: '500' },
  settingsBtn:      { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  iconText:         { fontSize: 20 },
  scrollContent:    { padding: 24, gap: 32 },
  profileCard:      { backgroundColor: 'rgba(37,106,244,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(37,106,244,0.1)', overflow: 'hidden', padding: 24 },
  cardGlow:         { position: 'absolute', top: -64, right: -64, width: 128, height: 128, backgroundColor: 'rgba(37,106,244,0.15)', borderRadius: 64 },
  cardContent:      { flexDirection: 'row', alignItems: 'center', gap: 20 },
  levelCircleContainer: { width: 80, height: 80, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  levelTextContainer:   { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  levelNumber:      { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  playerInfo:       { flex: 1 },
  playerName:       { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  playerTitle:      { color: theme.colors.primary, fontWeight: '500', marginBottom: 8 },
  xpRow:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBarBg:    { height: 6, flex: 1, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden' },
  progressBarFill:  { height: '100%', backgroundColor: theme.colors.primary },
  xpText:           { fontSize: 10, fontWeight: 'bold', color: theme.colors.text.secondary, textTransform: 'uppercase' },
  sectionContainer: { gap: 16 },
  sectionLabel:     { fontSize: 14, fontWeight: 'bold', color: theme.colors.text.secondary, letterSpacing: 2, paddingHorizontal: 4 },
  modesContainer:   { gap: 16 },
  humanModeCard:    { height: 160, backgroundColor: theme.colors.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, overflow: 'hidden' },
  humanModeGradient:{ position: 'absolute', borderWidth: 100, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 200, top: -50, right: -50 },
  iconTextLarge:    { fontSize: 36, marginBottom: 4 },
  modeTitleText:    { fontSize: 20, fontWeight: '900', letterSpacing: 2, color: '#FFF' },
  botModeCard:      { height: 160, backgroundColor: 'transparent', borderRadius: 16, borderWidth: 2, borderColor: 'rgba(37,106,244,0.3)', alignItems: 'center', justifyContent: 'center' },
  botModeSubtitle:  { position: 'absolute', bottom: 16, color: theme.colors.text.secondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
  errorBanner:      { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, padding: 12 },
  errorTxt:         { color: '#f87171', fontSize: 13, textAlign: 'center' },
  recentSection:    { marginTop: 'auto' },
  recentHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAllText:      { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' },
  activityItem:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12 },
  activityLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityIconWrapper: { width: 32, height: 32, borderRadius: 4, backgroundColor: 'rgba(37,106,244,0.1)', alignItems: 'center', justifyContent: 'center' },
  activityTitle:    { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  activityXp:       { color: theme.colors.text.secondary, fontSize: 10, textTransform: 'uppercase', marginTop: 2 },
  activityTime:     { color: theme.colors.text.secondary, fontSize: 10, fontWeight: 'bold' },
});

export default HomeScreen;
