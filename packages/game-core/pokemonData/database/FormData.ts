/**
 * Form and Variation Data Types
 */

import { StatBlock, PokemonAbilitiesData, SpriteRefs } from '../database/PokemonData.js';

export interface FormDefinition {
  formId: string;
  formName: string;
  types: string[];
  baseStats: StatBlock;
  abilities: PokemonAbilitiesData;
  height: number;
  weight: number;
  sprites: SpriteRefs;
  cry?: string;
}
