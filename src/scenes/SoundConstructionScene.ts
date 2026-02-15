import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY, TILE_SIZE, TILE_GAP } from '../config/Constants';
import { LevelConfig, GridPosition } from '../types/LevelTypes';
import { LetterTile, LetterTileState } from '../objects/LetterTile';
import { PlayerCharacter } from '../objects/PlayerCharacter';
import { MonkeyHelper } from '../objects/MonkeyHelper';
import { ProgressBar } from '../objects/ProgressBar';
import { InputManager, Direction } from '../managers/InputManager';
import { AudioManager } from '../managers/AudioManager';
import { FeedbackManager } from '../managers/FeedbackManager';
import { ProgressManager } from '../managers/ProgressManager';

interface WordLine {
  word: string;
  row: number;
  startCol: number;
  endCol: number;
  landingCol: number;
  tiles: LetterTile[];
  complete: boolean;
}

interface Level3ResumeData {
  levelConfig: LevelConfig;
  completeOnEnter?: boolean;
}

const GRID_COLS = 7;
const GRID_ROWS = 6;
const WORD_ROWS = [1, 3, 5];
const WORD_START_COL = 1;
const ARCADE_UNLOCK_WORDS = 3;

/**
 * Level 3 POC:
 * - 3 random words from word files, placed on rows 2,4,6
 * - Knight moves up/down between rows
 * - Space sends monkey to read letters, then knight slashes the row
 */
export class SoundConstructionScene extends Phaser.Scene {
  private levelConfig: LevelConfig;
  private completeOnEnter: boolean = false;

  private audioManager: AudioManager;
  private feedbackManager: FeedbackManager;
  private progressManager: ProgressManager;

  private inputManager: InputManager;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private progressBar: ProgressBar;
  private player: PlayerCharacter;
  private monkey: MonkeyHelper;
  private hintText: Phaser.GameObjects.Text;

  private selectedWords: string[] = [];
  private lines: WordLine[] = [];
  private tilesByPos: Map<string, LetterTile> = new Map();

  private currentLineIndex: number = 0;
  private wordsCompleted: number = 0;
  private isProcessing: boolean = false;
  private arcadeUnlocked: boolean = false;
  private monkeyJumpDurationMs: number = 140;

  constructor() {
    super({ key: 'SoundConstructionScene' });
  }

  init(data: Level3ResumeData): void {
    this.levelConfig = data.levelConfig;
    this.completeOnEnter = data.completeOnEnter ?? false;
  }

  create(): void {
    this.audioManager = this.registry.get('audioManager') as AudioManager;
    this.feedbackManager = this.registry.get('feedbackManager') as FeedbackManager;
    this.progressManager = this.registry.get('progressManager') as ProgressManager;

    this.audioManager.setScene(this);
    this.feedbackManager.setScene(this);

    if (this.completeOnEnter) {
      this.handleReturnFromArcade();
      return;
    }

    this.add.text(GAME_WIDTH / 2, 30, this.levelConfig.levelName, {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 60, 'Use UP/DOWN. Press SPACE to send monkey helper.', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setAlpha(0.75);

    this.selectedWords = this.pickRandomWords();
    this.lines = this.selectedWords.map((word, i) => ({
      word,
      row: WORD_ROWS[i],
      startCol: WORD_START_COL,
      endCol: WORD_START_COL + word.length - 1,
      landingCol: WORD_START_COL + word.length,
      tiles: [],
      complete: false,
    }));

    this.buildGrid();

    const start = this.gridToPixel({ row: this.lines[0].row, col: 0 });
    this.player = new PlayerCharacter(this, start.x, start.y);
    this.player.setDepth(20);

    this.monkey = new MonkeyHelper(this, start.x + 26, start.y - 8);
    this.monkey.setDepth(21);

    this.hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(60);

    this.progressBar = new ProgressBar(this, GAME_WIDTH - 230, GAME_HEIGHT - 30, 200, 18);
    this.progressBar.setDepth(50);
    this.progressBar.updateProgress(this.wordsCompleted, ARCADE_UNLOCK_WORDS);

    this.inputManager = new InputManager(this);
    this.inputManager.enable();
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) ?? null;

    this.refreshSelectableLineVisuals();
    this.updateHintText();
  }

  update(): void {
    if (this.isProcessing || this.completeOnEnter) return;

    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const line = this.lines[this.currentLineIndex];
      if (!line || line.complete) return;
      this.startLineSequence(this.currentLineIndex);
      return;
    }

    const dir = this.inputManager.consumeDirection();
    if (dir === Direction.UP) {
      this.moveBetweenLines(-1);
    } else if (dir === Direction.DOWN) {
      this.moveBetweenLines(1);
    }
  }

  private handleReturnFromArcade(): void {
    this.feedbackManager.playLevelComplete();
    this.time.delayedCall(600, () => {
      this.scene.start('RewardScene', {
        message: 'You completed 3 words!',
        nextScene: 'LevelSelectScene',
      });
    });
  }

  private moveBetweenLines(delta: number): void {
    const next = Phaser.Math.Clamp(this.currentLineIndex + delta, 0, this.lines.length - 1);
    if (next === this.currentLineIndex) return;

    this.isProcessing = true;
    const p = this.gridToPixel({ row: this.lines[next].row, col: 0 });
    this.player.moveToPosition(p.x, p.y, () => {
      this.currentLineIndex = next;
      this.monkey.followKnight(p.x, p.y);
      this.isProcessing = false;
      this.refreshSelectableLineVisuals();
      this.updateHintText();
    });
  }

  private buildGrid(): void {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        let letter = '';

        for (const line of this.lines) {
          if (row === line.row && col >= line.startCol && col <= line.endCol) {
            letter = line.word[col - line.startCol];
            break;
          }
        }

        const isEmpty = letter === '';
        const p = this.gridToPixel({ row, col });
        const tile = new LetterTile(this, p.x, p.y, letter, row, col, isEmpty);

        if (isEmpty) {
          tile.setTileState(LetterTileState.EMPTY);
        } else {
          tile.setTileState(LetterTileState.NORMAL);
          const line = this.lines.find(l => l.row === row);
          if (line) line.tiles.push(tile);
        }

        this.add.existing(tile);
        this.tilesByPos.set(this.keyFor(row, col), tile);
      }
    }
  }

  private startLineSequence(lineIndex: number): void {
    const line = this.lines[lineIndex];
    if (!line || line.complete || line.tiles.length === 0) return;

    this.isProcessing = true;
    this.clearHighlights();

    const first = line.tiles[0];
    this.monkey.jumpTo(first.x, first.y - 18, () => {
      this.processLineLetter(line, 0);
    }, this.monkeyJumpDurationMs);
  }

  private processLineLetter(line: WordLine, letterIndex: number): void {
    const tile = line.tiles[letterIndex];
    if (!tile) {
      this.finishMonkeyRead(line);
      return;
    }

    this.audioManager.playPhonemeAndWait(tile.letter, () => {
      this.time.delayedCall(500, () => {
        tile.setTileState(LetterTileState.COMPLETED);
        this.progressManager.masterLetter(tile.letter);

        const next = line.tiles[letterIndex + 1];
        if (next) {
          this.monkey.jumpTo(next.x, next.y - 18, () => {
            this.processLineLetter(line, letterIndex + 1);
          }, this.monkeyJumpDurationMs);
        } else {
          this.finishMonkeyRead(line);
        }
      });
    });
  }

  private finishMonkeyRead(line: WordLine): void {
    this.time.delayedCall(500, () => {
      const landing = this.tileAt(line.row, line.landingCol);
      const lx = landing?.x ?? this.gridToPixel({ row: line.row, col: line.landingCol }).x;
      const ly = landing?.y ?? this.gridToPixel({ row: line.row, col: line.landingCol }).y;

      this.monkey.jumpTo(lx, ly - 18, () => {
        this.audioManager.speakTextAndWait(`Repeat after me: ${line.word}`, () => {
          this.runKnightSlashSequence(line, line.startCol);
        });
      }, this.monkeyJumpDurationMs);
    });
  }

  private runKnightSlashSequence(line: WordLine, currentCol: number): void {
    if (currentCol > line.endCol) {
      this.finishLine(line);
      return;
    }

    const target = this.gridToPixel({ row: line.row, col: currentCol });
    this.player.moveToPosition(target.x, target.y, () => {
      const tile = this.tileAt(line.row, currentCol);
      this.player.playSlashAnimation(() => {
        if (!tile || tile.isEmpty) {
          this.runKnightSlashSequence(line, currentCol + 1);
          return;
        }

        tile.playSlashBreakAnimation(() => {
          this.runKnightSlashSequence(line, currentCol + 1);
        });
      });
    });
  }

  private finishLine(line: WordLine): void {
    line.complete = true;
    this.wordsCompleted++;
    this.progressBar.updateProgress(this.wordsCompleted, ARCADE_UNLOCK_WORDS);

    if (this.wordsCompleted >= ARCADE_UNLOCK_WORDS && !this.arcadeUnlocked) {
      this.arcadeUnlocked = true;
      this.progressManager.completeLevel(this.levelConfig.levelId);
      this.progressManager.save();
      this.audioManager.playArcadeUnlock(() => {
        this.handleArcadeReward();
      });
      return;
    }

    const nextLineIndex = this.lines.findIndex(l => !l.complete);
    if (nextLineIndex === -1) {
      this.handleLevelComplete();
      return;
    }

    const p = this.gridToPixel({ row: this.lines[nextLineIndex].row, col: 0 });
    this.player.moveToPosition(p.x, p.y, () => {
      this.currentLineIndex = nextLineIndex;
      this.monkey.followKnight(p.x, p.y);
      this.isProcessing = false;
      this.refreshSelectableLineVisuals();
      this.updateHintText();
    });
  }

  private handleArcadeReward(): void {
    this.scene.start('GameSelectScene', {
      returnScene: 'SoundConstructionScene',
      returnData: {
        levelConfig: this.levelConfig,
        completeOnEnter: true,
      },
    });
  }

  private handleLevelComplete(): void {
    this.feedbackManager.playLevelComplete();
    this.progressManager.completeLevel(this.levelConfig.levelId);
    this.progressManager.save();

    this.time.delayedCall(2000, () => {
      this.scene.start('RewardScene', {
        message: `You read: ${this.selectedWords.join(', ')}`,
        nextScene: 'LevelSelectScene',
      });
    });
  }

  private updateHintText(): void {
    const line = this.lines[this.currentLineIndex];
    if (!line) return;

    if (line.complete) {
      this.hintText.setText('Line complete. Use UP/DOWN to choose another word.');
      return;
    }

    this.hintText.setText(`Line ${this.currentLineIndex + 1}: ${line.word}  •  Press SPACE`);
  }

  private refreshSelectableLineVisuals(): void {
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      for (const tile of line.tiles) {
        if (line.complete) continue;
        tile.setTileState(i === this.currentLineIndex ? LetterTileState.HIGHLIGHTED : LetterTileState.NORMAL);
      }
    }
  }

  private clearHighlights(): void {
    for (const line of this.lines) {
      if (line.complete) continue;
      for (const tile of line.tiles) {
        if (tile.getTileState() === LetterTileState.HIGHLIGHTED) {
          tile.setTileState(LetterTileState.NORMAL);
        }
      }
    }
  }

  private pickRandomWords(): string[] {
    const words3 = this.parseWordList('content/words3');
    const words5 = this.parseWordList('content/words5');
    const uniquePool = Array.from(new Set([...words3, ...words5]));

    const fallback = ['CAT', 'DOG', 'APPLE', 'WATER', 'SUN'];
    const pool = uniquePool.length >= 3 ? uniquePool : Array.from(new Set([...uniquePool, ...fallback]));

    const shuffled = Phaser.Utils.Array.Shuffle([...pool]);
    return shuffled.slice(0, 3);
  }

  private parseWordList(cacheKey: string): string[] {
    const raw = this.cache.text.get(cacheKey) as string | undefined;
    if (!raw) return [];

    return raw
      .split(/\r?\n/)
      .map(w => w.trim().toUpperCase())
      .filter(w => /^[A-Z]+$/.test(w));
  }

  private gridToPixel(pos: GridPosition): { x: number; y: number } {
    const cellSize = TILE_SIZE + TILE_GAP;
    const startX = GAME_WIDTH / 2 - ((GRID_COLS - 1) * cellSize) / 2;
    const startY = GAME_HEIGHT / 2 - 20 - ((GRID_ROWS - 1) * cellSize) / 2;

    return {
      x: startX + pos.col * cellSize,
      y: startY + pos.row * cellSize,
    };
  }

  private tileAt(row: number, col: number): LetterTile | null {
    return this.tilesByPos.get(this.keyFor(row, col)) ?? null;
  }

  private keyFor(row: number, col: number): string {
    return `${row}-${col}`;
  }
}
