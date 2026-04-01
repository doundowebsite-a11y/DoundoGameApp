import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { DoundoLogo }  from '../../assets/logo/doundo_logo';
import BottomNav       from '../../components/ui/BottomNav';
import GameBoard       from '../../game/GameBoard';
import HandCard        from '../../game/HandCard';
import { scale, verticalScale, scaleFont } from '../../utils/scale';

const CARD_BACK = require('../../assets/icons/card_back.png');
const CardBack  = ({ style }) => (
  <View style={[{ backgroundColor: '#1E293B', borderRadius: scale(5), overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,106,244,0.3)' }, style]}>
    <Image source={CARD_BACK} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
  </View>
);

const AVATARS = { 1: require('../../assets/avatars/preset_1.jpg'), 2: require('../../assets/avatars/preset_2.jpg'), 3: require('../../assets/avatars/preset_3.jpg'), 4: require('../../assets/avatars/preset_4.jpg'), 5: require('../../assets/avatars/avatar_main.jpg'), 6: require('../../assets/avatars/preset_2.jpg') };
const getAvatar = p => AVATARS[p] ?? AVATARS[1];
const C = { bg: '#101622', primary: '#256af4', s800: '#1E293B', s700: '#334155', s500: '#64748B', s400: '#94A3B8', s300: '#CBD5E1' };

const SimpleDealAnimation = ({ onComplete, SoundManager }) => {
  const cards = useRef(Array.from({ length: 8 }, () => ({ x: new Animated.Value(0), y: new Animated.Value(0), op: new Animated.Value(0), rot: new Animated.Value(0) }))).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    SoundManager?.playShuffle?.();
    const destinations = [{ x: -108, y: -110 }, { x: -36, y: -110 }, { x: 36, y: -110 }, { x: 108, y: -110 }, { x: -108, y: 110 }, { x: -36, y: 110 }, { x: 36, y: 110 }, { x: 108, y: 110 }];
    const appear   = cards.map((c, i) => Animated.timing(c.op, { toValue: 1, duration: 80, delay: i * 20, useNativeDriver: true }));
    const spread   = cards.map((c, i) => Animated.parallel([Animated.timing(c.x, { toValue: (i - 3.5) * 10, duration: 200, useNativeDriver: true }), Animated.timing(c.rot, { toValue: (i - 3.5) * 4, duration: 200, useNativeDriver: true })]));
    const collapse = cards.map(c => Animated.parallel([Animated.timing(c.x, { toValue: 0, duration: 180, useNativeDriver: true }), Animated.timing(c.rot, { toValue: 0, duration: 180, useNativeDriver: true })]));
    const deal     = cards.map((c, i) => Animated.parallel([Animated.spring(c.x, { toValue: destinations[i].x, friction: 7, tension: 60, delay: i * 70, useNativeDriver: true }), Animated.spring(c.y, { toValue: destinations[i].y, friction: 7, tension: 60, delay: i * 70, useNativeDriver: true })]));
    Animated.sequence([Animated.stagger(20, appear), Animated.delay(100), Animated.parallel(spread), Animated.delay(120), Animated.parallel(collapse), Animated.delay(80), Animated.parallel(deal), Animated.delay(400), Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true })]).start(() => onComplete?.());
  }, []);
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeOut, zIndex: 200, backgroundColor: 'rgba(5,9,20,0.96)', alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      {cards.map((c, i) => { const rot = c.rot.interpolate({ inputRange: [-180, 180], outputRange: ['-180deg', '180deg'] }); return (<Animated.View key={i} style={{ position: 'absolute', width: scale(46), height: scale(66), borderRadius: scale(6), overflow: 'hidden', backgroundColor: '#1a2744', borderWidth: 1, borderColor: 'rgba(37,106,244,0.4)', opacity: c.op, transform: [{ translateX: c.x }, { translateY: c.y }, { rotate: rot }] }}><Image source={CARD_BACK} style={{ width: '100%', height: '100%' }} resizeMode="cover" /></Animated.View>); })}
    </Animated.View>
  );
};

const CoinFlip = ({ myName, oppName, iGoFirst, onDone }) => {
  const sc = useRef(new Animated.Value(0.4)).current;
  const op = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([Animated.parallel([Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }), Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true })]), Animated.delay(400), Animated.timing(tx, { toValue: 1, duration: 350, useNativeDriver: true }), Animated.delay(1800), Animated.parallel([Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.timing(tx, { toValue: 0, duration: 400, useNativeDriver: true })])]).start(() => onDone?.());
  }, []);
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 199, backgroundColor: 'rgba(5,9,20,0.95)', alignItems: 'center', justifyContent: 'center', gap: scale(20) }]}>
      <Animated.Text style={{ fontSize: scaleFont(60), opacity: op, transform: [{ scale: sc }] }}>🪙</Animated.Text>
      <Animated.View style={{ opacity: tx, alignItems: 'center', gap: scale(10) }}>
        <Text style={{ color: '#FFF', fontSize: scaleFont(24), fontWeight: '900', textAlign: 'center' }}>{iGoFirst ? `${myName} goes first!` : `${oppName} goes first!`}</Text>
        <Text style={{ color: C.s500, fontSize: scaleFont(13), letterSpacing: 1 }}>{iGoFirst ? 'Draw a card to begin' : 'Waiting for opponent…'}</Text>
      </Animated.View>
    </View>
  );
};

const IntroSequence = ({ myName, oppName, iGoFirst, onDone, SoundManager }) => {
  const [phase, setPhase] = useState('deal');
  if (phase === 'deal') return <SimpleDealAnimation onComplete={() => setPhase('coin')} SoundManager={SoundManager} />;
  if (phase === 'coin') return <CoinFlip myName={myName} oppName={oppName} iGoFirst={iGoFirst} onDone={() => { setPhase('done'); onDone?.(); }} />;
  return null;
};

const TurnBanner = ({ isMyTurn, myName, oppName }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isMyTurn) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.025, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(pulse, { toValue: 1.000, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [isMyTurn]);
  return (
    <Animated.View style={[s.turnBanner, isMyTurn ? s.turnMy : s.turnOpp, { transform: [{ scale: pulse }] }]}>
      <Text style={[s.turnTxt, { color: isMyTurn ? '#60a5fa' : C.s500 }]}>{isMyTurn ? `⚡  ${myName}'s Turn` : `⏳  ${oppName} is playing…`}</Text>
    </Animated.View>
  );
};

const TimerBar = ({ secs, label }) => {
  const pct   = Math.max(0, ((45 - secs) / 45) * 100);
  const color = secs >= 35 ? '#f87171' : secs >= 20 ? '#FACC15' : '#22C55E';
  return (
    <View style={s.timerRow}>
      <Text style={[s.timerLabel, { color }]}>{label}</Text>
      <View style={s.timerBg}><View style={[s.timerFill, { width: `${pct}%`, backgroundColor: color }]} /></View>
      <Text style={[s.timerNum, { color }]}>{Math.max(0, 45 - secs)}s</Text>
    </View>
  );
};

const PlayerStrip = ({ username, avatarPreset, score, isMe, isActive }) => (
  <View style={s.strip}>
    <View style={[s.stripAv, { borderColor: isActive ? C.primary : C.s700 }]}>
      <Image source={getAvatar(avatarPreset)} style={{ width: '100%', height: '100%' }} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.stripName} numberOfLines={1}>{username}{isMe ? ' (You)' : ''}</Text>
      <Text style={s.stripScore}>{score ?? 0} pts</Text>
    </View>
    {isActive && <View style={s.activeDot} />}
  </View>
);

const StatusBadge = ({ connStatus, isBotGame }) => {
  const ok   = connStatus === 'connected' || isBotGame;
  const text = isBotGame ? 'BOT' : connStatus === 'reconnecting' ? 'RECONNECTING' : ok ? 'LIVE' : 'CONNECTING';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(4), backgroundColor: ok ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: ok ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.3)', paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(20) }}>
      <View style={{ width: scale(6), height: scale(6), borderRadius: scale(3), backgroundColor: ok ? '#22C55E' : '#FBBF24' }} />
      <Text style={{ color: ok ? '#22C55E' : '#FBBF24', fontSize: scaleFont(9), fontWeight: '800', letterSpacing: 1 }}>{text}</Text>
    </View>
  );
};

const RoundWinOverlay = ({ overlay, myName, oppName, onNext }) => {
  const won = overlay.winner === 'player';
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 900, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', gap: scale(16), paddingHorizontal: scale(28) }]}>
      <Text style={{ color: won ? '#4ADE80' : '#f87171', fontSize: scaleFont(34), fontWeight: '900', textAlign: 'center' }}>{won ? '🏆 YOU WIN!' : `🎯 ${oppName} Wins!`}</Text>
      {overlay.matchText && <Text style={{ color: '#4ADE80', fontSize: scaleFont(20), fontWeight: '700' }}>{overlay.matchText}</Text>}
      <TouchableOpacity style={s.foOverlayBtn} onPress={onNext}>
        <Text style={s.foOverlayBtnTxt}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function MultiplayerGameLayout(props) {
  const { navigation, insets, containerW, gs, isMyTurnFinal, isPlayer1, connectionStatus, inactiveSecs, myName, myAvatar, oppName, oppAv, oppW, oppH, showIntro, setShowIntro, activeOverlay, onNextRound, doDispatch, selIdx, setSelIdx, hoverCell, handleDragMove, handleDrop, handleTilePress, glowCells, glowReason, SoundManager } = props;
  const isDrawPhase  = gs.phase === 'draw'  && isMyTurnFinal;
  const isPlacePhase = gs.phase === 'place' && isMyTurnFinal;
  const isSwapMode   = !!gs.swapMode && isMyTurnFinal;

  return (
    <View style={[s.container]}>
      {showIntro    && <IntroSequence myName={myName} oppName={oppName} iGoFirst={isPlayer1} onDone={() => setShowIntro(false)} SoundManager={SoundManager} />}
      {activeOverlay && <RoundWinOverlay overlay={activeOverlay} myName={myName} oppName={oppName} onNext={onNextRound} />}

      <View style={[s.header, { paddingTop: insets.top + scale(6) }]}>
        <DoundoLogo width={scale(80)} height={scale(21)} />
        <StatusBadge connStatus={connectionStatus} isBotGame={props.isBotGame} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
          <View style={s.pills}>
            {['L1','L2','L3'].map((l, i) => (
              <View key={l} style={gs.currentLayer === i+1 ? s.pillOn : s.pillOff}>
                <Text style={gs.currentLayer === i+1 ? s.pillOnTxt : s.pillOffTxt}>{l}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')} style={s.settingsBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PlayerStrip username={oppName} avatarPreset={oppAv} score={gs.aScore} isMe={false} isActive={!isMyTurnFinal} />
      {!isMyTurnFinal && <TimerBar label="⏳ OPP" secs={inactiveSecs} />}

      <View style={s.oppHand}>
        {[0,1,2,3].map(i => (
          <View key={i} style={{ width: oppW, height: oppH, borderRadius: scale(5), overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(37,106,244,0.3)', backgroundColor: '#1E293B' }}>
            <Image source={CARD_BACK} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ))}
      </View>

      <TurnBanner isMyTurn={isMyTurnFinal} myName={myName} oppName={oppName} />

      <View style={s.boardSection}>
        <GameBoard board={gs.board} currentLayer={gs.currentLayer} swapMode={gs.swapMode} glowCells={glowCells} glowReason={glowReason} hoverCell={hoverCell} selIdx={selIdx} canPlaceAny={isPlacePhase} onTilePress={handleTilePress} onBoardLayout={props.onBoardLayout} />
      </View>

      <View style={s.controls}>
        <View style={s.btnRow}>
          {(isPlacePhase || isSwapMode) && (
            <TouchableOpacity style={[s.swapBtn, isSwapMode ? { backgroundColor: '#be123c' } : { backgroundColor: C.primary }]} onPress={isSwapMode ? () => doDispatch({ type: 'SWAP_CANCEL' }) : () => doDispatch({ type: 'SWAP_START' })}>
              <Text style={{ fontSize: scaleFont(18), color: '#FFF' }}>⇄</Text>
              <Text style={s.swapTxt}>{isSwapMode ? 'CANCEL' : 'SWAP'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => doDispatch({ type: 'DRAW_CARD' })} disabled={!isDrawPhase} style={{ flex: 1 }}>
            <View style={[s.drawBtn, isDrawPhase ? { backgroundColor: C.primary, borderColor: 'rgba(255,255,255,0.2)' } : { opacity: 0.4, backgroundColor: C.s800, borderColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={{ fontSize: scaleFont(18), color: '#FFF' }}>🃏</Text>
              <Text style={s.drawLabel}>DRAW CARD</Text>
              <View style={s.drawBadge}><Text style={s.drawBadgeTxt}>{gs.drawPile?.length || 0}</Text></View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={s.handRow}>
          {(gs.playerHand || []).map((card, i) => (
            <HandCard key={card?.uid ?? i} card={card} idx={i} cardW={props.cardW} cardH={props.cardH} disabled={!isPlacePhase && !isSwapMode} isSelected={selIdx === i} onTap={() => { if (!isPlacePhase && !isSwapMode) return; setSelIdx(p => p === i ? null : i); }} onDragStart={() => setSelIdx(i)} onDragMove={handleDragMove} onDrop={handleDrop} />
          ))}
        </View>

        {isMyTurnFinal && <TimerBar label="⏱ YOU" secs={inactiveSecs} />}
        <PlayerStrip username={myName} avatarPreset={myAvatar} score={gs.pScore} isMe isActive={isMyTurnFinal} />
      </View>

      <View style={[s.actionBar, { paddingBottom: Math.max(insets.bottom, scale(12)) }]}>
        <TouchableOpacity style={[s.faceOffBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]} onPress={() => doDispatch({ type: 'FACE_OFF' })} disabled={!isDrawPhase || gs.gameOver}>
          <Text style={{ fontSize: scaleFont(18), color: '#FFF', marginRight: scale(8) }}>⚡</Text>
          <Text style={s.faceOffTxt}>FACE-OFF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.winBtn, (!isDrawPhase || gs.gameOver) && { opacity: 0.4 }]} onPress={() => doDispatch({ type: 'CALL_WIN' })} disabled={!isDrawPhase || gs.gameOver}>
          <Text style={{ fontSize: scaleFont(18), marginRight: scale(8) }}>👑</Text>
          <Text style={s.winTxt}>WIN GAME</Text>
        </TouchableOpacity>
      </View>

      <BottomNav navigation={navigation} activeRoute="Game" />
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg, alignSelf: 'center', width: '100%', position: 'relative' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingBottom: scale(6), gap: scale(8) },
  pills:          { flexDirection: 'row', gap: scale(3), backgroundColor: C.s800, padding: scale(3), borderRadius: scale(8) },
  pillOn:         { paddingHorizontal: scale(10), paddingVertical: scale(3), backgroundColor: C.primary, borderRadius: 9999 },
  pillOnTxt:      { color: '#FFF', fontSize: scaleFont(10), fontWeight: '700' },
  pillOff:        { paddingHorizontal: scale(8), paddingVertical: scale(3), opacity: 0.2 },
  pillOffTxt:     { color: C.s400, fontSize: scaleFont(10), fontWeight: '700' },
  settingsBtn:    { padding: scale(4) },
  settingsIcon:   { fontSize: scaleFont(18), opacity: 0.7 },
  oppHand:        { flexDirection: 'row', justifyContent: 'center', gap: scale(5), paddingVertical: verticalScale(4), opacity: 0.7 },
  boardSection:   { flex: 1, width: '100%', alignItems: 'center' },
  controls:       { paddingHorizontal: scale(16), paddingBottom: verticalScale(8), gap: scale(8) },
  btnRow:         { flexDirection: 'row', gap: scale(12), alignSelf: 'stretch', width: '100%', marginBottom: verticalScale(10) },
  swapBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8), paddingVertical: verticalScale(16), borderRadius: scale(14) },
  swapTxt:        { color: '#FFF', fontSize: scaleFont(14), fontWeight: '900', letterSpacing: 1 },
  drawBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(8), paddingVertical: verticalScale(16), borderRadius: scale(14), borderWidth: 1.5 },
  drawLabel:      { color: '#FFF', fontSize: scaleFont(14), fontWeight: '900', letterSpacing: 1.5 },
  drawBadge:      { backgroundColor: C.primary, borderRadius: scale(8), paddingHorizontal: scale(5), marginLeft: scale(4) },
  drawBadgeTxt:   { color: '#FFF', fontSize: scaleFont(10), fontWeight: '800' },
  handRow:        { flexDirection: 'row', justifyContent: 'center', gap: scale(8), marginVertical: verticalScale(6) },
  strip:          { flexDirection: 'row', alignItems: 'center', gap: scale(10), paddingHorizontal: scale(16), paddingVertical: verticalScale(5) },
  stripAv:        { width: scale(34), height: scale(34), borderRadius: scale(17), borderWidth: 2, overflow: 'hidden' },
  stripName:      { color: '#FFF', fontSize: scaleFont(13), fontWeight: '700' },
  stripScore:     { color: C.s500, fontSize: scaleFont(11) },
  activeDot:      { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: '#22C55E' },
  timerRow:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: scale(16), marginVertical: verticalScale(2), gap: scale(8) },
  timerLabel:     { fontSize: scaleFont(9), fontWeight: '800', letterSpacing: 1, minWidth: scale(48) },
  timerBg:        { flex: 1, height: verticalScale(4), backgroundColor: '#1E293B', borderRadius: scale(2), overflow: 'hidden' },
  timerFill:      { height: '100%', borderRadius: scale(2) },
  timerNum:       { fontSize: scaleFont(11), fontWeight: '800', minWidth: scale(30), textAlign: 'right' },
  turnBanner:     { marginHorizontal: scale(16), marginBottom: verticalScale(4), paddingVertical: verticalScale(7), paddingHorizontal: scale(14), borderRadius: scale(10), alignItems: 'center' },
  turnMy:         { backgroundColor: 'rgba(37,106,244,0.15)', borderWidth: 1, borderColor: 'rgba(37,106,244,0.4)' },
  turnOpp:        { backgroundColor: 'rgba(100,116,139,0.1)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  turnTxt:        { fontSize: scaleFont(13), fontWeight: '800', letterSpacing: 0.5 },
  actionBar:      { flexDirection: 'row', gap: scale(14), paddingHorizontal: scale(20), paddingTop: verticalScale(10), backgroundColor: 'rgba(15,23,42,0.9)', borderTopWidth: 1, borderTopColor: C.s800 },
  faceOffBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, paddingVertical: verticalScale(16), borderRadius: scale(14) },
  faceOffTxt:     { color: '#FFF', fontWeight: '900', fontSize: scaleFont(14), letterSpacing: 1.5 },
  winBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.s800, paddingVertical: verticalScale(16), borderRadius: scale(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  winTxt:         { color: '#FFF', fontWeight: '900', fontSize: scaleFont(14), letterSpacing: 1.5 },
  foOverlayBtn:   { backgroundColor: C.primary, paddingVertical: verticalScale(14), paddingHorizontal: scale(48), borderRadius: 9999 },
  foOverlayBtnTxt:{ color: '#FFF', fontWeight: '900', fontSize: scaleFont(15), letterSpacing: 3 },
});