import Phaser from 'phaser';
import { COLORS, MOVE_TWEEN_DURATION_MS } from '../config/Constants';

export class PlayerCharacter extends Phaser.GameObjects.Container {
  private body_circle: Phaser.GameObjects.Arc;
  private eyes: Phaser.GameObjects.Arc[];
  private isMoving: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Main body - a friendly circle
    this.body_circle = scene.add.circle(0, 0, 24, COLORS.PLAYER);
    this.body_circle.setStrokeStyle(3, 0xff4444);
    this.add(this.body_circle);

    // Eyes
    const leftEye = scene.add.circle(-8, -6, 4, 0xffffff);
    const rightEye = scene.add.circle(8, -6, 4, 0xffffff);
    const leftPupil = scene.add.circle(-8, -6, 2, 0x333333);
    const rightPupil = scene.add.circle(8, -6, 2, 0x333333);
    this.eyes = [leftEye, rightEye, leftPupil, rightPupil];
    this.add([leftEye, rightEye, leftPupil, rightPupil]);

    // Mouth - a small smile
    const mouth = scene.add.arc(0, 4, 8, 0, 180, false, 0xff4444);
    this.add(mouth);

    this.setSize(48, 48);
    scene.add.existing(this);

    // Idle bobbing animation
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  getIsMoving(): boolean {
    return this.isMoving;
  }

  moveToPosition(targetX: number, targetY: number, onComplete?: () => void): void {
    if (this.isMoving) return;
    this.isMoving = true;

    // Stop idle animation during movement
    this.scene.tweens.killTweensOf(this);

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration: MOVE_TWEEN_DURATION_MS,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false;

        // Restart idle bobbing at new position
        this.scene.tweens.add({
          targets: this,
          y: targetY - 4,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });

        onComplete?.();
      },
    });
  }

  playCelebration(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      repeat: 2,
      ease: 'Back.easeOut',
    });
  }
}
