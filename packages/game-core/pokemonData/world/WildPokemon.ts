import { PokemonInstance, Vec2, Direction } from '../models/PokemonInstance.js';

export enum WildPokemonState {
  Idle = 'idle',
  Wandering = 'wandering',
  Fleeing = 'fleeing',
  Chasing = 'chasing',
  Battling = 'battling',
  Captured = 'captured'
}

export const ENCOUNTER_COOLDOWN_MS = 6000;
export const ENCOUNTER_RESET_DISTANCE = 128;

export interface WildPokemon {
  entityId: string; // Unique ID in the world
  pokemonInstanceId: string; // Reference to the PokemonInstance managed by PokemonManager
  
  position: Vec2;
  rotation: Direction; // Typically 'up' | 'down' | 'left' | 'right' etc.
  
  spawnChunk: { cx: number; cy: number };
  spawnBiome: string;
  spawnTimestamp: number; // Unix timestamp or game tick
  
  currentState: WildPokemonState;
  
  despawnTimer?: number; // Time until despawn, if applicable

  // Encounter Cooldown tracking
  lastEncounterPlayerId?: string;
  lastEncounterTime?: number;
  ignorePlayerUntil?: number;
  encounterStartPos?: Vec2;
}
