import { BehaviorState } from '../BehaviorState.js';
import { BehaviorContext } from '../BehaviorContext.js';
import { WildPokemonState, vec2Distance, randFloat } from '../../../../shared/pokemonData.js';
import { TILE_WATER } from '../../../../worldgen/generator/legacyProceduralWorldgen.js';

export class RoamBehavior implements BehaviorState {
  private roamSpeed: number = 30; // pixels per second
  private roamDuration: number = 0;

  enter(context: BehaviorContext): void {
    context.wildPokemon.currentState = WildPokemonState.Wandering;
    
    // Pick a random target within roam radius from spawn origin
    const angle = randFloat(0, Math.PI * 2);
    const distance = randFloat(10, context.maxRoamDistance);
    
    context.targetPos = {
      x: context.spawnOrigin.x + Math.cos(angle) * distance,
      y: context.spawnOrigin.y + Math.sin(angle) * distance
    };
    
    this.roamDuration = 5000 + Math.random() * 5000; // max roam time before giving up
  }

  update(context: BehaviorContext, dt: number): void {
    if (context.getDistanceFromHome() > context.maxRoamDistance * 1.5) {
      context.controller.changeState('returnHome');
      return;
    }

    const players = context.getNearbyPlayers(150);
    if (players.length > 0) {
      context.targetEntityId = players[0].id;
      context.controller.changeState('investigate');
      return;
    }

    if (context.targetPos) {
      // Move towards target
      context.moveTowards(context.targetPos, this.roamSpeed, dt);
      
      const dist = vec2Distance(context.wildPokemon.position, context.targetPos);
      if (dist < 5 || context.stateTimer > this.roamDuration) {
        context.controller.changeState('idle');
      }
    } else {
      context.controller.changeState('idle');
    }
  }

  exit(context: BehaviorContext): void {
    context.targetPos = null;
  }
}
