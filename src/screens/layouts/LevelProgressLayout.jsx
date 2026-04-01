import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { IconArrowBack } from '../../assets/icons/icons';
import BottomNav from '../../components/ui/BottomNav';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const LEVEL_TIERS = [
  { from: 1,  to: 2,  title: 'Novice',      icon: '🌱', color: '#94A3B8' },
  { from: 3,  to: 5,  title: 'Explorer',    icon: '🧭', color: '#60A5FA' },
  { from: 6,  to: 9,  title: 'Strategist',  icon: '🧠', color: '#818CF8' },
  { from: 10, to: 14, title: 'Warrior',     icon: '⚔️', color: '#F87171' },
  { from: 15, to: 19, title: 'Champion',    icon: '🏆', color: '#FBBF24' },
  { from: 20, to: 29, title: 'Master',      icon: '🎯', color: '#34D399' },
  { from: 30, to: 49, title: 'Grandmaster', icon: '💎', color: '#A78BFA' },
  { from: 50, to: 999, title: 'Legend',     icon: '👑', color: '#F472B6' },
];

const LevelProgressLayout = ({ navigation, insets, containerW, currentLevel, xpInLevel, xpNeeded, xpPct, currentTitle }) => (
  <View style={[styles.container, { paddingTop: insets.top }]}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <IconArrowBack size={scale(24)} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>PROGRESSION</Text>
      <View style={{ width: scale(40) }} />
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.levelHex}>
            <Text style={styles.levelNum}>{currentLevel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentTitle}>{currentTitle}</Text>
            <Text style={styles.xpDetail}>{xpInLevel} / {xpNeeded} XP to next level</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${xpPct}%` }]} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>LEVEL TIERS</Text>
      <View style={styles.tiersList}>
        {LEVEL_TIERS.map((tier, idx) => {
          const isUnlocked = currentLevel >= tier.from;
          const isCurrent  = currentLevel >= tier.from && currentLevel <= tier.to;
          return (
            <View key={idx} style={[styles.tierRow, isCurrent && styles.tierRowCurrent, !isUnlocked && styles.tierRowLocked]}>
              <View style={[styles.tierIconBg, { backgroundColor: isUnlocked ? tier.color + '20' : 'rgba(255,255,255,0.05)' }]}>
                <Text style={styles.tierEmoji}>{isUnlocked ? tier.icon : '🔒'}</Text>
              </View>
              <View style={styles.tierInfo}>
                <Text style={[styles.tierTitle, isUnlocked ? { color: tier.color } : { color: colors.text.muted }]}>
                  {tier.title.toUpperCase()}
                </Text>
                <Text style={styles.tierRange}>LEVEL {tier.from}{tier.to === 999 ? '+' : ` - ${tier.to}`}</Text>
              </View>
              {isCurrent  && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>CURRENT</Text></View>}
              {isUnlocked && !isCurrent && <Text style={styles.checkMark}>✓</Text>}
            </View>
          );
        })}
      </View>
    </ScrollView>
    <BottomNav navigation={navigation} activeRoute="Profile" />
  </View>
);

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background.dark, alignSelf: 'center', width: '100%' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: verticalScale(14) },
  backBtn:          { width: scale(40), height: scale(40), alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { color: colors.text.primary, fontSize: scaleFont(16), fontWeight: '700', letterSpacing: 2 },
  scrollContent:    { paddingHorizontal: scale(20), paddingBottom: verticalScale(24) },
  statusCard:       { backgroundColor: colors.slate[900], borderRadius: scale(20), padding: scale(20), borderWidth: 1, borderColor: colors.border.subtle, marginBottom: verticalScale(20), marginTop: verticalScale(8) },
  statusHeader:     { flexDirection: 'row', alignItems: 'center', gap: scale(16), marginBottom: verticalScale(16) },
  levelHex:         { width: scale(52), height: scale(52), borderRadius: scale(11), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  levelNum:         { color: '#FFF', fontSize: scaleFont(22), fontWeight: '900', transform: [{ rotate: '-45deg' }] },
  currentTitle:     { color: '#FFF', fontSize: scaleFont(18), fontWeight: '800', letterSpacing: 1 },
  xpDetail:         { color: colors.text.muted, fontSize: scaleFont(12), marginTop: scale(2) },
  progressBarBg:    { height: verticalScale(8), backgroundColor: colors.slate[800], borderRadius: scale(4), overflow: 'hidden' },
  progressBarFill:  { height: '100%', backgroundColor: colors.primary, borderRadius: scale(4) },
  sectionTitle:     { color: colors.text.muted, fontSize: scaleFont(11), fontWeight: '800', letterSpacing: 1.5, marginBottom: scale(10), marginLeft: scale(4) },
  tiersList:        { gap: scale(10) },
  tierRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: scale(16), padding: scale(12), borderWidth: 1, borderColor: 'transparent' },
  tierRowCurrent:   { backgroundColor: 'rgba(37,99,235,0.08)', borderColor: 'rgba(37,99,235,0.3)' },
  tierRowLocked:    { opacity: 0.5 },
  tierIconBg:       { width: scale(44), height: scale(44), borderRadius: scale(22), alignItems: 'center', justifyContent: 'center', marginRight: scale(14) },
  tierEmoji:        { fontSize: scaleFont(22) },
  tierInfo:         { flex: 1 },
  tierTitle:        { fontSize: scaleFont(14), fontWeight: '800', letterSpacing: 0.5 },
  tierRange:        { color: colors.text.muted, fontSize: scaleFont(11), marginTop: scale(2) },
  currentBadge:     { backgroundColor: colors.primary, paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(6) },
  currentBadgeText: { color: '#FFF', fontSize: scaleFont(9), fontWeight: '900' },
  checkMark:        { color: '#4ADE80', fontSize: scaleFont(18), fontWeight: '900', marginRight: scale(4) },
});

export default LevelProgressLayout;