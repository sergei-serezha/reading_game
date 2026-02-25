import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY, getSayDelay, getLetsFindDelay } from '../config/Constants';
import { generateLevel1Config } from '../config/LevelConfigs';
import { AudioDebugOverlay } from '../objects/AudioDebugOverlay';
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

export class AlphabetJourneyScene extends Phaser.Scene {
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
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private awaitingSlashInput: boolean = false;
  private slashPrompt: Phaser.GameObjects.Text | null = null;
  private pendingSlashTile: LetterTile | null = null;
  private pendingSlashPosition: GridPosition | null = null;
  private pendingArcadeReward: boolean = false;
  private audioDebugOverlay: AudioDebugOverlay | null = null;

  constructor() {
    super({ key: 'AlphabetJourneyScene' });
  }

  init(data: { levelConfig: LevelConfig }): void {
    // Always generate a fresh layout for Level 1 so every session has new letters
    this.levelConfig = data.levelConfig.levelId === 1
      ? generateLevel1Config()
      : data.levelConfig;
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

    // Pick a random empty tile as the starting position
    this.currentPosition = this.pickRandomEmptyStart();

    // Place player
    const startPixel = this.grid.gridToPixel(this.currentPosition);
    this.player = new PlayerCharacter(this, startPixel.x, startPixel.y);
    this.player.setDepth(10);

    // Highlight valid moves
    this.grid.highlightAdjacent(this.currentPosition);

    // Announce initial challenge before user can move
    this.showTargetHint();

    // Setup input
    this.inputManager = new InputManager(this);
    this.inputManager.enable();
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) ?? null;
    this.input.keyboard?.on('keydown-BACKTICK', () => {
      if (this.audioDebugOverlay) {
        this.audioDebugOverlay.destroy();
        this.audioDebugOverlay = null;
      } else {
        this.audioDebugOverlay = new AudioDebugOverlay(this);
      }
    });
    this.events.on('audioDebugOverlayClosed', () => { this.audioDebugOverlay = null; });

    // Setup tap-on-tile
    this.setupTileTapHandlers();

    // Progress bar for arcade game reward
    this.progressBar = new ProgressBar(this, GAME_WIDTH - 230, GAME_HEIGHT - 30, 200, 18);
    this.progressBar.setDepth(50);
    const progress = this.rewardTracker.getProgress();
    this.progressBar.updateProgress(progress.current, progress.target);
  }

  update(): void {
    if (this.awaitingSlashInput) {
      if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.resolveSlashStep();
      }
      return;
    }

    if (this.isProcessing) return;

    const dir = this.inputManager.consumeDirection();
    if (dir === Direction.NONE) return;

    this.handleMovement(dir);
  }

  /** Pick a random empty tile for the player to start on */
  private pickRandomEmptyStart(): GridPosition {
    const emptyTiles = this.levelConfig.letters.filter(l => l.isEmpty);
    if (emptyTiles.length === 0) {
      // Fallback: use the first letter's position
      return this.levelConfig.letters[0]?.position ?? { row: 0, col: 0 };
    }
    const pick = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    return pick.position;
  }

  private handleMovement(dir: Direction): void {
    const delta = this.directionToDelta(dir);
    const targetPos: GridPosition = {
      row: this.currentPosition.row + delta.row,
      col: this.currentPosition.col + delta.col,
    };

    const targetTile = this.grid.getTileAt(targetPos);
    if (!targetTile) return; // No tile in that direction

    this.isProcessing = true;

    // Animate character movement
    const targetPixel = this.grid.gridToPixel(targetPos);
    this.player.moveToPosition(targetPixel.x, targetPixel.y, () => {
      this.onMoveComplete(targetTile, targetPos);
    });
  }

  private onMoveComplete(targetTile: LetterTile, targetPos: GridPosition): void {
    // Empty tile or already-slashed tile: just walk there, no validation needed
    if (targetTile.isEmpty || targetTile.isBroken) {
      this.currentPosition = targetPos;
      this.grid.clearHighlights();
      this.grid.highlightAdjacent(this.currentPosition);
      this.setupTileTapHandlers();
      this.isProcessing = false;
      return;
    }

    // Letter tile: validate against the expected next letter
    const expectedLetter = this.grid.getCurrentTargetLetter();

    if (targetTile.letter === expectedLetter) {
      this.handleCorrectMove(targetTile, targetPos);
    } else {
      this.handleIncorrectMove(targetTile, targetPos);
    }
  }

  private handleCorrectMove(tile: LetterTile, pos: GridPosition): void {
    this.clearTargetHint();

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
      this.awaitingSlashInput = true;
      this.isProcessing = true;
      this.pendingSlashTile = tile;
      this.pendingSlashPosition = pos;
      this.pendingArcadeReward = earnedArcade;
      this.showSlashPrompt();
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
      returnScene: 'AlphabetJourneyScene',
      returnData: resumeData,
    });
  }

  private handleLevelComplete(): void {
    this.clearSlashPrompt();
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

  /**
   * Show the target hint: a speaker button that plays the target letter's
   * phoneme sound. No text spelling out the letter — just audio for pre-readers.
   */
  private showTargetHint(): void {
    this.clearSlashPrompt();
    this.clearTargetHint();

    const target = this.grid.getCurrentTargetLetter();
    if (!target) return;

    // Block input while challenge audio plays
    this.isProcessing = true;
    this.playLetsFindThenPhoneme(target, () => {
      this.isProcessing = false;
    });

    // Speaker icon button — child can tap to hear the prompt again
    const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 46, '\uD83D\uDD0A', {
      fontSize: '32px',
    }).setOrigin(0.5).setName('targetHintBtn').setInteractive({ useHandCursor: true });

    // Label under the speaker
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'Tap to hear again', {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setName('targetHint').setAlpha(0.5);

    // Gentle pulse on the speaker icon
    this.tweens.add({
      targets: btn,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // Tap speaker to replay "Let's Find" + phoneme
    btn.on('pointerdown', () => {
      this.isProcessing = true;
      this.playLetsFindThenPhoneme(target, () => {
        this.isProcessing = false;
      });
      // Quick bounce feedback
      this.tweens.add({
        targets: btn,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    });
  }

  /** Play "Say" voice clip followed by the letter's phoneme sound */
  private playSayThenPhoneme(letter: string, onComplete?: () => void): void {
    this.audioManager.playSay();
    this.time.delayedCall(getSayDelay(), () => {
      this.audioManager.playPhonemeAndWait(letter, onComplete);
    });
  }

  /** Play "Let's Find" voice clip followed by the letter's phoneme sound */
  private playLetsFindThenPhoneme(letter: string, onComplete?: () => void): void {
    this.audioManager.playLetsFind();
    this.time.delayedCall(getLetsFindDelay(), () => {
      this.audioManager.playPhonemeAndWait(letter, onComplete);
    });
  }

  private setupTileTapHandlers(): void {
    const adjacent = this.grid.getAdjacentPositions(this.currentPosition);
    for (const pos of adjacent) {
      const tile = this.grid.getTileAt(pos);
      if (!tile) continue;

      const st = tile.getTileState();
      const isHighlighted = st === LetterTileState.HIGHLIGHTED || st === LetterTileState.EMPTY_HIGHLIGHTED;
      if (!isHighlighted) continue;

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

  private showSlashPrompt(): void {
    this.clearSlashPrompt();
    this.slashPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'Press SPACE to slash!', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: this.slashPrompt,
      alpha: 0.45,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  private clearSlashPrompt(): void {
    if (!this.slashPrompt) return;
    this.tweens.killTweensOf(this.slashPrompt);
    this.slashPrompt.destroy();
    this.slashPrompt = null;
  }

  private clearTargetHint(): void {
    this.children.getByName('targetHint')?.destroy();
    this.children.getByName('targetHintBtn')?.destroy();
  }

  private resolveSlashStep(): void {
    const tile = this.pendingSlashTile;
    const pos = this.pendingSlashPosition;
    if (!tile || !pos) return;

    this.awaitingSlashInput = false;
    this.clearSlashPrompt();

    this.player.playSlashAnimation(() => {
      tile.playSlashBreakAnimation(() => {
        this.pendingSlashTile = null;
        this.pendingSlashPosition = null;
        this.continueAfterSlash(pos, this.pendingArcadeReward);
      });
    });
  }

  private continueAfterSlash(pos: GridPosition, earnedArcade: boolean): void {
    if (earnedArcade) {
      this.pendingArcadeReward = false;
      this.audioManager.playArcadeUnlock(() => {
        this.handleArcadeReward(pos);
      });
      return;
    }

    this.pendingArcadeReward = false;
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
