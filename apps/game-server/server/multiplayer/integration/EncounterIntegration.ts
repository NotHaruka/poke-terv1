import { GameState } from '../game.js';
import { PokemonManager, WildPokemonState, vec2Distance, ENCOUNTER_COOLDOWN_MS, ENCOUNTER_RESET_DISTANCE } from '@game-core/pokemonData.js';
import { BattleAdapter } from './BattleAdapter.js';

export class EncounterIntegration {
    private gameState: GameState;
    private battleAdapter: BattleAdapter;
    private interval: NodeJS.Timeout | null = null;

    constructor(gameState: GameState, battleAdapter: BattleAdapter) {
        this.gameState = gameState;
        this.battleAdapter = battleAdapter;
    }

    public start() {
        if (!this.interval) {
            this.interval = setInterval(() => this.update(100), 100);
        }
    }
    
    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    public update(dt: number) {
        const pm = PokemonManager.getInstance();
        const clients = this.gameState.getAllClients();
        const wilds = pm.getAllWildPokemon();
        const now = Date.now();

        for (const wild of wilds) {
            // Only wandering/chasing pokemon can start battles
            if (wild.currentState !== WildPokemonState.Wandering && wild.currentState !== WildPokemonState.Chasing) {
                continue;
            }

            // Check distance to all clients in the same map
            for (const client of clients) {
                // If player is already in a battle, skip
                if (this.isPlayerInBattle(client.id)) {
                    continue;
                }

                if (client.mapInstanceId === wild.spawnBiome) {
                    const dist = vec2Distance(client.position, wild.position);
                    // The player hits the wild pokemon
                    if (dist < 24) { 
                        // Check if wild or player is on encounter cooldown
                        const isWildIgnoringPlayer = wild.lastEncounterPlayerId === client.id && 
                                                    (wild.ignorePlayerUntil !== undefined && now < wild.ignorePlayerUntil);
                        const isPlayerOnCooldown = client.encounterCooldownUntil !== undefined && now < client.encounterCooldownUntil;

                        if (isWildIgnoringPlayer || isPlayerOnCooldown) {
                            // Check distance reset: If player walked farther than ENCOUNTER_RESET_DISTANCE (128 px) from encounter start pos
                            const startPos = wild.encounterStartPos || client.lastEncounterStartPos;
                            if (startPos) {
                                const distFromStart = vec2Distance(client.position, startPos);
                                if (distFromStart >= ENCOUNTER_RESET_DISTANCE) {
                                    // Early clear cooldown!
                                    wild.ignorePlayerUntil = 0;
                                    client.encounterCooldownUntil = 0;
                                    this.initiateEncounter(client.id, wild.entityId);
                                    break;
                                }
                            }
                            // Still on cooldown & hasn't moved away -> skip triggering encounter
                            continue;
                        }

                        // Trigger Battle!
                        this.initiateEncounter(client.id, wild.entityId);
                        break;
                    }
                }
            }
        }
    }

    private isPlayerInBattle(playerId: string): boolean {
        const battles = this.battleAdapter.newBattleManager.getActiveBattles();
        for (const battle of battles) {
            if (battle.state.participants.has(playerId)) {
                return true;
            }
        }
        return false;
    }

    public initiateEncounter(playerId: string, wildEntityId: string) {
        const pm = PokemonManager.getInstance();
        const wild = pm.getWildPokemon(wildEntityId);
        if (!wild || wild.currentState === WildPokemonState.Battling) return;

        const client = this.gameState.getClient(playerId);
        const now = Date.now();

        // Record start positions and encounter timestamp
        wild.lastEncounterPlayerId = playerId;
        wild.lastEncounterTime = now;
        wild.encounterStartPos = { x: wild.position.x, y: wild.position.y };

        if (client) {
            client.lastEncounterTime = now;
            client.lastEncounterStartPos = { x: client.position.x, y: client.position.y };
        }

        console.log(`[EncounterIntegration] Triggering encounter: ${playerId} vs ${wildEntityId}`);
        this.battleAdapter.createEncounter(playerId, wildEntityId);
    }
}
