import { ArcadeGameConfig } from '../types/ArcadeTypes';

export const ARCADE_GAMES: ArcadeGameConfig[] = [
  { key: 'tron', name: 'TRON', description: 'Light cycle trail game', iconColor: 0x00ffff, isUnlocked: true },
  { key: 'centipede', name: 'Centipede', description: 'Shoot the segments', iconColor: 0x00ff00, isUnlocked: true },
  { key: 'defender', name: 'Defender', description: 'Space shooter', iconColor: 0xff4444, isUnlocked: true },
  { key: 'missile-command', name: 'Missile Cmd', description: 'Defend cities', iconColor: 0xff8800, isUnlocked: true },
  { key: 'pac-man', name: 'Pac-Man', description: 'Eat the pellets', iconColor: 0xffff00, isUnlocked: true },
  { key: 'donkey-kong', name: 'Donkey Kong', description: 'Climb to the top', iconColor: 0x8b4513, isUnlocked: true },
  { key: 'frogger', name: 'Frogger', description: 'Cross the road', iconColor: 0x44ff44, isUnlocked: true },
  { key: 'space-wars', name: 'Space Wars', description: 'Space combat', iconColor: 0x8888ff, isUnlocked: true },
];
