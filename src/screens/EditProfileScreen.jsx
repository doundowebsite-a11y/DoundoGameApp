import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import {
  IconArrowBack, IconFlash, IconHome, IconPerson,
  IconMail, IconUpload, IconCamera, IconGamepad,
} from '../assets/icons/icons';
import Button from '../components/ui/Button';
import { useDimensions, getBoardMetrics } from '../utils/responsive';

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const [gamerTag, setGamerTag] = useState('NeonPhantom_99');
  const [email, setEmail] = useState('alex.phantom@doundo.com');
  const [bio, setBio] = useState(
    'Hardcore RPG lover and speedrunner. Currently climbing the ranks in CyberArena. Let\'s squad up!'
  );

  const handleSave = () => {
    // TODO: persist changes
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, maxWidth: containerW }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Avatar Section ── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <Image
                source={require('../assets/avatars/profile_hero.jpg')}
                style={styles.avatarImage}
              />
              {/* Camera overlay */}
              <TouchableOpacity style={styles.cameraOverlay} activeOpacity={0.7}>
                <IconCamera size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Upload / Presets */}
            <View style={styles.avatarActions}>
              <TouchableOpacity style={styles.avatarActionBtn} activeOpacity={0.7}>
                <View style={styles.avatarActionCircle}>
                  <IconUpload size={22} color={colors.primary} />
                </View>
                <Text style={styles.avatarActionLabel}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarActionBtn} activeOpacity={0.7}>
                <View style={[styles.avatarActionCircle, styles.avatarActionCircleAlt]}>
                  <IconPerson size={22} color={colors.text.muted} />
                </View>
                <Text style={styles.avatarActionLabel}>Presets</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Form Fields ── */}
          <View style={styles.form}>

            {/* Gamer Tag */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gamer Tag</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <IconGamepad size={20} color={colors.text.muted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={gamerTag}
                  onChangeText={setGamerTag}
                  placeholderTextColor={colors.text.placeholder}
                  selectionColor={colors.primary}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <IconMail size={20} color={colors.text.muted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.text.placeholder}
                  selectionColor={colors.primary}
                />
              </View>
            </View>

            {/* Bio */}
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
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonsGroup}>
              <Button title="Save Changes" onPress={handleSave} />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => navigation.goBack()}
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom Navigation ── */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <IconHome size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('LevelSelect')}>
          <IconFlash size={24} color={colors.text.muted} />
          <Text style={styles.navLabel}>GAME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <IconPerson size={24} color={colors.primary} />
          <Text style={[styles.navLabel, { color: colors.primary }]}>PROFILE</Text>
          <View style={styles.navDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ══════════════════════════════ STYLES ══════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    alignSelf: 'center',
    width: '100%',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    ...Platform.select({ web: { backdropFilter: 'blur(12px)' } }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.3,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  avatarRing: {
    position: 'relative',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: 'rgba(37, 106, 244, 0.2)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 64,
    opacity: 0,
    // On web, hover will trigger; on native it's always visible on press
    ...Platform.select({
      web: {
        ':hover': { opacity: 1 },
      },
      default: { opacity: 0.6 },
    }),
  },
  avatarActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  avatarActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  avatarActionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.overlay.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActionCircleAlt: {
    backgroundColor: colors.slate[800],
  },
  avatarActionLabel: {
    fontSize: 12,
    fontWeight: typography.weights.medium,
    color: colors.text.muted,
  },

  /* Form */
  form: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputIconBox: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    paddingVertical: 14,
    paddingRight: spacing.md,
    fontWeight: typography.weights.regular,
  },
  textArea: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 12,
    color: colors.text.primary,
    fontSize: 15,
    padding: spacing.md,
    minHeight: 90,
    fontWeight: typography.weights.regular,
  },

  buttonsGroup: {
    gap: 12,
    paddingTop: spacing.lg,
  },

  /* Bottom Nav */
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.dark,
    paddingTop: spacing.md,
    ...Platform.select({ web: { backdropFilter: 'blur(16px)' } }),
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
    letterSpacing: 0.5,
  },
  navDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

export default EditProfileScreen;
