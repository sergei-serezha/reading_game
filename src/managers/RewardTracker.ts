import { CORRECT_ANSWERS_FOR_ARCADE } from '../config/Constants';
import { ProgressManager } from './ProgressManager';

export class RewardTracker {
  private progressManager: ProgressManager;

  constructor(progressManager: ProgressManager) {
    this.progressManager = progressManager;
  }

  /** Record a correct answer. Returns true if the child has earned an arcade game. */
  recordCorrect(): boolean {
    const count = this.progressManager.incrementCorrectCount();
    this.progressManager.save();

    if (count >= CORRECT_ANSWERS_FOR_ARCADE) {
      this.progressManager.resetCorrectCount();
      this.progressManager.save();
      return true;
    }
    return false;
  }

  getProgress(): { current: number; target: number } {
    return {
      current: this.progressManager.getCorrectCount(),
      target: CORRECT_ANSWERS_FOR_ARCADE,
    };
  }
}
