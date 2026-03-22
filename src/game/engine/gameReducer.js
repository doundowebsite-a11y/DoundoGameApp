/* ═══════════════════════════════════════════════════════════════════
   gameReducer.js — Game state machine
   All player actions: place, swap, draw, call win, face-off

   BOARD STRUCTURE:
     board[r][c] is an array that grows with each layer.
     Layer 1: each cell has 0 or 1 cards. Fill all 16 → layer 2 begins.
     Layer 2: each cell must already have 1 card. New cards stack on top.
     Layer 3: each cell must have 2 cards. New cards stack on top.
     Board is NEVER cleared. Layers stack on top of each other.

   WIN RULE:
     Your 4-card hand must exactly match a complete row or column
     (using the topmost card of each cell).

   FACE-OFF RULE:
     Caller wins if their hand has 2+ matches with opponent's hand.
     Caller loses if fewer than 2 matches.

   SWAP RULES BY LAYER:
     L1: Pick any L1 board card → displaced goes to empty cell →
         hand card fills vacated cell as L1.
     L2: a) Pick L1 card → displaced goes to any L1 cell as L2 →
            hand card fills vacated cell as L1.
         b) Pick L2 card → displaced goes to any L1 cell as L2 →
            hand card fills vacated L1 slot.
         c) Swap between L2 cards (same dest rule).
     L3: Pick any top card → displaced goes to cell with (currentLayer-1)
         cards → hand card fills the gap.
═══════════════════════════════════════════════════════════════════ */

import {
  doPlace, isCurrentLayerFull, getBoardLines,
  checkMatch, countMatches, endRound
} from './gameUtils.js';

export function gameReducer(gs, action, diff, profile) {

  const { board, playerHand, aiHand, drawPile, gameOver, currentLayer } = gs;
  if (gameOver) return gs;

  /* ─── PLACE CARD ─────────────────────────────────────────────────── */
  if (action.type === 'PLACE_CARD') {
    if (gs.phase !== 'place') return {
      ...gs,
      msg: gs.phase === 'draw' ? '👆 Draw first — click the deck.'
         : gs.phase === 'ai'   ? '⏳ Wait for AI to finish.'
         : 'Drag a card to the board.',
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
          overlay: { type: 'tie' }
        };
      }
    }
    return {
      ...gs, board: nb, playerHand: nh, phase: 'ai',
      currentLayer: nextLayer, msg: 'AI is thinking…',
      msgType: 'info', winRow: null, layerJustChanged, swapMode: null,
    };
  }
// ... [REST OF ACTIONS WILL BE UPDATED BELOW]

  /* ─── SWAP FLOW ──────────────────────────────────────────────────────
     3 steps:
       pick_board → user clicks the board cell whose top card to take
       pick_dest  → user clicks where to place the displaced card
       pick_hand  → user drags hand card to the now-vacated cell

     Displaced card always lands at currentLayer depth at destination
     (dest must have currentLayer-1 cards).
     Hand card fills the vacated cell at its original depth (srcLen).
  */

  /* Step 0 — START */
  if (action.type === 'SWAP_START') {
    if (gs.phase !== 'place') return {
      ...gs, msg: 'You can only swap on your placement turn.', msgType: 'warn',
    };
    return {
      ...gs,
      swapMode: { step: 'pick_board' },
      msg: '👆 Click any board card to swap.',
      msgType: 'info',
    };
  }

  /* Step 1 — PICK BOARD CARD
     Valid: any cell with ≥1 card. Top card gets displaced.
  */
  if (action.type === 'SWAP_PICK_BOARD') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_board') return gs;
    const { r, c } = action;
    const cellLen = board[r][c].length;
    if (cellLen === 0) return {
      ...gs, msg: '❌ That cell is empty.', msgType: 'warn', errAnim: Date.now(),
    };
    const displaced = board[r][c][cellLen - 1];
    return {
      ...gs,
      swapMode: { step: 'pick_dest', fromR: r, fromC: c, displaced, srcLen: cellLen },
      msg: `👆 Now click where to place ${displaced.sym}.`,
      msgType: 'info',
    };
  }

  /* Step 2 — PICK DESTINATION
     Displaced card becomes a currentLayer card at destination.
     Dest must have exactly (currentLayer-1) cards.
  */
  if (action.type === 'SWAP_PICK_DEST') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_dest') return gs;
    const { r, c } = action;
    const { fromR, fromC, displaced, srcLen } = gs.swapMode;
    const destLen = board[r][c].length;
    const sameCell = (r === fromR && c === fromC);
    const valid = !sameCell && destLen === (currentLayer - 1);
    if (!valid) return {
      ...gs,
      msg: `❌ Pick a cell with ${currentLayer - 1} card${currentLayer - 1 !== 1 ? 's' : ''}.`,
      msgType: 'warn',
      errAnim: Date.now(),
    };
    const nb = board.map((row, ri) => row.map((col, ci) => {
      if (ri === fromR && ci === fromC) return col.slice(0, -1); // vacate source
      if (ri === r && ci === c) return [...col, displaced];      // displaced lands here
      return col;
    }));
    return {
      ...gs, board: nb,
      swapMode: { step: 'pick_hand', fromR, fromC, toR: r, toC: c, displaced, srcLen },
      msg: `🃏 Drag your hand card to R${fromR + 1},C${fromC + 1} to complete the swap.`,
      msgType: 'info',
    };
  }

  /* Step 3 — PLACE HAND CARD at vacated cell
     fromR,fromC now has (srcLen-1) cards. Hand card fills it at srcLen depth.
  */
  if (action.type === 'SWAP_PLACE_HAND') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_hand') return gs;
    const { cardIdx, r, c } = action;
    const { fromR, fromC } = gs.swapMode;
    if (r !== fromR || c !== fromC) return {
      ...gs,
      msg: `❌ Drop onto R${fromR + 1},C${fromC + 1} — the highlighted cell.`,
      msgType: 'warn',
      errAnim: Date.now(),
    };
    const nb = board.map((row, ri) => row.map((col, ci) =>
      ri === r && ci === c ? [...col, playerHand[cardIdx]] : col
    ));
    const nh = playerHand.filter((_, i) => i !== cardIdx);
    let nextLayer = currentLayer, layerJustChanged = false;
    if (isCurrentLayerFull(nb, currentLayer)) {
      layerJustChanged = true;
      nextLayer = currentLayer + 1;
      if (nextLayer > 3) {
        return {
          ...endRound({ ...gs, board: nb, playerHand: nh }, 'tie', 0),
          overlay: { type: 'tie' }
        };
      }
    }
    return {
      ...gs, board: nb, playerHand: nh, phase: 'ai',
      currentLayer: nextLayer, msg: 'AI is thinking…',
      msgType: 'info', winRow: null, layerJustChanged, swapMode: null,
    };
  }

  /* Cancel swap — undo board if already in pick_hand */
  if (action.type === 'SWAP_CANCEL') {
    if (gs.swapMode?.step === 'pick_hand') {
      const { fromR, fromC, toR, toC, displaced } = gs.swapMode;
      const nb = board.map((row, ri) => row.map((col, ci) => {
        if (ri === toR && ci === toC) return col.slice(0, -1);
        if (ri === fromR && ci === fromC) return [...col, displaced];
        return col;
      }));
      return { ...gs, board: nb, swapMode: null, msg: 'Swap cancelled.', msgType: 'info' };
    }
    return { ...gs, swapMode: null, msg: 'Swap cancelled.', msgType: 'info' };
  }

  /* ─── DRAW CARD ──────────────────────────────────────────────────── */
  if (action.type === 'DRAW_CARD') {
    if (gs.phase !== 'draw') return {
      ...gs,
      msg: gs.phase === 'place' ? '🃏 Play a card to the board first.' : '⏳ Wait for AI.',
      msgType: 'warn',
    };
    if (!drawPile.length) return { ...gs, msg: 'Draw pile is empty!', msgType: 'warn' };
    const [drawn, ...rest] = drawPile;
    return { ...gs, playerHand: [...playerHand, drawn], drawPile: rest, phase: 'place', msg: '', msgType: 'info' };
  }

  /* ─── CALL WIN ───────────────────────────────────────────────────── */
  if (action.type === 'CALL_WIN') {
    if (gs.phase === 'ai') return { ...gs, msg: '⏳ Wait for AI to finish.', msgType: 'warn' };
    if (gs.phase === 'place') return {
      ...gs, msg: 'Call Win BEFORE drawing — at the start of your turn.', msgType: 'warn',
    };
    const handSyms = playerHand.map(c => c.sym);
    const lines = getBoardLines(board);
    let matched = null;
    for (const line of lines) {
      if (checkMatch(handSyms, line.syms)) { matched = line; break; }
    }
    if (matched) {
      const pts = gs.currentLayer === 3 ? 300 : gs.currentLayer === 2 ? 200 : 100;
      return {
        ...endRound({ ...gs, winRow: matched }, 'player', pts),
        overlay: { type: 'win', who: 'player', name: profile?.username || 'You', matchText: `+${pts} PTS` }
      };
    }
    return {
      ...gs,
      msg: `No match — [${handSyms.join(', ')}] doesn't match any row/col on the board.`,
      msgType: 'warn',
      errAnim: Date.now(),
    };
  }

  /* ─── FACE OFF ───────────────────────────────────────────────────── */
  if (action.type === 'FACE_OFF') {
    if (gs.phase === 'ai') return { ...gs, msg: '⏳ Wait for AI to finish.', msgType: 'warn' };
    if (gs.phase === 'place') return {
      ...gs, msg: 'Face-Off is called INSTEAD of drawing — at the start of your turn.', msgType: 'warn',
    };
    const pS = playerHand.map(c => c.sym);
    const aS = aiHand.map(c => c.sym);
    const m = countMatches(pS, aS);
    if (m >= 2) {
      return {
        ...endRound(gs, 'player', 200),
        overlay: { type: 'faceoff', winner: 'player', name: profile?.username || 'You', matches: m, pSyms: pS, aSyms: aS, caller: profile?.username || 'You', matchText: `+200 PTS` }
      };
    } else {
      return {
        ...endRound(gs, 'ai', 100),
        overlay: { type: 'faceoff', winner: 'ai', name: 'AI', matches: m, pSyms: pS, aSyms: aS, caller: profile?.username || 'You', matchText: `+100 PTS` }
      };
    }
  }

  return gs;
}
