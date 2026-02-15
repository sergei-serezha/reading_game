import Phaser from 'phaser';

export class MonkeyHelper extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const body = scene.add.circle(0, 0, 12, 0x8b5a2b);
    body.setStrokeStyle(2, 0x4d2e12);
    const face = scene.add.circle(0, -2, 7, 0xd9b38c);
    const earL = scene.add.circle(-7, -8, 3, 0x8b5a2b);
    const earR = scene.add.circle(7, -8, 3, 0x8b5a2b);
    const eyeL = scene.add.circle(-3, -3, 1.2, 0x111111);
    const eyeR = scene.add.circle(3, -3, 1.2, 0x111111);
    const tail = scene.add.circle(-12, 3, 5, 0x8b5a2b);

    this.add([tail, earL, earR, body, face, eyeL, eyeR]);
    this.setSize(26, 26);
    scene.add.existing(this);
  }

  followKnight(targetX: number, targetY: number): void {
    this.setPosition(targetX + 26, targetY - 8);
  }

  walkTo(targetX: number, targetY: number, onComplete?: () => void, duration: number = 220): void {
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Sine.inOut',
      onComplete: () => onComplete?.(),
    });
  }

  jumpTo(targetX: number, targetY: number, onComplete?: () => void, duration: number = 280): void {
    const startX = this.x;
    const startY = this.y;
    const arcHeight = 26;

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: 'Sine.inOut',
      onUpdate: tween => {
        const t = Number(tween.getValue());
        this.x = Phaser.Math.Linear(startX, targetX, t);
        this.y = Phaser.Math.Linear(startY, targetY, t) - Math.sin(Math.PI * t) * arcHeight;
      },
      onComplete: () => {
        this.setPosition(targetX, targetY);
        onComplete?.();
      },
    });
  }
}
