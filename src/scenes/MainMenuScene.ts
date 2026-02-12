import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/Constants';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Title
    this.add.text(centerX, centerY - 120, 'Reading', {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 60, 'Adventure', {
      fontFamily: FONT_FAMILY,
      fontSize: '36px',
      color: COLORS.TEXT_PRIMARY,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Decorative letters floating
    const letters = ['A', 'B', 'C', 'D', 'E'];
    letters.forEach((letter, i) => {
      const lx = centerX - 160 + i * 80;
      const ly = centerY + 10;
      const t = this.add.text(lx, ly, letter, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#6a6aff',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: t,
        y: ly - 10,
        duration: 1000 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });

    // Play button
    const playBtn = this.add.rectangle(centerX, centerY + 100, 200, 60, COLORS.TILE_HIGHLIGHTED);
    playBtn.setStrokeStyle(3, 0xaaaaff);
    playBtn.setInteractive({ useHandCursor: true });

    const playText = this.add.text(centerX, centerY + 100, 'PLAY', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5);

    playBtn.on('pointerover', () => {
      playBtn.setFillStyle(0x8888ff);
      this.tweens.add({ targets: [playBtn, playText], scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    playBtn.on('pointerout', () => {
      playBtn.setFillStyle(COLORS.TILE_HIGHLIGHTED);
      this.tweens.add({ targets: [playBtn, playText], scaleX: 1, scaleY: 1, duration: 100 });
    });

    playBtn.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });

    // Keyboard support
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('LevelSelectScene');
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
