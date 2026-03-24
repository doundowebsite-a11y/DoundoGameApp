import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import { IconMail, IconArrowBack } from '../assets/icons/icons';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';

const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email,      setEmail]      = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [errorMsg,   setErrorMsg]   = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) { setErrorMsg('Please enter a valid email address.'); return; }

    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'doundo://reset-password',
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      bounces={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>

        {/* Header — back + logo */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <IconArrowBack size={24} color={colors.primary} />
          </TouchableOpacity>
          <DoundoLogo width={90} height={24} />
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.card}>

          {/* Icon + Title */}
          <View style={styles.titleSection}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🔑</Text>
            </View>
            <Text style={styles.title}>FORGOT PASSWORD?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Success state */}
          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>Reset Link Sent!</Text>
              <Text style={styles.successText}>
                Check your inbox at {email.trim().toLowerCase()} for the reset link.
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ID</Text>
                <View style={[styles.inputContainer, emailFocus && styles.inputActive]}>
                  <View style={styles.iconLeft}>
                    <IconMail size={20} color={emailFocus ? colors.primary : colors.text.muted} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#475569"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={t => { setEmail(t); setErrorMsg(''); }}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                  />
                </View>
              </View>

              <Button
                title={loading ? 'SENDING...' : 'SEND RESET LINK'}
                onPress={handleSend}
                disabled={loading}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {/* Back to login */}
          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('LoginScreen')}
          >
            <IconArrowBack size={16} color={colors.primary} />
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll:     { flexGrow: 1 },
  container:  { flex: 1, backgroundColor: colors.background.dark, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 448, marginBottom: 24 },
  backBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  card: {
    width: '100%', maxWidth: 448,
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle, borderWidth: 1,
    borderRadius: 16, padding: 32,
  },
  titleSection: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 80, height: 80,
    backgroundColor: colors.background.dark,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border.subtle,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
  },
  iconEmoji:  { fontSize: 36 },
  title:      { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1, marginBottom: 12, textAlign: 'center' },
  subtitle:   { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  errorText:  { color: '#f87171', textAlign: 'center', marginBottom: 12, fontSize: 13 },
  form:       { width: '100%', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label:      { color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,1)',
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, height: 56,
  },
  inputActive: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  iconLeft:   { paddingLeft: 16, paddingRight: 8 },
  input:      { flex: 1, height: '100%', color: '#FFF', fontSize: 16, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  successBox: { alignItems: 'center', paddingVertical: 20, marginBottom: 24, gap: 12 },
  successIcon:  { fontSize: 48 },
  successTitle: { fontSize: 18, fontWeight: '900', color: '#4ADE80' },
  successText:  { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
  backToLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 8 },
  backToLoginText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
});

export default ForgotPasswordScreen;
