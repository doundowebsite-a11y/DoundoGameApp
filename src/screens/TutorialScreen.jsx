/**
 * TutorialScreen.jsx — src/screens/TutorialScreen.jsx
 *
 * FIXES:
 * 1. Skip tutorial button — marks tutorial_completed = true in Supabase
 *    then navigates to Home. Uses the same Supabase update as the
 *    normal completion path.
 * 2. onTilePress now handles all 3 swap steps correctly:
 *    pick_board → SWAP_PICK_BOARD
 *    pick_dest  → SWAP_PICK_DEST
 *    pick_hand  → SWAP_PLACE_HAND
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeInitialState, buildDeck, shuffle } from '../game/engine/gameUtils';
import { gameReducer } from '../game/engine/gameReducer';
import { getBoardMetrics, useDimensions } from '../utils/responsive';
import { useGameGlow } from '../game/useGameGlow';
import { TUTORIAL_STEPS, STEP_COUNT } from '../tutorial/tutorialSteps';
import SoundManager from '../services/SoundManager';
import TutorialLayout from './layouts/TutorialLayout';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export default function TutorialScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dims   = useDimensions();
  const { containerW } = getBoardMetrics(dims.width);
  const { user, refreshProfile } = useAuth();

  const screenH = dims.height;
  const fixedH  = insets.top + 44 + 44 + 52 + 60 + 46 + insets.bottom + 24;
  const cardH   = Math.min(Math.max(70, screenH - fixedH - 240), 108);
  const cardW   = Math.max(56, Math.floor(cardH / 1.44));
  const oppW    = Math.floor(cardW * 0.48);
  const oppH    = Math.floor(cardH * 0.48);

  const [gs, setGs]               = useState(() => makeInitialState(shuffle(buildDeck())));
  const [selIdx, setSelIdx]       = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const { glowCells, setGlow, clearGlow } = useGameGlow();

  const boardRef     = useRef(null);
  const boardLayout  = useRef(null);
  const drawBtnRef   = useRef(null);
  const handRef      = useRef(null);
  const swapBtnRef   = useRef(null);
  const faceOffRef   = useRef(null);
  const winBtnRef    = useRef(null);
  const pillsRef     = useRef(null);
  const oppRef       = useRef(null);
  const actionBarRef = useRef(null);
  const handCardRefs = useRef([null, null, null, null]);

  const [stepIdx, setStepIdx]   = useState(0);
  const [shakeTooltip, setShake] = useState(false);
  const [spotlight, setSpotlight] = useState(null);
  const [handProps, setHandProps] = useState(null);
  const [skipping, setSkipping]   = useState(false);

  const step    = TUTORIAL_STEPS[stepIdx];
  const stepNum = stepIdx + 1;

  useEffect(() => {
    SoundManager.init();
    return () => SoundManager.cleanup();
  }, []);

  // ── Mark tutorial complete in Supabase ────────────────────────
  const markTutorialComplete = useCallback(async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('profiles')
        .update({ tutorial_completed: true })
        .eq('id', user.id);
      await refreshProfile?.();
    } catch (e) {
      console.warn('[tutorial] Failed to mark complete:', e);
    }
  }, [user, refreshProfile]);

  // ── Skip tutorial ─────────────────────────────────────────────
  const skipTutorial = useCallback(async () => {
    if (skipping) return;
    setSkipping(true);
    await markTutorialComplete();
    navigation.replace('Home');
  }, [skipping, markTutorialComplete, navigation]);

  // ── Normal advance (step by step) ─────────────────────────────
  const advance = useCallback(async () => {
    if (stepIdx >= TUTORIAL_STEPS.length - 1) {
      // Tutorial finished naturally
      await markTutorialComplete();
      navigation.replace('Home');
      return;
    }
    setStepIdx(i => i + 1);
    setShake(false);
  }, [stepIdx, navigation, markTutorialComplete]);

  useEffect(() => {
    if (!gs.overlay) return;
    const t = setTimeout(() => {
      setGs(makeInitialState(shuffle(buildDeck())));
      advance();
    }, 1000);
    return () => clearTimeout(t);
  }, [gs.overlay, advance]);

  useEffect(() => {
    if (step?.inject) {
      setGs(prev => ({ ...prev, ...step.inject(prev) }));
      setSelIdx(null);
      clearGlow();
    }
    setTimeout(() => measureStep(), 350);
  }, [stepIdx]);

  const measureStep = useCallback(() => {
    if (!step) return;
    const mRef = (ref) => new Promise(resolve => {
      ref?.current?.measure?.((x, y, w, h, px, py) => {
        if (px != null) resolve({ x: px, y: py, width: w, height: h });
        else resolve(null);
      });
    });
    const setFromRef = async (ref) => {
      const r = await mRef(ref);
      if (r) setSpotlight(r);
      return r;
    };

    const sp = step.spotlight;
    if (sp === 'none' || !sp) { setSpotlight(null); setHandProps(null); return; }

    if (sp === 'opp_section')    setFromRef(oppRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 2 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'pills')     setFromRef(pillsRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 2 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'board')     setFromRef(boardRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 2 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'hand')      setFromRef(handRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 4 - 20, targetY: r.y - 20, visible: true }));
    else if (sp === 'draw')      setFromRef(drawBtnRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 2 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'action_bar') setFromRef(actionBarRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 4 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'faceoff')   setFromRef(faceOffRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 2 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'win')       setFromRef(winBtnRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 2 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'swap')      setFromRef(swapBtnRef).then(r => r && setHandProps({ mode: 'tap', targetX: r.x + r.width / 2 - 20, targetY: r.y + r.height / 2 - 20, visible: true }));
    else if (sp === 'hand_and_board') {
      Promise.all([mRef(handRef), mRef(boardRef)]).then(([hr, br]) => {
        if (!hr || !br) return;
        const top    = Math.min(hr.y, br.y);
        const bottom = Math.max(hr.y + hr.height, br.y + br.height);
        setSpotlight({ x: br.x, y: top, width: br.width, height: bottom - top });
        if (step.handAnim === 'drag_hand_to_cell') {
          setHandProps({ mode: 'drag', fromX: hr.x + hr.width / 8, fromY: hr.y - 10, toX: br.x + br.width / 2 - 20, toY: br.y + br.height / 2 - 20, visible: true });
        } else {
          setHandProps({ mode: 'tap', targetX: hr.x + hr.width / 4 - 20, targetY: hr.y - 20, visible: true });
        }
      });
    }
  }, [step, stepIdx]);

  const dispatch = useCallback((action) => {
    setGs(prev => {
      const next = gameReducer(prev, action, 'easy', null);
      if (next.msgType === 'warn') Vibration.vibrate(80);
      if (action.type === 'PLACE_CARD' && !next.msg?.includes('❌')) {
        setGlow([{ r: action.r, c: action.c }], 'place');
        setSelIdx(null);
      }
      if (action.type === 'DRAW_CARD') clearGlow();
      return next;
    });

    if (step?.waitFor && action.type === step.waitFor) {
      // CALL_WIN and FACE_OFF advance is handled by overlay effect above
      if (action.type !== 'CALL_WIN' && action.type !== 'FACE_OFF') {
        setTimeout(advance, 500);
      }
    } else if (step?.waitFor && action.type !== step.waitFor) {
      setShake(s => !s);
    }
  }, [step, advance, setGlow, clearGlow]);

  const getCellFromPage = useCallback((mx, my) => {
    const bl = boardLayout.current;
    if (!bl) return null;
    const { pageX, pageY, width: bw, height: bh } = bl;
    if (mx < pageX || mx > pageX + bw || my < pageY || my > pageY + bh) return null;
    const { tileSize: ts, gap: g, tilePadding: tp } = getBoardMetrics(dims.width);
    const col = Math.floor((mx - pageX - tp) / (ts + g));
    const row = Math.floor((my - pageY - tp) / (ts + g));
    return (row >= 0 && row < 4 && col >= 0 && col < 4) ? { r: row, c: col } : null;
  }, [dims.width]);

  return (
    <TutorialLayout
      {...{
        navigation, insets, containerW, cardW, cardH, oppW, oppH,
        gs, selIdx, setSelIdx, hoverCell, glowCells,
        step, stepNum, spotlight, handProps, shakeTooltip,
        skipping,
        boardRef, drawBtnRef, handRef, swapBtnRef, faceOffRef, winBtnRef,
        pillsRef, oppRef, actionBarRef, handCardRefs,
        onBoardMeasure: () => boardRef.current?.measure((x, y, w, h, px, py) => {
          boardLayout.current = { pageX: px, pageY: py, width: w, height: h };
        }),
        // Skip navigates to Home and marks complete
        onSkip: skipTutorial,
        onDraw:       () => dispatch({ type: 'DRAW_CARD' }),
        onSwapStart:  () => dispatch({ type: 'SWAP_START' }),
        onSwapCancel: () => dispatch({ type: 'SWAP_CANCEL' }),
        onFaceOff:    () => dispatch({ type: 'FACE_OFF' }),
        onWin:        () => dispatch({ type: 'CALL_WIN' }),
        onHandTap: (i) => {
          if (gs.phase === 'place' || gs.swapMode) setSelIdx(p => p === i ? null : i);
        },
        onHandDragStart: (i) => {
          setSelIdx(i);
          boardRef.current?.measure((x, y, w, h, px, py) => {
            boardLayout.current = { pageX: px, pageY: py, width: w, height: h };
          });
        },
        onDragMove: (mx, my) => {
          const cell = getCellFromPage(mx, my);
          setHoverCell(cell
            ? { ...cell, valid: gs.board[cell.r][cell.c].length === gs.currentLayer - 1 }
            : null
          );
        },
        onDrop: (cardIdx, mx, my) => {
          setHoverCell(null);
          const cell = getCellFromPage(mx, my);
          if (!cell) return false;
          // Drag-drop during swap step 3 (pick_hand): place hand card at dropped cell
          if (gs.swapMode?.step === 'pick_hand') {
            dispatch({ type: 'SWAP_PLACE_HAND', cardIdx, r: cell.r, c: cell.c });
          } else {
            dispatch({ type: 'PLACE_CARD', cardIdx, r: cell.r, c: cell.c });
          }
          return true;
        },
        onTilePress: (r, c) => {
          const { swapMode, phase } = gs;
          if (swapMode?.step === 'pick_board') {
            dispatch({ type: 'SWAP_PICK_BOARD', r, c });
          } else if (swapMode?.step === 'pick_dest') {
            // FIX: was dispatching SWAP_PICK_DEST which was unhandled in old gameReducer
            dispatch({ type: 'SWAP_PICK_DEST', r, c });
          } else if (swapMode?.step === 'pick_hand') {
            // Tap on board during step 3 — place hand card at fromR,fromC (the vacated cell)
            if (selIdx !== null) {
              dispatch({ type: 'SWAP_PLACE_HAND', cardIdx: selIdx, r, c });
              setSelIdx(null);
            }
          } else if (phase === 'place' && selIdx !== null) {
            dispatch({ type: 'PLACE_CARD', cardIdx: selIdx, r, c });
            setSelIdx(null);
          }
        },
        onAdvance: advance,
      }}
    />
  );
}
