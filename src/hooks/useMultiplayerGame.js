/**
 * useMultiplayerGame.js — src/hooks/useMultiplayerGame.js
 *
 * FIXES:
 * 1. Card sync: broadcasts now include `cardSym` for verification + correction
 * 2. Exposed resetGameState() for next-round deck sync
 * 3. Timer pause when gs.gameOver is true
 * 4. Enhanced logging for card mismatch debugging
 *
 * KEY CHANGE FOR CARD SYNC:
 * The sender now includes the actual card symbol (`cardSym`) in the broadcast
 * payload alongside `cardIdx`. The receiver verifies that `aiHand[cardIdx].sym`
 * matches the expected symbol. If it doesn't, the receiver finds the correct
 * index by symbol match. This self-heals any drift caused by message
 * ordering, duplicate application, or React batching.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../services/supabase';
import { buildDeck, makeInitialState } from '../game/engine/gameUtils';
import { seededShuffle } from '../game/engine/seededShuffle';
import { multiplayerReducer, swapGs } from '../game/engine/multiplayerReducer';
import SoundManager from '../services/SoundManager';

const INACTIVITY_MS = 45_000;

export default function useMultiplayerGame({ sessionId, myUserId, isPlayer1, profile, initialDeck = null, onSwapGlow }) {
  const [gs,               setGs]         = useState(null);
  const [connectionStatus, setConnStatus] = useState('loading');
  const [opponentInfo,     setOpponentInfo] = useState(null);
  const [inactivitySecs,   setInactSecs]  = useState(0);

  const broadcastRef  = useRef(null);
  const pgMovesRef    = useRef(null);
  const pgSessionRef  = useRef(null);
  const gsRef         = useRef(null);
  const mountedRef    = useRef(true);
  const profileRef    = useRef(profile);
  const appliedRef    = useRef(new Set());
  const mySeqRef      = useRef(0);
  const isMyTurnRef   = useRef(false);
  const onForfeitRef  = useRef(null);
  const inactTimerRef = useRef(null);
  const inactTickRef  = useRef(null);
  const gameOverRef   = useRef(false);
  const lastOppPingRef = useRef(Date.now());
  const pingCheckIterRef = useRef(null);
  const appStateRef   = useRef(AppState.currentState);

  useEffect(() => { gsRef.current      = gs;            }, [gs]);
  useEffect(() => { profileRef.current  = profile;       }, [profile]);
  useEffect(() => { gameOverRef.current = gs?.gameOver ?? false; }, [gs?.gameOver]);

  const turnNum = gs?.turn ?? 1;
  const isMyTurn = isPlayer1 ? turnNum === 1 : turnNum === 2;
  useEffect(() => { isMyTurnRef.current = isMyTurn; }, [isMyTurn]);

  function resetTimer() {
    clearTimeout(inactTimerRef.current);
    clearInterval(inactTickRef.current);
    setInactSecs(0);

    inactTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      if (gameOverRef.current) { resetTimer(); return; }
      clearInterval(inactTickRef.current);
      try {
        await supabase.from('game_sessions')
          .update({ status: 'abandoned' })
          .eq('id', sessionId);
      } catch {}
      onForfeitRef.current?.(isMyTurnRef.current ? 'lose' : 'win');
    }, INACTIVITY_MS);

    inactTickRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      if (gameOverRef.current) return;
      // Do not tick if backgrounded
      if (appStateRef.current.match(/inactive|background/)) return;
      setInactSecs(s => {
        const n = s + 1;
        if (n === 35 || n === 40 || n === 43 || n === 44) SoundManager.playButton?.();
        return n;
      });
    }, 1000);
  }

  function stopTimer() {
    clearTimeout(inactTimerRef.current);
    clearInterval(inactTickRef.current);
    setInactSecs(0);
  }

  function cleanup() {
    if (broadcastRef.current)  { supabase.removeChannel(broadcastRef.current);  broadcastRef.current  = null; }
    if (pgMovesRef.current)    { supabase.removeChannel(pgMovesRef.current);    pgMovesRef.current    = null; }
    if (pgSessionRef.current)  { supabase.removeChannel(pgSessionRef.current);  pgSessionRef.current  = null; }
    clearInterval(pingCheckIterRef.current);
    stopTimer();
  }

  useEffect(() => {
    if (!sessionId || !myUserId) return;
    mountedRef.current  = true;
    appliedRef.current  = new Set();
    mySeqRef.current    = 0;
    gameOverRef.current = false;
    init();
    const heartbeat = setInterval(() => {
      // Don't ping if backgrounded
      if (appStateRef.current.match(/inactive|background/)) return;
      if (broadcastRef.current) 
        broadcastRef.current.send({ type: 'broadcast', event: 'ping', payload: { ts: Date.now(), playerId: myUserId } });
    }, 10_000);

    lastOppPingRef.current = Date.now();
    pingCheckIterRef.current = setInterval(() => {
      if (!mountedRef.current || gameOverRef.current) return;
      // If we are backgrounded, do not auto-reconnect or forfeit.
      if (appStateRef.current.match(/inactive|background/)) return;

      const silence = Date.now() - lastOppPingRef.current;
      if (silence > 30_000 && connectionStatus !== 'reconnecting') setConnStatus('reconnecting');
      if (silence > 60_000 && !gameOverRef.current) {
        console.warn('[mp-app] Opponent silent for 60s, triggering forfeit win.');
        stopTimer();
        onForfeitRef.current?.('win');
      }
    }, 5000);

    const appStateSub = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[mp-app] App foregrounded! Requesting snapshot...');
        if (broadcastRef.current) {
          try { broadcastRef.current.send({ type: 'broadcast', event: 'request_snapshot', payload: { playerId: myUserId } }); } catch {}
        }
        if (!gameOverRef.current) resetTimer();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('[mp-app] App backgrounded! Pausing timers...');
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      mountedRef.current = false;
      appStateSub.remove();
      clearInterval(heartbeat);
      clearInterval(pingCheckIterRef.current);
      cleanup();
    };
  }, [sessionId, myUserId, isPlayer1]);

  async function init() {
    setConnStatus('loading');
    const { data: session, error } = await supabase
      .from('game_sessions').select('*').eq('id', sessionId).single();
    if (error || !session) {
      if (mountedRef.current) setConnStatus('disconnected');
      return;
    }

    const oppUsername = isPlayer1 ? session.player2_username : session.player1_username;
    const oppAvatar   = isPlayer1 ? session.player2_avatar   : session.player1_avatar;
    const oppId       = isPlayer1 ? session.player2_id       : session.player1_id;
    if (mountedRef.current) setOpponentInfo({ username: oppUsername, avatarPreset: oppAvatar, id: oppId });

    if (!isPlayer1 && !session) return; // Wait for session if not P1 or not bot
    
    // Use initialDeck if provided (deterministic bot game)
    const seed = initialDeck ? null : (session?.deck_seed || 12345);
    const deck = initialDeck || seededShuffle(buildDeck(), seed);

    console.log('[mp-init] seed:', seed, 'isP1:', isPlayer1);
    console.log('[mp-init] deck[0..7]:', deck.slice(0, 8).map(c => c.sym).join(','));
    console.log('[mp-init] drawPile[0..3]:', deck.slice(8, 12).map(c => c.sym).join(','));

    const base  = makeInitialState(deck);
    let startGs = {
      ...base,
      playerHand: isPlayer1 ? deck.slice(0,4) : deck.slice(4,8),
      aiHand:     isPlayer1 ? deck.slice(4,8) : deck.slice(0,4),
      drawPile:   deck.slice(8),
      phase:      isPlayer1 ? 'draw' : 'ai',
      msg:        isPlayer1 ? 'Your turn — draw a card.' : 'Waiting for opponent…',
      msgType:    'info',
    };

    console.log('[mp-init] myHand:', startGs.playerHand.map(c => c.sym).join(','));
    console.log('[mp-init] oppHand:', startGs.aiHand.map(c => c.sym).join(','));

    try {
      const { data: moves } = await supabase.from('game_moves').select('*')
        .eq('session_id', sessionId).order('seq', { ascending: true });
      if (moves?.length > 0) {
        console.log('[mp-init] replaying', moves.length, 'stored moves');
        for (const m of moves) {
          appliedRef.current.add(`${m.player_id}:${m.seq}`);
          startGs = multiplayerReducer(startGs, parseStored(m), m.player_id === myUserId, profileRef.current);
          if (m.seq >= mySeqRef.current) mySeqRef.current = m.seq + 1;
        }
      }
    } catch {}

    if (!mountedRef.current) return;
    
    // DB Snapshot recovery if no moves (we don't replay moves if we load snapshot)
    if (session.last_snapshot) {
      console.log('[mp-init] resuming from DB last_snapshot');
      const snapGs = session.last_snapshot.gs;
      startGs = (session.last_snapshot.perspective === myUserId) ? snapGs : swapGs(snapGs);
    }

    setGs(startGs);

    const bc = supabase.channel(`mp-${sessionId}`);
    bc.on('broadcast', { event: 'request_snapshot' }, ({ payload }) => {
      if (!mountedRef.current || !payload || payload.playerId === myUserId) return;
      if (gsRef.current && broadcastRef.current) {
        try {
          broadcastRef.current.send({
            type: 'broadcast',
            event: 'snapshot',
            payload: { gs: gsRef.current, seq: mySeqRef.current }
          });
        } catch {}
      }
    });
    bc.on('broadcast', { event: 'move' }, ({ payload }) => {
      if (!mountedRef.current || !payload || payload.playerId === myUserId) return;
      // Apply opponent swap glow before state change
      if (payload.actionType === 'SWAP_PLACE_HAND' && payload.swapGlowCells?.length) {
        onSwapGlow?.(payload.swapGlowCells);
      }
      if (payload.actionType === 'DRAW_CARD') {
        onSwapGlow?.(null); // clear swap glow on opponent draw
      }
      maybeApply(payload);
      if (!gameOverRef.current) resetTimer();
    });
    // FIX #9: Handle state snapshots for rapid reconnection
    bc.on('broadcast', { event: 'snapshot' }, ({ payload }) => {
      if (!mountedRef.current || !payload || payload.playerId === myUserId) return;
      if (payload.seq > (gsRef.current?.seq || 0)) {
        console.log('[mp-sync] re-syncing from snapshot seq:', payload.seq);
        const myGs = swapGs(payload.gs);
        setGs(myGs);
      }
    });
    bc.on('broadcast', { event: 'ping' }, ({ payload }) => {
      if (!mountedRef.current || !payload || payload.playerId === myUserId) return;
      lastOppPingRef.current = Date.now();
      setConnStatus(prev => prev === 'reconnecting' ? 'connected' : prev);
    });
    bc.subscribe(status => {
      if (!mountedRef.current) return;
      if (status === 'SUBSCRIBED') {
        setConnStatus('connected');
        resetTimer();
      } else if (status === 'CHANNEL_ERROR') setConnStatus('disconnected');
    });
    broadcastRef.current = bc;

    const pg = supabase.channel(`mp-pg-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_moves', filter: `session_id=eq.${sessionId}` },
        payload => {
          if (!mountedRef.current || !payload.new) return;
          const m = payload.new;
          if (m.player_id === myUserId) return;
          const parsed = parseStored(m);
          maybeApply({ playerId: m.player_id, actionType: m.action_type, seq: m.seq, ...parsed });
          if (!gameOverRef.current) resetTimer();
        })
      .subscribe();
    pgMovesRef.current = pg;

    const ps = supabase.channel(`mp-session-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        payload => {
          if (!mountedRef.current) return;
          if (payload.new?.status === 'abandoned') {
            stopTimer();
            onForfeitRef.current?.(isMyTurnRef.current ? 'lose' : 'win');
          }
        })
      .subscribe();
    pgSessionRef.current = ps;
  }

  /**
   * FIX #1 — CARD SYNC CORRECTION
   *
   * When an opponent places a card, the broadcast includes:
   *   { cardIdx, cardSym, r, c }
   *
   * The receiver verifies that gs.aiHand[cardIdx].sym === cardSym.
   * If it doesn't match (state drift), the receiver finds the correct
   * index by symbol match. This self-heals any drift.
   */
  function maybeApply(payload) {
    const key = `${payload.playerId}:${payload.seq}`;
    if (appliedRef.current.has(key)) return;
    appliedRef.current.add(key);

    let actionType = payload.actionType || payload.type;
    let cardIdx    = payload.cardIdx;
    const cardSym  = payload.cardSym; // may be undefined for non-PLACE actions
    const r        = payload.r;
    const c        = payload.c;

    // For PLACE_CARD and SWAP_PLACE_HAND: verify cardIdx matches expected symbol
    if (cardSym && (actionType === 'PLACE_CARD' || actionType === 'SWAP_PLACE_HAND') && cardIdx != null) {
      const currentGs = gsRef.current;
      if (currentGs) {
        // Opponent's hand is stored as aiHand on our side
        const oppHand = currentGs.aiHand;
        if (oppHand && oppHand[cardIdx]) {
          if (oppHand[cardIdx].sym !== cardSym) {
            console.warn(`[mp-sync] CARD MISMATCH! cardIdx=${cardIdx} expected=${cardSym} got=${oppHand[cardIdx].sym}`);
            console.warn(`[mp-sync] oppHand:`, oppHand.map(cc => cc.sym).join(','));
            // Search for the correct card by symbol
            const correctIdx = oppHand.findIndex(cc => cc.sym === cardSym);
            if (correctIdx !== -1) {
              console.log(`[mp-sync] CORRECTED cardIdx ${cardIdx} → ${correctIdx} for ${cardSym}`);
              cardIdx = correctIdx;
            } else {
              console.error(`[mp-sync] Symbol ${cardSym} NOT FOUND in opponent hand! Cannot correct.`);
            }
          }
        }
      }
    }

    const action = {
      type: actionType,
      ...(cardIdx != null && { cardIdx }),
      ...(r       != null && { r }),
      ...(c       != null && { c }),
      ...(payload.drawnSym != null && { drawnSym: payload.drawnSym }),
    };

    setGs(prev => {
      if (!prev) return prev;
      const next = multiplayerReducer(prev, action, false, profileRef.current);
      console.log(`[mp-apply] OPP ${actionType}`,
        '| oppHand:', prev.aiHand?.map(cc => cc.sym).join(','),
        '→', next.aiHand?.map(cc => cc.sym).join(','),
        '| drawPile:', prev.drawPile?.length, '→', next.drawPile?.length);
      return next;
    });
  }

  function parseStored(m) {
    const d = m.action_data || {};
    return {
      type: m.action_type,
      ...(d.cardIdx  != null && { cardIdx:  d.cardIdx }),
      ...(d.cardSym  != null && { cardSym:  d.cardSym }),
      ...(d.drawnSym != null && { drawnSym: d.drawnSym }),
      ...(d.r        != null && { r:        d.r }),
      ...(d.c        != null && { c:        d.c }),
    };
  }

  /**
   * dispatch() — called for MY moves.
   *
   * FIX #1: Now includes `cardSym` in the broadcast payload so the
   * receiver can verify/correct the card index.
   */
  /**
   * dispatch() — called for MY moves.
   *
   * FIX #1: Now includes `cardSym` in the broadcast payload
   * FIX #9: Broadcast full state snapshot every 5 moves
   */
  const dispatch = useCallback(async (action) => {
    const cur = gsRef.current;
    if (!cur) return;
    const next = multiplayerReducer(cur, action, true, profileRef.current);
    setGs(next);
    const seq = mySeqRef.current++;
    appliedRef.current.add(`${myUserId}:${seq}`);
    if (!gameOverRef.current) resetTimer();

    let cardSym = undefined;
    if (action.cardIdx != null && cur.playerHand && cur.playerHand[action.cardIdx]) {
      cardSym = cur.playerHand[action.cardIdx].sym;
    }
    let drawnSym = undefined;
    if (action.type === 'DRAW_CARD' && cur.drawPile && cur.drawPile.length > 0) {
      drawnSym = cur.drawPile[0].sym;
    }

    const payload = {
      playerId: myUserId, actionType: action.type, seq,
      ...(action.cardIdx     != null && { cardIdx: action.cardIdx }),
      ...(cardSym            != null && { cardSym }),
      ...(drawnSym           != null && { drawnSym }),
      ...(action.r           != null && { r: action.r }),
      ...(action.c           != null && { c: action.c }),
      ...(action._swapGlow   != null && { swapGlowCells: action._swapGlow }),
    };

    if (broadcastRef.current) {
      try { await broadcastRef.current.send({ type: 'broadcast', event: 'move', payload }); } catch {}
      
      // FIX #9: Broadcast full snapshot periodically
      if (seq % 5 === 0) {
        try { 
          await broadcastRef.current.send({ 
            type: 'broadcast', 
            event: 'snapshot', 
            payload: { gs: next, seq } 
          });
        } catch {}
        try {
          supabase.from('game_sessions').update({ 
            last_snapshot: { gs: next, seq, perspective: myUserId } 
          }).eq('id', sessionId).then();
        } catch {}
      }
    }
    try {
      const data = { ...(cardIdx != null && { cardIdx }), ...(cardSym != null && { cardSym }), ...(drawnSym != null && { drawnSym }), ...(action.r != null && { r: action.r }), ...(action.c != null && { c: action.c }) };
      const { error } = await supabase.rpc('insert_game_move', {
        p_session_id: sessionId, p_player_id: myUserId,
        p_action_type: action.type, p_action_data: data,
      });
      if (error) {
        await supabase.from('game_moves').insert({
          session_id: sessionId, player_id: myUserId, seq,
          action_type: action.type, action_data: data,
        });
      }
    } catch {}
  }, [sessionId, myUserId]);

  const setOnForfeit = useCallback(fn => { onForfeitRef.current = fn; }, []);

  // FIX #1: Expose resetGameState for next-round deck sync
  const resetGameState = useCallback((newGs) => {
    setGs(newGs);
    gsRef.current = newGs;
    gameOverRef.current = false;
    resetTimer();
  }, []);

  return { gs, dispatch, connectionStatus, opponentInfo, isMyTurn, inactivitySecs, setOnForfeit, resetGameState };
}
