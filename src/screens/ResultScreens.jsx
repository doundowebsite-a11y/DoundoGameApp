import React, { useEffect, useState, useRef } from 'react';
import { Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import SoundManager from '../services/SoundManager';
import { supabase } from '../services/supabase';
import ResultLayout from './layouts/ResultLayout';

export const WinScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const params = route.params || {};
  const { points = 0, totalCards = 0, time = '00:00', perfect, forfeit, opponentName: oppName, isMultiplayer: isMP, isRoundOnly, sessionId, isPlayer1, opponentAvatar, opponentId } = params;

  useEffect(() => { SoundManager.playWin?.(); }, []);

  const handleShare = async () => { try { await Share.share({ message: `I won a Doundo match! ${points} points earned${oppName ? ` vs ${oppName}` : ''}${perfect ? ' — PERFECT GAME!' : ''} 🏆` }); } catch {} };
  const handleNext = () => { if (isRoundOnly) navigation.navigate(isMP ? 'MultiplayerGameScreen' : 'GameScreen', { ...params, triggerNextRound: true }); else navigation.navigate('Home'); };
  const handleHome = async () => {
    if (isMP && sessionId) {
      try { await supabase.from('game_sessions').update({ status: 'completed' }).eq('id', sessionId); } catch {}
    }
    navigation.navigate('Home');
  };

  return (
    <ResultLayout
      type="win"
      {...{
        navigation, insets, points, totalCards, time, perfect, forfeit, oppName, isMP, isRoundOnly,
        title: isRoundOnly ? "Round Result" : "Victory",
        victoryText: isRoundOnly ? "ROUND WON" : "VICTORY",
        subtitleText: isMP && oppName ? `VS ${oppName.toUpperCase()}` : 'CHAMPION OF THE ROUND',
        username: profile?.username || 'Player',
        avatarPreset: profile?.avatar_preset ?? 1,
        currentTotal: profile?.score || 0,
        onNext: handleNext, onShare: handleShare, onHome: handleHome
      }}
    />
  );
};

export const LoseScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const params = route.params || {};
  const { points = 0, totalCards = 0, time = '00:00', forfeit, opponentName: oppName, isMultiplayer: isMP, isRoundOnly, sessionId, isPlayer1, opponentAvatar, opponentId } = params;

  useEffect(() => { SoundManager.playLose?.(); }, []);

  const handleShare = async () => { try { await Share.share({ message: `Tough loss in Doundo${oppName ? ` vs ${oppName}` : ''}. Time to come back stronger! 💪` }); } catch {} };
  const handleNext = () => { if (isRoundOnly) navigation.navigate(isMP ? 'MultiplayerGameScreen' : 'GameScreen', { ...params, triggerNextRound: true }); else navigation.navigate('Home'); };
  const handleHome = async () => {
    if (isMP && sessionId) {
      try { await supabase.from('game_sessions').update({ status: 'completed' }).eq('id', sessionId); } catch {}
    }
    navigation.navigate('Home');
  };

  return (
    <ResultLayout
      type="lose"
      {...{
        navigation, insets, points, totalCards, time, forfeit, oppName, isMP, isRoundOnly,
        title: isRoundOnly ? "Round Result" : "Match Lost",
        victoryText: isRoundOnly ? "ROUND LOST" : "DEFEAT",
        subtitleText: forfeit ? 'TIMED OUT' : isMP && oppName ? `VS ${oppName.toUpperCase()}` : 'BETTER LUCK NEXT TIME',
        username: profile?.username || 'Player',
        avatarPreset: profile?.avatar_preset ?? 1,
        currentTotal: profile?.score || 0,
        onNext: handleNext, onShare: handleShare, onHome: handleHome
      }}
    />
  );
};

export const DrawScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const params = route.params || {};
  const { points = 0, totalCards = 0, time = '00:00', opponentName: oppName, isMultiplayer: isMP, isRoundOnly, sessionId, isPlayer1, opponentAvatar, opponentId } = params;

  const handleShare = async () => { try { await Share.share({ message: `Draw match in Doundo${oppName ? ` vs ${oppName}` : ''}! Rematch time! 🤝` }); } catch {} };
  const handleNext = () => { if (isRoundOnly) navigation.navigate(isMP ? 'MultiplayerGameScreen' : 'GameScreen', { ...params, triggerNextRound: true }); else navigation.navigate('Home'); };
  const handleHome = async () => {
    if (isMP && sessionId) {
      try { await supabase.from('game_sessions').update({ status: 'completed' }).eq('id', sessionId); } catch {}
    }
    navigation.navigate('Home');
  };

  return (
    <ResultLayout
      type="draw"
      {...{
        navigation, insets, points, totalCards, time, oppName, isMP, isRoundOnly,
        title: isRoundOnly ? "Round Result" : "Match Result",
        victoryText: isRoundOnly ? "ROUND DRAW" : "DRAW",
        subtitleText: isMP && oppName ? `VS ${oppName.toUpperCase()}` : 'NO WINNER THIS TIME',
        username: profile?.username || 'Player',
        avatarPreset: profile?.avatar_preset ?? 1,
        currentTotal: profile?.score || 0,
        onNext: handleNext, onShare: handleShare, onHome: handleHome
      }}
    />
  );
};
