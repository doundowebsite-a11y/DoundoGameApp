/**
 * LoginScreen.jsx — src/screens/LoginScreen.jsx
 * Logic-only component for the Login Screen.
 */
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { IconMail, IconLock, IconVisibility } from '../assets/icons/icons';
import { IconGoogle } from '../assets/icons/IconGoogle';
import { IconFacebook } from '../assets/icons/IconFacebook';
import Button from '../components/ui/Button';
import { supabase } from '../services/supabase';
import AuthLayout from './layouts/AuthLayout';

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const passwordRef = useRef(null);

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
      setErrorMsg(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message);
    }
  };

  return (
    <AuthLayout
      insets={insets}
      errorMsg={errorMsg}
      footerText="New to the arena? "
      footerLinkText="SIGN UP"
      onFooterPress={() => navigation.navigate('SignupScreen')}
    >
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email ID</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconLeft}><IconMail size={20} color={colors.text.muted} /></View>
            <TextInput
              style={styles.input}
              placeholder="commander@doundo.gg"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={t => { setEmail(t); setErrorMsg(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <View style={styles.iconLeft}><IconLock size={20} color={colors.text.muted} /></View>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={t => { setPassword(t); setErrorMsg(''); }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.iconRight} onPress={() => setShowPassword(v => !v)}>
              <IconVisibility size={20} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <Button title={loading ? 'LOGGING IN...' : 'LOGIN'} onPress={handleLogin} disabled={loading} style={{ marginTop: 8 }} />

        <View style={styles.divider}>
          <View style={styles.divLine} /><Text style={styles.divText}>OR</Text><View style={styles.divLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <View style={styles.socialIconBg}><IconGoogle size={14} /></View>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <IconFacebook size={22} /><Text style={styles.socialText}>Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  form: { width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', marginLeft: 4, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderWidth: 1, borderColor: '#334155', borderRadius: 12, height: 56 },
  iconLeft: { paddingLeft: 16, paddingRight: 8 },
  iconRight: { paddingLeft: 8, paddingRight: 16 },
  input: { flex: 1, color: '#FFF', fontSize: 16, height: '100%', ...Platform.select({ web: { outlineStyle: 'none' } }) },
  rowBetween: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  forgotText: { color: colors.primary, fontSize: 12, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  divText: { color: '#64748B', fontSize: 12, fontWeight: 'bold' },
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 16, backgroundColor: 'rgba(30, 41, 59, 0.3)', borderColor: '#334155', borderWidth: 1, borderRadius: 9999, gap: 8 },
  socialIconBg: { width: 22, height: 22, backgroundColor: '#FFF', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
});

export default LoginScreen;
