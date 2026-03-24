/**
 * useMatchmaking.js — src/hooks/useMatchmaking.js
 *
 * CRITICAL FIX: React StrictMode (Expo web) double-invokes effects.
 * The cleanup function sets cancelledRef=true on the FIRST mount's cleanup.
 * The second mount starts fresh BUT cancelledRef is already true.
 * So doTriggerBot hits the guard and exits silently — bot never fires.
 *
 * FIX: cancelledRef is reset to false at the START of startSearch,
 * and the cleanup useEffect only sets cancelledRef=true if the component
 * is genuinely unmounting (tracked via isMountedRef).
 *
 * ALSO FIXED: deck_seed removed from session creation in botService/matchmaking.
 * It's now generated client-side and stored WITHOUT requiring the column —
 * we pass it through navigation params directly. No DB column needed.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  joinQueue, leaveQueue, findOpponent, atomicMatch,
  subscribeToQueueEntry, subscribeToQueueInserts,
  getSession, subscribeLiveCount,
} from '../services/matchmakingService';
import { createBotSession, releaseBot } from '../services/botService';

const BOT_TIMEOUT_MS   = 90_000;
const FALLBACK_POLL_MS = 5_000;
const JOIN_TIMEOUT_MS  = 10_000;

async function getSessionWithRetry(sessionId, retries = 5, delay = 600) {
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

  // Elapsed timer as ref — never disrupted by re-renders
  const elapsedRef       = useRef(0);
  const timerRef         = useRef(null);
  const [, tick]         = useState(0);

  // Core state refs
  const queueIdRef    = useRef(null);
  const botIdRef      = useRef(null);
  const channelRef    = useRef(null);
  const insertChanRef = useRef(null);
  const botTimerRef   = useRef(null);
  const pollTimerRef  = useRef(null);
  const matchedRef    = useRef(false);
  const cancelledRef  = useRef(false);   // reset in startSearch — StrictMode safe
  const statusRef     = useRef('idle');
  const isMountedRef  = useRef(true);    // true while component is alive

  // External value mirrors
  const profileRef = useRef(profile);
  const userRef    = useRef(user);
  const navRef     = useRef(navigation);

  useEffect(() => { profileRef.current = profile;    }, [profile]);
  useEffect(() => { userRef.current    = user;       }, [user]);
  useEffect(() => { navRef.current     = navigation; }, [navigation]);
  useEffect(() => { statusRef.current  = status;     }, [status]);

  // Mark mounted/unmounted — only real unmount sets this
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Live count
  useEffect(() => {
    const unsub = subscribeLiveCount(setLiveCount);
    return unsub;
  }, []);

  // Timer helpers
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
    clearInterval(pollTimerRef.current);
    channelRef.current?.unsubscribe();
    insertChanRef.current?.unsubscribe();
    channelRef.current    = null;
    insertChanRef.current = null;
    botTimerRef.current   = null;
    pollTimerRef.current  = null;
  };

  // ── All async logic as live refs (always latest version) ─────

  const doNavigateRef = useRef(null);
  doNavigateRef.current = async (sessionId, isBotGame, deckSeed) => {
    console.log('[mq] navigating to game, isBotGame:', isBotGame);
    const session = await getSessionWithRetry(sessionId);
    if (!session) {
      console.error('[mq] session not found after retries');
      if (isMountedRef.current) {
        setStatus('idle'); stopTimer();
        setError('Match failed. Try again.');
      }
      return;
    }
    if (!isMountedRef.current) return;

    const uid     = userRef.current?.id;
    const isP1    = session.player1_id === uid;
    const oppName = isP1 ? session.player2_username : session.player1_username;
    const oppAv   = isP1 ? session.player2_avatar   : session.player1_avatar;
    const seed    = deckSeed || session.deck_seed || Math.floor(Math.random() * 9999999);

    setOpponent({ username: oppName, avatarPreset: oppAv, isBot: isBotGame });
    await new Promise(r => setTimeout(r, 1200));
    if (!isMountedRef.current) return;

    stopTimer();

    if (isBotGame) {
      navRef.current.replace('MultiplayerGameScreen', {
        isBotGame:        true,
        isPlayer1:        true,          // player always goes first vs bot
        deckSeed:         seed,
        difficulty:       session.bot_difficulty || 'medium',
        botId:            session.player2_id,
        opponentUsername: oppName,
        opponentAvatar:   oppAv,
      });
    } else {
      navRef.current.replace('MultiplayerGameScreen', {
        sessionId,
        isPlayer1:        isP1,
        deckSeed:         seed,
        opponentUsername: oppName,
        opponentAvatar:   oppAv,
      });
    }
  };

  const handleMatchedRef = useRef(null);
  handleMatchedRef.current = async (sessionId, isBotGame, deckSeed) => {
    if (matchedRef.current) return;
    console.log('[mq] handleMatched', sessionId, isBotGame);
    matchedRef.current   = true;
    cancelledRef.current = true;
    clearMatchmaking();
    setStatus('found');
    await doNavigateRef.current(sessionId, isBotGame, deckSeed);
  };

  const tryMatchRef = useRef(null);
  tryMatchRef.current = async (oppRow) => {
    if (matchedRef.current || cancelledRef.current) return;
    const myQueueId = queueIdRef.current;
    if (!myQueueId) return;

    console.log('[mq] trying match with:', oppRow.username);
    const sessionId = await atomicMatch({
      myQueueId,
      opponentQueueId:  oppRow.id,
      myUserId:         userRef.current?.id,
      opponentUserId:   oppRow.user_id,
      myUsername:       profileRef.current?.username,
      opponentUsername: oppRow.username,
      myAvatar:         profileRef.current?.avatar_preset || 1,
      opponentAvatar:   oppRow.avatar_preset || 1,
    });

    if (sessionId && !matchedRef.current) {
      await handleMatchedRef.current(sessionId, false);
    }
  };

  const doPollRef = useRef(null);
  doPollRef.current = async () => {
    if (matchedRef.current || cancelledRef.current) return;
    const myQueueId = queueIdRef.current;
    if (!myQueueId) return;
    console.log('[mq] polling for opponent...');
    const opp = await findOpponent({ myQueueId });
    if (opp && !matchedRef.current) {
      console.log('[mq] found opponent in poll:', opp.username);
      await tryMatchRef.current(opp);
    }
  };

  const doTriggerBotRef = useRef(null);
  doTriggerBotRef.current = async () => {
    console.log('[bot] timeout fired, cancelledRef:', cancelledRef.current, 'matchedRef:', matchedRef.current);
    if (matchedRef.current || cancelledRef.current) return;
    clearMatchmaking();

    setStatus('found');
    console.log('[bot] creating bot session...');
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
    if (!isMountedRef.current) return;

    const result = await createBotSession({
      playerUserId:   userRef.current?.id,
      playerUsername: profileRef.current?.username,
      playerAvatar:   profileRef.current?.avatar_preset || 1,
      playerScore:    profileRef.current?.score || 0,
      myQueueId:      queueIdRef.current,
    });

    console.log('[bot] createBotSession result:', result);

    if (result && !matchedRef.current) {
      botIdRef.current = result.bot.id;
      await handleMatchedRef.current(result.sessionId, true);
    } else if (!result && isMountedRef.current) {
      console.error('[bot] createBotSession returned null — check deck_seed column');
      setStatus('idle');
      stopTimer();
      setError('Could not start bot game. Please run the SQL migration and try again.');
    }
  };

  // ── START SEARCH ─────────────────────────────────────────────
  const startSearch = useCallback(async () => {
    const u = userRef.current;
    const p = profileRef.current;
    if (!u || !p) { setError('Please sign in to play'); return; }
    if (statusRef.current !== 'idle') return;

    setError(null);
    setOpponent(null);

    // CRITICAL: always reset these — handles StrictMode double-mount
    cancelledRef.current = false;
    matchedRef.current   = false;
    queueIdRef.current   = null;
    botIdRef.current     = null;

    setStatus('searching');
    startTimer();

    console.log('[mq] joining queue...');
    let queueId;
    try {
      const joinPromise   = joinQueue({ userId: u.id, username: p.username, avatarPreset: p.avatar_preset || 1, score: p.score || 0 });
      const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), JOIN_TIMEOUT_MS));
      const result = await Promise.race([joinPromise, timeoutPromise]);
      if (result.error) throw new Error(result.error.message);
      queueId = result.queueId;
      console.log('[mq] queue joined:', queueId);
    } catch (e) {
      console.error('[mq] joinQueue failed:', e.message);
      if (!cancelledRef.current && isMountedRef.current) {
        stopTimer(); setStatus('idle');
        setError('Could not connect. Check internet and try again.');
      }
      return;
    }

    if (!queueId || cancelledRef.current) {
      stopTimer(); setStatus('idle');
      setError('Could not join queue. Try again.');
      return;
    }

    queueIdRef.current = queueId;

    // Watch my own row (matched by someone else)
    channelRef.current = subscribeToQueueEntry(queueId, (sessionId) => {
      handleMatchedRef.current(sessionId, false);
    });

    // Watch for new players joining
    insertChanRef.current = subscribeToQueueInserts((newEntry) => {
      if (matchedRef.current || cancelledRef.current) return;
      if (newEntry.user_id === u.id) return;
      if (newEntry.status !== 'waiting') return;
      tryMatchRef.current(newEntry);
    });

    // Poll immediately in case someone is already waiting
    doPollRef.current();

    // Fallback poll every 5s
    pollTimerRef.current = setInterval(() => {
      console.log('[mq] fallback poll tick');
      doPollRef.current();
    }, FALLBACK_POLL_MS);

    // Bot fallback at 90s
    console.log('[mq] bot timer set for 90s');
    botTimerRef.current = setTimeout(() => {
      console.log('[mq] bot timer fired');
      doTriggerBotRef.current();
    }, BOT_TIMEOUT_MS);

  }, []); // zero deps — all via refs

  const cancelSearch = useCallback(async () => {
    cancelledRef.current = true;
    matchedRef.current   = false;
    clearMatchmaking();
    stopTimer();
    if (queueIdRef.current) await leaveQueue(queueIdRef.current);
    if (botIdRef.current)   await releaseBot(botIdRef.current);
    queueIdRef.current = null;
    botIdRef.current   = null;
    if (isMountedRef.current) { setStatus('idle'); setOpponent(null); setError(null); }
  }, []);

  // Cleanup on real unmount only
  useEffect(() => {
    return () => {
      clearMatchmaking();
      stopTimer();
      if (queueIdRef.current) leaveQueue(queueIdRef.current);
      // NOTE: do NOT set cancelledRef here — StrictMode re-mounts would break it
    };
  }, []);

  return {
    status,
    elapsed:  elapsedRef.current,
    liveCount,
    opponent,
    error,
    startSearch,
    cancelSearch,
  };
}
