import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../theme/theme';
import { SymbolCard } from './SymbolCard';
import { getResponsiveLayout } from '../../utils/responsive';

// A mock 4x4 grid. Null represents empty slots.
const mockGrid = Array(16).fill(null).map((_, i) => ({
  id: i,
  symbol: i % 5 === 0 ? 'fire' : i % 3 === 0 ? 'water' : null,
}));

export const GameBoard = () => {
  const { boardSize } = getResponsiveLayout();

  // Adjust tile size dynamically
  const gap = theme.spacing.board.gap;
  const padding = theme.spacing.board.padding;
  const availableWidth = boardSize - (padding * 2) - (gap * 3);
  const tileSize = availableWidth / 4;

  const handleTilePress = (id) => {
    console.log('Tile pressed:', id);
  };

  return (
    <View style={[styles.boardContainer, { width: boardSize, height: boardSize, padding }]}>
      <View style={[styles.grid, { gap }]}>
        {mockGrid.map((cell) => (
          <View 
            key={cell.id} 
            style={[styles.tileSlot, { width: tileSize, height: tileSize }]}
          >
            {cell.symbol ? (
              <SymbolCard 
                symbol={cell.symbol} 
                onPress={() => handleTilePress(cell.id)} 
              />
            ) : (
              <View style={styles.emptyTile} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    borderColor: theme.colors.border.subtle,
    borderWidth: 2,
    alignSelf: 'center',
    shadowColor: theme.colors.neon.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  tileSlot: {
    // Exact sizing handled inline
  },
  emptyTile: {
    flex: 1,
    backgroundColor: theme.colors.board.tileEmpty,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  }
});
