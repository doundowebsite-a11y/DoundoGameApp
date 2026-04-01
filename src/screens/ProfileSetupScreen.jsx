/**
 * ProfileSetupScreen.jsx — src/screens/ProfileSetupScreen.jsx
 * Logic-only component for the Profile Setup Screen.
 */
import React, { useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import ProfileSetupLayout from './layouts/ProfileSetupLayout';

const SUFFIXES = ['_Pro', '_X', '_99', '_GG', '_ACE', '_One', '_Neo'];

const ProfileSetupScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [selectedPreset, setSelectedPreset] = useState(1);
  const [gamerTag, setGamerTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Memoize suggestions and preset selection to keep props stable
  const onSelectPreset = useCallback((id) => setSelectedPreset(id), []);

  const checkUsername = useCallback(async (tag) => {
    if (!tag || tag.trim().length < 3) { setSuggestions([]); return; }
    setChecking(true);
    const { data } = await supabase.from('profiles').select('id').eq('username', tag.trim()).neq('id', user?.id ?? '').maybeSingle();
    if (data) {
      const base = tag.trim().replace(/[^a-zA-Z0-9]/g, '');
      setSuggestions(SUFFIXES.slice(0, 3).map(s => base + s));
      setErrorMsg('Username already taken. Try one of these:');
    } else {
      setSuggestions([]); setErrorMsg('');
    }
    setChecking(false);
  }, [user]);

  const timerRef = useRef(null);

  const handleTagChange = useCallback((text) => {
    setGamerTag(text); 
    setErrorMsg(''); 
    setSuggestions([]);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.trim().length >= 3) {
      timerRef.current = setTimeout(() => checkUsername(text), 600);
    }
  }, [checkUsername]);

  const handleSetup = useCallback(async () => {
    const tag = gamerTag.trim();
    if (!tag || tag.length < 3) { setErrorMsg('Gamer Tag must be at least 3 characters.'); return; }
    if (!user) return;
    setLoading(true); setErrorMsg('');
    const { error } = await supabase.from('profiles').upsert({ id: user.id, username: tag, avatar_preset: selectedPreset, terms_accepted: true });
    if (error) {
      setErrorMsg(error.code === '23505' ? 'Username already taken!' : error.message);
      setLoading(false);
    } else await refreshProfile();
  }, [gamerTag, user, selectedPreset, refreshProfile]);

  const onSelectSuggestion = useCallback((s) => { setGamerTag(s); setErrorMsg(''); setSuggestions([]); }, []);

  return (
    <ProfileSetupLayout
      insets={insets}
      selectedPreset={selectedPreset}
      gamerTag={gamerTag}
      loading={loading}
      checking={checking}
      errorMsg={errorMsg}
      suggestions={suggestions}
      onTagChange={handleTagChange}
      onSelectPreset={onSelectPreset}
      onSetup={handleSetup}
      onSelectSuggestion={onSelectSuggestion}
    />
  );
};

export default ProfileSetupScreen;
