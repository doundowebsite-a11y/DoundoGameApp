/**
 * DealAnimation.jsx
 * Place at: src/game/DealAnimation.jsx
 *
 * DESIGN PRINCIPLE (Senior Designer note):
 * The deal animation is a "theatre moment" — it should feel like a real
 * card dealer. Cards start as a shuffled stack at the center, riffle from
 * a 3/4 side angle (not top-down), then fly individually to each player's
 * exact hand slots. The remaining deck slides to the draw pile position.
 *
 * COORDINATE SYSTEM (Senior Dev note):
 * All slot positions are passed as page-level coordinates from measure().
 * The overlay is absoluteFillObject inside the container, so we subtract
 * the container's own page position to get container-local coords.
 * Then we offset by container center to get animation offsets from origin.
 *
 * 3/4 SIDE-ANGLE RIFFLE:
 * - Cards spread left/right on X axis (side view)
 * - Cards arch upward on Y (the "bow" of a real riffle)
 * - Small rotateX (15°) gives the 3/4 perspective tilt — not top-down,
 *   not fully side-on, but the in-between angle a player would see
 *   when shuffling cards held in front of them
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, Dimensions } from 'react-native';
import SoundManager from '../services/SoundManager';

const CARD_W = 46;
const CARD_H = 66;
const N_DEAL = 8; // 4 opponent + 4 player

export default function DealAnimation({
  visible,
  onComplete,
  // Container's own page position (from containerRef.measure)
  containerPageX,
  containerPageY,
  containerWidth,
  containerHeight,
  // Exact measured page coords of each slot in the game screen
  // Each is { x, y, width, height } from ref.measure()
  opponentSlots,   // [o1, o2, o3, o4]
  playerSlots,     // [u1, u2, u3, u4]
  deckPosition,    // { x, y, width, height } of the draw deck button
}) {
  // Container center in page coords — our animation pivot
  const CX = (containerPageX || 0) + (containerWidth  || Dimensions.get('window').width)  / 2;
  const CY = (containerPageY || 0) + (containerHeight || Dimensions.get('window').height) / 2;

  // Convert any page-coord point to offset from container center
  // This is the value we pass to translateX/translateY
  const toOffset = (pageX, pageY) => ({
    x: pageX - CX,
    y: pageY - CY,
  });

  const cards = useRef(
    Array.from({ length: N_DEAL }, () => ({
      x:       new Animated.Value(0),
      y:       new Animated.Value(0),
      rotZ:    new Animated.Value(0),
      rotX:    new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale:   new Animated.Value(0.9),
    }))
  ).current;

  const deckX   = useRef(new Animated.Value(0)).current;
  const deckY   = useRef(new Animated.Value(0)).current;
  const deckOp  = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset all
    cards.forEach(c => {
      c.x.setValue(0); c.y.setValue(0);
      c.rotZ.setValue(0); c.rotX.setValue(0);
      c.opacity.setValue(0); c.scale.setValue(0.9);
    });
    deckX.setValue(0); deckY.setValue(0);
    deckOp.setValue(0); fadeOut.setValue(1);

    // ── PHASE 1: Stack appears at center ─────────────────────────
    const appear = cards.map((c, i) =>
      Animated.parallel([
        Animated.timing(c.opacity, { toValue: 1, duration: 50, delay: i * 10, useNativeDriver: true }),
        Animated.timing(c.scale,   { toValue: 1, duration: 70, delay: i * 10, useNativeDriver: true }),
        // Tiny stagger offset so depth is visible
        Animated.timing(c.x, { toValue: i * 1.0 - N_DEAL * 0.5, duration: 70, delay: i * 10, useNativeDriver: true }),
      ])
    );

    // ── PHASE 2: 3/4 SIDE-ANGLE RIFFLE ──────────────────────────
    // What this looks like: holding cards in both hands in front of you,
    // bending them upward, cards interleaving from the middle.
    // Camera angle: slightly above, slightly to the side = 3/4 view.
    //
    // Left half: slides LEFT, tilts CCW (rotZ negative), arches up
    // Right half: slides RIGHT, tilts CW (rotZ positive), arches up
    // rotX = 15° gives the 3/4 perspective — top of card tilts away

    const buildRiffleOut = (spread, arch, rotZMax, rotXVal) =>
      cards.map((c, i) => {
        const isLeft   = i < N_DEAL / 2;
        // Arch: highest in the middle of each half, lower at edges
        const halfNorm = isLeft
          ? i / (N_DEAL / 2 - 1)
          : (i - N_DEAL / 2) / (N_DEAL / 2 - 1);
        const archY = -Math.sin(halfNorm * Math.PI) * arch;

        return Animated.parallel([
          Animated.timing(c.x, {
            toValue: isLeft
              ? -spread + i * (spread / (N_DEAL / 2)) * 0.6
              : (i - N_DEAL / 2) * (spread / (N_DEAL / 2)) * 0.6 + spread * 0.3,
            duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true,
          }),
          Animated.timing(c.y, { toValue: archY, duration: 180, useNativeDriver: true }),
          Animated.timing(c.rotZ, {
            toValue: isLeft ? -rotZMax + i * (rotZMax / (N_DEAL / 2)) : (i - N_DEAL / 2) * (rotZMax / (N_DEAL / 2)),
            duration: 180, useNativeDriver: true,
          }),
          Animated.timing(c.rotX, { toValue: rotXVal, duration: 180, useNativeDriver: true }),
        ]);
      });

    const buildRiffleIn = () =>
      cards.map((c, i) => {
        const norm = i / (N_DEAL - 1) - 0.5;
        return Animated.parallel([
          Animated.spring(c.x,    { toValue: norm * 4, friction: 7, tension: 90, useNativeDriver: true }),
          Animated.spring(c.y,    { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }),
          Animated.spring(c.rotZ, { toValue: 0, friction: 7, useNativeDriver: true }),
          Animated.spring(c.rotX, { toValue: 0, friction: 7, useNativeDriver: true }),
        ]);
      });

    const riffleOut1  = buildRiffleOut(44, 32, 20, 15);
    const riffleIn1   = buildRiffleIn();
    const riffleOut2  = buildRiffleOut(34, 24, 15, 12);
    const riffleIn2   = buildRiffleIn();

    // ── PHASE 3: DEAL TO EXACT POSITIONS ─────────────────────────
    // Cards 0-3 → opponent slots (o1..o4)
    // Cards 4-7 → player slots  (u1..u4)
    // Each card flies independently with 75ms stagger

    const deal = cards.map((c, i) => {
      const isPlayer = i >= 4;
      const si       = isPlayer ? i - 4 : i;
      const slots    = isPlayer ? playerSlots : opponentSlots;
      const slot     = slots?.[si];

      let destX, destY;
      if (slot && slot.x !== undefined && slot.y !== undefined) {
        // Slot center in page coords → offset from container center
        const off = toOffset(slot.x + slot.width / 2, slot.y + slot.height / 2);
        destX = off.x;
        destY = off.y;
      } else {
        // Fallback (should not happen if measure works)
        const gap  = CARD_W + 8;
        destX = (si - 1.5) * gap;
        destY = isPlayer ? (containerHeight / 2) * 0.5 : -(containerHeight / 2) * 0.65;
      }

      return Animated.parallel([
        Animated.spring(c.x, {
          toValue: destX, friction: 7, tension: 50,
          delay: i * 75, useNativeDriver: true,
        }),
        Animated.spring(c.y, {
          toValue: destY, friction: 7, tension: 50,
          delay: i * 75, useNativeDriver: true,
        }),
        Animated.timing(c.rotZ,  { toValue: 0, duration: 220, delay: i * 75, useNativeDriver: true }),
        Animated.timing(c.rotX,  { toValue: 0, duration: 220, delay: i * 75, useNativeDriver: true }),
        Animated.timing(c.scale, { toValue: 0.88, duration: 200, delay: i * 75, useNativeDriver: true }),
      ]);
    });

    // ── PHASE 4: DECK → DRAW PILE POSITION ───────────────────────
    let deckDestX = 30, deckDestY = (containerHeight / 2) * 0.45;

    if (deckPosition && deckPosition.x !== undefined) {
      const off = toOffset(
        deckPosition.x + deckPosition.width  / 2,
        deckPosition.y + deckPosition.height / 2,
      );
      deckDestX = off.x;
      deckDestY = off.y;
    }

    const deckAnim = Animated.parallel([
      Animated.timing(deckOp, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.spring(deckX, { toValue: deckDestX, friction: 7, tension: 38, useNativeDriver: true }),
      Animated.spring(deckY, { toValue: deckDestY, friction: 7, tension: 38, useNativeDriver: true }),
    ]);

    // ── PHASE 5: FADE OUT ─────────────────────────────────────────
    const fade = Animated.timing(fadeOut, {
      toValue: 0, duration: 320,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    });

    // ── RUN ───────────────────────────────────────────────────────
    Animated.sequence([
      Animated.stagger(10, appear),
      Animated.delay(50),
      Animated.parallel(riffleOut1),
      Animated.delay(140),
      Animated.parallel(riffleIn1),
      Animated.delay(40),
      Animated.parallel(riffleOut2),
      Animated.delay(110),
      Animated.parallel(riffleIn2),
      Animated.delay(60),
      Animated.parallel(deal),
      Animated.delay(260),
      deckAnim,
      Animated.delay(360),
      fade,
    ]).start(() => {
      SoundManager.playShuffle?.();
      onComplete?.();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { opacity: fadeOut, zIndex: 200 }]}
      pointerEvents="none"
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5,9,20,0.94)' }]} />

      {/* All cards positioned relative to container center */}
      <View style={styles.pivot}>

        {cards.map((c, i) => {
          const rotZ = c.rotZ.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });
          const rotX = c.rotX.interpolate({ inputRange: [-90, 90], outputRange: ['-90deg', '90deg'] });
          return (
            <Animated.View key={i} style={[styles.card, {
              opacity: c.opacity,
              transform: [
                { translateX: c.x },
                { translateY: c.y },
                { scale: c.scale },
                { rotateX: rotX },   // 3/4 perspective tilt
                { rotate: rotZ },    // left/right fan
              ],
            }]}>
              <Image
                source={require('../assets/icons/card_back.svg')}
                style={styles.cardImg}
                resizeMode="cover"
              />
            </Animated.View>
          );
        })}

        {/* Deck stack → slides to draw position */}
        <Animated.View style={[styles.card, {
          opacity: deckOp,
          transform: [{ translateX: deckX }, { translateY: deckY }],
        }]}>
          <Image
            source={require('../assets/icons/card_back.svg')}
            style={styles.cardImg}
            resizeMode="cover"
          />
        </Animated.View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pivot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width:      CARD_W,
    height:     CARD_H,
    marginLeft: -CARD_W / 2,
    marginTop:  -CARD_H / 2,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#1a2744',
    borderWidth: 1,
    borderColor: 'rgba(37,106,244,0.4)',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
});
