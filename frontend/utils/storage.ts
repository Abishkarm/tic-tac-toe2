import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, Score } from '../types/game';

const KEYS = {
  SETTINGS: '@tictactoe_settings',
  SCORE: '@tictactoe_score',
  LAST_PAGE: '@tictactoe_last_page',
};

export const storage = {
  // Settings
  async getSettings(): Promise<Settings | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  },

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  // Score
  async getScore(): Promise<Score | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SCORE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading score:', error);
      return null;
    }
  },

  async saveScore(score: Score): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SCORE, JSON.stringify(score));
    } catch (error) {
      console.error('Error saving score:', error);
    }
  },

  async resetScore(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.SCORE);
    } catch (error) {
      console.error('Error resetting score:', error);
    }
  },

  // Last page
  async getLastPage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.LAST_PAGE);
    } catch (error) {
      console.error('Error loading last page:', error);
      return null;
    }
  },

  async saveLastPage(page: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_PAGE, page);
    } catch (error) {
      console.error('Error saving last page:', error);
    }
  },
};
