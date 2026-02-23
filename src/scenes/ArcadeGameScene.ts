import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/Constants';
import { ArcadeGameConfig } from '../types/ArcadeTypes';

export class ArcadeGameScene extends Phaser.Scene {
  private gameConfig: ArcadeGameConfig;
  private returnScene: string;
  private returnData: unknown;
  private timeLeft: number = 5;

  constructor() {
    super({ key: 'ArcadeGameScene' });
  }

  init(data: { gameConfig: ArcadeGameConfig; returnScene: string; returnData: unknown }): void {
    this.gameConfig = data.gameConfig;
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
    this.timeLeft = 5;
  }

  create(): void {
    const dedicatedScenes: Record<string, string> = {
      tron: 'TronGameScene',
      'pac-man': 'PacManGameScene',
      frogger: 'FroggerGameScene',
      'livi-kong': 'LiviKongGameScene',
      'donkey-kong': 'LiviKongGameScene',
    };

    const dedicatedTarget = dedicatedScenes[this.gameConfig.key];
    if (dedicatedTarget) {
      this.scene.start(dedicatedTarget, {
        gameConfig: this.gameConfig,
        returnScene: this.returnScene,
        returnData: this.returnData,
      });
      return;
    }

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x111122);

    // Game icon
    this.add.circle(centerX, centerY - 80, 50, this.gameConfig.iconColor);
    this.add.text(centerX, centerY - 80, this.gameConfig.name[0], {
      fontFamily: FONT_FAMILY,
      fontSize: '36px',
      color: '#000000',
    }).setOrigin(0.5);

    // Game name
    this.add.text(centerX, centerY - 10, this.gameConfig.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Coming soon text
    this.add.text(centerX, centerY + 30, 'Coming Soon!', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5);

    // Countdown
    const countdown = this.add.text(centerX, centerY + 80, `Returning in ${this.timeLeft}...`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Animated decoration
    for (let i = 0; i < 20; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(50, GAME_WIDTH - 50),
        Phaser.Math.Between(50, GAME_HEIGHT - 50),
        Phaser.Math.Between(1, 3),
        0xffffff,
      ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));

      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1,
      });
    }

    // Auto-return countdown
    this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        this.timeLeft--;
        if (this.timeLeft > 0) {
          countdown.setText(`Returning in ${this.timeLeft}...`);
        } else {
          this.scene.start('RewardScene', {
            message: `${this.gameConfig.name} - Coming Soon!`,
            nextScene: this.returnScene,
            nextData: this.returnData,
          });
        }
      },
    });

    // Skip button
    const skipBtn = this.add.text(centerX, GAME_HEIGHT - 40, 'Skip >', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => {
      this.scene.start('RewardScene', {
        message: `${this.gameConfig.name} - Coming Soon!`,
        nextScene: this.returnScene,
        nextData: this.returnData,
      });
    });
  }
}
