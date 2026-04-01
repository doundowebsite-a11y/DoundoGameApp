/**
 * MultiplayerGameScreen.jsx — src/screens/MultiplayerGameScreen.jsx
 *
 * FIXES:
 *
 * 1. BOT TIMER — inactivitySecs was always 0 for bot games because it came
 *    from useMultiplayerGame (only ticks for real multiplayer).
 *    FIX: Added a dedicated botTimer that ticks every second when it's the
 *    bot's turn (gs.phase === 'ai'), resets on every player action and
 *    every bot turn completion.
 *
 * 2. BOT HUMAN-LIKE DELAYS — The AI fired after a fixed 950ms which felt
 *    robotic. Now each bot action has a randomized delay:
 *      - DRAW phase:  1.2s–2.5s  (bot "thinks" before drawing)
 *      - PLACE phase: 0.8s–2.0s  (bot "picks" a card to place)
 *    Multi-step actions (draw → place) each get their own delay.
 *
 * 3. SWAP tile press fixed to handle all 3 swap steps (pick_dest added).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Easing, Vibration, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoundoLogo }     from '../assets/logo/doundo_logo';
import BottomNav from '../components/ui/BottomNav';
import SoundManager       from '../services/SoundManager';
import { supabase }       from '../services/supabase';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { isTablet } from '../utils/scale';
import { useGameGlow, detectBoardChanges } from '../game/useGameGlow';
import GameBoard          from '../game/GameBoard';
import HandCard           from '../game/HandCard';
import { useAuth }        from '../context/AuthContext';
import { releaseBot }     from '../services/botService';
import useMultiplayerGame from '../hooks/useMultiplayerGame';
import {
  makeInitialState, buildDeck,
} from '../game/engine/gameUtils';
import { seededShuffle }  from '../game/engine/seededShuffle';
import { gameReducer }    from '../game/engine/gameReducer';
import { runAiTurn }      from '../ai/aiLogic';

const CARD_BACK = require('../assets/icons/card_back.png');

const AVATARS = {
  1: require('../assets/avatars/preset_1.jpg'),
  2: require('../assets/avatars/preset_2.jpg'),
  3: require('../assets/avatars/preset_3.jpg'),
  4: require('../assets/avatars/preset_4.jpg'),
  5: require('../assets/avatars/avatar_main.jpg'),
  6: require('../assets/avatars/preset_2.jpg'),
};
const getAvatar = p => AVATARS[p] ?? AVATARS[1];

function hashString(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const C = {
  bg: '#101622', primary: '#256af4',
  s800: '#1E293B', s700: '#334155',
  s500: '#64748B', s400: '#94A3B8', s300: '#CBD5E1',
};

// ── Random delay for human-like bot behaviour ─────────────────────
// min/max in milliseconds
function randDelay(min, max) {
  return min + Math.floor(Math.random() * (max - min));
}

// ── Deal animation ────────────────────────────────────────────────
const SimpleDealAnimation = React.memo(({ onComplete }) => {
  const cards = useRef(Array.from({ length: 8 }, () => ({
    x: new Animated.Value(0), y: new Animated.Value(0),
    op: new Animated.Value(0), rot: new Animated.Value(0),
  }))).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SoundManager.playShuffle?.();
    const dest = [
      { x: -108, y: -110 }, { x: -36, y: -110 }, { x: 36, y: -110 }, { x: 108, y: -110 },
      { x: -108, y:  110 }, { x: -36, y:  110 }, { x: 36, y:  110 }, { x: 108, y:  110 },
    ];
    const appear   = cards.map((c, i) => Animated.timing(c.op, { toValue: 1, duration: 80, delay: i * 20, useNativeDriver: true }));
    const spread   = cards.map((c, i) => Animated.parallel([
      Animated.timing(c.x,   { toValue: (i - 3.5) * 10, duration: 200, useNativeDriver: true }),
      Animated.timing(c.rot, { toValue: (i - 3.5) * 4,  duration: 200, useNativeDriver: true }),
    ]));
    const collapse = cards.map(c => Animated.parallel([
      Animated.timing(c.x,   { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(c.rot, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]));
    const deal = cards.map((c, i) => Animated.parallel([
      Animated.spring(c.x, { toValue: dest[i].x, friction: 7, tension: 60, delay: i * 70, useNativeDriver: true }),
      Animated.spring(c.y, { toValue: dest[i].y, friction: 7, tension: 60, delay: i * 70, useNativeDriver: true }),
    ]));
    Animated.sequence([
      Animated.stagger(20, appear), Animated.delay(100),
      Animated.parallel(spread),   Animated.delay(120),
      Animated.parallel(collapse), Animated.delay(80),
      Animated.parallel(deal),     Animated.delay(400),
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
});


// ── Coin flip ─────────────────────────────────────────────────────
const CoinFlip = React.memo(({ myName, oppName, iGoFirst, onDone }) => {
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
});


const IntroSequence = ({ myName, oppName, iGoFirst, onDone }) => {
  const [phase, setPhase] = useState('deal');
  if (phase === 'deal') return <SimpleDealAnimation onComplete={() => setPhase('coin')} />;
  if (phase === 'coin') return <CoinFlip myName={myName} oppName={oppName} iGoFirst={iGoFirst} onDone={() => { setPhase('done'); onDone?.(); }} />;
  return null;
};

// ── Turn banner ───────────────────────────────────────────────────
const TurnBanner = React.memo(({ isMyTurn, myName, oppName }) => {
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
    <Animated.View style={[s.turnBanner, isMyTurn ? s.turnMy : s.turnOpp, { transform: [{ scale: pulse }], marginVertical: 2 }]}>
      <Text style={[s.turnTxt, { color: isMyTurn ? '#60a5fa' : C.s500 }]}>
        {isMyTurn ? `⚡  ${myName}'s Turn` : `⏳  ${oppName} is playing…`}
      </Text>
    </Animated.View>
  );
});


// ── Timer bar ─────────────────────────────────────────────────────
const TimerBar = React.memo(({ secs, label }) => {
  const pct   = Math.max(0, ((45 - secs) / 45) * 100);
  const color = secs >= 35 ? '#f87171' : secs >= 20 ? '#FACC15' : '#22C55E';
  return (
    <View style={s.timerRow}>
      <Text style={[s.timerLabel, { color }]}>{label}</Text>
      <View style={s.timerBg}>
        <View style={[s.timerFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[s.timerNum, { color }]}>{Math.max(0, 45 - secs)}s</Text>
    </View>
  );
});


// ── Player strip ──────────────────────────────────────────────────
const PlayerStrip = React.memo(({ username, avatarPreset, score, isMe, isActive }) => (
  <View style={s.strip}>
    <View style={[s.stripAv, { borderColor: isActive ? C.primary : C.s700 }]}>
      <Image source={getAvatar(avatarPreset)} style={{ width: '100%', height: '100%' }} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.stripName} numberOfLines={1}>{username}{isMe ? ' (You)' : ''}</Text>
      <Text style={s.stripScore}>{score ?? 0} pts</Text>
    </View>
    {isActive && <View style={s.activeDot} />}
  </View>
));


// ── Status badge ──────────────────────────────────────────────────
const StatusBadge = React.memo(({ connStatus, isBotGame }) => {
  const ok   = connStatus === 'connected' || isBotGame;
  const text = isBotGame ? 'BOT' : connStatus === 'reconnecting' ? 'RECONNECTING' : ok ? 'LIVE' : 'CONNECTING';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: ok ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ok ? '#22C55E' : '#FBBF24' }} />
      <Text style={{ color: ok ? '#22C55E' : '#FBBF24', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>{text}</Text>
    </View>
  );
});


// ── Round win overlay ─────────────────────────────────────────────
const RoundWinOverlay = React.memo(({ overlay, myName, oppName, onNext }) => {
  const won = overlay.winner === 'player';
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 900, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 }]}>
      <Text style={{ color: won ? '#4ADE80' : '#f87171', fontSize: 36, fontWeight: '900', textAlign: 'center' }}>
        {won ? '🏆 YOU WIN!' : `🎯 ${oppName} Wins!`}
      </Text>
      {overlay.matchText && <Text style={{ color: '#4ADE80', fontSize: 22, fontWeight: '700' }}>{overlay.matchText}</Text>}
      <TouchableOpacity style={s.foOverlayBtn} onPress={onNext}>
        <Text style={s.foOverlayBtnTxt}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
});


// ── Swap button ───────────────────────────────────────────────────
const SwapButton = React.memo(({ isSwapMode, onSwap, onCancel }) => (
  <TouchableOpacity
    style={[s.swapBtn, { backgroundColor: isSwapMode ? '#be123c' : C.primary }]}
    onPress={isSwapMode ? onCancel : onSwap}
  >
    <Text style={{ fontSize: 18, color: '#FFF' }}>⇄</Text>
    <Text style={s.swapBtnText}>{isSwapMode ? 'CANCEL' : 'SWAP'}</Text>
  </TouchableOpacity>
));


// ── Draw button ───────────────────────────────────────────────────
const DrawButton = React.memo(({ isDrawPhase, count, onDraw }) => (
  <TouchableOpacity onPress={onDraw} disabled={!isDrawPhase} style={{ flex: 1 }}>
    <View style={[s.drawBtn, isDrawPhase
      ? { backgroundColor: C.primary, borderColor: 'rgba(255,255,255,0.2)' }
      : { opacity: 0.4, backgroundColor: C.s800, borderColor: 'rgba(255,255,255,0.1)' }
    ]}>
      <Text style={{ fontSize: 18, color: '#FFF' }}>🃏</Text>
      <Text style={s.drawBtnText}>DRAW CARD</Text>
      <View style={s.drawBadge}><Text style={s.drawBadgeTxt}>{count}</Text></View>
    </View>
  </TouchableOpacity>
));


// ─────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────
export default function MultiplayerGameScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const dims   = useDimensions();
  const { profile, user, refreshProfile } = useAuth();

  const {
    sessionId, isPlayer1 = true,
    opponentUsername, opponentAvatar = 1,
    isBotGame = false, botId = null, difficulty = 'medium',
    deckSeed = 12345, isTutorial = false,
  } = route.params || {};

  const metrics = React.useMemo(() => getBoardMetrics(dims.width), [dims.width]);
  const { containerW, tileSize } = metrics;

  const myName    = profile?.username      ?? 'You';
  const myAvatar  = profile?.avatar_preset ?? 1;
  const mpProfile = { ...profile, isMultiplayer: !isBot };

  const cardW = isTablet() ? Math.min(120, Math.floor(tileSize * 0.9)) : Math.max(52, Math.floor(tileSize * 0.9));
  const cardH = Math.floor(cardW * 1.44);
  const oppW  = Math.floor(cardW * 0.48);
  const oppH  = Math.floor(cardH * 0.48);

  const startTimeRef   = useRef(Date.now());
  const cardsPlayedRef = useRef(0);
  const navigatedRef   = useRef(false);

  // ── Bot game state ─────────────────────────────────────────────
  const [botGs, setBotGs] = useState(() =>
    (isBotGame || botId === 'tutorial-bot')
      ? makeInitialState(seededShuffle(buildDeck(), deckSeed))
      : null
  );

  // ── BOT TIMER (FIX 1) ──────────────────────────────────────────
  // inactivitySecs from useMultiplayerGame is always 0 for bot games.
  // We manage a separate timer for bots that ticks during the bot's turn.
  const [botTimerSecs, setBotTimerSecs] = useState(0);
  const botTimerIntervalRef = useRef(null);

  const resetBotTimer = useCallback(() => {
    clearInterval(botTimerIntervalRef.current);
    setBotTimerSecs(0);
    botTimerIntervalRef.current = setInterval(() => {
      setBotTimerSecs(s => s + 1);
    }, 1000);
  }, []);

  const stopBotTimer = useCallback(() => {
    clearInterval(botTimerIntervalRef.current);
    botTimerIntervalRef.current = null;
    setBotTimerSecs(0);
  }, []);

  useEffect(() => {
    return () => clearInterval(botTimerIntervalRef.current);
  }, []);

  // ── Multiplayer state ──────────────────────────────────────────
  const {
    gs: mpGs, dispatch: mpDispatch, connectionStatus, opponentInfo,
    isMyTurn: isMyTurnMp, inactivitySecs, setOnForfeit, resetGameState,
  } = useMultiplayerGame({
    sessionId, myUserId: user?.id, isPlayer1, profile: mpProfile,
    onSwapGlow: (cells) => {
      if (cells) setGlow(cells, 'opp');
      else clearGlow();
    },
  });

  useEffect(() => {
    if ((isBotGame || botId === 'tutorial-bot') || !setOnForfeit) return;
    setOnForfeit(result => {
      const pts = result === 'win' ? 250 : 0;
      navigation.replace(result === 'win' ? 'WinScreen' : 'LoseScreen', {
        points: pts, forfeit: true, opponentName: oppName,
        isMultiplayer: true, sessionId, isPlayer1, opponentAvatar: oppAv,
      });
    });
  }, [isBotGame, botId, setOnForfeit]);

  const isBot         = isBotGame || botId === 'tutorial-bot';
  const gs            = isBot ? botGs : mpGs;
  const isMyTurnFinal = isBot ? (gs?.phase !== 'ai') : isMyTurnMp;
  const oppName       = isBot ? (opponentUsername ?? 'Bot') : (opponentInfo?.username ?? opponentUsername ?? 'Opponent');
  const oppAv         = isBot ? (opponentAvatar ?? 1) : (opponentInfo?.avatarPreset ?? opponentAvatar ?? 1);

  // Timer to show: for bots use botTimerSecs, for real MP use inactivitySecs
  const displayTimerSecs = isBot ? botTimerSecs : inactivitySecs;

  const [selIdx,       setSelIdx]       = useState(null);
  const [hoverCell,    setHoverCell]    = useState(null);
  const [showIntro,    setShowIntro]    = useState(true);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const { glowCells, glowReason, setGlow, clearGlow } = useGameGlow();
  const boardRef    = useRef(null);
  const boardLayout = useRef(null);

  useEffect(() => { SoundManager.init(); return () => SoundManager.cleanup(); }, []);

  // ── BOT AI TURN WITH HUMAN-LIKE DELAYS (FIX 2) ────────────────
  // Bot logic revised: starts at phase === 'ai'
  useEffect(() => {
    if (!isBot || !gs || gs.gameOver || gs.phase !== 'ai') return;

    resetBotTimer();
    const totalDelay = randDelay(2000, 4500); // Wait, then play full turn
    const t = setTimeout(() => {
      setBotGs(prev => {
        if (!prev || prev.phase !== 'ai' || prev.gameOver) return prev;
        const next = runAiTurn(prev, difficulty, mpProfile);
        const { changed } = detectBoardChanges(prev.board, next.board);
        if (changed.length) setGlow(changed, 'ai');
        stopBotTimer();
        return next;
      });
    }, totalDelay);

    return () => clearTimeout(t);
  }, [gs?.phase, gs?.gameOver, isBot]);

  // Bot Inactivity Check
  useEffect(() => {
    if (!isBot || gs?.gameOver || botTimerSecs < 45) return;
    console.warn('[bot] timeout! Player wins by forfeit.');
    stopBotTimer();
    
    // Create a game-over state
    const pts = 250;
    navigation.replace('WinScreen', {
      points: pts, forfeit: true, opponentName: oppName,
      isMultiplayer: true, sessionId, isPlayer1, opponentAvatar: oppAv,
    });
  }, [botTimerSecs, isBot, gs?.gameOver]);

  // Reset bot timer when it becomes my turn
  useEffect(() => {
    if (isBot && isMyTurnFinal && !gs?.gameOver) {
      resetBotTimer();
    }
  }, [isMyTurnFinal, gs?.gameOver]);


  // ── Overlay / Navigation ───────────────────────────────────────
  useEffect(() => {
    if (!gs?.overlay) return;
    if (gs.overlay.type === 'faceoff') {
      if (gs.overlay.winner === 'player') SoundManager.playWin?.();
      else SoundManager.playLose?.();
      if (profile?.vibration_enabled !== false) Vibration.vibrate([0, 150, 50, 150]);
      if (isBot) setBotGs(p => p ? { ...p, overlay: null } : p);
      
      const realOpponentId = isBot ? botId : (opponentInfo?.id ?? null);
      navigation.replace('FaceOff', {
        overlay: gs.overlay,
        gs: { ...gs, isMultiplayer: !isBot, opponentName: oppName, difficulty: isBot ? difficulty : 'medium' },
        sessionId,
        isPlayer1,
        opponentAvatar: oppAv,
        opponentId: realOpponentId,
      });
      return;
    }

    if (gs.overlay.winner === 'player') SoundManager.playWin?.();
    else SoundManager.playLose?.();
    setActiveOverlay(gs.overlay);
  }, [gs?.overlay]);

  // ── Match End ──────────────────────────────────────────────────
  useEffect(() => {
    if (!gs?.gameOver) return;
    const isTutorialFinal = isTutorial || botId === 'tutorial-bot';
    const tutorialWon = isTutorialFinal && gs.pScore > 0;
    const isTie = gs.overlay?.type === 'tie' || gs.overlay?.winner === 'tie';
    if (gs.pScore < 500 && gs.aScore < 500 && !tutorialWon && !isTie) return;
    if (gs.overlay?.type === 'faceoff') return;
    if (navigatedRef.current) return;

    async function finish() {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      stopBotTimer();

      const finalP = gs?.pScore || 0;
      const finalA = gs?.aScore || 0;
      const won    = finalP >= 500 || (isTutorialFinal && finalP > finalA);
      const lost   = finalA >= 500 && finalP < 500;

      const perfect = !isBot && won && gs.aScore === 0;
      const pts = won
        ? Math.floor(gs.pScore * (isBot ? 2.0 : 2.5)) + (perfect ? 500 : 0)
        : 0;
      const elapsedSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const mm = String(Math.floor(elapsedSecs / 60)).padStart(2, '0');
      const ss = String(elapsedSecs % 60).padStart(2, '0');
      const matchTime = `${mm}:${ss}`;

      // OPTIMIZATION: Navigate first, sync in background to remove lag
      let targetScreen = 'DrawScreen';
      if (won) targetScreen = 'WinScreen';
      else if (lost || finalA > finalP) targetScreen = 'LoseScreen';

      // Pass opponentId as the opponent's real userId so rematch can create a new session
      const realOpponentId = isBot ? botId : (opponentInfo?.id ?? null);

      navigation.replace(targetScreen, {
        points: pts, opponentName: oppName, isMultiplayer: true, perfect,
        totalCards: cardsPlayedRef.current, time: matchTime,
        sessionId, isPlayer1, opponentAvatar: oppAv,
        opponentId: realOpponentId,  // real userId for rematch
      });

      if (user?.id) {
        try {
          supabase.from('profiles').update({
            first_game_completed: true,
            tutorial_completed: true,
          }).eq('id', user.id).then();
        } catch {}
        try {
          supabase.functions.invoke('process_match_result', {
            body: { matchPoints: pts, wonGame: won, lostGame: !won && finalA >= 500, matchEnded: true },
          }).then();
        } catch {}
        try {
          if (!isBot && sessionId) supabase.from('game_sessions').update({ status: 'completed' }).eq('id', sessionId).then();
          if (botId) releaseBot(botId).then();
        } catch {}
      }
    }

    finish();
  }, [gs?.pScore, gs?.aScore, gs?.gameOver]);

  // ── Dispatch ──────────────────────────────────────────────────
  const doDispatch = useCallback((action) => {
    if (!isMyTurnFinal) return;
    if (action.type === 'PLACE_CARD' || action.type === 'SWAP_PLACE_HAND') {
      cardsPlayedRef.current++;
      SoundManager.playCardPick?.();
    }
    if (isBot) {
      setBotGs(prev => {
        const next = gameReducer(prev, action, difficulty, mpProfile);
        return next;
      });
      if (action.type === 'PLACE_CARD' || action.type === 'SWAP_PLACE_HAND') {
        setGlow([{ r: action.r, c: action.c }], 'place');
        setSelIdx(null);
      }
      if (action.type === 'DRAW_CARD') { clearGlow(); resetBotTimer(); }
    } else {
      // For SWAP_PLACE_HAND, track the two affected cells for opponent glow
      if (action.type === 'SWAP_PLACE_HAND' && gs?.swapMode) {
        const { fromR, fromC, toR, toC } = gs.swapMode;
        action._swapGlow = [{ r: fromR, c: fromC }, { r: toR ?? action.r, c: toC ?? action.c }];
      }
      mpDispatch(action);
      if (action.type === 'PLACE_CARD' || action.type === 'SWAP_PLACE_HAND') {
        setGlow([{ r: action.r, c: action.c }], 'place');
        setSelIdx(null);
      }
      if (action.type === 'DRAW_CARD') clearGlow();
    }
  }, [isMyTurnFinal, isBot, mpDispatch, difficulty, mpProfile, setGlow, clearGlow, resetBotTimer, gs]);

  // ── Drag & drop ───────────────────────────────────────────────
  const getCellFromPage = useCallback((mx, my) => {
    const bl = boardLayout.current;
    if (!bl) return null;
    const { pageX, pageY, width: bw, height: bh } = bl;
    if (mx < pageX || mx > pageX + bw || my < pageY || my > pageY + bh) return null;
    const { tileSize: ts, gap: g, tilePadding: tp } = getBoardMetrics(dims.width);
    const col = Math.floor((mx - pageX - tp) / (ts + g));
    const row = Math.floor((my - pageY - 4) / (ts + g));
    return (row >= 0 && row < 4 && col >= 0 && col < 4) ? { r: row, c: col } : null;
  }, [dims.width]);

  const lastDragTimeRef = useRef(0);
  const handleDragMove = useCallback((mx, my) => {
    if (!gs) return;
    const now = Date.now();
    if (now - lastDragTimeRef.current < 32) return;
    lastDragTimeRef.current = now;

    const cell = getCellFromPage(mx, my);
    if (!cell) { setHoverCell(null); return; }

    // Determine validity based on current swap step
    let valid = false;
    const swapStep = gs.swapMode?.step;
    if (swapStep === 'pick_board') {
      // Source: any filled cell
      valid = gs.board[cell.r][cell.c].length >= 1;
    } else if (swapStep === 'pick_dest') {
      // Dest: empty at current layer, not same as source
      const isSrc = cell.r === gs.swapMode.fromR && cell.c === gs.swapMode.fromC;
      valid = !isSrc && gs.board[cell.r][cell.c].length === gs.currentLayer - 1;
    } else if (swapStep === 'pick_hand') {
      // Card must go to vacated source cell
      valid = cell.r === gs.swapMode.fromR && cell.c === gs.swapMode.fromC;
    } else {
      // Normal place
      valid = gs.board[cell.r][cell.c].length === gs.currentLayer - 1;
    }

    setHoverCell(prev => {
      if (prev?.r === cell.r && prev?.c === cell.c && prev?.valid === valid) return prev;
      return { ...cell, valid };
    });
  }, [getCellFromPage, gs]);

  const handleDrop = useCallback((cardIdx, mx, my) => {
    if (!gs) return false;
    setHoverCell(null);
    const cell = getCellFromPage(mx, my);
    if (!cell) return false;

    const swapStep = gs.swapMode?.step;
    if (swapStep === 'pick_hand') {
      doDispatch({ type: 'SWAP_PLACE_HAND', cardIdx, r: cell.r, c: cell.c });
      return true;
    }
    // For swap board/dest steps, dragging a card onto a board cell
    // also triggers those steps (card acts as a pointer/visual aid)
    if (swapStep === 'pick_board') {
      doDispatch({ type: 'SWAP_PICK_BOARD', r: cell.r, c: cell.c });
      return false; // card snaps back; board step happened
    }
    if (swapStep === 'pick_dest') {
      doDispatch({ type: 'SWAP_PICK_DEST', r: cell.r, c: cell.c });
      return false; // card snaps back; dest step happened
    }
    doDispatch({ type: 'PLACE_CARD', cardIdx, r: cell.r, c: cell.c });
    return true;
  }, [getCellFromPage, doDispatch, gs]);

  const handleCellDragStart = useCallback((r, c) => {
    if (!gs || !isMyTurnFinal) return;
    if (gs.swapMode?.step === 'pick_board') {
      doDispatch({ type: 'SWAP_PICK_BOARD', r, c });
    }
  }, [gs, isMyTurnFinal, doDispatch]);

  const handleCellDrop = useCallback((r, c, mx, my) => {
    if (!gs) return false;
    setHoverCell(null);
    const cell = getCellFromPage(mx, my);
    if (!cell) return false;

    // We just finished dragging a board card. If the destination is valid, we trigger pick_dest.
    if (gs.swapMode?.step === 'pick_dest') {
      doDispatch({ type: 'SWAP_PICK_DEST', r: cell.r, c: cell.c });
      return false; // The GridCell panResponder will snap back, but game state will be updated
    }
    return false;
  }, [getCellFromPage, doDispatch, gs]);

  const handleTilePress = useCallback((r, c) => {

    if (!isMyTurnFinal || !gs) return;
    const { swapMode, phase } = gs;
    if (swapMode?.step === 'pick_board') {
      doDispatch({ type: 'SWAP_PICK_BOARD', r, c });
    } else if (swapMode?.step === 'pick_dest') {
      doDispatch({ type: 'SWAP_PICK_DEST', r, c });
    } else if (swapMode?.step === 'pick_hand') {
      if (selIdx !== null) {
        doDispatch({ type: 'SWAP_PLACE_HAND', cardIdx: selIdx, r, c });
        setSelIdx(null);
      }
    } else if (phase === 'place' && selIdx !== null) {
      doDispatch({ type: 'PLACE_CARD', cardIdx: selIdx, r, c });
      setSelIdx(null);
    }
  }, [isMyTurnFinal, gs, selIdx, doDispatch]);

  const isDrawPhase  = gs?.phase === 'draw'  && isMyTurnFinal;
  const turnNum = gs?.turn ?? 1;
  const isMyTurn = isPlayer1 ? turnNum === 1 : turnNum === 2;
  const isPlacePhase = gs?.phase === 'place' && isMyTurn;
  const isSwapMode   = !!gs?.swapMode        && isMyTurn;

  // Cards are draggable during place phase AND all swap steps
  const isCardDraggable = () => {
    if (!isMyTurnFinal) return false;
    return isPlacePhase || isSwapMode;
  };

  if (!gs) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16, opacity: 0.6 }}>Connecting…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {showIntro && (
        <IntroSequence myName={myName} oppName={oppName} iGoFirst={isPlayer1} onDone={() => setShowIntro(false)} />
      )}

      {activeOverlay && (
        <RoundWinOverlay
          overlay={activeOverlay}
          myName={myName}
          oppName={oppName}
          onNext={() => {
            const nextRound = (gs?.round || 1) + 1;
            const seedBase  = sessionId ? hashString(sessionId) : 12345;
            const deck      = seededShuffle(buildDeck(), seedBase + nextRound * 7919);
            const resetGs   = {
              ...gs,
              board: Array(4).fill(null).map(() => Array(4).fill(null).map(() => [])),
              currentLayer: 1, round: nextRound, gameOver: false, overlay: null,
              drawPile:   deck.slice(8),
              playerHand: isPlayer1 ? deck.slice(0, 4) : deck.slice(4, 8),
              aiHand:     isPlayer1 ? deck.slice(4, 8) : deck.slice(0, 4),
              phase:      isPlayer1 ? 'draw' : 'ai',
              swapMode: null, opponentSwapMode: null,
            };
            if (isBot) setBotGs(resetGs);
            else {
              resetGameState(resetGs);
              mpDispatch({ type: 'NEXT_ROUND', deck: deck.slice(0, 8) });
            }
            setActiveOverlay(null);
          }}
        />
      )}

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <DoundoLogo width={isTablet() ? 90 : 70} height={isTablet() ? 24 : 18} />
        <StatusBadge connStatus={connectionStatus} isBotGame={isBot} />
        <View style={s.pills}>
          {['L1', 'L2', 'L3'].map((l, i) => (
            <View key={l} style={gs.currentLayer === i + 1 ? s.pillOn : s.pillOff}>
              <Text style={gs.currentLayer === i + 1 ? s.pillOnTxt : s.pillOffTxt}>{l}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>


      {/* Opponent info */}
      <PlayerStrip username={oppName} avatarPreset={oppAv} score={gs.aScore} isMe={false} isActive={!isMyTurnFinal} />
      {!isMyTurnFinal && <TimerBar label="⏳ OPP" secs={displayTimerSecs} />}

      <View style={s.oppHand}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={{ width: oppW, height: oppH, borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,106,244,0.3)', backgroundColor: C.s800 }}>
            <Image source={CARD_BACK} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ))}
      </View>

      <TurnBanner isMyTurn={isMyTurnFinal} myName={myName} oppName={oppName} />

      {/* Board — flex:1 so it takes remaining space */}
      <View
        ref={boardRef}
        style={s.boardSection}
        onLayout={() => boardRef.current?.measure((x, y, w, h, px, py) => {
          boardLayout.current = { pageX: px, pageY: py, width: w, height: h };
        })}
      >
        <GameBoard
          board={gs.board}
          currentLayer={gs.currentLayer}
          swapMode={gs.swapMode}
          glowCells={glowCells}
          glowReason={glowReason}
          hoverCell={hoverCell}
          selIdx={selIdx}
          canPlaceAny={isPlacePhase || !!gs.swapMode}
          onTilePress={handleTilePress}
          onBoardLayout={l => { boardLayout.current = l; }}
          onCellDragStart={handleCellDragStart}
          onCellDragMove={handleDragMove}
          onCellDrop={handleCellDrop}
        />
      </View>


      {/* Fixed-height bottom controls */}
      <View style={s.controls}>
        <View style={s.btnRow}>
          {(isPlacePhase || isSwapMode) && (
            <SwapButton
              isSwapMode={isSwapMode}
              onSwap={() => doDispatch({ type: 'SWAP_START' })}
              onCancel={() => doDispatch({ type: 'SWAP_CANCEL' })}
            />
          )}
          <DrawButton
            isDrawPhase={isDrawPhase}
            count={gs.drawPile?.length || 0}
            onDraw={() => doDispatch({ type: 'DRAW_CARD' })}
          />
        </View>

        <View style={s.handRow}>
          {(gs.playerHand || []).map((card, i) => (
            <HandCard
              key={card?.uid ?? i}
              card={card} idx={i}
              cardW={cardW} cardH={cardH}
              disabled={!isCardDraggable(i)}
              isSelected={selIdx === i}
              isSwapTarget={gs.swapMode?.step === 'pick_hand'}
              onTap={() => {
                if (!isPlacePhase && !isSwapMode) return;
                if (gs.swapMode?.step === 'pick_hand') {
                  doDispatch({ type: 'SWAP_PLACE_HAND', cardIdx: i, r: gs.swapMode.fromR, c: gs.swapMode.fromC });
                  setSelIdx(null);
                  return;
                }
                setSelIdx(p => p === i ? null : i);
              }}
              onDragStart={() => setSelIdx(i)}
              onDragMove={handleDragMove}
              onDrop={handleDrop}
            />
          ))}
        </View>

        {isMyTurnFinal && <TimerBar label="⏱ YOU" secs={displayTimerSecs} />}
        <PlayerStrip username={myName} avatarPreset={myAvatar} score={gs.pScore} isMe isActive={isMyTurnFinal} />
      </View>

      <View style={[s.actionBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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

      <BottomNav
        navigation={navigation}
        activeRoute="Game"
        onHomePress={() => {
          if (gs.gameOver) {
            navigation.navigate('Home');
            return;
          }
          Alert.alert(
            "QUIT MATCH?",
            "If you leave now, you will forfeit this match. Are you sure?",
            [
              { text: "STAY", style: "cancel" },
              { text: "QUIT", style: "destructive", onPress: async () => {
                try {
                  // Mark as completed in DB if MP
                  if (!isBot && sessionId) {
                    await mpDispatch({ type: 'OPPONENT_QUIT' });
                    await supabase.from('game_sessions').update({ status: 'completed' }).eq('id', sessionId);
                  }
                  // Optionally mark a local loss for stats
                  navigation.navigate('Home', { manualExit: true });
                } catch (e) {
                  navigation.navigate('Home', { manualExit: true });
                }
              }}
            ]
          );
        }}
      />
    </View>

  );
}


const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8, gap: 12 },
  pills:        { flexDirection: 'row', gap: 3, backgroundColor: C.s800, padding: 3, borderRadius: 8 },
  pillOn:       { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: C.primary, borderRadius: 9999 },
  pillOnTxt:    { color: '#FFF', fontSize: 10, fontWeight: '700' },
  pillOff:      { paddingHorizontal: 8, paddingVertical: 3, opacity: 0.2 },
  pillOffTxt:   { color: C.s400, fontSize: 10, fontWeight: '700' },
  oppHand:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14, marginBottom: 6, opacity: 0.7, minHeight: 38 },
  boardSection: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginVertical: 12 },
  controls:     { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8, gap: 12, minHeight: 240 },
  btnRow:       { flexDirection: 'row', alignItems: 'stretch', gap: 14, width: '100%', height: 48, marginBottom: 8 },
  swapBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, paddingHorizontal: 10, borderRadius: 12 },
  swapBtnText:  { color: '#FFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  drawBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 48, paddingHorizontal: 4, borderRadius: 12, borderWidth: 1 },
  drawBtnText:  { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  drawBadge:    { backgroundColor: C.s800, borderRadius: 8, paddingHorizontal: 8, marginLeft: 6 },
  drawBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  handRow:      { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 12 },
  strip:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 4 },
  stripAv:      { width: 34, height: 34, borderRadius: 17, borderWidth: 2, overflow: 'hidden' },
  stripName:    { color: '#FFF', fontSize: 13, fontWeight: '700' },
  stripScore:   { color: C.s500, fontSize: 11 },
  activeDot:    { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#22C55E' },
  timerRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 2, gap: 10 },
  timerLabel:   { fontSize: 10, fontWeight: '800', letterSpacing: 1, minWidth: 52 },
  timerBg:      { flex: 1, height: 5, backgroundColor: C.s800, borderRadius: 3, overflow: 'hidden' },
  timerFill:    { height: '100%', borderRadius: 3 },
  timerNum:     { fontSize: 12, fontWeight: '800', minWidth: 32, textAlign: 'right' },
  turnBanner:   { marginHorizontal: 16, marginBottom: 4, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  turnMy:       { backgroundColor: 'rgba(37,106,244,0.15)', borderWidth: 1, borderColor: 'rgba(37,106,244,0.4)' },
  turnOpp:      { backgroundColor: 'rgba(100,116,139,0.1)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  turnTxt:      { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  actionBar:    { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: 'rgba(15,23,42,0.9)', borderTopWidth: 1, borderTopColor: C.s800 },
  faceOffBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.s800, paddingVertical: 12, borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  faceOffTxt:   { color: '#FFF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 13 },
  winBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.s800, paddingVertical: 12, borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  winTxt:       { color: C.s300, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 13 },
  foOverlayBtn: { backgroundColor: C.primary, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 9999 },
  foOverlayBtnTxt: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 3 },
});
