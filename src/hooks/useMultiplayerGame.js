/**
 * useMultiplayerGame.js — src/hooks/useMultiplayerGame.js
 * KEY CHANGE: stopTimer is now a no-op externally — the hook manages
 * timer pause internally when gs.gameOver is true (round ended).
 * Timer only fires forfeit when NO moves happen AND game is NOT over.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { buildDeck, makeInitialState } from '../game/engine/gameUtils';
import { seededShuffle } from '../game/engine/seededShuffle';
import { multiplayerReducer } from '../game/engine/multiplayerReducer';
import SoundManager from '../services/SoundManager';

const INACTIVITY_MS = 45_000;

export default function useMultiplayerGame({ sessionId, myUserId, isPlayer1, profile }) {
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
  const gameOverRef   = useRef(false); // true during round-end overlay — pause forfeit

  useEffect(() => { gsRef.current      = gs;            }, [gs]);
  useEffect(() => { profileRef.current  = profile;       }, [profile]);
  useEffect(() => { gameOverRef.current = gs?.gameOver ?? false; }, [gs?.gameOver]);

  const isMyTurn = gs?.phase === 'draw' || gs?.phase === 'place';
  useEffect(() => { isMyTurnRef.current = isMyTurn; }, [isMyTurn]);

  function resetTimer() {
    clearTimeout(inactTimerRef.current);
    clearInterval(inactTickRef.current);
    setInactSecs(0);

    inactTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      // Don't forfeit during round-end overlays (face-off result, win result)
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
      // Pause countdown display during overlays
      if (gameOverRef.current) return;
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
    stopTimer();
  }

  useEffect(() => {
    if (!sessionId || !myUserId) return;
    mountedRef.current  = true;
    appliedRef.current  = new Set();
    mySeqRef.current    = 0;
    gameOverRef.current = false;
    init();
    return () => { mountedRef.current = false; cleanup(); };
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
    if (mountedRef.current) setOpponentInfo({ username: oppUsername, avatarPreset: oppAvatar });

    const seed = session.deck_seed || 12345;
    const deck  = seededShuffle(buildDeck(), seed);
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

    try {
      const { data: moves } = await supabase.from('game_moves').select('*')
        .eq('session_id', sessionId).order('seq', { ascending: true });
      if (moves?.length > 0) {
        for (const m of moves) {
          appliedRef.current.add(`${m.player_id}:${m.seq}`);
          startGs = multiplayerReducer(startGs, parseStored(m), m.player_id === myUserId, profileRef.current);
          if (m.seq >= mySeqRef.current) mySeqRef.current = m.seq + 1;
        }
      }
    } catch {}

    if (!mountedRef.current) return;
    setGs(startGs);

    const bc = supabase.channel(`mp-${sessionId}`);
    bc.on('broadcast', { event: 'move' }, ({ payload }) => {
      if (!mountedRef.current || !payload || payload.playerId === myUserId) return;
      maybeApply(payload);
      if (!gameOverRef.current) resetTimer();
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
          maybeApply({ playerId: m.player_id, actionType: m.action_type, seq: m.seq, ...parseStored(m) });
          if (!gameOverRef.current) resetTimer();
        })
      .subscribe();
    pgMovesRef.current = pg;

    // Watch session — only fire forfeit if explicitly abandoned by timer
    const ps = supabase.channel(`mp-session-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
        payload => {
          if (!mountedRef.current) return;
          // Only react to abandoned — ignore 'completed' and other status changes
          if (payload.new?.status === 'abandoned') {
            stopTimer();
            onForfeitRef.current?.(isMyTurnRef.current ? 'lose' : 'win');
          }
        })
      .subscribe();
    pgSessionRef.current = ps;
  }

  function maybeApply(payload) {
    const key = `${payload.playerId}:${payload.seq}`;
    if (appliedRef.current.has(key)) return;
    appliedRef.current.add(key);
    const action = {
      type: payload.actionType || payload.type,
      ...(payload.cardIdx != null && { cardIdx: payload.cardIdx }),
      ...(payload.r       != null && { r:       payload.r }),
      ...(payload.c       != null && { c:       payload.c }),
    };
    setGs(prev => prev ? multiplayerReducer(prev, action, false, profileRef.current) : prev);
  }

  function parseStored(m) {
    const d = m.action_data || {};
    return {
      type: m.action_type,
      ...(d.cardIdx != null && { cardIdx: d.cardIdx }),
      ...(d.r       != null && { r:       d.r }),
      ...(d.c       != null && { c:       d.c }),
    };
  }

  const dispatch = useCallback(async (action) => {
    const cur = gsRef.current;
    if (!cur) return;
    const next = multiplayerReducer(cur, action, true, profileRef.current);
    setGs(next);
    const seq = mySeqRef.current++;
    appliedRef.current.add(`${myUserId}:${seq}`);
    if (!gameOverRef.current) resetTimer();

    const payload = {
      playerId: myUserId, actionType: action.type, seq,
      ...(action.cardIdx != null && { cardIdx: action.cardIdx }),
      ...(action.r       != null && { r: action.r }),
      ...(action.c       != null && { c: action.c }),
    };
    if (broadcastRef.current) {
      try { await broadcastRef.current.send({ type: 'broadcast', event: 'move', payload }); } catch {}
    }
    try {
      const data = {};
      if (action.cardIdx != null) data.cardIdx = action.cardIdx;
      if (action.r       != null) data.r       = action.r;
      if (action.c       != null) data.c       = action.c;
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

  const setOnForfeit  = useCallback(fn => { onForfeitRef.current = fn; }, []);

  return { gs, dispatch, connectionStatus, opponentInfo, isMyTurn, inactivitySecs, setOnForfeit };
}
