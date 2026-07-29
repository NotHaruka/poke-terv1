import { CaptureContext } from './CaptureContext.js';
import { CaptureValidator } from './CaptureValidator.js';
import { CaptureCalculator } from './CaptureCalculator.js';
import { BattlePhase } from '../BattleState.js';
import { PokemonManager, PokemonLocationType, monsterInstanceToPokemonInstance } from '../../../shared/pokemonData.js';
import { CaptureEventType } from './CaptureEvents.js';

export class CaptureManager {
  public static attemptCapture(context: CaptureContext): { success: boolean, reason?: string, shakes: number } {
    const { battle, participantId, targetId, ballItem } = context;

    // Validate
    const validation = CaptureValidator.validate(context);
    if (!validation.valid) {
      return { success: false, reason: validation.reason, shakes: 0 };
    }

    const pm = PokemonManager.getInstance();
    const targetParticipant = battle.context.getParticipant(targetId)!;
    const targetMon = targetParticipant.party[targetParticipant.activePokemonIndex];

    // Emit BallThrown event
    battle.state.events.push({
      type: CaptureEventType.BallThrown as any, // Needs extending BattleEvent, we cheat a bit or maybe handle nicely
      payload: { participantId, targetId, itemId: ballItem.id }
    });

    // Calculate
    const { shakes, caught } = CaptureCalculator.calculate(targetMon, Number(ballItem.id) || 1);

    // Emit Shake Event
    battle.state.events.push({
      type: CaptureEventType.CaptureShake as any,
      payload: { shakeCount: shakes }
    });

    if (caught) {
      // Convert targetMon into a complete PokemonInstance
      const pokemon = monsterInstanceToPokemonInstance(targetMon, { otId: participantId });

      // Find open party slot
      const party = pm.getParty(participantId);
      let slotIndex = party.findIndex((p: any) => p === null);
      
      let locType = PokemonLocationType.Party;
      let boxIndex = -1;

      if (slotIndex === -1) {
        // Party full, find PC slot
        locType = PokemonLocationType.PC;
        let found = false;
        // Search boxes 0-31
        for (let b = 0; b < 32; b++) {
          const boxMap = pm.getPCBox(participantId, b);
          for (let s = 0; s < 30; s++) {
            if (!boxMap.has(s)) {
              boxIndex = b;
              slotIndex = s;
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          // PC Full! Fallback to failure?
          return { success: false, reason: "PC is full", shakes: 4 };
        }
      }

      const loc = {
        type: locType,
        ownerId: participantId,
        slotIndex: slotIndex,
        boxIndex: boxIndex === -1 ? undefined : boxIndex
      };

      if (!pm.getPokemonById(pokemon.id)) {
        pm.registerPokemon(pokemon, loc);
      } else {
        pm.updateLocation(pokemon.id, loc);
      }

      // Emit Success Event
      battle.state.events.push({
        type: CaptureEventType.CaptureSuccess as any,
        payload: { pokemonId: pokemon.id, speciesId: pokemon.speciesId }
      });

      battle.state.events.push({
        type: CaptureEventType.PokemonRegistered as any,
        payload: { pokemonId: pokemon.id, ownerId: participantId }
      });

      if (locType === PokemonLocationType.Party) {
        battle.state.events.push({
          type: CaptureEventType.PartyUpdated as any,
          payload: { pokemonId: pokemon.id, slotIndex }
        });
      } else {
        battle.state.events.push({
          type: CaptureEventType.PCUpdated as any,
          payload: { pokemonId: pokemon.id, boxIndex, slotIndex }
        });
      }

      // End battle immediately
      battle.state.phase = BattlePhase.End;
      battle.state.events.push({
        type: CaptureEventType.BattleEnded as any,
      });

      return { success: true, shakes };
    } else {
      // Failed capture
      battle.state.events.push({
        type: CaptureEventType.CaptureFailure as any,
        payload: { reason: "broke_free", escaped: false }
      });

      return { success: false, reason: "broke_free", shakes };
    }
  }
}
