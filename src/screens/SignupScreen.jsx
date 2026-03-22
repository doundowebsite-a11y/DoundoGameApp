import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Platform, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import { IconMail, IconLock, IconPerson, IconArrowBack } from '../assets/icons/icons';
import { IconGoogle } from '../assets/icons/IconGoogle';
import { IconFacebook } from '../assets/icons/IconFacebook';
import Button from '../components/ui/Button';
import SoundManager from '../services/SoundManager';
import { supabase } from '../services/supabase';

const SignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);

  useEffect(() => { SoundManager.init(); }, []);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    setLoading(false);
    if (error) {
      if (error.message.includes('already registered')) {
        setErrorMsg('This email is already registered. Try logging in.');
      } else {
        setErrorMsg(error.message);
      }
    }
    // On success: AppNavigator detects new user → shows TermsScreen automatically
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <IconArrowBack size={26} color={colors.primary} />
        </TouchableOpacity>
        <DoundoLogo width={90} height={24} />
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled">
        <View style={styles.main}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Enter your details to join the arena</Text>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={[styles.inputContainer, nameFocus && styles.inputActive]}>
                <View style={styles.iconLeft}><IconPerson size={20} color={nameFocus ? colors.primary : colors.text.muted} /></View>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#475569"
                  value={fullName}
                  onChangeText={t => { setFullName(t); setErrorMsg(''); SoundManager.playTyping(); }}
                  onFocus={() => setNameFocus(true)}
                  onBlur={() => setNameFocus(false)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ID</Text>
              <View style={[styles.inputContainer, emailFocus && styles.inputActive]}>
                <View style={styles.iconLeft}><IconMail size={20} color={emailFocus ? colors.primary : colors.text.muted} /></View>
                <TextInput
                  style={styles.input}
                  placeholder="gamer@doundo.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={t => { setEmail(t); setErrorMsg(''); SoundManager.playTyping(); }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={[styles.inputContainer, passFocus && styles.inputActive]}>
                <View style={styles.iconLeft}><IconLock size={20} color={passFocus ? colors.primary : colors.text.muted} /></View>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={t => { setPassword(t); setErrorMsg(''); SoundManager.playTyping(); }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                />
              </View>
            </View>

            <Button
              title={loading ? 'CREATING...' : 'JOIN THE ARENA'}
              onPress={handleSignup}
              disabled={loading}
              style={{ marginTop: 16 }}
            />
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
              <IconGoogle size={20} />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <IconFacebook size={20} />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.dark },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md, zIndex: 50,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  main: { width: '100%', maxWidth: 448, paddingHorizontal: 24, paddingVertical: 24 },
  titleSection: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.slate[100], marginBottom: spacing.sm, letterSpacing: -1 },
  subtitle: { fontSize: typography.sizes.md, color: colors.text.secondary },
  errorText: { color: '#f87171', textAlign: 'center', marginBottom: 12, fontSize: 13 },
  form: { width: '100%', marginBottom: 24 },
  inputGroup: { marginBottom: 18 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background.inputAlt,
    borderWidth: 1, borderColor: colors.border.primaryFaded,
    borderRadius: 12, height: 56,
  },
  inputActive: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  iconLeft: { paddingLeft: 16, paddingRight: 8 },
  input: { flex: 1, height: '100%', color: colors.slate[100], fontSize: typography.sizes.md, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  divText: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(30,41,59,0.5)', borderColor: '#334155',
    borderWidth: 1, paddingVertical: 14, borderRadius: 12, gap: 8,
  },
  socialText: { color: '#E2E8F0', fontSize: 14, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#94A3B8', fontSize: 16, fontWeight: '500' },
  footerLink: { color: colors.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 4 },
});

export default SignupScreen;
