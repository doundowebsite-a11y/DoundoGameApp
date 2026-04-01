/**
 * HomeScreen.jsx — src/screens/HomeScreen.jsx
 * Logic-only component for the Home Screen.
 */
import React, { useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import useMatchmaking from '../hooks/useMatchmaking';
import { getLevel, getLevelProgress, getLevelTitle } from '../utils/scoring';
import HomeLayout from './layouts/HomeLayout';
import { supabase } from '../services/supabase';

const HomeScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const manualExit = route?.params?.manualExit ?? false;

  useFocusEffect(
    useCallback(() => {
      // If we manually exited from a game, skip re-join check ONCE.
      if (manualExit) {
        navigation.setParams({ manualExit: false });
        return;
      }
      if (!user?.id) return;
      async function checkRejoin() {
        try {
          // Only rejoin sessions created in the last 5 minutes (very recent only)
          const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

          // Clean up any stale active sessions older than 5 min
          await supabase.from('game_sessions')
            .update({ status: 'abandoned' })
            .eq('is_bot_game', false)
            .lt('created_at', fiveMinsAgo)
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .in('status', ['active', 'waiting']);

          // Only rejoin an active MULTIPLAYER session from the last 5 minutes
          // Exclude completed/abandoned sessions explicitly
          const { data } = await supabase.from('game_sessions')
            .select('id, player1_id, player2_id, status')
            .in('status', ['active'])
            .eq('is_bot_game', false)
            .neq('status', 'completed')
            .neq('status', 'abandoned')
            .gte('created_at', fiveMinsAgo)
            .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(1).maybeSingle();
            
          if (data && data.status === 'active') {
            console.log('[home] Found active session, auto-rejoining:', data.id);
            navigation.replace('MultiplayerGameScreen', { 
              sessionId: data.id, 
              isPlayer1: data.player1_id === user.id 
            });
          }
        } catch (err) {
          console.warn('[home] Rejoin check failed:', err);
        }
      }
      checkRejoin();
    }, [user?.id, manualExit])
  );

  const username = profile?.username      || 'Gamer';
  const score    = profile?.score         || 0;
  const avatar   = profile?.avatar_preset || 1;

  const level     = getLevel(score);
  const { xpInLevel, xpNeeded, xpPct } = getLevelProgress(score);
  const levelTitle = getLevelTitle(score);

  const { 
    status, elapsed, liveCount, opponent, error, 
    startSearch, cancelSearch, acceptBot, extendSearch 
  } = useMatchmaking(navigation);

  const isSearching = status !== 'idle';
  const showModal   = ['searching', 'prompt_bot', 'found', 'starting'].includes(status);

  return (
    <HomeLayout
      {...{
        navigation, insets, username, avatar, level, xpPct, levelTitle, xpInLevel, xpNeeded,
        isSearching, liveCount, status, elapsed, opponent, showModal, error,
        onStartSearch: startSearch,
        onCancelSearch: cancelSearch,
        onAcceptBot: acceptBot,
        onExtendSearch: extendSearch
      }}
    />
  );
};

export default HomeScreen;
