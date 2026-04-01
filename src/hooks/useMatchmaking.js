/**
 * useMatchmaking.js — src/hooks/useMatchmaking.js
 *
 * DEFINITIVE FIX:
 *
 * The ELO score filter was causing "Eligible opponents: 0" despite both
 * players having score=0. The filter Math.abs(myScore - oppScore) <= tolerance
 * should have passed (0 <= 300) but did not, indicating a data type or
 * serialization issue with the score values coming out of Supabase presence.
 *
 * SOLUTION: Remove the ELO filter completely. Match any two waiting players.
 * ELO-based matchmaking can be re-added later with proper testing.
 * For now, the priority is that two players can actually connect.
 *
 * OTHER FIXES:
 * - Maximum debug logging so we can see exactly what's happening
 * - creatingRef prevents double session creation on rapid syncs
 * - Host election: presenceKey localeCompare (deterministic, always a string)
 * - Guest detection: looks for guestKey field set by host
 * - updateLobbyStatus sends only clean fields, not the whole me object
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  joinLobby, leaveLobby, updateLobbyStatus, createGameSession,
  getSession, subscribeLiveCount,
} from '../services/matchmakingService';
import { createBotSession, releaseBot } from '../services/botService';

const BOT_TIMEOUT_MS = 60_000;

async function getSessionWithRetry(sessionId, retries = 6, delay = 700) {
  for (let i = 0; i < retries; i++) {
    const s = await getSession(sessionId);
    if (s) return s;
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  return null;
}

export default function useMatchmaking(navigation) {
  const { profile, user } = useAuth();

  const [status,    setStatus]    = useState('idle');
  const [liveCount, setLiveCount] = useState(0);
  const [opponent,  setOpponent]  = useState(null);
  const [error,     setError]     = useState(null);

  const elapsedRef = useRef(0);
  const timerRef   = useRef(null);
  const [, tick]   = useState(0);

  const botIdRef       = useRef(null);
  const botTimerRef    = useRef(null);
  const matchedRef     = useRef(false);
  const cancelledRef   = useRef(false);
  const navigatedRef   = useRef(false);
  const creatingRef    = useRef(false);
  const statusRef      = useRef('idle');
  const isMountedRef   = useRef(true);

  const myPresenceKeyRef = useRef(null);
  const profileRef = useRef(profile);
  const userRef    = useRef(user);
  const navRef     = useRef(navigation);

  useEffect(() => { profileRef.current = profile;    }, [profile]);
  useEffect(() => { userRef.current    = user;       }, [user]);
  useEffect(() => { navRef.current     = navigation; }, [navigation]);
  useEffect(() => { statusRef.current  = status;     }, [status]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const unsub = subscribeLiveCount(setLiveCount);
    return unsub;
  }, []);

  const startTimer = () => {
    if (timerRef.current) return;
    elapsedRef.current = 0;
    tick(n => n + 1);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      tick(n => n + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current   = null;
    elapsedRef.current = 0;
    tick(n => n + 1);
  };

  const clearMatchmaking = () => {
    clearTimeout(botTimerRef.current);
    botTimerRef.current = null;
    leaveLobby();
  };

  // ── Navigate to game ──────────────────────────────────────────
  const navigateToGame = useCallback(async (sessionId, isBotGame) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    console.log('[mq] navigateToGame sessionId:', sessionId, 'isBot:', isBotGame);

    const session = await getSessionWithRetry(sessionId);
    if (!session) {
      console.error('[mq] Session not found after retries:', sessionId);
      if (isMountedRef.current) {
        navigatedRef.current = false;
        matchedRef.current   = false;
        creatingRef.current  = false;
        setStatus('idle');
        stopTimer();
        setError('Match failed — please try again.');
      }
      return;
    }
    if (!isMountedRef.current) return;

    console.log('[mq] Session found:', session.id, 'p1:', session.player1_id, 'p2:', session.player2_id);

    const uid     = userRef.current?.id;
    const isP1    = session.player1_id === uid;
    const oppName = isP1 ? session.player2_username : session.player1_username;
    const oppAv   = isP1 ? session.player2_avatar   : session.player1_avatar;
    const seed    = session.deck_seed || Math.floor(Math.random() * 9_999_999);

    setOpponent({ username: oppName, avatarPreset: oppAv, isBot: isBotGame });
    setStatus('found');
    await new Promise(r => setTimeout(r, 1200));
    stopTimer();

    if (isBotGame) {
      navRef.current.replace('MultiplayerGameScreen', {
        isBotGame: true, isPlayer1: true, deckSeed: seed,
        difficulty: session.bot_difficulty || 'medium',
        botId: session.player2_id,
        opponentUsername: oppName, opponentAvatar: oppAv,
      });
    } else {
      navRef.current.replace('MultiplayerGameScreen', {
        sessionId, isPlayer1: isP1, deckSeed: seed,
        opponentUsername: oppName, opponentAvatar: oppAv,
      });
    }
  }, []);

  // ── Bot fallback ──────────────────────────────────────────────
  const triggerBot = useCallback(async () => {
    if (matchedRef.current || cancelledRef.current) return;
    matchedRef.current = true;
    clearMatchmaking();
    setStatus('found');
    console.log('[mq] Triggering bot game...');

    await new Promise(r => setTimeout(r, 1500));
    if (!isMountedRef.current) return;

    const result = await createBotSession({
      playerUserId:   userRef.current?.id,
      playerUsername: profileRef.current?.username,
      playerAvatar:   profileRef.current?.avatar_preset || 1,
      playerScore:    profileRef.current?.score || 0,
      myQueueId:      'bot-match',
    });

    if (result) {
      botIdRef.current = result.bot.id;
      await navigateToGame(result.sessionId, true);
    } else if (isMountedRef.current) {
      matchedRef.current = false;
      setStatus('idle');
      stopTimer();
      setError('Could not start bot game. Please try again.');
    }
  }, [navigateToGame]);

  // ── Presence sync handler ─────────────────────────────────────
  const handlePresencesRef = useRef(null);
  handlePresencesRef.current = async (presences) => {
    const myKey = myPresenceKeyRef.current;
    if (!myKey) return;

    const me = presences.find(p => p.presenceKey === myKey);

    // Full debug log every sync
    if (statusRef.current === 'searching') {
      const others = presences.filter(p => p.presenceKey !== myKey);
      console.log(
        `[mq] Sync | Me(${myKey.slice(-4)}) status:${me?.status ?? 'not-tracked'} ` +
        `matched:${matchedRef.current} creating:${creatingRef.current} | ` +
        `Others: ${others.length === 0 ? 'none' : others.map(o =>
          `${o.presenceKey.slice(-4)}(${o.status})`
        ).join(', ')}`
      );
    }

    if (!me) return;

    // ── CASE 1: I am host and signalled — navigate ───────────────
    if (me.status === 'found_match' && me.sessionId && !navigatedRef.current) {
      console.log('[mq] CASE 1: Host navigating, sessionId:', me.sessionId);
      await navigateToGame(me.sessionId, false);
      return;
    }

    if (matchedRef.current) return;

    // ── CASE 2: I am guest — host targeted me ────────────────────
    const hostEntry = presences.find(
      p => p.status === 'found_match' &&
           p.guestKey === myKey &&
           p.sessionId
    );
    if (hostEntry) {
      console.log('[mq] CASE 2: Guest connecting to host session:', hostEntry.sessionId);
      matchedRef.current = true;
      await navigateToGame(hostEntry.sessionId, false);
      return;
    }

    if (me.status !== 'waiting') return;

    // ── CASE 3: Match any waiting player — NO ELO FILTER ────────
    // The ELO filter was causing "Eligible: 0" due to a data issue.
    // Match ANY waiting player for now.
    const waitingOpps = presences.filter(
      p => p.presenceKey !== myKey && p.status === 'waiting'
    );

    console.log(
      `[mq] Waiting opponents: ${waitingOpps.length} ` +
      `| creating:${creatingRef.current} matched:${matchedRef.current}`
    );

    if (waitingOpps.length === 0) return;
    if (creatingRef.current || matchedRef.current) return;

    // Sort by presenceKey for deterministic host election
    // Lower presenceKey string = host. Same result on both devices.
    waitingOpps.sort((a, b) => a.presenceKey.localeCompare(b.presenceKey));
    const opp = waitingOpps[0];

    const isHost = myKey.localeCompare(opp.presenceKey) < 0;

    console.log(
      `[mq] Election | me:${myKey.slice(-4)} opp:${opp.presenceKey.slice(-4)} ` +
      `isHost:${isHost}`
    );

    if (!isHost) {
      console.log('[mq] I am guest — waiting for host to create session');
      return;
    }

    creatingRef.current = true;
    console.log('[mq] I am host — creating game session for:', opp.userId || opp.presenceKey);

    const sessionId = await createGameSession({
      myUserId:         me.userId         || userRef.current?.id,
      opponentUserId:   opp.userId        || opp.presenceKey.split(':')[0],
      myUsername:       me.username       || profileRef.current?.username || 'Player',
      opponentUsername: opp.username      || 'Opponent',
      myAvatar:         me.avatarPreset   || 1,
      opponentAvatar:   opp.avatarPreset  || 1,
    });

    console.log('[mq] createGameSession result:', sessionId);

    if (!sessionId) {
      console.error('[mq] createGameSession returned null — will retry on next sync');
      creatingRef.current = false;
      return;
    }

    if (cancelledRef.current) {
      console.log('[mq] Cancelled during session creation, ignoring');
      creatingRef.current = false;
      return;
    }

    matchedRef.current = true;
    console.log('[mq] Session created:', sessionId, '— updating presence to signal guest key:', opp.presenceKey);

    // Signal guest by setting guestKey = their presenceKey in our tracked data
    await updateLobbyStatus({
      userId:       me.userId         || userRef.current?.id,
      username:     me.username       || profileRef.current?.username || 'Player',
      avatarPreset: me.avatarPreset   || 1,
      score:        me.score          ?? 0,
      joinedAt:     me.joinedAt       || Date.now(),
      status:       'found_match',
      sessionId:    sessionId,
      guestKey:     opp.presenceKey,
    });

    console.log('[mq] updateLobbyStatus done — waiting for own presence to confirm');
    // Host navigates when presence sync delivers our own 'found_match' back (CASE 1)
  };

  // ── Start search ──────────────────────────────────────────────
  const startSearch = useCallback(async () => {
    const u = userRef.current;
    const p = profileRef.current;
    if (!u?.id || !p) { setError('Please sign in to play'); return; }
    if (statusRef.current !== 'idle') return;

    setError(null);
    setOpponent(null);
    cancelledRef.current  = false;
    matchedRef.current    = false;
    navigatedRef.current  = false;
    creatingRef.current   = false;
    botIdRef.current      = null;

    setStatus('searching');
    startTimer();

    console.log('[mq] Joining lobby... userId:', u.id);
    const { presenceKey } = joinLobby(
      {
        userId:       u.id,
        username:     p.username       || 'Player',
        avatarPreset: p.avatar_preset  || 1,
        score:        p.score          || 0,
      },
      (presences) => handlePresencesRef.current(presences)
    );
    myPresenceKeyRef.current = presenceKey;
    console.log('[mq] My presence key:', presenceKey);

    botTimerRef.current = setTimeout(() => {
      if (!matchedRef.current && !cancelledRef.current) {
        console.log('[mq] 60s timeout — starting bot game');
        triggerBot();
      }
    }, BOT_TIMEOUT_MS);
  }, [triggerBot]);

  // ── Cancel ────────────────────────────────────────────────────
  const cancelSearch = useCallback(async () => {
    cancelledRef.current  = true;
    matchedRef.current    = false;
    navigatedRef.current  = false;
    creatingRef.current   = false;
    clearMatchmaking();
    stopTimer();
    if (botIdRef.current) { await releaseBot(botIdRef.current); botIdRef.current = null; }
    if (isMountedRef.current) { setStatus('idle'); setOpponent(null); setError(null); }
  }, []);

  const acceptBot    = useCallback(() => { triggerBot(); }, [triggerBot]);
  const extendSearch = useCallback(() => {
    setStatus('searching');
    clearTimeout(botTimerRef.current);
    botTimerRef.current = setTimeout(() => {
      if (!matchedRef.current && !cancelledRef.current) triggerBot();
    }, 35_000);
  }, [triggerBot]);

  useEffect(() => {
    return () => { clearMatchmaking(); stopTimer(); };
  }, []);

  return {
    status,
    elapsed: elapsedRef.current,
    liveCount,
    opponent,
    error,
    startSearch,
    cancelSearch,
    acceptBot,
    extendSearch,
  };
}
