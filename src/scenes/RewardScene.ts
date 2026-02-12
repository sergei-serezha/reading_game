import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY, REWARD_DISPLAY_DURATION_MS } from '../config/Constants';
import { FeedbackManager } from '../managers/FeedbackManager';

export class RewardScene extends Phaser.Scene {
  private message: string;
  private nextScene: string;
  private nextData: unknown;

  constructor() {
    super({ key: 'RewardScene' });
  }

  init(data: { message: string; nextScene: string; nextData?: unknown }): void {
    this.message = data.message;
    this.nextScene = data.nextScene;
    this.nextData = data.nextData;
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const feedbackManager = this.registry.get('feedbackManager') as FeedbackManager;
    feedbackManager.setScene(this);

    // Flash
    this.cameras.main.flash(400, 255, 255, 200);

    // Star burst
    feedbackManager.emitStarBurst(centerX, centerY, 25);

    // Message
    const msg = this.add.text(centerX, centerY - 40, this.message, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5);

    // Scale-in animation
    msg.setScale(0);
    this.tweens.add({
      targets: msg,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Stars decoration
    const starText = this.add.text(centerX, centerY + 30, '\u2605 \u2605 \u2605', {
      fontSize: '40px',
      color: COLORS.TEXT_ACCENT,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: starText,
      alpha: 1,
      duration: 600,
      delay: 300,
      ease: 'Power2',
    });

    // Auto-transition
    this.time.delayedCall(REWARD_DISPLAY_DURATION_MS, () => {
      this.scene.start(this.nextScene, this.nextData ?? {});
    });

    // Tap to skip
    this.input.on('pointerdown', () => {
      this.scene.start(this.nextScene, this.nextData ?? {});
    });
  }
}
