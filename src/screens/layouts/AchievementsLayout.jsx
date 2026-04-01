import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { IconArrowBack } from '../../assets/icons/icons';
import BottomNav from '../../components/ui/BottomNav';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const AchievementsLayout = ({ navigation, insets, containerW, achievements, unlockedCount }) => (
  <View style={[styles.container, { paddingTop: insets.top }]}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <IconArrowBack size={scale(24)} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>ACHIEVEMENTS</Text>
      <View style={{ width: scale(24) }} />
    </View>

    <View style={styles.summaryRow}>
      {[
        { count: unlockedCount, label: 'UNLOCKED', style: {} },
        { count: achievements.length - unlockedCount, label: 'LOCKED', style: { color: colors.text.muted } },
        { count: achievements.length, label: 'TOTAL', style: { color: colors.primary }, badgeStyle: { backgroundColor: colors.overlay.primaryLight, borderColor: colors.border.primaryFaded } },
      ].map(({ count, label, style, badgeStyle }) => (
        <View key={label} style={[styles.summaryBadge, badgeStyle]}>
          <Text style={[styles.summaryCount, style]}>{count}</Text>
          <Text style={[styles.summaryLabel, style ? { color: style.color } : {}]}>{label}</Text>
        </View>
      ))}
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {achievements.map((ach) => (
        <View key={ach.id} style={[styles.achievementRow, !ach.unlocked && styles.achievementRowLocked]}>
          <View style={[styles.iconBg, { backgroundColor: ach.unlocked ? ach.color : 'rgba(100,116,139,0.15)' }]}>
            <Text style={styles.iconEmoji}>{ach.unlocked ? ach.icon : '🔒'}</Text>
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, !ach.unlocked && { color: colors.text.muted }]}>{ach.title}</Text>
            <Text style={styles.achievementDesc}>{ach.desc}</Text>
          </View>
          {ach.unlocked && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
    <BottomNav navigation={navigation} activeRoute="Profile" />
  </View>
);

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: colors.background.dark, alignSelf: 'center', width: '100%' },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: verticalScale(14) },
  headerTitle:          { color: colors.text.primary, fontSize: scaleFont(17), fontWeight: '700', letterSpacing: 2 },
  summaryRow:           { flexDirection: 'row', gap: scale(10), paddingHorizontal: scale(20), paddingBottom: verticalScale(12) },
  summaryBadge:         { flex: 1, backgroundColor: colors.slate[900], borderWidth: 1, borderColor: colors.border.subtle, borderRadius: scale(12), padding: scale(12), alignItems: 'center', gap: scale(2) },
  summaryCount:         { color: colors.text.primary, fontSize: scaleFont(26), fontWeight: '700' },
  summaryLabel:         { color: colors.text.muted, fontSize: scaleFont(9), fontWeight: '700', letterSpacing: 1.5 },
  scrollContent:        { paddingHorizontal: scale(20), paddingBottom: verticalScale(24), gap: scale(10) },
  achievementRow:       { flexDirection: 'row', alignItems: 'center', gap: scale(14), backgroundColor: colors.slate[900], borderWidth: 1, borderColor: colors.border.subtle, borderRadius: scale(14), padding: scale(14) },
  achievementRowLocked: { opacity: 0.55 },
  iconBg:               { width: scale(50), height: scale(50), borderRadius: scale(25), alignItems: 'center', justifyContent: 'center' },
  iconEmoji:            { fontSize: scaleFont(24) },
  achievementInfo:      { flex: 1, gap: scale(2) },
  achievementTitle:     { color: colors.text.primary, fontSize: scaleFont(14), fontWeight: '700' },
  achievementDesc:      { color: colors.text.muted, fontSize: scaleFont(12) },
  checkBadge:           { width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: 'rgba(74,222,128,0.2)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.4)', alignItems: 'center', justifyContent: 'center' },
  checkText:            { color: '#4ADE80', fontSize: scaleFont(14), fontWeight: '900' },
});

export default AchievementsLayout;