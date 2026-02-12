import Phaser from 'phaser';
import { INPUT_COOLDOWN_MS } from '../config/Constants';

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE',
}

export class InputManager {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | null = null;
  private swipeStartPoint: Phaser.Math.Vector2 | null = null;
  private bufferedDirection: Direction = Direction.NONE;
  private lastInputTime: number = 0;
  private swipeThreshold: number = 30;
  private enabled: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  enable(): void {
    this.enabled = true;

    if (this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // Swipe support
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
  }

  disable(): void {
    this.enabled = false;
    this.bufferedDirection = Direction.NONE;
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
  }

  consumeDirection(): Direction {
    if (!this.enabled) return Direction.NONE;

    // Check keyboard
    const keyDir = this.checkKeyboard();
    if (keyDir !== Direction.NONE && !this.isOnCooldown()) {
      this.lastInputTime = Date.now();
      return keyDir;
    }

    // Check buffered swipe
    if (this.bufferedDirection !== Direction.NONE && !this.isOnCooldown()) {
      const dir = this.bufferedDirection;
      this.bufferedDirection = Direction.NONE;
      this.lastInputTime = Date.now();
      return dir;
    }

    return Direction.NONE;
  }

  private checkKeyboard(): Direction {
    if (!this.cursors) return Direction.NONE;

    if (this.cursors.up.isDown || this.wasd?.up.isDown) return Direction.UP;
    if (this.cursors.down.isDown || this.wasd?.down.isDown) return Direction.DOWN;
    if (this.cursors.left.isDown || this.wasd?.left.isDown) return Direction.LEFT;
    if (this.cursors.right.isDown || this.wasd?.right.isDown) return Direction.RIGHT;

    return Direction.NONE;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.swipeStartPoint = new Phaser.Math.Vector2(pointer.x, pointer.y);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.swipeStartPoint) return;

    const dx = pointer.x - this.swipeStartPoint.x;
    const dy = pointer.y - this.swipeStartPoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= this.swipeThreshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.bufferedDirection = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        this.bufferedDirection = dy > 0 ? Direction.DOWN : Direction.UP;
      }
    }

    this.swipeStartPoint = null;
  }

  private isOnCooldown(): boolean {
    return Date.now() - this.lastInputTime < INPUT_COOLDOWN_MS;
  }
}
