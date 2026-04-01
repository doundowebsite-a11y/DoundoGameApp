/**
 * GameLayout.jsx — src/screens/layouts/GameLayout.jsx  (RESPONSIVE REFACTOR)
 *
 * Changes:
 * - Header padding → scale() / verticalScale()
 * - Pill sizes and font → scale() / scaleFont()
 * - Message bar font → scaleFont()
 * - Action bar buttons → verticalScale for height, scaleFont for text
 * - Empty slot border uses scale()
 * - Opponent section label → scaleFont()
 * - Swap banner padding → scale()
 */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Animated,
} from 'react-native';
import { DoundoLogo }    from '../../assets/logo/doundo_logo';
import BottomNav         from '../../components/ui/BottomNav';
import GameBoard         from '../../game/GameBoard';
import HandCard          from '../../game/HandCard';
import DealAnimation     from '../../game/DealAnimation';
import { useGlow }       from '../../game/GlowAnimator';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const C = {
  bg: '#101622', primary: '#256af4',
  s800: '#1E293B', s700: '#334155',
  s500: '#64748B', s400: '#94A3B8', s300: '#CBD5E1',
};

const CardBack = ({ style }) => (
  <View style={[{
    backgroundColor: C.s800, borderRadius: scale(5),
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,106,244,0.3)',
  }, style]}>
    <Image
      source={require('../../assets/icons/card_back.png')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    />
  </View>
);

const SwapButton = ({ isSwapMode, isPlacePhase, onSwap, onCancel }) => {
  const anim = useGlow(isPlacePhase && !isSwapMode);
  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.85] });
  if (isSwapMode) {
    return (
      <TouchableOpacity
        style={[styles.swapBtn, { backgroundColor: '#be123c', borderColor: '#be123c' }]}
        onPress={onCancel} activeOpacity={0.8}
      >
        <Text style={{ fontSize: scaleFont(18), color: '#FFF' }}>⇄</Text>
        <Text style={styles.swapBtnText}>Cancel Swap</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={onSwap} activeOpacity={0.8} style={{ flex: 1 }}>
      <Animated.View style={[
        styles.swapBtn,
        { backgroundColor: C.primary, borderColor: C.primary },
        isPlacePhase && {
          shadowColor: C.primary, shadowOpacity: so,
          shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8,
        },
      ]}>
        <Text style={{ fontSize: scaleFont(20), color: '#FFF' }}>⇄</Text>
        <Text style={styles.swapBtnText}>Swap Cards</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const DrawButton = ({ isDrawPhase, count, onDraw, innerRef }) => {
  const anim    = useGlow(isDrawPhase);
  const idleAnim = useRef(new Animated.Value(1)).current;
  const idleTimerRef = useRef(null);
  const idleLoopRef  = useRef(null);

  // After 10s of draw phase with no action, beat the card to attract user
  useEffect(() => {
    if (idleLoopRef.current) { idleLoopRef.current.stop(); idleAnim.setValue(1); }
    clearTimeout(idleTimerRef.current);
    if (!isDrawPhase) return;
    idleTimerRef.current = setTimeout(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(idleAnim, { toValue: 1.06, duration: 300, useNativeDriver: false }),
          Animated.timing(idleAnim, { toValue: 1.00, duration: 300, useNativeDriver: false }),
          Animated.timing(idleAnim, { toValue: 1.06, duration: 300, useNativeDriver: false }),
          Animated.timing(idleAnim, { toValue: 1.00, duration: 600, useNativeDriver: false }),
        ])
      );
      idleLoopRef.current = loop;
      loop.start();
    }, 10000);
    return () => {
      clearTimeout(idleTimerRef.current);
      if (idleLoopRef.current) { idleLoopRef.current.stop(); idleAnim.setValue(1); }
    };
  }, [isDrawPhase]);

  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.9] });
  return (
    <TouchableOpacity onPress={onDraw} activeOpacity={0.8} disabled={!isDrawPhase} style={{ flex: 1 }}>
      <Animated.View
        ref={innerRef}
        style={[
          styles.drawBtn,
          isDrawPhase
            ? { backgroundColor: C.s800, borderColor: C.primary, shadowColor: C.primary, shadowOpacity: so, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 }
            : { backgroundColor: 'rgba(30,41,59,0.5)', borderColor: C.s700, opacity: 0.5 },
          { transform: [{ scale: idleAnim }] },
        ]}
      >
        <View style={styles.drawIconWrap}>
          <View style={[styles.drawCardShadow, { top: scale(4), left: scale(4) }]} />
          <View style={[styles.drawCardShadow, { top: scale(2), left: scale(2) }]} />
          <CardBack style={styles.drawCardFront} />
          <View style={styles.drawCountBadge}>
            <Text style={styles.drawCountText}>{count}</Text>
          </View>
        </View>
        <Text style={[styles.drawBtnText, isDrawPhase && { color: C.primary }]}>Draw Card</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const FaceOffButton = ({ active, disabled, onPress }) => {
  const anim = useGlow(active);
  const so = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] });
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.8} style={{ flex: 1 }}>
      <Animated.View style={[
        styles.faceOffBtn,
        active && { shadowColor: C.primary, shadowOpacity: so, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
        disabled && { opacity: 0.4 },
      ]}>
        <Text style={{ fontSize: scaleFont(14), color: '#FFF' }}>⚡</Text>
        <Text style={styles.faceOffBtnText}>Face-Off</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const GameLayout = (props) => {
  const {
    navigation, insets, dims, containerW,
    gs, selIdx, showDeal, hoverCell,
    cardW, cardH, oppW, oppH,
    glowCells, glowReason,
    containerRef, boardRef, deckInnerRef, playerSlotRefs, oppSlotRefs,
    onBoardLayout, onContainerLayout, onMeasureSlot,
    dispatch, handleDragMove, handleDrop, handleTilePress,
    hints, isDrawPhase, isPlacePhase, isSwapMode, showSwap, showDrawBtn,
    containerLayout, playerSlotPos, oppSlotPos, deckLayout,
  } = props;

  return (
    <View
      ref={containerRef}
      style={[styles.container]}
      onLayout={onContainerLayout}
    >
      {showDeal && (
        <DealAnimation
          visible={showDeal}
          onComplete={props.onDealComplete}
          containerWidth={containerLayout?.width ?? containerW}
          containerHeight={containerLayout?.height ?? dims.height}
          containerPageX={containerLayout?.x ?? 0}
          containerPageY={containerLayout?.y ?? 0}
          playerSlots={playerSlotPos}
          opponentSlots={oppSlotPos}
          deckPosition={deckLayout}
          cardW={cardW}
          cardH={cardH}
        />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + scale(8) }]}>
        <View style={styles.headerLogo}>
          <DoundoLogo width={scale(80)} height={scale(21)} />
        </View>
        <View style={styles.levelPills}>
          {['L1', 'L2', 'L3'].map((l, i) => (
            <View key={l} style={gs.currentLayer === i + 1 ? styles.pillActive : styles.pillInactive}>
              <Text style={gs.currentLayer === i + 1 ? styles.pillActiveText : styles.pillInactiveText}>{l}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('SettingsScreen')}
          style={styles.gearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Message bar */}
      {!!gs.msg && (
        <View style={[styles.msg, gs.msgType === 'warn' && styles.msgWarn]}>
          <Text
            style={{ color: gs.msgType === 'warn' ? '#f87171' : C.primary, fontSize: scaleFont(11), textAlign: 'center' }}
            numberOfLines={1}
          >
            {gs.msg}
          </Text>
        </View>
      )}

      {/* Opponent hand */}
      <View style={[styles.opponentSection, showDeal && { opacity: 0 }]}>
        <Text style={styles.opponentLabel}>Opponent</Text>
        <View style={styles.opponentRow}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={`opp-slot-${i}`}
              ref={r => { oppSlotRefs.current[i] = r; }}
              onLayout={() => onMeasureSlot(oppSlotRefs.current[i], 'opp', i)}
              style={{ width: oppW, height: oppH }}
            >
              {gs.aiHand[i] && <CardBack style={{ width: '100%', height: '100%' }} />}
            </View>
          ))}
        </View>
      </View>

      {/* Board */}
      <View
        style={[styles.gridSection, showDeal && { opacity: 0 }]}
        ref={boardRef}
        onLayout={onBoardLayout}
      >
        <GameBoard
          board={gs.board}
          currentLayer={gs.currentLayer}
          swapMode={gs.swapMode}
          glowCells={glowCells}
          glowReason={glowReason}
          hoverCell={hoverCell}
          selIdx={selIdx}
          canPlaceAny={isPlacePhase}
          onTilePress={handleTilePress}
          onBoardLayout={onBoardLayout}
        />
      </View>

      {/* Interaction area */}
      <View style={[styles.interaction, showDeal && { opacity: 0 }]}>
        {gs.swapMode && (
          <View style={styles.swapBanner}>
            <Text style={styles.swapBannerText}>
              ⇄ SWAP — Step{' '}
              {gs.swapMode.step === 'pick_board' ? '1 of 3: Tap a board card to pick up'
                : gs.swapMode.step === 'pick_dest' ? '2 of 3: Tap where to send it'
                : '3 of 3: Tap hand card to place'}
            </Text>
          </View>
        )}

        <View style={styles.deckRow}>
          {showSwap && (
            <SwapButton
              isSwapMode={isSwapMode}
              isPlacePhase={isPlacePhase}
              onSwap={() => dispatch({ type: 'SWAP_START' })}
              onCancel={() => dispatch({ type: 'SWAP_CANCEL' })}
            />
          )}
          {showDrawBtn && (
            <DrawButton
              isDrawPhase={isDrawPhase}
              count={gs.drawPile.length}
              onDraw={() => dispatch({ type: 'DRAW_CARD' })}
              innerRef={deckInnerRef}
            />
          )}
        </View>

        {/* Player hand */}
        <View style={styles.handRow}>
          {gs.playerHand.map((card, i) => (
            <View
              key={`slot-${i}`}
              ref={r => { playerSlotRefs.current[i] = r; }}
              onLayout={() => onMeasureSlot(playerSlotRefs.current[i], 'player', i)}
            >
              <HandCard
                key={card?.uid ?? i}
                card={card}
                idx={i}
                cardW={cardW}
                cardH={cardH}
                disabled={!isPlacePhase && !isSwapMode}
                isSelected={selIdx === i}
                hintCount={hints[i]}
                onTap={() => props.onHandCardTap(i)}
                onDragStart={() => props.onHandCardDragStart(i)}
                onDragMove={handleDragMove}
                onDrop={handleDrop}
              />
            </View>
          ))}
          {Array(Math.max(0, 4 - gs.playerHand.length)).fill(null).map((_, i) => (
            <View key={`e-${i}`} style={[styles.emptySlot, { width: cardW, height: cardH }]}>
              <Text style={{ color: C.s800, fontSize: scaleFont(22) }}>+</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom action bar */}
      <View style={[styles.bottomNavActions, { paddingBottom: insets.bottom + scale(4) }]}>
        <FaceOffButton
          active={isDrawPhase}
          disabled={!isDrawPhase || gs.gameOver}
          onPress={() => dispatch({ type: 'FACE_OFF' })}
        />
        <TouchableOpacity
          style={[styles.winBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]}
          onPress={() => dispatch({ type: 'CALL_WIN' })}
          disabled={!isDrawPhase || gs.gameOver}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: scaleFont(14) }}>👑</Text>
          <Text style={styles.winBtnText}>WIN</Text>
        </TouchableOpacity>
      </View>

      <BottomNav navigation={navigation} activeRoute="Game" />
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg, alignSelf: 'center', width: '100%', overflow: 'visible' },
  gearBtn:        { width: scale(36), height: scale(36), alignItems: 'center', justifyContent: 'center' },
  gearIcon:       { fontSize: scaleFont(20) },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingBottom: scale(8) },
  headerLogo:     { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  levelPills:     { flexDirection: 'row', gap: scale(4), backgroundColor: C.s800, padding: scale(4), borderRadius: scale(8) },
  pillActive:     { paddingHorizontal: scale(14), paddingVertical: scale(4), backgroundColor: C.primary, borderRadius: 9999 },
  pillActiveText: { color: '#FFF', fontSize: scaleFont(10), fontWeight: '700' },
  pillInactive:   { paddingHorizontal: scale(10), paddingVertical: scale(4), opacity: 0.2 },
  pillInactiveText: { color: C.s400, fontSize: scaleFont(10), fontWeight: '700' },

  msg:     { backgroundColor: 'rgba(37,106,244,0.08)', paddingVertical: scale(3), paddingHorizontal: scale(16) },
  msgWarn: { backgroundColor: 'rgba(239,68,68,0.1)' },

  opponentSection: { alignItems: 'center', paddingVertical: scale(4), gap: scale(3), opacity: 0.6 },
  opponentLabel:   { fontSize: scaleFont(10), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2.5, color: C.s500 },
  opponentRow:     { flexDirection: 'row', gap: scale(4) },

  gridSection:  { flex: 1, paddingHorizontal: scale(12), paddingVertical: scale(4), justifyContent: 'center', overflow: 'visible' },
  interaction:  { paddingHorizontal: scale(12), paddingTop: scale(8), paddingBottom: scale(8), gap: scale(10), overflow: 'visible' },
  deckRow:      { flexDirection: 'row', alignItems: 'stretch', gap: scale(8), width: '100%', minHeight: verticalScale(52), overflow: 'visible' },

  swapBanner: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderWidth: 1, borderColor: '#FACC15',
    paddingVertical: scale(6), paddingHorizontal: scale(12),
    borderRadius: scale(8), alignSelf: 'stretch',
    marginBottom: scale(8), alignItems: 'center',
  },
  swapBannerText: { color: '#FACC15', fontWeight: '700', fontSize: scaleFont(12), letterSpacing: 0.5 },

  swapBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: scale(6), height: verticalScale(52), paddingHorizontal: scale(8),
    borderRadius: scale(12), borderWidth: 1,
  },
  swapBtnText: { color: '#FFF', fontSize: scaleFont(11), fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  drawBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: scale(8), height: verticalScale(52), paddingHorizontal: scale(8),
    borderRadius: scale(12), borderWidth: 1,
  },
  drawIconWrap:  { width: scale(28), height: scale(36), position: 'relative', flexShrink: 0 },
  drawCardShadow:{ position: 'absolute', width: scale(24), height: scale(32), borderRadius: scale(5), backgroundColor: C.s700 },
  drawCardFront: { position: 'absolute', top: 0, left: 0, width: scale(24), height: scale(32), borderRadius: scale(5) },
  drawCountBadge:{ position: 'absolute', bottom: -scale(6), left: scale(7), backgroundColor: C.primary, borderRadius: scale(8), paddingHorizontal: scale(6), paddingVertical: scale(1), minWidth: scale(22), alignItems: 'center' },
  drawCountText: { color: '#FFF', fontSize: scaleFont(10), fontWeight: '700' },
  drawBtnText:   { color: C.s400, fontSize: scaleFont(12), fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  handRow:    { flexDirection: 'row', justifyContent: 'center', gap: scale(6) },
  emptySlot:  { borderRadius: scale(8), borderWidth: 2, borderColor: C.s800, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },

  bottomNavActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: scale(12), paddingHorizontal: scale(16), paddingTop: scale(8), paddingBottom: scale(4),
    backgroundColor: 'rgba(15,23,42,0.8)', borderTopWidth: 1, borderTopColor: C.s800,
  },
  faceOffBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6), backgroundColor: C.primary, paddingVertical: verticalScale(9), borderRadius: 9999 },
  faceOffBtnText:{ color: '#FFF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontSize: scaleFont(13) },
  winBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6), backgroundColor: C.s800, paddingVertical: verticalScale(9), borderRadius: 9999 },
  winBtnText:    { color: C.s300, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontSize: scaleFont(13) },
});

export default GameLayout;
