import Phaser from 'phaser';
import { AudioManager } from './AudioManager';
import { COLORS, FONT_FAMILY } from '../config/Constants';

export class FeedbackManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private starEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
  }

  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
    this.starEmitter = null; // Re-create in new scene
  }

  playCorrect(x: number, y: number): void {
    this.audioManager.playCorrect();
    this.emitStarBurst(x, y, 8);
    this.showFloatingText(x, y - 40, 'Great!');
  }

  playIncorrect(target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
    this.audioManager.playError();

    const startX = target.x;
    this.scene.tweens.add({
      targets: target,
      x: startX - 6,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.inOut',
      onComplete: () => {
        target.x = startX;
      },
    });

    this.showFloatingText(target.x, target.y - 40, 'Try again!');
  }

  emitStarBurst(x: number, y: number, count: number): void {
    if (!this.starEmitter) {
      this.createStarEmitter();
    }
    this.starEmitter!.emitParticleAt(x, y, count);
  }

  playLevelComplete(): void {
    this.audioManager.playLevelComplete();
    const centerX = this.scene.cameras.main.centerX;
    const centerY = this.scene.cameras.main.centerY;
    this.emitStarBurst(centerX, centerY, 30);
    this.scene.cameras.main.flash(500, 255, 255, 200);
    this.showFloatingText(centerX, centerY - 60, 'Level Complete!');
  }

  showFloatingText(x: number, y: number, text: string): void {
    const floatText = this.scene.add.text(x, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: floatText,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => floatText.destroy(),
    });
  }

  private createStarEmitter(): void {
    this.starEmitter = this.scene.add.particles(0, 0, 'star-particle', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 800,
      gravityY: 200,
      emitting: false,
    }).setDepth(99);
  }
}
