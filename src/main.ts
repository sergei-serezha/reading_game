import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/Constants';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { AlphabetJourneyScene } from './scenes/AlphabetJourneyScene';
import { HiddenSequenceScene } from './scenes/HiddenSequenceScene';
import { SoundConstructionScene } from './scenes/SoundConstructionScene';
import { GameSelectScene } from './scenes/GameSelectScene';
import { ArcadeGameScene } from './scenes/ArcadeGameScene';
import { TronGameScene } from './scenes/TronGameScene';
import { RewardScene } from './scenes/RewardScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2d2d44',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  scene: [
    BootScene,
    MainMenuScene,
    LevelSelectScene,
    AlphabetJourneyScene,
    HiddenSequenceScene,
    SoundConstructionScene,
    GameSelectScene,
    ArcadeGameScene,
    TronGameScene,
    RewardScene,
  ],
};

new Phaser.Game(config);
