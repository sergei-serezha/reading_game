import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/Constants';
import { ARCADE_GAMES } from '../config/ArcadeGameConfigs';

export class GameSelectScene extends Phaser.Scene {
  private returnScene: string;
  private returnData: unknown;

  constructor() {
    super({ key: 'GameSelectScene' });
  }

  init(data: { returnScene: string; returnData: unknown }): void {
    this.returnScene = data.returnScene;
    this.returnData = data.returnData;
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;

    // Celebration entrance
    this.cameras.main.flash(300, 255, 215, 0);

    // Title
    this.add.text(centerX, 40, '\u2605 You earned a game! \u2605', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(centerX, 70, 'Pick a game to play!', {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setAlpha(0.8);

    // Game cards grid (2 rows × 4 cols)
    const cols = 4;
    const cardWidth = 140;
    const cardHeight = 140;
    const gapX = 20;
    const gapY = 20;
    const startX = centerX - ((cols - 1) * (cardWidth + gapX)) / 2;
    const startY = 140;

    ARCADE_GAMES.forEach((game, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      // Card background
      const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x333355);
      card.setStrokeStyle(2, game.isUnlocked ? 0x6a6aff : 0x444466);

      // Game icon (colored circle placeholder)
      const icon = this.add.circle(x, y - 25, 28, game.iconColor);

      // First letter of game name as icon content
      this.add.text(x, y - 25, game.name[0], {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#000000',
      }).setOrigin(0.5);

      // Game name
      this.add.text(x, y + 20, game.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '10px',
        color: game.isUnlocked ? COLORS.TEXT_PRIMARY : '#555577',
        align: 'center',
      }).setOrigin(0.5);

      // Description
      this.add.text(x, y + 40, game.description, {
        fontFamily: FONT_FAMILY,
        fontSize: '7px',
        color: '#aaaacc',
        align: 'center',
        wordWrap: { width: cardWidth - 10 },
      }).setOrigin(0.5);

      if (game.isUnlocked) {
        card.setInteractive({ useHandCursor: true });

        card.on('pointerover', () => {
          card.setFillStyle(0x444477);
          card.setStrokeStyle(3, 0xaaaaff);
          this.tweens.add({ targets: [card, icon], scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });

        card.on('pointerout', () => {
          card.setFillStyle(0x333355);
          card.setStrokeStyle(2, 0x6a6aff);
          this.tweens.add({ targets: [card, icon], scaleX: 1, scaleY: 1, duration: 100 });
        });

        card.on('pointerdown', () => {
          // Route to dedicated scene if available, otherwise generic placeholder
          const dedicatedScenes: Record<string, string> = {
            tron: 'TronGameScene',
            'pac-man': 'PacManGameScene',
            frogger: 'FroggerGameScene',
            'livi-kong': 'LiviKongGameScene',
            'donkey-kong': 'LiviKongGameScene',
          };
          const targetScene = dedicatedScenes[game.key] ?? 'ArcadeGameScene';

          this.scene.start(targetScene, {
            gameConfig: game,
            returnScene: this.returnScene,
            returnData: this.returnData,
          });
        });
      }
    });
  }
}
