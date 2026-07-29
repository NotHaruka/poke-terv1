/**
 * Evolution Data Types
 */

export interface EvolutionRequirement {
  method: 'level' | 'item' | 'trade' | 'friendship' | 'other';
  param?: string | number;
  targetSpeciesId: number;
}
