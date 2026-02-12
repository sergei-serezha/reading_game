import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, CORRECT_ANSWERS_FOR_ARCADE } from '../config/Constants';

export class ProgressBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private stars: Phaser.GameObjects.Text;
  private barWidth: number;
  private barHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number = 200, height: number = 20) {
    super(scene, x, y);

    this.barWidth = width;
    this.barHeight = height;

    // Background
    this.bg = scene.add.rectangle(0, 0, width, height, 0x333355);
    this.bg.setStrokeStyle(2, 0x666688);
    this.bg.setOrigin(0, 0.5);
    this.add(this.bg);

    // Fill
    this.fill = scene.add.rectangle(0, 0, 0, height - 4, COLORS.TILE_HIGHLIGHTED);
    this.fill.setOrigin(0, 0.5);
    this.add(this.fill);

    // Star icon + label
    this.stars = scene.add.text(-24, 0, '\u2605', {
      fontSize: '18px',
      color: COLORS.TEXT_ACCENT,
    }).setOrigin(0.5);
    this.add(this.stars);

    // Count label
    this.label = scene.add.text(width / 2, 0, '0/5', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5);
    this.add(this.label);

    scene.add.existing(this);
  }

  updateProgress(current: number, target: number = CORRECT_ANSWERS_FOR_ARCADE): void {
    const progress = Math.min(current / target, 1);
    this.fill.width = (this.barWidth - 4) * progress;
    this.label.setText(`${current}/${target}`);

    // Pulse animation when close to reward
    if (current >= target - 1 && current > 0) {
      this.scene.tweens.add({
        targets: this.stars,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
  }
}
