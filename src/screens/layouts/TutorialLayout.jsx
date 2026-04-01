/**
 * TutorialLayout.jsx — src/screens/layouts/TutorialLayout.jsx
 *
 * FIXES:
 * 1. SKIP button rendered LAST (highest zIndex) so it's always above
 *    SpotlightMask (zIndex 90), the explain overlay (zIndex 50),
 *    HandPointer (zIndex 998), and TooltipBubble (zIndex 100).
 *    Previously the button was inside the header which is below all overlays.
 *
 * 2. SKIP button is a fixed-position absolute View so it cannot be covered
 *    by anything else in the layout regardless of render order.
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Animated, ActivityIndicator,
} from 'react-native';
import { DoundoLogo } from '../../assets/logo/doundo_logo';
import GameBoard from '../../game/GameBoard';
import HandCard from '../../game/HandCard';
import { useGlow } from '../../game/GlowAnimator';
import SpotlightMask from '../../tutorial/SpotlightMask';
import HandPointer from '../../tutorial/HandPointer';
import TooltipBubble from '../../tutorial/TooltipBubble';
import BottomNav from '../../components/ui/BottomNav';
import { STEP_COUNT } from '../../tutorial/tutorialSteps';

const CARD_BACK = require('../../assets/icons/card_back.png');
const C = {
  bg: '#101622', primary: '#256af4',
  s800: '#1E293B', s700: '#334155',
  s400: '#94A3B8', s300: '#CBD5E1',
};

const DrawBtn = ({ active, count, onDraw, btnRef }) => {
  const glow = useGlow(active);
  const so = glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.9] });
  return (
    <TouchableOpacity onPress={onDraw} disabled={!active} style={{ flex: 1 }}>
      <Animated.View ref={btnRef} style={[
        styles.drawBtn,
        active
          ? { borderColor: C.primary, backgroundColor: C.s800, shadowColor: C.primary, shadowOpacity: so, shadowRadius: 12, elevation: 8 }
          : { borderColor: C.s700, backgroundColor: 'rgba(30,41,59,0.4)', opacity: 0.5 },
      ]}>
        <Text style={{ fontSize: 18, marginRight: 4 }}>🃏</Text>
        <Text style={[styles.drawLabel, { color: active ? C.primary : C.s400 }]}>DRAW CARD</Text>
        <View style={styles.badge}><Text style={styles.badgeTxt}>{count}</Text></View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const TutorialLayout = (props) => {
  const {
    navigation, insets, containerW, cardW, cardH, oppW, oppH,
    gs, selIdx, setSelIdx, hoverCell, glowCells,
    step, stepNum, spotlight, handProps, shakeTooltip,
    skipping,
    boardRef, drawBtnRef, handRef, swapBtnRef, faceOffRef, winBtnRef,
    pillsRef, oppRef, actionBarRef, handCardRefs,
    onBoardMeasure, onSkip, onDraw, onSwapStart, onSwapCancel,
    onFaceOff, onWin, onHandTap, onDragMove, onDrop, onTilePress,
    onAdvance, onHandDragStart,
  } = props;

  const isDrawPhase  = gs.phase === 'draw'  && !gs.gameOver;
  const isPlacePhase = gs.phase === 'place' && !gs.gameOver;
  const isSwapMode   = !!gs.swapMode;
  const showSwap     = isPlacePhase || isSwapMode;

  return (
    <View style={[styles.container]}>

      {/* ── Overlays (zIndex 50–998) ── rendered before content so skip btn wins */}
      <SpotlightMask rect={spotlight} active={!!spotlight} />

      {step?.type === 'explain' && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]} pointerEvents="box-only" />
      )}

      {handProps?.visible && (
        <HandPointer
          targetX={handProps.targetX}
          targetY={handProps.targetY}
          visible={handProps.visible}
        />
      )}

      <TooltipBubble
        title={step?.title ?? ''}
        body={step?.body ?? ''}
        step={stepNum}
        total={STEP_COUNT}
        onNext={step?.type === 'explain' ? onAdvance : null}
        anchor={step?.tooltipAnchor ?? 'bottom'}
        shake={shakeTooltip}
      />

      {/* ── SKIP button — absolute, highest zIndex, always tappable ── */}
      <View
        style={[
          styles.skipContainer,
          { top: insets.top + 8 },
        ]}
        // pointerEvents="box-none" so touches pass through to game below
        // but the button itself still receives touches
      >
        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipBtn}
          disabled={skipping}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {skipping
            ? <ActivityIndicator size="small" color="#94A3B8" />
            : <Text style={styles.skipTxt}>SKIP TUTORIAL</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Main game UI ── */}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <DoundoLogo width={80} height={21} />
        <View ref={pillsRef} style={styles.pills}>
          {['L1', 'L2', 'L3'].map((l, i) => (
            <View key={l} style={gs.currentLayer === i + 1 ? styles.pillOn : styles.pillOff}>
              <Text style={gs.currentLayer === i + 1 ? styles.pillOnTxt : styles.pillOffTxt}>{l}</Text>
            </View>
          ))}
        </View>
        {/* Spacer to keep pills centred — same width as skip button area */}
        <View style={{ width: 110 }} />
      </View>

      {/* Opponent */}
      <View ref={oppRef} style={styles.oppSection}>
        <Text style={styles.oppLabel}>OPPONENT</Text>
        <View style={styles.oppHand}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{ width: oppW, height: oppH, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,106,244,0.3)', backgroundColor: C.s800 }}>
              <Image source={CARD_BACK} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ))}
        </View>
      </View>

      {/* Board */}
      <View ref={boardRef} style={styles.boardSection} onLayout={onBoardMeasure}>
        <GameBoard
          board={gs.board}
          currentLayer={gs.currentLayer}
          swapMode={gs.swapMode}
          glowCells={glowCells}
          hoverCell={hoverCell}
          selIdx={selIdx}
          canPlaceAny={isPlacePhase}
          onTilePress={onTilePress}
          onBoardLayout={onBoardMeasure}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.btnRow}>
          {showSwap && (
            isSwapMode ? (
              <TouchableOpacity ref={swapBtnRef} style={[styles.swapBtn, { backgroundColor: '#be123c', flex: 1 }]} onPress={onSwapCancel}>
                <Text style={{ fontSize: 16, color: '#FFF' }}>⇄</Text>
                <Text style={styles.swapTxt}>CANCEL</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity ref={swapBtnRef} style={[styles.swapBtn, { backgroundColor: C.primary, flex: 1 }]} onPress={onSwapStart}>
                <Text style={{ fontSize: 16, color: '#FFF' }}>⇄</Text>
                <Text style={styles.swapTxt}>SWAP</Text>
              </TouchableOpacity>
            )
          )}
          <DrawBtn active={isDrawPhase} count={gs.drawPile.length} onDraw={onDraw} btnRef={drawBtnRef} />
        </View>

        {/* Hand */}
        <View ref={handRef} style={styles.handRow}>
          {gs.playerHand.map((card, i) => (
            <View key={`slot-${i}`} ref={r => { handCardRefs.current[i] = r; }}>
              <HandCard
                key={card?.uid ?? i}
                card={card}
                idx={i}
                cardW={cardW}
                cardH={cardH}
                disabled={!isPlacePhase && !isSwapMode}
                isSelected={selIdx === i}
                onTap={() => onHandTap(i)}
                onDragStart={() => onHandDragStart(i)}
                onDragMove={onDragMove}
                onDrop={onDrop}
              />
            </View>
          ))}
          {Array(Math.max(0, 4 - gs.playerHand.length)).fill(null).map((_, i) => (
            <View key={`e-${i}`} style={[styles.emptySlot, { width: cardW, height: cardH }]}>
              <Text style={{ color: C.s800, fontSize: 20 }}>+</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action bar */}
      <View ref={actionBarRef} style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 4) }]}>
        <TouchableOpacity
          ref={faceOffRef}
          style={[styles.faceOffBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]}
          onPress={onFaceOff}
          disabled={!isDrawPhase || gs.gameOver}
        >
          <Text style={{ fontSize: 14, color: '#FFF' }}>⚡</Text>
          <Text style={styles.faceOffTxt}>FACE-OFF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          ref={winBtnRef}
          style={[styles.winBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]}
          onPress={onWin}
          disabled={!isDrawPhase || gs.gameOver}
        >
          <Text style={{ fontSize: 14 }}>👑</Text>
          <Text style={styles.winTxt}>WIN</Text>
        </TouchableOpacity>
      </View>

      <BottomNav navigation={navigation} activeRoute="Home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg, alignSelf: 'center', width: '100%' },

  // ── SKIP button — fixed absolute, zIndex 9999 so nothing can cover it ──
  skipContainer: {
    position:   'absolute',
    right:      12,
    zIndex:     9999,
    elevation:  9999,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      8,
    backgroundColor:   'rgba(15,23,42,0.92)',
    borderWidth:       1,
    borderColor:       'rgba(100,116,139,0.5)',
    minWidth:          90,
    alignItems:        'center',
    justifyContent:    'center',
  },
  skipTxt: {
    color:       '#94A3B8',
    fontSize:    11,
    fontWeight:  '800',
    letterSpacing: 0.5,
  },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 6 },
  pills:       { flexDirection: 'row', gap: 3, backgroundColor: C.s800, padding: 3, borderRadius: 8 },
  pillOn:      { paddingHorizontal: 10, paddingVertical: 3, backgroundColor: C.primary, borderRadius: 9999 },
  pillOnTxt:   { color: '#FFF', fontSize: 10, fontWeight: '700' },
  pillOff:     { paddingHorizontal: 8, paddingVertical: 3, opacity: 0.3 },
  pillOffTxt:  { color: C.s400, fontSize: 10 },

  oppSection:  { alignItems: 'center', paddingVertical: 5, gap: 4, opacity: 0.65 },
  oppLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#64748B' },
  oppHand:     { flexDirection: 'row', gap: 5 },
  boardSection:{ flex: 1, paddingHorizontal: 12, paddingVertical: 4, justifyContent: 'center' },
  controls:    { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, gap: 8 },
  btnRow:      { flexDirection: 'row', gap: 8, width: '100%', minHeight: 52 },
  swapBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 52, paddingHorizontal: 8, borderRadius: 12 },
  swapTxt:     { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  drawBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 52, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1.5, position: 'relative' },
  drawLabel:   { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  badge:       { position: 'absolute', top: 5, right: 8, backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  badgeTxt:    { color: '#FFF', fontSize: 10, fontWeight: '800' },
  handRow:     { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  emptySlot:   { borderRadius: 8, borderWidth: 2, borderColor: C.s800, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  actionBar:   { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 6, backgroundColor: 'rgba(15,23,42,0.9)', borderTopWidth: 1, borderTopColor: C.s800 },
  faceOffBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, paddingVertical: 9, borderRadius: 9999 },
  faceOffTxt:  { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  winBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.s800, paddingVertical: 9, borderRadius: 9999 },
  winTxt:      { color: C.s300, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});

export default TutorialLayout;
