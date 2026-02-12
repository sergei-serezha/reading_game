import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../config/Constants';

/**
 * Tron Light Cycle Game
 *
 * Classic Tron: two light cycles leave trails on a grid.
 * If you hit a wall, your own trail, or the opponent's trail — you crash.
 * Last one standing wins. ~60 second rounds with increasing speed.
 *
 * Controls: Arrow keys or WASD
 */

// Grid-based movement
const CELL_SIZE = 6;
const ARENA_X = 60;
const ARENA_Y = 50;
const ARENA_W = 840;
const ARENA_H = 450;
const COLS = Math.floor(ARENA_W / CELL_SIZE);
const ROWS = Math.floor(ARENA_H / CELL_SIZE);

const PLAYER_COLOR = 0x00ddff;
const AI_COLOR = 0xff4444;
const WALL_COLOR = 0x334466;
const GRID_LINE_COLOR = 0x1a1a33;
const BG_COLOR = 0x0a0a1a;

const PLAYER_TRAIL_COLOR = 0x0088aa;
const AI_TRAIL_COLOR = 0xaa2222;

enum Dir {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

interface Cycle {
  x: number; // grid col
  y: number; // grid row
  dir: Dir;
  alive: boolean;
  color: number;
  trailColor: number;
  trail: Set<number>; // packed grid positions
}

export class TronGameScene extends Phaser.Scene {
  private returnScene: string;
  private returnData: unknown;

  private grid: Uint8Array; // 0=empty, 1=player trail, 2=AI trail, 3=wall (unused, use bounds)
  private player: Cycle;
  private ai: Cycle;

  private arenaGfx: Phaser.GameObjects.Graphics;
  private moveTimer: number = 0;
  private moveInterval: number = 80; // ms between moves (gets faster)
  private gameOver: boolean = false;
  private gameTime: number = 0;
  private maxGameTime: number = 60000; // 60 seconds
  private roundResult: string = '';
  private score: number = 0;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | null = null;
  private queuedDir: Dir = Dir.RIGHT;

  private timerText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private startCountdown: number = 3;
  private started: boolean = false;

  constructor() {
    super({ key: 'TronGameScene' });
  }

  init(data: { returnScene: string; returnData: unknown }): void {
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
  }

  create(): void {
    this.gameOver = false;
    this.gameTime = 0;
    this.moveTimer = 0;
    this.moveInterval = 80;
    this.score = 0;
    this.started = false;
    this.startCountdown = 3;
    this.roundResult = '';

    // Grid data
    this.grid = new Uint8Array(COLS * ROWS);

    // Initialize cycles
    this.player = {
      x: Math.floor(COLS * 0.25),
      y: Math.floor(ROWS / 2),
      dir: Dir.RIGHT,
      alive: true,
      color: PLAYER_COLOR,
      trailColor: PLAYER_TRAIL_COLOR,
      trail: new Set(),
    };
    this.queuedDir = Dir.RIGHT;

    this.ai = {
      x: Math.floor(COLS * 0.75),
      y: Math.floor(ROWS / 2),
      dir: Dir.LEFT,
      alive: true,
      color: AI_COLOR,
      trailColor: AI_TRAIL_COLOR,
      trail: new Set(),
    };

    // Mark starting positions
    this.setGrid(this.player.x, this.player.y, 1);
    this.player.trail.add(this.packPos(this.player.x, this.player.y));
    this.setGrid(this.ai.x, this.ai.y, 2);
    this.ai.trail.add(this.packPos(this.ai.x, this.ai.y));

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, BG_COLOR);

    // Arena border
    const border = this.add.rectangle(
      ARENA_X + ARENA_W / 2,
      ARENA_Y + ARENA_H / 2,
      ARENA_W + 4,
      ARENA_H + 4,
    );
    border.setStrokeStyle(2, WALL_COLOR);
    border.setFillStyle(0x0d0d1f);

    // Grid lines (subtle)
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, GRID_LINE_COLOR, 0.15);
    for (let c = 0; c <= COLS; c++) {
      gridGfx.lineBetween(
        ARENA_X + c * CELL_SIZE, ARENA_Y,
        ARENA_X + c * CELL_SIZE, ARENA_Y + ROWS * CELL_SIZE,
      );
    }
    for (let r = 0; r <= ROWS; r++) {
      gridGfx.lineBetween(
        ARENA_X, ARENA_Y + r * CELL_SIZE,
        ARENA_X + COLS * CELL_SIZE, ARENA_Y + r * CELL_SIZE,
      );
    }

    // Arena graphics (drawn each frame)
    this.arenaGfx = this.add.graphics();

    // Title
    this.add.text(GAME_WIDTH / 2, 18, 'T R O N', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#00ddff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(GAME_WIDTH - 80, 18, '1:00', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#aaccdd',
    }).setOrigin(0.5);

    // Score
    this.scoreText = this.add.text(80, 18, 'Score: 0', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#aaccdd',
    }).setOrigin(0.5);

    // Legend
    this.add.rectangle(ARENA_X + 8, ARENA_Y + ARENA_H + 16, 8, 8, PLAYER_COLOR);
    this.add.text(ARENA_X + 18, ARENA_Y + ARENA_H + 16, 'You', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#88bbcc',
    }).setOrigin(0, 0.5);

    this.add.rectangle(ARENA_X + 70, ARENA_Y + ARENA_H + 16, 8, 8, AI_COLOR);
    this.add.text(ARENA_X + 80, ARENA_Y + ARENA_H + 16, 'CPU', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#cc8888',
    }).setOrigin(0, 0.5);

    // Controls hint
    this.add.text(GAME_WIDTH / 2, ARENA_Y + ARENA_H + 16, 'Arrow Keys / WASD to steer', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#667788',
    }).setOrigin(0.5);

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // Initial draw
    this.drawArena();

    // Countdown
    this.doCountdown();
  }

  private doCountdown(): void {
    const countText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `${this.startCountdown}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: '#00ddff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: countText,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        countText.destroy();
        this.startCountdown--;
        if (this.startCountdown > 0) {
          this.doCountdown();
        } else {
          // Show GO!
          const goText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GO!', {
            fontFamily: FONT_FAMILY,
            fontSize: '48px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6,
          }).setOrigin(0.5).setDepth(50);

          this.tweens.add({
            targets: goText,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
              goText.destroy();
              this.started = true;
            },
          });
        }
      },
    });
  }

  update(_time: number, delta: number): void {
    if (!this.started || this.gameOver) return;

    // Read input (queue direction change — only 90° turns allowed)
    this.readInput();

    // Game timer
    this.gameTime += delta;
    const remaining = Math.max(0, Math.ceil((this.maxGameTime - this.gameTime) / 1000));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

    // Speed increases over time
    this.moveInterval = Math.max(40, 80 - (this.gameTime / this.maxGameTime) * 35);

    // Move cycles on timer
    this.moveTimer += delta;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer -= this.moveInterval;
      this.tick();
    }

    // Time's up
    if (this.gameTime >= this.maxGameTime) {
      this.endGame('Time\'s up! You survived!');
    }
  }

  private readInput(): void {
    if (!this.cursors) return;

    let newDir: Dir | null = null;

    if (this.cursors.up.isDown || this.wasd?.up.isDown) newDir = Dir.UP;
    else if (this.cursors.down.isDown || this.wasd?.down.isDown) newDir = Dir.DOWN;
    else if (this.cursors.left.isDown || this.wasd?.left.isDown) newDir = Dir.LEFT;
    else if (this.cursors.right.isDown || this.wasd?.right.isDown) newDir = Dir.RIGHT;

    if (newDir !== null) {
      // Prevent 180° turns (instant death)
      const opposite = (this.player.dir + 2) % 4;
      if (newDir !== opposite) {
        this.queuedDir = newDir;
      }
    }
  }

  private tick(): void {
    // Apply queued direction
    this.player.dir = this.queuedDir;

    // AI decision
    this.aiThink();

    // Move both cycles
    this.moveCycle(this.player);
    this.moveCycle(this.ai);

    // Check collisions
    const playerCrash = this.checkCollision(this.player, 1);
    const aiCrash = this.checkCollision(this.ai, 2);

    if (playerCrash && aiCrash) {
      this.endGame('Draw!');
      return;
    } else if (playerCrash) {
      this.player.alive = false;
      this.endGame('CPU wins!');
      return;
    } else if (aiCrash) {
      this.ai.alive = false;
      this.score += 100;
      this.scoreText.setText(`Score: ${this.score}`);
      // Respawn AI for another round
      this.respawnAi();
    }

    // Mark trail
    if (this.player.alive) {
      this.setGrid(this.player.x, this.player.y, 1);
      this.player.trail.add(this.packPos(this.player.x, this.player.y));
    }
    if (this.ai.alive) {
      this.setGrid(this.ai.x, this.ai.y, 2);
      this.ai.trail.add(this.packPos(this.ai.x, this.ai.y));
    }

    // Update score based on survival time
    this.score = Math.floor(this.gameTime / 100);
    this.scoreText.setText(`Score: ${this.score}`);

    this.drawArena();
  }

  private moveCycle(cycle: Cycle): void {
    if (!cycle.alive) return;
    switch (cycle.dir) {
      case Dir.UP: cycle.y--; break;
      case Dir.DOWN: cycle.y++; break;
      case Dir.LEFT: cycle.x--; break;
      case Dir.RIGHT: cycle.x++; break;
    }
  }

  private checkCollision(cycle: Cycle, _id: number): boolean {
    if (!cycle.alive) return false;
    // Wall collision
    if (cycle.x < 0 || cycle.x >= COLS || cycle.y < 0 || cycle.y >= ROWS) {
      return true;
    }
    // Trail collision (hit any existing trail)
    const val = this.getGrid(cycle.x, cycle.y);
    return val !== 0;
  }

  private respawnAi(): void {
    // Clear AI trail from grid
    for (const packed of this.ai.trail) {
      const { x, y } = this.unpackPos(packed);
      if (this.getGrid(x, y) === 2) {
        this.setGrid(x, y, 0);
      }
    }
    this.ai.trail.clear();

    // Find a safe spot far from the player
    let bestX = Math.floor(COLS * 0.75);
    let bestY = Math.floor(ROWS / 2);
    let bestDist = 0;

    for (let attempt = 0; attempt < 50; attempt++) {
      const tx = Phaser.Math.Between(10, COLS - 10);
      const ty = Phaser.Math.Between(10, ROWS - 10);
      if (this.getGrid(tx, ty) !== 0) continue;

      const dist = Math.abs(tx - this.player.x) + Math.abs(ty - this.player.y);
      if (dist > bestDist) {
        bestDist = dist;
        bestX = tx;
        bestY = ty;
      }
    }

    this.ai.x = bestX;
    this.ai.y = bestY;
    this.ai.alive = true;
    this.ai.dir = this.player.x < bestX ? Dir.LEFT : Dir.RIGHT;
    this.setGrid(this.ai.x, this.ai.y, 2);
    this.ai.trail.add(this.packPos(this.ai.x, this.ai.y));

    // Flash effect
    this.cameras.main.flash(200, 255, 100, 100);
  }

  private aiThink(): void {
    if (!this.ai.alive) return;

    // Simple AI: look ahead, avoid walls and trails, prefer chasing player
    const dirs = [Dir.UP, Dir.RIGHT, Dir.DOWN, Dir.LEFT];
    const deltas = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    const opposite = (this.ai.dir + 2) % 4;
    let bestDir = this.ai.dir;
    let bestScore = -Infinity;

    for (const d of dirs) {
      if (d === opposite) continue; // no 180° turns

      const nx = this.ai.x + deltas[d].dx;
      const ny = this.ai.y + deltas[d].dy;

      // Check immediate safety
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (this.getGrid(nx, ny) !== 0) continue;

      // Score: how much open space ahead (look ahead up to 15 cells)
      let openSpace = 0;
      let cx = nx;
      let cy = ny;
      for (let step = 0; step < 15; step++) {
        cx += deltas[d].dx;
        cy += deltas[d].dy;
        if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) break;
        if (this.getGrid(cx, cy) !== 0) break;
        openSpace++;
      }

      // Also check open space to left and right of this direction
      const leftDir = (d + 3) % 4;
      const rightDir = (d + 1) % 4;
      let sideSpace = 0;
      for (const sd of [leftDir, rightDir]) {
        let sx = nx;
        let sy = ny;
        for (let step = 0; step < 8; step++) {
          sx += deltas[sd].dx;
          sy += deltas[sd].dy;
          if (sx < 0 || sx >= COLS || sy < 0 || sy >= ROWS) break;
          if (this.getGrid(sx, sy) !== 0) break;
          sideSpace++;
        }
      }

      // Small bias toward the player (chase them a bit)
      const distToPlayer = Math.abs(nx - this.player.x) + Math.abs(ny - this.player.y);
      const chaseBonus = Math.max(0, 30 - distToPlayer) * 0.3;

      // Prefer current direction slightly (less jerky)
      const straightBonus = d === this.ai.dir ? 1 : 0;

      // Random jitter for variety
      const jitter = Math.random() * 2;

      const dirScore = openSpace * 3 + sideSpace + chaseBonus + straightBonus + jitter;
      if (dirScore > bestScore) {
        bestScore = dirScore;
        bestDir = d;
      }
    }

    this.ai.dir = bestDir;
  }

  private drawArena(): void {
    this.arenaGfx.clear();

    // Draw trails
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = this.getGrid(c, r);
        if (val === 0) continue;

        const px = ARENA_X + c * CELL_SIZE;
        const py = ARENA_Y + r * CELL_SIZE;

        this.arenaGfx.fillStyle(val === 1 ? PLAYER_TRAIL_COLOR : AI_TRAIL_COLOR, 0.7);
        this.arenaGfx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw cycle heads (brighter, larger)
    if (this.player.alive) {
      const px = ARENA_X + this.player.x * CELL_SIZE;
      const py = ARENA_Y + this.player.y * CELL_SIZE;
      this.arenaGfx.fillStyle(PLAYER_COLOR, 1);
      this.arenaGfx.fillRect(px - 1, py - 1, CELL_SIZE + 2, CELL_SIZE + 2);
      // Glow effect
      this.arenaGfx.fillStyle(PLAYER_COLOR, 0.3);
      this.arenaGfx.fillRect(px - 3, py - 3, CELL_SIZE + 6, CELL_SIZE + 6);
    }

    if (this.ai.alive) {
      const ax = ARENA_X + this.ai.x * CELL_SIZE;
      const ay = ARENA_Y + this.ai.y * CELL_SIZE;
      this.arenaGfx.fillStyle(AI_COLOR, 1);
      this.arenaGfx.fillRect(ax - 1, ay - 1, CELL_SIZE + 2, CELL_SIZE + 2);
      this.arenaGfx.fillStyle(AI_COLOR, 0.3);
      this.arenaGfx.fillRect(ax - 3, ay - 3, CELL_SIZE + 6, CELL_SIZE + 6);
    }
  }

  private endGame(result: string): void {
    this.gameOver = true;
    this.roundResult = result;

    // Final score
    this.score = Math.floor(this.gameTime / 100);

    // Crash effect
    this.cameras.main.shake(300, 0.01);

    // Darken overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000,
    ).setAlpha(0).setDepth(40);

    this.tweens.add({
      targets: overlay,
      alpha: 0.5,
      duration: 500,
    });

    // Result text
    const resultText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, result, {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    const finalScoreText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `Score: ${this.score}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    this.tweens.add({
      targets: [resultText, finalScoreText],
      alpha: 1,
      duration: 500,
      delay: 300,
    });

    // Continue button
    const continueBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, '[ Continue ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#00ddff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: continueBtn,
      alpha: 1,
      duration: 500,
      delay: 800,
    });

    continueBtn.on('pointerover', () => continueBtn.setColor('#FFD700'));
    continueBtn.on('pointerout', () => continueBtn.setColor('#00ddff'));
    continueBtn.on('pointerdown', () => this.exitGame());

    // Auto-exit after 8 seconds
    this.time.delayedCall(8000, () => {
      if (this.gameOver) this.exitGame();
    });
  }

  private exitGame(): void {
    this.scene.start('RewardScene', {
      message: `TRON - Score: ${this.score}`,
      nextScene: this.returnScene,
      nextData: this.returnData,
    });
  }

  // Grid helpers
  private packPos(x: number, y: number): number {
    return y * COLS + x;
  }

  private unpackPos(packed: number): { x: number; y: number } {
    return { x: packed % COLS, y: Math.floor(packed / COLS) };
  }

  private getGrid(x: number, y: number): number {
    return this.grid[y * COLS + x];
  }

  private setGrid(x: number, y: number, val: number): void {
    this.grid[y * COLS + x] = val;
  }
}
