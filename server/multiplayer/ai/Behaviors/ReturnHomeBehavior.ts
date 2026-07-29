import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState, vec2Distance } from '../../../../shared/pokemonData.js';

export class ReturnHomeBehavior implements BehaviorState {
  private speed: number = 40;
  
  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Wandering;
  }

  update(context: BehaviorContext, dt: number): void {
    const dist = vec2Distance(context.wildPokemon.position, context.spawnOrigin);
    
    if (dist < 20) {
      context.controller.changeState('idle');
      return;
    }

    // Teleport home if stuck for too long
    if (context.stateTimer > 15000) {
      context.wildPokemon.position.x = context.spawnOrigin.x;
      context.wildPokemon.position.y = context.spawnOrigin.y;
      context.controller.changeState('idle');
      return;
    }

    context.moveTowards(context.spawnOrigin, this.speed, dt);
  }

  exit(context: BehaviorContext): void {
  }
}
