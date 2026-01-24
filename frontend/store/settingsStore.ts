import { create } from 'zustand';
import { Settings, Score } from '../types/game';
import { storage } from '../utils/storage';
import * as Haptics from 'expo-haptics';

interface SettingsStore {
  // Settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showScore: boolean;
  showReplayButton: boolean;
  lastPage: string;
  
  // Score
  score: Score;
  
  // Actions
  toggleSound: () => void;
  toggleVibration: () => void;
  toggleShowScore: () => void;
  toggleShowReplayButton: () => void;
  setLastPage: (page: string) => void;
  updateScore: (winner: 'X' | 'O' | 'draw') => void;
  resetScore: () => void;
  loadSettings: () => Promise<void>;
  triggerVibration: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Default settings (muted on first launch)
  soundEnabled: false,
  vibrationEnabled: false,
  showScore: true,
  showReplayButton: true,
  lastPage: '/game-3x3',
  
  score: {
    playerX: 0,
    playerO: 0,
    draws: 0,
  },

  toggleSound: () => {
    set((state) => {
      const newValue = !state.soundEnabled;
      storage.saveSettings({
        soundEnabled: newValue,
        vibrationEnabled: state.vibrationEnabled,
        showScore: state.showScore,
        lastPage: state.lastPage,
      });
      return { soundEnabled: newValue };
    });
  },

  toggleVibration: () => {
    set((state) => {
      const newValue = !state.vibrationEnabled;
      storage.saveSettings({
        soundEnabled: state.soundEnabled,
        vibrationEnabled: newValue,
        showScore: state.showScore,
        lastPage: state.lastPage,
      });
      return { vibrationEnabled: newValue };
    });
  },

  toggleShowScore: () => {
    set((state) => {
      const newValue = !state.showScore;
      storage.saveSettings({
        soundEnabled: state.soundEnabled,
        vibrationEnabled: state.vibrationEnabled,
        showScore: newValue,
        lastPage: state.lastPage,
      });
      return { showScore: newValue };
    });
  },

  setLastPage: (page: string) => {
    set({ lastPage: page });
    storage.saveLastPage(page);
    storage.saveSettings({
      soundEnabled: get().soundEnabled,
      vibrationEnabled: get().vibrationEnabled,
      showScore: get().showScore,
      lastPage: page,
    });
  },

  updateScore: (winner: 'X' | 'O' | 'draw') => {
    set((state) => {
      const newScore = { ...state.score };
      if (winner === 'X') newScore.playerX++;
      else if (winner === 'O') newScore.playerO++;
      else newScore.draws++;
      
      storage.saveScore(newScore);
      return { score: newScore };
    });
  },

  resetScore: () => {
    const newScore = { playerX: 0, playerO: 0, draws: 0 };
    set({ score: newScore });
    storage.resetScore();
  },

  loadSettings: async () => {
    const settings = await storage.getSettings();
    const score = await storage.getScore();
    const lastPage = await storage.getLastPage();

    if (settings) {
      set({
        soundEnabled: settings.soundEnabled,
        vibrationEnabled: settings.vibrationEnabled,
        showScore: settings.showScore,
        lastPage: settings.lastPage || '/game-3x3',
      });
    }

    if (score) {
      set({ score });
    }

    if (lastPage) {
      set({ lastPage });
    }
  },

  triggerVibration: () => {
    if (get().vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
}));
