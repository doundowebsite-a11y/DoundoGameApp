/**
 * botService.js — src/services/botService.js
 *
 * CRITICAL: deck_seed is now optional in the INSERT.
 * If the column doesn't exist yet, the INSERT still succeeds
 * because we handle the error and retry without it.
 */
import { supabase } from './supabase';

const BOT_NAMES = [
  'ShadowKnight','NeonViper','CryptoWolf','StarlightAce','IronFox',
  'BlazeByte','QuantumRush','PixelGuru','CyberNova','ArcticStorm',
  'VoidHunter','NightOwl','ThunderBlade','GlitchKing','SolarDrift',
  'EchoStrike','FrostByte','MidnightArc','RedSpecter','OmegaFlux',
];
const randomBotName = () =>
  `${BOT_NAMES[Math.floor(Math.random()*BOT_NAMES.length)]}_${Math.floor(Math.random()*900)+100}`;

function difficultyFromScore(s) {
  if ((s||0) >= 700) return 'champion';
  if ((s||0) >= 500) return 'hard';
  if ((s||0) >= 300) return 'medium';
  return 'easy';
}

async function getPoolBot() {
  try {
    // Release bots stuck busy > 30min
    await supabase.from('bot_pool')
      .update({ is_busy: false })
      .eq('is_busy', true)
      .lt('last_used', new Date(Date.now() - 30*60*1000).toISOString());
    const { data } = await supabase.from('bot_pool')
      .select('*').eq('is_busy', false)
      .order('last_used', { ascending: true, nullsFirst: true })
      .limit(1).maybeSingle();
    return data || null;
  } catch { return null; }
}

export async function releaseBot(botId) {
  if (!botId || botId.startsWith('inline_')) return;
  try { await supabase.from('bot_pool').update({ is_busy: false }).eq('id', botId); } catch {}
}

export async function createBotSession({
  playerUserId, playerUsername, playerAvatar, playerScore, myQueueId,
}) {
  const difficulty = difficultyFromScore(playerScore);
  const seed       = Math.floor(Math.random() * 9999999999);

  // Get bot identity
  let botId = null, botUsername = null, botAvatar = Math.floor(Math.random()*6)+1;
  const poolBot = await getPoolBot();
  if (poolBot) {
    try {
      const { error } = await supabase.from('bot_pool')
        .update({ is_busy: true, last_used: new Date().toISOString() })
        .eq('id', poolBot.id);
      if (!error) { botId = poolBot.id; botUsername = poolBot.username; botAvatar = poolBot.avatar_preset; }
    } catch {}
  }
  if (!botId) {
    botId       = `inline_${Date.now()}`;
    botUsername = randomBotName();
    console.log('[bot] using inline bot:', botUsername);
  }

  // Try inserting WITH deck_seed first
  const base = {
    player1_id:       playerUserId,
    player2_id:       botId,
    player1_username: playerUsername || 'Player',
    player2_username: botUsername,
    player1_avatar:   playerAvatar || 1,
    player2_avatar:   botAvatar,
    is_bot_game:      true,
    bot_difficulty:   difficulty,
    status:           'active',
  };

  let session = null;

  // Attempt 1: with deck_seed (if column exists)
  const { data: s1, error: e1 } = await supabase
    .from('game_sessions').insert({ ...base, deck_seed: seed }).select().single();

  if (!e1 && s1) {
    session = s1;
    console.log('[bot] session created with deck_seed:', s1.id);
  } else {
    console.warn('[bot] insert with deck_seed failed:', e1?.message, '— retrying without');
    // Attempt 2: without deck_seed (column may not exist)
    const { data: s2, error: e2 } = await supabase
      .from('game_sessions').insert(base).select().single();
    if (!e2 && s2) {
      session = s2;
      console.log('[bot] session created without deck_seed:', s2.id);
    } else {
      console.error('[bot] both inserts failed. e2:', e2?.message);
      if (botId && !botId.startsWith('inline_')) await releaseBot(botId);
      return null;
    }
  }

  return { sessionId: session.id, bot: { id: botId, username: botUsername }, deckSeed: seed };
}
