/**
 * TermsLayout.jsx — src/screens/layouts/TermsLayout.jsx
 * Pure UI component for the Terms Screen.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';

const TermsLayout = (props) => {
  const { insets, loading, onAccept, onDecline } = props;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Legal Center</Text>
        <Text style={styles.gavelIcon}>⚖️</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>UPDATED OCT 2023</Text>
          </View>
          <Text style={styles.mainTitle}>Terms and{'\n'}Conditions</Text>
          <Text style={styles.subtitle}>
            Please read these terms carefully. By using Doundo, you agree to these rules which govern our relationship with you.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>01</Text></View>
            <Text style={styles.sectionTitle}>Introduction</Text>
          </View>
          <Text style={styles.paragraph}>
            Welcome to Doundo. These Terms constitute a legally binding agreement between you and Doundo, concerning your access to and use of our mobile application and services. By accessing our services, you acknowledge that you have read, understood, and agree to be bound by all of these terms.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>02</Text></View>
            <Text style={styles.sectionTitle}>User Conduct</Text>
          </View>
          <View style={styles.boxContainer}>
            {[
              'Do not systematically retrieve data to create unauthorized databases.',
              'Do not trick, defraud, or mislead other users.',
              'Do not circumvent or disable security-related features.',
              'Do not use the app for any unlawful purpose.',
            ].map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.checkIcon}>✅</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>03</Text></View>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
          </View>
          <Text style={styles.paragraph}>
            We care about data privacy and security. By using the service, you agree to our Privacy Policy, which is incorporated into these terms. Your data is stored in protected cloud environments.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>04</Text></View>
            <Text style={styles.sectionTitle}>Account Termination</Text>
          </View>
          <View style={styles.cardRow}>
            <View style={styles.termCard}>
              <Text style={styles.cardTitle}>By You</Text>
              <Text style={styles.cardText}>You may delete your account at any time through settings.</Text>
            </View>
            <View style={[styles.termCard, { marginLeft: 12 }]}>
              <Text style={styles.cardTitle}>By Doundo</Text>
              <Text style={styles.cardText}>We may suspend accounts for fraudulent or illegal activity.</Text>
            </View>
          </View>
        </View>

        <View style={styles.acceptanceSection}>
          <Text style={styles.dateText}>Last Revised: October 24, 2023</Text>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.acceptBtnText}>{loading ? 'SAVING...' : 'I ACCEPT THE TERMS'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineBtn}
            onPress={onDecline}
            activeOpacity={0.85}
          >
            <Text style={styles.declineBtnText}>DECLINE</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>© 2023 Doundo Inc. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.dark, width: '100%'},
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: 'rgba(37, 106, 244, 0.1)' },
  gavelIcon: { fontSize: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  titleSection: { marginBottom: 40 },
  badge: { backgroundColor: 'rgba(37, 106, 244, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, marginBottom: 16 },
  badgeText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  mainTitle: { color: '#FFF', fontSize: 36, fontWeight: 'bold', lineHeight: 44 },
  subtitle: { color: theme.colors.text.secondary, fontSize: 16, marginTop: 16, lineHeight: 24 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  numberBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(37, 106, 244, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  numberText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  paragraph: { color: theme.colors.text.secondary, fontSize: 15, lineHeight: 24, marginBottom: 12 },
  boxContainer: { backgroundColor: 'rgba(37, 106, 244, 0.05)', borderWidth: 1, borderColor: 'rgba(37, 106, 244, 0.1)', borderRadius: 12, padding: 20 },
  listItem: { flexDirection: 'row', marginBottom: 12 },
  checkIcon: { marginRight: 12, fontSize: 16 },
  listText: { flex: 1, color: theme.colors.text.secondary, fontSize: 15, lineHeight: 22 },
  cardRow: { flexDirection: 'row', marginTop: 8 },
  termCard: { flex: 1, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(37, 106, 244, 0.1)', borderRadius: 12, padding: 16 },
  cardTitle: { color: theme.colors.primary, fontWeight: 'bold', marginBottom: 8 },
  cardText: { color: theme.colors.text.secondary, fontSize: 13, lineHeight: 20 },
  acceptanceSection: { borderTopWidth: 1, borderColor: 'rgba(37, 106, 244, 0.1)', paddingTop: 32, alignItems: 'center', marginBottom: 24, gap: 12 },
  dateText: { color: theme.colors.text.secondary, fontSize: 12, marginBottom: 8 },
  acceptBtn: { backgroundColor: theme.colors.primary, width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  acceptBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  declineBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  declineBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  footerText: { textAlign: 'center', color: theme.colors.text.secondary, fontSize: 10 },
});

export default TermsLayout;
