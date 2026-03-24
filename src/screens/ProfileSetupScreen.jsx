import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Image, Platform, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// All avatar presets — add more here and they appear automatically
const PRESETS = [
  { id: 1, source: require('../assets/avatars/preset_1.jpg') },
  { id: 2, source: require('../assets/avatars/preset_2.jpg') },
  { id: 3, source: require('../assets/avatars/preset_3.jpg') },
  { id: 4, source: require('../assets/avatars/preset_4.jpg') },
  { id: 5, source: require('../assets/avatars/avatar_main.jpg') },
];

// Username suggestions (appended to base when taken)
const SUFFIXES = ['_Pro', '_X', '_99', '_GG', '_ACE', '_One', '_Neo'];

const ProfileSetupScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [selectedPreset, setSelectedPreset] = useState(1);
  const [gamerTag, setGamerTag] = useState('');
  const [tagFocus, setTagFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Real-time username availability check
  const checkUsername = useCallback(async (tag) => {
    if (!tag || tag.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setChecking(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', tag.trim())
      .neq('id', user?.id ?? '')
      .maybeSingle();

    if (data) {
      // Username taken — generate suggestions
      const base = tag.trim().replace(/[^a-zA-Z0-9]/g, '');
      const sug = SUFFIXES.slice(0, 3).map(s => base + s);
      setSuggestions(sug);
      setErrorMsg('Username already taken. Try one of these:');
    } else {
      setSuggestions([]);
      setErrorMsg('');
    }
    setChecking(false);
  }, [user]);

  const handleTagChange = (text) => {
    setGamerTag(text);
    setErrorMsg('');
    setSuggestions([]);
    // Debounce the check
    if (text.trim().length >= 3) {
      clearTimeout(handleTagChange._timer);
      handleTagChange._timer = setTimeout(() => checkUsername(text), 600);
    }
  };

  const handleSetup = async () => {
    const tag = gamerTag.trim();
    if (!tag || tag.length < 3) {
      setErrorMsg('Gamer Tag must be at least 3 characters.');
      return;
    }
    if (!user) return;
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: tag,
        avatar_preset: selectedPreset,
        terms_accepted: true,
      });

    if (error) {
      if (error.code === '23505') {
        setErrorMsg('Username already taken! Please choose another.');
      } else {
        setErrorMsg(error.message);
      }
      setLoading(false);
    } else {
      await refreshProfile();
      // AppNavigator automatically advances to Home
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <DoundoLogo width={90} height={24} />
        </View>
      </View>

      {/* Step indicators */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, styles.stepActive]} />
        <View style={styles.stepDot} />
        <View style={styles.stepDot} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

        {/* Avatar preview */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Image
              source={PRESETS.find(p => p.id === selectedPreset)?.source}
              style={styles.avatarImage}
            />
          </View>
        </View>

        <View style={styles.identityText}>
          <Text style={styles.identityTitle}>Create Your Identity</Text>
          <Text style={styles.identitySubtitle}>Choose a preset avatar and set your Gamer Tag</Text>
        </View>

        {/* Gamer Tag input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>GAMER TAG</Text>
          <View style={[styles.inputContainer, tagFocus && styles.inputContainerActive]}>
            <TextInput
              style={styles.input}
              value={gamerTag}
              onChangeText={handleTagChange}
              placeholder="Enter your tag (min. 3 chars)"
              placeholderTextColor={colors.text.placeholder}
              onFocus={() => setTagFocus(true)}
              onBlur={() => setTagFocus(false)}
              autoCapitalize="none"
              maxLength={20}
            />
            {checking && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 12 }} />}
          </View>

          {/* Error + suggestions */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsRow}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => { setGamerTag(s); setErrorMsg(''); setSuggestions([]); }}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Preset grid */}
        <View style={styles.presetSection}>
          <Text style={styles.inputLabel}>SELECT AVATAR</Text>
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
                    selectedPreset !== preset.id && { opacity: 0.6 },
                  ]}
                />
                {selectedPreset === preset.id && (
                  <View style={styles.selectedBadge}>
                    <Text style={{ color: '#FFF', fontSize: 10 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      <View style={styles.bottomCTA}>
        <Button
          title={loading ? 'SAVING...' : 'COMPLETE SETUP'}
          onPress={handleSetup}
          disabled={loading || !!errorMsg}
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
    padding: spacing.md,
    alignItems: 'center',
  },
  headerLogoContainer: { alignItems: 'center' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: spacing.md,
  },
  stepDot: {
    height: 4, width: 48,
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
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarRing: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 4, borderColor: colors.primary,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  avatarImage: { width: '100%', height: '100%' },
  identityText: { alignItems: 'center', marginBottom: spacing.xl },
  identityTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  identitySubtitle: { color: colors.text.secondary, fontSize: typography.sizes.sm, textAlign: 'center' },
  inputSection: { marginBottom: spacing.xl },
  inputLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    height: 56,
    paddingHorizontal: spacing.md,
  },
  inputContainerActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 0 },
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  errorText: { color: '#f87171', fontSize: 12, marginTop: 6, marginLeft: 4 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  suggestionChip: {
    backgroundColor: colors.overlay.primaryMedium,
    borderWidth: 1,
    borderColor: colors.border.primaryMedium,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 9999,
  },
  suggestionText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  presetSection: { marginBottom: spacing.xl },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    position: 'relative',
  },
  presetCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  presetImage: { width: '100%', height: '100%' },
  selectedBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: colors.primary,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomCTA: { padding: spacing.lg },
});

export default ProfileSetupScreen;
