import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
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
import { useEffect } from 'react';
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
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        
        {/* Background Decorations handled via styling/absolute elements in a real app, keeping simple here */}
        
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <DoundoLogo width={48} height={13} />
            </View>
            <DoundoLogo width={160} height={43} />
            <Text style={styles.subtitle}>THE ULTIMATE CARD FACE-OFF</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Error Message */}
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ID</Text>
              <View style={[styles.inputContainer, emailFocus && styles.inputContainerActive]}>
                <View style={styles.inputIconLeft}>
                  <IconMail size={20} color={emailFocus ? colors.primary : colors.text.muted} />
                </View>
                <TextInput 
                  style={styles.input}
                  placeholder="commander@doundo.gg"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={(text) => { setEmail(text); SoundManager.playTyping(); }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, passFocus && styles.inputContainerActive]}>
                <View style={styles.inputIconLeft}>
                  <IconLock size={20} color={passFocus ? colors.primary : colors.text.muted} />
                </View>
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={(text) => { setPassword(text); SoundManager.playTyping(); }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.inputIconRight}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <IconVisibility size={20} color={colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me / Forgot */}
            <View style={styles.rowBetween}>
              <TouchableOpacity style={styles.rememberRow}>
                <View style={styles.checkbox} />
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot Access?</Text>
              </TouchableOpacity>
            </View>

            {/* Main Login Button */}
            <Button 
              title={loading ? "AUTHENTICATING..." : "LOGIN"} 
              onPress={handleLogin} 
              disabled={loading}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>CONNECT VIA</Text>
          </View>

          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <View style={styles.socialIconBg}>
                <IconGoogle size={14} />
              </View>
              <Text style={styles.socialText}>Login with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <IconFacebook size={24} />
              <Text style={styles.socialText}>Login with Facebook</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 448, // max-w-md
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
      }
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    backgroundColor: colors.overlay.primaryMedium,
    padding: spacing.md,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border.primaryMedium,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    color: '#94A3B8', // slate-400
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#CBD5E1', // slate-300
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800/50
    borderWidth: 1,
    borderColor: '#334155', // slate-700
    borderRadius: 12,
    height: 56,
  },
  inputContainerActive: {
    borderColor: '#256af4', // primary
    shadowColor: '#256af4',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  inputIconLeft: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  inputIconRight: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  errorText: {
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  rememberText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  forgotText: {
    color: '#256af4',
    fontSize: 12,
    fontWeight: '500',
  },
  dividerContainer: {
    paddingVertical: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    backgroundColor: '#0f172a', // to cover the line
    paddingHorizontal: 16,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  socialContainer: {
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 9999,
  },
  socialIconBg: {
    width: 24,
    height: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  socialText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Platform.OS === 'web' ? 0 : 12, // fallback margin if not web
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  footerLink: {
    color: '#256af4',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default LoginScreen;
