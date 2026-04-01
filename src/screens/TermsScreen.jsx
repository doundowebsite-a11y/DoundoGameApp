/**
 * TermsScreen.jsx — src/screens/TermsScreen.jsx
 * Logic-only component for the Terms Screen.
 */
import React, { useState } from 'react';
import { BackHandler, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import TermsLayout from './layouts/TermsLayout';

const TermsScreen = ({ onSessionAccepted }) => {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDecline = () => {
    Alert.alert(
      'Are you sure?',
      'You must accept the Terms and Conditions to use Doundo.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Exit App', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]
    );
  };

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({ id: user.id, terms_accepted: true }).select().single();
    if (!error) {
      onSessionAccepted?.();
      await refreshProfile();
    }
    setLoading(false);
  };

  return (
    <TermsLayout
      {...{ insets, loading, onAccept: handleAccept, onDecline: handleDecline }}
    />
  );
};

export default TermsScreen;
