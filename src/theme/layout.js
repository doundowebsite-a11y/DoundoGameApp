import { spacing } from './spacing';

export const layout = {
  container: {
    padding: spacing.md,
  },
  board: {
    maxWidth: 600,
    aspectRatio: 1, // 4x4 square board
  },
  card: {
    aspectRatio: 0.7, // e.g., 2.5:3.5 typical playing card ratio
  }
};
