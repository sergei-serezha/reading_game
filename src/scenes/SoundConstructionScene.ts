import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY, TILE_SIZE, TILE_GAP, FEEDBACK_DELAY_MS } from '../config/Constants';
import { LevelConfig } from '../types/LevelTypes';
import { LetterTile, LetterTileState } from '../objects/LetterTile';
import { ProgressBar } from '../objects/ProgressBar';
import { AudioManager } from '../managers/AudioManager';
import { FeedbackManager } from '../managers/FeedbackManager';
import { RewardTracker } from '../managers/RewardTracker';
import { ProgressManager } from '../managers/ProgressManager';

/**
 * Level 3: Sound Construction
 *
 * The child sees letter tiles and must tap them in the correct
 * sequence to build words one at a time.
 *
 * Supports multiple target words (e.g., "CAT" then "BED").
 * After each word is completed, a mini-celebration plays,
 * tiles reset for the next word. After all words are done,
 * the level completes.
 */
export class SoundConstructionScene extends Phaser.Scene {
  private levelConfig: LevelConfig;
  private audioManager: AudioManager;
  private feedbackManager: FeedbackManager;
  private rewardTracker: RewardTracker;
  private progressManager: ProgressManager;
  private progressBar: ProgressBar;

  private letterTiles: LetterTile[] = [];
  private sequence: string[] = [];
  private sequenceIndex: number = 0;
  private isProcessing: boolean = false;

  private targetWords: string[] = [];
  private currentWordIndex: number = 0;
  private currentWordStart: number = 0; // index into sequence where current word starts

  private wordDisplay: Phaser.GameObjects.Text;
  private wordLabel: Phaser.GameObjects.Text;
  private builtWord: string = '';

  constructor() {
    super({ key: 'SoundConstructionScene' });
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

    this.sequence = [...this.levelConfig.sequence];
    this.sequenceIndex = 0;
    this.builtWord = '';
    this.letterTiles = [];

    this.targetWords = [...(this.levelConfig.targetWords ?? [])];
    this.currentWordIndex = 0;
    this.currentWordStart = 0;

    // Level title
    this.add.text(GAME_WIDTH / 2, 30, this.levelConfig.levelName, {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Instruction text
    this.add.text(GAME_WIDTH / 2, 60, 'Tap the letters in order to build the word!', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setAlpha(0.7);

    // Target word label (shows what word they're currently building)
    this.wordLabel = this.add.text(GAME_WIDTH / 2, 110, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: COLORS.TEXT_PRIMARY,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0.5);

    // Word building display — shows assembled letters so far
    this.wordDisplay = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Build letter tiles in a row
    this.buildLetterTiles();

    // Setup for the first word
    this.setupCurrentWord();

    // Progress bar
    this.progressBar = new ProgressBar(this, GAME_WIDTH - 230, GAME_HEIGHT - 30, 200, 18);
    this.progressBar.setDepth(50);
    const progress = this.rewardTracker.getProgress();
    this.progressBar.updateProgress(progress.current, progress.target);
  }

  private buildLetterTiles(): void {
    const letters = this.levelConfig.letters;
    const cellSize = TILE_SIZE + TILE_GAP;
    const totalWidth = (letters.length - 1) * cellSize;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const y = GAME_HEIGHT / 2 + 40;

    for (let i = 0; i < letters.length; i++) {
      const config = letters[i];
      const x = startX + i * cellSize;

      const tile = new LetterTile(
        this,
        x,
        y,
        config.letter,
        0,
        i,
        false,
      );

      tile.setTileState(LetterTileState.DISABLED);
      this.add.existing(tile);

      // Setup tap handler
      tile.on('pointerdown', () => {
        this.handleTileTap(tile, i);
      });

      this.letterTiles.push(tile);
    }
  }

  /** Prepare the UI for the current word: update label, reset tiles, highlight active ones */
  private setupCurrentWord(): void {
    const currentWord = this.targetWords[this.currentWordIndex] ?? '';
    this.wordLabel.setText(`Build: ${currentWord}`);
    this.builtWord = '';
    this.wordDisplay.setText('');
    this.wordDisplay.setAlpha(1);

    // Figure out which tiles belong to this word
    const wordLen = currentWord.length;
    this.currentWordStart = 0;
    for (let w = 0; w < this.currentWordIndex; w++) {
      this.currentWordStart += (this.targetWords[w]?.length ?? 0);
    }

    // Reset all tiles: disable tiles not in current word, set current word tiles to normal
    for (let i = 0; i < this.letterTiles.length; i++) {
      if (i >= this.currentWordStart && i < this.currentWordStart + wordLen) {
        this.letterTiles[i].setTileState(LetterTileState.NORMAL);
      } else {
        this.letterTiles[i].setTileState(
          i < this.currentWordStart ? LetterTileState.COMPLETED : LetterTileState.DISABLED
        );
      }
    }

    this.showTargetHint();
    this.updateTileStates();
  }

  private handleTileTap(tile: LetterTile, index: number): void {
    if (this.isProcessing) return;

    const st = tile.getTileState();
    if (st === LetterTileState.COMPLETED || st === LetterTileState.DISABLED) return;

    const expectedLetter = this.sequence[this.sequenceIndex];

    if (tile.letter === expectedLetter) {
      this.handleCorrectTap(tile);
    } else {
      this.handleIncorrectTap(tile);
    }
  }

  private handleCorrectTap(tile: LetterTile): void {
    this.isProcessing = true;

    // Play phoneme
    this.audioManager.playPhoneme(tile.letter);

    // Mark completed
    tile.setTileState(LetterTileState.COMPLETED);
    tile.playSelectAnimation();

    // Visual feedback
    this.feedbackManager.playCorrect(tile.x, tile.y);

    // Add letter to word display
    this.builtWord += tile.letter;
    this.wordDisplay.setText(this.builtWord);

    // Animate the word display
    this.tweens.add({
      targets: this.wordDisplay,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    // Record progress
    this.progressManager.masterLetter(tile.letter);
    const earnedArcade = this.rewardTracker.recordCorrect();

    // Update progress bar
    const progress = this.rewardTracker.getProgress();
    this.progressBar.updateProgress(progress.current, progress.target);

    // Advance sequence
    this.sequenceIndex++;

    // Check if earned arcade game
    if (earnedArcade) {
      this.audioManager.playArcadeUnlock(() => {
        this.handleArcadeReward();
      });
      return;
    }

    // Check if current word is complete
    const currentWord = this.targetWords[this.currentWordIndex] ?? '';
    if (this.builtWord.length >= currentWord.length) {
      this.time.delayedCall(FEEDBACK_DELAY_MS, () => {
        this.handleWordComplete();
      });
    } else {
      this.time.delayedCall(300, () => {
        this.showTargetHint();
        this.updateTileStates();
        this.isProcessing = false;
      });
    }
  }

  private handleIncorrectTap(tile: LetterTile): void {
    tile.playRejectAnimation();
    this.audioManager.playError();
    this.feedbackManager.showFloatingText(tile.x, tile.y - 50, 'Try again!');
  }

  private handleWordComplete(): void {
    // Play the full word sound
    const currentWord = this.targetWords[this.currentWordIndex];
    if (currentWord) {
      this.audioManager.playWord(currentWord.toLowerCase());
    }

    // Mini celebration for the word
    this.feedbackManager.emitStarBurst(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 12);
    this.feedbackManager.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, `${currentWord}!`);

    // Move to the next word or finish
    this.currentWordIndex++;

    if (this.currentWordIndex < this.targetWords.length) {
      // More words to build — brief pause, then set up next word
      this.time.delayedCall(1500, () => {
        this.setupCurrentWord();
        this.isProcessing = false;
      });
    } else {
      // All words done — level complete!
      this.handleLevelComplete();
    }
  }

  private handleLevelComplete(): void {
    this.feedbackManager.playLevelComplete();

    // Show final celebration with all words
    const allWords = this.targetWords.join(' + ');
    const celebrationText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, allWords, {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(100);

    this.tweens.add({
      targets: this.wordDisplay,
      alpha: 0,
      duration: 300,
    });

    this.tweens.add({
      targets: celebrationText,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: celebrationText,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 400,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.inOut',
        });
      },
    });

    this.time.delayedCall(800, () => {
      this.feedbackManager.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'You spelled them all!');
    });

    this.progressManager.completeLevel(this.levelConfig.levelId);
    this.progressManager.save();

    this.time.delayedCall(3000, () => {
      this.scene.start('RewardScene', {
        message: `You built: ${allWords}!`,
        nextScene: 'LevelSelectScene',
      });
    });
  }

  private handleArcadeReward(): void {
    this.scene.start('GameSelectScene', {
      returnScene: 'SoundConstructionScene',
      returnData: { levelConfig: this.levelConfig },
    });
  }

  private showTargetHint(): void {
    this.children.getByName('targetHint')?.destroy();

    if (this.sequenceIndex >= this.sequence.length) return;

    const target = this.sequence[this.sequenceIndex];
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, `Tap: ${target}`, {
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
  }

  private updateTileStates(): void {
    const expectedLetter = this.sequence[this.sequenceIndex];
    const currentWord = this.targetWords[this.currentWordIndex] ?? '';
    const wordEnd = this.currentWordStart + currentWord.length;

    for (let i = 0; i < this.letterTiles.length; i++) {
      const tile = this.letterTiles[i];
      const st = tile.getTileState();
      if (st === LetterTileState.COMPLETED || st === LetterTileState.DISABLED) continue;

      // Only tiles in the current word range can be highlighted
      if (i >= this.currentWordStart && i < wordEnd) {
        if (tile.letter === expectedLetter) {
          tile.setTileState(LetterTileState.HIGHLIGHTED);
        } else {
          tile.setTileState(LetterTileState.NORMAL);
        }
      }
    }
  }
}
