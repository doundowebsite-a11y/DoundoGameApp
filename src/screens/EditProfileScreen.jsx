/**
 * EditProfileScreen.jsx — src/screens/EditProfileScreen.jsx
 * Logic-only component for the Edit Profile Screen.
 */
import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import EditProfileLayout from './layouts/EditProfileLayout';

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

  const handleSave = async () => {
    if (!gamerTag.trim() || gamerTag.trim().length < 3) {
      setErrorMsg('Gamer Tag must be at least 3 characters.'); return;
    }
    if (!user) return;
    setSaving(true); setErrorMsg('');

    const { error } = await supabase.from('profiles').update({ username: gamerTag.trim(), bio: bio.trim(), avatar_preset: selectedPreset }).eq('id', user.id);

    if (error) {
      setErrorMsg(error.code === '23505' ? 'Username already taken!' : error.message);
      setSaving(false);
    } else {
      await refreshProfile();
      navigation.goBack();
    }
  };

  return (
    <EditProfileLayout
      {...{
        navigation, insets, containerW,
        email: user?.email,
        gamerTag, bio, selectedPreset, showAvatarPicker, saving, errorMsg,
        onGamerTagChange: (t) => { setGamerTag(t); setErrorMsg(''); },
        onBioChange: setBio,
        onSelectPreset: setSelectedPreset,
        onShowPicker: () => setShowAvatarPicker(true),
        onHidePicker: () => setShowAvatarPicker(false),
        onSave: handleSave,
        onCancel: () => navigation.goBack()
      }}
    />
  );
};

export default EditProfileScreen;
