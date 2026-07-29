import { BattleContext } from '../BattleContext.js';
import { BattleEvent, BattleEventType } from '../BattleEvents.js';
import { MonsterInstance, StatusEffect } from '@game-core/pokemonData.js';

export class AbilityPipeline {
  public static processEvent(context: BattleContext, event: BattleEvent): void {
    const participants = Array.from(context.state.participants.values());
    if (participants.length < 2) return;

    // Get active pokémon for both players
    const activeMons: { id: string; pokemon: MonsterInstance; isP1: boolean }[] = [];
    participants.forEach((p, idx) => {
      const mon = p.party[p.activePokemonIndex];
      if (mon) {
        activeMons.push({ id: p.id, pokemon: mon, isP1: idx === 0 });
      }
    });

    for (const active of activeMons) {
      const mon = active.pokemon;
      const ability = (mon as any).ability?.toLowerCase() || '';
      const opponent = activeMons.find(o => o.id !== active.id)?.pokemon;

      if (!ability) continue;

      // Initialize stages if not present
      if (!(mon as any).statStages) {
        (mon as any).statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 };
      }

      switch (event.type) {
        case BattleEventType.TurnStart:
          // Pressure Message
          if (ability === 'pressure' && context.state.turn === 1) {
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'} is exerting its Pressure!` }
            });
          }

          // Intimidate on Switch In / TurnStart of turn 1
          if (ability === 'intimidate' && opponent) {
            if (!(mon as any).hasIntimidated) {
              (mon as any).hasIntimidated = true;
              const oppStages = (opponent as any).statStages || { attack: 0 };
              oppStages.attack = Math.max(-6, (oppStages.attack || 0) - 1);
              (opponent as any).statStages = oppStages;

              context.state.events.push({
                type: BattleEventType.Message,
                payload: { text: `${mon.nickname || 'Pokemon'}'s Intimidate lowered ${opponent.nickname || 'opponent'}'s Attack!` }
              });
            }
          }
          break;

        case BattleEventType.Switch:
          // Reset intimidate on switch
          if (event.payload?.participantId === active.id) {
            (mon as any).hasIntimidated = false;
          }
          break;

        case BattleEventType.BeforeDamage:
          // Levitate immune to Ground
          if (ability === 'levitate' && event.payload?.move?.type === 'ground' && event.payload?.targetId === active.id) {
            event.payload.damage = 0;
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'} floated over the Ground move with Levitate!` }
            });
          }

          // Flash Fire immune to Fire
          if (ability === 'flash fire' && event.payload?.move?.type === 'fire' && event.payload?.targetId === active.id) {
            event.payload.damage = 0;
            (mon as any).flashFireBoost = true;
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'}'s Flash Fire absorbed the Fire attack!` }
            });
          }

          // Sturdy survive OHKO
          if (ability === 'sturdy' && event.payload?.targetId === active.id) {
            const currentHp = mon.currentHp;
            const incomingDamage = event.payload.damage || 0;
            if (currentHp === mon.maxHp && incomingDamage >= currentHp) {
              event.payload.damage = currentHp - 1;
              context.state.events.push({
                type: BattleEventType.Message,
                payload: { text: `${mon.nickname || 'Pokemon'} endured the hit with Sturdy!` }
              });
            }
          }
          break;

        case BattleEventType.AfterDamage:
          // Static paralysis chance on contact
          if (ability === 'static' && event.payload?.targetId === active.id && opponent) {
            // Check if the move is a contact/physical move
            const moveCategory = event.payload?.move?.category;
            if (moveCategory !== 1 && Math.random() < 0.3) { // Category 1 = Special, so contact is physical
              if (opponent.status === StatusEffect.None) {
                opponent.status = StatusEffect.Paralysis;
                context.state.events.push({
                  type: BattleEventType.Message,
                  payload: { text: `${opponent.nickname || 'Pokemon'} was paralyzed by ${mon.nickname || 'Pokemon'}'s Static!` }
                });
              }
            }
          }
          break;

        case BattleEventType.Status:
          // Synchronize pass status
          if (ability === 'synchronize' && event.payload?.targetId === active.id && opponent) {
            const newStatus = event.payload?.status;
            if (newStatus && opponent.status === StatusEffect.None) {
              opponent.status = newStatus;
              context.state.events.push({
                type: BattleEventType.Message,
                payload: { text: `${mon.nickname || 'Pokemon'}'s Synchronize passed status to ${opponent.nickname || 'Pokemon'}!` }
              });
            }
          }
          break;
      }
    }
  }
}
