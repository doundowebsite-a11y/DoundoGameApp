/**
 * useGameGlow.js
 * 
 * Manages which grid cells glow and why.
 * 
 * Rules:
 *  - Player places card  → that cell glows until AI draws
 *  - AI places card      → that cell glows until player draws
 *  - Swap completes      → BOTH cells glow until either side draws
 *  - Any DRAW_CARD       → all glows clear
 * 
 * FIX: `reason` is now exposed so GridCell can use different glow
 *      colors/intensity for 'swap' vs 'place' vs 'ai'.
 */
import { useState, useCallback, useRef } from 'react';

export function useGameGlow() {
  const [glowCells, setGlowCells] = useState([]);   // [{ r, c }]
  const [reason, setReason]       = useState(null);  // 'place' | 'ai' | 'swap' | 'opp'
  const lockRef = useRef(false);  // prevents board watcher from overriding swap glow

  const setGlow = useCallback((cells, r) => {
    setGlowCells(cells);
    setReason(r);
    // When we explicitly set swap glow, lock it so board watcher doesn't override
    if (r === 'swap') {
      lockRef.current = true;
      // Unlock after a tick so only the IMMEDIATE board watcher is blocked
      setTimeout(() => { lockRef.current = false; }, 50);
    }
  }, []);

  const clearGlow = useCallback(() => {
    setGlowCells([]);
    setReason(null);
    lockRef.current = false;
  }, []);

  const isGlowing = (r, c) => glowCells.some(g => g.r === r && g.c === c);

  // Board watcher should call this instead of setGlow directly
  // It respects the swap lock
  const setGlowIfNotLocked = useCallback((cells, r) => {
    if (lockRef.current) return; // swap glow was just set, don't override
    setGlowCells(cells);
    setReason(r);
  }, []);

  return { glowCells, reason, setGlow, clearGlow, isGlowing, setGlowIfNotLocked };
}

/**
 * Detect which cells changed between two board states.
 * Unlike simple count comparison, this also detects symbol changes
 * (e.g., swap where count stays the same but top card changes).
 * 
 * Returns { changed: [{r,c}], isSwap: boolean }
 */
export function detectBoardChanges(prevBoard, nextBoard) {
  if (!prevBoard || !nextBoard) return { changed: [], isSwap: false };
  
  const changed = [];
  let grew = 0, shrank = 0, symbolChanged = 0;
  
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const prevLen = prevBoard[r][c].length;
      const nextLen = nextBoard[r][c].length;
      const prevTop = prevLen > 0 ? prevBoard[r][c][prevLen - 1]?.sym : null;
      const nextTop = nextLen > 0 ? nextBoard[r][c][nextLen - 1]?.sym : null;
      
      const countDiff = nextLen - prevLen;
      const topChanged = prevTop !== nextTop;
      
      if (countDiff !== 0 || topChanged) {
        changed.push({ r, c });
        if (countDiff > 0) grew++;
        if (countDiff < 0) shrank++;
        if (countDiff === 0 && topChanged) symbolChanged++;
      }
    }
  }
  
  // A swap has: 1 cell where symbol changed but count stayed same (source)
  //           + 1 cell where count grew (destination)
  // OR: 1 cell shrank + 1 cell grew (during intermediate swap steps)
  const isSwap = (symbolChanged >= 1 && grew >= 1) || 
                 (shrank >= 1 && grew >= 1) ||
                 changed.length >= 2;
  
  return { changed, isSwap };
}
