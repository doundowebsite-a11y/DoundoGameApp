/**
 * matchmakingService.js — src/services/matchmakingService.js
 *
 * Single channel design: one Supabase presence channel for both
 * matchmaking and live player count. Two separate channels on the
 * same room name caused presence events to be silently dropped on
 * one of the subscribers, preventing devices from seeing each other.
 */
import { supabase } from './supabase';

let lobbyChannel = null;
const countListeners = new Set();

export function joinLobby(userData, onStateChange) {
  if (lobbyChannel) {
    lobbyChannel.unsubscribe();
    lobbyChannel = null;
  }

  // Use a unique presence key per device/session to allow testing with same account
  const presenceKey = `${userData.userId}:${Math.random().toString(36).slice(2, 8)}`;

  lobbyChannel = supabase.channel('doundo-lobby-v3', {
    config: { presence: { key: presenceKey } },
  });

  lobbyChannel
    .on('presence', { event: 'sync' }, () => {
      const state = lobbyChannel.presenceState();
      const presences = [];
      for (const key in state) {
        state[key].forEach(p => {
          presences.push({ ...p, presenceKey: key });
        });
      }
      onStateChange(presences);
      const waiting = presences.filter(p => p.status === 'waiting').length;
      countListeners.forEach(fn => fn(waiting));
    })
    .subscribe(async (status) => {
      console.log('[mp-service] lobby status:', status);
      if (status === 'SUBSCRIBED') {
        const trackWithRetry = async (attempt = 1) => {
          const { error } = await lobbyChannel.track({
            ...userData,
            status: 'waiting',
            joinedAt: Date.now(),
          });
          if (error) {
            console.error(`[mp-service] track failed (attempt ${attempt}):`, error.message);
            if (attempt < 3) setTimeout(() => trackWithRetry(attempt + 1), 1000);
          } else {
            console.log('[mp-service] track success');
          }
        };
        trackWithRetry();
      }
    });

  return { lobbyChannel, presenceKey };
}


export async function leaveLobby() {
  if (lobbyChannel) {
    await lobbyChannel.unsubscribe();
    lobbyChannel = null;
  }
}

export async function updateLobbyStatus(statusData) {
  if (lobbyChannel) {
    await lobbyChannel.track(statusData);
  }
}

export async function createGameSession({
  myUserId, opponentUserId,
  myUsername, opponentUsername,
  myAvatar, opponentAvatar,
}) {
  const seed = Math.floor(Math.random() * 9999999999);
  const base = {
    player1_id: myUserId, player2_id: opponentUserId,
    player1_username: myUsername || 'Player', player2_username: opponentUsername || 'Player',
    player1_avatar: myAvatar || 1, player2_avatar: opponentAvatar || 1,
    is_bot_game: false, status: 'active',
  };

  const { data: s1, error: e1 } = await supabase
    .from('game_sessions').insert({ ...base, deck_seed: seed }).select('id').single();
  
  if (!e1 && s1) return s1.id;

  console.warn('[mq] createGameSession deck_seed failed:', e1?.message);
  const { data: s2, error: e2 } = await supabase
    .from('game_sessions').insert(base).select('id').single();
    
  if (!e2 && s2) return s2.id;
  
  console.error('[mq] createGameSession both failed:', e2?.message);
  return null;
}

export async function getSession(sessionId) {
  const { data } = await supabase.from('game_sessions').select('*')
    .eq('id', sessionId).maybeSingle();
  return data || null;
}

// Live count via shared lobby channel
export function subscribeLiveCount(onUpdate) {
  countListeners.add(onUpdate);
  return () => countListeners.delete(onUpdate);
}
