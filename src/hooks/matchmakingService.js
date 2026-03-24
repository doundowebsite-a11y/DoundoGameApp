/**
 * matchmakingService.js  —  src/services/matchmakingService.js
 *
 * Key fixes:
 * - directMatch updates rows INDIVIDUALLY (not .in()) → reliable Realtime
 * - subscribeToQueueEntry polls own row every 2s as Realtime fallback
 * - findOpponent: no score filter (removes false negatives for score=0 users)
 */
import { supabase } from './supabase';

export async function joinQueue({ userId, username, avatarPreset, score }) {
  // Clean old entry first
  await supabase.from('matchmaking_queue').delete().eq('user_id', userId);

  const { data, error } = await supabase
    .from('matchmaking_queue')
    .insert({ user_id: userId, username: username||'Player',
              avatar_preset: avatarPreset||1, score: score||0, status: 'waiting' })
    .select('id').single();

  if (error) { console.error('[mq] joinQueue:', error.message); return { error }; }
  console.log('[mq] joined queue:', data.id);
  return { queueId: data.id };
}

export async function leaveQueue(queueId) {
  if (!queueId) return;
  await supabase.from('matchmaking_queue').delete().eq('id', queueId);
}

export async function findOpponent({ myQueueId }) {
  // No score filter — find ANY waiting player
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
  // Try RPC first
  const { data, error } = await supabase.rpc('match_players', {
    p_my_queue_id:       myQueueId,
    p_opponent_queue_id: opponentQueueId,
    p_my_user_id:        myUserId,
    p_opponent_user_id:  opponentUserId,
    p_my_username:       myUsername       || 'Player',
    p_opponent_username: opponentUsername || 'Player',
    p_my_avatar:         myAvatar         || 1,
    p_opponent_avatar:   opponentAvatar   || 1,
  });

  if (!error && data) { console.log('[mq] RPC match:', data); return data; }
  console.warn('[mq] RPC failed, directMatch:', error?.message);
  return await directMatch({ myQueueId, opponentQueueId, myUserId, opponentUserId,
    myUsername, opponentUsername, myAvatar, opponentAvatar });
}

async function directMatch({
  myQueueId, opponentQueueId, myUserId, opponentUserId,
  myUsername, opponentUsername, myAvatar, opponentAvatar,
}) {
  // Verify opponent still waiting
  const { data: opp } = await supabase.from('matchmaking_queue')
    .select('status').eq('id', opponentQueueId).maybeSingle();
  if (!opp || opp.status !== 'waiting') return null;

  const seed = Math.floor(Math.random() * 9999999999);
  const { data: session, error } = await supabase
    .from('game_sessions')
    .insert({ player1_id: myUserId, player2_id: opponentUserId,
      player1_username: myUsername||'Player', player2_username: opponentUsername||'Player',
      player1_avatar: myAvatar||1, player2_avatar: opponentAvatar||1,
      is_bot_game: false, status: 'active', deck_seed: seed })
    .select('id').single();

  if (error) { console.error('[mq] directMatch insert:', error.message); return null; }

  // CRITICAL: update rows individually (not .in()) so Realtime fires per-row
  await supabase.from('matchmaking_queue')
    .update({ status: 'matched', session_id: session.id }).eq('id', myQueueId);
  await supabase.from('matchmaking_queue')
    .update({ status: 'matched', session_id: session.id }).eq('id', opponentQueueId);

  console.log('[mq] directMatch session:', session.id);
  return session.id;
}

/**
 * Subscribe to own queue row. Uses Realtime + 2s polling fallback.
 * Returns object with .unsubscribe() method.
 */
export function subscribeToQueueEntry(queueId, onMatched) {
  let done = false;
  const fire = (sid) => { if (done) return; done = true; onMatched(sid); };

  // Realtime subscription
  const ch = supabase.channel(`qe-${queueId}-${Date.now()}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public',
      table: 'matchmaking_queue', filter: `id=eq.${queueId}`,
    }, (p) => {
      if (p.new?.status === 'matched' && p.new?.session_id) {
        console.log('[mq] realtime: matched');
        fire(p.new.session_id);
      }
    }).subscribe();

  // Poll own row every 2s (reliable fallback)
  const poll = setInterval(async () => {
    if (done) { clearInterval(poll); return; }
    const { data } = await supabase.from('matchmaking_queue')
      .select('status,session_id').eq('id', queueId).maybeSingle();
    if (data?.status === 'matched' && data?.session_id) {
      console.log('[mq] poll: matched');
      clearInterval(poll);
      fire(data.session_id);
    }
  }, 2000);

  return { unsubscribe: () => { done = true; clearInterval(poll); ch.unsubscribe(); } };
}

export function subscribeToQueueInserts(onNewEntry) {
  const ch = supabase.channel(`qi-${Date.now()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matchmaking_queue' },
      (p) => { if (p.new) onNewEntry(p.new); })
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
