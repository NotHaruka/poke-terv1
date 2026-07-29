import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState, vec2Distance } from '../../../../shared/pokemonData.js';

export class FollowBehavior implements BehaviorState {
  private speed: number = 45;
  
  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Chasing;
  }

  update(context: BehaviorContext, dt: number): void {
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
    
    if (dist < 40) {
      // Stop moving when close
      return;
    } else if (dist > 300) {
      // Lost target
      context.controller.changeState('returnHome');
      return;
    }

    context.moveTowards(targetClient.position, this.speed, dt);
  }

  exit(context: BehaviorContext): void {
    context.targetEntityId = null;
  }
}
