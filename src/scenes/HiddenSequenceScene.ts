import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/Constants';
import { LevelConfig, GridPosition } from '../types/LevelTypes';
import { LetterGrid } from '../objects/LetterGrid';
import { LetterTile, LetterTileState } from '../objects/LetterTile';
import { PlayerCharacter } from '../objects/PlayerCharacter';
import { ProgressBar } from '../objects/ProgressBar';
import { InputManager, Direction } from '../managers/InputManager';
import { AudioManager } from '../managers/AudioManager';
import { FeedbackManager } from '../managers/FeedbackManager';
import { RewardTracker } from '../managers/RewardTracker';
import { ProgressManager } from '../managers/ProgressManager';

/**
 * Level 2: Hidden Sequence
 *
 * Same grid navigation as Level 1, but some letter tiles start hidden.
 * The child must navigate to the correct position based on the sequence,
 * even though they can't see the hidden letter.
 *
 * When the child steps on the correct hidden tile, it reveals with an animation.
 * Stepping on the wrong hidden tile plays a gentle "not yet" feedback.
 */
export class HiddenSequenceScene extends Phaser.Scene {
  private static readonly SAY_TO_LETTER_DELAY_MS = 550;
  private static readonly LETS_FIND_TO_LETTER_DELAY_MS = 440;
  private levelConfig: LevelConfig;
  private grid: LetterGrid;
  private player: PlayerCharacter;
  private inputManager: InputManager;
  private audioManager: AudioManager;
  private feedbackManager: FeedbackManager;
  private rewardTracker: RewardTracker;
  private progressManager: ProgressManager;
  private progressBar: ProgressBar;
  private currentPosition: GridPosition;
  private isProcessing: boolean = false;

  constructor() {
    super({ key: 'HiddenSequenceScene' });
  }

  init(data: { levelConfig: LevelConfig }): void {
    this.levelConfig = data.levelConfig;
  }

  create(): void {
    // Get shared managers
    this.audioManager = this.registry.get('audioManager') as AudioManager;
    this.feedbackManager = this.registry.get('feedbackManager') as FeedbackManager;
    this.rewardTracker = this.registry.get('rewardTracker') as RewardTracker;
    this.progressManager = this.registry.get('progressManager') as ProgressManager;

    this.audioManager.setScene(this);
    this.feedbackManager.setScene(this);

    // Level title
    this.add.text(GAME_WIDTH / 2, 30, this.levelConfig.levelName, {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Instruction text
    this.add.text(GAME_WIDTH / 2, 60, 'Some letters are hidden! Find them in order.', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setAlpha(0.7);

    // Build grid
    this.grid = new LetterGrid(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 20,
      this.levelConfig.letters,
      this.levelConfig.gridWidth,
      this.levelConfig.gridHeight,
      this.levelConfig.sequence,
    );

    // Find start position
    const startLetter = this.levelConfig.letters.find(l => l.isStartPosition);
    this.currentPosition = startLetter?.position ?? { row: 0, col: 0 };

    // Mark start tile as completed
    this.grid.markCompleted(this.currentPosition);

    // Place player
    const startPixel = this.grid.gridToPixel(this.currentPosition);
    this.player = new PlayerCharacter(this, startPixel.x, startPixel.y);
    this.player.setDepth(10);

    // Advance past the start letter in the sequence
    this.grid.advanceSequence();

    // Highlight valid moves
    this.grid.highlightAdjacent(this.currentPosition);

    // Show target letter hint (with "?" for hidden ones)
    this.showTargetHint();

    // Setup input
    this.inputManager = new InputManager(this);
    this.inputManager.enable();

    // Setup tap-on-tile
    this.setupTileTapHandlers();

    // Progress bar
    this.progressBar = new ProgressBar(this, GAME_WIDTH - 230, GAME_HEIGHT - 30, 200, 18);
    this.progressBar.setDepth(50);
    const progress = this.rewardTracker.getProgress();
    this.progressBar.updateProgress(progress.current, progress.target);

  }

  update(): void {
    if (this.isProcessing) return;

    const dir = this.inputManager.consumeDirection();
    if (dir === Direction.NONE) return;

    this.handleMovement(dir);
  }

  private handleMovement(dir: Direction): void {
    const delta = this.directionToDelta(dir);
    const targetPos: GridPosition = {
      row: this.currentPosition.row + delta.row,
      col: this.currentPosition.col + delta.col,
    };

    const targetTile = this.grid.getTileAt(targetPos);
    if (!targetTile) return;

    this.isProcessing = true;

    const targetPixel = this.grid.gridToPixel(targetPos);
    this.player.moveToPosition(targetPixel.x, targetPixel.y, () => {
      this.onMoveComplete(targetTile, targetPos);
    });
  }

  private onMoveComplete(targetTile: LetterTile, targetPos: GridPosition): void {
    // Empty tile: just walk there
    if (targetTile.isEmpty) {
      this.currentPosition = targetPos;
      this.grid.clearHighlights();
      this.grid.highlightAdjacent(this.currentPosition);
      this.setupTileTapHandlers();
      this.isProcessing = false;
      return;
    }

    // Letter tile (visible or hidden): validate against expected
    const expectedLetter = this.grid.getCurrentTargetLetter();

    if (targetTile.letter === expectedLetter) {
      this.handleCorrectMove(targetTile, targetPos);
    } else {
      this.handleIncorrectMove(targetTile, targetPos);
    }
  }

  private handleCorrectMove(tile: LetterTile, pos: GridPosition): void {
    // If it was hidden, reveal it first with animation
    if (tile.getTileState() === LetterTileState.HIDDEN) {
      tile.playRevealAnimation();
    }

    // Mark completed
    this.grid.markCompleted(pos);
    tile.playSelectAnimation();

    // Visual feedback
    const px = this.grid.gridToPixel(pos);
    this.feedbackManager.playCorrect(px.x, px.y);
    this.player.playCelebration();

    // Record progress
    this.progressManager.masterLetter(tile.letter);
    const earnedArcade = this.rewardTracker.recordCorrect();

    // Update progress bar
    const progress = this.rewardTracker.getProgress();
    this.progressBar.updateProgress(progress.current, progress.target);

    // "Say" + current letter always plays first after landing
    this.playSayThenPhoneme(tile.letter, () => {
      // Check if earned arcade game
      if (earnedArcade) {
        this.audioManager.playArcadeUnlock(() => {
          this.handleArcadeReward(pos);
        });
        return;
      }

      const hasMore = this.grid.advanceSequence();

      if (!hasMore) {
        this.handleLevelComplete();
        return;
      }

      this.currentPosition = pos;
      this.grid.clearHighlights();
      this.grid.highlightAdjacent(this.currentPosition);
      this.setupTileTapHandlers();
      this.showTargetHint();
    });
  }

  private handleIncorrectMove(tile: LetterTile, _pos: GridPosition): void {
    // Shake feedback
    this.feedbackManager.playIncorrect(tile as unknown as Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject);

    // Move character back
    const prevPixel = this.grid.gridToPixel(this.currentPosition);
    this.time.delayedCall(300, () => {
      this.player.moveToPosition(prevPixel.x, prevPixel.y, () => {
        // Replay current challenge on wrong landing
        this.showTargetHint();
      });
    });
  }

  private handleArcadeReward(currentPos: GridPosition): void {
    const resumeData = {
      levelConfig: this.levelConfig,
      currentPosition: currentPos,
      sequenceIndex: this.grid.getSequenceIndex(),
    };

    this.scene.start('GameSelectScene', {
      returnScene: 'HiddenSequenceScene',
      returnData: resumeData,
    });
  }

  private handleLevelComplete(): void {
    this.feedbackManager.playLevelComplete();
    this.progressManager.completeLevel(this.levelConfig.levelId);
    this.progressManager.save();

    this.time.delayedCall(2000, () => {
      this.scene.start('RewardScene', {
        message: 'Level Complete!',
        nextScene: 'LevelSelectScene',
      });
    });
  }

  private showTargetHint(): void {
    this.children.getByName('targetHint')?.destroy();
    this.children.getByName('targetHintBtn')?.destroy();

    const target = this.grid.getCurrentTargetLetter();
    if (!target) return;

    // Check if the target letter is hidden
    const targetTile = this.grid.getTileByLetter(target);
    const isHidden = targetTile?.getTileState() === LetterTileState.HIDDEN;

    const hintText = isHidden ? `Find: ?` : `Find: ${target}`;

    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, hintText, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setName('targetHint');

    this.tweens.add({
      targets: hint,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // Block input while challenge prompt is spoken
    this.isProcessing = true;
    this.playLetsFindThenPhoneme(target, () => {
      this.isProcessing = false;
    });

    const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, '\uD83D\uDD0A', {
      fontSize: '28px',
    }).setOrigin(0.5).setName('targetHintBtn').setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.isProcessing = true;
      this.playLetsFindThenPhoneme(target, () => {
        this.isProcessing = false;
      });
      this.tweens.add({
        targets: btn,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    });
  }

  /** Play "Say" voice clip followed by the letter's phoneme sound */
  private playSayThenPhoneme(letter: string, onComplete?: () => void): void {
    this.audioManager.playSay();
    this.time.delayedCall(HiddenSequenceScene.SAY_TO_LETTER_DELAY_MS, () => {
      this.audioManager.playPhonemeAndWait(letter, onComplete);
    });
  }

  /** Play "Let's Find" voice clip followed by the letter's phoneme sound */
  private playLetsFindThenPhoneme(letter: string, onComplete?: () => void): void {
    this.audioManager.playLetsFind();
    this.time.delayedCall(HiddenSequenceScene.LETS_FIND_TO_LETTER_DELAY_MS, () => {
      this.audioManager.playPhonemeAndWait(letter, onComplete);
    });
  }

  private setupTileTapHandlers(): void {
    const adjacent = this.grid.getAdjacentPositions(this.currentPosition);
    for (const pos of adjacent) {
      const tile = this.grid.getTileAt(pos);
      if (!tile) continue;

      const st = tile.getTileState();
      const isTappable = st === LetterTileState.HIGHLIGHTED
        || st === LetterTileState.EMPTY_HIGHLIGHTED
        || st === LetterTileState.HIDDEN;

      if (!isTappable) continue;

      tile.removeAllListeners('pointerdown');
      tile.on('pointerdown', () => {
        if (this.isProcessing) return;
        this.isProcessing = true;
        const targetPixel = this.grid.gridToPixel(pos);
        this.player.moveToPosition(targetPixel.x, targetPixel.y, () => {
          this.onMoveComplete(tile, pos);
        });
      });
    }
  }

  private directionToDelta(dir: Direction): GridPosition {
    switch (dir) {
      case Direction.UP: return { row: -1, col: 0 };
      case Direction.DOWN: return { row: 1, col: 0 };
      case Direction.LEFT: return { row: 0, col: -1 };
      case Direction.RIGHT: return { row: 0, col: 1 };
      default: return { row: 0, col: 0 };
    }
  }
}
