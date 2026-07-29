/**
 * Pokémon Species and Base Data Types
 */

export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface EVYield {
  hp?: number;
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
}

export interface PokemonAbilitiesData {
  primary: string;
  secondary?: string;
  hidden?: string;
}

export interface SpriteRefs {
  front: string;
  back: string;
  icon: string;
  shinyFront?: string;
  shinyBack?: string;
}

export interface PokemonSpeciesData {
  id: number;
  dexNumber: number;
  name: string;
  types: string[];
  baseStats: StatBlock;
  abilities: PokemonAbilitiesData;
  catchRate: number;
  baseExp: number;
  growthRate: string;
  eggGroups: string[];
  genderRatio: number; // female % or -1 for genderless
  baseFriendship: number;
  height: number; // meters
  weight: number; // kg
  evYield: EVYield;
  category: string;
  description: string;
  cry: string;
  footprint: string;
  sprites: SpriteRefs;
  forms: string[];
  evolutionIds: number[];
}
