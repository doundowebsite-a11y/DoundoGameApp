import { createStore } from 'zustand';
import { gameReducer } from '../game/engine/gameReducer';

export const createGameStore = (initialState) => {
  return createStore((set, get) => ({
    ...initialState,
    
    // dispatch an action via the existing reducer
    dispatch: (action) => set((state) => {
      // Small optimization: prevent unnecessary object copying if state didn't change (reducer must handle this correctly, but mostly returning new state)
      return gameReducer(state, action);
    }),

    // explicitly overwrite entire state or partial
    setGameState: (newState) => set(newState)
  }));
};
