import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import { IconArrowBack, IconMail, IconAdd } from '../assets/icons/icons';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// Local avatar presets
const PRESETS = [
  { id: 1, source: require('../assets/avatars/preset_1.jpg'), alt: 'Abstract neon gaming logo' },
  { id: 2, source: require('../assets/avatars/preset_2.jpg'), alt: 'Cyberpunk character portrait' },
  { id: 3, source: require('../assets/avatars/preset_3.jpg'), alt: 'Gaming headset illustration' },
  { id: 4, source: require('../assets/avatars/preset_4.jpg'), alt: 'Futuristic helmet design' },
  { id: 5, source: require('../assets/avatars/avatar_main.jpg'), alt: 'Avatar preset 5' },
  { id: 6, source: require('../assets/avatars/preset_2.jpg'), alt: 'Avatar preset 6' },
];

const ProfileSetupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [gamerTag, setGamerTag] = useState('ShadowStriker');
  const [tagFocus, setTagFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSetup = async () => {
    if (!gamerTag.trim()) {
      setErrorMsg('Please enter a Gamer Tag');
      return;
    }
    if (!user) return;
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        username: gamerTag.trim(),
        avatar_preset: selectedPreset // assuming avatar_preset maps to column in db
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Postgres unique_violation
        setErrorMsg('Gamer Tag is already taken! Try another.');
      } else {
        setErrorMsg(error.message);
      }
      setLoading(false);
    } else {
      await refreshProfile();
      setLoading(false);
    }
  };

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
        <View style={{ width: 48 }} />
      </View>

      {/* Step Indicators */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, styles.stepActive]} />
        <View style={styles.stepDot} />
        <View style={styles.stepDot} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Image
                source={PRESETS.find(p => p.id === selectedPreset)?.source}
                style={styles.avatarImage}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.identityText}>
          <Text style={styles.identityTitle}>Your Identity</Text>
          <Text style={styles.identitySubtitle}>Upload a photo or choose a character below</Text>
          {errorMsg ? <Text style={{ color: colors.primary, marginTop: 8 }}>{errorMsg}</Text> : null}
        </View>

        {/* Gamer Tag */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>GAMER TAG</Text>
          <View style={[styles.inputContainer, tagFocus && styles.inputContainerActive]}>
            <View style={styles.inputIconLeft}>
              <IconMail size={20} color={colors.text.muted} />
            </View>
            <TextInput
              style={styles.input}
              value={gamerTag}
              onChangeText={setGamerTag}
              placeholder="Enter your tag"
              placeholderTextColor={colors.text.placeholder}
              onFocus={() => setTagFocus(true)}
              onBlur={() => setTagFocus(false)}
            />
            {gamerTag.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={() => setGamerTag('')}>
                <Text style={{ color: colors.text.muted, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Preset Characters Grid */}
        <View style={styles.presetSection}>
          <Text style={styles.inputLabel}>SELECT PRESET CHARACTER</Text>
          <View style={styles.presetGrid}>
            {PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetCard,
                  selectedPreset === preset.id && styles.presetCardSelected,
                ]}
                onPress={() => setSelectedPreset(preset.id)}
                activeOpacity={0.7}
              >
                <Image 
                  source={preset.source} 
                  style={[
                    styles.presetImage,
                    selectedPreset !== preset.id && { opacity: 0.7 },
                  ]} 
                />
              </TouchableOpacity>
            ))}
            {/* Add button */}
            <TouchableOpacity style={styles.addPresetCard}>
              <IconAdd size={24} color={colors.text.muted} />
            </TouchableOpacity>
            {/* More button */}
            <View style={styles.morePresetCard}>
              <Text style={{ color: colors.slate[400], fontSize: 20 }}>⋯</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <Button
          title={loading ? "SAVING..." : "COMPLETE SETUP"}
          onPress={handleSetup}
          disabled={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  headerLogoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 48, // offset for back button spacing
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: spacing.lg,
  },
  stepDot: {
    height: 4,
    width: 48,
    borderRadius: 9999,
    backgroundColor: colors.slate[800],
  },
  stepActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  avatarRing: {
    padding: 6,
    borderRadius: 9999,
    backgroundColor: colors.primary, // gradient approximation
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    backgroundColor: colors.slate[900],
    borderWidth: 4,
    borderColor: colors.background.dark,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 28,
    right: '30%',
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background.dark,
  },
  cameraIcon: {
    fontSize: 16,
  },
  identityText: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  identityTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  identitySubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    height: 56,
  },
  inputContainerActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  inputIconLeft: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  clearButton: {
    paddingRight: spacing.md,
  },
  presetSection: {
    flex: 1,
    marginBottom: spacing.xl,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  presetCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
  },
  presetCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.overlay.primaryMedium,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  addPresetCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePresetCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCTA: {
    padding: spacing.lg,
  },
});

export default ProfileSetupScreen;
