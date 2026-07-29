import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState } from '../../../../shared/pokemonData.js';

export class IdleBehavior implements BehaviorState {
  private idleDuration: number = 0;

  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Idle;
    // Idle for 1 to 5 seconds
    this.idleDuration = 1000 + Math.random() * 4000;
  }

  update(context: BehaviorContext, dt: number): void {
    if (context.stateTimer >= this.idleDuration) {
      context.controller.changeState('roam');
      return;
    }

    // Example perception check
    const players = context.getNearbyPlayers(150);
    if (players.length > 0) {
      // Check species traits to decide whether to flee, aggro, or investigate
      // For now, let's just make them investigate
      context.targetEntityId = players[0].id;
      context.controller.changeState('investigate');
    }
  }

  exit(context: BehaviorContext): void {
  }
}
