// All app colors derived from the Tailwind design system
export const colors = {
  // Primary brand color
  primary: '#256af4',

  // Backgrounds
  background: {
    dark: '#101622',
    light: '#f5f6f8',
    card: 'rgba(15, 23, 42, 0.4)',    // slate-900/40
    input: 'rgba(15, 23, 42, 0.4)',   // slate-900/40
    inputAlt: 'rgba(37, 106, 244, 0.05)', // primary/5
  },

  // Slate scale (from Tailwind)
  slate: {
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',  // slate-400
    muted: '#64748B',      // slate-500
    placeholder: '#475569', // slate-600
    highlight: '#256af4',  // primary
  },

  // Neon palette (for game elements)
  neon: {
    cyan: '#00E5FF',
    pink: '#FF00E5',
    purple: '#B000FF',
    green: '#00FF66',
    yellow: '#FFEA00',
  },

  // Border colors
  border: {
    subtle: '#1E293B',     // slate-800
    medium: '#334155',     // slate-700
    active: '#256af4',     // primary
    primaryFaded: 'rgba(37, 106, 244, 0.2)',
    primaryMedium: 'rgba(37, 106, 244, 0.3)',
    primaryStrong: 'rgba(37, 106, 244, 0.4)',
  },

  // Status colors
  status: {
    success: '#00FF66',
    error: '#FF0055',
    warning: '#FFEA00',
  },

  // Board-specific
  board: {
    tileEmpty: 'rgba(26, 35, 58, 0.6)',
    tileHover: 'rgba(0, 229, 255, 0.2)',
  },

  // Transparency helpers
  overlay: {
    primaryLight: 'rgba(37, 106, 244, 0.1)',
    primaryMedium: 'rgba(37, 106, 244, 0.2)',
    slateLight: 'rgba(30, 41, 59, 0.3)',
    slateMedium: 'rgba(30, 41, 59, 0.5)',
    slateHeavy: 'rgba(15, 23, 42, 0.8)',
  }
};
