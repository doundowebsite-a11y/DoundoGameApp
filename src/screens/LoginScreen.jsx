import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import { IconMail, IconLock, IconVisibility } from '../assets/icons/icons';
import { IconGoogle } from '../assets/icons/IconGoogle';
import { IconFacebook } from '../assets/icons/IconFacebook';
import Button from '../components/ui/Button';
import SoundManager from '../services/SoundManager';
import { supabase } from '../services/supabase';

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { SoundManager.init(); }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message
      );
    }
    // On success AppNavigator re-renders automatically via auth state change
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled">
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <DoundoLogo width={48} height={13} />
            </View>
            <DoundoLogo width={160} height={43} />
            <Text style={styles.subtitle}>THE ULTIMATE CARD FACE-OFF</Text>
          </View>

          {/* Error */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ID</Text>
              <View style={[styles.inputContainer, emailFocus && styles.inputActive]}>
                <View style={styles.iconLeft}><IconMail size={20} color={emailFocus ? colors.primary : colors.text.muted} /></View>
                <TextInput
                  style={styles.input}
                  placeholder="commander@doundo.gg"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={t => { setEmail(t); setErrorMsg(''); }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, passFocus && styles.inputActive]}>
                <View style={styles.iconLeft}><IconLock size={20} color={passFocus ? colors.primary : colors.text.muted} /></View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={t => { setPassword(t); setErrorMsg(''); }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.iconRight} onPress={() => setShowPassword(!showPassword)}>
                  <IconVisibility size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rowBetween}>
              <View />
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Button title={loading ? 'LOGGING IN...' : 'LOGIN'} onPress={handleLogin} disabled={loading} style={{ marginTop: 8 }} />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OR</Text>
            <View style={styles.divLine} />
          </View>

          {/* Social */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <View style={styles.socialIconBg}><IconGoogle size={14} /></View>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <IconFacebook size={22} />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to the arena? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}>
              <Text style={styles.footerLink}>SIGN UP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  container: {
    flex: 1, backgroundColor: colors.background.dark,
    alignItems: 'center', justifyContent: 'center', padding: spacing.md,
  },
  card: {
    width: '100%', maxWidth: 448,
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle, borderWidth: 1,
    borderRadius: 16, padding: 32,
  },
  header: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    backgroundColor: colors.overlay.primaryMedium,
    padding: spacing.md, borderRadius: 9999,
    borderWidth: 1, borderColor: colors.border.primaryMedium,
    marginBottom: spacing.md,
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
  },
  subtitle: { color: '#94A3B8', fontSize: 12, fontWeight: '500', letterSpacing: 2, marginTop: 6 },
  errorText: { color: '#f87171', textAlign: 'center', marginBottom: 12, fontSize: 13 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', marginLeft: 4, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1, borderColor: '#334155',
    borderRadius: 12, height: 56,
  },
  inputActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary, shadowOpacity: 0.4,
    shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  iconLeft: { paddingLeft: 16, paddingRight: 8 },
  iconRight: { paddingLeft: 8, paddingRight: 16 },
  input: {
    flex: 1, color: '#FFF', fontSize: 16, height: '100%',
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  forgotText: { color: colors.primary, fontSize: 12, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  divText: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, paddingHorizontal: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderColor: '#334155', borderWidth: 1, borderRadius: 9999, gap: 8,
  },
  socialIconBg: { width: 22, height: 22, backgroundColor: '#FFF', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
});

export default LoginScreen;
