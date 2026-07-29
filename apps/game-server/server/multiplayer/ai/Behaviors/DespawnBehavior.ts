import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState } from '@game-core/pokemonData.js';

export class DespawnBehavior implements BehaviorState {
  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Idle;
    // Flag for deletion by spawn manager
    context.wildPokemon.despawnTimer = 1; 
  }

  update(context: BehaviorContext, dt: number): void {
    // Wait for spawn manager to pick it up and delete it
  }

  exit(context: BehaviorContext): void {
  }
}
