import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/Constants';

export class MainMenuScene extends Phaser.Scene {
  private aboutModal: Phaser.GameObjects.Container | null = null;
  private aboutModalContent: Phaser.GameObjects.DOMElement | null = null;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Title
    this.add.text(centerX, centerY - 120, 'Reading', {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      color: COLORS.TEXT_ACCENT,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 60, 'Adventure', {
      fontFamily: FONT_FAMILY,
      fontSize: '36px',
      color: COLORS.TEXT_PRIMARY,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Decorative letters floating
    const letters = ['A', 'B', 'C', 'D', 'E'];
    letters.forEach((letter, i) => {
      const lx = centerX - 160 + i * 80;
      const ly = centerY + 10;
      const t = this.add.text(lx, ly, letter, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#6a6aff',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: t,
        y: ly - 10,
        duration: 1000 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });

    // Play button
    const playBtn = this.add.rectangle(centerX, centerY + 100, 200, 60, COLORS.TILE_HIGHLIGHTED);
    playBtn.setStrokeStyle(3, 0xaaaaff);
    playBtn.setInteractive({ useHandCursor: true });

    const playText = this.add.text(centerX, centerY + 100, 'PLAY', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5);

    playBtn.on('pointerover', () => {
      playBtn.setFillStyle(0x8888ff);
      this.tweens.add({ targets: [playBtn, playText], scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });

    playBtn.on('pointerout', () => {
      playBtn.setFillStyle(COLORS.TILE_HIGHLIGHTED);
      this.tweens.add({ targets: [playBtn, playText], scaleX: 1, scaleY: 1, duration: 100 });
    });

    playBtn.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });

    this.add.text(centerX, centerY + 150, 'Created for Cyrus', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: COLORS.TEXT_PRIMARY,
    }).setOrigin(0.5).setAlpha(0.8);

    const aboutLink = this.add.text(centerX, centerY + 176, 'About the Game and a Creator', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#7ec8ff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    aboutLink.on('pointerover', () => aboutLink.setStyle({ color: '#aee0ff' }));
    aboutLink.on('pointerout', () => aboutLink.setStyle({ color: '#7ec8ff' }));
    aboutLink.on('pointerdown', () => this.showAboutModal());

    // Keyboard support
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('LevelSelectScene');
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private showAboutModal(): void {
    if (this.aboutModal) {
      this.aboutModal.destroy();
      this.aboutModal = null;
    }
    if (this.aboutModalContent) {
      this.aboutModalContent.destroy();
      this.aboutModalContent = null;
    }

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const panelWidth = 560;
    const panelHeight = 520;
    const textBoxWidth = 500;
    const textBoxHeight = 340;
    const aboutText = this.cache.text.get('content/about') as string | undefined;
    const body = aboutText?.trim() || 'About text is not available.';

    const overlay = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setInteractive();
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, 0x1f1f33);
    panel.setStrokeStyle(3, 0x666688);

    const title = this.add.text(centerX, centerY - 230, 'About the Game and a Creator', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: COLORS.TEXT_ACCENT,
    }).setOrigin(0.5);

    this.aboutModalContent = this.add.dom(centerX - 160, centerY - 100, 'div', {
      width: `${textBoxWidth}px`,
      height: `${textBoxHeight}px`,
      color: COLORS.TEXT_PRIMARY,
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontSize: '13px',
      lineHeight: '1.45',
      textAlign: 'left',
      whiteSpace: 'pre-wrap',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '8px 12px',
      boxSizing: 'border-box',
    }, body);
    this.aboutModalContent.setOrigin(0.5);
    this.aboutModalContent.setDepth(210);

    const closeBtn = this.add.text(centerX, centerY + 225, 'CLOSE', {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#3a3a60',
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const closeModal = () => {
      this.aboutModal?.destroy();
      this.aboutModal = null;
      this.aboutModalContent?.destroy();
      this.aboutModalContent = null;
    };

    overlay.on('pointerdown', closeModal);
    closeBtn.on('pointerdown', closeModal);

    this.aboutModal = this.add.container(0, 0, [overlay, panel, title, closeBtn]).setDepth(200);
  }
}
