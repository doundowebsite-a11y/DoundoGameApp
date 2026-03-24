/**
 * multiplayerReducer.js
 * src/game/engine/multiplayerReducer.js
 *
 * FIX: overlay.winner flipped for opponent perspective.
 *
 * When Player A calls FACE_OFF:
 *   gameReducer sets overlay.winner = 'player' (A won) or 'ai' (A lost)
 *   from A's perspective.
 *
 * Player B receives it via multiplayerReducer(gs, action, isMyMove=false).
 *   We swap sides, apply, swap back.
 *   BUT overlay.winner is still 'player'/'ai' from A's perspective.
 *   On B's screen 'player' means B — so B sees themselves as winner
 *   even when they lost. Completely wrong.
 *
 * FIX: after swapping back, invert the overlay winner:
 *   'player' → 'ai'   (A won = B lost)
 *   'ai'     → 'player' (A lost = B won)
 *
 * Same fix applies to CALL_WIN overlay.
 */
import { gameReducer } from './gameReducer';

export function multiplayerReducer(gs, action, isMyMove, profile) {
  if (!gs) return gs;

  if (isMyMove) {
    const next = gameReducer(gs, action, 'medium', profile);
    console.log('[reducer] MY', action.type,
      '| phase:', gs.phase, '→', next.phase,
      '| myHand:', gs.playerHand?.length, '→', next.playerHand?.length);
    return next;
  }

  // Opponent move: swap sides, apply, swap back, fix phase
  const translated = translateAction(action);
  if (!translated) {
    console.warn('[reducer] unknown opponent action:', action.type);
    return gs;
  }

  // Set phase to what gameReducer requires for this action type
  // (same pattern as DRAW_CARD fix from earlier)
  const swapped = swapSidesForAction(gs, action.type);

  const afterApply = gameReducer(swapped, translated, 'medium', profile);
  const restored   = swapSides(afterApply);
  const phaseFixed = fixPhase(restored, action.type);

  // Flip overlay winner so it's correct from THIS player's perspective
  const final = flipOverlayWinner(phaseFixed);

  console.log('[reducer] OPP', action.type,
    '| phase:', gs.phase, '→', final.phase,
    '| oppHand:', gs.aiHand?.length, '→', final.aiHand?.length,
    '| overlay winner:', final.overlay?.winner);

  return final;
}

/**
 * Flip overlay.winner for the receiving player.
 * The overlay was created from the caller's perspective:
 *   winner:'player' = caller won
 *   winner:'ai'     = caller lost (opponent won)
 * For the receiver, it's the opposite.
 */
function flipOverlayWinner(gs) {
  if (!gs.overlay) return gs;
  const w = gs.overlay.winner;
  const flipped = w === 'player' ? 'ai' : w === 'ai' ? 'player' : w;
  return {
    ...gs,
    overlay: {
      ...gs.overlay,
      winner: flipped,
      // Also flip pSyms/aSyms so each player sees their own cards on the left
      pSyms: gs.overlay.aSyms,
      aSyms: gs.overlay.pSyms,
    },
  };
}

/**
 * Swap hands AND set the phase gameReducer needs for this action.
 * Without this, gameReducer rejects the action silently:
 *   FACE_OFF needs phase='draw' (called at start of turn)
 *   DRAW_CARD needs phase='draw'
 *   PLACE_CARD/SWAP_* need phase='place'
 *   CALL_WIN needs phase='draw'
 */
function swapSidesForAction(gs, actionType) {
  return {
    ...gs,
    playerHand: gs.aiHand,
    aiHand:     gs.playerHand,
    pScore:     gs.aScore,
    aScore:     gs.pScore,
    phase:      requiredPhase(actionType),
    swapMode:   actionType.startsWith('SWAP') ? gs.swapMode : null,
  };
}

function requiredPhase(actionType) {
  switch (actionType) {
    case 'DRAW_CARD':
    case 'CALL_WIN':
    case 'FACE_OFF':   // must be phase='draw' — called before drawing
      return 'draw';
    case 'PLACE_CARD':
    case 'SWAP_START':
    case 'SWAP_PICK_BOARD':
    case 'SWAP_PICK_DEST':
    case 'SWAP_PLACE_HAND':
    case 'SWAP_CANCEL':
      return 'place';
    default:
      return 'draw';
  }
}

/** Simple swap — does NOT touch phase (used for restoring after apply) */
function swapSides(gs) {
  return {
    ...gs,
    playerHand: gs.aiHand,
    aiHand:     gs.playerHand,
    pScore:     gs.aScore,
    aScore:     gs.pScore,
  };
}

function translateAction(action) {
  switch (action.type) {
    case 'DRAW_CARD':       return { type: 'DRAW_CARD' };
    case 'PLACE_CARD':      return { type: 'PLACE_CARD', cardIdx: action.cardIdx, r: action.r, c: action.c };
    case 'CALL_WIN':        return { type: 'CALL_WIN' };
    case 'FACE_OFF':        return { type: 'FACE_OFF' };
    case 'SWAP_START':      return { type: 'SWAP_START' };
    case 'SWAP_PICK_BOARD': return { type: 'SWAP_PICK_BOARD', r: action.r, c: action.c };
    case 'SWAP_PICK_DEST':  return { type: 'SWAP_PICK_DEST',  r: action.r, c: action.c };
    case 'SWAP_PLACE_HAND': return { type: 'SWAP_PLACE_HAND', cardIdx: action.cardIdx, r: action.r, c: action.c };
    case 'SWAP_CANCEL':     return { type: 'SWAP_CANCEL' };
    default:                return null;
  }
}

function fixPhase(gs, opponentActionType) {
  switch (opponentActionType) {
    case 'PLACE_CARD':
    case 'SWAP_PLACE_HAND':
      return { ...gs, phase: 'draw', msg: 'Your turn — draw a card.', msgType: 'info' };
    case 'DRAW_CARD':
      return { ...gs, phase: 'ai', msg: 'Opponent is placing…', msgType: 'info' };
    case 'CALL_WIN':
    case 'FACE_OFF':
      return gs;
    default:
      return { ...gs, phase: 'ai' };
  }
}

function countFilledCells(board) {
  let n = 0;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (board[r][c]?.length > 0) n++;
  return n;
}
