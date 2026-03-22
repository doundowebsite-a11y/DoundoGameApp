import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme/theme';
import { IconHome, IconPerson } from '../../assets/icons/icons';

const BottomNav = ({ navigation, activeRoute }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Home')}
      >
        <IconHome 
          size={24} 
          color={activeRoute === 'Home' ? theme.colors.primary : theme.colors.text.muted} 
        />
        <Text style={[
          styles.navText, 
          { color: activeRoute === 'Home' ? theme.colors.primary : theme.colors.text.muted }
        ]}>HOME</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => navigation.navigate('Profile')}
      >
        <IconPerson 
          size={24} 
          color={activeRoute === 'Profile' ? theme.colors.primary : theme.colors.text.muted} 
        />
        <Text style={[
          styles.navText, 
          { color: activeRoute === 'Profile' ? theme.colors.primary : theme.colors.text.muted }
        ]}>PROFILE</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: theme.colors.background.dark,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    display: 'none', // Following HTML where it only shows icons mostly, but we add text just in case. HTML just had icons for game page.
  }
});

export default BottomNav;
