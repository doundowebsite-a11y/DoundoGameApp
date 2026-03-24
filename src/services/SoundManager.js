/* ═══════════════════════════════════════════════════════════════════
   SoundManager.js — Safe wrapper around expo-av
   Falls back silently if native module is not available
   (e.g. running in Expo Go without a dev build)
═══════════════════════════════════════════════════════════════════ */

let Audio = null;

// Try to load expo-av — will fail gracefully in Expo Go
try {
  Audio = require('expo-av').Audio;
} catch (e) {
  console.warn('expo-av not available — audio disabled. Use a dev build for sound.');
}

const SOUND_ASSETS = {
  swap:      () => require('../assets/sounds/swap.mp3'),
  cardPick:  () => require('../assets/sounds/card_pick.mp3'),
  shuffle:   () => require('../assets/sounds/shuffle.mp3'),
  typing:    () => require('../assets/sounds/typing.mp3'),
  win:       () => require('../assets/sounds/win.mp3'),
  drawMatch: () => require('../assets/sounds/draw_match.mp3'),
  lose:      () => require('../assets/sounds/lose.mp3'),
  button:    () => require('../assets/sounds/button.mp3'),
};

class SoundManagerClass {
  constructor() {
    this.sounds = {};
    this.loaded = false;
    this.enabled = true;
    this.available = !!Audio;
  }

  async init() {
    if (!this.available || this.loaded) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      for (const [key, getAsset] of Object.entries(SOUND_ASSETS)) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            getAsset(),
            { shouldPlay: false }
          );
          this.sounds[key] = sound;
        } catch (e) {
          // Individual sound failed — skip it
        }
      }
      this.loaded = true;
    } catch (e) {
      console.warn('SoundManager init failed:', e.message);
    }
  }

  setEnabled(val) { this.enabled = val; }

  async _play(key) {
    if (!this.available || !this.enabled || !this.sounds[key]) return;
    try {
      await this.sounds[key].setPositionAsync(0);
      await this.sounds[key].playAsync();
    } catch (e) {
      // Ignore playback errors silently
    }
  }

  playSwap()      { return this._play('swap'); }
  playCardPick()  { return this._play('cardPick'); }
  playShuffle()   { return this._play('shuffle'); }
  playTyping()    { return this._play('typing'); }
  playWin()       { return this._play('win'); }
  playDrawMatch() { return this._play('drawMatch'); }
  playLose()      { return this._play('lose'); }
  playButton()    { return this._play('button'); }

  async cleanup() {
    for (const sound of Object.values(this.sounds)) {
      try { await sound.unloadAsync(); } catch (e) {}
    }
    this.sounds = {};
    this.loaded = false;
  }
}

const SoundManager = new SoundManagerClass();
export default SoundManager;
