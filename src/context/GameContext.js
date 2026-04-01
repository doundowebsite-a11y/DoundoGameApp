import React, { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { createGameStore } from './createGameStore';

const GameContext = createContext(null);

export const GameProvider = ({ initialState, children }) => {
  const storeRef = useRef();

  // Create a brand new store specifically for this GameProvider lifecycle
  if (!storeRef.current) {
    storeRef.current = createGameStore(initialState);
  }

  return (
    <GameContext.Provider value={storeRef.current}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameSelector = (selector) => {
  const store = useContext(GameContext);
  if (!store) {
    throw new Error('useGameSelector must be used within a GameProvider');
  }
  return useStore(store, selector);
};
