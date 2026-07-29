import { ActionProvider } from './ActionProvider.js';
import { BattleAction, BattleActionType, MoveAction } from '../BattleAction.js';
import { BattleContext } from '../BattleContext.js';
import { TypeEffectivenessCalculator } from '@game-core/battleFormulas/calculators/TypeEffectivenessCalculator.js';
import { MOVES_BY_ID } from '@game-core/pokemonData.js';

export class TrainerAIActionProvider implements ActionProvider {
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
      // Find next healthy mon if any
      const nextIdx = participant.party.findIndex(p => p && p.currentHp > 0);
      if (nextIdx !== -1) {
        const nextMon = participant.party[nextIdx] as any;
        return Promise.resolve({
          type: BattleActionType.Switch,
          participantId: this.participantId,
          priority: 6,
          nextPokemonId: nextMon.id || ''
        });
      }
      return Promise.resolve({
        type: BattleActionType.Run,
        participantId: this.participantId,
        priority: 0
      });
    }

    // Find target
    let targetId = '';
    for (const [id] of context.state.participants.entries()) {
      if (id !== this.participantId) {
        targetId = id;
        break;
      }
    }

    const opponent = context.getParticipant(targetId);
    const opponentMon = opponent ? opponent.party[opponent.activePokemonIndex] : null;

    const rawMoves = activeMon.moves && activeMon.moves.length > 0 ? activeMon.moves : [1];
    const moveIds: number[] = rawMoves.map((m: any) => (typeof m === 'number' ? m : m.moveId));
    let bestMoveId = moveIds[0] || 1;
    let bestScore = -1;

    for (const moveId of moveIds) {
      const moveData = MOVES_BY_ID[moveId];
      if (!moveData) continue;

      let score = moveData.power || 40;
      if (opponentMon) {
        // Calculate effectiveness against opponent types
        const defenderTypes: [number, number | null] = [0, null]; // placeholder/registry lookup
        const effectiveness = TypeEffectivenessCalculator.calculate(moveData.type as any, defenderTypes);
        score *= effectiveness;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMoveId = moveId;
      }
    }

    const moveAction: MoveAction = {
      type: BattleActionType.Move,
      participantId: this.participantId,
      priority: 0,
      moveId: bestMoveId,
      targetId
    };

    return Promise.resolve(moveAction);
  }
}
