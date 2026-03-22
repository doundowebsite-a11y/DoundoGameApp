import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { SymbolCard } from './SymbolCard';
import { getResponsiveLayout } from '../../utils/responsive';
import { topSym } from './engine/gameUtils'; // To get the topmost symbol of a cell stack

export const GameBoard = ({ board, onTilePress, currentLayer, swapMode }) => {
  const { boardSize } = getResponsiveLayout();

  // Adjust tile size dynamically
  const gap = theme.spacing.board.gap;
  const padding = theme.spacing.board.padding;
  const availableWidth = boardSize - (padding * 2) - (gap * 3);
  const tileSize = availableWidth / 4;

  if (!board) return null;

  return (
    <View style={[styles.boardContainer, { width: boardSize, height: boardSize, padding }]}>
      <View style={[styles.grid, { gap }]}>
        {board.map((row, r) => 
          row.map((cell, c) => {
            const sym = topSym(cell);
            const isHighlighted = swapMode?.toR === r && swapMode?.toC === c;
            
            return (
              <TouchableOpacity 
                key={`${r}-${c}`} 
                style={[
                  styles.tileSlot, 
                  { width: tileSize, height: tileSize },
                  isHighlighted && styles.highlightedSlot
                ]}
                activeOpacity={0.8}
                onPress={() => onTilePress(r, c)}
              >
                {sym ? (
                  <SymbolCard symbol={sym} disabled={true} />
                ) : (
                  <View style={styles.emptyTile} />
                )}
                {/* Visual indicator of layer depth could go here */}
              </TouchableOpacity>
            );
          })
        )}
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
  },
  highlightedSlot: {
    borderColor: theme.colors.neon.cyan,
    borderWidth: 2,
    borderRadius: 8,
    shadowColor: theme.colors.neon.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  }
});
