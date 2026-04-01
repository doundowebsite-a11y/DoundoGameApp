/* ═══════════════════════════════════════════════════════════════════
   aiLogic.js — AI difficulty strategies
   Easy, Medium, Hard, Champion
═══════════════════════════════════════════════════════════════════ */

import {
  getBoardLines, getEmptyCells, checkMatch, countMatches,
  doPlace, isCurrentLayerFull, endRound
} from '../game/engine/gameUtils';

/* ─── EASY ───────────────────────────────────────────────────────────
   Plays a random card in a random valid cell. Never tries to win.
   No swap logic.
*/
export function aiEasy(board, hand, currentLayer) {
  const emp = getEmptyCells(board, currentLayer);
  if (!emp.length) return { type: 'discard', cardIdx: 0 };
  return {
    type: 'place',
    cardIdx: Math.floor(Math.random() * hand.length),
    space: emp[Math.floor(Math.random() * emp.length)],
  };
}

/* ─── MEDIUM ─────────────────────────────────────────────────────────
   30% chance to call win if hand matches a line.
   Otherwise plays random card in random cell.
   30% chance to swap.
*/
export function aiMedium(board, hand, currentLayer) {
  const lines = getBoardLines(board);
  const hs = hand.map(c => c.sym);
  if (Math.random() < 0.3)
    for (const l of lines)
      if (checkMatch(hs, l.syms)) return { type: 'win' };
  const emp = getEmptyCells(board, currentLayer);
  if (!emp.length) return { type: 'discard', cardIdx: 0 };
  return {
    type: 'place',
    cardIdx: Math.floor(Math.random() * hand.length),
    space: emp[Math.floor(Math.random() * emp.length)],
  };
}

/* ─── HARD ───────────────────────────────────────────────────────────
   Always calls win if hand matches a line.
   Plays the card that maximises remaining-hand match potential.
   50% chance to swap.
*/
export function aiHard(board, hand, currentLayer) {
  const lines = getBoardLines(board);
  const hs = hand.map(c => c.sym);
  for (const l of lines) if (checkMatch(hs, l.syms)) return { type: 'win' };
  const emp = getEmptyCells(board, currentLayer);
  if (!emp.length) return { type: 'discard', cardIdx: 0 };
  let best = 0, bestScore = -1;
  for (let ci = 0; ci < hand.length; ci++) {
    let sc = 0;
    for (const l of lines)
      sc += countMatches(hand.filter((_, i) => i !== ci).map(c => c.sym), l.syms);
    if (sc > bestScore) { bestScore = sc; best = ci; }
  }
  // FIX: use bestCellForCard instead of random
  return { type: 'place', cardIdx: best, space: bestCellForCard(board, hand[best], emp, currentLayer) };
}

/* ─── CHAMPION ───────────────────────────────────────────────────────
   Always calls win. Reads player hand to trigger face-offs.
   Actively blocks player winning rows. 60% chance to swap.
*/
export function aiChampion(board, hand, playerHand, currentLayer) {
  const lines = getBoardLines(board);
  const hs = hand.map(c => c.sym);
  const ps = playerHand.map(c => c.sym);
  for (const l of lines) if (checkMatch(hs, l.syms)) return { type: 'win' };
  if (countMatches(hs, ps) >= 3 && Math.random() > 0.3) return { type: 'faceoff' };
  
  // Blocking logic: identify the exact empty cell in the threatening line
  for (const l of lines) {
    if (countMatches(ps, l.syms) >= 3) {
      const emp2 = getEmptyCells(board, currentLayer);
      if (emp2.length) {
        // Find which empty spaces in emp2 are part of this specific line 'l'
        const lineCells = l.isCol 
          ? [0,1,2,3].map(r => [r, l.c])
          : [0,1,2,3].map(c => [l.r, c]);
        const blockingSpace = emp2.find(([er, ec]) => 
          lineCells.some(([lr, lc]) => lr === er && lc === ec)
        );
        if (blockingSpace) return { type: 'place', cardIdx: 0, space: blockingSpace };
      }
    }
  }
  
  const emp = getEmptyCells(board, currentLayer);
  if (!emp.length) return { type: 'discard', cardIdx: 0 };
  let best = 0, bestScore = -99;
  for (let ci = 0; ci < hand.length; ci++) {
    let sc = 0;
    for (const l of lines)
      sc += countMatches(hand.filter((_, i) => i !== ci).map(c => c.sym), l.syms) * 2;
    sc -= countMatches([hand[ci].sym], ps);
    if (sc > bestScore) { bestScore = sc; best = ci; }
  }
  // FIX: use bestCellForCard instead of random
  return { type: 'place', cardIdx: best, space: bestCellForCard(board, hand[best], emp, currentLayer) };
}

/**
 * bestCellForCard — Issue #6 Fix
 * Scores each empty cell by how much it contributes to the AI's match potential.
 */
function bestCellForCard(board, card, emp, currentLayer) {
  if (!emp.length) return null;
  let bestCell = emp[0], bestScore = -1;
  for (const [r, c] of emp) {
    let score = 0;
    // Score based on row potential
    for (let cc = 0; cc < 4; cc++) {
      const cell = board[r][cc];
      if (cell.length > 0 && cell[cell.length-1].sym === card.sym) score += 2;
    }
    // Score based on column potential
    for (let rr = 0; rr < 4; rr++) {
      const cell = board[rr][c];
      if (cell.length > 0 && cell[cell.length-1].sym === card.sym) score += 2;
    }
    // Slight noise to avoid being 100% predictable
    score += Math.random() * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestCell = [r, c];
    }
  }
  return bestCell;
}

/* ─── AI SWAP LOGIC ──────────────────────────────────────────────────
   Shared swap attempt for medium/hard/champion.
   Swap probability: medium=30%, hard=50%, champion=60%

   Swap rule (matches player rules):
   - Pick any filled cell (top card displaced).
   - Displaced card goes to any cell with (currentLayer-1) cards.
   - AI's drawn card fills the vacated cell.
*/
export function tryAiSwap(board, hand, currentLayer, act, swapProb) {
  if (swapProb <= 0) return null;
  if (Math.random() >= swapProb) return null;
  if (act.type !== 'place') return null;

  // Find swappable source cells: any cell with ≥1 card
  const swapSrcs = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (board[r][c].length >= 1) swapSrcs.push([r, c]);

  // Find valid destinations: cells with exactly (currentLayer-1) cards
  const swapDests = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (board[r][c].length === currentLayer - 1) swapDests.push([r, c]);

  if (!swapSrcs.length || !swapDests.length) return null;

  const [sr, sc] = swapSrcs[Math.floor(Math.random() * swapSrcs.length)];
  // Destination must be different from source (after removal source has srcLen-1 cards)
  const validDests = swapDests.filter(([dr, dc]) => !(dr === sr && dc === sc));
  if (!validDests.length) return null;

  const [dr, dc] = validDests[Math.floor(Math.random() * validDests.length)];
  const displaced = board[sr][sc][board[sr][sc].length - 1];

  // Board after swap: remove top from src, add displaced to dest
  let nb = board.map((row, ri) => row.map((col, ci) => {
    if (ri === sr && ci === sc) return col.slice(0, -1);
    if (ri === dr && ci === dc) return [...col, displaced];
    return col;
  }));

  // Place AI's card at vacated src cell (which now has srcLen-1 cards = valid base)
  const cardToPlay = hand[act.cardIdx] || hand[0];
  nb = nb.map((row, ri) => row.map((col, ci) =>
    ri === sr && ci === sc ? [...col, cardToPlay] : col
  ));

  const nh = hand.filter(c => c !== cardToPlay);
  return { newBoard: nb, newHand: nh };
}

/* ─── FULL AI TURN RUNNER ────────────────────────────────────────────
   Called each time phase === "ai".
   Returns updated game state.
*/
export function runAiTurn(gs, diff, profile) {
  if (!gs || gs.phase !== 'ai' || gs.gameOver) return gs;
  const { board, aiHand, drawPile, playerHand, currentLayer } = gs;

  // Check win before drawing (medium/hard/champion)
  if (diff !== 'easy') {
    const hs = aiHand.map(c => c.sym);
    const lines = getBoardLines(board);
    for (const l of lines) {
      if (checkMatch(hs, l.syms)) {
        return {
          ...endRound({ ...gs, winRow: l }, 'ai', 1),
          overlay: { type: 'lose' }
        };
      }
    }
  }

  if (!drawPile.length) {
    return {
      ...endRound(gs, 'tie', 0),
      overlay: { type: 'tie', winner: 'tie' }
    };
  }

  const [drawn, ...rest] = drawPile;
  const hand = [...aiHand, drawn];

  // Champion face-off
  if (diff === 'ai') {
    const hs = hand.map(c => c.sym);
    const ps = playerHand.map(c => c.sym);
    if (countMatches(hs, ps) >= 3 && Math.random() > 0.25) {
      const m = countMatches(hs, ps);
      if (m >= 2) {
        return {
          ...endRound({ ...gs, aiHand: hand, drawPile: rest }, 'ai', 2),
          overlay: { type: 'faceoff', winner: 'ai', name: 'AI', matches: m, pSyms: ps, aSyms: hs, caller: 'AI' }
        };
      } else {
        return {
          ...endRound({ ...gs, aiHand: hand, drawPile: rest }, 'player', 1),
          overlay: { type: 'faceoff', winner: 'player', name: profile?.username || 'You', matches: m, pSyms: ps, aSyms: hs, caller: 'AI' }
        };
      }
    }
  }

  // Dynamic AI Checkpoint — automatically throttle difficulty if player is losing badly
  let actualDiff = diff;
  const scoreGap = (gs.aScore || 0) - (gs.pScore || 0);
  if (scoreGap >= 600 && actualDiff === 'ai') actualDiff = 'hard';
  else if (scoreGap >= 400 && actualDiff === 'hard') actualDiff = 'medium';
  else if (scoreGap >= 300 && actualDiff === 'medium') actualDiff = 'easy';

  // Choose action using adjusted difficulty
  let act;
  if (actualDiff === 'easy') act = aiEasy(board, hand, currentLayer);
  else if (actualDiff === 'medium') act = aiMedium(board, hand, currentLayer);
  else if (actualDiff === 'hard') act = aiHard(board, hand, currentLayer);
  else act = aiChampion(board, hand, playerHand, currentLayer);

  // Check win action
  if (act.type === 'win') {
    const hs = hand.map(c => c.sym);
    const lines = getBoardLines(board);
    for (const l of lines) {
      if (checkMatch(hs, l.syms)) {
        return {
          ...endRound({ ...gs, winRow: l, aiHand: hand, drawPile: rest }, 'ai', 1),
          overlay: { type: 'lose' }
        };
      }
    }
  }

  // Try swap
  const swapProb = diff === 'medium' ? 0.30 : diff === 'hard' ? 0.50 : diff === 'ai' ? 0.60 : 0;
  const swapResult = tryAiSwap(board, hand, currentLayer, act, swapProb);
  if (swapResult) {
    const { newBoard, newHand } = swapResult;
    let nextLayer = currentLayer, layerJustChanged = false;
    if (isCurrentLayerFull(newBoard, currentLayer)) {
      layerJustChanged = true;
      nextLayer = currentLayer + 1;
      if (nextLayer > 3) {
        return {
          ...endRound({ ...gs, board: newBoard, aiHand: newHand, drawPile: rest }, 'tie', 0),
          overlay: { type: 'tie', winner: 'tie' }
        };
      }
    }
    return {
      ...gs, board: newBoard, aiHand: newHand, drawPile: rest,
      phase: 'draw', currentLayer: nextLayer,
      msg: '', msgType: 'info', layerJustChanged,
    };
  }

  // Normal place
  let nb = board, nh = hand;
  if (act.type === 'place') {
    const res = doPlace(board, hand, act.cardIdx, act.space[0], act.space[1], currentLayer);
    if (!res.error) {
      nb = res.newBoard;
      nh = res.newHand;
    } else {
      // Fallback: try any empty cell
      const emp = getEmptyCells(board, currentLayer);
      let done = false;
      for (const [ri, ci] of emp) {
        const r2 = doPlace(board, hand, 0, ri, ci, currentLayer);
        if (!r2.error) { nb = r2.newBoard; nh = r2.newHand; done = true; break; }
      }
      if (!done) nh = hand.slice(0, 4);
    }
  } else {
    nh = hand.slice(0, 4);
  }

  let nextLayer = currentLayer, layerJustChanged = false;
  if (isCurrentLayerFull(nb, currentLayer)) {
    layerJustChanged = true;
    nextLayer = currentLayer + 1;
    if (nextLayer > 3) {
      return {
        ...endRound({ ...gs, board: nb, aiHand: nh, drawPile: rest }, 'tie', 0),
        overlay: { type: 'tie', winner: 'tie' }
      };
    }
  }

  return {
    ...gs, board: nb, aiHand: nh, drawPile: rest,
    phase: 'draw', currentLayer: nextLayer,
    msg: '', msgType: 'info', layerJustChanged,
  };
}

/* ─── DIFFICULTY CONFIG ──────────────────────────────────────────── */
export const DIFF = [
  { id: 'easy', label: 'EASY', icon: '🌱', color: '#4ADE80', desc: 'AI lets you learn comfortably.' },
  { id: 'medium', label: 'MEDIUM', icon: '⚡', color: '#FBBF24', desc: 'Balanced — smart but fair.' },
  { id: 'hard', label: 'HARD', icon: '🔥', color: '#FB923C', desc: 'AI blocks your rows every turn.' },
  { id: 'ai', label: 'AI CHAMP', icon: '🤖', color: '#f1562d', desc: 'Champion AI reads your hand.' },
];
