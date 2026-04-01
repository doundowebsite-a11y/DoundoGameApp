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
  StyleSheet, Animated, PanResponder
} from 'react-native';
import { useGlow } from './GlowAnimator';
import { useSettings } from '../context/SettingsContext';
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
  glowReason,     // 'place' | 'ai' | 'swap' | 'opp' — used for color
  hoverValid,     // blue highlight — dragged card is here, valid
  hoverInvalid,   // red highlight — dragged card is here, invalid
  swapMode,
  currentLayer,
  selIdx,         // selected hand card index (for tap-select highlight)
  canPlace,       // bool — can a card be placed here via tap-select
  onPress,
  onDragStart,    // for swap drag
  onDragMove,
  onDrop,
}) {
  const pan = React.useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = React.useState(false);

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

  // Swap glow uses gold color, normal glow uses blue
  const { highContrast } = useSettings();
  const isSwapGlow = isGlowing && glowReason === 'swap';
  const glowColor = isSwapGlow ? (highContrast ? '#FFD700' : '#FACC15') : (highContrast ? '#38BDF8' : '#256af4');

  const glow = useGlow(isGlowing || isPickBoard);
  const hcMult = highContrast ? 1.5 : 1;
  const bw   = glow.interpolate({ inputRange: [0, 1], outputRange: isSwapGlow ? [1.5 * hcMult, 3 * hcMult] : [1 * hcMult, 2.5 * hcMult] });
  const so   = glow.interpolate({ inputRange: [0, 1], outputRange: isSwapGlow ? [0.2, 0.9] : [0, 0.65] });

  // Determine border color — priority order
  let borderColor = highContrast ? '#475569' : '#1E293B';  // default: slate-800 or slate-600
  let borderWidth = bw;    // animated by default
  let borderStyle = 'solid';

  if (hoverInvalid) {
    borderColor = highContrast ? '#FF2222' : '#ef4444'; borderWidth = highContrast ? 4 : 2.5; // red — can't drop here
  } else if (hoverValid) {
    borderColor = highContrast ? '#22FFFF' : '#22d3ee'; borderWidth = highContrast ? 4 : 2.5; // cyan — valid drop
  } else if (isSwapSrc) {
    borderColor = highContrast ? '#FFD700' : '#FACC15'; borderWidth = highContrast ? 3 : 2; borderStyle = 'solid';
  } else if (isPickDest) {
    borderColor = highContrast ? '#00FFFF' : '#00e5ff'; borderWidth = highContrast ? 3 : 2; borderStyle = 'dashed';
  } else if (isPickBoard || isGlowing) {
    borderColor = glowColor;
    // borderWidth stays animated
  } else if (sym) {
    borderColor = highContrast ? 'rgba(255,255,255,0.4)' : 'rgba(37,106,244,0.15)'; borderWidth = highContrast ? 2 : 1;
  } else if (isTapTarget) {
    borderColor = highContrast ? '#38BDF8' : '#256af4'; borderWidth = highContrast ? 2.5 : 1.5; borderStyle = 'dashed';
  }

  // PanResponder to drag board card (only when it's valid to pick for swap)
  const isDraggable = isPickBoard;
  const pr = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => isDraggable,
      onStartShouldSetPanResponderCapture: () => isDraggable,
      onMoveShouldSetPanResponder: (_, g) => isDraggable && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onMoveShouldSetPanResponderCapture: (_, g) => isDraggable && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),

      onPanResponderGrant: () => {
        pan.extractOffset();
        pan.setValue({ x: 0, y: 0 });
        setDragging(true);
        onDragStart?.(r, c);
      },
      onPanResponderMove: (e, g) => {
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, g);
        onDragMove?.(g.moveX, g.moveY);
      },
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        setDragging(false);
        onDragMove?.(null, null);
        const dropped = onDrop?.(r, c, g.moveX, g.moveY);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setDragging(false);
        onDragMove?.(null, null);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
      },
    })
  ).current;

  // Layer corner icons

  const iconSz = Math.max(9, Math.floor(tileSize * 0.2));
  const l1Card = stackCount >= 2 ? cell[0] : null; // visible when L2 placed
  const l2Card = stackCount >= 3 ? cell[1] : null; // visible when L3 placed

  // Background colour changes on hover
  const bgColor = hoverValid   ? (highContrast ? 'rgba(34,211,238,0.3)' : 'rgba(34,211,238,0.12)')
    : hoverInvalid             ? (highContrast ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.12)')
    : sym                      ? (highContrast ? 'rgba(0,0,0,0.8)' : 'rgba(37,106,244,0.04)')
    : (highContrast ? 'rgba(15,23,42,0.95)' : 'rgba(10,18,42,0.92)');

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
          shadowColor:   glowColor,
          shadowOpacity: (hoverValid || hoverInvalid) ? 0 : so,
          shadowRadius:  14,
          shadowOffset:  { width: 0, height: 0 },
          elevation: isGlowing ? 6 : 0,
        },
      ]}>
        {/* Card face */}
        {sym && (
          <Animated.View 
            {...pr.panHandlers}
            style={[styles.cardFace, { width: '88%', height: '88%', transform: dragging ? pan.getTranslateTransform() : [], zIndex: dragging ? 999 : 1 }]}
          >
            <CellSymbol sym={sym} tileSize={tileSize} />
          </Animated.View>
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
