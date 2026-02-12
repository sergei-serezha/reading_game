import Phaser from 'phaser';
import { MUSIC_VOLUME, SFX_VOLUME } from '../config/Constants';

export class AudioManager {
  private scene: Phaser.Scene;
  private isMuted: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  playPhoneme(letter: string): void {
    this.playSfx(`phonics/${letter.toLowerCase()}`);
  }

  playWord(word: string): void {
    this.playSfx(`words/${word.toLowerCase()}`);
  }

  playSay(): void {
    this.playSfx('feedback/say');
  }

  playLetsFind(): void {
    this.playSfx('feedback/lets-find');
  }

  playCorrect(): void {
    this.playSfx('feedback/correct');
  }

  playError(): void {
    this.playSfx('feedback/error');
  }

  playLevelComplete(): void {
    this.playSfx('feedback/level-complete');
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  private playSfx(key: string): void {
    if (this.isMuted) return;
    if (this.scene.sound.get(key) || this.scene.cache.audio.exists(key)) {
      try {
        this.scene.sound.play(key, { volume: SFX_VOLUME });
      } catch {
        // Audio not loaded — silently skip
      }
    }
  }
}
