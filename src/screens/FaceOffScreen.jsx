import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme/theme';
import { SymbolCard } from '../game/SymbolCard';
import SoundManager from '../services/SoundManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const FaceOffScreen = ({ navigation, route }) => {
  const { overlay, gs } = route.params || {};
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (overlay?.winner === 'player') SoundManager.playWin?.();
    else if (overlay?.winner === 'ai') SoundManager.playLose?.();
  }, []);

  if (!overlay || !gs) return null;

  const handleNext = () => {
    SoundManager.playButton?.();
    const wonGame = gs.pScore >= 500;
    const lostGame = gs.aScore >= 500;

    if (wonGame || lostGame) {
      // Navigate to match results
      const diff = gs.difficulty || 'easy';
      const diffMult = diff === 'ai' ? 3.0 : diff === 'hard' ? 2.0 : diff === 'medium' ? 1.5 : 1.0;
      const finalPoints = Math.floor(gs.pScore * diffMult);
      const isDraw = wonGame && lostGame;
      const params = { points: finalPoints, totalCards: 42, time: '05:00' };
      
      if (isDraw) navigation.replace('DrawScreen', params);
      else if (wonGame) navigation.replace('WinScreen', params);
      else navigation.replace('LoseScreen', params);
    } else {
      // Continue game - go back and trigger next round
      navigation.navigate('GameScreen', { triggerNextRound: true });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>FACE-OFF!</Text>
      <Text style={styles.subtitle}>{overlay.caller?.toUpperCase()} CHALLENGED!</Text>
      
      <View style={styles.combatArea}>
        <View style={styles.playerSide}>
          <Text style={styles.label}>{overlay.winner === 'player' ? 'WINNER' : 'YOU'}</Text>
          <View style={styles.cardContainer}>
             {overlay.pSyms?.map((s, idx) => (
                <View key={idx} style={styles.miniCard}>
                   <SymbolCard symbol={s} size={50} />
                </View>
             ))}
          </View>
        </View>

        <Text style={styles.vsText}>VS</Text>

        <View style={styles.playerSide}>
          <Text style={styles.label}>{overlay.winner === 'ai' ? 'WINNER' : 'OPPONENT'}</Text>
          <View style={styles.cardContainer}>
             {overlay.aSyms?.map((s, idx) => (
                <View key={idx} style={styles.miniCard}>
                   <SymbolCard symbol={s} size={50} />
                </View>
             ))}
          </View>
        </View>
      </View>

      <Text style={styles.resultText}>
        {overlay.winner === 'player' ? 'YOU WON THE FACE-OFF!' : 
         overlay.winner === 'ai' ? 'OPPONENT WON THE FACE-OFF!' : 'IT\'S A TIE!'}
      </Text>
      <Text style={styles.matchCount}>{overlay.matches} MATCHES FOUND</Text>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#F472B6',
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: 'rgba(244,114,182,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    marginBottom: 10,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 40,
  },
  combatArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 40,
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 15,
    letterSpacing: 1,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    width: 130,
  },
  miniCard: {
    width: 58,
    height: 80,
  },
  vsText: {
    color: '#FACC15',
    fontSize: 32,
    fontWeight: '900',
    marginHorizontal: 10,
  },
  resultText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchCount: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 50,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 9999,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 4,
  }
});

export default FaceOffScreen;
