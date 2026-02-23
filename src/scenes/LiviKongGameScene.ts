import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../config/Constants';
import { ArcadeGameConfig } from '../types/ArcadeTypes';

interface Barrel {
  body: Phaser.GameObjects.Arc;
  band: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
}

export class LiviKongGameScene extends Phaser.Scene {
  private gameConfig: ArcadeGameConfig;
  private returnScene: string;
  private returnData: unknown;

  private mario!: Phaser.GameObjects.Container;
  private marioX: number = GAME_WIDTH / 2;
  private marioY: number = GAME_HEIGHT - 102;
  private marioInHole: boolean = false;
  private marioJumping: boolean = false;
  private marioLanding: boolean = false;
  private marioCanFastLand: boolean = false;
  private marioAutoLandEvent: Phaser.Time.TimerEvent | null = null;
  private holeUnderMario: number = -1;
  private isWinningRun: boolean = false;

  private barrels: Barrel[] = [];
  private barrelStepEvent: Phaser.Time.TimerEvent | null = null;
  private barrelSpawnEvent: Phaser.Time.TimerEvent | null = null;
  private barrelStepDelayMs: number = 170;
  private barrelSpawnDelayMs: number = 1200;

  private score: number = 0;
  private targetScore: number = 16;
  private isGameOver: boolean = false;

  private scoreText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private speedValueText!: Phaser.GameObjects.Text;
  private sliderMinX: number = 0;
  private sliderMaxX: number = 0;
  private speedKnob!: Phaser.GameObjects.Arc;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | null = null;
  private holes: Array<{ x: number; y: number; radius: number; rim: Phaser.GameObjects.Arc }> = [];
  private roadY: number = GAME_HEIGHT - 76;
  private lkLegGapX: number = 146;
  private finishLineX: number = 104;
  private throwHandX: number = 70;
  private throwHandY: number = 246;
  private throwHand: Phaser.GameObjects.Arc | null = null;

  constructor() {
    super({ key: 'LiviKongGameScene' });
  }

  init(data: { gameConfig: ArcadeGameConfig; returnScene: string; returnData: unknown }): void {
    this.gameConfig = data.gameConfig;
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
  }

  create(): void {
    this.isGameOver = false;
    this.isWinningRun = false;
    this.marioInHole = false;
    this.marioJumping = false;
    this.holeUnderMario = -1;
    this.barrels = [];
    this.score = 0;

    this.buildBackdrop();
    this.buildLiviKong();
    this.buildGroundAndHoles();
    this.buildMario();
    this.buildHudAndSlider();

    if (this.input.keyboard) {
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.D,
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.S,
      ]);

      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      };
    }

    this.applyBarrelSpeed(1);
  }

  update(): void {
    if (this.isGameOver || this.isWinningRun) return;
    this.handleInput();
  }

  private buildBackdrop(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x4f8fff, 0x4f8fff, 0x6bc0ff, 0x6bc0ff, 1);
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.add.rectangle(GAME_WIDTH / 2, 148, GAME_WIDTH, 130, 0x89d6ff).setAlpha(0.45);
    this.add.ellipse(120, 228, 240, 88, 0x4d8f5e).setAlpha(0.75);
    this.add.ellipse(600, 230, 320, 108, 0x4d8f5e).setAlpha(0.72);
    this.add.ellipse(GAME_WIDTH * 0.5, GAME_HEIGHT - 170, GAME_WIDTH * 1.2, 170, 0x3f7d3f).setAlpha(0.45);

    this.add.text(GAME_WIDTH / 2, 20, 'LIVI KONG', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#ffde6a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
  }

  private buildLiviKong(): void {
    const lkX = 146;
    const lkY = 230;
    this.lkLegGapX = lkX;

    // Large monkey silhouette on the right side.
    this.add.ellipse(lkX, lkY + 30, 270, 250, 0x6c3a1f).setStrokeStyle(5, 0x2d1305);
    this.add.circle(lkX + 8, lkY - 82, 62, 0x744221).setStrokeStyle(5, 0x2d1305);
    this.add.circle(lkX - 36, lkY - 102, 20, 0x6c3a1f).setStrokeStyle(4, 0x2d1305);
    this.add.circle(lkX + 56, lkY - 102, 20, 0x6c3a1f).setStrokeStyle(4, 0x2d1305);
    this.add.circle(lkX - 10, lkY - 86, 9, 0x0f0f0f);
    this.add.circle(lkX + 28, lkY - 86, 9, 0x0f0f0f);
    this.add.ellipse(lkX + 8, lkY - 58, 56, 28, 0xb67a4e).setStrokeStyle(3, 0x5d3115);

    // Arms framing the road.
    this.add.rectangle(lkX - 98, lkY + 44, 52, 146, 0x5d2f16).setStrokeStyle(4, 0x2d1305).setAngle(-18);
    this.add.rectangle(lkX + 102, lkY + 44, 52, 146, 0x5d2f16).setStrokeStyle(4, 0x2d1305).setAngle(14);
    this.throwHandX = lkX - 112;
    this.throwHandY = lkY + 22;
    this.throwHand = this.add.circle(this.throwHandX, this.throwHandY, 16, 0x5d2f16)
      .setStrokeStyle(4, 0x2d1305)
      .setDepth(30);

    // Legs with space to crawl through.
    this.add.rectangle(lkX - 56, lkY + 178, 86, 214, 0x5d2f16).setStrokeStyle(5, 0x2d1305);
    this.add.rectangle(lkX + 56, lkY + 178, 86, 214, 0x5d2f16).setStrokeStyle(5, 0x2d1305);
    // Keep a visible arch gap for Mario to pass through.
    this.add.rectangle(lkX, lkY + 188, 38, 156, 0x2e5f2a).setAlpha(0.25);

    this.add.text(lkX + 8, lkY - 14, 'LK', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#ffe5a8',
      stroke: '#2d1305',
      strokeThickness: 4,
    }).setOrigin(0.5);
  }

  private buildGroundAndHoles(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH, 240, 0x4f555f);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 108, GAME_WIDTH - 40, 192, 0x6f7482)
      .setStrokeStyle(2, 0xa8b0c5)
      .setAlpha(0.82);

    // MarioKart-like lane striping.
    this.add.rectangle(GAME_WIDTH / 2, this.roadY, GAME_WIDTH - 80, 78, 0x545b67)
      .setStrokeStyle(2, 0x8994a8)
      .setAlpha(0.95);
    for (let x = 70; x < GAME_WIDTH - 50; x += 64) {
      this.add.rectangle(x, this.roadY, 26, 4, 0xd9deea).setAlpha(0.7);
    }

    const y = this.roadY + 18;
    const holeXs = [180, 315, 450, 585];
    this.holes = holeXs.map(x => {
      const rim = this.add.circle(x, y, 24, 0x1c2330).setStrokeStyle(3, 0x0e131b);
      this.add.circle(x, y + 2, 16, 0x0a0d14).setAlpha(0.85);
      return { x, y, radius: 24, rim };
    });

    // Visual marker on the left edge (large sign).
    const signX = 44;
    const signY = this.roadY - 62;
    this.add.rectangle(signX, signY + 52, 10, 110, 0x4a311c);
    this.add.rectangle(signX, signY, 120, 78, 0xfff2a6).setStrokeStyle(4, 0x6b5a26);
    this.add.text(signX, signY, 'FINISH', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#3d3216',
    }).setOrigin(0.5);
    this.finishLineX = signX + 60;
  }

  private buildMario(): void {
    this.marioX = GAME_WIDTH - 76;
    this.marioY = this.roadY - 10;

    this.mario = this.add.container(this.marioX, this.marioY);
    const cap = this.add.rectangle(0, -16, 26, 10, 0xff3d3d).setStrokeStyle(2, 0x7c1d1d);
    const head = this.add.circle(0, -8, 8, 0xffd19b).setStrokeStyle(1, 0x9d7d5f);
    const body = this.add.rectangle(0, 8, 22, 26, 0x2f6eff).setStrokeStyle(2, 0x1e3f93);
    const legL = this.add.rectangle(-5, 25, 7, 14, 0x5b3d26);
    const legR = this.add.rectangle(5, 25, 7, 14, 0x5b3d26);
    this.mario.add([cap, head, body, legL, legR]);
    this.mario.setDepth(20);
  }

  private buildHudAndSlider(): void {
    this.scoreText = this.add.text(36, 52, `Distance: 0/${this.targetScore}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.statusText = this.add.text(GAME_WIDTH - 36, 52, 'Avoid barrels, reach LK legs', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#f2f6ff',
    }).setOrigin(1, 0.5);

    const sliderY = GAME_HEIGHT - 28;
    const sliderW = 250;
    const sliderX = GAME_WIDTH / 2;
    this.sliderMinX = sliderX - sliderW / 2;
    this.sliderMaxX = sliderX + sliderW / 2;

    this.add.text(sliderX, sliderY - 12, 'Barrel speed', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#f2f6ff',
    }).setOrigin(0.5);

    this.speedValueText = this.add.text(sliderX, sliderY + 16, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#f2f6ff',
    }).setOrigin(0.5);

    const track = this.add.rectangle(sliderX, sliderY, sliderW, 8, 0x33507a).setStrokeStyle(2, 0x6fa4ff);
    track.setInteractive({ useHandCursor: true });

    this.speedKnob = this.add.circle(sliderX, sliderY, 11, 0x4aa3ff).setStrokeStyle(2, 0xb8dcff);
    this.speedKnob.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(this.speedKnob);

    const updateFromPointerX = (pointerX: number) => {
      const x = Phaser.Math.Clamp(pointerX, this.sliderMinX, this.sliderMaxX);
      const t = (x - this.sliderMinX) / (this.sliderMaxX - this.sliderMinX);
      const step = Phaser.Math.Linear(0, 3, t);
      this.applyBarrelSpeed(step);
    };

    track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      updateFromPointerX(pointer.x);
    });

    this.speedKnob.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      updateFromPointerX(dragX);
    });

    this.add.text(this.sliderMinX, sliderY + 28, 'Slow', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#8fc2ff',
    }).setOrigin(0, 0.5);

    this.add.text(this.sliderMaxX, sliderY + 28, 'Fast', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#8fc2ff',
    }).setOrigin(1, 0.5);
  }

  private handleInput(): void {
    if (!this.cursors) return;
    const justDown = (key?: Phaser.Input.Keyboard.Key): boolean => !!key && Phaser.Input.Keyboard.JustDown(key);

    if (justDown(this.cursors.left) || justDown(this.wasd?.left)) {
      this.moveMario(-44);
    } else if (justDown(this.cursors.right) || justDown(this.wasd?.right)) {
      this.moveMario(44);
    } else if (justDown(this.cursors.up) || justDown(this.wasd?.up)) {
      this.jumpMario();
    } else if (justDown(this.cursors.down) || justDown(this.wasd?.down)) {
      this.fastLandMario();
    }
  }

  private moveMario(dx: number): void {
    if (this.marioJumping) return;
    if (this.isWinningRun) return;
    const nextX = Phaser.Math.Clamp(this.marioX + dx, 56, GAME_WIDTH - 52);
    this.marioX = nextX;
    this.mario.setX(this.marioX);
    this.updateHoleState();

    // Win when the player crosses the finish sign area on the left.
    if (dx < 0 && this.marioX <= this.finishLineX) {
      this.startWinningRun();
    }
  }

  private jumpMario(): void {
    if (this.marioJumping) return;

    if (this.marioInHole) {
      this.marioInHole = false;
      this.holeUnderMario = -1;
      this.mario.setY(this.marioY);
      this.mario.setScale(1, 1);
      this.mario.setAlpha(1);
    }

    this.marioJumping = true;
    this.marioLanding = false;
    this.marioCanFastLand = false;
    this.marioAutoLandEvent?.remove(false);
    this.marioAutoLandEvent = null;
    this.tweens.add({
      targets: this.mario,
      y: this.marioY - 78,
      duration: 440,
      ease: 'Sine.out',
      onComplete: () => {
        this.marioCanFastLand = true;
        this.marioAutoLandEvent = this.time.delayedCall(1040, () => {
          this.startLandingMario();
        });
      },
    });
  }

  private fastLandMario(): void {
    if (!this.marioJumping || !this.marioCanFastLand || this.marioLanding) return;
    this.startLandingMario();
  }

  private startLandingMario(): void {
    if (!this.marioJumping || this.marioLanding) return;
    this.marioAutoLandEvent?.remove(false);
    this.marioAutoLandEvent = null;
    this.marioCanFastLand = false;
    this.marioLanding = true;

    this.tweens.add({
      targets: this.mario,
      y: this.marioY,
      duration: 440,
      ease: 'Sine.in',
      onComplete: () => {
        this.marioJumping = false;
        this.marioLanding = false;
        this.updateHoleState();
      },
    });
  }

  private updateHoleState(): void {
    if (this.marioJumping || this.isWinningRun) return;

    const idx = this.holes.findIndex(h => Math.abs(h.x - this.marioX) < 20);
    if (idx >= 0) {
      this.marioInHole = true;
      this.holeUnderMario = idx;
      this.mario.setY(this.marioY + 11);
      this.mario.setScale(1, 0.68);
      this.mario.setAlpha(0.8);
    } else {
      this.marioInHole = false;
      this.holeUnderMario = -1;
      this.mario.setY(this.marioY);
      this.mario.setScale(1, 1);
      this.mario.setAlpha(1);
    }
  }

  private applyBarrelSpeed(step: number): void {
    const clamped = Phaser.Math.Clamp(Math.round(step), 0, 3);
    const labels = ['Slow', 'Normal', 'Fast', 'Very Fast'];
    this.speedValueText.setText(`Barrels: ${labels[clamped]}`);
    this.speedKnob.x = Phaser.Math.Linear(this.sliderMinX, this.sliderMaxX, clamped / 3);

    this.barrelStepDelayMs = Phaser.Math.Linear(260, 110, clamped / 3);
    // Wider spacing between barrels at every speed.
    this.barrelSpawnDelayMs = Phaser.Math.Linear(2200, 1050, clamped / 3);

    this.barrelStepEvent?.remove(false);
    this.barrelSpawnEvent?.remove(false);

    this.barrelStepEvent = this.time.addEvent({
      delay: this.barrelStepDelayMs,
      loop: true,
      callback: this.stepBarrels,
      callbackScope: this,
    });

    this.barrelSpawnEvent = this.time.addEvent({
      delay: this.barrelSpawnDelayMs,
      loop: true,
      callback: this.spawnBarrel,
      callbackScope: this,
    });
  }

  private spawnBarrel(): void {
    if (this.isGameOver || this.isWinningRun) return;
    // Prevent barrels from clustering at the spawn edge.
    if (this.barrels.some(b => b.x < 150)) return;

    this.animateThrow();
    const x = this.throwHandX - 8;
    const y = this.roadY - 2;
    const body = this.add.circle(x, y, 12, 0x8f4f24).setStrokeStyle(3, 0x3c1f0f).setDepth(16);
    const band = this.add.rectangle(x, y, 20, 4, 0xd39c64).setDepth(17);
    this.barrels.push({ body, band, x, y });
  }

  private stepBarrels(): void {
    if (this.isGameOver || this.isWinningRun) return;

    const speed = this.barrelStepDelayMs <= 140 ? 14 : this.barrelStepDelayMs <= 190 ? 11 : 8;

    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const barrel = this.barrels[i];
      barrel.x += speed;
      barrel.body.setX(barrel.x);
      barrel.band.setX(barrel.x);
      barrel.body.rotation += 0.33;
      barrel.band.rotation += 0.33;

      if (this.isBarrelHittingMario(barrel)) {
        this.loseGame();
        return;
      }

      if (barrel.x > GAME_WIDTH + 30) {
        this.destroyBarrel(i);
        this.score += 1;
        this.scoreText.setText(`Distance: ${this.score}/${this.targetScore}`);
      }
    }
  }

  private isBarrelHittingMario(barrel: Barrel): boolean {
    // Potholes are safe cover: barrels roll past the player.
    if (this.marioJumping || this.marioInHole || this.isWinningRun) return false;
    const closeX = Math.abs(barrel.x - this.marioX) < 20;
    const closeY = Math.abs(barrel.y - this.marioY) < 24;
    return closeX && closeY;
  }

  private startWinningRun(): void {
    if (this.isGameOver || this.isWinningRun) return;
    this.isWinningRun = true;
    this.statusText.setText('Crawl under LK legs!');
    this.clearBarrels();

    this.tweens.add({
      targets: this.mario,
      x: this.finishLineX - 20,
      y: this.marioY + 6,
      duration: 450,
      ease: 'Sine.inOut',
      onComplete: () => this.winGame(),
    });
  }

  private animateThrow(): void {
    if (!this.throwHand || this.isGameOver || this.isWinningRun) return;
    this.tweens.killTweensOf(this.throwHand);
    this.throwHand.setPosition(this.throwHandX, this.throwHandY);
    this.tweens.add({
      targets: this.throwHand,
      x: this.throwHandX - 24,
      y: this.throwHandY - 8,
      duration: 90,
      yoyo: true,
      ease: 'Sine.inOut',
    });
  }

  private winGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.marioAutoLandEvent?.remove(false);
    this.marioAutoLandEvent = null;
    this.barrelStepEvent?.remove(false);
    this.barrelSpawnEvent?.remove(false);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 120, 92, 0x0b1930, 0.88)
      .setStrokeStyle(3, 0xffde6a)
      .setDepth(100);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Congratulations! You beat The Great Livi Kong!', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#fff2ae',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 160 },
    }).setOrigin(0.5).setDepth(101);

    this.time.delayedCall(1200, () => {
      this.scene.start('RewardScene', {
        message: 'Congratulations! You beat The Great Livi Kong!',
        nextScene: this.returnScene,
        nextData: this.returnData,
      });
    });
  }

  private loseGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.marioAutoLandEvent?.remove(false);
    this.marioAutoLandEvent = null;
    this.barrelStepEvent?.remove(false);
    this.barrelSpawnEvent?.remove(false);
    this.statusText.setText('Barrel hit! Game over.');

    this.tweens.add({
      targets: this.mario,
      alpha: 0,
      duration: 180,
      yoyo: true,
      repeat: 4,
    });

    this.time.delayedCall(550, () => {
      const panel = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 340, 110, 0x0b1930, 0.9)
        .setStrokeStyle(3, 0xff6a6a)
        .setDepth(120);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'Game Over', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#ffd0d0',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(121);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2, 'Barrel touched Mario', {
        fontFamily: FONT_FAMILY,
        fontSize: '9px',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(121);

      const restartBtn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 150, 26, 0x305f35)
        .setStrokeStyle(2, 0x7dff8a)
        .setInteractive({ useHandCursor: true })
        .setDepth(121);
      const restartLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'Restart', {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: '#e9ffe9',
      }).setOrigin(0.5).setDepth(122);

      const restart = () => {
        panel.destroy();
        restartBtn.destroy();
        restartLabel.destroy();
        this.scene.restart({
          gameConfig: this.gameConfig,
          returnScene: this.returnScene,
          returnData: this.returnData,
        });
      };

      restartBtn.on('pointerdown', restart);
      this.input.keyboard?.once('keydown-R', restart);
      this.input.keyboard?.once('keydown-SPACE', restart);
    });
  }

  private destroyBarrel(index: number): void {
    const barrel = this.barrels[index];
    barrel.body.destroy();
    barrel.band.destroy();
    this.barrels.splice(index, 1);
  }

  private clearBarrels(): void {
    for (const b of this.barrels) {
      b.body.destroy();
      b.band.destroy();
    }
    this.barrels = [];
  }
}
