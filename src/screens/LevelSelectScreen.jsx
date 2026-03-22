import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import { IconArrowBack, IconFlash, IconHome, IconPerson } from '../assets/icons/icons';
import Button from '../components/ui/Button';
import BottomNav from '../components/ui/BottomNav';
import { useDimensions, getBoardMetrics } from '../utils/responsive';

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', icon: '⚡', active: true },
  { id: 'medium', label: 'Medium', icon: '📊', active: false },
  { id: 'hard', label: 'Hard', icon: '💀', active: false },
  { id: 'ai', label: 'AI', icon: '🤖', active: false },
];

const LevelSelectScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);

  const [selected, setSelected] = useState('easy');
  const [playThree, setPlayThree] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, maxWidth: containerW }]}>

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
            {DIFFICULTIES.map((diff) => (
              <TouchableOpacity
                key={diff.id}
                style={[
                  styles.difficultyButton,
                  selected === diff.id && styles.difficultyButtonActive,
                ]}
                onPress={() => setSelected(diff.id)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.difficultyLabel,
                  selected === diff.id && styles.difficultyLabelActive,
                ]}>
                  {diff.label}
                </Text>
                <Text style={[
                  styles.difficultyIcon,
                  selected !== diff.id && { opacity: 0.3 },
                ]}>
                  {diff.icon}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3 Matches Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPlayThree(!playThree)}
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
            onPress={() => navigation.navigate('GameScreen', { difficulty: selected, matches: playThree ? 3 : 1 })}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mainContent: {
    width: '100%',
    maxWidth: 448,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  difficultyList: {
    gap: spacing.md,
    marginBottom: 40,
  },
  difficultyButton: {
    width: '100%',
    height: 64,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    backgroundColor: colors.overlay.slateMedium,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: 'transparent',
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  difficultyLabel: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.slate[200],
  },
  difficultyLabelActive: {
    color: '#FFFFFF',
  },
  difficultyIcon: {
    fontSize: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background.inputAlt,
    borderWidth: 1,
    borderColor: colors.border.primaryFaded,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.slate[600],
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: colors.slate[300],
    fontWeight: '500',
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.dark,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      }
    }),
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
    letterSpacing: 1,
  },
  navDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  bgGlow1: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: 9999,
    backgroundColor: colors.overlay.primaryLight,
    ...Platform.select({
      web: { filter: 'blur(120px)' },
    }),
    zIndex: -1,
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: 9999,
    backgroundColor: 'rgba(30, 58, 138, 0.1)',
    ...Platform.select({
      web: { filter: 'blur(120px)' },
    }),
    zIndex: -1,
    pointerEvents: 'none',
  },
});

export default LevelSelectScreen;
