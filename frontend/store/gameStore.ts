import { create } from 'zustand';
import { Board3x3, Player } from '../types/game';

interface Move {
  index: number;
  player: Player;
  boardState: Board3x3;
}

interface GameStore {
  moveHistory: Move[];
  canUndo: boolean;
  
  // Actions
  addMove: (index: number, player: Player, boardState: Board3x3) => void;
  undoLastMove: () => Move | null;
  clearHistory: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  moveHistory: [],
  canUndo: false,

  addMove: (index: number, player: Player, boardState: Board3x3) => {
    set((state) => ({
      moveHistory: [...state.moveHistory, { index, player, boardState }],
      canUndo: true,
    }));
  },

  undoLastMove: () => {
    const history = get().moveHistory;
    if (history.length === 0) return null;
    
    const lastMove = history[history.length - 1];
    set({
      moveHistory: history.slice(0, -1),
      canUndo: history.length > 1,
    });
    
    return lastMove;
  },

  clearHistory: () => {
    set({ moveHistory: [], canUndo: false });
  },
}));
