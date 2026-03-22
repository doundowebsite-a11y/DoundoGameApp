import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
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
import { useEffect } from 'react';
import { supabase } from '../services/supabase';

const SignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { SoundManager.init(); }, []);

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IconArrowBack size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerLogoContainer}>
          <DoundoLogo width={90} height={24} />
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.mainContent}>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Enter your details to join the arena</Text>
          </View>

          <View style={styles.form}>
            
            {/* Error Message */}
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={[styles.inputContainer, nameFocus && styles.inputContainerActive]}>
                <View style={styles.inputIconLeft}>
                  <IconPerson size={20} color={nameFocus ? colors.primary : colors.text.muted} />
                </View>
                <TextInput 
                  style={styles.input}
                  placeholder="Master Chief"
                  placeholderTextColor="#475569"
                  value={fullName}
                  onChangeText={(text) => { setFullName(text); SoundManager.playTyping(); }}
                  onFocus={() => setNameFocus(true)}
                  onBlur={() => setNameFocus(false)}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ID</Text>
              <View style={[styles.inputContainer, emailFocus && styles.inputContainerActive]}>
                <View style={styles.inputIconLeft}>
                  <IconMail size={20} color={emailFocus ? colors.primary : colors.text.muted} />
                </View>
                <TextInput 
                  style={styles.input}
                  placeholder="gamer@doundo.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => { setEmail(text); SoundManager.playTyping(); }}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={[styles.inputContainer, passFocus && styles.inputContainerActive]}>
                <View style={styles.inputIconLeft}>
                  <IconLock size={20} color={passFocus ? colors.primary : colors.text.muted} />
                </View>
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => { setPassword(text); SoundManager.playTyping(); }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                />
              </View>
            </View>

            <Button 
              title={loading ? "CREATING..." : "JOIN THE ARENA"} 
              onPress={handleSignup} 
              disabled={loading}
              style={{ marginTop: 16 }}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLineRight} />
          </View>

          {/* Social Logins */}
          <View style={styles.socialGrid}>
            <TouchableOpacity style={styles.socialGridButton}>
               <IconGoogle size={20} />
               <Text style={styles.socialGridText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialGridButton}>
               <IconFacebook size={20} />
               <Text style={styles.socialGridText}>Facebook</Text>
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

      {/* Footer Line */}
      <View style={styles.bottomFooter}>
        <View style={styles.bottomLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    zIndex: 50,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  headerLogoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingRight: 48,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    width: '100%',
    maxWidth: 448, // max-w-md
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.slate[100],
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  form: {
    width: '100%',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#CBD5E1', // slate-300
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.inputAlt,
    borderWidth: 1,
    borderColor: colors.border.primaryFaded,
    borderRadius: 12,
    height: 56,
  },
  inputContainerActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  inputIconLeft: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.slate[100],
    fontSize: typography.sizes.md,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  errorText: {
    color: colors.primary, // using primary (reddish/pinkish depending on theme) or a specific error color
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 48,
  },
  socialGridButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  socialGridText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  footerLink: {
    color: '#256af4',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bottomFooter: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  bottomLine: {
    width: 128,
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 9999,
    opacity: 0.5,
  }
});

export default SignupScreen;
