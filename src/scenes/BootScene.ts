import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/Constants';
import { AudioManager } from '../managers/AudioManager';
import { ProgressManager } from '../managers/ProgressManager';
import { RewardTracker } from '../managers/RewardTracker';
import { FeedbackManager } from '../managers/FeedbackManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Loading bar
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const loadingText = this.add.text(centerX, centerY - 40, 'Loading...', {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5);

    const progressBar = this.add.rectangle(centerX - 150, centerY, 0, 24, COLORS.TILE_HIGHLIGHTED);
    progressBar.setOrigin(0, 0.5);

    const progressBg = this.add.rectangle(centerX, centerY, 300, 24);
    progressBg.setStrokeStyle(2, 0x666688);
    progressBg.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.width = 300 * value;
    });

    this.load.on('complete', () => {
      loadingText.destroy();
      progressBar.destroy();
      progressBg.destroy();
    });

    // Load audio assets if they exist (gracefully fail for MVP)
    this.loadAudioAssets();
    this.loadTextAssets();
  }

  private loadAudioAssets(): void {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    // Special filename mappings for letters with non-standard file names
    const fileMap: Record<string, string> = {
      o: 'alphasounds-o-sh',
      p: 'alphasounds-p-2',
      u: 'alphasounds-u-sh',
    };
    for (const letter of alphabet) {
      const filename = fileMap[letter] ?? `alphasounds-${letter}`;
      this.load.audio(`phonics/${letter}`, `assets/${filename}.mp3`);
    }
    this.load.audio('words/cat', 'assets/audio/words/cat.mp3');
    this.load.audio('words/bed', 'assets/audio/words/bed.mp3');
    this.load.audio('feedback/say', 'assets/say.wav');
    this.load.audio('feedback/lets-find', 'assets/lets-find.wav');
    this.load.audio('feedback/arcade-unlock', 'assets/hooray_5_challenges_v2.wav');
    this.load.audio('feedback/correct', 'assets/audio/feedback/correct.mp3');
    this.load.audio('feedback/error', 'assets/audio/feedback/error.mp3');
    this.load.audio('feedback/level-complete', 'assets/audio/feedback/level-complete.mp3');

    // Don't fail on missing audio — just skip them
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Could not load asset: ${file.key} (${file.url}) — using placeholder`);
    });
  }

  private loadTextAssets(): void {
    this.load.text('content/about', 'assets/about.txt');
  }

  create(): void {
    // Generate placeholder textures
    this.generatePlaceholderTextures();

    // Initialize shared managers
    const audioManager = new AudioManager(this);
    const progressManager = new ProgressManager();
    const rewardTracker = new RewardTracker(progressManager);
    const feedbackManager = new FeedbackManager(this, audioManager);

    this.registry.set('audioManager', audioManager);
    this.registry.set('progressManager', progressManager);
    this.registry.set('rewardTracker', rewardTracker);
    this.registry.set('feedbackManager', feedbackManager);

    this.scene.start('MainMenuScene');
  }

  private generatePlaceholderTextures(): void {
    // Star particle texture
    const starGraphics = this.make.graphics({ x: 0, y: 0 });
    starGraphics.fillStyle(0xffd700, 1);
    starGraphics.fillCircle(8, 8, 8);
    starGraphics.generateTexture('star-particle', 16, 16);
    starGraphics.destroy();
  }
}
