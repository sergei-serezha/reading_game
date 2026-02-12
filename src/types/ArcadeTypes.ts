import Phaser from 'phaser';

/** Configuration for an arcade reward game */
export interface ArcadeGameConfig {
  key: string;
  name: string;
  description: string;
  iconColor: number;
  isUnlocked: boolean;
}

/** Interface for arcade game plugins */
export interface ArcadeGamePlugin {
  key: string;
  setup(scene: Phaser.Scene): void;
  update(time: number, delta: number): void;
  destroy(): void;
  onComplete: () => void;
}
