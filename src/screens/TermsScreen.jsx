import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const TermsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, terms_accepted: true })
      .select()
      .single();
      
    if (!error) {
      await refreshProfile();
      // Navigation is handled automatically by AppNavigator based on the updated Profile state
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal Center</Text>
        <View style={styles.iconBtn}>
          <Text style={styles.gavelIcon}>⚖️</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>UPDATED OCT 2023</Text>
          </View>
          <Text style={styles.mainTitle}>Terms and Conditions</Text>
          <Text style={styles.subtitle}>
            Please read these terms carefully. By using Doundo, you agree to these rules which govern our relationship with you.
          </Text>
        </View>

        {/* 1. Introduction */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>01</Text></View>
            <Text style={styles.sectionTitle}>Introduction</Text>
          </View>
          <Text style={styles.paragraph}>
            Welcome to Doundo. These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity, and Doundo, concerning your access to and use of our mobile application and web services.
          </Text>
          <Text style={styles.paragraph}>
            By accessing our services, you acknowledge that you have read, understood, and agree to be bound by all of these terms. If you do not agree with all of these terms, then you are expressly prohibited from using the service and must discontinue use immediately.
          </Text>
        </View>

        {/* 2. User Conduct */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>02</Text></View>
            <Text style={styles.sectionTitle}>User Conduct</Text>
          </View>
          <View style={styles.boxContainer}>
            <Text style={[styles.paragraph, { marginBottom: 12 }]}>
              As a user of Doundo, you agree not to:
            </Text>
            <View style={styles.listItem}>
               <Text style={styles.checkIcon}>✅</Text>
               <Text style={styles.listText}>Systematically retrieve data or other content from the service to create or compile a collection or database.</Text>
            </View>
            <View style={styles.listItem}>
               <Text style={styles.checkIcon}>✅</Text>
               <Text style={styles.listText}>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information.</Text>
            </View>
            <View style={styles.listItem}>
               <Text style={styles.checkIcon}>✅</Text>
               <Text style={styles.listText}>Circumvent, disable, or otherwise interfere with security-related features of the application.</Text>
            </View>
          </View>
        </View>

        {/* 3. Privacy Policy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>03</Text></View>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
          </View>
          <Text style={styles.paragraph}>
            We care about data privacy and security. Please review our Privacy Policy to understand how we collect, use, and share your information. By using the service, you agree to be bound by our Privacy Policy, which is incorporated into these terms.
          </Text>
          <View style={styles.noteContainer}>
             <Text style={styles.noteText}>
               Note: Our services are hosted in protected cloud environments. If you access from regions with laws governing data collection, you are transferring your data to our primary hosting regions.
             </Text>
          </View>
        </View>

        {/* 4. Account Termination */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>04</Text></View>
            <Text style={styles.sectionTitle}>Account Termination</Text>
          </View>
          <Text style={styles.paragraph}>
            We reserve the right, in our sole discretion and without notice or liability, to deny access to and use of the service to any person for any reason, including without limitation for breach of any representation, warranty, or covenant contained in these terms.
          </Text>
          
          <View style={styles.cardRow}>
            <View style={styles.termCard}>
               <Text style={styles.cardTitle}>By You</Text>
               <Text style={styles.cardText}>You may terminate your account at any time through the application settings or by contacting support.</Text>
            </View>
            <View style={[styles.termCard, { marginLeft: 12 }]}>
               <Text style={styles.cardTitle}>By Doundo</Text>
               <Text style={styles.cardText}>We may suspend or terminate your account if we suspect fraudulent or illegal activity.</Text>
            </View>
          </View>
        </View>

        {/* Acceptance Section */}
        <View style={styles.acceptanceSection}>
           <Text style={styles.dateText}>Last Revised: October 24, 2023</Text>
           <TouchableOpacity 
             style={styles.acceptBtn} 
             onPress={handleAccept}
             disabled={loading}
           >
              <Text style={styles.acceptBtnText}>{loading ? "SAVING..." : "I Accept the Terms"}</Text>
           </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>© 2023 Doundo Inc. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.dark,
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(37, 106, 244, 0.1)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  iconText: {
    color: '#FFF',
    fontSize: 24,
  },
  gavelIcon: {
    fontSize: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 40,
  },
  badge: {
    backgroundColor: 'rgba(37, 106, 244, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 16,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  mainTitle: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    marginTop: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 106, 244, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paragraph: {
    color: theme.colors.text.secondary,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  boxContainer: {
    backgroundColor: 'rgba(37, 106, 244, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(37, 106, 244, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 12,
    fontSize: 16,
  },
  listText: {
    flex: 1,
    color: theme.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
  },
  noteContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cardRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  termCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(37, 106, 244, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
  },
  acceptanceSection: {
    borderTopWidth: 1,
    borderColor: 'rgba(37, 106, 244, 0.1)',
    paddingTop: 32,
    alignItems: 'center',
    marginBottom: 40,
  },
  dateText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 20,
  },
  acceptBtn: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontSize: 10,
  }
});

export default TermsScreen;
