import { WildPokemon, MonsterInstance, Vec2, vec2Distance } from '../../../shared/pokemonData.js';
import { GameState } from '../game.js';
import { BehaviorController } from './BehaviorController.js';

export class BehaviorContext {
  public wildPokemon: WildPokemon;
  public instance: MonsterInstance | any;
  public gameState: GameState;
  public controller: BehaviorController;
  public dt: number = 0;
  
  public stateTimer: number = 0;
  public spawnOrigin: Vec2;
  public targetPos: Vec2 | null = null;
  public targetEntityId: string | null = null;
  public maxRoamDistance: number = 300;

  constructor(wildPokemon: WildPokemon, instance: MonsterInstance, gameState: GameState, controller: BehaviorController) {
    this.wildPokemon = wildPokemon;
    this.instance = instance;
    this.gameState = gameState;
    this.controller = controller;
    this.spawnOrigin = { ...wildPokemon.position };
  }

  public getNearbyPlayers(radius: number) {
    const clients = this.gameState.getClientsInMap(this.wildPokemon.spawnBiome);
    return clients.filter(c => {
      const dist = vec2Distance(c.position, this.wildPokemon.position);
      return dist <= radius;
    });
  }

  public getDistanceFromHome(): number {
    return vec2Distance(this.wildPokemon.position, this.spawnOrigin);
  }

  public moveTowards(target: Vec2, speed: number, dt: number) {
    const dist = vec2Distance(this.wildPokemon.position, target);
    if (dist > 0.5) {
      const dirX = (target.x - this.wildPokemon.position.x) / dist;
      const dirY = (target.y - this.wildPokemon.position.y) / dist;
      this.wildPokemon.position.x += dirX * speed * (dt / 1000);
      this.wildPokemon.position.y += dirY * speed * (dt / 1000);

      // Determine rotation
      if (Math.abs(dirX) > Math.abs(dirY)) {
        this.wildPokemon.rotation = dirX > 0 ? 'right' : 'left';
      } else {
        this.wildPokemon.rotation = dirY > 0 ? 'down' : 'up';
      }
    }
  }

  public hasLineOfSight(target: Vec2): boolean {
    // simplified for now - just distance and assuming no walls
    return true;
  }
}