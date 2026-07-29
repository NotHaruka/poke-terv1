import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState } from '@game-core/pokemonData.js';

export class SleepBehavior implements BehaviorState {
  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Idle;
  }

  update(context: BehaviorContext, dt: number): void {
    // Wake up if player gets very close, or if morning comes
    const players = context.getNearbyPlayers(50);
    if (players.length > 0) {
      context.controller.changeState('investigate');
      return;
    }

    // Checking time of day might require getting env data again, omitted for brevity.
    // If woken, change to idle.
  }

  exit(context: BehaviorContext): void {
  }
}
