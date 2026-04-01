/**
 * DailyChallengeScreen.jsx
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

export default function DailyChallengeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // Deterministic seed for today
  const today = new Date();
  const dateString = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
    hash |= 0;
  }
  const dailySeed = Math.abs(hash);

  const handlePlay = () => {
    navigation.replace('MultiplayerGameScreen', {
      isBotGame: true,
      isPlayer1: true,
      botId: 'daily-bot',
      deckSeed: dailySeed,
      difficulty: 'hard', // Daily challenge is always Hard!
      opponentUsername: 'Daily Master',
      opponentAvatar: 5
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.title}>DAILY CHALLENGE</Text>
        <Text style={styles.date}>{today.toDateString()}</Text>
        <Text style={styles.desc}>
          Everyone plays the exact same shuffled deck today. 
          Beat the Hard Bot with the highest score possible!
        </Text>
        
        <TouchableOpacity style={styles.btn} onPress={handlePlay}>
          <Text style={styles.btnTxt}>PLAY MATCH</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.dark },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  date: { fontSize: 18, color: theme.colors.primary, fontWeight: 'bold' },
  desc: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 32 },
  btn: { backgroundColor: '#ea580c', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 12 },
  btnTxt: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  backBtn: { marginTop: 16, padding: 12 },
  backTxt: { color: theme.colors.text.secondary, fontSize: 14, fontWeight: '600' }
});
