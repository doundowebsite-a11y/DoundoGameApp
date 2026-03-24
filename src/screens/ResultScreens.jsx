/**
 * ResultScreens.jsx — src/screens/ResultScreens.jsx
 * Restored to original design (avatar circle, username, stats grid).
 * Only change: primary button → Home instead of LevelSelect.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const AVATARS = {
  1: require('../assets/avatars/preset_1.jpg'),
  2: require('../assets/avatars/preset_2.jpg'),
  3: require('../assets/avatars/preset_3.jpg'),
  4: require('../assets/avatars/preset_4.jpg'),
  5: require('../assets/avatars/avatar_main.jpg'),
  6: require('../assets/avatars/preset_2.jpg'),
};

const MatchResultsHeader = ({ navigation, title }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.headerBtn}>
      <Text style={styles.headerIconText}>✕</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <TouchableOpacity style={styles.headerBtn}>
      <Text style={styles.headerIconText}>ℹ️</Text>
    </TouchableOpacity>
  </View>
);

export const WinScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const params       = route.params || {};
  const points       = params.points || 0;
  const totalCards   = params.totalCards || 42;
  const time         = params.time || '05:00';
  const currentTotal = profile?.score || 0;
  const username     = profile?.username || 'Player';
  const avatarPreset = profile?.avatar_preset ?? 1;
  const avatarSrc    = AVATARS[avatarPreset] ?? AVATARS[1];
  const perfect      = params.perfect;
  const forfeit      = params.forfeit;
  const oppName      = params.opponentName;
  const isMP         = params.isMultiplayer;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <MatchResultsHeader navigation={navigation} title="Match Results" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LottieView source={require('../animations/fireworks.json')} autoPlay loop style={{ width: '100%', height: '100%', opacity: 0.6 }} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.victoryText, styles.glowText]}>VICTORY</Text>
          <Text style={styles.subtitleText}>
            {forfeit ? 'WIN BY FORFEIT' : perfect ? '⚡ PERFECT GAME' : isMP && oppName ? `VS ${oppName.toUpperCase()}` : 'DOUNDO CHAMPION'}
          </Text>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarSrc} style={styles.avatarImg} />
            <View style={styles.crownBadge}><Text style={{ fontSize: 24 }}>👑</Text></View>
          </View>
          <Text style={styles.usernameText}>{username}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Points Earned</Text>
            <Text style={styles.statValue}>+{points}</Text>
          </View>
          <View style={[styles.statCard, { borderColor: theme.colors.primary, backgroundColor: 'rgba(37,106,244,0.1)' }]}>
            <Text style={styles.statLabel}>Cards Played</Text>
            <Text style={styles.statValue}>{totalCards}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{time}</Text>
          </View>
        </View>

        {perfect && (
          <View style={[styles.xpSection, { borderColor: theme.colors.primary }]}>
            <Text style={[styles.xpTotal, { color: '#60a5fa' }]}>⚡ PERFECT GAME BONUS +500 PTS</Text>
          </View>
        )}

        <View style={styles.xpSection}>
          <Text style={styles.xpTotal}>TOTAL POINTS TILL DATE: {currentTotal + points}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryBtnText}>PLAY AGAIN</Text>
          </TouchableOpacity>
          <View style={styles.secondaryBtnRow}>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.secondaryBtnText}>HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export const LoseScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const params       = route.params || {};
  const points       = params.points || 0;
  const totalCards   = params.totalCards || 42;
  const time         = params.time || '05:00';
  const currentTotal = profile?.score || 0;
  const avatarPreset = profile?.avatar_preset ?? 1;
  const avatarSrc    = AVATARS[avatarPreset] ?? AVATARS[1];
  const forfeit      = params.forfeit;
  const oppName      = params.opponentName;
  const isMP         = params.isMultiplayer;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <MatchResultsHeader navigation={navigation} title="Match Lost" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LottieView source={require('../animations/crying.json')} autoPlay loop style={{ width: '100%', height: '50%', opacity: 0.8, top: '10%' }} />
        </View>

        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrapper, { borderColor: theme.colors.status.error }]}>
            <Image source={avatarSrc} style={[styles.avatarImg, { opacity: 0.6 }]} />
          </View>
          <Text style={[styles.victoryText, { color: theme.colors.status.error, marginTop: 16 }]}>DEFEAT</Text>
          <Text style={styles.subtitleText}>
            {forfeit ? 'TIMED OUT' : isMP && oppName ? `VS ${oppName.toUpperCase()}` : 'BETTER LUCK NEXT TIME'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Points Earned</Text>
            <Text style={styles.statValue}>+{points}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cards Played</Text>
            <Text style={styles.statValue}>{totalCards}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Time Spent</Text>
            <Text style={styles.statValue}>{time}</Text>
          </View>
        </View>

        <View style={styles.xpSection}>
          <Text style={styles.xpTotal}>TOTAL POINTS TILL DATE: {currentTotal}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryBtnText}>TRY AGAIN</Text>
          </TouchableOpacity>
          <View style={styles.secondaryBtnRow}>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.secondaryBtnText}>HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export const DrawScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const params       = route.params || {};
  const totalCards   = params.totalCards || 42;
  const time         = params.time || '05:00';
  const currentTotal = profile?.score || 0;
  const username     = profile?.username || 'YOU';
  const avatarPreset = profile?.avatar_preset ?? 1;
  const avatarSrc    = AVATARS[avatarPreset] ?? AVATARS[1];
  const oppName      = params.opponentName;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <MatchResultsHeader navigation={navigation} title="Match Results" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <LottieView source={require('../animations/handshake.json')} autoPlay loop style={{ width: '100%', height: '50%', opacity: 0.5, top: '20%' }} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.victoryText, { color: '#FFF' }]}>DRAW</Text>
          <Text style={styles.subtitleText}>NO WINNER THIS TIME</Text>
        </View>

        <View style={styles.drawAvatars}>
          <View style={styles.avatarWrapperSmall}>
            <Image source={avatarSrc} style={styles.avatarImg} />
            <View style={styles.drawBadge}>
              <Text style={styles.drawBadgeText}>{username.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.avatarWrapperSmall, { borderColor: '#334155' }]}>
            <Image source={avatarSrc} style={styles.avatarImg} />
            <View style={[styles.drawBadge, { backgroundColor: '#334155' }]}>
              <Text style={styles.drawBadgeText}>{oppName ? oppName.toUpperCase() : 'OPPONENT'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Points Earned</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cards Played</Text>
            <Text style={styles.statValue}>{totalCards}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{time}</Text>
          </View>
        </View>

        <View style={styles.xpSection}>
          <Text style={styles.xpTotal}>TOTAL POINTS TILL DATE: {currentTotal}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryBtnText}>REMATCH</Text>
          </TouchableOpacity>
          <View style={styles.secondaryBtnRow}>
            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.secondaryBtnText}>HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: theme.colors.background.dark, maxWidth: 448, alignSelf: 'center', width: '100%' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, zIndex: 10 },
  headerBtn:       { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerIconText:  { color: theme.colors.text.secondary, fontSize: 24 },
  headerTitle:     { color: '#FFF', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  scrollContent:   { padding: 16, alignItems: 'center', flexGrow: 1 },
  titleContainer:  { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  victoryText:     { fontSize: 56, fontWeight: '900', color: theme.colors.primary, letterSpacing: 4, fontStyle: 'italic' },
  glowText:        { textShadowColor: theme.colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  subtitleText:    { color: theme.colors.text.secondary, fontSize: 13, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', marginTop: 8 },
  avatarSection:   { alignItems: 'center', marginBottom: 40 },
  avatarWrapper:   { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: theme.colors.primary, backgroundColor: theme.colors.background.tertiary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  avatarImg:       { width: '100%', height: '100%', borderRadius: 70 },
  crownBadge:      { position: 'absolute', top: -24 },
  usernameText:    { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  statsGrid:       { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
  statCard:        { flex: 1, backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 14, alignItems: 'center' },
  statLabel:       { color: theme.colors.text.secondary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  statValue:       { color: '#FFF', fontSize: 22, fontWeight: '900' },
  xpSection:       { width: '100%', padding: 14, backgroundColor: 'rgba(30,41,59,0.3)', borderWidth: 1, borderColor: '#334155', borderRadius: 12, borderStyle: 'dashed', alignItems: 'center', marginBottom: 24 },
  xpTotal:         { color: theme.colors.text.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },
  actionsContainer:{ width: '100%', gap: 12 },
  primaryBtn:      { width: '100%', backgroundColor: theme.colors.primary, paddingVertical: 20, borderRadius: 12, alignItems: 'center' },
  primaryBtnText:  { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  secondaryBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  secondaryBtn:    { flex: 1, backgroundColor: '#1E293B', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText:{ color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  drawAvatars:     { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  avatarWrapperSmall: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: theme.colors.primary, backgroundColor: theme.colors.background.tertiary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  drawBadge:       { position: 'absolute', bottom: -12, backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  drawBadgeText:   { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  vsText:          { color: theme.colors.text.secondary, fontSize: 18, fontWeight: 'bold', fontStyle: 'italic' },
});
