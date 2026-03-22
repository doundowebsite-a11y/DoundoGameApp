import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme/theme';
import { getSymbol } from '../symbols/symbols';

/*
  SymbolCard renders an icon + name filling ~80% of the grid cell.
  - NO border rectangle visible inside the cell (transparent background)
  - NO sub-label / descriptor text
  - Icon fills ~55% of available space, name below it
  - isSelected adds a glow ring (used in hand cards)
  - disabled skips the TouchableOpacity press
*/
export const SymbolCard = ({ symbol, onPress, isSelected, disabled, size }) => {
  const symData = getSymbol(symbol);
  const symbolColor = symData?.color ?? theme.colors.text.secondary;

  const iconSize = size ?? 32;
  const fontSize = Math.max(7, Math.floor(iconSize * 0.28));

  const inner = (
    <View style={styles.inner}>
      {symData ? (
        <>
          <Image
            source={symData.icon}
            style={{ width: iconSize, height: iconSize, resizeMode: 'contain' }}
          />
          <Text
            style={[styles.symbolName, { color: symbolColor, fontSize }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {symData.label.toUpperCase()}
          </Text>
        </>
      ) : (
        <Text style={[styles.symbolName, { color: symbolColor, fontSize: iconSize * 0.5 }]}>?</Text>
      )}
    </View>
  );

  if (disabled) {
    return <View style={styles.card}>{inner}</View>;
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && {
          shadowColor: symbolColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 12,
          borderWidth: 2,
          borderColor: symbolColor,
          elevation: 8,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {inner}
    </TouchableOpacity>
  );
};

// ── Back-of-card (for opponent hand and deck) ───────────────────────
export const CardBack = ({ style }) => (
  <View style={[styles.cardBack, style]}>
    <View style={styles.cardBackPattern}>
      <Text style={{ color: 'rgba(37,106,244,0.4)', fontSize: 14 }}>◆</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    // Transparent background — no rectangle
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: '80%',
    gap: 3,
  },
  symbolName: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 2,
  },
  // Back of card
  cardBack: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(37,106,244,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37,106,244,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackPattern: {
    width: '60%',
    height: '60%',
    borderWidth: 1,
    borderColor: 'rgba(37,106,244,0.4)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
