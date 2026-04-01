/**
 * LevelSelectLayout.jsx — src/screens/layouts/LevelSelectLayout.jsx
 * Pure UI component for the Level Selection Screen.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { DoundoLogo } from '../../assets/logo/doundo_logo';
import { IconArrowBack } from '../../assets/icons/icons';
import Button from '../../components/ui/Button';
import BottomNav from '../../components/ui/BottomNav';

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy',   icon: '⚡' },
  { id: 'medium', label: 'Medium', icon: '📊' },
  { id: 'hard',   label: 'Hard',   icon: '💀' },
  { id: 'ai',     label: 'AI',     icon: '🤖' },
];

const DIFF_CONFIG = {
  easy:   { bg: '#0f3d2e', dimBg: 'rgba(15,61,46,0.35)',  border: '#22c55e', glow: 'rgba(34,197,94,0.15)',   desc: 'Perfect for beginners' },
  medium: { bg: '#1e3a5f', dimBg: 'rgba(30,58,95,0.35)',  border: '#60a5fa', glow: 'rgba(96,165,250,0.15)',  desc: 'Balanced challenge' },
  hard:   { bg: '#4a1020', dimBg: 'rgba(74,16,32,0.35)',  border: '#f87171', glow: 'rgba(248,113,113,0.15)', desc: 'For experienced players' },
  ai:     { bg: '#2d1b69', dimBg: 'rgba(45,27,105,0.35)', border: '#a78bfa', glow: 'rgba(167,139,250,0.15)', desc: 'Maximum difficulty' },
};

const LevelSelectLayout = (props) => {
  const {
    navigation, insets, containerW, selected, playThree,
    onSelect, onToggleThree, onStartGame
  } = props;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IconArrowBack size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerLogoContainer}>
          <DoundoLogo width={90} height={24} />
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('SettingsScreen')}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.mainContent}>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Select Difficulty</Text>
            <Text style={styles.subtitle}>CHOOSE YOUR CHALLENGE</Text>
          </View>

          {/* Difficulty Options */}
          <View style={styles.difficultyList}>
            {DIFFICULTIES.map((diff) => {
              const isActive = selected === diff.id;
              const cfg = DIFF_CONFIG[diff.id] ?? DIFF_CONFIG.easy;
              return (
                <TouchableOpacity
                  key={diff.id}
                  style={[styles.diffCard, { backgroundColor: isActive ? cfg.bg : cfg.dimBg, borderColor: isActive ? cfg.border : 'rgba(255,255,255,0.06)' }]}
                  onPress={() => onSelect(diff.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.diffGlow, { backgroundColor: cfg.glow }]} />
                  <Text style={styles.diffIcon}>{diff.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.diffLabel, { color: isActive ? '#FFF' : 'rgba(255,255,255,0.45)' }]}>{diff.label}</Text>
                    <Text style={[styles.diffDesc, { color: isActive ? cfg.border : 'rgba(255,255,255,0.25)' }]}>{cfg.desc}</Text>
                  </View>
                  {isActive && <View style={[styles.diffCheck, { backgroundColor: cfg.border }]}><Text style={{ color:'#FFF', fontSize:12, fontWeight:'900' }}>✓</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3 Matches Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={onToggleThree}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, playThree && styles.checkboxChecked]}>
              {playThree && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Select to play 3 matches</Text>
          </TouchableOpacity>

          {/* Start Game Button */}
          <Button
            title="START GAME"
            onPress={onStartGame}
            style={{ marginTop: 32 }}
          />

        </View>
      </ScrollView>

      <BottomNav navigation={navigation} activeRoute="Game" />

      {/* Background Glow Effects */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.dark, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.overlay.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerLogoContainer: { flex: 1, alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-start' },
  mainContent: { width: '100%', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  titleSection: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 30, fontWeight: typography.weights.bold, color: colors.text.primary, letterSpacing: -1, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.sizes.sm, color: colors.text.secondary, letterSpacing: 3, textTransform: 'uppercase' },
  difficultyList: { gap: 10, marginBottom: 32 },
  diffCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width:0, height:4 }, elevation: 6 },
  diffGlow: { position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: 45 },
  diffIcon: { fontSize: 28, width: 36, textAlign: 'center' },
  diffLabel: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  diffDesc: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  diffCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: 12, backgroundColor: colors.background.inputAlt, borderWidth: 1, borderColor: colors.border.primaryFaded, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: colors.slate[600], backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  checkboxLabel: { color: colors.slate[300], fontWeight: '500', fontSize: 14 },
  bgGlow1: { position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', borderRadius: 9999, backgroundColor: colors.overlay.primaryLight, ...Platform.select({ web: { filter: 'blur(120px)' } }), zIndex: -1, pointerEvents: 'none' },
  bgGlow2: { position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', borderRadius: 9999, backgroundColor: 'rgba(30, 58, 138, 0.1)', ...Platform.select({ web: { filter: 'blur(120px)' } }), zIndex: -1, pointerEvents: 'none' },
});

export default LevelSelectLayout;
