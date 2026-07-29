import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState, vec2Distance } from '../../../../shared/pokemonData.js';

export class InvestigateBehavior implements BehaviorState {
  private speed: number = 40;
  
  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Wandering;
  }

  update(context: BehaviorContext, dt: number): void {
    if (context.stateTimer > 10000) {
      context.controller.changeState('idle'); // Give up after 10s
      return;
    }

    if (!context.targetEntityId) {
      context.controller.changeState('idle');
      return;
    }

    const targetClient = context.gameState.getClient(context.targetEntityId);
    if (!targetClient) {
      context.controller.changeState('idle');
      return;
    }

    const dist = vec2Distance(context.wildPokemon.position, targetClient.position);
    
    // Determine specific species behavior
    const speciesId = context.instance.speciesId;
    const speciesName = String((context.instance as any).speciesName || (context.instance as any).nickname || speciesId).toLowerCase();
    const isFleeing = ['63', '10', '13', '129', 'abra', 'caterpie', 'weedle', 'magikarp'].includes(speciesName) || [63, 10, 13, 129].includes(speciesId);
    const isAggressive = ['15', '130', '128', '19', '21', 'beedrill', 'gyarados', 'tauros', 'rattata', 'spearow'].includes(speciesName) || [15, 130, 128, 19, 21].includes(speciesId);

    if (dist < 100) {
      if (isFleeing) {
        context.controller.changeState('flee');
        return;
      } else if (isAggressive) {
        context.controller.changeState('aggro');
        return;
      }
    }

    if (dist < 80) {
      // Reached close enough, just look at them
      context.controller.changeState('idle');
      return;
    } else if (dist > 250) {
      // Lost interest
      context.controller.changeState('idle');
      return;
    }

    context.moveTowards(targetClient.position, this.speed, dt);
  }

  exit(context: BehaviorContext): void {
    context.targetEntityId = null;
  }
}
