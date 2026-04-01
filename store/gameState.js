import React, { createContext, useReducer, useContext } from 'react';

// Initial state
const initialState = {
  board: Array(16).fill(null), // 4x4 grid
  playerHand: [],
  opponentHand: [],
  deck: [],
  score: { player: 0, opponent: 0 },
  currentTurn: 'player', // 'player' | 'opponent'
  phase: 'draw', // 'draw' | 'placement' | 'faceoff' | 'end'
  difficulty: 'EASY',
};

// Actions
export const ACTIONS = {
  INIT_GAME: 'INIT_GAME',
  PLACE_CARD: 'PLACE_CARD',
  TRIGGER_FACEOFF: 'TRIGGER_FACEOFF',
  UPDATE_SCORE: 'UPDATE_SCORE',
  END_GAME: 'END_GAME',
};

// Reducer
const gameReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INIT_GAME:
      return {
        ...initialState,
        difficulty: action.payload.difficulty || 'EASY',
        deck: action.payload.deck,
        playerHand: action.payload.playerHand,
      };
    case ACTIONS.PLACE_CARD:
      const newBoard = [...state.board];
      newBoard[action.payload.position] = action.payload.card;
      return {
        ...state,
        board: newBoard,
      };
    case ACTIONS.TRIGGER_FACEOFF:
      return {
        ...state,
        phase: 'faceoff',
      };
    case ACTIONS.UPDATE_SCORE:
      return {
        ...state,
        score: { ...state.score, ...action.payload },
      };
    default:
      return state;
  }
};

// Context
const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameState = () => useContext(GameContext);
