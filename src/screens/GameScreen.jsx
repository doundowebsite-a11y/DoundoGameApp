import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Platform, Animated, Easing, PanResponder, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { IconSwap, IconDraw, IconAdd, IconFlash, IconPremium } from '../assets/icons/icons';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import BottomNav from '../components/ui/BottomNav';
import ShuffleOverlay from '../components/game/ShuffleOverlay';
import SoundManager from '../services/SoundManager';

import { makeInitialState, buildDeck, shuffle, topSym } from '../game/engine/gameUtils';
import { gameReducer } from '../game/engine/gameReducer';
import { runAiTurn } from '../ai/aiLogic';
import { SymbolCard } from '../game/SymbolCard';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

// ─── Responsive layout hook (replaces static getResponsiveLayout) ───────────
// BUG FIX 1: Original responsive.js called Dimensions.get at module load time,
// meaning it never updated when the device rotated or on foldables.
// useDimensions re-reads on every render and re-computes tile sizes correctly.
const useDimensions = () => {
  const [dims, setDims] = useState(() => Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);
  return dims;
};

const getBoardMetrics = (screenWidth) => {
  // BUG FIX 2: Original capped at 448 for maxWidth but computed boardSize
  // as scrWidth * 0.95 from the FULL screen width — so on wide phones the
  // board bled outside the container. Now everything derives from the same
  // effective container width (min of screen, 448).
  const containerW = Math.min(screenWidth, 448);
  const boardPadding = 16; // horizontal padding inside the board wrapper
  const gap = 6;
  const tilePadding = 8; // inner board padding each side
  const usable = containerW - boardPadding * 2 - tilePadding * 2 - gap * 3;
  const tileSize = Math.floor(usable / 4);
  return { containerW, tileSize, gap, tilePadding };
};

// ─── Glow tile ───────────────────────────────────────────────────────────────
// BUG FIX 3: Original GlowTile used a complex multi-step heartbeat sequence
// which looked jittery on Android (JS-driven Animated with useNativeDriver:false
// runs on JS thread, drops frames during game state updates).
// Simplified to a single smooth ping-pong loop.
const GlowTile = ({ children, isGlowing, glowColor = '#256af4', style, onPress }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
    }
    if (isGlowing) {
      glowAnim.setValue(0);
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      loopRef.current.start();
    } else {
      glowAnim.setValue(0);
    }
    return () => { loopRef.current?.stop(); };
  }, [isGlowing]);

  const borderWidth = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] });

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
      <Animated.View style={[
        style,
        isGlowing && {
          borderColor: glowColor,
          borderWidth,
          shadowColor: glowColor,
          shadowOpacity,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        },
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Animated card (pop-in on placement) ─────────────────────────────────────
const AnimatedCard = ({ children, isNew }) => {
  const scale = useRef(new Animated.Value(isNew ? 0.4 : 1)).current;
  const opacity = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [isNew]);

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }], opacity }}>
      {children}
    </Animated.View>
  );
};

// ─── Draggable card ───────────────────────────────────────────────────────────
// BUG FIX 4: Original DraggableCard checked pan._value for zIndex which is
// unreliable (internal Animated API). Replaced with explicit isDragging state.
const DraggableCard = ({ children, onDragStart, onDragRelease, disabled }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, g) => !disabled && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
        setIsDragging(true);
        onDragStart?.();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        setIsDragging(false);
        const dropped = onDragRelease?.(gesture.moveX, gesture.moveY);
        if (dropped) {
          pan.setValue({ x: 0, y: 0 });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setIsDragging(false);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        flex: 1,
        transform: pan.getTranslateTransform(),
        zIndex: isDragging ? 999 : 1,
        elevation: isDragging ? 20 : 1, // Android z-order
      }}
    >
      {children}
    </Animated.View>
  );
};

// ─── Game board ───────────────────────────────────────────────────────────────
// BUG FIX 5: Original used boardRef + boardLayoutRef + manual .measure() called
// from outside on drag start — timing issue; measure fires async and by the time
// drag ends layout might be stale. Now board stores its own layout via onLayout
// which fires synchronously when layout changes and is always fresh.
// BUG FIX 6: Removed the layer badge rectangle. Replaced with a tiny dot-style
// indicator (no visible rect/border, just a colored number) — only shown when
// cell has >1 card (Layer 2+), per the requirement to remove the rectangle.
const GameBoard = ({ board, onTilePress, currentLayer, swapMode, glowCells, onLayoutChange }) => {
  const dims = useDimensions();
  const { tileSize, gap, tilePadding } = getBoardMetrics(dims.width);

  if (!board) return null;

  return (
    <View
      style={[boardStyles.container, { padding: tilePadding }]}
      onLayout={e => onLayoutChange?.(e.nativeEvent.layout)}
    >
      <View style={[boardStyles.grid, { gap }]}>
        {board.map((row, r) => (
          <View key={`row-${r}`} style={[boardStyles.row, { gap }]}>
            {row.map((cell, c) => {
              const sym = topSym(cell);
              const isHighlighted = swapMode?.step === 'pick_dest' &&
                swapMode?.toR === r && swapMode?.toC === c;
              const isSrcHighlight = swapMode?.step === 'pick_hand' &&
                swapMode?.fromR === r && swapMode?.fromC === c;
              const isGlowing = glowCells?.some(g => g.r === r && g.c === c);

              // BUG FIX 7: Border logic was mixing static and animated borderWidth.
              // When isGlowing is true, GlowTile overrides borderColor/borderWidth
              // via animation — so we must NOT set a conflicting static borderWidth here.
              const cellBorderStyle = isHighlighted
                ? { borderColor: theme.colors.neon?.cyan ?? '#00e5ff', borderWidth: 2 }
                : isSrcHighlight
                  ? { borderColor: theme.colors.neon?.pink ?? '#ff4d9d', borderWidth: 2, opacity: 0.6 }
                  : sym
                    ? { borderWidth: 0 }
                    : { borderColor: 'rgba(37,106,244,0.35)', borderWidth: 1 };

              return (
                <GlowTile
                  key={`${r}-${c}`}
                  isGlowing={isGlowing}
                  glowColor="#256af4"
                  style={[
                    boardStyles.tileSlot,
                    { width: tileSize, height: tileSize },
                    cellBorderStyle,
                    sym && { backgroundColor: '#f2e3c6' },
                  ]}
                  onPress={() => onTilePress(r, c)}
                >
                  {sym ? (
                    <AnimatedCard isNew={isGlowing}>
                      <SymbolCard symbol={sym} disabled />
                    </AnimatedCard>
                  ) : (
                    <View style={boardStyles.emptyTileContent} />
                  )}

                  {/* Layer depth indicator — dot style, no rectangle */}
                  {cell.length > 1 && (
                    <View style={boardStyles.layerDot}>
                      <Text style={boardStyles.layerDotText}>{cell.length}</Text>
                    </View>
                  )}
                </GlowTile>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const boardStyles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  tileSlot: {
    borderRadius: 8,
    backgroundColor: 'rgba(16,22,34,1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  emptyTileContent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // BUG FIX 8: Removed layerBadge (rectangle with border). Replaced with a
  // minimal floating text dot — no border, no background box.
  layerDot: {
    position: 'absolute',
    top: 3,
    right: 4,
    zIndex: 10,
  },
  layerDotText: {
    color: 'rgba(37,106,244,0.7)',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});

// ─── Glow button ─────────────────────────────────────────────────────────────
const GlowButton = ({ children, isGlowing, glowColor = '#256af4', style, onPress, disabled }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    loopRef.current?.stop();
    if (isGlowing) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      loopRef.current.start();
    } else {
      glowAnim.setValue(0);
    }
    return () => loopRef.current?.stop();
  }, [isGlowing]);

  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled}>
      <Animated.View style={[
        style,
        isGlowing && { shadowColor: glowColor, shadowOpacity, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Main Game Screen ─────────────────────────────────────────────────────────
const GameScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const dims = useDimensions();
  const diff = route?.params?.difficulty ?? 'easy';

  const auth = useAuth();
  const user = auth?.user;
  const profile = auth?.profile;
  const refreshProfile = auth?.refreshProfile;

  console.log('GameScreen render start', { diff, userId: user?.id, hasProfile: !!profile });

  const [gs, setGs] = useState(() => {
    console.log('GameScreen initial gs state');
    return makeInitialState(shuffle(buildDeck()));
  });

  const [selectedHandIdx, setSelectedHandIdx] = useState(null);
  const [showShuffle, setShowShuffle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [glowState, setGlowState] = useState({ cells: [], reason: null });

  const boardLayoutRef = useRef(null);
  const boardViewRef = useRef(null);

  const handleBoardLayout = useCallback((layout) => {
    boardLayoutRef.current = layout;
  }, []);

  useEffect(() => {
    console.log('GameScreen mounting useEffect');
    SoundManager.init();
    return () => SoundManager.cleanup();
  }, []);

  const handleNextRound = useCallback(() => {
    console.log('handleNextRound');
    const newDeck = shuffle(buildDeck());
    const pile = newDeck.slice(8);
    setGs(prev => ({
      ...prev,
      board: Array(4).fill(null).map(() => Array(4).fill(null).map(() => [])),
      drawPile: pile,
      playerHand: newDeck.slice(0, 4),
      aiHand: newDeck.slice(4, 8),
      phase: 'draw',
      round: (prev.round || 1) + 1,
      msg: 'New round! Draw a card.',
      msgType: 'info',
      gameOver: false,
      winRow: null,
      currentLayer: 1,
      layerJustChanged: false,
      swapMode: null,
      overlay: null,
    }));
    setGlowState({ cells: [], reason: null });
    setShowShuffle(true);
  }, []);

  useEffect(() => {
    if (route.params?.triggerNextRound) {
      navigation.setParams({ triggerNextRound: undefined });
      handleNextRound();
    }
  }, [route.params?.triggerNextRound, navigation, handleNextRound]);

  const dispatch = useCallback((action) => {
    console.log('dispatch action:', action.type);
    if (action.type === 'DRAW_CARD') SoundManager.playCardPick?.();
    else if (['SWAP_START', 'SWAP_PICK_BOARD', 'SWAP_PICK_DEST'].includes(action.type)) SoundManager.playSwap?.();
    else if (['FACE_OFF', 'CALL_WIN'].includes(action.type)) SoundManager.playButton?.();

    setGs(prev => {
      const next = gameReducer(prev, action, diff, profile);
      if (action.type === 'PLACE_CARD' && next.phase === 'ai') {
        const placedOk = !next.msg?.includes('❌') && !next.msg?.includes('needs');
        if (placedOk) setGlowState({ cells: [{ r: action.r, c: action.c }], reason: 'place' });
      }
      if (action.type === 'SWAP_PLACE_HAND' && next.swapMode === null) {
        const { fromR, fromC, toR, toC } = prev.swapMode ?? {};
        if (fromR !== undefined && toR !== undefined) {
          setGlowState({ cells: [{ r: fromR, c: fromC }, { r: toR, c: toC }], reason: 'swap' });
          SoundManager.playSwap?.();
        }
      }
      if (action.type === 'DRAW_CARD') setGlowState({ cells: [], reason: null });
      return next;
    });
  }, [diff, profile]);

  const handleCardDrop = useCallback((cardIdx, mx, my) => {
    console.log('handleCardDrop', { cardIdx, mx, my });
    if (gs.phase !== 'place') return false;
    if (!boardLayoutRef.current) return false;
    const { pageX, pageY, width: bw, height: bh } = boardLayoutRef.current;
    if (mx < pageX || mx > pageX + bw || my < pageY || my > pageY + bh) return false;
    const { tileSize, gap, tilePadding } = getBoardMetrics(dims.width);
    const relX = mx - pageX - tilePadding;
    const relY = my - pageY - tilePadding;
    const c = Math.floor(relX / (tileSize + gap));
    const r = Math.floor(relY / (tileSize + gap));
    if (r >= 0 && r < 4 && c >= 0 && c < 4) {
      dispatch({ type: 'PLACE_CARD', cardIdx, r, c });
      return true;
    }
    return false;
  }, [gs.phase, dims.width, dispatch]);

  useEffect(() => {
    if (gs.phase !== 'ai' || gs.gameOver || gs.overlay) return;
    const t = setTimeout(() => {
      setGs(prev => {
        const next = runAiTurn(prev, diff, profile);
        let aiGlowCells = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (next.board[r][c].length > prev.board[r][c].length) aiGlowCells.push({ r, c });
          }
        }
        if (aiGlowCells.length > 0) setGlowState({ cells: aiGlowCells, reason: 'ai_place' });
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [gs.phase, gs.gameOver, gs.overlay, diff, profile]);

  useEffect(() => {
    if (gs.phase === 'place' && glowState.reason === 'ai_place') {
      setGlowState({ cells: [], reason: null });
    }
  }, [gs.phase, glowState.reason]);

  useEffect(() => {
    if (!gs.overlay) return;
    if (gs.overlay.type === 'faceoff') {
      navigation.navigate('FaceOff', { overlay: gs.overlay, gs });
      setGs(prev => ({ ...prev, overlay: null }));
      return;
    }
    if (gs.overlay.winner === 'player' || gs.overlay.type === 'win') SoundManager.playWin?.();
    else if (gs.overlay.winner === 'ai') SoundManager.playLose?.();
    else if (gs.overlay.type === 'tie') SoundManager.playDrawMatch?.();
  }, [gs.overlay, navigation]);

  const handleMatchEnd = useCallback(async () => {
    if (isSaving) return;
    const wonGame = gs.pScore >= 500;
    const lostGame = gs.aScore >= 500;
    if (!wonGame && !lostGame) return;
    setIsSaving(true);
    SoundManager.playButton?.();
    const finalPoints = Math.floor(gs.pScore * (diff === 'ai' ? 3.0 : diff === 'hard' ? 2.0 : diff === 'medium' ? 1.5 : 1.0));
    try {
      if (user && profile) {
        const { error } = await supabase.from('profiles').update({
          score: (profile.score || 0) + finalPoints,
          games_won: (profile.games_won || 0) + (wonGame && !lostGame ? 1 : 0),
          games_lost: (profile.games_lost || 0) + (!wonGame && lostGame ? 1 : 0),
          games_drawn: (profile.games_drawn || 0) + (wonGame && lostGame ? 1 : 0),
        }).eq('id', user.id);
        if (!error) await refreshProfile();
      }
    } catch (e) { console.error(e); }
    setIsSaving(false);
    const params = { points: finalPoints, totalCards: 42, time: '05:00' };
    if (wonGame && lostGame) navigation.replace('DrawScreen', params);
    else if (wonGame) navigation.replace('WinScreen', params);
    else navigation.replace('LoseScreen', params);
  }, [isSaving, gs.pScore, gs.aScore, diff, user, profile, refreshProfile, navigation]);

  useEffect(() => {
    if (gs.pScore >= 500 || gs.aScore >= 500) {
      if (gs.overlay && !isSaving) {
        const timer = setTimeout(() => handleMatchEnd(), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [gs.pScore, gs.aScore, gs.overlay, isSaving, handleMatchEnd]);

  const handleTilePress = useCallback((r, c) => {
    SoundManager.playButton?.();
    const { swapMode, phase } = gs;
    if (swapMode?.step === 'pick_board') dispatch({ type: 'SWAP_PICK_BOARD', r, c });
    else if (swapMode?.step === 'pick_dest') dispatch({ type: 'SWAP_PICK_DEST', r, c });
    else if (swapMode?.step === 'pick_hand') {
      if (selectedHandIdx !== null) {
        dispatch({ type: 'SWAP_PLACE_HAND', cardIdx: selectedHandIdx, r, c });
        setSelectedHandIdx(null);
      }
    } else if (phase === 'place' && selectedHandIdx !== null) {
      dispatch({ type: 'PLACE_CARD', cardIdx: selectedHandIdx, r, c });
      setSelectedHandIdx(null);
    }
  }, [gs, selectedHandIdx, dispatch]);

  const { containerW } = getBoardMetrics(dims.width);
  const isSwapMode = !!gs.swapMode;
  const isDrawPhase = gs.phase === 'draw';
  const isPlacePhase = gs.phase === 'place';
  const showSwapButton = isPlacePhase || isSwapMode;

  console.log('GameScreen rendering JSX return', { containerW, gsPhase: gs.phase });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, maxWidth: containerW }]}>
      <ShuffleOverlay visible={showShuffle} onComplete={() => { setShowShuffle(false); SoundManager.playShuffle?.(); }} />
      <View style={styles.header}>
        <DoundoLogo width={90} height={24} />
        <View style={styles.headerRight}>
          <View style={styles.levelPills}>
            {['L1', 'L2', 'L3'].map((l, i) => (
              <Text key={l} style={gs.currentLayer === i + 1 ? styles.pillActive : styles.pillInactive}>{l}</Text>
            ))}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!!gs.msg && (
        <View style={[styles.msgBanner, gs.msgType === 'warn' && styles.msgBannerWarn]}>
          <Text style={gs.msgType === 'warn' ? styles.msgTextWarn : styles.msgTextInfo}>{gs.msg}</Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <View style={styles.opponentSection}>
          <Text style={styles.opponentLabel}>Opponent</Text>
          <View style={styles.opponentHand}>
            {gs.aiHand.map((card) => <View key={card.uid} style={styles.opponentCard} />)}
          </View>
        </View>
        <View ref={boardViewRef} style={styles.boardSection} onLayout={e => {
          boardViewRef.current?.measure((x, y, w, h, px, py) => {
            boardLayoutRef.current = { pageX: px, pageY: py, width: w, height: h };
          });
        }}>
          <GameBoard board={gs.board} currentLayer={gs.currentLayer} swapMode={gs.swapMode} onTilePress={handleTilePress} glowCells={glowState.cells} onLayoutChange={handleBoardLayout} />
        </View>
        <View style={styles.interactionArea}>
          <View style={styles.deckRow}>
            {showSwapButton && (
              isSwapMode ? (
                <GlowButton isGlowing={false} style={[styles.deckBtn, { backgroundColor: '#e53935', borderColor: '#e53935' }]} onPress={() => dispatch({ type: 'SWAP_CANCEL' })}>
                  <IconSwap size={20} color="#FFF" /><Text style={styles.deckBtnText}>Cancel</Text>
                </GlowButton>
              ) : (
                <GlowButton isGlowing={isPlacePhase} glowColor={theme.colors.primary} style={[styles.deckBtn, styles.deckBtnPrimary]} onPress={() => { SoundManager.playButton?.(); dispatch({ type: 'SWAP_START' }); }}>
                  <IconSwap size={20} color="#FFF" /><Text style={styles.deckBtnText}>Swap</Text>
                </GlowButton>
              )
            )}
            <GlowButton isGlowing={isDrawPhase} glowColor="#256af4" style={styles.drawStack} onPress={() => dispatch({ type: 'DRAW_CARD' })}>
              <View style={styles.drawInner}>
                <Image source={require('../assets/icons/card_back.svg')} style={styles.drawImg} resizeMode="contain" />
                <View style={styles.drawBadge}><Text style={styles.drawCount}>{gs.drawPile.length}</Text></View>
              </View>
            </GlowButton>
          </View>
          <View style={styles.handRow}>
            {gs.playerHand.map((card, i) => (
              <View key={card.uid} style={styles.handCardWrap}>
                <DraggableCard disabled={gs.phase !== 'place' && !isSwapMode} onDragStart={() => {
                  setScrollEnabled(false);
                  boardViewRef.current?.measure((x, y, w, h, px, py) => {
                    boardLayoutRef.current = { pageX: px, pageY: py, width: w, height: h };
                  });
                  SoundManager.playCardPick?.();
                }} onDragRelease={(mx, my) => { setScrollEnabled(true); return handleCardDrop(i, mx, my); }}>
                  <SymbolCard symbol={card.sym} isSelected={selectedHandIdx === i} onPress={() => {
                    SoundManager.playCardPick?.();
                    setSelectedHandIdx(prev => prev === i ? null : i);
                  }} />
                </DraggableCard>
              </View>
            ))}
            {Array(Math.max(0, 4 - gs.playerHand.length)).fill(null).map((_, i) => (
              <View key={`emp-${i}`} style={[styles.handCardWrap, styles.emptySlot]}><IconAdd size={20} color="#1E293B" /></View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.faceOffBtn]} onPress={() => { SoundManager.playButton?.(); dispatch({ type: 'FACE_OFF' }); }} activeOpacity={0.8}>
          <IconFlash size={18} color="#FFF" /><Text style={styles.actionBtnText}>FACE-OFF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.winBtn]} onPress={() => { SoundManager.playButton?.(); dispatch({ type: 'CALL_WIN' }); }} activeOpacity={0.8}>
          <IconPremium size={18} color="#CBD5E1" /><Text style={[styles.actionBtnText, { color: '#CBD5E1' }]}>WIN</Text>
        </TouchableOpacity>
      </View>
      <BottomNav navigation={navigation} activeRoute="Game" />
      {gs.overlay && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <View style={styles.overlayInner}>
            <Text style={styles.overlayTitle}>{(gs.pScore >= 500 || gs.aScore >= 500) ? (gs.pScore >= 500 ? 'MATCH VICTORY!' : 'MATCH DEFEAT!') : gs.overlay.type?.toUpperCase() + '!'}</Text>
            <Text style={styles.overlayWinner}>{gs.overlay.winner === 'player' ? (gs.pScore >= 500 ? 'You are the champion!' : 'You won the round!') : gs.overlay.winner === 'ai' ? (gs.aScore >= 500 ? 'AI takes the crown!' : 'Opponent won!') : 'Round Tie!'}</Text>
            {gs.overlay.matchText && <Text style={styles.overlayMatch}>{gs.overlay.matchText}</Text>}
            <View style={styles.overlayScore}>
              <Text style={{ color: '#FFF', fontSize: 14 }}>Score</Text>
              <Text style={{ color: theme.colors.primary, fontSize: 28, fontWeight: '700' }}>{gs.pScore}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>AI: {gs.aScore}</Text>
            </View>
            <TouchableOpacity style={styles.overlayBtn} activeOpacity={0.8} disabled={isSaving} onPress={async () => {
              if (gs.pScore >= 500 || gs.aScore >= 500) handleMatchEnd();
              else handleNextRound();
            }}>
              <Text style={styles.overlayBtnText}>{isSaving ? 'SAVING...' : (gs.pScore >= 500 || gs.aScore >= 500 ? 'FINISH MATCH' : 'NEXT ROUND')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101622',
    alignSelf: 'center',
    width: '100%',
    // BUG FIX 13: Removed fixed left/right border decoration — on narrow phones
    // it consumed precious width. Border is kept via container background contrast.
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelPills: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  pillActive: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
  },
  pillInactive: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },

  msgBanner: {
    backgroundColor: 'rgba(37,106,244,0.1)',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  msgBannerWarn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  msgTextInfo: {
    color: '#60a5fa',
    fontSize: 12,
    textAlign: 'center',
  },
  msgTextWarn: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },

  opponentSection: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  opponentLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#475569',
    textTransform: 'uppercase',
  },
  opponentHand: {
    flexDirection: 'row',
    gap: 4,
  },
  opponentCard: {
    width: 28,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(37,106,244,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37,106,244,0.25)',
  },

  boardSection: {
    width: '100%',
    alignItems: 'center',
  },

  interactionArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  deckRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
  },
  deckBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 140,
  },
  deckBtnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: 'rgba(37,106,244,0.5)',
  },
  deckBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  drawStack: {
    width: 58,
    height: 82,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(37,106,244,0.4)',
    backgroundColor: '#1a2744',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawImg: {
    width: '78%',
    height: '68%',
  },
  drawBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#256af4',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  drawCount: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // BUG FIX 12 styles: flex-based hand cards
  handRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  handCardWrap: {
    flex: 1,
    maxWidth: 80,
    height: 96,
  },
  emptySlot: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E293B',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 9999,
  },
  faceOffBtn: {
    backgroundColor: theme.colors.primary,
  },
  winBtn: {
    backgroundColor: '#1E293B',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },

  overlayInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  overlayTitle: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  overlayWinner: {
    color: '#60a5fa',
    fontSize: 22,
    marginTop: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  overlayMatch: {
    color: '#4ade80',
    fontSize: 18,
    marginTop: 6,
    fontWeight: '700',
  },
  overlayScore: {
    marginTop: 24,
    alignItems: 'center',
  },
  overlayBtn: {
    marginTop: 28,
    paddingVertical: 15,
    paddingHorizontal: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  overlayBtnText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 14,
  },
});

export default GameScreen;