import { BattleAction } from '../BattleAction.js';
import { BattleContext } from '../BattleContext.js';

export interface ActionProvider {
  participantId: string;
  getAction(context: BattleContext): Promise<BattleAction>;
  submitAction?(action: BattleAction): void;
  cancel?(): void;
}
