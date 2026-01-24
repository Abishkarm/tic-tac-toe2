import { create } from 'zustand';
import { Board3x3, Player } from '../types/game';

interface Move {
  index: number;
  player: Player;
  moveNumber: number;
}

interface GameStore {
  moveHistory: Move[];
  canUndo: boolean;
  moveCounter: number;
  
  // Actions
  addMove: (index: number, player: Player) => void;
  undoLastMove: () => Move | null;
  clearHistory: () => void;
  getMoveHistory: () => Move[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  moveHistory: [],
  canUndo: false,
  moveCounter: 0,

  addMove: (index: number, player: Player) => {
    set((state) => {
      const newMoveNumber = state.moveCounter + 1;
      return {
        moveHistory: [...state.moveHistory, { index, player, moveNumber: newMoveNumber }],
        canUndo: true,
        moveCounter: newMoveNumber,
      };
    });
  },

  undoLastMove: () => {
    const history = get().moveHistory;
    if (history.length === 0) return null;
    
    const lastMove = history[history.length - 1];
    set({
      moveHistory: history.slice(0, -1),
      canUndo: history.length > 1,
      moveCounter: get().moveCounter - 1,
    });
    
    return lastMove;
  },

  clearHistory: () => {
    set({ moveHistory: [], canUndo: false, moveCounter: 0 });
  },

  getMoveHistory: () => {
    return get().moveHistory;
  },
}));
