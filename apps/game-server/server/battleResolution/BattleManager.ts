import { BattleInstance } from './BattleInstance.js';
import { BattleParticipant, ParticipantType } from './BattleParticipant.js';
import { MonsterInstance } from '@game-core/pokemonData.js';

export class BattleManager {
  private battles: Map<string, BattleInstance> = new Map();
  private nextBattleId: number = 1;

  public createBattle(participantsConfig: { type: ParticipantType, id: string, name: string, party: MonsterInstance[] }[]): BattleInstance {
    const battleId = `battle_${this.nextBattleId++}_${Date.now()}`;
    const instance = new BattleInstance(battleId);
    
    // Add participants
    for (const config of participantsConfig) {
      const participant: BattleParticipant = {
        id: config.id,
        type: config.type,
        name: config.name,
        party: config.party,
        activePokemonIndex: config.party.findIndex(p => p.currentHp > 0) || 0,
        hasActedThisTurn: false,
        canMegaEvolve: true,
        canTerastallize: true,
        canDynamax: true
      };
      
      instance.state.participants.set(config.id, participant);
    }
    
    // Validate
    if (instance.state.participants.size < 2) {
      throw new Error("Battle must have at least 2 participants");
    }
    
    this.battles.set(battleId, instance);
    return instance;
  }

  public getBattle(id: string): BattleInstance | undefined {
    return this.battles.get(id);
  }

  public destroyBattle(id: string): void {
    this.battles.delete(id);
  }

  public getActiveBattles(): BattleInstance[] {
    return Array.from(this.battles.values());
  }
}