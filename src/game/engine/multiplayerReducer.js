/**
 * multiplayerReducer.js — src/game/engine/multiplayerReducer.js
 *
 * FIXES IN THIS VERSION:
 *
 * FIX 1 — Opponent swap aligned with new 3-step swap in gameReducer.
 *   SWAP_PICK_BOARD now advances to step:'pick_dest' (not 'pick_hand').
 *   opponentSwapMode tracks the opponent's swap state through all 3 steps.
 *   translateAction maps SWAP_PICK_DEST correctly (no longer an alias —
 *   it's a real step now that gameReducer handles it).
 *   swapSidesForAction injects opponentSwapMode as the active swapMode
 *   so gameReducer sees the right state for each opponent step.
 *
 * FIX 2 — CALL_WIN overlay winner field always set ('player' not just 'who').
 *
 * FIX 3 — FACE_OFF overlay winner field always set on both outcomes.
 */
import { gameReducer } from './gameReducer';
import {
  countMatches,
  getBoardLines,
  checkMatch,
  isCurrentLayerFull,
} from './gameUtils';

const PTS = {
  solo: { L1: 100, L2: 200, L3: 300, faceoffWin: 200, faceoffLoss: 100 },
  mp:   { L1: 150, L2: 300, L3: 500, faceoffWin: 350, faceoffLoss: 150 },
};
function pts(profile, key) {
  return (profile?.isMultiplayer ? PTS.mp : PTS.solo)[key];
}

export function multiplayerReducer(gs, action, isMyMove, profile) {
  if (!gs) return gs;
  if (action.type === 'NEXT_ROUND') {
    // Reset board state for next round with the new deck
    const deck = action.deck || [];
    const p1Hand = deck.slice(0, 4);
    const p2Hand = deck.slice(4, 8);
    const drawPile = deck.slice(8);
    return {
      ...gs,
      board: Array(4).fill(null).map(() => Array(4).fill(null).map(() => [])),
      currentLayer: 1, round: (gs.round || 1) + 1,
      gameOver: false, overlay: null, swapMode: null, opponentSwapMode: null,
      drawPile,
      playerHand: p1Hand,
      aiHand: p2Hand,
      phase: 'draw',
      msg: 'New round! Your turn — draw a card.',
      msgType: 'info',
    };
  }

  // ── MY move — straight through to gameReducer ─────────────────
  if (isMyMove) {
    const next = gameReducer(gs, action, 'medium', profile);

    // Ensure overlay.winner is always set for CALL_WIN (FIX 2)
    if (action.type === 'CALL_WIN' && next.overlay?.type === 'win' && !next.overlay.winner) {
      return { ...next, overlay: { ...next.overlay, winner: next.overlay.who || 'player' } };
    }
    // Ensure overlay.winner is set for FACE_OFF (FIX 3)
    if (action.type === 'FACE_OFF' && next.overlay?.type === 'faceoff' && !next.overlay.winner) {
      return { ...next, overlay: { ...next.overlay, winner: next.overlay.who || 'ai' } };
    }

    return next;
  }

  // ── OPPONENT FACE_OFF ──────────────────────────────────────────
  if (action.type === 'FACE_OFF') return handleOpponentFaceOff(gs, profile);

  // ── OPPONENT QUIT ──────────────────────────────────────────────
  if (action.type === 'OPPONENT_QUIT') {
    return {
      ...gs,
      gameOver: true,
      overlay: {
        type: 'win',
        winner: 'player',
        name: profile?.username || 'You',
        matchText: 'Opponent forfeit!',
      },
      msg: 'Opponent left the match.',
      msgType: 'info'
    };
  }

  // ── OPPONENT CALL_WIN ──────────────────────────────────────────
  if (action.type === 'CALL_WIN') return handleOpponentCallWin(gs, profile);

  // ── OPPONENT DRAW_CARD ─────────────────────────────────────────
  if (action.type === 'DRAW_CARD') return handleOpponentDraw(gs, action);

  // ── All other opponent actions: swap sides → apply → swap back ─
  const translated = translateAction(action);
  if (!translated) {
    console.warn('[reducer] unknown opponent action:', action.type);
    return gs;
  }

  const swapped    = swapSidesForAction(gs, action.type);
  const afterApply = gameReducer(swapped, translated, 'medium', profile);
  const phaseFixed = swapGs(afterApply, action.type, gs);

  console.log('[reducer] OPP', action.type,
    '| phase:', gs.phase, '→', phaseFixed.phase,
    '| oppHand:', gs.aiHand?.map(c => c.sym).join(','),
    '→', phaseFixed.aiHand?.map(c => c.sym).join(','));

  return phaseFixed;
}

/* ── Opponent DRAW_CARD ─────────────────────────────────────────── */
function handleOpponentDraw(gs, action) {
  const drawPile = gs.drawPile || [];
  if (!drawPile.length) {
    console.warn('[reducer] OPP DRAW_CARD but drawPile is empty!');
    return gs;
  }

  let drawnCard = drawPile[0];
  const drawnSym = action.drawnSym;

  if (drawnSym && drawnCard.sym !== drawnSym) {
    const correctIdx = drawPile.findIndex(c => c.sym === drawnSym);
    if (correctIdx > 0) {
      const fixedPile = [...drawPile];
      [fixedPile[0], fixedPile[correctIdx]] = [fixedPile[correctIdx], fixedPile[0]];
      drawnCard = fixedPile[0];
      return {
        ...gs,
        aiHand:   [...(gs.aiHand || []), drawnCard],
        drawPile: fixedPile.slice(1),
        phase:    'ai',
        msg:      'Opponent is placing…',
        msgType:  'info',
      };
    }
  }

  return {
    ...gs,
    aiHand:   [...(gs.aiHand || []), drawnCard],
    drawPile: drawPile.slice(1),
    phase:    'ai',
    msg:      'Opponent is placing…',
    msgType:  'info',
  };
}

/* ── Opponent FACE_OFF ──────────────────────────────────────────── */
function handleOpponentFaceOff(gs, profile) {
  const mySyms  = (gs.playerHand || []).slice(0, 4).map(c => c.sym);
  const oppSyms = (gs.aiHand     || []).slice(0, 4).map(c => c.sym);
  const m       = countMatches(oppSyms, mySyms);
  const oppWon  = m >= 2;
  const winPts  = oppWon ? pts(profile, 'faceoffWin') : pts(profile, 'faceoffLoss');

  return {
    ...gs,
    gameOver: true,
    pScore:   gs.pScore + (oppWon ? 0 : winPts),
    aScore:   gs.aScore + (oppWon ? winPts : 0),
    overlay: {
      type:      'faceoff',
      winner:    oppWon ? 'ai' : 'player',
      name:      oppWon ? 'Opponent' : (profile?.username || 'You'),
      matches:   m,
      pSyms:     mySyms,
      aSyms:     oppSyms,
      caller:    'Opponent',
      matchText: `+${winPts} PTS`,
    },
    msg: oppWon ? 'Opponent wins the face-off!' : 'You survived the face-off!',
  };
}

/* ── Opponent CALL_WIN ──────────────────────────────────────────── */
function handleOpponentCallWin(gs, profile) {
  const oppHandSyms = (gs.aiHand || []).map(c => c.sym);
  const lines = getBoardLines(gs.board);
  let matched = null;
  for (const line of lines) {
    if (checkMatch(oppHandSyms, line.syms)) { matched = line; break; }
  }

  if (matched) {
    const layer    = gs.currentLayer || 1;
    const roundPts = layer === 3 ? pts(profile, 'L3')
                   : layer === 2 ? pts(profile, 'L2')
                   : pts(profile, 'L1');
    return {
      ...gs,
      gameOver: true,
      winRow:   matched,
      aScore:   gs.aScore + roundPts,
      overlay: {
        type:      'win',
        winner:    'ai',
        who:       'ai',
        name:      'Opponent',
        matchText: `+${roundPts} PTS`,
      },
      msg: 'Opponent wins this round!',
    };
  }

  return gs;
}

/* ── swapSidesForAction ─────────────────────────────────────────────
   Injects opponentSwapMode as the active swapMode so gameReducer
   sees the opponent's correct swap state for each step.
─────────────────────────────────────────────────────────────────── */
function swapSidesForAction(gs, actionType) {
  const swapModeToUse = actionType.startsWith('SWAP')
    ? (gs.opponentSwapMode || null)
    : null;

  return {
    ...gs,
    playerHand: gs.aiHand,
    aiHand:     gs.playerHand,
    pScore:     gs.aScore,
    aScore:     gs.pScore,
    phase:      requiredPhase(actionType),
    swapMode:   swapModeToUse,
    gameOver:   gs.gameOver,
  };
}

function requiredPhase(actionType) {
  switch (actionType) {
    case 'PLACE_CARD':
    case 'SWAP_START':
    case 'SWAP_PICK_BOARD':
    case 'SWAP_PICK_DEST':
    case 'SWAP_PLACE_HAND':
    case 'SWAP_CANCEL':    return 'place';
    default:               return 'draw';
  }
}

/* ── swapGs ─────────────────────────────────────────────────────────
   Swap sides back after applying the opponent's action.
   Updates opponentSwapMode based on what gameReducer left in swapMode.
─────────────────────────────────────────────────────────────────── */
export function swapGs(gs, opponentActionType, prevGs) {
  if (!gs) return gs;

  // Derive new opponentSwapMode from the result of applying their action
  let opponentSwapMode = prevGs?.opponentSwapMode ?? null;

  if (opponentActionType) {
    switch (opponentActionType) {
      case 'SWAP_START':
      case 'SWAP_PICK_BOARD':
      case 'SWAP_PICK_DEST':
        // gs.swapMode is the opponent's updated swapMode after their step
        opponentSwapMode = gs.swapMode || null;
        break;
      case 'SWAP_PLACE_HAND':
      case 'SWAP_CANCEL':
        opponentSwapMode = null;
        break;
      default:
        break;
    }
  }

  return {
    ...gs,
    playerHand:       gs.aiHand,
    aiHand:           gs.playerHand,
    pScore:           gs.aScore,
    aScore:           gs.pScore,
    swapMode:         prevGs?.swapMode ?? null,   // restore OUR swapMode
    opponentSwapMode: opponentSwapMode,
    turn:             gs.turn,
    phase:            gs.phase,
  };
}

/* ── translateAction ────────────────────────────────────────────── */
function translateAction(action) {
  switch (action.type) {
    case 'PLACE_CARD':      return { type: 'PLACE_CARD',      cardIdx: action.cardIdx, r: action.r, c: action.c };
    case 'SWAP_START':      return { type: 'SWAP_START' };
    case 'SWAP_PICK_BOARD': return { type: 'SWAP_PICK_BOARD', r: action.r, c: action.c };
    case 'SWAP_PICK_DEST':  return { type: 'SWAP_PICK_DEST',  r: action.r, c: action.c }; // real step now
    case 'SWAP_PLACE_HAND': return { type: 'SWAP_PLACE_HAND', cardIdx: action.cardIdx, r: action.r, c: action.c };
    case 'SWAP_CANCEL':     return { type: 'SWAP_CANCEL' };
    case 'OPPONENT_QUIT':   return { type: 'OPPONENT_QUIT' };
    default:                return null;
  }
}
