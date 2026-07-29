import { GameState } from './game.js';
import { 
    worldToChunk, 
    randInt, 
    randFloat, 
    vec2Distance,
    getBiomeAt, 
    rawTerrainTile,
    TILE_WATER,
    PacketType,
    PokemonManager,
    PokemonLocationType,
    PokemonFactory,
    WildPokemon,
    WildPokemonState,
    WORLD_SEED,
    CHUNK_SIZE,
    TILE_SIZE,
    BiomeSpawnTables,
    SpawnRule
} from '@game-core/pokemonData.js';
import { BehaviorController } from './ai/BehaviorController.js';

const MAX_POKEMON_PER_CHUNK = 2; // Keep it low for performance initially
const DESPAWN_DISTANCE = 1000; // Pixels
const MIN_SPAWN_DISTANCE = 160; // Pixels
const MAX_SPAWN_DISTANCE = 500; // Pixels
const SPAWN_INTERVAL_MS = 5000;
const AI_TICK_RATE = 200; // 5 times a second

export class PokemonSpawnManager {
    private gameState: GameState;
    private spawnTimer: NodeJS.Timeout | null = null;
    private aiTimer: NodeJS.Timeout | null = null;
    private lastAITick: number = 0;
    
    // Tracks active wild pokemon by entity ID
    private activeSpawns = new Set<string>();
    private aiControllers = new Map<string, BehaviorController>();

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    public start() {
        if (!this.spawnTimer) {
            this.spawnTimer = setInterval(() => this.tickSpawns(), SPAWN_INTERVAL_MS);
        }
        if (!this.aiTimer) {
            this.lastAITick = Date.now();
            this.aiTimer = setInterval(() => this.tickAI(), AI_TICK_RATE);
        }
    }

    public stop() {
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = null;
        }
        if (this.aiTimer) {
            clearInterval(this.aiTimer);
            this.aiTimer = null;
        }
    }

    private tickSpawns() {
        this.processSpawns();
        this.processDespawns();
    }

    private tickAI() {
        const now = Date.now();
        const dt = now - this.lastAITick;
        this.lastAITick = now;

        const pm = PokemonManager.getInstance();
        const clients = this.gameState.getAllClients();

        // Support LOD: only update AI for pokemon near players
        for (const entityId of this.activeSpawns) {
            const wild = pm.getWildPokemon(entityId);
            if (!wild) continue;

            // LOD check
            let isNearPlayer = false;
            for (const client of clients) {
                if (client.mapInstanceId === wild.spawnBiome) {
                    const dist = vec2Distance(client.position, wild.position);
                    if (dist < 800) { // Active distance
                        isNearPlayer = true;
                        break;
                    }
                }
            }

            if (!isNearPlayer) continue;

            const controller = this.aiControllers.get(entityId);
            if (controller) {
                const startPos = { ...wild.position };
                controller.update(dt);
                
                // If despawn timer is flagged
                if (wild.despawnTimer !== undefined && wild.despawnTimer > 0) {
                    this.despawnPokemon(entityId);
                    continue;
                }
                
                // Broadcast movement if moved significantly (for future net optimization)
                // For now we just let the position update in the background. 
                // In a real netcode, we might want to sync position packets occasionally.
                if (startPos.x !== wild.position.x || startPos.y !== wild.position.y) {
                    this.gameState.broadcastToMap(wild.spawnBiome, {
                        type: PacketType.EntityMove,
                        entityId,
                        entityType: 'pokemon',
                        position: wild.position,
                        rotation: wild.rotation,
                        timestamp: Date.now()
                    } as any);
                }
            }
        }
    }

    private despawnPokemon(entityId: string) {
        const pm = PokemonManager.getInstance();
        const wild = pm.getWildPokemon(entityId);
        if (wild) {
            this.gameState.broadcastToMap(wild.spawnBiome, {
                type: PacketType.EntityDespawn,
                entityId,
                timestamp: Date.now()
            });
            pm.removeWildPokemon(entityId);
        }
        this.activeSpawns.delete(entityId);
        this.aiControllers.delete(entityId);
    }

    private processSpawns() {
        const pm = PokemonManager.getInstance();
        const clients = this.gameState.getAllClients();
        if (clients.length === 0) return;

        // Group players by chunk
        const chunkBudgets = new Map<string, number>();

        for (const client of clients) {
            // Only process spawning for overworld maps, not interiors
            if (client.mapInstanceId.includes('interior')) continue;

            const map = this.gameState.getMap(client.mapInstanceId);
            if (!map) continue;

            // Determine chunk
            const chunk = worldToChunk(client.position.x, client.position.y, CHUNK_SIZE, TILE_SIZE);
            
            // Check surrounding chunks
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const cx = chunk.x + dx;
                    const cy = chunk.y + dy;
                    const chunkKey = `${client.mapInstanceId}_${cx}_${cy}`;
                    
                    if (!chunkBudgets.has(chunkKey)) {
                        chunkBudgets.set(chunkKey, 0);
                    }
                }
            }
        }

        // Count existing pokemon per chunk
        for (const entityId of this.activeSpawns) {
            const wild = pm.getWildPokemon(entityId);
            if (!wild) {
                this.activeSpawns.delete(entityId);
                continue;
            }
            const chunkKey = `${wild.spawnBiome}_${wild.spawnChunk.cx}_${wild.spawnChunk.cy}`;
            if (chunkBudgets.has(chunkKey)) {
                chunkBudgets.set(chunkKey, chunkBudgets.get(chunkKey)! + 1);
            }
        }

        // Try spawning in chunks that have budget
        for (const client of clients) {
            if (client.mapInstanceId.includes('interior')) continue;
            const map = this.gameState.getMap(client.mapInstanceId);
            if (!map) continue;

            const chunk = worldToChunk(client.position.x, client.position.y, CHUNK_SIZE, TILE_SIZE);
            const chunkKey = `${client.mapInstanceId}_${chunk.x}_${chunk.y}`;
            const currentCount = chunkBudgets.get(chunkKey) || 0;

            if (currentCount < MAX_POKEMON_PER_CHUNK) {
                // Attempt spawn
                this.attemptSpawnForPlayer(client, map.seed);
                // Increment budget so we don't spawn all at once for this chunk if multiple players
                chunkBudgets.set(chunkKey, currentCount + 1);
            }
        }
    }

    private attemptSpawnForPlayer(client: any, seed: number) {
        // Find a random position between MIN_SPAWN_DISTANCE and MAX_SPAWN_DISTANCE
        const angle = randFloat(0, Math.PI * 2);
        const distance = randFloat(MIN_SPAWN_DISTANCE, MAX_SPAWN_DISTANCE);
        const spawnX = client.position.x + Math.cos(angle) * distance;
        const spawnY = client.position.y + Math.sin(angle) * distance;

        // Get environment data at spawn point
        const envData = this.gameState.getBattleEnvironmentData(client.mapInstanceId, spawnX, spawnY);
        
        // Cannot spawn on unwalkable terrain unless it's water and the pokemon is waterOnly
        const isWater = envData.groundTile === TILE_WATER;
        const isMountain = envData.groundTile === 4; // TILE_MOUNTAIN

        // Select species
        const rules = BiomeSpawnTables[envData.biomeId!];
        if (!rules || rules.length === 0) return;

        // Filter rules by conditions
        const validRules = rules.filter((r: any) => {
            if (r.conditions) {
                if (r.conditions.timeOfDay && !r.conditions.timeOfDay.includes(envData.timeOfDay)) return false;
                if (r.conditions.weather && !r.conditions.weather.includes(envData.weather)) return false;
                if (r.conditions.waterOnly && !isWater) return false;
                if (!r.conditions.waterOnly && isWater) return false;
                if (r.conditions.mountainOnly && !isMountain) return false;
                if (!r.conditions.mountainOnly && isMountain) return false;
            } else {
                // Default: no water or mountain spawning without conditions
                if (isWater || isMountain) return false;
            }
            return true;
        });

        if (validRules.length === 0) return;

        // Weighted random
        const totalWeight = validRules.reduce((sum: number, rule: any) => sum + rule.weight, 0);
        let roll = randFloat(0, totalWeight);
        let selectedRule: SpawnRule | null = null;
        for (const rule of validRules) {
            roll -= rule.weight;
            if (roll <= 0) {
                selectedRule = rule;
                break;
            }
        }

        if (!selectedRule) return;

        this.executeSpawn(selectedRule, spawnX, spawnY, envData.biomeId!, client.mapInstanceId);
    }

    private executeSpawn(rule: SpawnRule, x: number, y: number, biomeId: string, mapId: string) {
        const pm = PokemonManager.getInstance();
        
        const level = randInt(rule.minLevel, rule.maxLevel);
        
        try {
            const instance = PokemonFactory.create({
                speciesId: rule.speciesId,
                level,
            });

            const entityId = `wild_${Date.now()}_${randInt(0, 9999)}`;
            
            pm.registerPokemon(instance, {
                type: PokemonLocationType.Wild,
                entityId
            });

            const spawnChunk = worldToChunk(x, y, CHUNK_SIZE, TILE_SIZE);

            const wild: WildPokemon = {
                entityId,
                pokemonInstanceId: instance.id,
                position: { x, y },
                rotation: 'down',
                spawnChunk: spawnChunk as any,
                spawnBiome: mapId,
                spawnTimestamp: Date.now(),
                currentState: WildPokemonState.Wandering
            };

            pm.registerWildPokemon(wild);
            this.activeSpawns.add(entityId);
            this.aiControllers.set(entityId, new BehaviorController(wild, instance, this.gameState));
            
            // Broadcast spawn to map
            this.gameState.broadcastToMap(mapId, {
                type: PacketType.EntitySpawn,
                entityId: entityId,
                entityType: 'pokemon',
                position: { x, y },
                timestamp: Date.now(),
                data: {
                    wildPokemon: wild,
                    pokemonInstance: instance
                }
            });
            
            console.log(`[Spawn] ${instance.speciesId} at ${Math.round(x)},${Math.round(y)} in ${mapId}`);

        } catch (e) {
            console.error("Failed to spawn pokemon", e);
        }
    }

    private processDespawns() {
        const pm = PokemonManager.getInstance();
        const clients = this.gameState.getAllClients();
        
        for (const entityId of this.activeSpawns) {
            const wild = pm.getWildPokemon(entityId);
            if (!wild) {
                this.activeSpawns.delete(entityId);
                continue;
            }
            
            // Skip despawn if battling or captured
            if (wild.currentState === WildPokemonState.Battling || wild.currentState === WildPokemonState.Captured) {
                continue;
            }

            // Check distance to all clients in the same map
            let minDistance = Infinity;
            for (const client of clients) {
                if (client.mapInstanceId === wild.spawnBiome) {
                    const dist = vec2Distance(client.position, wild.position);
                    if (dist < minDistance) {
                        minDistance = dist;
                    }
                }
            }

            // If no clients in map or all clients are too far
            if (minDistance > DESPAWN_DISTANCE) {
                // Broadcast despawn
                this.gameState.broadcastToMap(wild.spawnBiome, {
                    type: PacketType.EntityDespawn,
                    entityId,
                    timestamp: Date.now()
                });

                pm.removeWildPokemon(entityId);
                this.activeSpawns.delete(entityId);
                console.log(`[Despawn] ${entityId} due to distance or empty map`);
            }
        }
    }
}
