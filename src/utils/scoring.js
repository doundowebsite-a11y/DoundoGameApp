/**
 * scoring.js — src/utils/scoring.js
 *
 * Centralized scoring, level calculation, and title mapping.
 * Used by HomeScreen, ProfileScreen, ResultScreens, and game screens.
 *
 * Level formula: 500 XP per level, starting at Level 1.
 * Level titles change as the player progresses.
 */

const LEVEL_TITLES = [
  { from: 1,  to: 2,  title: 'Novice' },
  { from: 3,  to: 5,  title: 'Explorer' },
  { from: 6,  to: 9,  title: 'Strategist' },
  { from: 10, to: 14, title: 'Warrior' },
  { from: 15, to: 19, title: 'Champion' },
  { from: 20, to: 29, title: 'Master' },
  { from: 30, to: 49, title: 'Grandmaster' },
  { from: 50, to: Infinity, title: 'Legend' },
];

const XP_PER_LEVEL = 500;

/**
 * Get the player's level from their total score.
 */
export function getLevel(score) {
  return Math.floor((score || 0) / XP_PER_LEVEL) + 1;
}

/**
 * Get XP progress within the current level.
 * Returns { xpInLevel, xpNeeded, xpPct }
 */
export function getLevelProgress(score) {
  const s = score || 0;
  const level = getLevel(s);
  const xpInLevel = s - (level - 1) * XP_PER_LEVEL;
  return {
    xpInLevel,
    xpNeeded: XP_PER_LEVEL,
    xpPct: Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100),
  };
}

/**
 * Get the level title string for display.
 * e.g. "Level 3 Explorer", "Level 15 Champion"
 */
export function getLevelTitle(score) {
  const level = getLevel(score);
  const entry = LEVEL_TITLES.find(e => level >= e.from && level <= e.to);
  const title = entry ? entry.title : 'Legend';
  return `Level ${level} ${title}`;
}

/**
 * Calculate match-end points based on score and difficulty.
 */
export function calcMatchPoints(pScore, difficulty, isMultiplayer) {
  const mult = isMultiplayer ? 2.5
    : difficulty === 'ai' ? 3.0
    : difficulty === 'hard' ? 2.0
    : difficulty === 'medium' ? 1.5
    : 1.0;
  return Math.floor((pScore || 0) * mult);
}
