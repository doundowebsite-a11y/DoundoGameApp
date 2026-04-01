/**
 * GameScreen.jsx — src/screens/GameScreen.jsx
 * Logic-only component for the Solo Game Screen.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SoundManager      from '../services/SoundManager';
import {
  makeInitialState, buildDeck, shuffle,
  calculateHints,
} from '../game/engine/gameUtils';
import { gameReducer }   from '../game/engine/gameReducer';
import { runAiTurn }     from '../ai/aiLogic';
import { useAuth }       from '../context/AuthContext';
import { supabase }      from '../services/supabase';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { useGameGlow, detectBoardChanges }   from '../game/useGameGlow';

import GameLayout from './layouts/GameLayout';

export default function GameScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const dims   = useDimensions();
  const { containerW, tileSize } = getBoardMetrics(dims.width);
  const { profile, user, refreshProfile } = useAuth();
  const diff = route?.params?.difficulty ?? 'easy';

  const [gs, setGs]           = useState(() => makeInitialState(shuffle(buildDeck())));
  const [selIdx, setSelIdx]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const startTimeRef  = useRef(Date.now());
  const cardsPlayedRef = useRef(0);
  const [showDeal, setShowDeal] = useState(true);
  const [hoverCell, setHoverCell] = useState(null);

  const [containerLayout, setContainerLayout] = useState(null);
  const { glowCells, reason: glowReason, setGlow, clearGlow } = useGameGlow();

  // Layout refs
  const containerRef   = useRef(null);
  const boardRef       = useRef(null);
  const boardLayout    = useRef(null);
  const deckInnerRef   = useRef(null);
  const deckLayout     = useRef(null);
  const playerSlotRefs = useRef([null, null, null, null]);
  const playerSlotPos  = useRef([null, null, null, null]);
  const oppSlotRefs    = useRef([null, null, null, null]);
  const oppSlotPos     = useRef([null, null, null, null]);

  useEffect(() => { SoundManager.init(); return () => SoundManager.cleanup(); }, []);
  useEffect(() => { SoundManager.setEnabled(profile?.music_enabled !== false); }, [profile?.music_enabled]);

  // Responsive sizing constants
  const screenH      = dims.height;
  const safeTop      = insets.top;
  const safeBottom   = insets.bottom;
  const fixedH = (safeTop + 48) + 22 + 52 + 52 + 60 + (56 + safeBottom) + 24;
  const handAvailH   = Math.max(70, screenH - fixedH - 240);
  const cardH = Math.min(Math.floor(handAvailH), 110);
  const cardW = Math.max(56, Math.floor(cardH / 1.44));
  const oppW  = Math.floor(cardW * 0.48);
  const oppH  = Math.floor(cardH * 0.48);

  const measureSlot = useCallback((ref, type, i) => {
    ref?.measure?.((x, y, w, h, px, py) => {
      if (px > 0 || py > 0) {
        if (type === 'player') playerSlotPos.current[i] = { x: px, y: py, width: w, height: h };
        else oppSlotPos.current[i] = { x: px, y: py, width: w, height: h };
      }
    });
  }, []);

  const getCellFromPage = useCallback((mx, my) => {
    const bl = boardLayout.current;
    if (!bl) return null;
    const { pageX, pageY, width: bw, height: bh } = bl;
    if (mx < pageX || mx > pageX + bw || my < pageY || my > pageY + bh) return null;
    const { tileSize: ts, gap: g, tilePadding: tp } = getBoardMetrics(dims.width);
    const col = Math.floor((mx - pageX - tp) / (ts + g));
    const row = Math.floor((my - pageY - 4) / (ts + g));
    return (row >= 0 && row < 4 && col >= 0 && col < 4) ? { r: row, c: col } : null;
  }, [dims.width]);

  const handleDragMove = useCallback((mx, my) => {
    if (mx === null || my === null) { setHoverCell(null); return; }
    const cell = getCellFromPage(mx, my);
    if (!cell) { setHoverCell(null); return; }
    setHoverCell({ ...cell, valid: gs.board[cell.r][cell.c].length === gs.currentLayer - 1 });
  }, [getCellFromPage, gs.board, gs.currentLayer]);

  const dispatch = useCallback((action) => {
    if (action.type === 'DRAW_CARD') SoundManager.playCardPick?.();
    else if (action.type?.startsWith('SWAP')) SoundManager.playSwap?.();
    else if (['FACE_OFF', 'CALL_WIN'].includes(action.type)) SoundManager.playButton?.();

    setGs(prev => {
      const next = gameReducer(prev, action, diff, profile);
      if (next.msgType === 'warn' && profile?.vibration_enabled !== false) Vibration.vibrate(100);
      
      if (action.type === 'CALL_WIN' && next.overlay?.winner === 'player') {
        const wr = next.winRow;
        if (wr) {
          const cells = wr.isCol ? [0,1,2,3].map(r => ({ r, c: wr.c })) : [0,1,2,3].map(c => ({ r: wr.r, c }));
          setGlow(cells, 'swap');
          setTimeout(() => setGs(p => ({ ...p, overlay: next.overlay })), 400);
          return { ...next, overlay: null };
        }
      }

      if (action.type === 'PLACE_CARD' && !next.msg?.includes('❌')) {
        if (profile?.vibration_enabled !== false) Vibration.vibrate(40);
        setGlow([{ r: action.r, c: action.c }], 'place');
        setSelIdx(null);
        cardsPlayedRef.current += 1;
      }
      if (action.type === 'FACE_OFF' || action.type === 'CALL_WIN') {
        if (profile?.vibration_enabled !== false) Vibration.vibrate([0, 80, 40, 80]);
      }
      if (action.type === 'SWAP_PLACE_HAND' && !next.swapMode) {
        const { fromR, fromC, toR, toC } = prev.swapMode ?? {};
        if (fromR !== undefined) {
          setGlow([{ r: fromR, c: fromC }, { r: toR, c: toC }], 'swap');
          SoundManager.playSwap?.();
        }
        setSelIdx(null);
        cardsPlayedRef.current += 1;
      }
      if (action.type === 'DRAW_CARD') clearGlow();
      return next;
    });
  }, [diff, profile, setGlow, clearGlow]);

  useEffect(() => {
    if (gs.phase !== 'ai' || gs.gameOver || gs.overlay) return;
    const t = setTimeout(() => {
      setGs(prev => {
        const next = runAiTurn(prev, diff, profile);
        const { changed, isSwap } = detectBoardChanges(prev.board, next.board);
        if (changed.length) setGlow(changed, isSwap ? 'swap' : 'ai');
        return next;
      });
    }, 950);
    return () => clearTimeout(t);
  }, [gs.phase, gs.gameOver, gs.overlay, diff, profile, setGlow]);

  useEffect(() => {
    if (!gs.overlay) return;
    if (gs.overlay.type === 'faceoff') {
      const foElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const mm = String(Math.floor(foElapsed / 60)).padStart(2, '0');
      const ss = String(foElapsed % 60).padStart(2, '0');
      navigation.navigate('FaceOff', { overlay: gs.overlay, gs, totalCards: cardsPlayedRef.current, time: `${mm}:${ss}` });
      setGs(p => ({ ...p, overlay: null }));
      return;
    }
    if (gs.overlay.winner === 'player' || gs.overlay.type === 'win') SoundManager.playWin?.();
    else if (gs.overlay.winner === 'ai') SoundManager.playLose?.();
    else SoundManager.playDrawMatch?.();
  }, [gs.overlay]);

  const handleMatchEnd = useCallback(async () => {
    if (saving || !user?.id) return;
    const winner = gs.overlay?.winner || (gs.overlay?.type === 'win' ? gs.overlay?.who : (gs.overlay?.type === 'tie' ? 'tie' : null));
    if (!winner) return;

    const wonMatch  = winner === 'player';
    const lostMatch = winner === 'ai';
    const drawnMatch = winner === 'tie' || (gs.pScore === gs.aScore && gs.pScore >= 500);
    const matchEnded = gs.pScore >= 500 || gs.aScore >= 500 || gs.overlay?.type === 'tie' || gs.gameOver;
    const mult = diff === 'ai' ? 3 : diff === 'hard' ? 2 : diff === 'medium' ? 1.5 : 1;
    const pts = Math.floor(gs.pScore * mult);
    
    setSaving(true);
    try {
        const session = (await supabase.auth.getSession()).data.session;
        await supabase.functions.invoke('process_match_result', { body: { matchPoints: pts, wonGame: wonMatch, lostGame: lostMatch, matchEnded: matchEnded, addFaceOff: gs.overlay?.type === 'faceoff' }, headers: { Authorization: `Bearer ${session?.access_token}` } });
        await refreshProfile?.();
    } catch {}
    setSaving(false);

    const elapsedSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const mm = String(Math.floor(elapsedSecs / 60)).padStart(2, '0');
    const ss = String(elapsedSecs % 60).padStart(2, '0');
    const navParams = { points: pts, totalCards: cardsPlayedRef.current, time: `${mm}:${ss}`, isRoundOnly: !matchEnded };

    if (drawnMatch) navigation.replace('DrawScreen', navParams);
    else if (wonMatch) navigation.replace('WinScreen', navParams);
    else if (lostMatch) navigation.replace('LoseScreen', navParams);
  }, [gs, diff, user, profile, refreshProfile, navigation, saving]);

  useEffect(() => { if (gs?.overlay && gs.overlay.type !== 'faceoff') handleMatchEnd(); }, [gs?.overlay]);

  const handleNextRound = useCallback(() => {
    startTimeRef.current  = Date.now();
    cardsPlayedRef.current = 0;
    const deck = shuffle(buildDeck());
    setGs(prev => ({
      ...prev, board: Array(4).fill(null).map(() => Array(4).fill(null).map(() => [])),
      drawPile: deck.slice(8), playerHand: deck.slice(0, 4), aiHand: deck.slice(4, 8),
      phase: 'draw', round: (prev.round || 1) + 1, msg: '', msgType: 'info', gameOver: false, winRow: null,
      currentLayer: 1, layerJustChanged: false, swapMode: null, overlay: null,
    }));
    clearGlow(); setSelIdx(null); setHoverCell(null); setShowDeal(true);
  }, [clearGlow]);

  useEffect(() => {
    if (route.params?.triggerNextRound) { navigation.setParams({ triggerNextRound: undefined }); handleNextRound(); }
  }, [route.params?.triggerNextRound]);

  const handleDrop = useCallback((cardIdx, mx, my) => {
    setHoverCell(null);
    if (gs.phase !== 'place' && !gs.swapMode) return false;
    const cell = getCellFromPage(mx, my);
    if (!cell) return false;
    if (gs.swapMode?.step === 'pick_hand') dispatch({ type: 'SWAP_PLACE_HAND', cardIdx, r: cell.r, c: cell.c });
    else dispatch({ type: 'PLACE_CARD', cardIdx, r: cell.r, c: cell.c });
    return true;
  }, [gs.phase, gs.swapMode, getCellFromPage, dispatch]);

  const handleTilePress = useCallback((r, c) => {
    SoundManager.playButton?.();
    const { swapMode, phase } = gs;
    if (swapMode?.step === 'pick_board') dispatch({ type: 'SWAP_PICK_BOARD', r, c });
    else if (swapMode?.step === 'pick_dest') dispatch({ type: 'SWAP_PICK_DEST', r, c });
    else if (swapMode?.step === 'pick_hand' && selIdx !== null) { dispatch({ type: 'SWAP_PLACE_HAND', cardIdx: selIdx, r, c }); setSelIdx(null); }
    else if (phase === 'place' && selIdx !== null) { if (gs.board[r][c].length !== gs.currentLayer - 1 && profile?.vibration_enabled !== false) Vibration.vibrate(80); dispatch({ type: 'PLACE_CARD', cardIdx: selIdx, r, c }); setSelIdx(null); }
  }, [gs, selIdx, dispatch]);

  const onHandCardTap = (i) => { if (gs.phase === 'place' || gs.swapMode) { SoundManager.playCardPick?.(); setSelIdx(p => p === i ? null : i); } };
  const onHandCardDragStart = (i) => { setSelIdx(i); boardRef.current?.measure((x, y, w, h, px, py) => { boardLayout.current = { pageX: px, pageY: py, width: w, height: h }; }); };

  useEffect(() => { if (gs.phase === 'draw' && !gs.gameOver && !gs.overlay && profile?.vibration_enabled !== false) Vibration.vibrate(120); }, [gs.phase, profile?.vibration_enabled]);

  return (
    <GameLayout
      {...{
        navigation, insets, dims, containerW,
        gs, selIdx, setSelIdx, showDeal, setShowDeal, hoverCell,
        cardW, cardH, oppW, oppH,
        glowCells, glowReason,
        containerRef, boardRef, deckInnerRef, playerSlotRefs, oppSlotRefs,
        onBoardLayout: (l) => { boardLayout.current = l; },
        onContainerLayout: () => { containerRef.current?.measure((x,y,w,h,px,py) => setContainerLayout({ x: px, y: py, width: w, height: h })); },
        onMeasureSlot: (ref, type, i) => measureSlot(ref, type, i),
        onDealComplete: () => setShowDeal(false),
        onHandCardTap, onHandCardDragStart,
        dispatch, handleDragMove, handleDrop, handleTilePress,
        hints: calculateHints(gs.playerHand, gs.board, gs.currentLayer),
        isDrawPhase: gs.phase === 'draw' && !gs.gameOver,
        isPlacePhase: gs.phase === 'place' && !gs.gameOver,
        isSwapMode: !!gs.swapMode,
        showSwap: gs.phase === 'place' || !!gs.swapMode,
        showDrawBtn: !gs.swapMode,
        containerLayout, playerSlotPos: playerSlotPos.current, oppSlotPos: oppSlotPos.current, deckLayout: deckLayout.current
      }}
    />
  );
}
