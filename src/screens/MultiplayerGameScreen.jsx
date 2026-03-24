/**
 * MultiplayerGameScreen.jsx — src/screens/MultiplayerGameScreen.jsx
 * Complete rewrite from the 542-line running version.
 *
 * ALL FIXES:
 * 1. Face-off overlay — inline, shows symbols using SymbolCard, NEXT button works
 * 2. Call Win error feedback — shows msg when no match
 * 3. Timer — near active player, starts only after SUBSCRIBED
 * 4. Forfeit — both screens navigate correctly
 * 5. Deal animation — simplified, no off-screen coords
 * 6. Settings icon in header
 * 7. 4 fixed card backs for opponent
 * 8. Swap glow — both cells
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Easing, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoundoLogo }      from '../assets/logo/doundo_logo';
import BottomNav           from '../components/ui/BottomNav';
import SoundManager        from '../services/SoundManager';
import { supabase }        from '../services/supabase';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { useGlow }         from '../game/GlowAnimator';
import { useGameGlow }     from '../game/useGameGlow';
import GameBoard           from '../game/GameBoard';
import HandCard            from '../game/HandCard';
import { SymbolCard }      from '../game/SymbolCard';
import { useAuth }         from '../context/AuthContext';
import { releaseBot }      from '../services/botService';
import useMultiplayerGame  from '../hooks/useMultiplayerGame';
import { makeInitialState, buildDeck, shuffle } from '../game/engine/gameUtils';
import { gameReducer }     from '../game/engine/gameReducer';
import { runAiTurn }       from '../ai/aiLogic';

const CARD_BACK = require('../assets/icons/card_back.svg');
const AVATARS = {
  1: require('../assets/avatars/preset_1.jpg'),
  2: require('../assets/avatars/preset_2.jpg'),
  3: require('../assets/avatars/preset_3.jpg'),
  4: require('../assets/avatars/preset_4.jpg'),
  5: require('../assets/avatars/avatar_main.jpg'),
  6: require('../assets/avatars/preset_2.jpg'),
};
const getAvatar = p => AVATARS[p] ?? AVATARS[1];
const C = {
  bg: '#101622', primary: '#256af4',
  s800: '#1E293B', s700: '#334155',
  s500: '#64748B', s400: '#94A3B8', s300: '#CBD5E1',
};

// ── Simple card deal animation — no off-screen coords ────────────
// Cards slide from center outward using relative container offsets.
// No page-level coordinate math needed — avoids off-screen bug.
const SimpleDealAnimation = ({ onComplete }) => {
  const cards = useRef(Array.from({ length: 8 }, (_, i) => ({
    x:   new Animated.Value(0),
    y:   new Animated.Value(0),
    op:  new Animated.Value(0),
    rot: new Animated.Value(0),
  }))).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SoundManager.playShuffle?.();
    // Destinations relative to center: opponent top, player bottom
    // opponent slots: 4 cards spread left→right at y=-120
    // player slots: 4 cards spread left→right at y=+120
    const destinations = [
      { x: -108, y: -110 }, { x: -36, y: -110 }, { x: 36, y: -110 }, { x: 108, y: -110 },
      { x: -108, y:  110 }, { x: -36, y:  110 }, { x: 36, y:  110 }, { x: 108, y:  110 },
    ];

    // Phase 1: appear
    const appear = cards.map((c, i) =>
      Animated.timing(c.op, { toValue: 1, duration: 80, delay: i * 20, useNativeDriver: true })
    );

    // Phase 2: riffle (spread + collapse)
    const spread = cards.map((c, i) => Animated.parallel([
      Animated.timing(c.x, { toValue: (i - 3.5) * 10, duration: 200, useNativeDriver: true }),
      Animated.timing(c.rot, { toValue: (i - 3.5) * 4, duration: 200, useNativeDriver: true }),
    ]));
    const collapse = cards.map(c => Animated.parallel([
      Animated.timing(c.x, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(c.rot, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]));

    // Phase 3: deal to positions
    const deal = cards.map((c, i) => Animated.parallel([
      Animated.spring(c.x, { toValue: destinations[i].x, friction: 7, tension: 60, delay: i * 70, useNativeDriver: true }),
      Animated.spring(c.y, { toValue: destinations[i].y, friction: 7, tension: 60, delay: i * 70, useNativeDriver: true }),
    ]));

    Animated.sequence([
      Animated.stagger(20, appear),
      Animated.delay(100),
      Animated.parallel(spread),
      Animated.delay(120),
      Animated.parallel(collapse),
      Animated.delay(80),
      Animated.parallel(deal),
      Animated.delay(400),
      Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => onComplete?.());
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeOut, zIndex: 200, backgroundColor: 'rgba(5,9,20,0.96)', alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      {cards.map((c, i) => {
        const rot = c.rot.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] });
        return (
          <Animated.View key={i} style={{ position: 'absolute', width: 46, height: 66, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1a2744', borderWidth: 1, borderColor: 'rgba(37,106,244,0.4)', opacity: c.op, transform: [{ translateX: c.x }, { translateY: c.y }, { rotate: rot }] }}>
            <Image source={CARD_BACK} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

// ── Coin flip intro ───────────────────────────────────────────────
const CoinFlip = ({ myName, oppName, iGoFirst, onDone }) => {
  const sc = useRef(new Animated.Value(0.4)).current;
  const op = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.timing(tx, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(tx, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => onDone?.());
  }, []);
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 199, backgroundColor: 'rgba(5,9,20,0.95)', alignItems: 'center', justifyContent: 'center', gap: 20 }]}>
      <Animated.Text style={{ fontSize: 60, opacity: op, transform: [{ scale: sc }] }}>🪙</Animated.Text>
      <Animated.View style={{ opacity: tx, alignItems: 'center', gap: 10 }}>
        <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
          {iGoFirst ? `${myName} goes first!` : `${oppName} goes first!`}
        </Text>
        <Text style={{ color: C.s500, fontSize: 14, letterSpacing: 1 }}>
          {iGoFirst ? 'Draw a card to begin' : 'Waiting for opponent…'}
        </Text>
      </Animated.View>
    </View>
  );
};

// ── Intro sequence: deal → coin ───────────────────────────────────
const IntroSequence = ({ myName, oppName, iGoFirst, onDone }) => {
  const [phase, setPhase] = useState('deal');
  if (phase === 'deal') return <SimpleDealAnimation onComplete={() => setPhase('coin')} />;
  if (phase === 'coin') return <CoinFlip myName={myName} oppName={oppName} iGoFirst={iGoFirst} onDone={() => { setPhase('done'); onDone?.(); }} />;
  return null;
};

// ── Turn banner ───────────────────────────────────────────────────
const TurnBanner = ({ isMyTurn, myName, oppName }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isMyTurn) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.025, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.000, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isMyTurn]);
  return (
    <Animated.View style={[s.turnBanner, isMyTurn ? s.turnMy : s.turnOpp, { transform: [{ scale: pulse }] }]}>
      <Text style={[s.turnTxt, { color: isMyTurn ? '#60a5fa' : C.s500 }]}>
        {isMyTurn ? `⚡  ${myName}'s Turn` : `⏳  ${oppName} is playing…`}
      </Text>
    </Animated.View>
  );
};

// ── Timer bar ─────────────────────────────────────────────────────
const TimerBar = ({ secs, label }) => {
  const pct   = Math.max(0, ((45 - secs) / 45) * 100);
  const color = secs >= 35 ? '#f87171' : secs >= 20 ? '#FACC15' : '#22C55E';
  return (
    <View style={s.timerRow}>
      <Text style={[s.timerLabel, { color }]}>{label}</Text>
      <View style={s.timerBg}>
        <View style={[s.timerFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.timerNum, { color }]}>{45 - secs}s</Text>
    </View>
  );
};

// ── Player strip ──────────────────────────────────────────────────
const PlayerStrip = ({ username, avatarPreset, score, isMe, isActive }) => (
  <View style={s.strip}>
    <View style={[s.stripAv, { borderColor: isActive ? C.primary : C.s700 }]}>
      <Image source={getAvatar(avatarPreset)} style={{ width: '100%', height: '100%' }} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.stripName}>{username}{isMe ? ' (You)' : ''}</Text>
      <Text style={s.stripScore}>{score ?? 0} pts</Text>
    </View>
    {isActive && <View style={s.activeDot} />}
  </View>
);

// ── Draw button ───────────────────────────────────────────────────
const DrawBtn = ({ active, count, onDraw }) => {
  const glow = useGlow(active);
  const so   = glow.interpolate({ inputRange: [0,1], outputRange: [0.1, 0.9] });
  return (
    <TouchableOpacity onPress={onDraw} disabled={!active} style={{ flex: 1 }}>
      <Animated.View style={[s.drawBtn, active ? { borderColor: C.primary, backgroundColor: C.s800, shadowColor: C.primary, shadowOpacity: so, shadowRadius: 12, shadowOffset: { width:0, height:0 }, elevation: 8 } : { borderColor: C.s700, backgroundColor: 'rgba(30,41,59,0.4)', opacity: 0.5 }]}>
        <Text style={{ fontSize: 20 }}>🃏</Text>
        <Text style={[s.drawLabel, { color: active ? C.primary : C.s400 }]}>DRAW</Text>
        <View style={s.drawBadge}><Text style={s.drawBadgeTxt}>{count}</Text></View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Round win overlay (CALL_WIN success) — shown inline briefly ──
// Face-off goes directly to FaceOffScreen — no inline overlay needed.
const RoundWinOverlay = ({ overlay, myName, oppName, onNext }) => {
  const won = overlay.winner === 'player';
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 90, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 }]}>
      <Text style={{ color: won ? '#4ADE80' : '#f87171', fontSize: 36, fontWeight: '900', textAlign: 'center' }}>
        {won ? '🏆 YOU WIN!' : `🎯 ${oppName} Wins!`}
      </Text>
      {overlay.matchText && <Text style={{ color: '#4ADE80', fontSize: 22, fontWeight: '700' }}>{overlay.matchText}</Text>}
      <TouchableOpacity style={s.foBtn} onPress={onNext}>
        <Text style={s.foBtnTxt}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────
export default function MultiplayerGameScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const dims   = useDimensions();
  const { containerW, tileSize } = getBoardMetrics(dims.width);
  const { profile, user, refreshProfile } = useAuth();

  const {
    sessionId, isPlayer1 = true,
    opponentUsername, opponentAvatar = 1,
    isBotGame = false, botId = null, difficulty = 'medium',
  } = route.params || {};

  const myName   = profile?.username     ?? 'You';
  const myAvatar = profile?.avatar_preset ?? 1;
  const mpProfile = { ...profile, isMultiplayer: true };

  const cardW = Math.max(52, Math.floor(tileSize * 0.9));
  const cardH = Math.floor(cardW * 1.44);
  const oppW  = Math.floor(cardW * 0.48);
  const oppH  = Math.floor(cardH * 0.48);

  // ── Bot state ─────────────────────────────────────────────────
  const [botGs, setBotGs] = useState(() =>
    isBotGame ? makeInitialState(shuffle(buildDeck())) : null
  );

  // ── Multiplayer state ─────────────────────────────────────────
  const { gs: mpGs, dispatch: mpDispatch, connectionStatus, opponentInfo,
          isMyTurn, inactivitySecs, setOnForfeit } =
    useMultiplayerGame(
      isBotGame
        ? { sessionId: null, myUserId: null, isPlayer1: true, profile: mpProfile }
        : { sessionId, myUserId: user?.id, isPlayer1, profile: mpProfile }
    );

  // Register forfeit handler
  useEffect(() => {
    if (isBotGame || !setOnForfeit) return;
    setOnForfeit(result => {
      const pts = result === 'win' ? 250 : 0;
      navigation.replace(result === 'win' ? 'WinScreen' : 'LoseScreen',
        { points: pts, forfeit: true, opponentName: oppName, isMultiplayer: true });
    });
  }, [isBotGame, setOnForfeit]);

  const gs            = isBotGame ? botGs  : mpGs;
  const isMyTurnFinal = isBotGame ? (gs?.phase === 'draw' || gs?.phase === 'place') : isMyTurn;
  const oppName  = isBotGame ? (opponentUsername ?? 'Bot') : (opponentInfo?.username ?? opponentUsername ?? 'Opponent');
  const oppAv    = isBotGame ? (opponentAvatar ?? 1) : (opponentInfo?.avatarPreset ?? opponentAvatar ?? 1);

  // ── UI state ──────────────────────────────────────────────────
  const [selIdx,    setSelIdx]    = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [isSaving,  setSaving]    = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [activeOverlay, setActiveOverlay] = useState(null); // faceoff or win overlay
  const { glowCells, setGlow, clearGlow } = useGameGlow();
  const boardRef    = useRef(null);
  const boardLayout = useRef(null);

  useEffect(() => { SoundManager.init(); return () => SoundManager.cleanup(); }, []);

  // ── Bot AI turn ───────────────────────────────────────────────
  useEffect(() => {
    if (!isBotGame || !botGs || botGs.phase !== 'ai' || botGs.gameOver) return;
    const t = setTimeout(() => {
      setBotGs(prev => {
        if (!prev || prev.phase !== 'ai') return prev;
        const next = runAiTurn(prev, difficulty, mpProfile);
        const cells = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
          if (next.board[r][c].length > prev.board[r][c].length) cells.push({ r, c });
        if (cells.length) setGlow(cells, 'ai');
        return next;
      });
    }, 950);
    return () => clearTimeout(t);
  }, [isBotGame, botGs?.phase, botGs?.gameOver]);

  // ── Overlay detection ────────────────────────────────────────
  // Face-off: navigate directly to FaceOffScreen (no inline overlay)
  // Round win (CALL_WIN): show inline RoundWinOverlay
  useEffect(() => {
    if (!gs?.overlay) return;

    if (gs.overlay.type === 'faceoff') {
      if (gs.overlay.winner === 'player') SoundManager.playWin?.();
      else SoundManager.playLose?.();
      // Clear local overlay state
      if (isBotGame) setBotGs(p => p ? { ...p, overlay: null } : p);
      // Timer auto-pauses via gameOverRef in hook while gs.gameOver=true
      // Navigate DIRECTLY to FaceOffScreen — no inline step

      // Use replace() — removes MultiplayerGameScreen from stack
      // This kills the timer, kills the session watcher, no more "both defeat"
      // FaceOffScreen handles NEXT → Win/Lose/Draw just like solo mode
      navigation.replace('FaceOff', {
        overlay: gs.overlay,
        gs: {
          ...gs,
          isMultiplayer: !isBotGame,
          opponentName:  oppName,
          difficulty:    isBotGame ? difficulty : 'medium', // multiplayer uses flat scoring
        },
      });
      return;
    }

    // Round win / tie — show inline
    if (gs.overlay.winner === 'player') SoundManager.playWin?.();
    else SoundManager.playLose?.();
    setActiveOverlay(gs.overlay);
  }, [gs?.overlay]);

  // ── Board glow ────────────────────────────────────────────────
  const prevBoardRef = useRef(null);
  useEffect(() => {
    if (!gs?.board) return;
    if (prevBoardRef.current) {
      const cells = [];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          if (gs.board[r][c].length !== (prevBoardRef.current[r][c]?.length ?? 0))
            cells.push({ r, c });
      if (cells.length) setGlow(cells, !isMyTurnFinal ? 'opp' : 'place');
    }
    prevBoardRef.current = gs.board;
  }, [gs?.board]);

  // ── Board measurement ─────────────────────────────────────────
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

  const handleDragMove = useCallback((mx, my) => {
    if (!mx || !my || !gs) { setHoverCell(null); return; }
    const cell = getCellFromPage(mx, my);
    if (!cell) { setHoverCell(null); return; }
    setHoverCell({ ...cell, valid: gs.board[cell.r][cell.c].length === gs.currentLayer - 1 });
  }, [getCellFromPage, gs]);

  // ── Dispatch ──────────────────────────────────────────────────
  const doDispatch = useCallback((action) => {
    if (!isMyTurnFinal) return;
    SoundManager.playCardPick?.();
    if (isBotGame) {
      setBotGs(prev => gameReducer(prev, action, difficulty, mpProfile));
      if (action.type === 'PLACE_CARD') { setGlow([{ r: action.r, c: action.c }], 'place'); setSelIdx(null); }
      if (action.type === 'DRAW_CARD')  clearGlow();
    } else {
      mpDispatch(action);
      if (action.type === 'PLACE_CARD') { setGlow([{ r: action.r, c: action.c }], 'place'); setSelIdx(null); }
      if (action.type === 'DRAW_CARD')  clearGlow();
    }
  }, [isMyTurnFinal, isBotGame, mpDispatch, difficulty, mpProfile, setGlow, clearGlow]);

  const handleDrop = useCallback((cardIdx, mx, my) => {
    setHoverCell(null);
    if (!isMyTurnFinal || !gs) return false;
    const cell = getCellFromPage(mx, my);
    if (!cell) return false;
    doDispatch({ type: 'PLACE_CARD', cardIdx, r: cell.r, c: cell.c });
    return true;
  }, [isMyTurnFinal, gs, getCellFromPage, doDispatch]);

  const handleTilePress = useCallback((r, c) => {
    if (!isMyTurnFinal || !gs) return;
    const { swapMode, phase } = gs;
    if (swapMode?.step === 'pick_board') { doDispatch({ type: 'SWAP_PICK_BOARD', r, c }); return; }
    if (swapMode?.step === 'pick_dest')  { doDispatch({ type: 'SWAP_PICK_DEST',  r, c }); return; }
    if (swapMode?.step === 'pick_hand' && selIdx !== null) {
      doDispatch({ type: 'SWAP_PLACE_HAND', cardIdx: selIdx, r, c });
      setSelIdx(null); return;
    }
    if (phase === 'place' && selIdx !== null) {
      doDispatch({ type: 'PLACE_CARD', cardIdx: selIdx, r, c });
      setSelIdx(null);
    }
  }, [isMyTurnFinal, gs, selIdx, doDispatch]);

  // ── Next round handler (called after face-off/win when score < 500) ─
  const handleNextRound = useCallback(() => {
    const deck = shuffle(buildDeck());
    const newGs = {
      ...gs,
      board: Array(4).fill(null).map(() => Array(4).fill(null).map(() => [])),
      drawPile: deck.slice(8),
      playerHand: isPlayer1 ? deck.slice(0,4) : deck.slice(4,8),
      aiHand:     isPlayer1 ? deck.slice(4,8) : deck.slice(0,4),
      phase: isPlayer1 ? 'draw' : 'ai',
      round: (gs?.round || 1) + 1,
      msg: '', msgType: 'info', gameOver: false, winRow: null,
      currentLayer: 1, layerJustChanged: false, swapMode: null, overlay: null,
    };
    if (isBotGame) {
      setBotGs(newGs);
    } else {
      // In multiplayer, broadcast next round signal
      mpDispatch({ type: 'NEXT_ROUND', deck: deck.slice(0,8) });
    }
    clearGlow(); setSelIdx(null); setHoverCell(null); setActiveOverlay(null);
  }, [gs, isPlayer1, isBotGame, mpDispatch, clearGlow]);

  // (No useFocusEffect needed — we replace() to FaceOffScreen so this screen unmounts)

  // ── Game end — only when match score reached ──────────────────
  useEffect(() => {
    if (!gs?.gameOver) return;
    // gameOver=true just means a round ended — only navigate when match is won
    if (gs.pScore < 500 && gs.aScore < 500) return;
    // Don't navigate if a face-off overlay just triggered navigation already
    if (gs.overlay?.type === 'faceoff') return;
    async function finish() {
      setSaving(true);
      const won = gs.pScore >= 500;
      const perfect = !isBotGame && won && gs.aScore === 0;
      const pts = won ? Math.floor(gs.pScore * (isBotGame ? 2.0 : 2.5)) + (perfect ? 500 : 0) : 0;
      try {
        if (user && profile) {
          await supabase.from('profiles').update({
            score:      (profile.score     || 0) + pts,
            games_won:  (profile.games_won || 0) + (won  ? 1 : 0),
            games_lost: (profile.games_lost|| 0) + (!won ? 1 : 0),
          }).eq('id', user.id);
          if (!isBotGame && sessionId)
            await supabase.from('game_sessions').update({ status: 'completed' }).eq('id', sessionId);
          if (botId) await releaseBot(botId);
          await refreshProfile?.();
        }
      } catch {}
      setSaving(false);
      navigation.replace(won ? 'WinScreen' : 'LoseScreen', {
        points: pts, opponentName: oppName, isMultiplayer: true, perfect,
      });
    }
    finish();
  }, [gs?.pScore, gs?.aScore, gs?.gameOver]);

  if (!gs) {
    return (
      <View style={[s.container, { maxWidth: containerW, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.primary, fontSize: 15 }}>🔗  Connecting…</Text>
      </View>
    );
  }

  const isDrawPhase  = gs.phase === 'draw'  && isMyTurnFinal;
  const isPlacePhase = gs.phase === 'place' && isMyTurnFinal;
  const isSwapMode   = !!gs.swapMode && isMyTurnFinal;

  return (
    <View style={[s.container, { maxWidth: containerW }]}>

      {/* Intro sequence */}
      {showIntro && (
        <IntroSequence
          myName={myName} oppName={oppName}
          iGoFirst={isPlayer1}
          onDone={() => setShowIntro(false)}
        />
      )}

      {/* Round win overlay (CALL_WIN) — face-off goes to FaceOffScreen directly */}
      {activeOverlay && activeOverlay.type !== 'faceoff' && (
        <RoundWinOverlay
          overlay={activeOverlay} myName={myName} oppName={oppName}
          onNext={() => {
            if (gs.pScore >= 500 || gs.aScore >= 500) {
              // Match over — game end useEffect will navigate
              setActiveOverlay(null);
            } else {
              // Round over — start next round
              handleNextRound();
            }
          }}
        />
      )}

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <DoundoLogo width={80} height={21} />
        <StatusBadge connStatus={connectionStatus} isBotGame={isBotGame} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.pills}>
            {['L1','L2','L3'].map((l, i) => (
              <View key={l} style={gs.currentLayer === i+1 ? s.pillOn : s.pillOff}>
                <Text style={gs.currentLayer === i+1 ? s.pillOnTxt : s.pillOffTxt}>{l}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')} style={s.settingsBtn}>
            <Text style={s.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Opponent section */}
      <PlayerStrip username={oppName} avatarPreset={oppAv} score={gs.aScore} isMe={false} isActive={!isMyTurnFinal} />
      {/* Timer near opponent when it's their turn */}
      {!isBotGame && !isMyTurnFinal && inactivitySecs > 0 && (
        <TimerBar secs={inactivitySecs} label="⏳ OPP" />
      )}

      {/* Opponent hand — always exactly 4 card backs */}
      <View style={s.oppHand}>
        {[0,1,2,3].map(i => (
          <View key={i} style={{ width: oppW, height: oppH, borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,106,244,0.3)', backgroundColor: '#1E293B' }}>
            <Image source={CARD_BACK} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ))}
      </View>

      {/* Turn banner */}
      <TurnBanner isMyTurn={isMyTurnFinal} myName={myName} oppName={oppName} />

      {/* Board */}
      <View ref={boardRef} style={s.boardSection}
        onLayout={() => boardRef.current?.measure((x,y,w,h,px,py) => { boardLayout.current = { pageX: px, pageY: py, width: w, height: h }; })}
      >
        <GameBoard
          board={gs.board} currentLayer={gs.currentLayer}
          swapMode={gs.swapMode} glowCells={glowCells}
          hoverCell={hoverCell} selIdx={selIdx}
          canPlaceAny={isPlacePhase}
          onTilePress={handleTilePress}
          onBoardLayout={l => { boardLayout.current = l; }}
        />
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <View style={s.btnRow}>
          {(isPlacePhase || isSwapMode) && (
            isSwapMode ? (
              <TouchableOpacity style={[s.swapBtn, { backgroundColor: '#be123c', flex: 1 }]} onPress={() => doDispatch({ type: 'SWAP_CANCEL' })}>
                <Text style={{ fontSize: 18, color: '#FFF' }}>⇄</Text><Text style={s.swapTxt}>CANCEL</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.swapBtn, { backgroundColor: C.primary, flex: 1 }]} onPress={() => doDispatch({ type: 'SWAP_START' })}>
                <Text style={{ fontSize: 18, color: '#FFF' }}>⇄</Text><Text style={s.swapTxt}>SWAP</Text>
              </TouchableOpacity>
            )
          )}
          <DrawBtn active={isDrawPhase} count={gs.drawPile?.length || 0} onDraw={() => doDispatch({ type: 'DRAW_CARD' })} />
        </View>

        {/* My hand */}
        <View style={s.handRow}>
          {(gs.playerHand || []).map((card, i) => (
            <View key={`slot-${i}`}>
              <HandCard
                key={card?.uid ?? i} card={card} idx={i}
                cardW={cardW} cardH={cardH}
                disabled={!isPlacePhase && !isSwapMode}
                isSelected={selIdx === i}
                onTap={() => { if (!isPlacePhase && !isSwapMode) return; SoundManager.playCardPick?.(); setSelIdx(p => p === i ? null : i); }}
                onDragStart={() => { setSelIdx(i); boardRef.current?.measure((x,y,w,h,px,py) => { boardLayout.current = { pageX: px, pageY: py, width: w, height: h }; }); }}
                onDragMove={handleDragMove}
                onDrop={handleDrop}
              />
            </View>
          ))}
          {Array(Math.max(0, 4 - (gs.playerHand?.length || 0))).fill(null).map((_,i) => (
            <View key={`e-${i}`} style={[s.emptySlot, { width: cardW, height: cardH }]}>
              <Text style={{ color: C.s800, fontSize: 20 }}>+</Text>
            </View>
          ))}
        </View>

        {/* Timer near my cards when it's MY turn */}
        {!isBotGame && isMyTurnFinal && inactivitySecs > 0 && (
          <TimerBar secs={inactivitySecs} label="⏱ YOU" />
        )}

        <PlayerStrip username={myName} avatarPreset={myAvatar} score={gs.pScore} isMe isActive={isMyTurnFinal} />
      </View>

      {/* Action bar */}
      <View style={[s.actionBar, { paddingBottom: insets.bottom + 4 }]}>
        <TouchableOpacity
          style={[s.faceOffBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]}
          onPress={() => doDispatch({ type: 'FACE_OFF' })}
          disabled={!isDrawPhase || gs.gameOver}
        >
          <Text style={{ fontSize: 15, color: '#FFF' }}>⚡</Text>
          <Text style={s.faceOffTxt}>FACE-OFF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.winBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]}
          onPress={() => doDispatch({ type: 'CALL_WIN' })}
          disabled={!isDrawPhase || gs.gameOver}
        >
          <Text style={{ fontSize: 15 }}>👑</Text>
          <Text style={s.winTxt}>WIN</Text>
        </TouchableOpacity>
      </View>

      {/* Error message for failed CALL_WIN */}
      {gs.msg && gs.msgType === 'warn' && !isMyTurnFinal && (
        <View style={s.errBanner}>
          <Text style={s.errTxt}>{gs.msg}</Text>
        </View>
      )}
      {gs.msg && gs.msgType === 'warn' && isMyTurnFinal && (
        <View style={[StyleSheet.absoluteFillObject, { top: undefined, bottom: 80, alignItems: 'center', zIndex: 80 }]} pointerEvents="none">
          <View style={s.errBanner}>
            <Text style={s.errTxt}>{gs.msg}</Text>
          </View>
        </View>
      )}

      <BottomNav navigation={navigation} activeRoute="Game" />
    </View>
  );
}

const StatusBadge = ({ connStatus, isBotGame }) => {
  if (isBotGame) return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: '#a78bfa', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>🤖 BOT</Text>
    </View>
  );
  const ok = connStatus === 'connected';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: ok ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ok ? '#22C55E' : '#FBBF24' }} />
      <Text style={{ color: ok ? '#22C55E' : '#FBBF24', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>{ok ? 'LIVE' : 'RECONNECTING'}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg, alignSelf: 'center', width: '100%' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6, gap: 8 },
  pills:        { flexDirection: 'row', gap: 3, backgroundColor: C.s800, padding: 3, borderRadius: 8 },
  pillOn:       { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: C.primary, borderRadius: 9999 },
  pillOnTxt:    { color: '#FFF', fontSize: 10, fontWeight: '700' },
  pillOff:      { paddingHorizontal: 8, paddingVertical: 3, opacity: 0.2 },
  pillOffTxt:   { color: C.s400, fontSize: 10, fontWeight: '700' },
  settingsBtn:  { padding: 4 },
  settingsIcon: { fontSize: 18, opacity: 0.7 },
  oppHand:      { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: 4, opacity: 0.7 },
  boardSection: { flex: 1, width: '100%', alignItems: 'center' },
  controls:     { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  btnRow:       { flexDirection: 'row', gap: 10, maxWidth: 320, alignSelf: 'center', width: '100%' },
  swapBtn:      { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 12, borderRadius: 12 },
  swapTxt:      { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  handRow:      { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  emptySlot:    { borderRadius: 8, borderWidth: 2, borderColor: C.s800, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  drawBtn:      { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, position: 'relative' },
  drawLabel:    { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  drawBadge:    { position: 'absolute', top: 5, right: 8, backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  drawBadgeTxt: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  strip:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 5 },
  stripAv:      { width: 34, height: 34, borderRadius: 17, borderWidth: 2, overflow: 'hidden' },
  stripName:    { color: '#FFF', fontSize: 13, fontWeight: '700' },
  stripScore:   { color: C.s500, fontSize: 11 },
  activeDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  timerRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 2, gap: 8 },
  timerLabel:   { fontSize: 9, fontWeight: '800', letterSpacing: 1, minWidth: 48 },
  timerBg:      { flex: 1, height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden' },
  timerFill:    { height: '100%', borderRadius: 2 },
  timerNum:     { fontSize: 11, fontWeight: '800', minWidth: 30, textAlign: 'right' },
  turnBanner:   { marginHorizontal: 16, marginBottom: 4, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  turnMy:       { backgroundColor: 'rgba(37,106,244,0.15)', borderWidth: 1, borderColor: 'rgba(37,106,244,0.4)' },
  turnOpp:      { backgroundColor: 'rgba(100,116,139,0.1)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  turnTxt:      { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  actionBar:    { flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'rgba(15,23,42,0.9)', borderTopWidth: 1, borderTopColor: C.s800 },
  faceOffBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.primary, paddingVertical: 13, borderRadius: 9999 },
  faceOffTxt:   { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  winBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.s800, paddingVertical: 13, borderRadius: 9999 },
  winTxt:       { color: C.s300, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  errBanner:    { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, marginHorizontal: 20 },
  errTxt:       { color: '#f87171', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  // Round win overlay button
  foBtn:        { backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 9999 },
  foBtnTxt:     { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 3 },
});
