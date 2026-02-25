import Phaser from 'phaser';
import { COLORS, TILE_SIZE, FONT_FAMILY } from '../config/Constants';

export enum LetterTileState {
  NORMAL = 'normal',
  HIGHLIGHTED = 'highlighted',
  COMPLETED = 'completed',
  HIDDEN = 'hidden',
  DISABLED = 'disabled',
  EMPTY = 'empty',
  EMPTY_HIGHLIGHTED = 'empty_highlighted',
}

const STATE_COLORS: Record<LetterTileState, number> = {
  [LetterTileState.NORMAL]: COLORS.TILE_NORMAL,
  [LetterTileState.HIGHLIGHTED]: COLORS.TILE_HIGHLIGHTED,
  [LetterTileState.COMPLETED]: COLORS.TILE_COMPLETED,
  [LetterTileState.HIDDEN]: COLORS.TILE_HIDDEN,
  [LetterTileState.DISABLED]: COLORS.TILE_DISABLED,
  [LetterTileState.EMPTY]: COLORS.TILE_EMPTY,
  [LetterTileState.EMPTY_HIGHLIGHTED]: COLORS.TILE_EMPTY_HIGHLIGHTED,
};

export class LetterTile extends Phaser.GameObjects.Container {
  public readonly letter: string;
  public readonly gridRow: number;
  public readonly gridCol: number;
  public readonly isEmpty: boolean;
  public tileState: LetterTileState;
  private bg: Phaser.GameObjects.Rectangle;
  private letterText: Phaser.GameObjects.Text | null = null;
  private border: Phaser.GameObjects.Rectangle;
  public isBroken: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    letter: string,
    gridRow: number,
    gridCol: number,
    isEmpty: boolean = false,
  ) {
    super(scene, x, y);

    this.letter = letter;
    this.gridRow = gridRow;
    this.gridCol = gridCol;
    this.isEmpty = isEmpty;
    this.tileState = isEmpty ? LetterTileState.EMPTY : LetterTileState.NORMAL;

    // Border (slightly larger rectangle behind)
    const borderColor = isEmpty ? 0x1a1a33 : 0x222244;
    const borderStroke = isEmpty ? 0x333355 : 0x666688;
    this.border = scene.add.rectangle(0, 0, TILE_SIZE + 4, TILE_SIZE + 4, borderColor);
    this.border.setStrokeStyle(isEmpty ? 1 : 2, borderStroke);
    this.add(this.border);

    // Background
    const bgColor = isEmpty ? COLORS.TILE_EMPTY : COLORS.TILE_NORMAL;
    this.bg = scene.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, bgColor);
    this.bg.setStrokeStyle(isEmpty ? 1 : 2, isEmpty ? 0x333355 : 0x5a5a8a);
    this.add(this.bg);

    // Letter text (only for non-empty tiles)
    if (!isEmpty && letter) {
      this.letterText = scene.add.text(0, 0, letter, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        color: COLORS.TEXT_LETTER,
        align: 'center',
      }).setOrigin(0.5);
      this.add(this.letterText);
    }

    this.setSize(TILE_SIZE, TILE_SIZE);
    this.setInteractive();
  }

  setTileState(newState: LetterTileState): void {
    this.tileState = newState;
    this.bg.setFillStyle(STATE_COLORS[newState]);

    if (newState === LetterTileState.HIGHLIGHTED) {
      this.border.setStrokeStyle(3, 0xaaaaff);
    } else if (newState === LetterTileState.EMPTY_HIGHLIGHTED) {
      this.border.setStrokeStyle(2, 0x555588);
    } else if (newState === LetterTileState.COMPLETED) {
      this.border.setStrokeStyle(3, 0x44ff44);
    } else if (newState === LetterTileState.EMPTY) {
      this.border.setStrokeStyle(1, 0x333355);
    } else {
      this.border.setStrokeStyle(2, 0x666688);
    }

    if (this.letterText) {
      this.letterText.setVisible(
        newState !== LetterTileState.HIDDEN && newState !== LetterTileState.EMPTY && newState !== LetterTileState.EMPTY_HIGHLIGHTED
      );
    }
  }

  getTileState(): LetterTileState {
    return this.tileState;
  }

  playSelectAnimation(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  playRejectAnimation(): void {
    const startX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: startX - 6,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.inOut',
      onComplete: () => {
        this.x = startX;
      },
    });
  }

  playRevealAnimation(): void {
    if (!this.letterText) return;
    this.letterText.setVisible(true);
    this.letterText.setAlpha(0);
    this.scene.tweens.add({
      targets: this.letterText,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });
  }

  playSlashBreakAnimation(onComplete?: () => void): void {
    if (this.isEmpty || this.isBroken) {
      onComplete?.();
      return;
    }
    this.isBroken = true;

    const halfWidth = TILE_SIZE / 2;
    const bgColor = STATE_COLORS[this.tileState];

    const leftHalf = this.scene.add.rectangle(-TILE_SIZE / 4, 0, halfWidth, TILE_SIZE, bgColor);
    const rightHalf = this.scene.add.rectangle(TILE_SIZE / 4, 0, halfWidth, TILE_SIZE, bgColor);
    leftHalf.setStrokeStyle(2, 0x2b2b44);
    rightHalf.setStrokeStyle(2, 0x2b2b44);
    this.add([leftHalf, rightHalf]);

    const leftLetter = this.letterText
      ? this.scene.add.text(-TILE_SIZE / 4, 0, this.letter, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: COLORS.TEXT_LETTER,
      }).setOrigin(0.5)
      : null;
    const rightLetter = this.letterText
      ? this.scene.add.text(TILE_SIZE / 4, 0, this.letter, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: COLORS.TEXT_LETTER,
      }).setOrigin(0.5)
      : null;
    if (leftLetter && rightLetter) {
      this.add([leftLetter, rightLetter]);
    }

    this.border.setVisible(false);
    this.bg.setVisible(false);
    this.letterText?.setVisible(false);

    this.scene.tweens.add({
      targets: [leftHalf, leftLetter].filter(Boolean),
      x: -TILE_SIZE / 4 - 18,
      y: 8,
      angle: -18,
      alpha: 0,
      duration: 240,
      ease: 'Cubic.out',
    });

    this.scene.tweens.add({
      targets: [rightHalf, rightLetter].filter(Boolean),
      x: TILE_SIZE / 4 + 18,
      y: 8,
      angle: 18,
      alpha: 0,
      duration: 240,
      ease: 'Cubic.out',
      onComplete: () => {
        leftHalf.destroy();
        rightHalf.destroy();
        leftLetter?.destroy();
        rightLetter?.destroy();
        onComplete?.();
      },
    });
  }
}
