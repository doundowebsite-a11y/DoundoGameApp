import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { SymbolCard } from '../game/SymbolCard';
import SoundManager from '../services/SoundManager';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

/*
  FaceOffScreen
  ─────────────
  Shows both players' cards side by side.
  Only one button: NEXT.
  NEXT navigates to WinScreen or LoseScreen based on overlay.winner.
*/
const FaceOffScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { overlay, gs } = route.params || {};

  useEffect(() => {
    if (overlay?.winner === 'player') SoundManager.playWin?.();
    else if (overlay?.winner === 'ai') SoundManager.playLose?.();
  }, []);

  if (!overlay || !gs) return null;

  const playerWon = overlay.winner === 'player';

  const handleNext = () => {
    SoundManager.playButton?.();
    const diff = gs.difficulty || 'easy';
    const diffMult = diff === 'ai' ? 3.0 : diff === 'hard' ? 2.0 : diff === 'medium' ? 1.5 : 1.0;
    const wonGame = gs.pScore >= 500;
    const lostGame = gs.aScore >= 500;
    const params = {
      points: Math.floor(gs.pScore * diffMult),
      totalCards: 42,
      time: '05:00',
    };

    if (wonGame || lostGame) {
      if (wonGame && lostGame) navigation.replace('DrawScreen', params);
      else if (wonGame) navigation.replace('WinScreen', params);
      else navigation.replace('LoseScreen', params);
    } else {
      // Continue the game — next round
      navigation.navigate('GameScreen', { triggerNextRound: true });
    }
  };

  const cardSize = Math.min(64, (width - 80) / 5);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >

        {/* Title */}
        <Text style={styles.title}>FACE-OFF!</Text>
        <Text style={styles.subtitle}>
          {(overlay.caller ?? 'Player').toUpperCase()} CHALLENGED!
        </Text>

        {/* Cards comparison */}
        <View style={styles.combatArea}>

          {/* Player side */}
          <View style={styles.playerSide}>
            <Text style={[styles.sideLabel, playerWon && { color: '#4ADE80' }]}>
              {playerWon ? '👑 WINNER' : profile?.username?.toUpperCase() ?? 'YOU'}
            </Text>
            <View style={styles.cardsGrid}>
              {overlay.pSyms?.map((s, idx) => (
                <View key={idx} style={{ width: cardSize, height: cardSize * 1.35 }}>
                  <SymbolCard symbol={s} disabled />
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.vsText}>VS</Text>

          {/* Opponent side */}
          <View style={styles.playerSide}>
            <Text style={[styles.sideLabel, !playerWon && overlay.winner === 'ai' && { color: '#f87171' }]}>
              {!playerWon && overlay.winner === 'ai' ? '👑 WINNER' : 'OPPONENT'}
            </Text>
            <View style={styles.cardsGrid}>
              {overlay.aSyms?.map((s, idx) => (
                <View key={idx} style={{ width: cardSize, height: cardSize * 1.35 }}>
                  <SymbolCard symbol={s} disabled />
                </View>
              ))}
            </View>
          </View>

        </View>

        {/* Result */}
        <Text style={[
          styles.resultText,
          { color: playerWon ? '#4ADE80' : '#f87171' }
        ]}>
          {playerWon ? 'YOU WON THE FACE-OFF!' :
           overlay.winner === 'ai' ? 'OPPONENT WON!' : "IT'S A TIE!"}
        </Text>

        <Text style={styles.matchCount}>
          {overlay.matches ?? 0} SYMBOL{(overlay.matches ?? 0) !== 1 ? 'S' : ''} MATCHED
        </Text>

        {/* NEXT — the only button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>NEXT</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  title: {
    color: '#F472B6',
    fontSize: 52,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: 'rgba(244,114,182,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  combatArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  sideLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  vsText: {
    color: '#FACC15',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 32,
    flexShrink: 0,
  },
  resultText: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  matchCount: {
    color: '#4ADE80',
    fontSize: 16,
    fontWeight: '700',
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 9999,
    marginTop: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  nextBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 4,
  },
});

export default FaceOffScreen;
