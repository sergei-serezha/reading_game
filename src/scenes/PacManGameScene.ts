import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../config/Constants';
import { ArcadeGameConfig } from '../types/ArcadeTypes';
import { MonkeyHelper } from '../objects/MonkeyHelper';

const CELL = 28;
const MAP: string[] = [
  '###################',
  '#o...............o#',
  '#.###.#####.###.#.#',
  '#.#...#...#...#.#.#',
  '#.#.###.#.###.#.#.#',
  '#.#.....#.....#.#.#',
  '#.#####.###.#####.#',
  '#........#........#',
  '###.###.....###.###',
  '#...#...###...#...#',
  '###.#.#######.#.###',
  '#...#...#.#...#...#',
  '#.###.#.#.#.#.###.#',
  '#.....#.....#.....#',
  '###################',
];

const ROWS = MAP.length;
const COLS = MAP[0]?.length ?? 0;
const MAZE_W = COLS * CELL;
const MAZE_H = ROWS * CELL;
const MAZE_X = Math.floor((GAME_WIDTH - MAZE_W) / 2);
const MAZE_Y = 88;

type Dir = 'up' | 'down' | 'left' | 'right' | 'none';

interface Ghost {
  sprite: Phaser.GameObjects.Arc;
  row: number;
  col: number;
  startRow: number;
  startCol: number;
  dir: Dir;
  color: number;
}

export class PacManGameScene extends Phaser.Scene {
  private gameConfig: ArcadeGameConfig;
  private returnScene: string;
  private returnData: unknown;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | null = null;

  private pac: MonkeyHelper;
  private pacRow: number = 7;
  private pacCol: number = 8;
  private pacIsMoving: boolean = false;

  private ghosts: Ghost[] = [];
  private ghostMoveEvent: Phaser.Time.TimerEvent | null = null;
  private frightenedUntil: number = 0;
  private ghostStepDelayMs: number = 320;
  private ghostSpeedValueText: Phaser.GameObjects.Text;
  private ghostSpeedTrack: Phaser.GameObjects.Rectangle;
  private ghostSpeedKnob: Phaser.GameObjects.Arc;
  private ghostSliderMinX: number = 0;
  private ghostSliderMaxX: number = 0;

  private pellets: Map<string, Phaser.GameObjects.Arc> = new Map();
  private pelletsRemaining: number = 0;

  private score: number = 0;
  private scoreText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'PacManGameScene' });
  }

  init(data: { gameConfig: ArcadeGameConfig; returnScene: string; returnData: unknown }): void {
    this.gameConfig = data.gameConfig;
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
  }

  create(): void {
    this.isGameOver = false;
    this.score = 0;
    this.pellets.clear();
    this.pelletsRemaining = 0;
    this.frightenedUntil = 0;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080814);
    this.add.text(GAME_WIDTH / 2, 24, 'PAC-MAN', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#ffe45e',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.scoreText = this.add.text(MAZE_X, 52, 'Score: 0', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.statusText = this.add.text(MAZE_X + MAZE_W, 52, 'Ghosts chase the monkey', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#aabbee',
    }).setOrigin(1, 0.5);

    const sliderY = MAZE_Y + MAZE_H + 14;
    const sliderW = 260;
    const sliderX = GAME_WIDTH / 2;
    this.ghostSliderMinX = sliderX - sliderW / 2;
    this.ghostSliderMaxX = sliderX + sliderW / 2;

    this.add.text(sliderX, sliderY - 10, 'Ghost speed', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#d9def5',
    }).setOrigin(0.5, 0.5);

    this.ghostSpeedValueText = this.add.text(sliderX, sliderY + 16, `${this.ghostStepDelayMs}ms`, {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#d9def5',
    }).setOrigin(0.5, 0.5);

    this.ghostSpeedTrack = this.add.rectangle(sliderX, sliderY, sliderW, 8, 0x33507a);
    this.ghostSpeedTrack.setStrokeStyle(2, 0x6fa4ff);
    this.ghostSpeedTrack.setInteractive({ useHandCursor: true });

    this.ghostSpeedKnob = this.add.circle(sliderX, sliderY, 11, 0x4aa3ff).setStrokeStyle(2, 0xb8dcff);
    this.ghostSpeedKnob.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(this.ghostSpeedKnob);

    const updateFromPointerX = (pointerX: number) => {
      const x = Phaser.Math.Clamp(pointerX, this.ghostSliderMinX, this.ghostSliderMaxX);
      const t = (x - this.ghostSliderMinX) / (this.ghostSliderMaxX - this.ghostSliderMinX);
      const delay = Phaser.Math.Linear(180, 560, t);
      this.setGhostStepDelay(delay);
    };

    this.ghostSpeedTrack.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      updateFromPointerX(pointer.x);
    });

    this.ghostSpeedKnob.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      updateFromPointerX(dragX);
    });

    this.add.text(this.ghostSliderMinX, sliderY + 28, 'Faster', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#8fc2ff',
    }).setOrigin(0, 0.5);

    this.add.text(this.ghostSliderMaxX, sliderY + 28, 'Slower', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#8fc2ff',
    }).setOrigin(1, 0.5);

    this.buildMaze();

    this.pacRow = 7;
    this.pacCol = 8;
    this.pacIsMoving = false;

    const pacStart = this.cellCenter(this.pacRow, this.pacCol);
    this.pac = new MonkeyHelper(this, pacStart.x, pacStart.y);
    this.pac.setDepth(20);

    this.spawnGhosts();
    this.consumePelletAt(this.pacRow, this.pacCol);

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

    this.setGhostStepDelay(this.ghostStepDelayMs);
  }

  update(): void {
    if (this.isGameOver) return;

    this.handleStepInput();
    this.updateFrightenedVisuals();

    if (this.pelletsRemaining <= 0) {
      this.winGame();
    }
  }

  private buildMaze(): void {
    const g = this.add.graphics();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = MAP[r][c];
        const x = MAZE_X + c * CELL;
        const y = MAZE_Y + r * CELL;

        if (ch === '#') {
          g.fillStyle(0x243b82, 1);
          g.fillRect(x, y, CELL, CELL);
          g.lineStyle(1, 0x5f80ff, 0.35);
          g.strokeRect(x, y, CELL, CELL);
        } else {
          g.fillStyle(0x10102a, 1);
          g.fillRect(x, y, CELL, CELL);

          if (ch === '.' || ch === 'o') {
            const radius = ch === 'o' ? 5 : 2;
            const pellet = this.add.circle(x + CELL / 2, y + CELL / 2, radius, 0xffe59a).setDepth(4);
            this.pellets.set(this.key(r, c), pellet);
            this.pelletsRemaining++;
          }
        }
      }
    }
  }

  private spawnGhosts(): void {
    const starts: Array<{ r: number; c: number; color: number; dir: Dir }> = [
      { r: 1, c: 1, color: 0xff6b6b, dir: 'right' },
      { r: 1, c: COLS - 2, color: 0x7ce0ff, dir: 'left' },
      { r: ROWS - 2, c: 1, color: 0xff9de2, dir: 'up' },
      { r: ROWS - 2, c: COLS - 2, color: 0xffa95f, dir: 'up' },
    ];

    this.ghosts = starts.map(s => {
      const p = this.cellCenter(s.r, s.c);
      const sprite = this.add.circle(p.x, p.y, CELL * 0.34, s.color).setDepth(18);
      return {
        sprite,
        row: s.r,
        col: s.c,
        startRow: s.r,
        startCol: s.c,
        dir: s.dir,
        color: s.color,
      };
    });
  }

  private handleStepInput(): void {
    if (!this.cursors || this.pacIsMoving) return;
    const justDown = (key?: Phaser.Input.Keyboard.Key): boolean => !!key && Phaser.Input.Keyboard.JustDown(key);

    if (justDown(this.cursors.up) || justDown(this.wasd?.up)) {
      this.tryStep('up');
    } else if (justDown(this.cursors.down) || justDown(this.wasd?.down)) {
      this.tryStep('down');
    } else if (justDown(this.cursors.left) || justDown(this.wasd?.left)) {
      this.tryStep('left');
    } else if (justDown(this.cursors.right) || justDown(this.wasd?.right)) {
      this.tryStep('right');
    }
  }

  private tryStep(dir: Dir): void {
    if (!this.canMove(this.pacRow, this.pacCol, dir)) return;

    const d = this.dirToCell(dir);
    this.pacRow += d.r;
    this.pacCol += d.c;
    const next = this.cellCenter(this.pacRow, this.pacCol);

    this.pacIsMoving = true;
    this.pac.walkTo(next.x, next.y, () => {
      this.pacIsMoving = false;
      this.consumePelletAt(this.pacRow, this.pacCol);
      this.checkGhostCollision();
    });
  }

  private stepGhosts(): void {
    if (this.isGameOver) return;

    for (const ghost of this.ghosts) {
      const dirs: Dir[] = ['up', 'down', 'left', 'right'];
      const valid = dirs.filter(d => this.canMove(ghost.row, ghost.col, d));
      if (valid.length === 0) continue;

      const opposite = this.opposite(ghost.dir);
      const nonBacktrack = valid.filter(d => d !== opposite);
      const candidates = nonBacktrack.length > 0 ? nonBacktrack : valid;

      const frightened = this.time.now < this.frightenedUntil;
      ghost.dir = frightened
        ? this.pickFleeDirection(ghost.row, ghost.col, candidates)
        : this.pickChaseDirection(ghost.row, ghost.col, candidates);

      const move = this.dirToCell(ghost.dir);
      ghost.row += move.r;
      ghost.col += move.c;

      const p = this.cellCenter(ghost.row, ghost.col);
      this.tweens.add({
        targets: ghost.sprite,
        x: p.x,
        y: p.y,
        duration: frightened ? 220 : 180,
        ease: 'Sine.inOut',
      });
    }

    this.checkGhostCollision();
  }

  private setGhostStepDelay(delayMs: number): void {
    this.ghostStepDelayMs = Phaser.Math.Clamp(Math.round(delayMs), 180, 560);
    this.ghostSpeedValueText.setText(`${this.ghostStepDelayMs}ms`);
    const t = (this.ghostStepDelayMs - 180) / (560 - 180);
    this.ghostSpeedKnob.x = Phaser.Math.Linear(this.ghostSliderMinX, this.ghostSliderMaxX, t);

    this.ghostMoveEvent?.remove(false);
    this.ghostMoveEvent = this.time.addEvent({
      delay: this.ghostStepDelayMs,
      loop: true,
      callback: this.stepGhosts,
      callbackScope: this,
    });
  }

  private consumePelletAt(r: number, c: number): void {
    const key = this.key(r, c);
    const pellet = this.pellets.get(key);
    if (!pellet) return;

    pellet.destroy();
    this.pellets.delete(key);
    this.pelletsRemaining--;

    const isPower = MAP[r][c] === 'o';
    this.score += isPower ? 50 : 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (isPower) {
      this.frightenedUntil = this.time.now + 6000;
      this.statusText.setText('Power! Ghosts flee!');
    }
  }

  private updateFrightenedVisuals(): void {
    const frightened = this.time.now < this.frightenedUntil;
    for (const ghost of this.ghosts) {
      ghost.sprite.setFillStyle(frightened ? 0x4f7dff : ghost.color);
    }

    if (!frightened && this.statusText.text !== 'Ghosts chase the monkey' && !this.isGameOver) {
      this.statusText.setText('Ghosts chase the monkey');
    }
  }

  private checkGhostCollision(): void {
    for (const ghost of this.ghosts) {
      if (ghost.row === this.pacRow && ghost.col === this.pacCol) {
        if (this.time.now < this.frightenedUntil) {
          this.score += 200;
          this.scoreText.setText(`Score: ${this.score}`);
          ghost.row = ghost.startRow;
          ghost.col = ghost.startCol;
          const p = this.cellCenter(ghost.row, ghost.col);
          ghost.sprite.setPosition(p.x, p.y);
          ghost.dir = 'left';
        } else {
          this.loseGame();
        }
        return;
      }
    }
  }

  private winGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.ghostMoveEvent?.remove(false);
    this.statusText.setText('You win!');

    this.time.delayedCall(900, () => {
      this.scene.start('RewardScene', {
        message: `Pac-Man Clear! Score ${this.score}`,
        nextScene: this.returnScene,
        nextData: this.returnData,
      });
    });
  }

  private loseGame(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.ghostMoveEvent?.remove(false);
    this.statusText.setText('Caught by ghosts!');

    this.tweens.add({
      targets: this.pac,
      alpha: 0,
      duration: 350,
      yoyo: true,
      repeat: 2,
    });

    this.time.delayedCall(1100, () => {
      this.scene.start('RewardScene', {
        message: `Pac-Man Over! Score ${this.score}`,
        nextScene: this.returnScene,
        nextData: this.returnData,
      });
    });
  }

  private canMove(r: number, c: number, dir: Dir): boolean {
    if (dir === 'none') return false;
    const v = this.dirToCell(dir);
    const nr = r + v.r;
    const nc = c + v.c;

    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
    return MAP[nr][nc] !== '#';
  }

  private pickChaseDirection(r: number, c: number, dirs: Dir[]): Dir {
    let best = dirs[0] ?? 'none';
    let bestDist = Number.POSITIVE_INFINITY;

    for (const d of dirs) {
      const v = this.dirToCell(d);
      const dist = Math.abs(r + v.r - this.pacRow) + Math.abs(c + v.c - this.pacCol);
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }

    if (dirs.length > 1 && Math.random() < 0.25) {
      return Phaser.Utils.Array.GetRandom(dirs);
    }
    return best;
  }

  private pickFleeDirection(r: number, c: number, dirs: Dir[]): Dir {
    let best = dirs[0] ?? 'none';
    let bestDist = Number.NEGATIVE_INFINITY;

    for (const d of dirs) {
      const v = this.dirToCell(d);
      const dist = Math.abs(r + v.r - this.pacRow) + Math.abs(c + v.c - this.pacCol);
      if (dist > bestDist) {
        bestDist = dist;
        best = d;
      }
    }

    if (dirs.length > 1 && Math.random() < 0.35) {
      return Phaser.Utils.Array.GetRandom(dirs);
    }
    return best;
  }

  private dirToCell(dir: Dir): { r: number; c: number } {
    switch (dir) {
      case 'up': return { r: -1, c: 0 };
      case 'down': return { r: 1, c: 0 };
      case 'left': return { r: 0, c: -1 };
      case 'right': return { r: 0, c: 1 };
      default: return { r: 0, c: 0 };
    }
  }

  private opposite(dir: Dir): Dir {
    switch (dir) {
      case 'up': return 'down';
      case 'down': return 'up';
      case 'left': return 'right';
      case 'right': return 'left';
      default: return 'none';
    }
  }

  private cellCenter(r: number, c: number): { x: number; y: number } {
    return {
      x: MAZE_X + c * CELL + CELL / 2,
      y: MAZE_Y + r * CELL + CELL / 2,
    };
  }

  private key(r: number, c: number): string {
    return `${r}-${c}`;
  }
}
