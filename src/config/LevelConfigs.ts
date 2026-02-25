import { LevelConfig, LetterConfig, GridPosition } from '../types/LevelTypes';
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

/** Fisher-Yates shuffle, returns a new array */
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/*
 * Level 1 — 7 zones across the 6×6 grid.
 * One letter is placed in a random position within each zone,
 * ensuring letters are spread and all reachable via empty tiles.
 *
 *   TL  TL  |  TR  TR        top-left / top-right
 *   TL  TL  |  TR  TR
 *   --------+---------
 *   ML  ML  MC  MC  MR  MR   mid-left / mid-center / mid-right
 *   ML  ML  MC  MC  MR  MR
 *   --------+---------
 *   BL  BL  |  BR  BR        bottom-left / bottom-right
 *   BL  BL  |  BR  BR
 *
 * (cols 2-3 are shared between TL/TR and BL/BR zones intentionally
 *  so the mid-center zone stays accessible from all sides)
 */
const LEVEL1_ZONES: GridPosition[][] = [
  // top-left
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }],
  // top-right
  [{ row: 0, col: 4 }, { row: 0, col: 5 }, { row: 1, col: 4 }, { row: 1, col: 5 }],
  // mid-left
  [{ row: 2, col: 0 }, { row: 2, col: 1 }, { row: 3, col: 0 }, { row: 3, col: 1 }],
  // mid-center
  [{ row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
  // mid-right
  [{ row: 2, col: 4 }, { row: 2, col: 5 }, { row: 3, col: 4 }, { row: 3, col: 5 }],
  // bottom-left
  [{ row: 4, col: 0 }, { row: 4, col: 1 }, { row: 5, col: 0 }, { row: 5, col: 1 }],
  // bottom-right
  [{ row: 4, col: 4 }, { row: 4, col: 5 }, { row: 5, col: 4 }, { row: 5, col: 5 }],
];

/**
 * Generate a fresh Level 1 config each call:
 *   - 7 random letters from the alphabet
 *   - placed one per zone (ensures spread across the grid)
 *   - challenge sequence in random order
 */
export function generateLevel1Config(): LevelConfig {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const chosenLetters = shuffled(alphabet).slice(0, 7);
  const sequence = shuffled([...chosenLetters]);

  // Pick one random position from each zone
  const letterPositions = LEVEL1_ZONES.map(
    zone => zone[Math.floor(Math.random() * zone.length)],
  );

  // Map "row,col" → letter char for fast lookup
  const posMap = new Map<string, string>();
  chosenLetters.forEach((char, i) => {
    posMap.set(`${letterPositions[i].row},${letterPositions[i].col}`, char);
  });

  const letters: LetterConfig[] = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const char = posMap.get(`${row},${col}`);
      letters.push(char ? letter(char, row, col) : empty(row, col));
    }
  }

  return {
    levelId: 1,
    levelName: 'Alphabet Journey',
    sceneKey: 'AlphabetJourneyScene',
    gridWidth: 6,
    gridHeight: 6,
    tileSize: TILE_SIZE,
    sequence,
    letters,
  };
}

/** Static reference used for display metadata in LevelSelectScene */
export const LEVEL_1_CONFIG: LevelConfig = generateLevel1Config();

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
