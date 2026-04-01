import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import LottieView from 'lottie-react-native';
import { theme } from '../../theme/theme';
import Confetti from '../../components/ui/Confetti';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const AVATARS = {
  1: require('../../assets/avatars/preset_1.jpg'),
  2: require('../../assets/avatars/preset_2.jpg'),
  3: require('../../assets/avatars/preset_3.jpg'),
  4: require('../../assets/avatars/preset_4.jpg'),
  5: require('../../assets/avatars/avatar_main.jpg'),
  6: require('../../assets/avatars/preset_2.jpg'),
};

const ResultLayout = (props) => {
  const { type, navigation, insets, title, victoryText, subtitleText, username, avatarPreset, points, totalCards, time, currentTotal, perfect, forfeit, oppName, isMP, isRoundOnly, onNext, onShare, onHome } = props;
  const avatarSrc = AVATARS[avatarPreset] ?? AVATARS[1];
  const isWin  = type === 'win';
  const isLose = type === 'lose';
  const isDraw = type === 'draw';
  const AVATAR_SIZE = scale(120);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onHome} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.headerIconText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: scale(48) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {isWin  && <LottieView source={require('../../animations/fireworks.json')} autoPlay loop style={{ width: '100%', height: '100%', opacity: 0.6 }} />}
          {isLose && <LottieView source={require('../../animations/crying.json')}    autoPlay loop style={{ width: '100%', height: '50%', opacity: 0.8, top: '10%' }} />}
          {isDraw && <LottieView source={require('../../animations/handshake.json')} autoPlay loop style={{ width: '100%', height: '50%', opacity: 0.8, top: '10%' }} />}
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.victoryText, isWin && styles.glowText, isLose && { color: theme.colors.status.error }, isDraw && { color: '#FFF' }]}>
            {victoryText}
          </Text>
          <Text style={styles.subtitleText}>{subtitleText}</Text>
        </View>

        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrapper, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }, isLose && { borderColor: theme.colors.status.error }, isDraw && { borderColor: '#475569' }]}>
            <Image source={avatarSrc} style={[styles.avatarImg, { borderRadius: AVATAR_SIZE / 2 }, isLose && { opacity: 0.6 }]} />
            {isWin && <View style={styles.crownBadge}><Text style={{ fontSize: scaleFont(24) }}>👑</Text></View>}
          </View>
          <Text style={styles.usernameText}>{username}</Text>
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: 'Points Earned', value: `+${points}`, highlight: false },
            { label: 'Cards Played', value: totalCards, highlight: isWin },
            { label: isLose ? 'Time Spent' : 'Time', value: time, highlight: false },
          ].map(({ label, value, highlight }) => (
            <View key={label} style={[styles.statCard, highlight && { borderColor: theme.colors.primary, backgroundColor: 'rgba(37,106,244,0.1)' }]}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
            </View>
          ))}
        </View>

        {isWin && perfect && (
          <View style={[styles.xpSection, { borderColor: theme.colors.primary }]}>
            <Text style={[styles.xpTotal, { color: '#60a5fa' }]}>⚡ PERFECT GAME BONUS +500 PTS</Text>
          </View>
        )}
        <View style={styles.xpSection}>
          <Text style={styles.xpTotal}>TOTAL POINTS TILL DATE: {currentTotal}</Text>
        </View>

        <View style={styles.actionsContainer}>
          {/* REMOVED REMATCH AS PER USER REQUEST */}
          <TouchableOpacity
            style={isMP && !isRoundOnly ? [styles.primaryBtn, { backgroundColor: '#1E293B', paddingVertical: verticalScale(14) }] : styles.primaryBtn}
            onPress={onNext}
          >
            <Text style={isMP && !isRoundOnly ? [styles.primaryBtnText, { fontSize: scaleFont(13) }] : styles.primaryBtnText}>
              {isRoundOnly ? 'NEXT ROUND' : isWin ? 'PLAY AGAIN' : 'TRY AGAIN'}
            </Text>
          </TouchableOpacity>
          <View style={styles.secondaryBtnRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onShare}>
              <Text style={styles.secondaryBtnText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onHome}>
              <Text style={styles.secondaryBtnText}>HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {isWin && <Confetti />}
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: theme.colors.background.dark, width: '100%' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: scale(16), zIndex: 10 },
  headerBtn:       { width: scale(48), height: scale(48), alignItems: 'center', justifyContent: 'center' },
  headerIconText:  { color: theme.colors.text.secondary, fontSize: scaleFont(22) },
  headerTitle:     { color: '#FFF', fontSize: scaleFont(17), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  scrollContent:   { padding: scale(16), alignItems: 'center', flexGrow: 1 },
  titleContainer:  { alignItems: 'center', marginBottom: verticalScale(24), marginTop: verticalScale(12) },
  victoryText:     { fontSize: scaleFont(50), fontWeight: '900', color: theme.colors.primary, letterSpacing: 4, fontStyle: 'italic', textAlign: 'center' },
  glowText:        { textShadowColor: theme.colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  subtitleText:    { color: theme.colors.text.secondary, fontSize: scaleFont(12), fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', marginTop: scale(8), textAlign: 'center' },
  avatarSection:   { alignItems: 'center', marginBottom: verticalScale(32) },
  avatarWrapper:   { borderWidth: 4, borderColor: theme.colors.primary, backgroundColor: theme.colors.background.dark, justifyContent: 'center', alignItems: 'center', marginBottom: scale(14), overflow: 'hidden' },
  avatarImg:       { width: '100%', height: '100%' },
  crownBadge:      { position: 'absolute', top: -scale(22), zIndex: 10 },
  usernameText:    { color: '#FFF', fontSize: scaleFont(22), fontWeight: 'bold' },
  statsGrid:       { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: scale(8), marginBottom: verticalScale(20) },
  statCard:        { flex: 1, backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: '#334155', borderRadius: scale(12), padding: scale(12), alignItems: 'center' },
  statLabel:       { color: theme.colors.text.secondary, fontSize: scaleFont(9), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: scale(5) },
  statValue:       { color: '#FFF', fontSize: scaleFont(20), fontWeight: '900' },
  xpSection:       { width: '100%', padding: scale(14), backgroundColor: 'rgba(30,41,59,0.3)', borderWidth: 1, borderColor: '#334155', borderRadius: scale(12), borderStyle: 'dashed', alignItems: 'center', marginBottom: verticalScale(20) },
  xpTotal:         { color: theme.colors.text.primary, fontSize: scaleFont(11), fontWeight: 'bold', letterSpacing: 2 },
  actionsContainer:{ width: '100%', gap: scale(12) },
  primaryBtn:      { width: '100%', backgroundColor: theme.colors.primary, paddingVertical: verticalScale(18), borderRadius: scale(12), alignItems: 'center' },
  primaryBtnText:  { color: '#FFF', fontSize: scaleFont(15), fontWeight: '900', letterSpacing: 2 },
  secondaryBtnRow: { flexDirection: 'row', gap: scale(12), width: '100%' },
  secondaryBtn:    { flex: 1, backgroundColor: '#1E293B', paddingVertical: verticalScale(14), borderRadius: scale(12), alignItems: 'center' },
  secondaryBtnText:{ color: '#FFF', fontSize: scaleFont(13), fontWeight: 'bold', letterSpacing: 2 },
});

export default ResultLayout;