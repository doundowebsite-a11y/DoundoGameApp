/* ═══════════════════════════════════════════════════════════════════
   gameUtils.js — Core game utilities
   Deck building, shuffling, win checking, board helpers
═══════════════════════════════════════════════════════════════════ */

import { SYMBOLS } from '../../symbols/symbols.js';

/* ─── DECK ─── */
export function buildDeck() {
  const d = [];
  let id = 0;
  SYMBOLS.forEach(s => {
    for (let i = 0; i < 6; i++) d.push({ uid: id++, sym: s.id });
  });
  return d;
}

export function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/* ─── BOARD HELPERS ─── */
export function topSym(sp) {
  return sp?.length ? sp[sp.length - 1].sym : null;
}

export function getBoardLines(board) {
  const lines = [];
  for (let r = 0; r < 4; r++) {
    const t = board[r].map(sp => topSym(sp));
    if (t.every(x => x !== null)) lines.push({ type: 'row', index: r, syms: t });
  }
  for (let c = 0; c < 4; c++) {
    const t = [0, 1, 2, 3].map(r => topSym(board[r][c]));
    if (t.every(x => x !== null)) lines.push({ type: 'col', index: c, syms: t });
  }
  return lines;
}

export function isCurrentLayerFull(board, currentLayer) {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (board[r][c].length < currentLayer) return false;
  return true;
}

export function getEmptyCells(board, currentLayer) {
  const emp = [];
  const required = currentLayer - 1;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (board[r][c].length === required) emp.push([r, c]);
  return emp;
}

/* ─── MATCHING ─── */
export function checkMatch(hand4, row4) {
  if (hand4.length !== 4 || row4.length !== 4) return false;
  const h = [...hand4].sort(), r = [...row4].sort();
  return h[0] === r[0] && h[1] === r[1] && h[2] === r[2] && h[3] === r[3];
}

/**
 * calculateHints
 * Given a hand and board, returns an array [count0, count1, count2, count3]
 * where each count is how many possible win-lines that card can complete.
 */
export function calculateHints(hand, board, currentLayer) {
  const h = Array(hand.length).fill(0);
  const lines = getBoardLines(board);
  const emp   = getEmptyCells(board, currentLayer);

  hand.forEach((card, ci) => {
    if (!card) return;
    let count = 0;
    for (const [r, c] of emp) {
      // For each empty cell, if we place this card, does it complete any line?
      for (const line of lines) {
        // Is this cell (r,c) part of this line?
        const isRowMatch = line.type === 'row' && line.index === r;
        const isColMatch = line.type === 'col' && line.index === c;
        if (isRowMatch || isColMatch) {
          // The line is "complete" minus one if it has 3 cards.
          // Wait, getBoardLines only returns lines that already have 4 cards?
          // No, let's fix the logic to find "potential" lines.
        }
      }
    }
  });
  // Actually, a simpler way: for each empty cell, if placing the card creates a 4-match.
  hand.forEach((card, ci) => {
    if (!card) return;
    for (const [r, c] of emp) {
      // Check rows
      const rowSyms = [0,1,2,3].map(currC => currC === c ? card.sym : topSym(board[r][currC]));
      if (rowSyms.every(s => s !== null) && checkMatch([...hand.filter((_,idx)=>idx!==ci).map(cc=>cc.sym), card.sym], rowSyms)) {
        h[ci]++;
        continue; // Only count one win per cell for this card
      }
      // Check cols
      const colSyms = [0,1,2,3].map(currR => currR === r ? card.sym : topSym(board[currR][c]));
      if (colSyms.every(s => s !== null) && checkMatch([...hand.filter((_,idx)=>idx!==ci).map(cc=>cc.sym), card.sym], colSyms)) {
        h[ci]++;
      }
    }
  });
  return h;
}

export function countMatches(h1, h2) {
  const c = [...h2];
  let n = 0;
  for (const s of h1) {
    const i = c.indexOf(s);
    if (i !== -1) { n++; c.splice(i, 1); }
  }
  return n;
}

/* ─── PLACE CARD ─── */
export function doPlace(board, hand, cardIdx, r, c, currentLayer) {
  const spLen = board[r][c].length;
  const required = currentLayer - 1;
  if (spLen !== required) return {
    error: `Layer ${currentLayer}: space [R${r + 1},C${c + 1}] needs ${required} card${required !== 1 ? 's' : ''} below. Currently has ${spLen}.`
  };
  const nb = board.map((row, ri) =>
    row.map((col, ci) => ri === r && ci === c ? [...col, hand[cardIdx]] : col)
  );
  return { newBoard: nb, newHand: hand.filter((_, i) => i !== cardIdx) };
}

/* ─── END ROUND ─── */
export function endRound(gs, winner, pts) {
  const np = gs.pScore + (winner === 'player' ? pts : 0);
  const na = gs.aScore + (winner === 'ai' ? pts : 0);
  return {
    ...gs, gameOver: true, pScore: np, aScore: na,
    msg: winner === 'tie' ? 'Round Tie!' : winner === 'player' ? 'You win this round!' : 'AI wins this round!'
  };
}


/* ─── INITIAL GAME STATE ─── */
export function makeInitialState(deck) {
  const pile = deck.slice(8);
  return {
    board: Array(4).fill(null).map(() => Array(4).fill(null).map(() => [])),
    drawPile: pile,
    totalDeck: pile.length,
    playerHand: deck.slice(0, 4),
    aiHand: deck.slice(4, 8),
    phase: 'draw',
    pScore: 0,
    aScore: 0,
    round: 1,
    msg: '',
    msgType: 'info',
    gameOver: false,
    winRow: null,
    currentLayer: 1,
    layerJustChanged: false,
    swapMode: null,
  };
}
