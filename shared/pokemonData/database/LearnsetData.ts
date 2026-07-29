/**
 * Learnset Data Types
 */

export interface LearnsetMove {
  moveId: number;
  level: number;
}

export interface RemindMove {
  moveId: number;
}

export interface SpeciesLearnsetData {
  speciesId: number;
  levelUp: LearnsetMove[];
  tm: number[];
  tutor: number[];
  egg: number[];
  reminder: RemindMove[];
}
