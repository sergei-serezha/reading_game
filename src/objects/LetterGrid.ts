import Phaser from 'phaser';
import { LetterTile, LetterTileState } from './LetterTile';
import { LetterConfig, GridPosition } from '../types/LevelTypes';
import { TILE_SIZE, TILE_GAP } from '../config/Constants';

export class LetterGrid extends Phaser.GameObjects.Container {
  private tiles: Map<string, LetterTile> = new Map();
  private gridWidth: number;
  private gridHeight: number;
  private sequence: string[];
  private sequenceIndex: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    letters: LetterConfig[],
    gridWidth: number,
    gridHeight: number,
    sequence: string[],
  ) {
    super(scene, x, y);

    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.sequence = sequence;

    this.buildGrid(letters);
    scene.add.existing(this);
  }

  private buildGrid(letters: LetterConfig[]): void {
    const cellSize = TILE_SIZE + TILE_GAP;
    const offsetX = -((this.gridWidth - 1) * cellSize) / 2;
    const offsetY = -((this.gridHeight - 1) * cellSize) / 2;

    for (const config of letters) {
      const px = offsetX + config.position.col * cellSize;
      const py = offsetY + config.position.row * cellSize;
      const tile = new LetterTile(
        this.scene,
        px,
        py,
        config.letter,
        config.position.row,
        config.position.col,
        config.isEmpty ?? false,
      );

      if (config.isHidden) {
        tile.setTileState(LetterTileState.HIDDEN);
      }

      const key = `${config.position.row}-${config.position.col}`;
      this.tiles.set(key, tile);
      this.add(tile as unknown as Phaser.GameObjects.GameObject);
    }
  }

  getTileAt(pos: GridPosition): LetterTile | null {
    return this.tiles.get(`${pos.row}-${pos.col}`) ?? null;
  }

  getTileByLetter(letter: string): LetterTile | null {
    for (const tile of this.tiles.values()) {
      if (tile.letter === letter) return tile;
    }
    return null;
  }

  getAdjacentPositions(pos: GridPosition): GridPosition[] {
    const dirs = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 },
    ];

    return dirs
      .map(d => ({ row: pos.row + d.row, col: pos.col + d.col }))
      .filter(p => this.tiles.has(`${p.row}-${p.col}`));
  }

  /** Highlight all adjacent tiles. Empty tiles get a subtle highlight; letter tiles get a bright one. Hidden tiles stay hidden. */
  highlightAdjacent(pos: GridPosition): void {
    const adjacent = this.getAdjacentPositions(pos);
    for (const adjPos of adjacent) {
      const tile = this.getTileAt(adjPos);
      if (!tile) continue;
      // Hidden tiles stay hidden — don't change their visual state
      if (tile.getTileState() === LetterTileState.HIDDEN) continue;

      if (tile.isEmpty || tile.isBroken) {
        tile.setTileState(LetterTileState.EMPTY_HIGHLIGHTED);
      } else if (tile.getTileState() === LetterTileState.COMPLETED) {
        // Not yet slashed (mid-animation corner case) — skip
        continue;
      } else {
        tile.setTileState(LetterTileState.HIGHLIGHTED);
      }
    }
  }

  clearHighlights(): void {
    for (const tile of this.tiles.values()) {
      const st = tile.getTileState();
      if (st === LetterTileState.HIGHLIGHTED) {
        tile.setTileState(LetterTileState.NORMAL);
      } else if (st === LetterTileState.EMPTY_HIGHLIGHTED) {
        tile.setTileState(LetterTileState.EMPTY);
      }
    }
  }

  gridToPixel(pos: GridPosition): { x: number; y: number } {
    const cellSize = TILE_SIZE + TILE_GAP;
    const offsetX = -((this.gridWidth - 1) * cellSize) / 2;
    const offsetY = -((this.gridHeight - 1) * cellSize) / 2;
    return {
      x: this.x + offsetX + pos.col * cellSize,
      y: this.y + offsetY + pos.row * cellSize,
    };
  }

  markCompleted(pos: GridPosition): void {
    const tile = this.getTileAt(pos);
    if (tile) {
      tile.setTileState(LetterTileState.COMPLETED);
    }
  }

  getCurrentTargetLetter(): string {
    return this.sequence[this.sequenceIndex] ?? '';
  }

  /** Advance the sequence. Returns false if sequence is complete. */
  advanceSequence(): boolean {
    this.sequenceIndex++;
    return this.sequenceIndex < this.sequence.length;
  }

  getSequenceIndex(): number {
    return this.sequenceIndex;
  }

  resetSequence(): void {
    this.sequenceIndex = 0;
    for (const tile of this.tiles.values()) {
      if (tile.isEmpty) {
        tile.setTileState(LetterTileState.EMPTY);
      } else {
        tile.setTileState(LetterTileState.NORMAL);
      }
    }
  }
}
