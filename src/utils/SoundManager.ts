import { Audio } from 'expo-av';

type SoundName = 'add' | 'complete' | 'delete';

class SoundManager {
  private sounds: Record<SoundName, Audio.Sound | null> = {
    add: null,
    complete: null,
    delete: null,
  };
  private isInitialized = false;

  async init(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      await this.loadSound('add');
      await this.loadSound('complete');
      await this.loadSound('delete');

      this.isInitialized = true;
    } catch (error) {
      console.log('Sound init error (ignoriert):', error);
      this.isInitialized = true;
    }
  }

  private async loadSound(name: SoundName): Promise<void> {
    try {
      let source;
      switch (name) {
        case 'add':
          source = require('../../assets/sounds/add.mp3');
          break;
        case 'complete':
          source = require('../../assets/sounds/complete.mp3');
          break;
        case 'delete':
          source = require('../../assets/sounds/delete.mp3');
          break;
      }

      const { sound } = await Audio.Sound.createAsync(source);
      this.sounds[name] = sound;
    } catch (error) {
      console.log(`Sound '${name}' konnte nicht geladen werden:`, error);
    }
  }

  async play(name: SoundName): Promise<void> {
    try {
      if (!this.isInitialized || !this.sounds[name]) {
        return;
      }

      await this.sounds[name]!.stopAsync();
      await this.sounds[name]!.playAsync();
    } catch (error) {
      console.log(`Sound '${name}' konnte nicht gespielt werden:`, error);
    }
  }

  async cleanup(): Promise<void> {
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        await sound.unloadAsync();
      }
    }
  }
}

export default SoundManager;
