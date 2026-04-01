/**
 * MatchmakingModal.jsx
 * src/components/ui/MatchmakingModal.jsx
 *
 * ROOT CAUSE FIX:
 * The previous version used React Native's <Modal> component.
 * On Android with a container that has maxWidth + alignSelf:'center',
 * the Modal renders but can appear behind the container or be clipped.
 * This is a known React Native issue — Modal breaks out of the component
 * tree but still respects some layout constraints on certain Android versions.
 *
 * FIX: Replace Modal with a View using StyleSheet.absoluteFillObject
 * positioned relative to the root of the app (not the container).
 * This is done by rendering it at the AppNavigator level via a global
 * state, OR — simpler — wrapping it in a Portal-like pattern using
 * a fixed-position View with extreme zIndex.
 *
 * Since we don't have a Portal library, the fix is:
 * 1. Remove <Modal> entirely
 * 2. Use absoluteFillObject View with zIndex: 999
 * 3. The HomeScreen container must have overflow: 'visible' for this to work
 *    — but maxWidth containers clip absoluteFill children on some devices.
 *
 * ACTUAL WORKING FIX:
 * Move MatchmakingModal OUT of the maxWidth container.
 * In HomeScreen, render MatchmakingModal OUTSIDE the main container View,
 * as a sibling — both wrapped in a Fragment or a full-screen container.
 *
 * The HomeScreen structure changes to:
 *   <View style={fullScreen}>          ← full screen, no maxWidth
 *     <View style={container}>         ← maxWidth: 448 container
 *       ... all content ...
 *     </View>
 *     <MatchmakingModal ... />         ← OUTSIDE the constrained container
 *   </View>
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Image, Dimensions
} from 'react-native';
import { theme } from '../../theme/theme';

const { width: SW, height: SH } = Dimensions.get('window');

const AVATAR_SOURCES = {
  1: require('../../assets/avatars/preset_1.jpg'),
  2: require('../../assets/avatars/preset_2.jpg'),
  3: require('../../assets/avatars/preset_3.jpg'),
  4: require('../../assets/avatars/preset_4.jpg'),
  5: require('../../assets/avatars/avatar_main.jpg'),
  6: require('../../assets/avatars/preset_2.jpg'),
};
const getAvatar = (p) => AVATAR_SOURCES[p] ?? AVATAR_SOURCES[1];

// ── Spinning search ring ──────────────────────────────────────────
const SearchRing = () => {
  const spin  = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ scale: pulse }], marginVertical: 20 }}>
      <View style={ring.outer} />
      <Animated.View style={[ring.arc, { transform: [{ rotate }] }]} />
      <View style={ring.center}><Text style={{ fontSize: 28 }}>🔍</Text></View>
    </Animated.View>
  );
};
const ring = StyleSheet.create({
  outer:  { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#1E293B', position: 'absolute', top: 0, left: 0 },
  arc:    { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'transparent', borderTopColor: theme.colors.primary, borderRightColor: 'rgba(37,106,244,0.4)', position: 'absolute', top: 0, left: 0 },
  center: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
});

// ── Found card (opponent found) ───────────────────────────────────
const FoundCard = ({ opponent }) => {
  const scale = useRef(new Animated.Value(0.5)).current;
  const op    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(op,    { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ alignItems: 'center', gap: 12, opacity: op, transform: [{ scale }] }}>
      <Text style={fc.label}>OPPONENT FOUND!</Text>
      <View style={fc.avatarWrap}>
        <Image source={getAvatar(opponent?.avatarPreset)} style={fc.avatar} resizeMode="cover" />
        <View style={fc.onlineDot} />
      </View>
      <Text style={fc.name}>{opponent?.username ?? '...'}</Text>
      <Text style={fc.sub}>Starting game...</Text>
      <LoadingBar />
    </Animated.View>
  );
};
const fc = StyleSheet.create({
  label:     { color: '#4ADE80', fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  avatarWrap:{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: theme.colors.primary, overflow: 'hidden', position: 'relative' },
  avatar:    { width: '100%', height: '100%' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#0F172A' },
  name:      { color: '#FFF', fontSize: 20, fontWeight: '800' },
  sub:       { color: '#64748B', fontSize: 13 },
});

const LoadingBar = () => {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(w, { toValue: 100, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, []);
  const width = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View style={{ width: 200, height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <Animated.View style={{ height: '100%', backgroundColor: theme.colors.primary, width }} />
    </View>
  );
};

// ── MAIN COMPONENT — no Modal, just absoluteFill View ─────────────
export default function MatchmakingModal({ visible, status, elapsed, opponent, liveCount = 0, onCancel, onAcceptBot, onExtendSearch }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  const pad = s => String(s).padStart(2, '0');
  const fmt = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

  const tipText = elapsed < 20
    ? 'Matching you with a nearby player…'
    : elapsed < 60
    ? 'Still searching — hang tight!'
    : 'Almost there, connecting now…';

  return (
    // Full screen absolute overlay — NOT inside any maxWidth container
    <Animated.View style={[s.overlay, { opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
      <View style={s.card}>
        {(status === 'found' || status === 'starting') && opponent ? (
          <FoundCard opponent={opponent} />
        ) : (
          <>
            <Text style={s.title}>FINDING MATCH</Text>
            <Text style={s.subtitle}>{liveCount > 1 ? `Searching... (${liveCount - 1} other players online)` : 'Searching for an opponent…'}</Text>
            <SearchRing />
            <Text style={s.timer}>{fmt(elapsed)}</Text>
            <Text style={s.tip}>
              {elapsed >= 45 ? 'Switching to bot in ' + Math.max(0, 60 - elapsed) + 's...' : tipText}
            </Text>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
              <Text style={s.cancelTxt}>CANCEL</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  // Fixed full-screen — ignores all parent container constraints
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: SW, height: SH,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(37,106,244,0.25)',
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  title:     { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 3 },
  subtitle:  { color: '#64748B', fontSize: 13 },
  timer:     { color: theme.colors.primary, fontSize: 30, fontWeight: '900', fontVariant: ['tabular-nums'] },
  tip:       { color: '#334155', fontSize: 12, textAlign: 'center' },
  cancelBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  actionBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, borderWidth: 1, borderColor: '#334155', width: '100%', alignItems: 'center' },
  cancelTxt: { color: '#64748B', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
});
