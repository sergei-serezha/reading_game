import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../config/Constants';
import { ArcadeGameConfig } from '../types/ArcadeTypes';

type Dir = -1 | 1;

interface MovingLane {
  row: number;
  dir: Dir;
  speed: number;
  segments: Array<{ col: number; len: number; sprite: Phaser.GameObjects.Rectangle }>;
}

const COLS = 13;
const ROWS = 10;
const CELL = 40;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const BOARD_X = Math.floor((GAME_WIDTH - BOARD_W) / 2);
const BOARD_Y = 72;

export class FroggerGameScene extends Phaser.Scene {
  private gameConfig: ArcadeGameConfig;
  private returnScene: string;
  private returnData: unknown;

  private frog: Phaser.GameObjects.Container;
  private frogRow: number = ROWS - 1;
  private frogCol: number = Math.floor(COLS / 2);
  private frogMoving: boolean = false;

  private cars: MovingLane[] = [];
  private laneTimer: Phaser.Time.TimerEvent | null = null;
  private laneTickCount: number = 0;
  private carMoveEveryTicks: number = 2;
  private carSpeedValueText: Phaser.GameObjects.Text;
  private carSpeedTrack: Phaser.GameObjects.Rectangle;
  private carSpeedKnob: Phaser.GameObjects.Arc;
  private carSliderMinX: number = 0;
  private carSliderMaxX: number = 0;

  private score: number = 0;
  private isGameOver: boolean = false;

  private scoreText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | null = null;

  constructor() {
    super({ key: 'FroggerGameScene' });
  }

  init(data: { gameConfig: ArcadeGameConfig; returnScene: string; returnData: unknown }): void {
    this.gameConfig = data.gameConfig;
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
  }

  create(): void {
    this.score = 0;
    this.isGameOver = false;
    this.laneTickCount = 0;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x101026);
    this.add.text(GAME_WIDTH / 2, 24, 'FROGGER', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#7dff6a',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.scoreText = this.add.text(BOARD_X, 52, 'Score: 0', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.statusText = this.add.text(BOARD_X + BOARD_W, 52, 'Cross all 8 lanes', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#aabbee',
    }).setOrigin(1, 0.5);

    const sliderY = BOARD_Y + BOARD_H + 14;
    const sliderW = 260;
    const sliderX = GAME_WIDTH / 2;
    this.carSliderMinX = sliderX - sliderW / 2;
    this.carSliderMaxX = sliderX + sliderW / 2;

    this.add.text(sliderX, sliderY - 10, 'Car speed', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#d9def5',
    }).setOrigin(0.5, 0.5);

    this.carSpeedValueText = this.add.text(sliderX, sliderY + 16, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#d9def5',
    }).setOrigin(0.5, 0.5);

    this.carSpeedTrack = this.add.rectangle(sliderX, sliderY, sliderW, 8, 0x33507a);
    this.carSpeedTrack.setStrokeStyle(2, 0x6fa4ff);
    this.carSpeedTrack.setInteractive({ useHandCursor: true });

    this.carSpeedKnob = this.add.circle(sliderX, sliderY, 11, 0x4aa3ff).setStrokeStyle(2, 0xb8dcff);
    this.carSpeedKnob.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(this.carSpeedKnob);

    const updateFromPointerX = (pointerX: number) => {
      const x = Phaser.Math.Clamp(pointerX, this.carSliderMinX, this.carSliderMaxX);
      const t = (x - this.carSliderMinX) / (this.carSliderMaxX - this.carSliderMinX);
      const speedStep = Phaser.Math.Linear(0, 3, t);
      this.setCarSpeedStep(speedStep);
    };

    this.carSpeedTrack.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      updateFromPointerX(pointer.x);
    });

    this.carSpeedKnob.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      updateFromPointerX(dragX);
    });

    this.add.text(this.carSliderMinX, sliderY + 28, 'Slow', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#8fc2ff',
    }).setOrigin(0, 0.5);

    this.add.text(this.carSliderMaxX, sliderY + 28, 'Fast', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#8fc2ff',
    }).setOrigin(1, 0.5);

    this.drawBoard();
    this.setupLanes();
    this.spawnFrog();

    if (this.input.keyboard) {
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D,
      ]);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.laneTimer = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: this.stepLanes,
      callbackScope: this,
    });

    this.setCarSpeedStep(1);
  }

  update(): void {
    if (this.isGameOver || this.frogMoving) return;
    if (!this.cursors) return;

    const justDown = (key?: Phaser.Input.Keyboard.Key): boolean => !!key && Phaser.Input.Keyboard.JustDown(key);

    if (justDown(this.cursors.up) || justDown(this.wasd?.up)) this.tryMoveFrog(0, -1);
    else if (justDown(this.cursors.down) || justDown(this.wasd?.down)) this.tryMoveFrog(0, 1);
    else if (justDown(this.cursors.left) || justDown(this.wasd?.left)) this.tryMoveFrog(-1, 0);
    else if (justDown(this.cursors.right) || justDown(this.wasd?.right)) this.tryMoveFrog(1, 0);
  }

  private drawBoard(): void {
    const g = this.add.graphics();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = BOARD_X + c * CELL;
        const y = BOARD_Y + r * CELL;

        // Goal row
        if (r === 0) g.fillStyle(0x1b4732, 1);
        // Road lanes
        else if (r >= 1 && r <= 8) g.fillStyle(0x2c2c2c, 1);
        // Bottom safe row
        else g.fillStyle(0x20452b, 1);

        g.fillRect(x, y, CELL, CELL);
        g.lineStyle(1, 0x1a1a33, 0.35);
        g.strokeRect(x, y, CELL, CELL);
      }
    }
  }

  private setupLanes(): void {
    // Eight road lanes (rows 1..8), no water lanes.
    this.cars = [
      this.createLane(8, -1, 1, [
        { col: 2, len: 2 },
        { col: 8, len: 2 },
      ], 0xff6b6b),
      this.createLane(7, 1, 1, [
        { col: 1, len: 2 },
        { col: 6, len: 2 },
        { col: 11, len: 2 },
      ], 0xffa95f),
      this.createLane(6, -1, 1, [
        { col: 4, len: 3 },
        { col: 10, len: 3 },
      ], 0xffc66d),
      this.createLane(5, 1, 1, [
        { col: 1, len: 3 },
        { col: 8, len: 3 },
      ], 0xff7b7b),
      this.createLane(4, -1, 1, [
        { col: 3, len: 2 },
        { col: 9, len: 2 },
      ], 0xffb36b),
      this.createLane(3, 1, 1, [
        { col: 0, len: 3 },
        { col: 6, len: 3 },
      ], 0xff6464),
      this.createLane(2, -1, 1, [
        { col: 2, len: 2 },
        { col: 7, len: 2 },
        { col: 12, len: 2 },
      ], 0xff9960),
      this.createLane(1, 1, 1, [
        { col: 1, len: 2 },
        { col: 5, len: 2 },
        { col: 10, len: 2 },
      ], 0xffd27a),
    ];
  }

  private createLane(
    row: number,
    dir: Dir,
    speed: number,
    chunks: Array<{ col: number; len: number }>,
    color: number,
  ): MovingLane {
    const segments = chunks.map(chunk => {
      const centerCol = chunk.col + (chunk.len - 1) / 2;
      const p = this.cellCenter(row, centerCol);
      const sprite = this.add.rectangle(p.x, p.y, chunk.len * CELL - 6, CELL - 8, color).setDepth(12);
      sprite.setStrokeStyle(2, 0x222222);
      return { col: chunk.col, len: chunk.len, sprite };
    });

    return { row, dir, speed, segments };
  }

  private spawnFrog(): void {
    this.frogRow = ROWS - 1;
    this.frogCol = Math.floor(COLS / 2);

    const p = this.cellCenter(this.frogRow, this.frogCol);
    this.frog = this.add.container(p.x, p.y);
    const body = this.add.circle(0, 0, 12, 0x54ff72).setStrokeStyle(2, 0x1d7d2f);
    const eyeL = this.add.circle(-4, -6, 2, 0x0f3812);
    const eyeR = this.add.circle(4, -6, 2, 0x0f3812);
    this.frog.add([body, eyeL, eyeR]);
    this.frog.setDepth(20);
  }

  private tryMoveFrog(dx: number, dy: number): void {
    const nr = this.frogRow + dy;
    const nc = this.frogCol + dx;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;

    this.frogRow = nr;
    this.frogCol = nc;

    const p = this.cellCenter(this.frogRow, this.frogCol);
    this.frogMoving = true;
    this.tweens.add({
      targets: this.frog,
      x: p.x,
      y: p.y,
      duration: 120,
      ease: 'Sine.inOut',
      onComplete: () => {
        this.frogMoving = false;
        this.onFrogLanded();
      },
    });
  }

  private stepLanes(): void {
    if (this.isGameOver) return;
    this.laneTickCount += 1;

    if (this.laneTickCount % this.carMoveEveryTicks === 0) {
      this.moveLaneSet(this.cars);
    }
    this.checkCarHit();
  }

  private setCarSpeedStep(step: number): void {
    const clamped = Phaser.Math.Clamp(Math.round(step), 0, 3);
    // Lower cadence value => faster cars.
    this.carMoveEveryTicks = 4 - clamped;
    const labels = ['Slow', 'Normal', 'Fast', 'Very Fast'];
    this.carSpeedValueText.setText(`Cars: ${labels[clamped]}`);

    const t = clamped / 3;
    this.carSpeedKnob.x = Phaser.Math.Linear(this.carSliderMinX, this.carSliderMaxX, t);
  }

  private moveLaneSet(lanes: MovingLane[]): void {
    for (const lane of lanes) {
      for (const seg of lane.segments) {
        seg.col += lane.dir * lane.speed;

        if (lane.dir > 0 && seg.col > COLS) {
          seg.col = -seg.len;
        } else if (lane.dir < 0 && seg.col + seg.len < 0) {
          seg.col = COLS;
        }

        const centerCol = seg.col + (seg.len - 1) / 2;
        const p = this.cellCenter(lane.row, centerCol);
        seg.sprite.setPosition(p.x, p.y);
      }
    }
  }

  private onFrogLanded(): void {
    if (this.isGameOver) return;

    // Reaching goal row means all 8 lanes were crossed.
    if (this.frogRow === 0) {
      this.score += 400;
      this.scoreText.setText(`Score: ${this.score}`);
      this.winGame();
      return;
    }

    this.checkCarHit();
  }

  private checkCarHit(): void {
    if (this.frogRow < 1 || this.frogRow > 8 || this.isGameOver) return;

    const lane = this.cars.find(l => l.row === this.frogRow);
    if (!lane) return;

    const hit = lane.segments.some(seg => this.frogCol >= seg.col && this.frogCol < seg.col + seg.len);
    if (hit) this.loseGame('Hit by a car!');
  }

  private winGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.laneTimer?.remove(false);
    this.statusText.setText('You crossed all 8 lanes! Great job!');

    this.time.delayedCall(900, () => {
      this.scene.start('RewardScene', {
        message: `Congratulations! You crossed all 8 lanes! Score ${this.score}`,
        nextScene: this.returnScene,
        nextData: this.returnData,
      });
    });
  }

  private loseGame(reason: string): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.laneTimer?.remove(false);
    this.statusText.setText(reason);

    this.tweens.add({
      targets: this.frog,
      alpha: 0,
      duration: 180,
      yoyo: true,
      repeat: 3,
    });

    this.time.delayedCall(1000, () => {
      this.scene.start('RewardScene', {
        message: `Frogger Over! Score ${this.score}`,
        nextScene: this.returnScene,
        nextData: this.returnData,
      });
    });
  }

  private cellCenter(row: number, col: number): { x: number; y: number } {
    return {
      x: BOARD_X + col * CELL + CELL / 2,
      y: BOARD_Y + row * CELL + CELL / 2,
    };
  }
}
