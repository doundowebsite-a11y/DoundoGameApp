/* ═══════════════════════════════════════════════════════════════════
   SoundManager.js — Centralized audio manager for Doundo
   Uses expo-av to play game sound effects
═══════════════════════════════════════════════════════════════════ */

import { Audio } from 'expo-av';

// Sound asset registry
const SOUND_ASSETS = {
  swap: require('../assets/sounds/swap.mp3'),
  cardPick: require('../assets/sounds/card_pick.mp3'),
  shuffle: require('../assets/sounds/shuffle.mp3'),
  typing: require('../assets/sounds/typing.mp3'),
  win: require('../assets/sounds/win.mp3'),
  drawMatch: require('../assets/sounds/draw_match.mp3'),
  lose: require('../assets/sounds/lose.mp3'),
  button: require('../assets/sounds/button.mp3'),
};

class SoundManagerClass {
  constructor() {
    this.sounds = {};
    this.loaded = false;
    this.enabled = true;
  }

  async init() {
    if (this.loaded) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      // Preload all sounds
      for (const [key, asset] of Object.entries(SOUND_ASSETS)) {
        try {
          const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: false });
          this.sounds[key] = sound;
        } catch (e) {
          console.warn(`Failed to load sound: ${key}`, e);
        }
      }
      this.loaded = true;
    } catch (e) {
      console.warn('SoundManager init failed:', e);
    }
  }

  setEnabled(val) {
    this.enabled = val;
  }

  async _play(key) {
    if (!this.enabled || !this.sounds[key]) return;
    try {
      await this.sounds[key].setPositionAsync(0);
      await this.sounds[key].playAsync();
    } catch (e) {
      console.warn(`Failed to play sound: ${key}`, e);
    }
  }

  playSwap() { return this._play('swap'); }
  playCardPick() { return this._play('cardPick'); }
  playShuffle() { return this._play('shuffle'); }
  playTyping() { return this._play('typing'); }
  playWin() { return this._play('win'); }
  playDrawMatch() { return this._play('drawMatch'); }
  playLose() { return this._play('lose'); }
  playButton() { return this._play('button'); }

  async cleanup() {
    for (const sound of Object.values(this.sounds)) {
      try { await sound.unloadAsync(); } catch (e) { /* noop */ }
    }
    this.sounds = {};
    this.loaded = false;
  }
}

// Singleton
const SoundManager = new SoundManagerClass();
export default SoundManager;
