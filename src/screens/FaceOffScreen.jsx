/**
 * FaceOffScreen.jsx — src/screens/FaceOffScreen.jsx
 * Logic-only component for the Face-Off Screen.
 */
import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SoundManager from '../services/SoundManager';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import FaceOffLayout from './layouts/FaceOffLayout';

const { width } = Dimensions.get('window');

const FaceOffScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile, user, refreshProfile } = useAuth();
  const { overlay, gs, sessionId, isPlayer1, opponentAvatar, opponentId } = route.params || {};

  useEffect(() => {
    if (overlay?.winner === 'player') SoundManager.playWin?.();
    else if (overlay?.winner === 'ai') SoundManager.playLose?.();
  }, [overlay?.winner]);

  if (!overlay || !gs) return null;

  const playerWon = overlay.winner === 'player';

  const handleNext = async () => {
    SoundManager.playButton?.();
    const diff = gs?.difficulty ?? route?.params?.difficulty ?? 'easy';
    const diffMult = diff === 'ai' ? 3.0 : diff === 'hard' ? 2.0 : diff === 'medium' ? 1.5 : 1.0;
    const totalCards = route?.params?.totalCards ?? 0;
    const time = route?.params?.time ?? '00:00';

    const roundPts = overlay?.matchText ? (parseInt(overlay.matchText.replace(/[^0-9]/g, ''), 10) || 0) : (playerWon ? 200 : 0);
    const wonGame = (gs?.pScore ?? 0) >= 500;
    const lostGame = (gs?.aScore ?? 0) >= 500;
    const matchEnded = wonGame || lostGame;
    const matchPoints = matchEnded ? Math.floor((gs?.pScore ?? 0) * diffMult) : roundPts;

    const params = {
      points: matchPoints,
      totalCards,
      time,
      isMultiplayer: gs?.isMultiplayer,
      opponentName: gs?.opponentName,
      sessionId,
      isPlayer1,
      opponentAvatar,
      opponentId,
    };

    // OPTIMIZATION: Navigate first, sync in background to remove lag
    if (matchEnded) {
      if (wonGame && lostGame) navigation.replace('DrawScreen', params);
      else if (wonGame) navigation.replace('WinScreen', params);
      else navigation.replace('LoseScreen', params);
    } else {
      const nextParams = { ...params, isRoundOnly: true };
      if (overlay.winner === 'player') navigation.replace('WinScreen', nextParams);
      else if (overlay.winner === 'ai') navigation.replace('LoseScreen', nextParams);
      else navigation.replace('DrawScreen', nextParams);
    }

    if (user?.id) {
      const ptsToAdd = matchEnded ? (wonGame ? matchPoints : 0) : (playerWon ? roundPts : 0);
      try {
        supabase.functions.invoke('process_match_result', {
          body: { matchPoints: ptsToAdd, wonGame, lostGame, matchEnded, addFaceOff: true }
        }).then(({ data: fnData, error: fnError }) => {
          if (fnError || !fnData?.success) {
            const updates = { score: (profile.score || 0) + ptsToAdd, face_offs: (profile.face_offs || 0) + 1 };
            if (matchEnded) {
              updates.games_won = (profile.games_won || 0) + (wonGame && !lostGame ? 1 : 0);
              updates.games_lost = (profile.games_lost || 0) + (!wonGame && lostGame ? 1 : 0);
              updates.games_drawn = (profile.games_drawn || 0) + (wonGame && lostGame ? 1 : 0);
            }
            supabase.from('profiles').update(updates).eq('id', user.id).then();
          }
          refreshProfile?.();
        });
      } catch (e) {
        console.error('FaceOff save error:', e);
      }
    }
  };

  const containerWidth = Math.min(width, 448);
  const cardW = Math.floor((containerWidth - 80) / 5);
  const cardH = Math.floor(cardW * 1.45);

  return (
    <FaceOffLayout
      {...{
        insets, overlay, playerWon, username: profile?.username, cardW, cardH,
        pSyms: overlay.pSyms ?? [],
        aSyms: overlay.aSyms ?? [],
        onNext: handleNext
      }}
    />
  );
};

export default FaceOffScreen;
