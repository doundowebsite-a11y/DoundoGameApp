import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';
import { DoundoLogo } from '../../assets/logo/doundo_logo';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const SettingsLayout = ({ insets, audioEnabled, vibrationEnabled, highContrast, onToggleAudio, onToggleVibration, onToggleHighContrast, onSignOut, onBack }) => (
  <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backButtonIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <DoundoLogo width={scale(70)} height={scale(20)} />
    </View>

    <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
      {[
        { emoji: '🔊', color: theme.colors.primary,  title: 'AUDIO',         label: 'Audio & Effects',    desc: 'In-game UI and ambient soundtrack', value: audioEnabled,     toggle: onToggleAudio },
        { emoji: '📳', color: theme.colors.primary,  title: 'HAPTICS',       label: 'Vibration',          desc: 'Tactile feedback for actions',      value: vibrationEnabled, toggle: onToggleVibration },
        { emoji: '👁️', color: '#FACC15',             title: 'ACCESSIBILITY', label: 'High Contrast Mode', desc: 'Brighter colors and distinct borders', value: highContrast,    toggle: onToggleHighContrast },
      ].map(({ emoji, color, title, label, desc, value, toggle }) => (
        <View key={title} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={{ fontSize: scaleFont(20), color }}>{emoji}</Text>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>{label}</Text>
                <Text style={styles.settingDesc}>{desc}</Text>
              </View>
              <Switch value={value} onValueChange={toggle} trackColor={{ false: theme.colors.slate[700], true: theme.colors.primary }} thumbColor="#FFF" ios_backgroundColor={theme.colors.slate[700]} />
            </View>
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: scaleFont(20), color: '#EF4444' }}>👤</Text>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
        </View>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={[styles.settingItem, styles.signOutButton]} onPress={onSignOut}>
            <View style={styles.signOutLeft}>
              <Text style={{ fontSize: scaleFont(20), color: '#EF4444' }}>🚪</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Sign Out</Text>
                <Text style={styles.settingDesc}>Log out of your Doundo account</Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.slate[400], fontSize: scaleFont(20) }}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    <View style={styles.bottomNavSpace} />
  </View>
);

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: theme.colors.background.dark, maxWidth: 672, alignSelf: 'center', width: '100%' },
  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: verticalScale(20), borderBottomWidth: 1, borderColor: 'rgba(37,106,244,0.1)' },
  headerLeft:          { flexDirection: 'row', alignItems: 'center', gap: scale(14) },
  backButton:          { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: 'rgba(37,106,244,0.1)', alignItems: 'center', justifyContent: 'center' },
  backButtonIcon:      { color: '#FFF', fontSize: scaleFont(22) },
  headerTitle:         { color: '#FFF', fontSize: scaleFont(22), fontWeight: 'bold', letterSpacing: -0.5 },
  scrollContent:       { paddingHorizontal: scale(16), paddingVertical: verticalScale(24) },
  section:             { marginBottom: verticalScale(32) },
  sectionHeader:       { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: verticalScale(12) },
  sectionTitle:        { color: theme.colors.slate[400], fontSize: scaleFont(12), fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2 },
  settingsGroup:       { gap: scale(4) },
  settingItem:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: scale(16), backgroundColor: 'rgba(37,106,244,0.05)', borderRadius: scale(12), borderWidth: 1, borderColor: 'transparent' },
  settingTextContainer:{ flex: 1, paddingRight: scale(16) },
  settingLabel:        { color: '#FFF', fontSize: scaleFont(15), fontWeight: '500', marginBottom: scale(3) },
  settingDesc:         { color: theme.colors.slate[400], fontSize: scaleFont(12) },
  signOutButton:       { backgroundColor: 'rgba(239,68,68,0.05)' },
  signOutLeft:         { flexDirection: 'row', alignItems: 'center', gap: scale(14) },
  bottomNavSpace:      { height: verticalScale(72), borderTopWidth: 1, borderColor: 'rgba(37,106,244,0.1)', backgroundColor: theme.colors.background.dark },
});

export default SettingsLayout;