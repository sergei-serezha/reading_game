import Phaser from 'phaser';
import { COLORS, MOVE_TWEEN_DURATION_MS } from '../config/Constants';

export class PlayerCharacter extends Phaser.GameObjects.Container {
  private sword: Phaser.GameObjects.Container;
  private isMoving: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Cape behind the knight
    const cape = scene.add.triangle(-8, 10, 0, 0, 20, 12, 0, 24, 0x8b1d2c).setOrigin(0.5);
    this.add(cape);

    // Armor torso
    const torso = scene.add.rectangle(0, 8, 30, 28, 0x9aa3b2);
    torso.setStrokeStyle(2, 0x4d5868);
    this.add(torso);

    // Belt
    const belt = scene.add.rectangle(0, 16, 28, 5, 0x4a3a2a);
    this.add(belt);

    // Helmet
    const helmet = scene.add.rectangle(0, -13, 26, 20, 0xc1c8d4);
    helmet.setStrokeStyle(2, 0x5a6472);
    this.add(helmet);

    // Visor slit and plume
    const visor = scene.add.rectangle(0, -13, 14, 3, 0x2d2d44);
    const plume = scene.add.triangle(0, -26, 0, 8, 10, 8, 5, -6, 0xd4a017).setOrigin(0.5);
    this.add([visor, plume]);

    // Sword
    this.sword = scene.add.container(22, -2);
    const blade = scene.add.rectangle(0, -10, 8, 30, 0xdfe5ee);
    blade.setStrokeStyle(1, 0x8a94a3);
    const tip = scene.add.triangle(0, -27, -4, 0, 4, 0, 0, -8, 0xdfe5ee).setOrigin(0.5);
    const guard = scene.add.rectangle(0, 6, 14, 4, 0xd4a017);
    const handle = scene.add.rectangle(0, 14, 5, 14, 0x3c2f24);
    this.sword.add([blade, tip, guard, handle]);
    this.sword.setAngle(20);
    this.add(this.sword);

    this.setSize(64, 64);
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

  playSlashAnimation(onComplete?: () => void): void {
    this.scene.tweens.killTweensOf(this.sword);
    this.scene.tweens.add({
      targets: this.sword,
      angle: -55,
      duration: 90,
      ease: 'Sine.out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sword,
          angle: 70,
          duration: 130,
          ease: 'Cubic.in',
          onComplete: () => {
            this.scene.tweens.add({
              targets: this.sword,
              angle: 20,
              duration: 90,
              ease: 'Sine.out',
              onComplete: () => onComplete?.(),
            });
          },
        });
      },
    });

    this.scene.tweens.add({
      targets: this,
      x: this.x + 4,
      duration: 110,
      yoyo: true,
      ease: 'Sine.inOut',
    });
  }
}
