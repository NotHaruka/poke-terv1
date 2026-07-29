import { CaptureContext } from './CaptureContext.js';
import { BattlePhase } from '../BattleState.js';
import { ParticipantType } from '../BattleParticipant.js';
import { LegacyItemCategory } from '../../../shared/pokemonData.js';

export class CaptureValidator {
  public static validate(context: CaptureContext): { valid: boolean; reason?: string } {
    const { battle, participantId, targetId, ballItem } = context;

    // Verify battle is active
    if (battle.state.phase === BattlePhase.End) {
      return { valid: false, reason: 'Battle has ended' };
    }

    // Verify player is participant
    const participant = battle.context.getParticipant(participantId);
    if (!participant) {
      return { valid: false, reason: 'Participant not found in battle' };
    }

    // Verify target exists
    const target = battle.context.getParticipant(targetId);
    if (!target) {
      return { valid: false, reason: 'Target not found in battle' };
    }

    // For wild battles, target must not belong to a trainer
    if (target.type !== ParticipantType.Wild) {
      return { valid: false, reason: 'Cannot catch a trainer\'s Pokemon' };
    }

    // Verify target active pokemon is alive
    const targetMon = target.party[target.activePokemonIndex];
    if (!targetMon || targetMon.currentHp <= 0) {
      return { valid: false, reason: 'Target has fainted' };
    }

    // Verify ball exists
    if (!ballItem || ((ballItem.category as any) !== LegacyItemCategory.CaptureDevice && (ballItem.category as any) !== 'pokeball')) {
      return { valid: false, reason: 'Item is not a valid Capture Device' };
    }

    return { valid: true };
  }
}