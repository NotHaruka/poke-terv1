import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState, vec2Distance } from '../../../../shared/pokemonData.js';

export class AggroBehavior implements BehaviorState {
  private chaseSpeed: number = 55;
  
  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Chasing;
  }

  update(context: BehaviorContext, dt: number): void {
    if (!context.targetEntityId) {
      context.controller.changeState('returnHome');
      return;
    }

    const targetClient = context.gameState.getClient(context.targetEntityId);
    if (!targetClient) {
      context.controller.changeState('returnHome');
      return;
    }

    const dist = vec2Distance(context.wildPokemon.position, targetClient.position);
    
    if (dist > 350) {
      // Target got away
      context.controller.changeState('returnHome');
      return;
    }
    
    if (dist < 20) {
      // Reached target, could initiate battle here later
      return;
    }

    context.moveTowards(targetClient.position, this.chaseSpeed, dt);
  }

  exit(context: BehaviorContext): void {
  }
}
