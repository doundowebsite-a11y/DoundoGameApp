/* ═══════════════════════════════════════════════════════════════════
   gameReducer.js — Game state machine
   SCORING UPDATE (multiplayer-aware):
     isMultiplayer flag passed via profile.isMultiplayer
     Solo:        L1=100  L2=200  L3=300  FaceOff win=200  loss=100
     Multiplayer: L1=150  L2=300  L3=500  FaceOff win=350  loss=150
═══════════════════════════════════════════════════════════════════ */

import {
  doPlace, isCurrentLayerFull, getBoardLines,
  checkMatch, countMatches, endRound
} from './gameUtils.js';

// Points table — keyed by mode
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

  /* ─── SWAP FLOW ──────────────────────────────────────────────────── */
  if (action.type === 'SWAP_START') {
    if (gs.phase !== 'place') return { ...gs, msg: 'You can only swap on your placement turn.', msgType: 'warn' };
    return { ...gs, swapMode: { step: 'pick_board' }, msg: '👆 Click any board card to swap.', msgType: 'info' };
  }

  if (action.type === 'SWAP_PICK_BOARD') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_board') return gs;
    const { r, c } = action;
    const cellLen = board[r][c].length;
    if (cellLen === 0) return { ...gs, msg: '❌ That cell is empty.', msgType: 'warn', errAnim: Date.now() };
    const displaced = board[r][c][cellLen - 1];
    return { ...gs, swapMode: { step: 'pick_dest', fromR: r, fromC: c, displaced, srcLen: cellLen }, msg: `👆 Now click where to place ${displaced.sym}.`, msgType: 'info' };
  }

  if (action.type === 'SWAP_PICK_DEST') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_dest') return gs;
    const { r, c } = action;
    const { fromR, fromC, displaced, srcLen } = gs.swapMode;
    const destLen = board[r][c].length;
    const sameCell = (r === fromR && c === fromC);
    const valid = !sameCell && destLen === (currentLayer - 1);
    if (!valid) return { ...gs, msg: `❌ Pick a cell with ${currentLayer - 1} card${currentLayer - 1 !== 1 ? 's' : ''}.`, msgType: 'warn', errAnim: Date.now() };
    const nb = board.map((row, ri) => row.map((col, ci) => {
      if (ri === fromR && ci === fromC) return col.slice(0, -1);
      if (ri === r && ci === c) return [...col, displaced];
      return col;
    }));
    return { ...gs, board: nb, swapMode: { step: 'pick_hand', fromR, fromC, toR: r, toC: c, displaced, srcLen }, msg: `🃏 Drag your hand card to R${fromR + 1},C${fromC + 1} to complete the swap.`, msgType: 'info' };
  }

  if (action.type === 'SWAP_PLACE_HAND') {
    if (!gs.swapMode || gs.swapMode.step !== 'pick_hand') return gs;
    const { cardIdx, r, c } = action;
    const { fromR, fromC } = gs.swapMode;
    if (r !== fromR || c !== fromC) return { ...gs, msg: `❌ Drop onto R${fromR + 1},C${fromC + 1} — the highlighted cell.`, msgType: 'warn', errAnim: Date.now() };
    const nb = board.map((row, ri) => row.map((col, ci) => ri === r && ci === c ? [...col, playerHand[cardIdx]] : col));
    const nh = playerHand.filter((_, i) => i !== cardIdx);
    let nextLayer = currentLayer, layerJustChanged = false;
    if (isCurrentLayerFull(nb, currentLayer)) {
      layerJustChanged = true;
      nextLayer = currentLayer + 1;
      if (nextLayer > 3) {
        return { ...endRound({ ...gs, board: nb, playerHand: nh }, 'tie', 0), overlay: { type: 'tie' } };
      }
    }
    return { ...gs, board: nb, playerHand: nh, phase: 'ai', currentLayer: nextLayer, msg: 'AI is thinking…', msgType: 'info', winRow: null, layerJustChanged, swapMode: null };
  }

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
    if (gs.phase !== 'draw') return { ...gs, msg: gs.phase === 'place' ? '🃏 Play a card to the board first.' : '⏳ Wait for AI.', msgType: 'warn' };
    if (!drawPile.length) return { ...gs, msg: 'Draw pile is empty!', msgType: 'warn' };
    const [drawn, ...rest] = drawPile;
    return { ...gs, playerHand: [...playerHand, drawn], drawPile: rest, phase: 'place', msg: '', msgType: 'info' };
  }

  /* ─── CALL WIN ───────────────────────────────────────────────────── */
  if (action.type === 'CALL_WIN') {
    if (gs.phase === 'ai') return { ...gs, msg: '⏳ Wait for AI to finish.', msgType: 'warn' };
    if (gs.phase === 'place') return { ...gs, msg: 'Call Win BEFORE drawing — at the start of your turn.', msgType: 'warn' };
    const handSyms = playerHand.map(c => c.sym);
    const lines = getBoardLines(board);
    let matched = null;
    for (const line of lines) {
      if (checkMatch(handSyms, line.syms)) { matched = line; break; }
    }
    if (matched) {
      const roundPts = currentLayer === 3 ? pts(profile, 'L3') : currentLayer === 2 ? pts(profile, 'L2') : pts(profile, 'L1');
      return {
        ...endRound({ ...gs, winRow: matched }, 'player', roundPts),
        overlay: { type: 'win', who: 'player', name: profile?.username || 'You', matchText: `+${roundPts} PTS` }
      };
    }
    return { ...gs, msg: `No match — [${handSyms.join(', ')}] doesn't match any row/col on the board.`, msgType: 'warn', errAnim: Date.now() };
  }

  /* ─── FACE OFF ───────────────────────────────────────────────────── */
  if (action.type === 'FACE_OFF') {
    if (gs.phase === 'ai') return { ...gs, msg: '⏳ Wait for AI to finish.', msgType: 'warn' };
    if (gs.phase === 'place') return { ...gs, msg: 'Face-Off is called INSTEAD of drawing — at the start of your turn.', msgType: 'warn' };
    const pS = playerHand.map(c => c.sym);
    const aS = aiHand.map(c => c.sym);
    const m = countMatches(pS, aS);
    if (m >= 2) {
      const winPts = pts(profile, 'faceoffWin');
      return {
        ...endRound(gs, 'player', winPts),
        overlay: { type: 'faceoff', winner: 'player', name: profile?.username || 'You', matches: m, pSyms: pS, aSyms: aS, caller: profile?.username || 'You', matchText: `+${winPts} PTS` }
      };
    } else {
      const losePts = pts(profile, 'faceoffLoss');
      return {
        ...endRound(gs, 'ai', losePts),
        overlay: { type: 'faceoff', winner: 'ai', name: 'AI', matches: m, pSyms: pS, aSyms: aS, caller: profile?.username || 'You', matchText: `+${losePts} PTS` }
      };
    }
  }

  return gs;
}
