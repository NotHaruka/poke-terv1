import { ActionProvider } from './ActionProvider.js';
import { BattleAction, BattleActionType, MoveAction } from '../BattleAction.js';
import { BattleContext } from '../BattleContext.js';

export class WildAIActionProvider implements ActionProvider {
  public participantId: string;

  constructor(participantId: string) {
    this.participantId = participantId;
  }

  public getAction(context: BattleContext): Promise<BattleAction> {
    const wildPart = context.getParticipant(this.participantId);
    if (!wildPart) {
      return Promise.resolve({
        type: BattleActionType.Run,
        participantId: this.participantId,
        priority: 0
      });
    }

    const activeMon = wildPart.party[wildPart.activePokemonIndex];
    if (!activeMon || activeMon.currentHp <= 0) {
      return Promise.resolve({
        type: BattleActionType.Run,
        participantId: this.participantId,
        priority: 0
      });
    }

    // Identify target participant (first non-wild participant)
    let targetId = '';
    for (const [id, p] of context.state.participants.entries()) {
      if (id !== this.participantId) {
        targetId = id;
        break;
      }
    }

    const validMoves = activeMon.moves && activeMon.moves.length > 0 ? activeMon.moves : [1];
    const selectedMoveId = validMoves[Math.floor(Math.random() * validMoves.length)];

    const moveAction: MoveAction = {
      type: BattleActionType.Move,
      participantId: this.participantId,
      priority: 0,
      moveId: selectedMoveId,
      targetId
    };

    return Promise.resolve(moveAction);
  }
}
