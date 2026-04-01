import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { DoundoLogo } from '../../assets/logo/doundo_logo';
import { IconArrowBack } from '../../assets/icons/icons';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const AuthLayout = ({ children, insets, title, subtitle, onBack, showLogoHeader = false, footerLinkText, footerText, onFooterPress, errorMsg }) => {
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background.dark }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.container, { paddingTop: (insets?.top ?? 0) + scale(16), paddingBottom: (insets?.bottom ?? 0) + scale(16) }]}>
          {onBack && (
            <View style={styles.topRow}>
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <IconArrowBack size={scale(24)} color={colors.primary} />
              </TouchableOpacity>
              {showLogoHeader && <DoundoLogo width={scale(90)} height={scale(24)} />}
              <View style={{ width: scale(44) }} />
            </View>
          )}
          <View style={styles.card}>
            {!onBack && (
              <View style={styles.header}>
                <View style={styles.logoCircle}><DoundoLogo width={scale(48)} height={scale(13)} /></View>
                <DoundoLogo width={scale(160)} height={scale(43)} />
                <Text style={styles.subtitle}>THE ULTIMATE CARD FACE-OFF</Text>
              </View>
            )}
            {title    && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitleCentered}>{subtitle}</Text>}
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            <View style={styles.form}>{children}</View>
            {(footerText || footerLinkText) && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>{footerText}</Text>
                <TouchableOpacity onPress={onFooterPress}><Text style={styles.footerLink}>{footerLinkText}</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent:      { flexGrow: 1 },
  container:          { flex: 1, backgroundColor: colors.background.dark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: scale(16) },
  topRow:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: verticalScale(20) },
  backBtn:            { width: scale(44), height: scale(44), alignItems: 'center', justifyContent: 'center' },
  card:               { width: '100%', backgroundColor: colors.background.card, borderColor: colors.border.subtle, borderWidth: 1, borderRadius: scale(16), padding: scale(28) },
  header:             { alignItems: 'center', marginBottom: verticalScale(24) },
  logoCircle:         { backgroundColor: colors.overlay.primaryMedium, padding: scale(14), borderRadius: 9999, borderWidth: 1, borderColor: colors.border.primaryMedium, marginBottom: scale(14), shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  subtitle:           { color: '#94A3B8', fontSize: scaleFont(11), fontWeight: '500', letterSpacing: 2, marginTop: scale(6) },
  title:              { fontSize: scaleFont(20), fontWeight: '900', color: '#FFF', letterSpacing: 1, marginBottom: scale(10), textAlign: 'center' },
  subtitleCentered:   { fontSize: scaleFont(14), color: '#94A3B8', textAlign: 'center', lineHeight: scaleFont(14) * 1.6, marginBottom: verticalScale(24) },
  errorText:          { color: '#f87171', textAlign: 'center', marginBottom: scale(12), fontSize: scaleFont(13) },
  form:               { width: '100%' },
  footer:             { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: verticalScale(16), flexWrap: 'wrap', gap: scale(4) },
  footerText:         { color: '#64748B', fontSize: scaleFont(14) },
  footerLink:         { color: colors.primary, fontSize: scaleFont(14), fontWeight: 'bold' },
});

export default AuthLayout;