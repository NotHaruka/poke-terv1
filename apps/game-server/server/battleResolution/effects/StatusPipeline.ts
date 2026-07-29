import { BattleContext } from '../BattleContext.js';
import { BattleEvent, BattleEventType } from '../BattleEvents.js';
import { MonsterInstance, StatusEffect } from '@game-core/pokemonData.js';

export class StatusPipeline {
  public static processEvent(context: BattleContext, event: BattleEvent): void {
    if (event.type === BattleEventType.TurnEnd) {
      this.handleTurnEndStatus(context);
    }
    // Also handle before move checks (paralysis, freeze, sleep, confusion, flinch)
  }

  private static handleTurnEndStatus(context: BattleContext): void {
    for (const [id, participant] of context.state.participants) {
      const activeMon = participant.party[participant.activePokemonIndex];
      if (!activeMon || activeMon.currentHp <= 0) continue;

      if (activeMon.status === StatusEffect.Burn) {
        const damage = Math.max(1, Math.floor(activeMon.maxHp / 16));
        activeMon.currentHp = Math.max(0, activeMon.currentHp - damage);
        context.state.events.push({
          type: BattleEventType.Message,
          payload: { text: `${activeMon.nickname || 'The Pokemon'} was hurt by its burn!` }
        });
      } else if (activeMon.status === StatusEffect.Poison) {
        const damage = Math.max(1, Math.floor(activeMon.maxHp / 8));
        activeMon.currentHp = Math.max(0, activeMon.currentHp - damage);
        context.state.events.push({
          type: BattleEventType.Message,
          payload: { text: `${activeMon.nickname || 'The Pokemon'} was hurt by poison!` }
        });
      }
      // Toxic (BadPoison) would scale damage here
    }
  }

  public static canAttack(pokemon: MonsterInstance, context: BattleContext): { canAttack: boolean, reason?: string } {
    if (pokemon.status === StatusEffect.Freeze) {
      // 20% chance to thaw
      if (Math.random() < 0.2) {
        pokemon.status = StatusEffect.None;
        context.state.events.push({
          type: BattleEventType.Message,
          payload: { text: `${pokemon.nickname || 'The Pokemon'} thawed out!` }
        });
        return { canAttack: true };
      }
      return { canAttack: false, reason: `${pokemon.nickname || 'The Pokemon'} is frozen solid!` };
    }
    
    if (pokemon.status === StatusEffect.Sleep) {
      // Simplified sleep turn tracking
      if (Math.random() < 0.33) {
        pokemon.status = StatusEffect.None;
        context.state.events.push({
          type: BattleEventType.Message,
          payload: { text: `${pokemon.nickname || 'The Pokemon'} woke up!` }
        });
        return { canAttack: true };
      }
      return { canAttack: false, reason: `${pokemon.nickname || 'The Pokemon'} is fast asleep.` };
    }

    if (pokemon.status === StatusEffect.Paralysis) {
      if (Math.random() < 0.25) {
        return { canAttack: false, reason: `${pokemon.nickname || 'The Pokemon'} is paralyzed! It can't move!` };
      }
    }

    return { canAttack: true };
  }
}