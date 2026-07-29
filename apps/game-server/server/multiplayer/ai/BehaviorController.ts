import { WildPokemon, PokemonInstance } from '@game-core/pokemonData.js';
import { GameState } from '../game.js';
import { BehaviorState } from './BehaviorState.js';
import { BehaviorContext } from './BehaviorContext.js';
import { IdleBehavior } from './Behaviors/IdleBehavior.js';
import { RoamBehavior } from './Behaviors/RoamBehavior.js';
import { SleepBehavior } from './Behaviors/SleepBehavior.js';
import { InvestigateBehavior } from './Behaviors/InvestigateBehavior.js';
import { FollowBehavior } from './Behaviors/FollowBehavior.js';
import { FleeBehavior } from './Behaviors/FleeBehavior.js';
import { AggroBehavior } from './Behaviors/AggroBehavior.js';
import { ReturnHomeBehavior } from './Behaviors/ReturnHomeBehavior.js';
import { DespawnBehavior } from './Behaviors/DespawnBehavior.js';

export class BehaviorController {
  private currentState: BehaviorState | null = null;
  private currentStateName: string = '';
  private context: BehaviorContext;
  private states = new Map<string, BehaviorState>();

  constructor(wildPokemon: WildPokemon, instance: PokemonInstance, gameState: GameState) {
    this.context = new BehaviorContext(wildPokemon, instance as any, gameState, this);
    
    this.states.set('idle', new IdleBehavior());
    this.states.set('roam', new RoamBehavior());
    this.states.set('sleep', new SleepBehavior());
    this.states.set('investigate', new InvestigateBehavior());
    this.states.set('follow', new FollowBehavior());
    this.states.set('flee', new FleeBehavior());
    this.states.set('aggro', new AggroBehavior());
    this.states.set('returnHome', new ReturnHomeBehavior());
    this.states.set('despawn', new DespawnBehavior());

    this.changeState('idle');
  }

  public changeState(stateName: string) {
    if (this.currentStateName === stateName) return;
    
    const nextState = this.states.get(stateName);
    if (!nextState) return;

    if (this.currentState) {
      this.currentState.exit(this.context);
    }

    this.currentState = nextState;
    this.currentStateName = stateName;
    this.context.stateTimer = 0;
    this.currentState.enter(this.context);
  }

  public update(dt: number) {
    this.context.dt = dt;
    this.context.stateTimer += dt;
    if (this.currentState) {
      this.currentState.update(this.context, dt);
    }
  }

  public getContext(): BehaviorContext {
    return this.context;
  }
}
