import { BattleInstance } from '../BattleInstance.js';
import { ItemData } from '../../../shared/pokemonData.js';

export interface CaptureContext {
  battle: BattleInstance;
  participantId: string;
  targetId: string;
  ballItem: ItemData;
}
