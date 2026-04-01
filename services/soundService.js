import { Audio } from 'expo-av';

let sounds = {};

export const soundService = {
  // Prepare audio engine
  init: async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      console.log('Audio Engine initialized');
    } catch (e) {
      console.log('Error initializing audio', e);
    }
  },

  // Load a sound into memory
  loadSound: async (name, uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync(uri);
      sounds[name] = sound;
    } catch (e) {
      console.log(`Error loading sound ${name}`, e);
    }
  },

  // Play named sound
  playSound: async (name) => {
    try {
      const sound = sounds[name];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (e) {
      console.log(`Error playing sound ${name}`, e);
    }
  },

  // Cleanup on unmount
  unloadAll: async () => {
    for (let key in sounds) {
      if (sounds[key]) {
        await sounds[key].unloadAsync();
      }
    }
    sounds = {};
  }
};
