/**
 * GridCell.jsx
 * src/game/GridCell.jsx
 *
 * Single cell in the 4x4 board.
 *
 * Highlights:
 *   isGlowing    — blue pulse glow (card was just played here)
 *   hoverValid   — blue border highlight (dragged card hovering, valid drop)
 *   hoverInvalid — red border highlight (dragged card hovering, INVALID drop)
 *   isPickBoard  — blue dashed (swap: pick source)
 *   isPickDest   — cyan dashed (swap: pick destination)
 *   isSwapSrc    — yellow (swap: original source cell)
 *   isSelected   — bright blue (tap-selected card can be placed here)
 *
 * Layer indicators:
 *   Top-right badge: shows stack count (1, 2, or 3) — always visible when card present
 *   Bottom-left L1 icon: shows under-card symbol when L2 is placed
 *   Bottom-left L2 icon: shows under-card symbol when L3 is placed (below L1)
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, Animated
} from 'react-native';
import { useGlow } from './GlowAnimator';
import { getSymbol } from '../symbols/symbols';
import { topSym } from '../game/engine/gameUtils';

function CellSymbol({ sym, tileSize }) {
  const d = getSymbol(sym);
  if (!d) return null;
  const color    = d.color ?? '#256af4';
  const iconSize = Math.floor(tileSize * 0.44);
  const nameSize = Math.max(7, Math.floor(tileSize * 0.13));
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Image source={d.icon} style={{ width: iconSize, height: iconSize, resizeMode: 'contain' }} />
      <Text style={{ color, fontSize: nameSize, fontWeight: '800' }} numberOfLines={1} adjustsFontSizeToFit>
        {d.label.toUpperCase()}
      </Text>
    </View>
  );
}

export default function GridCell({
  cell,
  r, c,
  tileSize,
  isGlowing,      // blue glow pulse
  hoverValid,     // blue highlight — dragged card is here, valid
  hoverInvalid,   // red highlight — dragged card is here, invalid
  swapMode,
  currentLayer,
  selIdx,         // selected hand card index (for tap-select highlight)
  canPlace,       // bool — can a card be placed here via tap-select
  onPress,
}) {
  const sym        = topSym(cell);
  const stackCount = cell.length;

  // Swap highlights
  const isPickBoard = swapMode?.step === 'pick_board' && stackCount >= 1;
  const isPickDest  = swapMode?.step === 'pick_dest'
    && !(r === swapMode.fromR && c === swapMode.fromC)
    && stackCount === currentLayer - 1;
  const isSwapSrc   = swapMode
    && (swapMode.step === 'pick_dest' || swapMode.step === 'pick_hand')
    && r === swapMode.fromR && c === swapMode.fromC;

  // Tap-select placement hint
  const isTapTarget = selIdx !== null && canPlace;

  const glow = useGlow(isGlowing || isPickBoard);
  const bw   = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const so   = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] });

  // Determine border color — priority order
  let borderColor = '#1E293B';  // default: slate-800 (empty cell)
  let borderWidth: any = bw;    // animated by default
  let borderStyle = 'solid';

  if (hoverInvalid) {
    borderColor = '#ef4444'; borderWidth = 2.5; // red — can't drop here
  } else if (hoverValid) {
    borderColor = '#22d3ee'; borderWidth = 2.5; // cyan — valid drop
  } else if (isSwapSrc) {
    borderColor = '#FACC15'; borderWidth = 2; borderStyle = 'solid';
  } else if (isPickDest) {
    borderColor = '#00e5ff'; borderWidth = 2; borderStyle = 'dashed';
  } else if (isPickBoard || isGlowing) {
    borderColor = '#256af4';
    // borderWidth stays animated
  } else if (sym) {
    borderColor = 'rgba(37,106,244,0.15)'; borderWidth = 1;
  } else if (isTapTarget) {
    borderColor = '#256af4'; borderWidth = 1.5; borderStyle = 'dashed';
  }

  // Layer corner icons
  const iconSz = Math.max(9, Math.floor(tileSize * 0.2));
  const l1Card = stackCount >= 2 ? cell[0] : null; // visible when L2 placed
  const l2Card = stackCount >= 3 ? cell[1] : null; // visible when L3 placed

  // Background colour changes on hover
  const bgColor = hoverValid   ? 'rgba(34,211,238,0.12)'
    : hoverInvalid             ? 'rgba(239,68,68,0.12)'
    : sym                      ? 'rgba(37,106,244,0.04)'
    : 'rgba(10,18,42,0.92)';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[
        styles.tile,
        {
          width: tileSize, height: tileSize,
          backgroundColor: bgColor,
          borderWidth: (hoverValid || hoverInvalid || isSwapSrc || isPickDest) ? borderWidth : bw,
          borderColor,
          borderStyle,
          shadowColor:   '#256af4',
          shadowOpacity: (hoverValid || hoverInvalid) ? 0 : so,
          shadowRadius:  14,
          shadowOffset:  { width: 0, height: 0 },
          elevation: isGlowing ? 6 : 0,
        },
      ]}>
        {/* Card face */}
        {sym && (
          <View style={[styles.cardFace, { width: '88%', height: '88%' }]}>
            <CellSymbol sym={sym} tileSize={tileSize} />
          </View>
        )}

        {/* ── Layer stack count badge — top-right corner ────────────
            Shows how many cards are stacked (1, 2, or 3).
            Visible whenever there is at least 1 card.
        ─────────────────────────────────────────────────────────── */}
        {stackCount > 0 && (
          <View style={styles.layerBadge}>
            <Text style={styles.layerBadgeText}>{stackCount}</Text>
          </View>
        )}

        {/* ── L1 icon — bottom-left ─────────────────────────────────
            Appears ONLY when Layer 2 card is placed on top.
            Shows the symbol of the card UNDER the current top.
            Shifts up when L2 icon also present.
        ─────────────────────────────────────────────────────────── */}
        {l1Card && (
          <View style={[styles.cornerIcon, { bottom: l2Card ? iconSz + 5 : 2, left: 2 }]}>
            <Image source={getSymbol(l1Card.sym)?.icon} style={{ width: iconSz, height: iconSz, resizeMode: 'contain' }} />
          </View>
        )}

        {/* ── L2 icon — bottom-left, below L1 ─────────────────────
            Appears ONLY when Layer 3 card is placed on top.
            Shows the symbol of the card second from bottom.
        ─────────────────────────────────────────────────────────── */}
        {l2Card && (
          <View style={[styles.cornerIcon, { bottom: 2, left: 2 }]}>
            <Image source={getSymbol(l2Card.sym)?.icon} style={{ width: iconSz, height: iconSz, resizeMode: 'contain' }} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius:   8,
    justifyContent: 'center',
    alignItems:     'center',
    overflow:       'visible',
  },
  cardFace: {
    borderRadius:    6,
    backgroundColor: '#f2e3c6',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  layerBadge: {
    position:        'absolute',
    top:             2,
    right:           2,
    backgroundColor: 'rgba(37,106,244,0.8)',
    borderRadius:    4,
    minWidth:        14,
    height:          14,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 2,
    zIndex:          10,
  },
  layerBadgeText: {
    color:       '#FFF',
    fontSize:    8,
    fontWeight:  '900',
    lineHeight:  10,
  },
  cornerIcon: {
    position:        'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius:    3,
    padding:         1,
    zIndex:          10,
  },
});
