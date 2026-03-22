import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Animated, Easing, PanResponder, Dimensions, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { DoundoLogo } from '../assets/logo/doundo_logo';
import { IconFlash, IconPremium, IconAdd } from '../assets/icons/icons';
import SoundManager from '../services/SoundManager';
import { makeInitialState, buildDeck, shuffle, topSym } from '../game/engine/gameUtils';
import { gameReducer } from '../game/engine/gameReducer';
import { runAiTurn } from '../ai/aiLogic';
import { SymbolCard, CardBack } from '../game/SymbolCard';
import { useAuth } from '../context/AuthContext';
import { getSymbol } from '../symbols/symbols';
import { useDimensions, getBoardMetrics } from '../utils/responsive';

// ─── RESPONSIVE METRICS ─────────────────────────────────────────────────────
const useBoardMetrics = () => {
  const dims = useDimensions();
  return getBoardMetrics(dims.width);
};

// ─── GLOW TILE ───────────────────────────────────────────────────────────────
const GlowTile = ({ children, isGlowing, glowColor = '#256af4', style, onPress }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const loop = useRef(null);

  useEffect(() => {
    loop.current?.stop();
    if (isGlowing) {
      anim.setValue(0);
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.3, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      loop.current.start();
    } else {
      anim.setValue(0);
    }
    return () => loop.current?.stop();
  }, [isGlowing]);

  const bw = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[
        style,
        isGlowing && {
          borderColor: glowColor, borderWidth: bw,
          shadowColor: glowColor, shadowOpacity: so,
          shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8,
        },
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── GLOW BUTTON ─────────────────────────────────────────────────────────────
const GlowButton = ({ children, isGlowing, glowColor = '#256af4', style, onPress, disabled }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const loop = useRef(null);

  useEffect(() => {
    loop.current?.stop();
    if (isGlowing && !disabled) {
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      loop.current.start();
    } else {
      anim.setValue(0);
    }
    return () => loop.current?.stop();
  }, [isGlowing, disabled]);

  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.85] });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled}>
      <Animated.View style={[
        style,
        isGlowing && !disabled && {
          shadowColor: glowColor, shadowOpacity: so,
          shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 10,
        },
      ]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── DRAGGABLE HAND CARD ─────────────────────────────────────────────────────
// Works for ALL cards in hand, not just the most-recently drawn one.
// Each card instance maintains its own pan state.
const DraggableHandCard = ({ card, cardIndex, onDragStart, onDrop, disabled, isSelected, onTap }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const symData = getSymbol(card?.sym);
  const color = symData?.color ?? '#256af4';

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, g) => !disabled && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
        setDragging(true);
        onDragStart?.();
        SoundManager.playCardPick?.();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        setDragging(false);
        const dropped = onDrop?.(cardIndex, g.moveX, g.moveY);
        if (dropped) {
          pan.setValue({ x: 0, y: 0 });
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        setDragging(false);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={{
        transform: pan.getTranslateTransform(),
        zIndex: dragging ? 999 : 1,
        elevation: dragging ? 20 : 1,
      }}
    >
      <TouchableOpacity
        onPress={onTap}
        activeOpacity={0.85}
        style={[
          styles.handCard,
          isSelected && { borderColor: color, borderWidth: 2, shadowColor: color, shadowOpacity: 0.7, shadowRadius: 10, elevation: 8 },
          dragging && { transform: [{ scale: 1.1 }], opacity: 0.9 },
        ]}
      >
        <SymbolCard symbol={card?.sym} disabled />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── SHUFFLE + DEAL ANIMATION OVERLAY ────────────────────────────────────────
// Cards fly from center to each player's hand position
const ShuffleDealOverlay = ({ visible, onComplete }) => {
  const cardAnims = useRef(Array.from({ length: 8 }, () => ({
    pos: new Animated.ValueXY({ x: 0, y: 0 }),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
    rotation: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (!visible) return;

    const dims = Dimensions.get('window');
    const cx = dims.width / 2;
    const cy = dims.height / 2;

    // Phase 1: all cards appear in center shuffling
    const phase1 = cardAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, duration: 200, delay: i * 60, useNativeDriver: true }),
        Animated.spring(anim.scale, { toValue: 1, friction: 5, delay: i * 60, useNativeDriver: true }),
        Animated.timing(anim.rotation, { toValue: (i % 2 === 0 ? 1 : -1) * (i + 1) * 5, duration: 300, delay: i * 60, useNativeDriver: true }),
      ])
    );

    // Phase 2: deal cards — first 4 go to player bottom, last 4 to opponent top
    const phase2 = cardAnims.map((anim, i) => {
      const isPlayer = i < 4;
      const handIndex = isPlayer ? i : i - 4;
      const destX = (handIndex - 1.5) * 72;
      const destY = isPlayer ? dims.height * 0.35 : -dims.height * 0.35;
      return Animated.parallel([
        Animated.spring(anim.pos, {
          toValue: { x: destX, y: destY },
          friction: 6, tension: 80,
          delay: 600 + i * 100,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotation, { toValue: 0, duration: 300, delay: 600 + i * 100, useNativeDriver: true }),
      ]);
    });

    Animated.sequence([
      Animated.stagger(60, phase1),
      Animated.delay(300),
      Animated.stagger(100, phase2),
    ]).start(() => {
      setTimeout(onComplete, 400);
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {cardAnims.map((anim, i) => {
          const isPlayer = i < 4;
          const rot = anim.rotation.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] });
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: 52, height: 72,
                borderRadius: 8,
                overflow: 'hidden',
                opacity: anim.opacity,
                transform: [
                  ...anim.pos.getTranslateTransform(),
                  { scale: anim.scale },
                  { rotate: rot },
                ],
              }}
            >
              {isPlayer
                ? <View style={styles.dealCardPlayer} />
                : <View style={styles.dealCardOpponent} />
              }
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

// ─── GAME BOARD ──────────────────────────────────────────────────────────────
const GameBoard = ({ board, onTilePress, currentLayer, swapMode, glowCells, onLayout }) => {
  const { tileSize, gap, tilePadding } = useBoardMetrics();

  if (!board) return null;

  return (
    <View style={{ padding: tilePadding }} onLayout={onLayout}>
      <View style={{ flexDirection: 'column', gap }}>
        {board.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap }}>
            {row.map((cell, c) => {
              const sym = topSym(cell);
              const symData = sym ? getSymbol(sym) : null;
              const isGlowing = glowCells?.some(g => g.r === r && g.c === c);

              const isPickBoard = swapMode?.step === 'pick_board' && cell.length >= 1;
              const isPickDest = swapMode?.step === 'pick_dest'
                && !(r === swapMode.fromR && c === swapMode.fromC)
                && cell.length === (currentLayer - 1);
              const isSwapTarget = swapMode?.step === 'pick_hand'
                && r === swapMode.fromR && c === swapMode.fromC;
              const isSwapSrc = (swapMode?.step === 'pick_dest' || swapMode?.step === 'pick_hand')
                && r === swapMode.fromR && c === swapMode.fromC;

              let borderStyle = sym
                ? { borderWidth: 0 }
                : { borderColor: 'rgba(37,106,244,0.3)', borderWidth: 1 };
              if (isPickBoard) borderStyle = { borderColor: '#256af4', borderWidth: 1.5 };
              if (isPickDest) borderStyle = { borderColor: '#00e5ff', borderWidth: 2, borderStyle: 'dashed' };
              if (isSwapTarget) borderStyle = { borderColor: '#256af4', borderWidth: 2, borderStyle: 'dashed' };
              if (isSwapSrc) borderStyle = { borderColor: '#FACC15', borderWidth: 2 };

              // Layer corner indicators
              // L1 icon: shown only when L2 card is on top (cell.length >= 2)
              // L2 icon: shown only when L3 card is on top (cell.length >= 3), stacked below L1 icon
              const l1Card = cell.length >= 2 ? cell[0] : null;
              const l2Card = cell.length >= 3 ? cell[1] : null;

              return (
                <GlowTile
                  key={`${r}-${c}`}
                  isGlowing={isGlowing || isPickBoard || isPickDest || isSwapTarget}
                  glowColor={
                    isPickDest ? '#00e5ff'
                    : isSwapTarget ? '#256af4'
                    : isGlowing ? '#256af4'
                    : '#256af4'
                  }
                  style={[
                    {
                      width: tileSize, height: tileSize,
                      borderRadius: 8,
                      backgroundColor: sym ? 'rgba(242,227,198,0.08)' : 'rgba(16,22,34,0.95)',
                      justifyContent: 'center', alignItems: 'center',
                      overflow: 'visible',
                    },
                    borderStyle,
                  ]}
                  onPress={() => onTilePress(r, c)}
                >
                  {sym && (
                    <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                      <SymbolCard symbol={sym} disabled size={tileSize * 0.45} />
                    </View>
                  )}

                  {/* L1 card corner icon — only when L2 card placed on top */}
                  {l1Card && (
                    <View style={[styles.cornerIcon, { bottom: l2Card ? 22 : 3, left: 3 }]}>
                      <Image
                        source={getSymbol(l1Card.sym)?.icon}
                        style={{ width: 10, height: 10, resizeMode: 'contain', opacity: 0.8 }}
                      />
                    </View>
                  )}

                  {/* L2 card corner icon — only when L3 card placed on top, below L1 icon */}
                  {l2Card && (
                    <View style={[styles.cornerIcon, { bottom: 3, left: 3 }]}>
                      <Image
                        source={getSymbol(l2Card.sym)?.icon}
                        style={{ width: 10, height: 10, resizeMode: 'contain', opacity: 0.8 }}
                      />
                    </View>
                  )}

                  {/* Swap labels */}
                  {isPickBoard && !sym && (
                    <Text style={styles.tileHint}>PICK</Text>
                  )}
                  {isPickDest && (
                    <Text style={styles.tileHint}>DROP</Text>
                  )}
                  {isSwapTarget && (
                    <Text style={styles.tileHint}>HERE</Text>
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

// ─── MAIN GAME SCREEN ────────────────────────────────────────────────────────
const GameScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const dims = useDimensions();
  const { containerW, tileSize, gap, tilePadding } = getBoardMetrics(dims.width);

  const diff = route?.params?.difficulty ?? 'easy';

  const [gs, setGs] = useState(() => makeInitialState(shuffle(buildDeck())));
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [glowCells, setGlowCells] = useState([]);
  const [showDeal, setShowDeal] = useState(true);
  const [dealDone, setDealDone] = useState(false);

  // Board layout for drag-drop hit testing
  const boardLayoutRef = useRef(null);
  const boardViewRef = useRef(null);

  useEffect(() => { SoundManager.init(); }, []);

  // ── Dispatch ──────────────────────────────────────────────────────
  const dispatch = useCallback((action) => {
    if (action.type === 'DRAW_CARD') SoundManager.playCardPick?.();
    else if (action.type?.startsWith('SWAP')) SoundManager.playSwap?.();
    else if (['FACE_OFF', 'CALL_WIN'].includes(action.type)) SoundManager.playButton?.();

    setGs(prev => {
      const next = gameReducer(prev, action, diff, profile);

      // Glow tracking
      if (action.type === 'PLACE_CARD' && !next.errAnim) {
        setGlowCells([{ r: action.r, c: action.c }]);
        setSelectedCardIdx(null);
      }
      if (action.type === 'SWAP_PLACE_HAND' && !next.swapMode) {
        const { fromR, fromC, toR, toC } = prev.swapMode ?? {};
        if (fromR !== undefined) {
          setGlowCells([{ r: fromR, c: fromC }, { r: toR, c: toC }]);
          SoundManager.playSwap?.();
        }
        setSelectedCardIdx(null);
      }
      if (action.type === 'DRAW_CARD') {
        // Clear glow when player draws
        setGlowCells([]);
      }

      // Handle overlays
      if (next.overlay) {
        const ov = next.overlay;
        if (ov.type === 'faceoff') {
          navigation.navigate('FaceOff', { overlay: ov, gs: next });
        } else if (ov.type === 'win') {
          SoundManager.playWin?.();
        } else if (ov.type === 'lose') {
          SoundManager.playLose?.();
        }
      }

      return next;
    });
  }, [diff, profile, navigation]);

  // ── AI turn ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gs.phase !== 'ai' || gs.gameOver) return;
    const t = setTimeout(() => {
      setGs(prev => {
        const next = runAiTurn(prev, diff, profile);
        // Find AI's new cell
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (next.board[r][c].length > prev.board[r][c].length) {
              setGlowCells([{ r, c }]);
            }
          }
        }
        if (next.overlay?.type === 'faceoff') {
          navigation.navigate('FaceOff', { overlay: next.overlay, gs: next });
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [gs.phase, gs.gameOver]);

  // Clear AI glow when player draws
  useEffect(() => {
    if (gs.phase === 'place') setGlowCells([]);
  }, [gs.phase]);

  // Round reset
  useEffect(() => {
    if (route?.params?.triggerNextRound) {
      const deck = shuffle(buildDeck());
      setGs(makeInitialState(deck));
      setGlowCells([]);
      setShowDeal(true);
      setDealDone(false);
    }
  }, [route?.params?.triggerNextRound]);

  // ── Drop handler (drag card to board) ─────────────────────────────
  const handleCardDrop = useCallback((cardIdx, moveX, moveY) => {
    if (gs.phase !== 'place') return false;
    if (!boardLayoutRef.current) return false;

    const { pageX, pageY, width: bw, height: bh } = boardLayoutRef.current;
    if (moveX < pageX || moveX > pageX + bw || moveY < pageY || moveY > pageY + bh) return false;

    const { tileSize: ts, gap: g, tilePadding: tp } = getBoardMetrics(dims.width);
    const relX = moveX - pageX - tp;
    const relY = moveY - pageY - tp;
    const c = Math.floor(relX / (ts + g));
    const r = Math.floor(relY / (ts + g));

    if (r >= 0 && r < 4 && c >= 0 && c < 4) {
      if (gs.swapMode?.step === 'pick_hand') {
        dispatch({ type: 'SWAP_PLACE_HAND', cardIdx, r, c });
      } else {
        dispatch({ type: 'PLACE_CARD', cardIdx, r, c });
      }
      return true;
    }
    return false;
  }, [gs.phase, gs.swapMode, dims.width, dispatch]);

  // ── Tile press (tap to place selected card) ───────────────────────
  const handleTilePress = useCallback((r, c) => {
    const { swapMode, phase } = gs;
    if (swapMode?.step === 'pick_board') {
      dispatch({ type: 'SWAP_PICK_BOARD', r, c });
    } else if (swapMode?.step === 'pick_dest') {
      dispatch({ type: 'SWAP_PICK_DEST', r, c });
    } else if (swapMode?.step === 'pick_hand' && selectedCardIdx !== null) {
      dispatch({ type: 'SWAP_PLACE_HAND', cardIdx: selectedCardIdx, r, c });
    } else if (phase === 'place' && selectedCardIdx !== null) {
      dispatch({ type: 'PLACE_CARD', cardIdx: selectedCardIdx, r, c });
    }
    SoundManager.playButton?.();
  }, [gs, selectedCardIdx, dispatch]);

  const isDrawPhase = gs.phase === 'draw' && !gs.gameOver;
  const isPlacePhase = gs.phase === 'place' && !gs.gameOver;
  // Swap button only visible after drawing (place phase) or while in swap mode
  const showSwap = isPlacePhase || !!gs.swapMode;
  const isSwapMode = !!gs.swapMode;

  // Win/lose overlay
  const gameOverOverlay = gs.gameOver ? gs : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, maxWidth: containerW }]}>

      {/* Deal animation overlay */}
      {showDeal && (
        <ShuffleDealOverlay
          visible={showDeal}
          onComplete={() => {
            setShowDeal(false);
            setDealDone(true);
            SoundManager.playShuffle?.();
          }}
        />
      )}

      {/* ── HEADER ── */}
      <View style={styles.header}>
        {/* Logo top-left */}
        <DoundoLogo width={80} height={22} />

        {/* Layer pills */}
        <View style={styles.levelPills}>
          {['L1', 'L2', 'L3'].map((l, i) => (
            <Text
              key={l}
              style={gs.currentLayer === i + 1 ? styles.pillActive : styles.pillInactive}
            >
              {l}
            </Text>
          ))}
        </View>

        {/* Settings */}
        <TouchableOpacity
          onPress={() => navigation.navigate('SettingsScreen')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Message banner */}
      {!!gs.msg && (
        <View style={[styles.msgBanner, gs.msgType === 'warn' && styles.msgBannerWarn]}>
          <Text style={gs.msgType === 'warn' ? styles.msgWarn : styles.msgInfo}>{gs.msg}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >

        {/* ── OPPONENT HAND ── */}
        <View style={styles.opponentSection}>
          <Text style={styles.opponentLabel}>Opponent</Text>
          <View style={styles.opponentHand}>
            {gs.aiHand.map((_, i) => (
              <View key={i} style={styles.opponentCard}>
                <CardBack style={{ width: '100%', height: '100%', borderRadius: 4 }} />
              </View>
            ))}
          </View>
        </View>

        {/* ── BOARD ── */}
        <View
          ref={boardViewRef}
          style={styles.boardSection}
          onLayout={() => {
            boardViewRef.current?.measure((x, y, w, h, px, py) => {
              boardLayoutRef.current = { pageX: px, pageY: py, width: w, height: h };
            });
          }}
        >
          <GameBoard
            board={gs.board}
            currentLayer={gs.currentLayer}
            swapMode={gs.swapMode}
            onTilePress={handleTilePress}
            glowCells={glowCells}
          />
        </View>

        {/* ── DECK + SWAP ROW ── */}
        <View style={styles.deckRow}>

          {/* Swap button — only visible when in place phase or swap mode */}
          {showSwap && (
            isSwapMode ? (
              <TouchableOpacity
                style={[styles.deckBtn, { backgroundColor: '#be123c', borderColor: '#be123c' }]}
                onPress={() => { SoundManager.playButton?.(); dispatch({ type: 'SWAP_CANCEL' }); }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>✕</Text>
                <Text style={styles.deckBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <GlowButton
                isGlowing={isPlacePhase}
                glowColor={theme.colors.primary}
                style={[styles.deckBtn, styles.deckBtnPrimary]}
                onPress={() => { SoundManager.playButton?.(); dispatch({ type: 'SWAP_START' }); }}
              >
                <Text style={{ fontSize: 18, color: '#FFF' }}>⇄</Text>
                <Text style={styles.deckBtnText}>Swap</Text>
              </GlowButton>
            )
          )}

          {/* Draw deck */}
          <GlowButton
            isGlowing={isDrawPhase}
            glowColor="#256af4"
            style={[styles.drawStack, isDrawPhase && { borderColor: '#256af4' }]}
            onPress={() => { if (isDrawPhase) dispatch({ type: 'DRAW_CARD' }); }}
            disabled={!isDrawPhase}
          >
            <View style={styles.drawInner}>
              {/* Stacked card backs for depth illusion */}
              {gs.drawPile.length > 2 && (
                <View style={[StyleSheet.absoluteFill, { top: -3, left: -2, borderRadius: 8, backgroundColor: '#0e1a2f', borderWidth: 1, borderColor: 'rgba(37,106,244,0.2)' }]} />
              )}
              {gs.drawPile.length > 0 && (
                <View style={[StyleSheet.absoluteFill, { top: -1.5, left: -1, borderRadius: 8, backgroundColor: '#122040', borderWidth: 1, borderColor: 'rgba(37,106,244,0.25)' }]} />
              )}
              <View style={[StyleSheet.absoluteFill, { borderRadius: 8, backgroundColor: '#1a2744', borderWidth: 2, borderColor: isDrawPhase ? '#256af4' : 'rgba(37,106,244,0.3)', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: isDrawPhase ? '#60a5fa' : '#475569', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>DECK</Text>
                <Text style={{ color: isDrawPhase ? '#93c5fd' : '#64748b', fontSize: 18, fontWeight: '900', lineHeight: 22 }}>{gs.drawPile.length}</Text>
              </View>
              {/* "DRAW" hint */}
              {isDrawPhase && (
                <Animated.View style={{ position: 'absolute', bottom: -18 }}>
                  <Text style={{ color: '#256af4', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>👆 DRAW</Text>
                </Animated.View>
              )}
            </View>
          </GlowButton>

        </View>

        {/* ── PLAYER HAND ── */}
        <View style={styles.handRow}>
          {gs.playerHand.map((card, i) => (
            <View key={`${card?.uid ?? i}`} style={styles.handCardWrap}>
              <DraggableHandCard
                card={card}
                cardIndex={i}
                onDragStart={() => setSelectedCardIdx(i)}
                onDrop={handleCardDrop}
                disabled={!isPlacePhase && !isSwapMode}
                isSelected={selectedCardIdx === i}
                onTap={() => {
                  if (!isPlacePhase && !isSwapMode) return;
                  SoundManager.playCardPick?.();
                  setSelectedCardIdx(prev => prev === i ? null : i);
                }}
              />
            </View>
          ))}
          {/* Empty slots */}
          {Array(Math.max(0, 4 - gs.playerHand.length)).fill(null).map((_, i) => (
            <View key={`emp-${i}`} style={[styles.handCardWrap, styles.emptySlot]}>
              <IconAdd size={20} color="#1E293B" />
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── BOTTOM ACTIONS ── */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <GlowButton
          isGlowing={isDrawPhase}
          glowColor={theme.colors.primary}
          style={[styles.actionBtn, styles.faceOffBtn]}
          onPress={() => { if (!gs.gameOver) dispatch({ type: 'FACE_OFF' }); }}
          disabled={gs.gameOver || gs.phase !== 'draw'}
        >
          <Text style={{ fontSize: 16 }}>⚡</Text>
          <Text style={styles.actionBtnText}>FACE-OFF</Text>
        </GlowButton>

        <TouchableOpacity
          style={[styles.actionBtn, styles.winBtn, gs.phase !== 'draw' && { opacity: 0.4 }]}
          onPress={() => { if (!gs.gameOver) dispatch({ type: 'CALL_WIN' }); }}
          disabled={gs.gameOver || gs.phase !== 'draw'}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16 }}>👑</Text>
          <Text style={[styles.actionBtnText, { color: '#CBD5E1' }]}>WIN</Text>
        </TouchableOpacity>
      </View>

      {/* ── GAME OVER OVERLAY ── */}
      {gs.gameOver && gs.overlay && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <View style={styles.gameOverOverlay}>
            <Text style={styles.gameOverTitle}>
              {gs.overlay.type === 'win' ? '🏆 YOU WIN!'
                : gs.overlay.type === 'lose' ? '🤖 AI WINS!'
                : '🤝 TIE!'}
            </Text>
            {gs.overlay.matchText && (
              <Text style={styles.gameOverPts}>{gs.overlay.matchText}</Text>
            )}
            <Text style={styles.gameOverScore}>
              Score: {gs.pScore} — AI: {gs.aScore}
            </Text>
            <TouchableOpacity
              style={styles.nextRoundBtn}
              onPress={() => {
                SoundManager.playButton?.();
                const wonGame = gs.pScore >= 500;
                const lostGame = gs.aScore >= 500;
                const diff2 = diff;
                const diffMult = diff2 === 'ai' ? 3.0 : diff2 === 'hard' ? 2.0 : diff2 === 'medium' ? 1.5 : 1.0;
                const params = { points: Math.floor(gs.pScore * diffMult), totalCards: 42, time: '05:00' };
                if (wonGame || lostGame) {
                  if (wonGame && lostGame) navigation.replace('DrawScreen', params);
                  else if (wonGame) navigation.replace('WinScreen', params);
                  else navigation.replace('LoseScreen', params);
                } else {
                  const deck = shuffle(buildDeck());
                  setGs(makeInitialState(deck));
                  setGlowCells([]);
                  setShowDeal(true);
                  setDealDone(false);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.nextRoundBtnText}>
                {gs.pScore >= 500 || gs.aScore >= 500 ? 'SEE RESULTS' : 'NEXT ROUND'}
              </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  levelPills: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  pillActive: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    color: '#FFF', fontSize: 10, fontWeight: '700',
    overflow: 'hidden',
  },
  pillInactive: {
    paddingHorizontal: 10, paddingVertical: 4,
    color: '#64748B', fontSize: 10, fontWeight: '700',
  },
  msgBanner: {
    backgroundColor: 'rgba(37,106,244,0.1)',
    paddingVertical: 4, paddingHorizontal: 16,
  },
  msgBannerWarn: { backgroundColor: 'rgba(239,68,68,0.15)' },
  msgInfo: { color: '#60a5fa', fontSize: 11, textAlign: 'center' },
  msgWarn: { color: '#f87171', fontSize: 11, textAlign: 'center' },
  scroll: { flexGrow: 1, paddingBottom: 4 },

  // Opponent
  opponentSection: { alignItems: 'center', paddingVertical: 6, gap: 3 },
  opponentLabel: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 2, color: '#475569',
    textTransform: 'uppercase',
  },
  opponentHand: { flexDirection: 'row', gap: 4 },
  opponentCard: {
    width: 28, height: 40, borderRadius: 4,
    overflow: 'hidden',
  },

  // Board
  boardSection: { width: '100%', alignItems: 'center' },

  // Corner layer icons
  cornerIcon: {
    position: 'absolute',
    width: 14, height: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  tileHint: {
    position: 'absolute', bottom: 2,
    fontSize: 6, fontWeight: '800',
    color: '#256af4', letterSpacing: 0.5,
  },

  // Deck row
  deckRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  deckBtn: {
    flex: 1, maxWidth: 130,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  deckBtnPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: 'rgba(37,106,244,0.5)',
  },
  deckBtnText: {
    color: '#FFF', fontSize: 9,
    fontWeight: '700', letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  drawStack: {
    width: 62, height: 86,
    borderRadius: 8, borderWidth: 2,
    borderColor: 'rgba(37,106,244,0.3)',
    backgroundColor: '#1a2744',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  drawInner: { width: '100%', height: '100%', position: 'relative' },

  // Hand
  handRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  handCardWrap: {
    flex: 1, maxWidth: 76, height: 100,
  },
  handCard: {
    flex: 1, borderRadius: 10,
    backgroundColor: '#f2e3c6',
    borderWidth: 1.5, borderColor: 'rgba(37,106,244,0.3)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emptySlot: {
    borderRadius: 10, borderWidth: 2,
    borderColor: '#1E293B', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  // Bottom actions
  bottomActions: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingTop: 10,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderTopWidth: 1, borderTopColor: '#1E293B',
  },
  actionBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
    borderRadius: 9999,
  },
  faceOffBtn: { backgroundColor: theme.colors.primary },
  winBtn: { backgroundColor: '#1E293B' },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  // Game over overlay
  gameOverOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  gameOverTitle: { color: '#FFF', fontSize: 40, fontWeight: '900', fontStyle: 'italic' },
  gameOverPts: { color: '#4ADE80', fontSize: 22, fontWeight: '700' },
  gameOverScore: { color: '#94A3B8', fontSize: 14 },
  nextRoundBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16, paddingHorizontal: 40,
    borderRadius: 12, marginTop: 12,
  },
  nextRoundBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

  // Deal animation
  dealCardPlayer: {
    flex: 1, backgroundColor: '#f2e3c6',
    borderRadius: 8, borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  dealCardOpponent: {
    flex: 1, backgroundColor: '#1a2744',
    borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(37,106,244,0.4)',
  },
});

export default GameScreen;
