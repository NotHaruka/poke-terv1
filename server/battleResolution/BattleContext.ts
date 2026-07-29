import { BattleState } from './BattleState';
import { BattleParticipant } from './BattleParticipant';
import { PokemonInstance, MonsterInstance } from '../../shared/pokemonData.js';

export class BattleContext {
  public state: BattleState;

  constructor(state: BattleState) {
    this.state = state;
  }

  public getParticipant(id: string): BattleParticipant | undefined {
    return this.state.participants.get(id);
  }
  
  public getActivePokemon(participantId: string): MonsterInstance | PokemonInstance | any {
    const participant = this.getParticipant(participantId);
    if (!participant) return undefined;
    return participant.party[participant.activePokemonIndex];
  }

  public getEffectiveSpeed(participantId: string): number {
    const pokemon = this.getActivePokemon(participantId);
    if (!pokemon) return 0;
    
    // Future speed calculators / stat stages will go here
    let speed = pokemon.stats.speed;
    
    // Handle paralysis speed drop
    if (pokemon.status === 3) { // 3 = Paralysis in StatusEffect
      speed = Math.floor(speed * 0.5); 
    }
    
    return speed;
  }
}
