/**
 * HandCard.jsx
 * src/game/HandCard.jsx
 *
 * Player hand card. Supports BOTH:
 *   1. TAP to select, then TAP a board cell to place
 *   2. DRAG and DROP onto board cells with live cell highlighting
 *
 * DRAG FIXES:
 *   - PanResponder created ONCE in useRef — never recreated
 *   - Callbacks (onDrop, onDragStart, onDragMove) stored in refs
 *     so PanResponder closure always gets fresh values without recreation
 *   - Uses extractOffset() so card lifts from current visual position
 *   - onDragMove fires during drag to tell GameScreen which cell
 *     is currently being hovered (for live highlight)
 *
 * DROP FIX:
 *   - g.moveX / g.moveY are the FINAL page coordinates at release
 *   - These are passed to onDrop which recalculates cell from boardLayout
 *   - onDrop returns true only if coords are inside board bounds
 *     AND map to a valid cell — otherwise card springs back
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Animated, PanResponder, StyleSheet
} from 'react-native';
import SoundManager from '../services/SoundManager';
import { getSymbol } from '../symbols/symbols';

export default function HandCard({
  card,
  idx,
  cardW,
  cardH,
  disabled,
  isSelected,
  onTap,
  onDragStart,
  onDragMove,   // (pageX, pageY) => void  — live position during drag
  onDrop,       // (idx, pageX, pageY) => boolean
}) {
  const pan   = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  // ── Stable refs for all callbacks ─────────────────────────────────
  const cbDragStart = useRef(onDragStart);
  const cbDragMove  = useRef(onDragMove);
  const cbDrop      = useRef(onDrop);
  const cbDisabled  = useRef(disabled);
  const cbIdx       = useRef(idx);

  useEffect(() => { cbDragStart.current = onDragStart; }, [onDragStart]);
  useEffect(() => { cbDragMove.current  = onDragMove;  }, [onDragMove]);
  useEffect(() => { cbDrop.current      = onDrop;      }, [onDrop]);
  useEffect(() => { cbDisabled.current  = disabled;    }, [disabled]);
  useEffect(() => { cbIdx.current       = idx;         }, [idx]);

  // ── PanResponder — stable, created once ───────────────────────────
  const pr = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !cbDisabled.current,
      onStartShouldSetPanResponderCapture: () => !cbDisabled.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !cbDisabled.current && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !cbDisabled.current && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),

      onPanResponderGrant: () => {
        pan.extractOffset();
        pan.setValue({ x: 0, y: 0 });
        setDragging(true);
        cbDragStart.current?.();
        SoundManager.playCardPick?.();
      },

      onPanResponderMove: (e, g) => {
        // Update pan position
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, g);
        // Fire live hover event so board can highlight the cell under finger
        cbDragMove.current?.(g.moveX, g.moveY);
      },

      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        setDragging(false);
        cbDragMove.current?.(null, null); // clear hover highlight
        const dropped = cbDrop.current?.(cbIdx.current, g.moveX, g.moveY);
        if (dropped) {
          pan.setValue({ x: 0, y: 0 });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6, tension: 80,
            useNativeDriver: false,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setDragging(false);
        cbDragMove.current?.(null, null);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 6, useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const d = getSymbol(card?.sym);
  const accentColor = d?.color ?? '#256af4';
  const iconSize    = Math.floor(cardW * 0.46);
  const nameSize    = Math.max(8, Math.floor(cardW * 0.14));

  return (
    <Animated.View
      {...pr.panHandlers}
      style={{
        width: cardW, height: cardH,
        transform: [...pan.getTranslateTransform(), { scale: dragging ? 1.1 : 1 }],
        zIndex:    dragging ? 999 : 1,
        elevation: dragging ? 20  : 2,
      }}
    >
      <TouchableOpacity
        onPress={onTap}
        activeOpacity={0.85}
        style={[
          styles.card, { width: cardW, height: cardH },
          isSelected && {
            borderColor:   accentColor,
            borderWidth:   2.5,
            shadowColor:   accentColor,
            shadowOpacity: 0.85,
            shadowRadius:  12,
            elevation:     10,
          },
        ]}
      >
        {d ? (
          <>
            <Image source={d.icon} style={{ width: iconSize, height: iconSize, resizeMode: 'contain' }} />
            <Text style={{ color: accentColor, fontSize: nameSize, fontWeight: '800', marginTop: 3 }} numberOfLines={1} adjustsFontSizeToFit>
              {d.label.toUpperCase()}
            </Text>
          </>
        ) : (
          <Text style={{ color: '#64748B', fontSize: 20 }}>?</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius:    8,
    backgroundColor: '#f2e3c6',
    borderWidth:     1.5,
    borderColor:     'rgba(37,106,244,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOpacity:   0.2,
    shadowRadius:    3,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
});
