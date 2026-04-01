/**
 * HandCard.jsx — src/game/HandCard.jsx
 * PNG icons — uses <Image source={d.icon}> directly.
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  Animated, PanResponder, StyleSheet
} from 'react-native';
import SoundManager from '../services/SoundManager';
import { getSymbol } from '../symbols/symbols';
import { useSettings } from '../context/SettingsContext';

export default function HandCard({
  card, idx, cardW, cardH,
  disabled, isSelected, hintCount = 0, isSwapTarget = false,
  onTap, onDragStart, onDragMove, onDrop,
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const { highContrast } = useSettings();

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
        Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        )(e, g);
        cbDragMove.current?.(g.moveX, g.moveY);
      },
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        setDragging(false);
        cbDragMove.current?.(null, null);
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

  const d          = getSymbol(card?.sym);
  const accentColor = d?.color ?? '#256af4';
  const iconSize    = Math.floor(cardW * 0.55);
  const nameSize    = Math.max(9, Math.floor(cardW * 0.15));

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
          styles.card,
          { width: cardW, height: cardH, 
            backgroundColor: highContrast ? '#FFFFFF' : '#f2e3c6',
            borderColor: highContrast ? '#333333' : 'rgba(37,106,244,0.2)',
            borderWidth: highContrast ? 2 : 1.5,
          },
          isSelected && {
            borderColor:   highContrast ? '#000000' : accentColor,
            borderWidth:   highContrast ? 4 : 2.5,
            shadowColor:   highContrast ? '#000000' : accentColor,
            shadowOpacity: highContrast ? 1 : 0.85,
            shadowRadius:  highContrast ? 16 : 12,
            elevation:     15,
          },
          isSwapTarget && {
            borderColor: '#FACC15',
            borderWidth: 3,
            shadowColor: '#FACC15',
            shadowOpacity: 1,
            shadowRadius: 10,
          }
        ]}
      >
        {isSwapTarget && (
           <View style={{ position: 'absolute', top: -12, backgroundColor: '#FACC15', paddingHorizontal: 6, borderRadius: 4, zIndex: 20 }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>TAP TO SWAP</Text>
           </View>
        )}
        {d ? (
          <>
            <Image
              source={d.icon}
              style={{ width: iconSize, height: iconSize }}
              resizeMode="contain"
            />
            <Text
              style={{
                color: accentColor,
                fontSize: nameSize,
                fontWeight: '800',
                marginTop: 2,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {d.label.toUpperCase()}
            </Text>
            {hintCount > 0 && (
              <View style={styles.hintBadge}>
                <Text style={styles.hintText}>{hintCount}</Text>
              </View>
            )}
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
    overflow:        'visible', // Changed from 'hidden' to show badge
    shadowColor:     '#000',
    shadowOpacity:   0.2,
    shadowRadius:    3,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  hintBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    zIndex: 10,
  },
  hintText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
});
