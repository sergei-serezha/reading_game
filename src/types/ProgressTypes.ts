/** Mastery data for a single letter */
export interface LetterMastery {
  letter: string;
  isMastered: boolean;
  attempts: number;
  successfulAttempts: number;
  firstMasteredAt: number | null;
}

/** Progress for a single level */
export interface LevelProgress {
  levelId: number;
  isUnlocked: boolean;
  segmentsCompleted: number;
  totalSegments: number;
  starsEarned: number;
}

/** Complete player progress state (serialized to localStorage) */
export interface PlayerProgress {
  version: number;
  totalStars: number;
  correctCount: number;
  letterMasteries: Record<string, LetterMastery>;
  levelProgresses: Record<number, LevelProgress>;
  lastPlayedAt: number;
  createdAt: number;
}
