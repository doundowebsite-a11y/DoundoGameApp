/* ═══════════════════════════════════════════════════════════════════
   symbols.js — Symbol definitions for the Doundo card game
   12 mythological symbols, each mapped to its SVG icon asset
═══════════════════════════════════════════════════════════════════ */

/**
 * Each symbol has:
 *   id    — unique string identifier used in game logic
 *   label — display name
 *   icon  — require() reference to the SVG asset
 *   color — primary color extracted from the SVG for UI glow/effects
 */
export const SYMBOLS = [
  { id: 'AHURA',   label: 'Ahura',   icon: require('../assets/icons/symbol_AHURA.svg'),   color: '#8ED8F8' },
  { id: 'ARES',    label: 'Ares',    icon: require('../assets/icons/symbol_ARES.svg'),    color: '#ED2024' },
  { id: 'ASGARD',  label: 'Asgard',  icon: require('../assets/icons/symbol_ASGARD.svg'),  color: '#F8D210' },
  { id: 'ENKI',    label: 'Enki',    icon: require('../assets/icons/symbol_ENKI.svg'),    color: '#D87AB1' },
  { id: 'GAIA',    label: 'Gaia',    icon: require('../assets/icons/symbol_GAIA.svg'),    color: '#206432' },
  { id: 'HERA',    label: 'Hera',    icon: require('../assets/icons/symbol_HERA.svg'),    color: '#5F2D85' },
  { id: 'LAOZI',   label: 'Laozi',   icon: require('../assets/icons/symbol_LAOZI.svg'),   color: '#F58220' },
  { id: 'MITRA',   label: 'Mitra',   icon: require('../assets/icons/symbol_MITRA.svg'),   color: '#ABABAB' },
  { id: 'SETNA',   label: 'Setna',   icon: require('../assets/icons/symbol_SETNA.svg'),   color: '#A5CE3C' },
  { id: 'SHAMAN',  label: 'Shaman',  icon: require('../assets/icons/symbol_SHAMAN.svg'),  color: '#000001' },
  { id: 'SHIVA',   label: 'Shiva',   icon: require('../assets/icons/symbol_SHIVA.svg'),   color: '#1A5592' },
  { id: 'TITAN',   label: 'Titan',   icon: require('../assets/icons/symbol_TITAN.svg'),   color: '#914A21' },
];

/**
 * Quick lookup map: symbolId → symbol object
 */
export const SYMBOL_MAP = {};
SYMBOLS.forEach(s => { SYMBOL_MAP[s.id] = s; });

/**
 * Get the symbol object by id
 */
export function getSymbol(id) {
  return SYMBOL_MAP[id] || null;
}
