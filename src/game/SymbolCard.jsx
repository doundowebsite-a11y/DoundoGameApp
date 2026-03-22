import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme/theme';
import { getSymbol } from '../symbols/symbols';

export const SymbolCard = ({ symbol, onPress, isSelected, disabled }) => {
  const symData = getSymbol(symbol);
  const symbolColor = symData ? symData.color : theme.colors.text.secondary;

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { borderColor: symbolColor },
        isSelected && { 
          shadowColor: symbolColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 15,
          borderWidth: 3,
        }
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.cardInner}>
        {symData ? (
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Image source={symData.icon} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
            <Text style={[styles.symbolText, { color: symbolColor }]}>{symData.label.toUpperCase()}</Text>
          </View>
        ) : (
          <Text style={[styles.symbolText, { color: symbolColor }]}>?</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2e3c6',
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInner: {
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 8, // Shrink to fit inside grid
    fontWeight: theme.typography.weights.heavy,
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center'
  }
});
