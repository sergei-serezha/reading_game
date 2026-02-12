import { PlayerProgress, LetterMastery, LevelProgress } from '../types/ProgressTypes';

const STORAGE_KEY = 'reading_game_progress';

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
      return JSON.parse(raw) as PlayerProgress;
    } catch {
      return null;
    }
  }

  private createDefaultProgress(): PlayerProgress {
    const now = Date.now();
    return {
      version: 1,
      totalStars: 0,
      correctCount: 0,
      letterMasteries: {},
      levelProgresses: {
        1: { levelId: 1, isUnlocked: true, segmentsCompleted: 0, totalSegments: 1, starsEarned: 0 },
        2: { levelId: 2, isUnlocked: false, segmentsCompleted: 0, totalSegments: 1, starsEarned: 0 },
        3: { levelId: 3, isUnlocked: false, segmentsCompleted: 0, totalSegments: 1, starsEarned: 0 },
      },
      lastPlayedAt: now,
      createdAt: now,
    };
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
