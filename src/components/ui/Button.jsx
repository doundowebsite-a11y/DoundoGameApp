import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

export const Button = ({ title, onPress, style, textStyle, variant = 'primary', disabled = false, loading = false }) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFF' : theme.colors.text.secondary} size="small" />
      ) : (
        <Text style={[styles.baseText, isPrimary ? styles.primaryText : styles.secondaryText, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base:          { width: '100%', paddingVertical: verticalScale(15), paddingHorizontal: scale(16), borderRadius: scale(50), alignItems: 'center', justifyContent: 'center', minHeight: verticalScale(48) },
  primary:       { backgroundColor: '#256af4', shadowColor: '#256af4', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  secondary:     { backgroundColor: 'rgba(30,41,59,0.5)', borderColor: '#334155', borderWidth: 1 },
  disabled:      { opacity: 0.5 },
  baseText:      { fontWeight: 'bold', fontSize: scaleFont(16), textTransform: 'uppercase', letterSpacing: 1.5 },
  primaryText:   { color: '#FFFFFF' },
  secondaryText: { color: '#CBD5E1' },
});

export default Button;