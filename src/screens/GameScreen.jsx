/**
 * GameScreen.jsx
 * src/screens/GameScreen.jsx
 *
 * Imports:
 *   import { useGlow }     from '../game/GlowAnimator';
 *   import { useGameGlow } from '../game/useGameGlow';
 *   import GameBoard       from '../game/GameBoard';
 *   import HandCard        from '../game/HandCard';
 *   import DealAnimation   from '../game/DealAnimation';
 *
 * KEY FIXES:
 *
 * 1. DRAG OFFSET FIX:
 *    The highlight was appearing far from the actual card position because
 *    boardLayout.pageX/Y was measured relative to the screen root (full width)
 *    but was being compared against g.moveX/Y which are also screen-root page
 *    coords. These SHOULD match — but the board was being measured at mount time
 *    before layout was complete, storing wrong values.
 *    FIX: board is re-measured on EVERY dragStart via boardRef.current.measure().
 *    Additionally, getCellFromPage now uses the LATEST boardLayout each call.
 *
 * 2. DECK ANIMATION POSITION:
 *    DealAnimation was using Dimensions.get('window') for CX/CY.
 *    On a wide screen the container is 448px centered, so CX was wrong.
 *    FIX: Pass containerWidth and containerHeight to DealAnimation.
 *    Also pass containerLayout (page coords of the whole container) so
 *    slot positions can be converted correctly.
 *
 * 3. SELECT + DROP (tap method):
 *    - Tap a hand card → it highlights (isSelected)
 *    - Tap a board cell → dispatches PLACE_CARD
 *    - Both methods work simultaneously
 *    Swap button is HIDDEN in draw phase (only shows after drawing)
 *
 * 4. LIVE HOVER HIGHLIGHT:
 *    onDragMove fires from HandCard with raw page coords.
 *    getCellFromPage converts to grid row/col.
 *    hoverCell { r, c, valid } drives GridCell highlight color.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Animated, Easing, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoundoLogo }    from '../assets/logo/doundo_logo';
import BottomNav         from '../components/ui/BottomNav';
import SoundManager      from '../services/SoundManager';
import { makeInitialState, buildDeck, shuffle } from '../game/engine/gameUtils';
import { gameReducer }   from '../game/engine/gameReducer';
import { runAiTurn }     from '../ai/aiLogic';
import { useAuth }       from '../context/AuthContext';
import { supabase }      from '../services/supabase';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { useGlow }       from '../game/GlowAnimator';
import { useGameGlow }   from '../game/useGameGlow';
import GameBoard         from '../game/GameBoard';
import HandCard          from '../game/HandCard';
import DealAnimation     from '../game/DealAnimation';

const C = {
  bg: '#101622', primary: '#256af4',
  s800: '#1E293B', s700: '#334155',
  s500: '#64748B', s400: '#94A3B8', s300: '#CBD5E1',
};

const CardBack = ({ style }) => (
  <View style={[{
    backgroundColor: C.s800, borderRadius: 5,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,106,244,0.3)',
  }, style]}>
    <Image
      source={require('../assets/icons/card_back.svg')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  </View>
);

// ── Sub-components ────────────────────────────────────────────────────────────
const SwapButton = ({ isSwapMode, isPlacePhase, onSwap, onCancel }) => {
  const anim = useGlow(isPlacePhase && !isSwapMode);
  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.85] });
  if (isSwapMode) {
    return (
      <TouchableOpacity
        style={[styles.swapBtn, { backgroundColor: '#be123c', borderColor: '#be123c' }]}
        onPress={onCancel} activeOpacity={0.8}
      >
        <Text style={{ fontSize: 20, color: '#FFF' }}>⇄</Text>
        <Text style={styles.swapBtnText}>Cancel Swap</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onSwap} activeOpacity={0.8} style={{ flex: 1 }}>
      <Animated.View style={[
        styles.swapBtn,
        { backgroundColor: C.primary, borderColor: C.primary },
        isPlacePhase && { shadowColor: C.primary, shadowOpacity: so, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
      ]}>
        <Text style={{ fontSize: 22, color: '#FFF' }}>⇄</Text>
        <Text style={styles.swapBtnText}>Swap Cards</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const DrawButton = ({ isDrawPhase, count, onDraw, innerRef }) => {
  const anim = useGlow(isDrawPhase);
  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.9] });
  return (
    <TouchableOpacity onPress={onDraw} activeOpacity={0.8} disabled={!isDrawPhase} style={{ flex: 1 }}>
      <Animated.View
        ref={innerRef}
        style={[
          styles.drawBtn,
          isDrawPhase
            ? { backgroundColor: C.s800, borderColor: C.primary, shadowColor: C.primary, shadowOpacity: so, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 }
            : { backgroundColor: 'rgba(30,41,59,0.5)', borderColor: C.s700, opacity: 0.5 },
        ]}
      >
        <View style={styles.drawIconWrap}>
          <View style={[styles.drawCardShadow, { top: 4, left: 4 }]} />
          <View style={[styles.drawCardShadow, { top: 2, left: 2 }]} />
          <CardBack style={styles.drawCardFront} />
          <View style={styles.drawCountBadge}>
            <Text style={styles.drawCountText}>{count}</Text>
          </View>
        </View>
        <Text style={[styles.drawBtnText, isDrawPhase && { color: C.primary }]}>Draw Card</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const FaceOffButton = ({ active, disabled, onPress }) => {
  const anim = useGlow(active);
  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] });
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8} style={{ flex: 1 }}>
      <Animated.View style={[
        styles.faceOffBtn,
        active && { shadowColor: C.primary, shadowOpacity: so, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
        disabled && { opacity: 0.4 },
      ]}>
        <Text style={{ fontSize: 16, color: '#FFF' }}>⚡</Text>
        <Text style={styles.faceOffBtnText}>Face-Off</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────
export default function GameScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const dims   = useDimensions();
  const { containerW, tileSize, gap, tilePadding } = getBoardMetrics(dims.width);
  const { profile, user, refreshProfile } = useAuth();
  const diff = route?.params?.difficulty ?? 'easy';

  const [gs, setGs]           = useState(() => makeInitialState(shuffle(buildDeck())));
  const [selIdx, setSelIdx]   = useState(null);
  const [isSaving, setSaving] = useState(false);
  const [showDeal, setShowDeal] = useState(true);
  const [hoverCell, setHoverCell] = useState(null); // {r,c,valid}|null

  // Container layout for DealAnimation coordinate correction
  const [containerLayout, setContainerLayout] = useState(null);

  const { glowCells, setGlow, clearGlow } = useGameGlow();

  // ── Layout refs ────────────────────────────────────────────────
  const containerRef   = useRef(null);
  const boardRef       = useRef(null);
  const boardLayout    = useRef(null);  // fresh on every dragStart
  const deckInnerRef   = useRef(null);
  const deckLayout     = useRef(null);

  const playerSlotRefs = useRef([null, null, null, null]);
  const playerSlotPos  = useRef([null, null, null, null]);
  const oppSlotRefs    = useRef([null, null, null, null]);
  const oppSlotPos     = useRef([null, null, null, null]);

  useEffect(() => { SoundManager.init(); return () => SoundManager.cleanup(); }, []);

  const cardW = Math.max(52, Math.floor(tileSize * 0.9));
  const cardH = Math.floor(cardW * 1.44);
  const oppW  = Math.floor(cardW * 0.52);
  const oppH  = Math.floor(cardH * 0.52);

  // ── Measure a slot into a target ref array ─────────────────────
  const measureSlot = useCallback((ref, target, i) => {
    ref?.measure?.((x, y, w, h, px, py) => {
      if (px > 0 || py > 0) { // only store if measured successfully
        target.current[i] = { x: px, y: py, width: w, height: h };
      }
    });
  }, []);

  // ── Convert page coords to board cell ──────────────────────────
  // Always uses LATEST boardLayout (re-measured on drag start)
  const getCellFromPage = useCallback((mx, my) => {
    const bl = boardLayout.current;
    if (!bl) return null;
    const { pageX, pageY, width: bw, height: bh } = bl;
    if (mx < pageX || mx > pageX + bw || my < pageY || my > pageY + bh) return null;
    const { tileSize: ts, gap: g, tilePadding: tp } = getBoardMetrics(dims.width);
    const col = Math.floor((mx - pageX - tp) / (ts + g));
    const row = Math.floor((my - pageY - tp) / (ts + g));
    if (row >= 0 && row < 4 && col >= 0 && col < 4) return { r: row, c: col };
    return null;
  }, [dims.width]);

  // ── Live drag hover ────────────────────────────────────────────
  const handleDragMove = useCallback((mx, my) => {
    if (mx === null || my === null) { setHoverCell(null); return; }
    const cell = getCellFromPage(mx, my);
    if (!cell) { setHoverCell(null); return; }
    const { r, c } = cell;
    const valid = gs.board[r][c].length === gs.currentLayer - 1;
    setHoverCell({ r, c, valid });
  }, [getCellFromPage, gs.board, gs.currentLayer]);

  // ── Dispatch ───────────────────────────────────────────────────
  const dispatch = useCallback((action) => {
    if (action.type === 'DRAW_CARD') SoundManager.playCardPick?.();
    else if (action.type?.startsWith('SWAP')) SoundManager.playSwap?.();
    else if (['FACE_OFF', 'CALL_WIN'].includes(action.type)) SoundManager.playButton?.();

    setGs(prev => {
      const next = gameReducer(prev, action, diff, profile);
      if (action.type === 'PLACE_CARD' && !next.msg?.includes('❌')) {
        setGlow([{ r: action.r, c: action.c }], 'place');
        setSelIdx(null);
      }
      if (action.type === 'SWAP_PLACE_HAND' && !next.swapMode) {
        const { fromR, fromC, toR, toC } = prev.swapMode ?? {};
        if (fromR !== undefined) {
          setGlow([{ r: fromR, c: fromC }, { r: toR, c: toC }], 'swap');
          SoundManager.playSwap?.();
        }
        setSelIdx(null);
      }
      if (action.type === 'DRAW_CARD') clearGlow();
      return next;
    });
  }, [diff, profile, setGlow, clearGlow]);

  // ── AI turn ────────────────────────────────────────────────────
  useEffect(() => {
    if (gs.phase !== 'ai' || gs.gameOver || gs.overlay) return;
    const t = setTimeout(() => {
      setGs(prev => {
        const next = runAiTurn(prev, diff, profile);
        const cells = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
          if (next.board[r][c].length > prev.board[r][c].length) cells.push({ r, c });
        if (cells.length) setGlow(cells, 'ai');
        return next;
      });
    }, 950);
    return () => clearTimeout(t);
  }, [gs.phase, gs.gameOver, gs.overlay, diff, profile, setGlow]);

  useEffect(() => { if (gs.phase === 'place') clearGlow(); }, [gs.phase, clearGlow]);

  useEffect(() => {
    if (!gs.overlay) return;
    if (gs.overlay.type === 'faceoff') {
      navigation.navigate('FaceOff', { overlay: gs.overlay, gs });
      setGs(p => ({ ...p, overlay: null }));
      return;
    }
    if (gs.overlay.winner === 'player' || gs.overlay.type === 'win') SoundManager.playWin?.();
    else if (gs.overlay.winner === 'ai') SoundManager.playLose?.();
    else SoundManager.playDrawMatch?.();
  }, [gs.overlay]);

  // ── Match end ──────────────────────────────────────────────────
  const handleMatchEnd = useCallback(async () => {
    if (isSaving) return;
    const won = gs.pScore >= 500, lost = gs.aScore >= 500;
    if (!won && !lost) return;
    setSaving(true);
    const mult = diff === 'ai' ? 3 : diff === 'hard' ? 2 : diff === 'medium' ? 1.5 : 1;
    const pts = Math.floor(gs.pScore * mult);
    try {
      if (user && profile) {
        await supabase.from('profiles').update({
          score:       (profile.score       || 0) + pts,
          games_won:   (profile.games_won   || 0) + (won && !lost ? 1 : 0),
          games_lost:  (profile.games_lost  || 0) + (!won && lost ? 1 : 0),
          games_drawn: (profile.games_drawn || 0) + (won &&  lost ? 1 : 0),
        }).eq('id', user.id);
        await refreshProfile?.();
      }
    } catch {}
    setSaving(false);
    const p = { points: pts, totalCards: 42, time: '05:00' };
    if (won && lost) navigation.replace('DrawScreen', p);
    else if (won)    navigation.replace('WinScreen',  p);
    else             navigation.replace('LoseScreen', p);
  }, [isSaving, gs, diff, user, profile, refreshProfile, navigation]);

  const handleNextRound = useCallback(() => {
    const deck = shuffle(buildDeck());
    setGs(prev => ({
      ...prev,
      board: Array(4).fill(null).map(() => Array(4).fill(null).map(() => [])),
      drawPile: deck.slice(8), playerHand: deck.slice(0, 4), aiHand: deck.slice(4, 8),
      phase: 'draw', round: (prev.round || 1) + 1,
      msg: '', msgType: 'info', gameOver: false, winRow: null,
      currentLayer: 1, layerJustChanged: false, swapMode: null, overlay: null,
    }));
    clearGlow(); setSelIdx(null); setHoverCell(null); setShowDeal(true);
  }, [clearGlow]);

  useEffect(() => {
    if (route.params?.triggerNextRound) {
      navigation.setParams({ triggerNextRound: undefined });
      handleNextRound();
    }
  }, [route.params?.triggerNextRound]);

  // ── Drop handler ───────────────────────────────────────────────
  const handleDrop = useCallback((cardIdx, mx, my) => {
    setHoverCell(null);
    if (gs.phase !== 'place' && !gs.swapMode) return false;
    const cell = getCellFromPage(mx, my);
    if (!cell) return false;
    const { r, c } = cell;
    if (gs.swapMode?.step === 'pick_hand') {
      dispatch({ type: 'SWAP_PLACE_HAND', cardIdx, r, c });
    } else {
      dispatch({ type: 'PLACE_CARD', cardIdx, r, c });
    }
    return true;
  }, [gs.phase, gs.swapMode, getCellFromPage, dispatch]);

  // ── Tile press (tap-select + tap-place) ────────────────────────
  const handleTilePress = useCallback((r, c) => {
    SoundManager.playButton?.();
    const { swapMode, phase } = gs;
    if (swapMode?.step === 'pick_board') {
      dispatch({ type: 'SWAP_PICK_BOARD', r, c });
    } else if (swapMode?.step === 'pick_dest') {
      dispatch({ type: 'SWAP_PICK_DEST', r, c });
    } else if (swapMode?.step === 'pick_hand' && selIdx !== null) {
      dispatch({ type: 'SWAP_PLACE_HAND', cardIdx: selIdx, r, c });
      setSelIdx(null);
    } else if (phase === 'place' && selIdx !== null) {
      // TAP-SELECT + TAP-PLACE: card selected, now tap cell to place
      dispatch({ type: 'PLACE_CARD', cardIdx: selIdx, r, c });
      setSelIdx(null);
    }
  }, [gs, selIdx, dispatch]);

  const isDrawPhase  = gs.phase === 'draw'  && !gs.gameOver;
  const isPlacePhase = gs.phase === 'place' && !gs.gameOver;
  const isSwapMode   = !!gs.swapMode;
  // SWAP button: only visible AFTER drawing (place phase) or during active swap
  const showSwap    = isPlacePhase || isSwapMode;
  // DRAW button: always visible except when swap is active
  const showDrawBtn = !isSwapMode;

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <View
      ref={containerRef}
      style={[styles.container, { maxWidth: containerW }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        // Measure the container's page position for DealAnimation
        containerRef.current?.measure((x, y, w, h, px, py) => {
          setContainerLayout({ x: px, y: py, width: w, height: h });
        });
      }}
    >

      {/* Deal animation — uses container dimensions for correct center */}
      {showDeal && (
        <DealAnimation
          visible={showDeal}
          onComplete={() => setShowDeal(false)}
          containerWidth={containerLayout?.width ?? containerW}
          containerHeight={containerLayout?.height ?? dims.height}
          containerPageX={containerLayout?.x ?? 0}
          containerPageY={containerLayout?.y ?? 0}
          playerSlots={playerSlotPos.current}
          opponentSlots={oppSlotPos.current}
          deckPosition={deckLayout.current}
          cardW={cardW}
          cardH={cardH}
        />
      )}

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLogo}><DoundoLogo width={90} height={24} /></View>
        <View style={styles.levelPills}>
          {['L1', 'L2', 'L3'].map((l, i) => (
            <View key={l} style={gs.currentLayer === i + 1 ? styles.pillActive : styles.pillInactive}>
              <Text style={gs.currentLayer === i + 1 ? styles.pillActiveText : styles.pillInactiveText}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {!!gs.msg && (
        <View style={[styles.msg, gs.msgType === 'warn' && styles.msgWarn]}>
          <Text style={{ color: gs.msgType === 'warn' ? '#f87171' : C.primary, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>
            {gs.msg}
          </Text>
        </View>
      )}

      {/* ── Opponent hand ── */}
      <View style={[styles.opponentSection, showDeal && { opacity: 0 }]}>
        <Text style={styles.opponentLabel}>Opponent</Text>
        <View style={styles.opponentRow}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={`opp-slot-${i}`}
              ref={r => { oppSlotRefs.current[i] = r; }}
              onLayout={() => setTimeout(() => measureSlot(oppSlotRefs.current[i], oppSlotPos, i), 100)}
              style={{ width: oppW, height: oppH }}
            >
              {gs.aiHand[i] && <CardBack style={{ width: '100%', height: '100%' }} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── Board ── */}
      <View
        style={[styles.gridSection, showDeal && { opacity: 0 }]}
        ref={boardRef}
        onLayout={() => {
          // Measure board position on every layout change
          boardRef.current?.measure((x, y, w, h, px, py) => {
            boardLayout.current = { pageX: px, pageY: py, width: w, height: h };
          });
        }}
      >
        <GameBoard
          board={gs.board}
          currentLayer={gs.currentLayer}
          swapMode={gs.swapMode}
          glowCells={glowCells}
          hoverCell={hoverCell}
          selIdx={selIdx}
          canPlaceAny={isPlacePhase}
          onTilePress={handleTilePress}
          onBoardLayout={(l) => { boardLayout.current = l; }}
        />
      </View>

      {/* ── Interaction area ── */}
      <View style={[styles.interaction, showDeal && { opacity: 0 }]}>

        {/* Swap + Draw row */}
        <View style={styles.deckRow}>
          {showSwap && (
            <SwapButton
              isSwapMode={isSwapMode}
              isPlacePhase={isPlacePhase}
              onSwap={() => dispatch({ type: 'SWAP_START' })}
              onCancel={() => dispatch({ type: 'SWAP_CANCEL' })}
            />
          )}
          {showDrawBtn && (
            <DrawButton
              isDrawPhase={isDrawPhase}
              count={gs.drawPile.length}
              onDraw={() => dispatch({ type: 'DRAW_CARD' })}
              innerRef={(r) => {
                deckInnerRef.current = r;
                // Measure after first render with a small delay
                if (r && !deckLayout.current) {
                  setTimeout(() => {
                    r?.measure?.((x, y, w, h, px, py) => {
                      if (px > 0 || py > 0) {
                        deckLayout.current = { x: px, y: py, width: w, height: h };
                      }
                    });
                  }, 500);
                }
              }}
            />
          )}
        </View>

        {/* Player hand */}
        <View style={styles.handRow}>
          {gs.playerHand.map((card, i) => (
            <View
              key={`slot-${i}`}
              ref={r => { playerSlotRefs.current[i] = r; }}
              onLayout={() => setTimeout(() => measureSlot(playerSlotRefs.current[i], playerSlotPos, i), 100)}
            >
              <HandCard
                key={card?.uid ?? i}
                card={card}
                idx={i}
                cardW={cardW}
                cardH={cardH}
                disabled={!isPlacePhase && !isSwapMode}
                isSelected={selIdx === i}
                onTap={() => {
                  if (!isPlacePhase && !isSwapMode) return;
                  SoundManager.playCardPick?.();
                  setSelIdx(p => p === i ? null : i);
                }}
                onDragStart={() => {
                  setSelIdx(i);
                  // CRITICAL: re-measure board immediately before drag
                  boardRef.current?.measure((x, y, w, h, px, py) => {
                    boardLayout.current = { pageX: px, pageY: py, width: w, height: h };
                  });
                }}
                onDragMove={handleDragMove}
                onDrop={handleDrop}
              />
            </View>
          ))}
          {Array(Math.max(0, 4 - gs.playerHand.length)).fill(null).map((_, i) => (
            <View key={`e-${i}`} style={[styles.emptySlot, { width: cardW, height: cardH }]}>
              <Text style={{ color: C.s800, fontSize: 22 }}>+</Text>
            </View>
          ))}
        </View>

      </View>

      {/* ── Bottom actions ── */}
      <View style={[styles.bottomNavActions, { paddingBottom: insets.bottom + 4 }]}>
        <FaceOffButton
          active={isDrawPhase}
          disabled={!isDrawPhase || gs.gameOver}
          onPress={() => dispatch({ type: 'FACE_OFF' })}
        />
        <TouchableOpacity
          style={[styles.winBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]}
          onPress={() => dispatch({ type: 'CALL_WIN' })}
          disabled={!isDrawPhase || gs.gameOver}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 16 }}>👑</Text>
          <Text style={styles.winBtnText}>WIN</Text>
        </TouchableOpacity>
      </View>

      <BottomNav navigation={navigation} activeRoute="Game" />

      {/* Round result overlay */}
      {gs.overlay && gs.overlay.type !== 'faceoff' && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 80 }]}>
          <View style={styles.overlayBg}>
            <Text style={styles.overlayTitle}>
              {gs.overlay.winner === 'player' ? '🏆 YOU WIN!' : gs.overlay.winner === 'ai' ? '🤖 AI WINS!' : '🤝 TIE!'}
            </Text>
            {gs.overlay.matchText && <Text style={styles.overlayPts}>{gs.overlay.matchText}</Text>}
            <Text style={{ color: C.s400, fontSize: 14 }}>Score: {gs.pScore} — AI: {gs.aScore}</Text>
            <TouchableOpacity
              style={styles.overlayBtn}
              disabled={isSaving}
              onPress={() => {
                SoundManager.playButton?.();
                if (gs.pScore >= 500 || gs.aScore >= 500) handleMatchEnd();
                else handleNextRound();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.overlayBtnText}>
                {isSaving ? 'SAVING...' : gs.pScore >= 500 || gs.aScore >= 500 ? 'FINISH MATCH' : 'NEXT ROUND'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.bg, alignSelf: 'center', width: '100%' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  headerLogo:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelPills:       { flexDirection: 'row', gap: 4, backgroundColor: C.s800, padding: 4, borderRadius: 8 },
  pillActive:       { paddingHorizontal: 16, paddingVertical: 4, backgroundColor: C.primary, borderRadius: 9999 },
  pillActiveText:   { color: '#FFF', fontSize: 10, fontWeight: '700' },
  pillInactive:     { paddingHorizontal: 12, paddingVertical: 4, opacity: 0.2 },
  pillInactiveText: { color: C.s400, fontSize: 10, fontWeight: '700' },
  msg:              { backgroundColor: 'rgba(37,106,244,0.08)', paddingVertical: 3, paddingHorizontal: 16 },
  msgWarn:          { backgroundColor: 'rgba(239,68,68,0.1)' },
  opponentSection:  { alignItems: 'center', paddingVertical: 8, gap: 4, opacity: 0.6 },
  opponentLabel:    { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2.5, color: C.s500 },
  opponentRow:      { flexDirection: 'row', gap: 4 },
  gridSection:      { flex: 1, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center' },
  interaction:      { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  deckRow:          { flexDirection: 'row', alignItems: 'stretch', gap: 12, maxWidth: 320, alignSelf: 'center', width: '100%' },
  swapBtn:          { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  swapBtnText:      { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  drawBtn:          { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  drawIconWrap:     { width: 42, height: 54, position: 'relative' },
  drawCardShadow:   { position: 'absolute', width: 36, height: 48, borderRadius: 5, backgroundColor: C.s700 },
  drawCardFront:    { position: 'absolute', top: 0, left: 0, width: 36, height: 48, borderRadius: 5 },
  drawCountBadge:   { position: 'absolute', bottom: -6, left: 7, backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  drawCountText:    { color: '#FFF', fontSize: 10, fontWeight: '700' },
  drawBtnText:      { color: C.s400, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  handRow:          { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  emptySlot:        { borderRadius: 8, borderWidth: 2, borderColor: C.s800, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  bottomNavActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 24, paddingTop: 16, backgroundColor: 'rgba(15,23,42,0.8)', borderTopWidth: 1, borderTopColor: C.s800 },
  faceOffBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 9999 },
  faceOffBtnText:   { color: '#FFF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 },
  winBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.s800, paddingVertical: 14, borderRadius: 9999 },
  winBtnText:       { color: C.s300, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 },
  overlayBg:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  overlayTitle:     { color: '#FFF', fontSize: 36, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' },
  overlayPts:       { color: '#4ADE80', fontSize: 20, fontWeight: '700' },
  overlayBtn:       { backgroundColor: C.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, marginTop: 10 },
  overlayBtnText:   { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});
