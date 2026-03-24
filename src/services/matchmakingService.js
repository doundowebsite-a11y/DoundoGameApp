/**
 * matchmakingService.js — src/services/matchmakingService.js
 *
 * Same deck_seed fallback pattern as botService.
 * directMatch tries with deck_seed, retries without if column missing.
 * subscribeToQueueEntry: Realtime + 2s polling fallback.
 */
import { supabase } from './supabase';

export async function joinQueue({ userId, username, avatarPreset, score }) {
  await supabase.from('matchmaking_queue').delete().eq('user_id', userId);
  const { data, error } = await supabase
    .from('matchmaking_queue')
    .insert({ user_id: userId, username: username||'Player',
              avatar_preset: avatarPreset||1, score: score||0, status: 'waiting' })
    .select('id').single();
  if (error) { console.error('[mq] joinQueue error:', error.message); return { error }; }
  console.log('[mq] joined queue:', data.id);
  return { queueId: data.id };
}

export async function leaveQueue(queueId) {
  if (!queueId) return;
  await supabase.from('matchmaking_queue').delete().eq('id', queueId);
}

export async function findOpponent({ myQueueId }) {
  const { data } = await supabase
    .from('matchmaking_queue').select('*')
    .eq('status', 'waiting').neq('id', myQueueId)
    .order('created_at', { ascending: true }).limit(1).maybeSingle();
  return data || null;
}

export async function atomicMatch({
  myQueueId, opponentQueueId, myUserId, opponentUserId,
  myUsername, opponentUsername, myAvatar, opponentAvatar,
}) {
  const { data, error } = await supabase.rpc('match_players', {
    p_my_queue_id: myQueueId, p_opponent_queue_id: opponentQueueId,
    p_my_user_id: myUserId, p_opponent_user_id: opponentUserId,
    p_my_username: myUsername||'Player', p_opponent_username: opponentUsername||'Player',
    p_my_avatar: myAvatar||1, p_opponent_avatar: opponentAvatar||1,
  });
  if (!error && data) { console.log('[mq] RPC match:', data); return data; }
  console.warn('[mq] RPC failed:', error?.message, '— trying directMatch');
  return directMatch({ myQueueId, opponentQueueId, myUserId, opponentUserId,
    myUsername, opponentUsername, myAvatar, opponentAvatar });
}

async function directMatch({
  myQueueId, opponentQueueId, myUserId, opponentUserId,
  myUsername, opponentUsername, myAvatar, opponentAvatar,
}) {
  const { data: opp } = await supabase.from('matchmaking_queue')
    .select('status').eq('id', opponentQueueId).maybeSingle();
  if (!opp || opp.status !== 'waiting') return null;

  const seed = Math.floor(Math.random() * 9999999999);
  const base = {
    player1_id: myUserId, player2_id: opponentUserId,
    player1_username: myUsername||'Player', player2_username: opponentUsername||'Player',
    player1_avatar: myAvatar||1, player2_avatar: opponentAvatar||1,
    is_bot_game: false, status: 'active',
  };

  let sessionId = null;

  // Try with deck_seed
  const { data: s1, error: e1 } = await supabase
    .from('game_sessions').insert({ ...base, deck_seed: seed }).select('id').single();
  if (!e1 && s1) {
    sessionId = s1.id;
    console.log('[mq] directMatch with deck_seed:', sessionId);
  } else {
    console.warn('[mq] directMatch deck_seed failed:', e1?.message);
    // Retry without
    const { data: s2, error: e2 } = await supabase
      .from('game_sessions').insert(base).select('id').single();
    if (!e2 && s2) {
      sessionId = s2.id;
      console.log('[mq] directMatch without deck_seed:', sessionId);
    } else {
      console.error('[mq] directMatch both failed:', e2?.message);
      return null;
    }
  }

  // Individual updates so Realtime fires per-row
  await supabase.from('matchmaking_queue')
    .update({ status: 'matched', session_id: sessionId }).eq('id', myQueueId);
  await supabase.from('matchmaking_queue')
    .update({ status: 'matched', session_id: sessionId }).eq('id', opponentQueueId);

  return sessionId;
}

export function subscribeToQueueEntry(queueId, onMatched) {
  let done = false;
  const fire = (sid) => { if (done) return; done = true; onMatched(sid); };

  const ch = supabase.channel(`qe-${queueId}-${Date.now()}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public',
      table: 'matchmaking_queue', filter: `id=eq.${queueId}`,
    }, (p) => {
      if (p.new?.status === 'matched' && p.new?.session_id) {
        console.log('[mq] realtime matched');
        fire(p.new.session_id);
      }
    }).subscribe();

  // Poll every 2s — reliable fallback for missed Realtime events
  const poll = setInterval(async () => {
    if (done) { clearInterval(poll); return; }
    const { data } = await supabase.from('matchmaking_queue')
      .select('status,session_id').eq('id', queueId).maybeSingle();
    if (data?.status === 'matched' && data?.session_id) {
      console.log('[mq] poll matched');
      clearInterval(poll);
      fire(data.session_id);
    }
  }, 2000);

  return { unsubscribe: () => { done = true; clearInterval(poll); ch.unsubscribe(); } };
}

export function subscribeToQueueInserts(onNewEntry) {
  const ch = supabase.channel(`qi-${Date.now()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matchmaking_queue' },
      p => { if (p.new) onNewEntry(p.new); })
    .subscribe();
  return { unsubscribe: () => ch.unsubscribe() };
}

export async function getSession(sessionId) {
  const { data } = await supabase.from('game_sessions').select('*')
    .eq('id', sessionId).maybeSingle();
  return data || null;
}

export async function getLiveCount() {
  const { count } = await supabase.from('matchmaking_queue')
    .select('id', { count: 'exact', head: true }).eq('status', 'waiting');
  return count || 0;
}

export function subscribeLiveCount(onUpdate) {
  getLiveCount().then(onUpdate);
  const t = setInterval(async () => onUpdate(await getLiveCount()), 15000);
  return () => clearInterval(t);
}
