/**
 * GameBoard.jsx
 * src/game/GameBoard.jsx
 *
 * 4x4 grid. Passes hover state to each GridCell for live highlighting.
 *
 * hoverCell: { r, c, valid } | null
 *   Set by GameScreen when a card is being dragged over the board.
 *   GridCell uses this to show green (valid) or red (invalid) highlight.
 */
import React, { useRef } from 'react';
import { View } from 'react-native';
import GridCell from './GridCell';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { topSym } from '../game/engine/gameUtils';

export default function GameBoard({
  board,
  currentLayer,
  swapMode,
  glowCells,
  hoverCell,       // { r, c, valid } | null — live drag hover
  selIdx,          // selected hand card index
  canPlaceAny,     // bool — is it currently place phase
  onTilePress,
  onBoardLayout,
}) {
  const dims = useDimensions();
  const { tileSize, gap, tilePadding } = getBoardMetrics(dims.width);
  const ref = useRef(null);

  if (!board) return null;

  const isGlowing = (r, c) => glowCells?.some(g => g.r === r && g.c === c) ?? false;

  return (
    <View
      ref={ref}
      style={{ paddingHorizontal: tilePadding, paddingVertical: 4 }}
      onLayout={() => {
        ref.current?.measure((x, y, w, h, px, py) => {
          onBoardLayout?.({ pageX: px, pageY: py, width: w, height: h });
        });
      }}
    >
      {board.map((row, r) => (
        <View key={`row-${r}`} style={{ flexDirection: 'row', gap, marginBottom: r < 3 ? gap : 0 }}>
          {row.map((cell, c) => {
            const isHovering = hoverCell?.r === r && hoverCell?.c === c;
            // A cell is valid to drop on if it has exactly (currentLayer-1) cards
            const stackLen = cell.length;
            const cellIsValid = stackLen === currentLayer - 1;

            return (
              <GridCell
                key={`${r}-${c}`}
                cell={cell} r={r} c={c}
                tileSize={tileSize}
                isGlowing={isGlowing(r, c)}
                hoverValid={isHovering && hoverCell.valid}
                hoverInvalid={isHovering && !hoverCell.valid}
                swapMode={swapMode}
                currentLayer={currentLayer}
                selIdx={selIdx}
                canPlace={canPlaceAny && cellIsValid}
                onPress={() => onTilePress(r, c)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
