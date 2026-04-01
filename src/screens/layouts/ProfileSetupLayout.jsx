/**
 * ProfileSetupLayout.jsx — src/screens/layouts/ProfileSetupLayout.jsx
 * Pure UI component for the Profile Setup Screen.
 */
import React from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, Platform, KeyboardAvoidingView
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { DoundoLogo } from '../../assets/logo/doundo_logo';
import Button from '../../components/ui/Button';

const PRESETS = [
  { id: 1, source: require('../../assets/avatars/preset_1.jpg') },
  { id: 2, source: require('../../assets/avatars/preset_2.jpg') },
  { id: 3, source: require('../../assets/avatars/preset_3.jpg') },
  { id: 4, source: require('../../assets/avatars/preset_4.jpg') },
  { id: 5, source: require('../../assets/avatars/avatar_main.jpg') },
];

const ProfileSetupLayout = (props) => {
  const {
    insets, selectedPreset, gamerTag, loading, checking, errorMsg, suggestions,
    onTagChange, onSelectPreset, onSetup, onSelectSuggestion
  } = props;

  const currentAvatar = PRESETS.find(p => p.id === selectedPreset)?.source;

  const content = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <DoundoLogo width={90} height={24} />
      </View>

      {/* Step indicators */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, styles.stepActive]} />
        <View style={styles.stepDot} />
        <View style={styles.stepDot} />
      </View>

      <ScrollView
        style={styles.flexScroll}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar preview */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Image source={currentAvatar} style={styles.avatarImage} />
          </View>
        </View>

        <View style={styles.identityText}>
          <Text style={styles.identityTitle}>Create Your Identity</Text>
          <Text style={styles.identitySubtitle}>Choose a preset avatar and set your Gamer Tag</Text>
        </View>

        {/* Gamer Tag input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>GAMER TAG</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={gamerTag}
              onChangeText={onTagChange}
              placeholder="Enter your tag (min. 3 chars)"
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              textContentType="none"
              maxLength={20}
              underlineColorAndroid="transparent"
              blurOnSubmit={false}
            />
            {checking && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            )}
          </View>

          {/* Error + suggestions */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          <View style={styles.suggestionsContainer}>
            {suggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity 
                    key={`${s}-${i}`}
                    style={styles.suggestionChip} 
                    onPress={() => onSelectSuggestion(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
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
                onPress={() => onSelectPreset(preset.id)}
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
          onPress={onSetup}
          disabled={loading || !!errorMsg}
        />
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          {content}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.dark, width: '100%' },
  flexScroll: { flex: 1 },
  header: { padding: spacing.md, alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: spacing.md },
  stepDot: { height: 4, width: 48, borderRadius: 9999, backgroundColor: colors.slate[800] },
  stepActive: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  scrollContent: { paddingHorizontal: spacing.lg },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatarRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: colors.primary, overflow: 'hidden', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  avatarImage: { width: '100%', height: '100%' },
  identityText: { alignItems: 'center', marginBottom: spacing.xl },
  identityTitle: { color: colors.text.primary, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, marginBottom: 4 },
  identitySubtitle: { color: colors.text.secondary, fontSize: typography.sizes.sm, textAlign: 'center' },
  inputSection: { marginBottom: spacing.xl },
  inputLabel: { color: colors.text.secondary, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.input, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 16, height: 56, paddingHorizontal: spacing.md },
  inputContainerActive: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  input: { flex: 1, color: colors.text.primary, fontSize: typography.sizes.md, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  errorText: { color: '#f87171', fontSize: 12, marginTop: 6, marginLeft: 4 },
  suggestionsContainer: { minHeight: 32, marginBottom: 24, justifyContent: 'center' },
  suggestionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { backgroundColor: colors.overlay.primaryMedium, borderWidth: 1, borderColor: colors.border.primaryMedium, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  suggestionText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  presetSection: { marginBottom: spacing.xl },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetCard: { width: '18%', aspectRatio: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden', position: 'relative' },
  presetCardSelected: { borderWidth: 2, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  presetImage: { width: '100%', height: '100%' },
  selectedBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: colors.primary, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bottomCTA: { padding: spacing.lg, backgroundColor: colors.background.dark, borderTopWidth: 1, borderTopColor: colors.border.subtle, minHeight: 80 },
});

export default ProfileSetupLayout;
