/**
 * FaceOffLayout.jsx — src/screens/layouts/FaceOffLayout.jsx
 * Pure UI component for the Face-Off Screen.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';
import { SymbolCard } from '../../game/SymbolCard';

const FaceOffLayout = (props) => {
  const {
    insets, overlay, playerWon, username, cardW, cardH, pSyms, aSyms, onNext
  } = props;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>FACE-OFF!</Text>
          <Text style={styles.caller}>
            {(overlay.caller ?? 'Player').toUpperCase()} CHALLENGED
          </Text>
        </View>

        {/* Cards comparison area */}
        <View style={styles.arena}>

          {/* Player side */}
          <View style={styles.side}>
            <View style={[
              styles.sideHeader,
              playerWon && styles.sideHeaderWin,
              overlay.winner === 'ai' && styles.sideHeaderLose,
            ]}>
              <Text style={styles.sideLabel}>
                {playerWon ? '👑 WINNER' : (username ?? 'YOU').toUpperCase()}
              </Text>
            </View>
            <View style={styles.cardsWrap}>
              {pSyms.map((s, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.faceCard,
                    { width: cardW, height: cardH },
                    playerWon && styles.faceCardWin,
                  ]}
                >
                  <View style={styles.faceCardInner}>
                    <SymbolCard symbol={s} disabled size={Math.floor(cardW * 0.52)} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* VS divider */}
          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Opponent side */}
          <View style={styles.side}>
            <View style={[
              styles.sideHeader,
              overlay.winner === 'ai' && styles.sideHeaderWin,
              playerWon && styles.sideHeaderLose,
            ]}>
              <Text style={styles.sideLabel}>
                {overlay.winner === 'ai' ? '👑 WINNER' : 'OPPONENT'}
              </Text>
            </View>
            <View style={styles.cardsWrap}>
              {aSyms.map((s, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.faceCard,
                    { width: cardW, height: cardH },
                    overlay.winner === 'ai' && styles.faceCardWin,
                  ]}
                >
                  <View style={styles.faceCardInner}>
                    <SymbolCard symbol={s} disabled size={Math.floor(cardW * 0.52)} />
                  </View>
                </View>
              ))}
            </View>
          </View>

        </View>

        {/* Result */}
        <View style={styles.resultSection}>
          <Text style={[
            styles.resultText,
            playerWon ? { color: '#4ADE80' }
            : overlay.winner === 'ai' ? { color: '#f87171' }
            : { color: '#FACC15' },
          ]}>
            {playerWon ? 'YOU WON THE FACE-OFF!'
              : overlay.winner === 'ai' ? 'OPPONENT WON!'
              : "IT'S A TIE!"}
          </Text>
          <Text style={styles.matchCount}>
            {overlay.matches ?? 0} SYMBOL{(overlay.matches ?? 0) !== 1 ? 'S' : ''} MATCHED
          </Text>
        </View>

        {/* NEXT — only button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>NEXT →</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', width: '100%' },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24, gap: 20 },
  titleSection: { alignItems: 'center', gap: 6 },
  title: { color: '#F472B6', fontSize: 48, fontWeight: '900', fontStyle: 'italic', textShadowColor: 'rgba(244,114,182,0.4)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 12 },
  caller: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase' },
  arena: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', width: '100%', gap: 8, marginTop: 4 },
  side: { flex: 1, alignItems: 'center', gap: 10 },
  sideHeader: { backgroundColor: 'rgba(30,41,59,0.6)', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999 },
  sideHeaderWin: { backgroundColor: 'rgba(74,222,128,0.15)', borderColor: '#4ADE80' },
  sideHeaderLose: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: '#f87171' },
  sideLabel: { color: '#E2E8F0', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  cardsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  faceCard: { borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(37,106,244,0.2)', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  faceCardWin: { borderColor: '#4ADE80', borderWidth: 2, shadowColor: '#4ADE80', shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  faceCardInner: { flex: 1, backgroundColor: '#f2e3c6', alignItems: 'center', justifyContent: 'center' },
  vsDivider: { paddingTop: 36, alignItems: 'center' },
  vsText: { color: '#FACC15', fontSize: 26, fontWeight: '900', fontStyle: 'italic' },
  resultSection: { alignItems: 'center', gap: 6 },
  resultText: { fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  matchCount: { color: '#4ADE80', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  nextBtn: { backgroundColor: theme.colors.primary, paddingVertical: 18, paddingHorizontal: 72, borderRadius: 9999, marginTop: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  nextBtnText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 4 },
});

export default FaceOffLayout;
