import { ActionProvider } from './ActionProvider.js';
import { BattleAction, BattleActionType, MoveAction } from '../BattleAction.js';
import { BattleContext } from '../BattleContext.js';

export class RaidBossActionProvider implements ActionProvider {
  public participantId: string;

  constructor(participantId: string) {
    this.participantId = participantId;
  }

  public getAction(context: BattleContext): Promise<BattleAction> {
    const participant = context.getParticipant(this.participantId);
    if (!participant) {
      return Promise.resolve({
        type: BattleActionType.Run,
        participantId: this.participantId,
        priority: 0
      });
    }

    const activeMon = participant.party[participant.activePokemonIndex];
    if (!activeMon || activeMon.currentHp <= 0) {
      return Promise.resolve({
        type: BattleActionType.Run,
        participantId: this.participantId,
        priority: 0
      });
    }

    // Pick first non-boss participant as primary target
    let targetId = '';
    for (const [id] of context.state.participants.entries()) {
      if (id !== this.participantId) {
        targetId = id;
        break;
      }
    }

    const moves = activeMon.moves && activeMon.moves.length > 0 ? activeMon.moves : [1];
    const selectedMoveId = moves[Math.floor(Math.random() * moves.length)];

    const moveAction: MoveAction = {
      type: BattleActionType.Move,
      participantId: this.participantId,
      priority: 1, // Bosses have slight move priority boost
      moveId: selectedMoveId,
      targetId
    };

    return Promise.resolve(moveAction);
  }
}
