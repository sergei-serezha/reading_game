/** Position on the letter grid */
export interface GridPosition {
  row: number;
  col: number;
}

/** Configuration for a single tile in a level (letter or empty walkable) */
export interface LetterConfig {
  letter: string;           // '' for empty walkable tiles
  position: GridPosition;
  phonemeAudioKey: string;  // '' for empty tiles
  isHidden: boolean;
  isStartPosition: boolean;
  isEmpty?: boolean;        // true for walkable tiles with no letter
}

/** Configuration for an entire level */
export interface LevelConfig {
  levelId: number;
  levelName: string;
  sceneKey: string;
  letters: LetterConfig[];
  sequence: string[];
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  targetWords?: string[];
}
