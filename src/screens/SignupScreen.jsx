/**
 * SignupScreen.jsx — src/screens/SignupScreen.jsx
 * Logic-only component for the Signup Screen.
 */
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { IconMail, IconLock, IconPerson } from '../assets/icons/icons';
import { IconGoogle } from '../assets/icons/IconGoogle';
import { IconFacebook } from '../assets/icons/IconFacebook';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';
import AuthLayout from './layouts/AuthLayout';

const SignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all fields.'); return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMsg('Please enter a valid email address.'); return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.'); return;
    }
    setLoading(true); setErrorMsg('');
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (error) setErrorMsg(error.message.includes('already registered') ? 'This email is already registered.' : error.message);
  };

  return (
    <AuthLayout
      insets={insets} errorMsg={errorMsg} title="Create Account" subtitle="Enter your details to join the arena"
      onBack={() => navigation.goBack()} showLogoHeader={true}
      footerText="Already have an account? " footerLinkText="Login" onFooterPress={() => navigation.navigate('LoginScreen')}
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconLeft}><IconPerson size={20} color={colors.text.muted} /></View>
            <TextInput
              style={styles.input} placeholder="Your name" placeholderTextColor="#475569"
              value={fullName} onChangeText={t => { setFullName(t); setErrorMsg(''); }}
              returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} blurOnSubmit={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ID</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconLeft}><IconMail size={20} color={colors.text.muted} /></View>
            <TextInput
              ref={emailRef} style={styles.input} placeholder="gamer@doundo.com" placeholderTextColor="#475569"
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              value={email} onChangeText={t => { setEmail(t); setErrorMsg(''); }}
              returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} blurOnSubmit={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconLeft}><IconLock size={20} color={colors.text.muted} /></View>
            <TextInput
              ref={passwordRef} style={styles.input} placeholder="Min. 6 characters" placeholderTextColor="#475569"
              secureTextEntry value={password} onChangeText={t => { setPassword(t); setErrorMsg(''); }}
              returnKeyType="done" onSubmitEditing={handleSignup}
            />
          </View>
        </View>

        <Button title={loading ? 'CREATING...' : 'JOIN THE ARENA'} onPress={handleSignup} disabled={loading} style={{ marginTop: 16 }} />

        <View style={styles.divider}>
          <View style={styles.divLine} /><Text style={styles.divText}>OR</Text><View style={styles.divLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <IconGoogle size={20} /><Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <IconFacebook size={20} /><Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: { width: '100%' },
  inputGroup: { marginBottom: 18 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.inputAlt, borderWidth: 1, borderColor: colors.border.primaryFaded, borderRadius: 12, height: 56 },
  iconLeft: { paddingLeft: 16, paddingRight: 8 },
  input: { flex: 1, height: '100%', color: colors.slate[100], fontSize: typography.sizes.md, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  divText: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,41,59,0.5)', borderColor: '#334155', borderWidth: 1, paddingVertical: 14, borderRadius: 12, gap: 8 },
  socialText: { color: '#E2E8F0', fontSize: 14, fontWeight: '500' },
});

export default SignupScreen;
