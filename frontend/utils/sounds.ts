import { Audio } from 'expo-av';

class SoundManager {
  private sounds: { [key: string]: Audio.Sound } = {};
  private isEnabled: boolean = false;

  async loadSounds() {
    try {
      // We'll add sound files later, for now just prepare the structure
      console.log('Sound system initialized');
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  async playMove() {
    if (!this.isEnabled) return;
    // Play move sound (to be implemented with actual audio files)
    console.log('Play move sound');
  }

  async playWin() {
    if (!this.isEnabled) return;
    // Play win sound (to be implemented with actual audio files)
    console.log('Play win sound');
  }

  async playDraw() {
    if (!this.isEnabled) return;
    // Play draw sound (to be implemented with actual audio files)
    console.log('Play draw sound');
  }

  async cleanup() {
    for (const key in this.sounds) {
      await this.sounds[key].unloadAsync();
    }
    this.sounds = {};
  }
}

export const soundManager = new SoundManager();
