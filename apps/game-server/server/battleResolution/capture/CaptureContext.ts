import { BattleInstance } from '../BattleInstance.js';
import { ItemData } from '@game-core/pokemonData.js';

export interface CaptureContext {
  battle: BattleInstance;
  participantId: string;
  targetId: string;
  ballItem: ItemData;
}
