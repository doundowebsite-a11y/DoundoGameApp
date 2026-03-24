/**
 * seededShuffle.js
 * src/game/engine/seededShuffle.js
 *
 * Deterministic shuffle using a seed integer.
 * Both players call this with the SAME seed → identical deck order.
 *
 * Uses a simple LCG (Linear Congruential Generator) — fast, 
 * deterministic, and produces good enough randomness for a card game.
 */

/**
 * Create a seeded random function.
 * Returns a function that produces numbers in [0, 1) deterministically.
 */
export function createSeededRandom(seed) {
  let s = seed >>> 0; // ensure 32-bit unsigned integer
  return function () {
    // LCG parameters from Numerical Recipes
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296; // divide by 2^32
  };
}

/**
 * Shuffle an array in-place using a seeded random function.
 * Fisher-Yates algorithm — O(n), unbiased.
 */
export function seededShuffle(array, seed) {
  const rand = createSeededRandom(seed);
  const arr  = [...array]; // don't mutate original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
