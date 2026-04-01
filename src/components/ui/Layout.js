import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { theme } from '../../theme/theme';
import { getDeviceType } from '../../utils/responsive';

export const Layout = ({ children, header, footer, style }) => {
  const deviceType = getDeviceType();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background.primary} />
      <View style={[
        styles.container, 
        deviceType === 'desktop' && styles.desktopContainer,
        style
      ]}>
        {header && <View style={styles.header}>{header}</View>}
        <View style={styles.mainContent}>
          {children}
        </View>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    ...Platform.select({
      web: {
        height: '100vh',
      }
    }),
  },
  desktopContainer: {
    alignItems: 'center', // Center content horizontally on wide screens
  },
  header: {
    padding: theme.spacing.md,
    width: '100%',
    maxWidth: 800, // Constrain width on large screens
    alignSelf: 'center',
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    maxWidth: 800, // Constrain width on large screens
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: theme.spacing.md,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  }
});

export default Layout;
