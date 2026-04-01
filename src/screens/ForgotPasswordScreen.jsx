/**
 * ForgotPasswordScreen.jsx — src/screens/ForgotPasswordScreen.jsx
 * Logic-only component for the Forgot Password Screen.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { IconMail } from '../assets/icons/icons';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';
import AuthLayout from './layouts/AuthLayout';

const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setErrorMsg('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrorMsg('Please enter a valid email address.'); return; }
    setLoading(true); setErrorMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: 'doundo://reset-password' });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else setSent(true);
  };

  return (
    <AuthLayout
      insets={insets} errorMsg={errorMsg} onBack={() => navigation.goBack()} showLogoHeader={true}
      title={sent ? "" : "FORGOT PASSWORD?"}
      subtitle={sent ? "" : "Enter your email and we'll send you a link to reset your password."}
    >
      {sent ? (
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Reset Link Sent!</Text>
          <Text style={styles.successText}>Check your inbox at{'\n'}<Text style={{ color: colors.primary, fontWeight: '700' }}>{email.trim().toLowerCase()}</Text></Text>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ID</Text>
            <View style={styles.inputContainer}>
              <View style={styles.iconLeft}><IconMail size={20} color={colors.text.muted} /></View>
              <TextInput
                style={styles.input} placeholder="Enter your email" placeholderTextColor="#475569"
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                value={email} onChangeText={t => { setEmail(t); setErrorMsg(''); }}
                returnKeyType="done" onSubmitEditing={handleSend}
              />
            </View>
          </View>
          <Button title={loading ? 'SENDING...' : 'SEND RESET LINK'} onPress={handleSend} disabled={loading} style={{ marginTop: 8 }} />
        </View>
      )}
      <TouchableOpacity style={styles.backToLogin} onPress={() => navigation.navigate('LoginScreen')}>
        <Text style={styles.backArrow}>←</Text><Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: { width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,1)', borderWidth: 1, borderColor: '#334155', borderRadius: 12, height: 56 },
  iconLeft: { paddingLeft: 16, paddingRight: 8 },
  input: { flex: 1, height: '100%', color: '#FFF', fontSize: 16, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  successBox: { alignItems: 'center', paddingVertical: 20, marginBottom: 24, gap: 12 },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 18, fontWeight: '900', color: '#4ADE80' },
  successText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
  backToLogin: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  backArrow: { color: colors.primary, fontSize: 18 },
  backText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
});

export default ForgotPasswordScreen;
