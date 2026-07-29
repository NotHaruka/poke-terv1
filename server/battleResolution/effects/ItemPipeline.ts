import { BattleContext } from '../BattleContext.js';
import { BattleEvent, BattleEventType } from '../BattleEvents.js';
import { MonsterInstance, StatusEffect } from '../../../shared/pokemonData.js';

export class ItemPipeline {
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
      const heldItem = (mon as any).heldItemId;
      const opponent = activeMons.find(o => o.id !== active.id)?.pokemon;

      if (!heldItem) continue;

      switch (event.type) {
        case BattleEventType.TurnEnd:
          // 1. Leftovers (40)
          if (heldItem === 40 && mon.currentHp < mon.maxHp && mon.currentHp > 0) {
            const heal = Math.floor(mon.maxHp / 16) || 1;
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'} restored some HP using its Leftovers!` }
            });
          }

          // 2. Oran Berry (30)
          if (heldItem === 30 && mon.currentHp > 0 && mon.currentHp <= mon.maxHp / 2) {
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + 10);
            (mon as any).heldItemId = undefined; // consume
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'} ate its Oran Berry and restored 10 HP!` }
            });
          }

          // 3. Sitrus Berry (31)
          if (heldItem === 31 && mon.currentHp > 0 && mon.currentHp <= mon.maxHp / 2) {
            const heal = Math.floor(mon.maxHp / 4) || 1;
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
            (mon as any).heldItemId = undefined; // consume
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'} ate its Sitrus Berry and restored HP!` }
            });
          }

          // 4. Lum Berry (32)
          if (heldItem === 32 && mon.status && (mon.status as any) !== StatusEffect.None) {
            mon.status = StatusEffect.None;
            (mon as any).heldItemId = undefined; // consume
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'} cured its status condition with Lum Berry!` }
            });
          }
          break;

        case BattleEventType.BeforeDamage:
          // Focus Sash (42)
          if (heldItem === 42 && event.payload?.targetId === active.id) {
            const currentHp = mon.currentHp;
            const incomingDamage = event.payload.damage || 0;
            if (currentHp === mon.maxHp && incomingDamage >= currentHp) {
              event.payload.damage = currentHp - 1;
              (mon as any).heldItemId = undefined; // consume
              context.state.events.push({
                type: BattleEventType.Message,
                payload: { text: `${mon.nickname || 'Pokemon'} hung on with its Focus Sash!` }
              });
            }
          }
          break;

        case BattleEventType.AfterDamage:
          // Life Orb (43) - user of the move takes recoil
          if (heldItem === 43 && event.payload?.attackerId === active.id) {
            const recoil = Math.floor(mon.maxHp / 10) || 1;
            mon.currentHp = Math.max(0, mon.currentHp - recoil);
            context.state.events.push({
              type: BattleEventType.Message,
              payload: { text: `${mon.nickname || 'Pokemon'} was hurt by its Life Orb!` }
            });
          }

          // Rocky Helmet (45) - physical attacker takes recoil
          if (heldItem === 45 && event.payload?.targetId === active.id && opponent) {
            const moveCategory = event.payload?.move?.category;
            if (moveCategory !== 1) { // Not special move
              const recoil = Math.floor(opponent.maxHp / 6) || 1;
              opponent.currentHp = Math.max(0, opponent.currentHp - recoil);
              context.state.events.push({
                type: BattleEventType.Message,
                payload: { text: `${opponent.nickname || 'Pokemon'} was hurt by ${mon.nickname || 'Pokemon'}'s Rocky Helmet!` }
              });
            }
          }
          break;
      }
    }
  }
}
