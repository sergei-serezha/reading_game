import { PlayerProgress, LetterMastery, LevelProgress } from '../types/ProgressTypes';

const STORAGE_KEY = 'reading_game_progress';
const CURRENT_PROGRESS_VERSION = 2;
const LEVEL_3_UNLOCK_MIGRATION_VERSION = 2;

export class ProgressManager {
  private progress: PlayerProgress;

  constructor() {
    this.progress = this.loadFromStorage() ?? this.createDefaultProgress();
  }

  save(): void {
    this.progress.lastPlayedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  private loadFromStorage(): PlayerProgress | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PlayerProgress;
      const { progress, changed } = this.migrateProgress(parsed);
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      }
      return progress;
    } catch {
      return null;
    }
  }

  private createDefaultProgress(): PlayerProgress {
    const now = Date.now();
    return {
      version: CURRENT_PROGRESS_VERSION,
      totalStars: 0,
      correctCount: 0,
      letterMasteries: {},
      levelProgresses: {
        1: { levelId: 1, isUnlocked: true, segmentsCompleted: 0, totalSegments: 1, starsEarned: 0 },
        2: { levelId: 2, isUnlocked: true, segmentsCompleted: 0, totalSegments: 1, starsEarned: 0 },
        3: { levelId: 3, isUnlocked: true, segmentsCompleted: 0, totalSegments: 1, starsEarned: 0 },
      },
      lastPlayedAt: now,
      createdAt: now,
    };
  }

  private migrateProgress(progress: PlayerProgress): { progress: PlayerProgress; changed: boolean } {
    let changed = false;

    // One-time migration: unlock level 3 (and level 2 to match current defaults)
    if (progress.version < LEVEL_3_UNLOCK_MIGRATION_VERSION) {
      if (progress.levelProgresses[2]) {
        if (!progress.levelProgresses[2].isUnlocked) {
          progress.levelProgresses[2].isUnlocked = true;
          changed = true;
        }
      }

      if (progress.levelProgresses[3]) {
        if (!progress.levelProgresses[3].isUnlocked) {
          progress.levelProgresses[3].isUnlocked = true;
          changed = true;
        }
      }

      progress.version = CURRENT_PROGRESS_VERSION;
      changed = true;
    }

    return { progress, changed };
  }

  masterLetter(letter: string): void {
    if (!this.progress.letterMasteries[letter]) {
      this.progress.letterMasteries[letter] = {
        letter,
        isMastered: false,
        attempts: 0,
        successfulAttempts: 0,
        firstMasteredAt: null,
      };
    }
    const mastery = this.progress.letterMasteries[letter];
    mastery.attempts++;
    mastery.successfulAttempts++;
    if (!mastery.isMastered) {
      mastery.isMastered = true;
      mastery.firstMasteredAt = Date.now();
    }
  }

  isLetterMastered(letter: string): boolean {
    return this.progress.letterMasteries[letter]?.isMastered ?? false;
  }

  getLevelProgress(levelId: number): LevelProgress {
    return this.progress.levelProgresses[levelId] ?? {
      levelId,
      isUnlocked: false,
      segmentsCompleted: 0,
      totalSegments: 1,
      starsEarned: 0,
    };
  }

  isLevelUnlocked(levelId: number): boolean {
    return this.progress.levelProgresses[levelId]?.isUnlocked ?? false;
  }

  unlockLevel(levelId: number): void {
    if (this.progress.levelProgresses[levelId]) {
      this.progress.levelProgresses[levelId].isUnlocked = true;
    }
  }

  completeLevel(levelId: number): void {
    if (this.progress.levelProgresses[levelId]) {
      this.progress.levelProgresses[levelId].segmentsCompleted = 1;
    }
    // Unlock next level
    if (this.progress.levelProgresses[levelId + 1]) {
      this.progress.levelProgresses[levelId + 1].isUnlocked = true;
    }
  }

  getCorrectCount(): number {
    return this.progress.correctCount;
  }

  incrementCorrectCount(): number {
    this.progress.correctCount++;
    return this.progress.correctCount;
  }

  resetCorrectCount(): void {
    this.progress.correctCount = 0;
  }

  addStars(count: number): void {
    this.progress.totalStars += count;
  }

  getTotalStars(): number {
    return this.progress.totalStars;
  }

  resetAll(): void {
    this.progress = this.createDefaultProgress();
    this.save();
  }
}
