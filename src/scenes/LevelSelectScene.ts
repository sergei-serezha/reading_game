import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/Constants';
import { ProgressManager } from '../managers/ProgressManager';
import { LEVEL_1_CONFIG, LEVEL_2_CONFIG, LEVEL_3_CONFIG } from '../config/LevelConfigs';
import { ARCADE_GAMES } from '../config/ArcadeGameConfigs';
import { LevelConfig } from '../types/LevelTypes';

interface LevelButton {
  config: LevelConfig;
  label: string;
}

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const progressManager = this.registry.get('progressManager') as ProgressManager;

    // Title
    this.add.text(centerX, 60, 'Choose a Level', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const levels: LevelButton[] = [
      { config: LEVEL_1_CONFIG, label: '1' },
      { config: LEVEL_2_CONFIG, label: '2' },
      { config: LEVEL_3_CONFIG, label: '3' },
    ];

    levels.forEach((level, i) => {
      const x = centerX - 160 + i * 160;
      const y = GAME_HEIGHT / 2;
      const isUnlocked = progressManager.isLevelUnlocked(level.config.levelId);

      // Button background
      const btn = this.add.rectangle(x, y, 120, 120, isUnlocked ? COLORS.TILE_HIGHLIGHTED : COLORS.TILE_DISABLED);
      btn.setStrokeStyle(3, isUnlocked ? 0xaaaaff : 0x444466);

      // Level number
      this.add.text(x, y - 15, level.label, {
        fontFamily: FONT_FAMILY,
        fontSize: '36px',
        color: isUnlocked ? COLORS.TEXT_PRIMARY : '#555577',
      }).setOrigin(0.5);

      // Level name
      this.add.text(x, y + 25, level.config.levelName, {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        color: isUnlocked ? COLORS.TEXT_PRIMARY : '#555577',
        align: 'center',
        wordWrap: { width: 110 },
      }).setOrigin(0.5);

      if (isUnlocked) {
        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
          btn.setFillStyle(0x8888ff);
          this.tweens.add({ targets: btn, scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });

        btn.on('pointerout', () => {
          btn.setFillStyle(COLORS.TILE_HIGHLIGHTED);
          this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100 });
        });

        btn.on('pointerdown', () => {
          this.scene.start(level.config.sceneKey, { levelConfig: level.config });
        });
      } else {
        // Lock icon
        this.add.text(x, y - 15, '\uD83D\uDD12', {
          fontSize: '28px',
        }).setOrigin(0.5).setAlpha(0.5);
      }
    });

    // Direct links for POC testing (bypass level progression/reward gates)
    this.add.text(centerX, GAME_HEIGHT - 160, 'POC Direct Arcade Links', {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: COLORS.TEXT_ACCENT,
    }).setOrigin(0.5).setAlpha(0.9);

    const cols = 4;
    const btnW = 150;
    const btnH = 28;
    const gapX = 12;
    const gapY = 10;
    const startX = centerX - ((cols - 1) * (btnW + gapX)) / 2;
    const startY = GAME_HEIGHT - 130;

    ARCADE_GAMES.forEach((game, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (btnW + gapX);
      const y = startY + row * (btnH + gapY);

      const btn = this.add.rectangle(x, y, btnW, btnH, 0x2f2f52);
      btn.setStrokeStyle(2, game.iconColor);
      btn.setInteractive({ useHandCursor: true });

      const label = this.add.text(x, y, game.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        color: COLORS.TEXT_PRIMARY,
      }).setOrigin(0.5);

      btn.on('pointerover', () => {
        btn.setFillStyle(0x444477);
        this.tweens.add({ targets: [btn, label], scaleX: 1.04, scaleY: 1.04, duration: 80 });
      });

      btn.on('pointerout', () => {
        btn.setFillStyle(0x2f2f52);
        this.tweens.add({ targets: [btn, label], scaleX: 1, scaleY: 1, duration: 80 });
      });

      btn.on('pointerdown', () => {
        const dedicatedScenes: Record<string, string> = {
          tron: 'TronGameScene',
          'pac-man': 'PacManGameScene',
        };
        const targetScene = dedicatedScenes[game.key] ?? 'ArcadeGameScene';

        this.scene.start(targetScene, {
          gameConfig: game,
          returnScene: 'LevelSelectScene',
          returnData: {},
        });
      });
    });

    // Back button
    const backBtn = this.add.text(60, GAME_HEIGHT - 40, '< Back', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
