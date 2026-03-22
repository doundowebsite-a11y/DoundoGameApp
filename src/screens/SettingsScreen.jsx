import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  
  // States mapped to profile settings
  const [audioEnabled, setAudioEnabled] = useState(profile?.music_enabled ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(profile?.vibration_enabled ?? true);

  const toggleAudio = async (val) => {
    setAudioEnabled(val);
    if (user) {
      await supabase.from('profiles').update({ music_enabled: val }).eq('id', user.id);
      refreshProfile();
    }
  };

  const toggleVibration = async (val) => {
    setVibrationEnabled(val);
    if (user) {
      await supabase.from('profiles').update({ vibration_enabled: val }).eq('id', user.id);
      refreshProfile();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
             <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <DoundoLogo width={70} height={20} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Audio Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <Text style={{ fontSize: 20, color: theme.colors.primary }}>🔊</Text>
             <Text style={styles.sectionTitle}>AUDIO</Text>
          </View>
          <View style={styles.settingsGroup}>
             
             {/* Audio Toggle */}
             <View style={styles.settingItem}>
               <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Audio & Effects</Text>
                  <Text style={styles.settingDesc}>In-game UI and ambient soundtrack</Text>
               </View>
               <Switch 
                 value={audioEnabled} 
                 onValueChange={toggleAudio}
                 trackColor={{ false: theme.colors.slate[700], true: theme.colors.primary }}
                 thumbColor="#FFF"
                 ios_backgroundColor={theme.colors.slate[700]}
               />
             </View>

          </View>
        </View>

        {/* Haptics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <Text style={{ fontSize: 20, color: theme.colors.primary }}>📳</Text>
             <Text style={styles.sectionTitle}>HAPTICS</Text>
          </View>
          <View style={styles.settingsGroup}>
             <View style={styles.settingItem}>
               <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Text style={styles.settingDesc}>Tactile feedback for actions</Text>
               </View>
               <Switch 
                 value={vibrationEnabled} 
                 onValueChange={toggleVibration}
                 trackColor={{ false: theme.colors.slate[700], true: theme.colors.primary }}
                 thumbColor="#FFF"
                 ios_backgroundColor={theme.colors.slate[700]}
               />
             </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
             <Text style={{ fontSize: 20, color: '#EF4444' }}>👤</Text>
             <Text style={styles.sectionTitle}>ACCOUNT</Text>
          </View>
          <View style={styles.settingsGroup}>
             <TouchableOpacity style={[styles.settingItem, styles.signOutButton]} onPress={handleSignOut}>
               <View style={styles.signOutLeft}>
                  <Text style={{ fontSize: 20, color: '#EF4444' }}>🚪</Text>
                  <View style={styles.settingTextContainer}>
                     <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Sign Out</Text>
                     <Text style={styles.settingDesc}>Log out of your Doundo account</Text>
                  </View>
               </View>
               <Text style={{ color: theme.colors.slate[400], fontSize: 20 }}>›</Text>
             </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Navigation Space */}
      <View style={styles.bottomNavSpace} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
    maxWidth: 672, // max-w-2xl equivalent
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(37,106,244,0.1)',
    backgroundColor: 'rgba(16,22,34,0.8)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37,106,244,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: {
    color: '#FFF',
    fontSize: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  brandText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.slate[400],
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  settingsGroup: {
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(37,106,244,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDesc: {
    color: theme.colors.slate[400],
    fontSize: 12,
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  signOutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bottomNavSpace: {
    height: 80, 
    borderTopWidth: 1,
    borderColor: 'rgba(37,106,244,0.1)',
    backgroundColor: theme.colors.background.dark,
  }
});

export default SettingsScreen;
