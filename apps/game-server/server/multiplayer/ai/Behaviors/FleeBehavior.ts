import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState, vec2Distance, Vec2 } from '@game-core/pokemonData.js';

export class FleeBehavior implements BehaviorState {
  private fleeSpeed: number = 60;
  
  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Fleeing;
  }

  update(context: BehaviorContext, dt: number): void {
    if (context.stateTimer > 8000) {
      // Despawn if fled for too long (Abra teleporting, etc)
      context.controller.changeState('despawn');
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
    if (dist > 250) {
      context.controller.changeState('idle');
      return;
    }

    // Move away from target
    const dirX = context.wildPokemon.position.x - targetClient.position.x;
    const dirY = context.wildPokemon.position.y - targetClient.position.y;
    
    // Normalize and project a target position
    const length = Math.sqrt(dirX*dirX + dirY*dirY);
    if (length > 0) {
      const targetPos: Vec2 = {
        x: context.wildPokemon.position.x + (dirX / length) * 50,
        y: context.wildPokemon.position.y + (dirY / length) * 50
      };
      context.moveTowards(targetPos, this.fleeSpeed, dt);
    }
  }

  exit(context: BehaviorContext): void {
    context.targetEntityId = null;
  }
}
