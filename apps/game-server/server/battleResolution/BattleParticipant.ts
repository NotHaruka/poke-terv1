import { MonsterInstance } from '@game-core/pokemonData.js';

export enum ParticipantType {
  Player = 'Player',
  NPC = 'NPC',
  Wild = 'Wild'
}

export interface BattleParticipant {
  id: string; // Unique ID per participant in this battle
  type: ParticipantType;
  name: string;
  party: (MonsterInstance | any)[];
  activePokemonIndex: number;
  hasActedThisTurn: boolean;
  canMegaEvolve: boolean;
  canTerastallize: boolean;
  canDynamax: boolean;
}