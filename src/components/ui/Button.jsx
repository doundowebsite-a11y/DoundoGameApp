import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, View } from 'react-native';
import { theme } from '../../theme/theme';

export const Button = ({ title, onPress, style, textStyle, variant = 'primary' }) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity 
      style={[
        styles.baseButton, 
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.baseText,
        isPrimary ? styles.primaryText : styles.secondaryText,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 9999, // full rounded
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#256af4', // primary color
    // Glow effect
    shadowColor: '#256af4',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8, // android shadow
  },
  secondaryButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800/50
    borderColor: '#334155', // slate-700
    borderWidth: 1,
  },
  baseText: {
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#CBD5E1', // slate-300
  }
});

export default Button;
