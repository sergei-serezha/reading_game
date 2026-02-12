import { LevelConfig, LetterConfig } from '../types/LevelTypes';
import { TILE_SIZE } from './Constants';

/** Helper to create an empty walkable tile */
function empty(row: number, col: number): LetterConfig {
  return { letter: '', position: { row, col }, phonemeAudioKey: '', isHidden: false, isStartPosition: false, isEmpty: true };
}

/** Helper to create a letter tile */
function letter(char: string, row: number, col: number, isStart = false): LetterConfig {
  return {
    letter: char,
    position: { row, col },
    phonemeAudioKey: `phonics/${char.toLowerCase()}`,
    isHidden: false,
    isStartPosition: isStart,
  };
}

/*
 * Level 1 grid layout (6x6):
 *
 *   .  .  B  .  .  G
 *   .  .  .  .  .  .
 *   A  .  .  .  C  .
 *   .  .  .  .  .  .
 *   .  F  .  D  .  .
 *   .  .  .  .  .  E
 *
 * The child starts on A, must navigate through empty tiles
 * to reach B, C, D, E, F, G in order.
 * That's 6 correct moves after start → earns an arcade game + 1 extra.
 */
export const LEVEL_1_CONFIG: LevelConfig = {
  levelId: 1,
  levelName: 'Alphabet Journey',
  sceneKey: 'AlphabetJourneyScene',
  gridWidth: 6,
  gridHeight: 6,
  tileSize: TILE_SIZE,
  sequence: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  letters: [
    // Row 0
    empty(0, 0),       empty(0, 1),       letter('B', 0, 2), empty(0, 3),       empty(0, 4),       letter('G', 0, 5),
    // Row 1
    empty(1, 0),       empty(1, 1),       empty(1, 2),       empty(1, 3),       empty(1, 4),       empty(1, 5),
    // Row 2
    letter('A', 2, 0),       empty(2, 1), empty(2, 2),       empty(2, 3),       letter('C', 2, 4), empty(2, 5),
    // Row 3
    empty(3, 0),       empty(3, 1),       empty(3, 2),       empty(3, 3),       empty(3, 4),       empty(3, 5),
    // Row 4
    empty(4, 0),       letter('F', 4, 1), empty(4, 2),       letter('D', 4, 3), empty(4, 4),       empty(4, 5),
    // Row 5
    empty(5, 0),       empty(5, 1),       empty(5, 2),       empty(5, 3),       empty(5, 4),       letter('E', 5, 5),
  ],
};

/*
 * Level 2 grid layout (6x6) — same structure, some letters hidden:
 *
 *   .  .  B  .  .  G
 *   .  .  .  .  .  .
 *   A  .  .  .  C* .
 *   .  .  .  .  .  .
 *   .  F* .  D* .  .
 *   .  .  .  .  .  E
 *
 * Letters marked with * are hidden. The child must find them.
 */
export const LEVEL_2_CONFIG: LevelConfig = {
  levelId: 2,
  levelName: 'Hidden Sequence',
  sceneKey: 'HiddenSequenceScene',
  gridWidth: 6,
  gridHeight: 6,
  tileSize: TILE_SIZE,
  sequence: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  letters: [
    // Row 0
    empty(0, 0),       empty(0, 1),       letter('B', 0, 2), empty(0, 3),       empty(0, 4),       letter('G', 0, 5),
    // Row 1
    empty(1, 0),       empty(1, 1),       empty(1, 2),       empty(1, 3),       empty(1, 4),       empty(1, 5),
    // Row 2
    letter('A', 2, 0),       empty(2, 1), empty(2, 2),       empty(2, 3),       letter('C', 2, 4), empty(2, 5),
    // Row 3
    empty(3, 0),       empty(3, 1),       empty(3, 2),       empty(3, 3),       empty(3, 4),       empty(3, 5),
    // Row 4
    empty(4, 0),       letter('F', 4, 1), empty(4, 2),       letter('D', 4, 3), empty(4, 4),       empty(4, 5),
    // Row 5
    empty(5, 0),       empty(5, 1),       empty(5, 2),       empty(5, 3),       empty(5, 4),       letter('E', 5, 5),
  ],
};

// Mark some as hidden for level 2 (C, D, and F are hidden)
LEVEL_2_CONFIG.letters = LEVEL_2_CONFIG.letters.map(l => {
  if (l.letter === 'C' || l.letter === 'D' || l.letter === 'F') {
    return { ...l, isHidden: true };
  }
  return l;
});

/*
 * Level 3: Sound Construction
 *
 * The child taps letters in order to build words.
 * First word: CAT (3 taps)
 * Second word: BED (3 taps)
 * Total: 6 correct taps — enough to earn an arcade game.
 *
 * The tiles are shown in a single row: C A T B E D
 * The child builds "CAT" first, then "BED".
 */
export const LEVEL_3_CONFIG: LevelConfig = {
  levelId: 3,
  levelName: 'Sound Construction',
  sceneKey: 'SoundConstructionScene',
  gridWidth: 6,
  gridHeight: 1,
  tileSize: TILE_SIZE,
  sequence: ['C', 'A', 'T', 'B', 'E', 'D'],
  targetWords: ['CAT', 'BED'],
  letters: [
    letter('C', 0, 0),
    letter('A', 0, 1),
    letter('T', 0, 2),
    letter('B', 0, 3),
    letter('E', 0, 4),
    letter('D', 0, 5),
  ],
};
