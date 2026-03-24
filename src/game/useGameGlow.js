/**
 * useGameGlow.js
 * 
 * Manages which grid cells glow and why.
 * 
 * Rules:
 *  - Player places card  → that cell glows until AI draws
 *  - AI places card      → that cell glows until player draws
 *  - Swap completes      → both cells glow until either side draws
 *  - Any DRAW_CARD       → all glows clear
 */
import { useState } from 'react';

export function useGameGlow() {
  const [glowCells, setGlowCells] = useState([]);   // [{ r, c }]
  const [reason, setReason]       = useState(null);  // 'place' | 'ai' | 'swap'

  const setGlow = (cells, r) => { setGlowCells(cells); setReason(r); };
  const clearGlow = ()        => { setGlowCells([]);    setReason(null); };

  const isGlowing = (r, c) => glowCells.some(g => g.r === r && g.c === c);

  return { glowCells, reason, setGlow, clearGlow, isGlowing };
}
