/**
 * SettingsScreen.jsx — src/screens/SettingsScreen.jsx
 * Logic-only component for the Settings Screen.
 */
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import SettingsLayout from './layouts/SettingsLayout';

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { highContrast, toggleHighContrast } = useSettings();
  
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

  return (
    <SettingsLayout
      {...{
        insets, audioEnabled, vibrationEnabled, highContrast,
        onToggleAudio: toggleAudio,
        onToggleVibration: toggleVibration,
        onToggleHighContrast: toggleHighContrast,
        onSignOut: signOut,
        onBack: () => navigation.goBack()
      }}
    />
  );
};

export default SettingsScreen;
