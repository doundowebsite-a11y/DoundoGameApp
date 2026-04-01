/**
 * gameReducer.js — src/game/engine/gameReducer.js
 *
 * FIXES IN THIS VERSION:
 *
 * FIX 1 — Swap now uses a proper 3-step flow matching what all layouts dispatch:
 *   SWAP_PICK_BOARD  → swapMode = { step:'pick_dest', fromR, fromC, displaced }
 *   SWAP_PICK_DEST   → moves displaced card to dest, swapMode = { step:'pick_hand', fromR, fromC, toR, toC }
 *   SWAP_PLACE_HAND  → places hand card at vacated source cell, clears swapMode
 *   SWAP_CANCEL      → if step was 'pick_hand' (dest already moved), undoes the board change
 *
 * FIX 2 — CALL_WIN overlay always sets winner:'player' (not just who:'player')
 *   RoundWinOverlay and result screens check overlay.winner, not overlay.who.
 *
 * FIX 3 — FACE_OFF overlay always sets winner field on both outcomes.
 */
import {
  doPlace, isCurrentLayerFull, getBoardLines,
  checkMatch, countMatches, endRound
} from './gameUtils.js';

const PTS = {
  solo: { L1: 100, L2: 200, L3: 300, faceoffWin: 200, faceoffLoss: 100 },
  mp:   { L1: 150, L2: 300, L3: 500, faceoffWin: 350, faceoffLoss: 150 },
};
function pts(profile, key) {
  const t = profile?.isMultiplayer ? PTS.mp : PTS.solo;
  return t[key];
}

export function gameReducer(gs, action, diff, profile) {
  const { board, playerHand, aiHand, drawPile, gameOver, currentLayer } = gs;
  if (gameOver) return gs;

  /* ─── PLACE CARD ─────────────────────────────────────────────────── */
  if (action.type === 'PLACE_CARD') {
    if (gs.phase !== 'place') return {
      ...gs,
      msg:     gs.phase === 'draw' ? '👆 Draw first — click the deck.' : 'Drag a card to the board.',
      msgType: 'warn',
    };
    const { cardIdx, r, c } = action;
    const res = doPlace(board, playerHand, cardIdx, r, c, currentLayer);
    if (res.error) return { ...gs, msg: res.error, msgType: 'warn', errAnim: Date.now() };
    const nb = res.newBoard, nh = res.newHand;
    
    let nextLayer = currentLayer, layerJustChanged = false;
    if (isCurrentLayerFull(nb, currentLayer)) {
      layerJustChanged = true;
      nextLayer = currentLayer + 1;
      if (nextLayer > 3) {
        return {
          ...endRound({ ...gs, board: nb, playerHand: nh }, 'tie', 0),
          overlay: { type: 'tie', winner: 'tie', matchText: 'No points — all layers filled' }
        };
      }
    }

    // Determine next turn
    const nextTurn = profile?.isMultiplayer ? (gs.turn === 1 ? 2 : 1) : 1;
    const nextPhase = profile?.isMultiplayer ? 'draw' : 'ai';

    return {
      ...gs, board: nb, phase: nextPhase, turn: nextTurn,
      currentLayer: nextLayer, msg: nextPhase === 'ai' ? 'AI is thinking…' : '',
      msgType: 'info', winRow: null, layerJustChanged, swapMode: null,
      playerHand: nh,
    };
  }


  /* ─── SWAP FLOW ──────────────────────────────────────────────────────
   *
   * 3-STEP SWAP:
   *
   *  SWAP_START      → swapMode = { step: 'pick_board' }
   *
   *  SWAP_PICK_BOARD (tap a FILLED cell — card to displace)
   *    → swapMode = { step: 'pick_dest', fromR, fromC, displaced }
   *    board unchanged at this point.
   *
   *  SWAP_PICK_DEST  (tap an EMPTY cell — where displaced card goes)
   *    → board: displaced card moved fromR,fromC → toR,toC; source is now empty
   *    → swapMode = { step: 'pick_hand', fromR, fromC, toR, toC }
   *
   *  SWAP_PLACE_HAND (tap/drag hand card to the now-empty source cell)
   *    → board: hand card placed at fromR,fromC
   *    → hand: that card removed
   *    → swapMode = null, phase → 'ai'
   *
   * ──────────────────────────────────────────────────────────────────── */

  if (action.type === 'SWAP_START') {
    if (gs.phase !== 'place') return {
      ...gs, msg: 'You can only swap on your placement turn.', msgType: 'warn',
    };
    return {
      ...gs,
      swapMode: { step: 'pick_board' },
      msg:      '⇄ SWAP — Step 1 of 3: Tap a board card to pick up.',
      msgType:  'info',
    };
  }

  if (action.type === 'SWAP_PICK_BOARD') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_board') return gs;
    const { r, c } = action;
    const cellLen = board[r][c].length;
    if (cellLen === 0) return {
      ...gs, msg: '❌ That cell is empty — tap a card to pick it up.', msgType: 'warn', errAnim: Date.now(),
    };
    const displaced = board[r][c][cellLen - 1];
    return {
      ...gs,
      swapMode: { step: 'pick_dest', fromR: r, fromC: c, displaced },
      msg:      '⇄ SWAP — Step 2 of 3: Tap an empty cell to move the displaced card there.',
      msgType:  'info',
    };
  }

  if (action.type === 'SWAP_PICK_DEST') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_dest') return gs;
    const { r, c } = action;
    const { fromR, fromC, displaced } = gs.swapMode;

    // Cannot be the same cell as source
    if (r === fromR && c === fromC) return {
      ...gs, msg: '❌ Choose a different empty cell.', msgType: 'warn', errAnim: Date.now(),
    };

    // Destination must be a valid empty slot for the current layer
    const destLen = board[r][c].length;
    const required = currentLayer - 1;
    if (destLen !== required) return {
      ...gs,
      msg:     `❌ That cell needs ${required} card${required !== 1 ? 's' : ''} below it.`,
      msgType: 'warn',
      errAnim: Date.now(),
    };

    // Move displaced card: remove from source, place at destination
    const nb = board.map((row, ri) => row.map((col, ci) => {
      if (ri === fromR && ci === fromC) return col.slice(0, -1);     // remove top card
      if (ri === r     && ci === c)     return [...col, displaced];  // add displaced card
      return col;
    }));

    return {
      ...gs,
      board:    nb,
      swapMode: { step: 'pick_hand', fromR, fromC, toR: r, toC: c },
      msg:      '⇄ SWAP — Step 3 of 3: Tap a hand card to place at the empty cell.',
      msgType:  'info',
    };
  }

  if (action.type === 'SWAP_PLACE_HAND') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_hand') return gs;
    const { cardIdx, r, c } = action;
    const { fromR, fromC } = gs.swapMode;
    const targetR = (r != null) ? r : fromR;
    const targetC = (c != null) ? c : fromC;

    const targetLen = board[targetR][targetC].length;
    const required  = currentLayer - 1;
    if (targetLen !== required) return {
      ...gs, msg: `❌ Place your card at the empty cell.`, msgType: 'warn', errAnim: Date.now(),
    };

    const nb = board.map((row, ri) => row.map((col, ci) =>
      ri === targetR && ci === targetC ? [...col, playerHand[cardIdx]] : col
    ));
    const nh = playerHand.filter((_, i) => i !== cardIdx);

    let nextLayer = currentLayer, layerJustChanged = false;
    if (isCurrentLayerFull(nb, currentLayer)) {
      layerJustChanged = true;
      nextLayer = currentLayer + 1;
      if (nextLayer > 3) {
        return {
          ...endRound({ ...gs, board: nb, playerHand: nh }, 'tie', 0),
          overlay: { type: 'tie', winner: 'tie', matchText: 'No points — all layers filled' },
        };
      }
    }

    const nextTurn = profile?.isMultiplayer ? (gs.turn === 1 ? 2 : 1) : 1;
    const nextPhase = profile?.isMultiplayer ? 'draw' : 'ai';

    return {
      ...gs, board: nb, phase: nextPhase, turn: nextTurn,
      currentLayer: nextLayer, layerJustChanged,
      msg: nextPhase === 'ai' ? 'AI is thinking…' : '', 
      msgType: 'info', swapMode: null,
      playerHand: nh,
    };
  }


  if (action.type === 'SWAP_CANCEL') {
    // If cancel happens after SWAP_PICK_DEST (step:'pick_hand'), the displaced card
    // was already moved on the board — we must undo that.
    if (gs.swapMode?.step === 'pick_hand') {
      const { fromR, fromC, toR, toC } = gs.swapMode;
      if (toR != null && toC != null) {
        const displaced = board[toR][toC][board[toR][toC].length - 1];
        const nb = board.map((row, ri) => row.map((col, ci) => {
          if (ri === toR   && ci === toC)   return col.slice(0, -1);
          if (ri === fromR && ci === fromC) return [...col, displaced];
          return col;
        }));
        return { ...gs, board: nb, swapMode: null, msg: 'Swap cancelled.', msgType: 'info' };
      }
    }
    return { ...gs, swapMode: null, msg: 'Swap cancelled.', msgType: 'info' };
  }

  /* ─── DRAW CARD ──────────────────────────────────────────────────── */
  if (action.type === 'DRAW_CARD') {
    if (gs.phase !== 'draw') return {
      ...gs,
      msg:     gs.phase === 'place' ? '🃏 Play a card to the board first.' : '⏳ Wait for AI.',
      msgType: 'warn',
    };
    if (!drawPile.length) {
      return {
        ...endRound(gs, 'tie', 0),
        overlay: { type: 'tie', winner: 'tie', matchText: 'Draw pile exhausted' },
      };
    }
    const [drawn, ...rest] = drawPile;
    
    return {
      ...gs, 
      playerHand: [...playerHand, drawn], 
      drawPile: rest,
      phase: 'place', msg: '', msgType: 'info',
    };
  }


  /* ─── CALL WIN ───────────────────────────────────────────────────── */
  if (action.type === 'CALL_WIN') {
    if (gs.phase === 'ai')    return { ...gs, msg: '⏳ Wait for AI to finish.',                             msgType: 'warn' };
    if (gs.phase === 'place') return { ...gs, msg: 'Call Win BEFORE drawing — at the start of your turn.', msgType: 'warn' };
    const handSyms = playerHand.map(c => c.sym);
    const lines    = getBoardLines(board);
    let matched = null;
    for (const line of lines) {
      if (checkMatch(handSyms, line.syms)) { matched = line; break; }
    }
    if (matched) {
      const roundPts = currentLayer === 3 ? pts(profile, 'L3')
                     : currentLayer === 2 ? pts(profile, 'L2')
                     : pts(profile, 'L1');
      return {
        ...endRound({ ...gs, winRow: matched }, 'player', roundPts),
        overlay: {
          type:      'win',
          who:       'player',
          winner:    'player',  // FIX 2
          name:      profile?.username || 'You',
          matchText: `+${roundPts} PTS`,
        },
      };
    }
    return {
      ...gs,
      msg:     `No match — [${handSyms.join(', ')}] doesn't match any row/col on the board.`,
      msgType: 'warn',
      errAnim: Date.now(),
    };
  }

  /* ─── FACE OFF ───────────────────────────────────────────────────── */
  if (action.type === 'FACE_OFF') {
    if (gs.phase === 'ai')    return { ...gs, msg: '⏳ Wait for AI to finish.',                                        msgType: 'warn' };
    if (gs.phase === 'place') return { ...gs, msg: 'Face-Off is called INSTEAD of drawing — at the start of your turn.', msgType: 'warn' };
    const pS = playerHand.map(c => c.sym);
    const aS = aiHand.map(c => c.sym);
    const m  = countMatches(pS, aS);
    if (m >= 2) {
      const winPts = pts(profile, 'faceoffWin');
      return {
        ...endRound(gs, 'player', winPts),
        overlay: {
          type: 'faceoff', winner: 'player', who: 'player',  // FIX 3
          name: profile?.username || 'You', matches: m,
          pSyms: pS, aSyms: aS, caller: profile?.username || 'You',
          matchText: `+${winPts} PTS`,
        },
      };
    } else {
      const losePts = pts(profile, 'faceoffLoss');
      return {
        ...endRound(gs, 'ai', losePts),
        overlay: {
          type: 'faceoff', winner: 'ai', who: 'ai',  // FIX 3
          name: 'AI', matches: m,
          pSyms: pS, aSyms: aS, caller: profile?.username || 'You',
          matchText: `+${losePts} PTS`,
        },
      };
    }
  }

  return gs;
}
