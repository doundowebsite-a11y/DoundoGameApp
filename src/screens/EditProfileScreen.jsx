import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, TextInput, Platform, KeyboardAvoidingView, Modal, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { IconArrowBack, IconMail, IconGamepad } from '../assets/icons/icons';
import Button from '../components/ui/Button';
import { useDimensions, getBoardMetrics } from '../utils/responsive';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// All preset avatars — add new entries here and they appear in the picker automatically
const PRESETS = [
  { id: 1, source: require('../assets/avatars/preset_1.jpg') },
  { id: 2, source: require('../assets/avatars/preset_2.jpg') },
  { id: 3, source: require('../assets/avatars/preset_3.jpg') },
  { id: 4, source: require('../assets/avatars/preset_4.jpg') },
  { id: 5, source: require('../assets/avatars/avatar_main.jpg') },
];

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const { user, profile, refreshProfile } = useAuth();

  const [gamerTag, setGamerTag] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [selectedPreset, setSelectedPreset] = useState(profile?.avatar_preset || 1);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentAvatar = PRESETS.find(p => p.id === selectedPreset)?.source
    || PRESETS[0].source;

  const handleSave = async () => {
    if (!gamerTag.trim() || gamerTag.trim().length < 3) {
      setErrorMsg('Gamer Tag must be at least 3 characters.');
      return;
    }
    if (!user) return;
    setSaving(true);
    setErrorMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({
        username: gamerTag.trim(),
        bio: bio.trim(),
        avatar_preset: selectedPreset,
      })
      .eq('id', user.id);

    if (error) {
      if (error.code === '23505') setErrorMsg('Username already taken!');
      else setErrorMsg(error.message);
      setSaving(false);
    } else {
      await refreshProfile();
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, maxWidth: containerW }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IconArrowBack size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Avatar Section — tap to open preset picker modal */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarRing}
              onPress={() => setShowAvatarPicker(true)}
              activeOpacity={0.8}
            >
              <Image source={currentAvatar} style={styles.avatarImage} />
              {/* Camera icon overlay */}
              <View style={styles.cameraOverlay}>
                <Text style={{ fontSize: 24 }}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.tapHint}>Tap to change avatar</Text>
          </View>

          {/* Error */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gamer Tag</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={gamerTag}
                  onChangeText={(t) => { setGamerTag(t); setErrorMsg(''); }}
                  placeholderTextColor={colors.text.placeholder}
                  selectionColor={colors.primary}
                  autoCapitalize="none"
                  maxLength={20}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={styles.textArea}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.placeholder}
                selectionColor={colors.primary}
                placeholder="Tell others about yourself..."
              />
            </View>

            <View style={styles.buttonsGroup}>
              <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saving} />
              <Button title="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Avatar Picker Modal (overlay popup) ── */}
      <Modal
        visible={showAvatarPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <Text style={{ color: colors.text.muted, fontSize: 22 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={PRESETS}
              keyExtractor={item => String(item.id)}
              numColumns={3}
              contentContainerStyle={styles.modalGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalCard,
                    selectedPreset === item.id && styles.modalCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedPreset(item.id);
                    setShowAvatarPicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={item.source} style={styles.modalCardImage} />
                  {selectedPreset === item.id && (
                    <View style={styles.modalCardCheck}>
                      <Text style={{ color: '#FFF', fontSize: 14 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text.primary, fontSize: 18, fontWeight: typography.weights.bold },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  avatarRing: {
    position: 'relative',
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: colors.primary,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  tapHint: { color: colors.text.muted, fontSize: 12 },
  errorText: { color: '#f87171', textAlign: 'center', marginBottom: 8, paddingHorizontal: spacing.lg },
  form: { paddingHorizontal: spacing.lg, gap: spacing.lg, maxWidth: 448, width: '100%', alignSelf: 'center' },
  fieldGroup: { gap: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: typography.weights.medium, color: colors.text.secondary, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: 12, overflow: 'hidden', paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1, color: colors.text.primary, fontSize: 15,
    paddingVertical: 14, fontWeight: typography.weights.regular,
  },
  textArea: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1, borderColor: colors.border.subtle,
    borderRadius: 12, color: colors.text.primary,
    fontSize: 15, padding: spacing.md, minHeight: 90,
  },
  buttonsGroup: { gap: 12, paddingTop: spacing.lg },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: { color: colors.text.primary, fontSize: 18, fontWeight: '700' },
  modalGrid: { padding: 16, gap: 10 },
  modalCard: {
    flex: 1, margin: 5, aspectRatio: 1,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border.subtle,
    position: 'relative',
  },
  modalCardSelected: {
    borderWidth: 3, borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  modalCardImage: { width: '100%', height: '100%' },
  modalCardCheck: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: colors.primary,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
});

export default EditProfileScreen;
