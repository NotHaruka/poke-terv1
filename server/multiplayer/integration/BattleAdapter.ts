import { GameState } from '../game.js';
import { 
  PokemonManager, PacketType, BattleEvent as LegacyBattleEvent, BattleActionData, WildPokemonState,
  BattleChallengeRequestPacket, BattleChallengeResponsePacket, BattleChallengeAnswerPacket, BattleChallengeResultPacket, BattleStartPacket,
  ENCOUNTER_COOLDOWN_MS, monsterInstanceToPokemonInstance, pokemonInstanceToMonsterInstance, PokemonLocationType, PokemonInstance
} from '../../../shared/pokemonData.js';
import { GameplayValidator } from './GameplayValidator.js';
import { BattleManager } from '../../battleResolution/BattleManager.js';
import { BattleSessionManager } from '../BattleSessionManager.js';
import { ParticipantType } from '../../battleResolution/BattleParticipant.js';
import { CaptureEventType } from '../../battleResolution/capture/CaptureEvents.js';
import { BattleEventType } from '../../battleResolution/BattleEvents.js';
import { savePlayerData } from '../SaveManager.js';
import { HumanActionProvider } from '../../battleResolution/providers/HumanActionProvider.js';
import { WildAIActionProvider } from '../../battleResolution/providers/WildAIActionProvider.js';
import { NetworkActionProvider } from '../../battleResolution/providers/NetworkActionProvider.js';
import { ClientState } from '../types.js';

export class BattleAdapter {
    private gameState: GameState;
    public newBattleManager: BattleManager;
    public battleSessionManager: BattleSessionManager;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.newBattleManager = new BattleManager();
        this.battleSessionManager = new BattleSessionManager(gameState, this.newBattleManager);
    }

    public handlePacket(client: ClientState, packet: any) {
        switch (packet.type) {
            case PacketType.BattleChallengeRequest:
                this.handleChallengeRequest(client, packet as BattleChallengeRequestPacket);
                break;
            case PacketType.BattleChallengeAnswer:
                this.handleChallengeAnswer(client, packet as BattleChallengeAnswerPacket);
                break;
            case PacketType.BattleAction:
                this.handleActionPacket(client, packet);
                break;
        }
    }

    public createEncounter(playerId: string, wildEntityId: string) {
        if (!GameplayValidator.validatePlayerCanBattle(this.gameState, playerId)) return false;

        const wild = GameplayValidator.validateWildPokemon(wildEntityId);
        if (!wild) return false;

        const client = this.gameState.getClient(playerId);
        if (!client || !client.playerData || !client.playerData.party) return false;

        const pm = PokemonManager.getInstance();
        const wildPokemonInstance = pm.getPokemonById(wild.pokemonInstanceId);
        if (!wildPokemonInstance) return false;

        let playerParty = pm.getParty(playerId).filter((p): p is PokemonInstance => p !== null);
        if (playerParty.length === 0 && client.playerData.party) {
            playerParty = client.playerData.party.map(m => monsterInstanceToPokemonInstance(m, { otId: playerId }));
            playerParty.forEach((mon, i) => {
                pm.registerPokemon(mon, { type: PokemonLocationType.Party, ownerId: playerId, slotIndex: i });
            });
        }

        const battle = this.newBattleManager.createBattle([
            {
                type: ParticipantType.Player,
                id: playerId,
                name: client.username,
                party: playerParty as any
            },
            {
                type: ParticipantType.Wild,
                id: wildEntityId,
                name: `Wild`,
                party: [wildPokemonInstance as any]
            }
        ]);

        // Register Action Providers
        const playerProvider = new HumanActionProvider(playerId);
        const wildProvider = new WildAIActionProvider(wildEntityId);
        battle.setProvider(playerId, playerProvider);
        battle.setProvider(wildEntityId, wildProvider);

        const playerMonsters = client.playerData.party.map(m => ({
            speciesId: m.speciesId, level: m.level, currentHp: m.currentHp,
            maxHp: m.maxHp, stats: m.stats, status: (m.status as any) ?? 0, nickname: m.nickname
        }));

        const opponentMonsters = [{
            speciesId: wildPokemonInstance.speciesId, level: wildPokemonInstance.level,
            currentHp: wildPokemonInstance.currentHp, maxHp: (wildPokemonInstance as any).maxHp ?? wildPokemonInstance.stats.hp,
            stats: wildPokemonInstance.stats, status: (wildPokemonInstance.status as any) ?? 0, nickname: 'Wild'
        }];

        const env = this.gameState.getBattleEnvironmentData(client.mapInstanceId, client.position.x, client.position.y);

        this.gameState.send(client, {
            type: PacketType.BattleStart,
            battleId: battle.state.id,
            isPvP: false,
            opponentName: 'Wild Pokemon',
            opponentId: wildEntityId,
            playerMonsters: playerMonsters as any, opponentMonsters: opponentMonsters as any, env,
            timestamp: Date.now()
        });

        wild.currentState = WildPokemonState.Battling;

        // Start turn action collection loop asynchronously
        battle.requestTurnActions().catch((err: any) => console.warn('[BattleAdapter] Turn action error:', err));
        return true;
    }

    public handleChallengeRequest(challenger: ClientState, packet: BattleChallengeRequestPacket) {
        this.battleSessionManager.handleChallengeRequest(challenger, packet);
    }

    public handleChallengeAnswer(sender: ClientState, packet: BattleChallengeAnswerPacket) {
        this.battleSessionManager.handleChallengeAnswer(sender, packet);
    }

    public startPvPBattle(p1: ClientState, p2: ClientState) {
        this.battleSessionManager.startPvPBattle(p1, p2);
    }

    public handleClientDisconnect(clientId: string) {
        this.battleSessionManager.handleClientDisconnect(clientId);

        // Cancel and destroy active battles for this client
        for (const battle of this.newBattleManager.getActiveBattles()) {
            if (battle.state.participants.has(clientId)) {
                const provider = battle.getProvider(clientId);
                if (provider && provider.cancel) provider.cancel();
                let targetId = '';
                for (const [id] of battle.state.participants.entries()) {
                    if (id !== clientId) {
                        targetId = id;
                        break;
                    }
                }
                this.endEncounter(battle.state.id, clientId, targetId);
            }
        }
    }

    public handleActionPacket(client: any, packet: any) {
        if (this.battleSessionManager.getSessionByClient(client.id)) {
            this.battleSessionManager.handleBattleAction(client, packet);
            return;
        }

        const battle = this.newBattleManager.getBattle(packet.battleId);
        if (!battle) return;

        const participant = battle.state.participants.get(client.id);
        if (!participant) return;

        const pData: BattleActionData = packet.action;
        let action: any;
        
        let targetId = '';
        for (const [id] of battle.state.participants.entries()) {
            if (id !== client.id) {
                targetId = id;
                break;
            }
        }

        if (pData.kind === 'attack') {
            const activeMon = participant.party[participant.activePokemonIndex];
            const moveId = activeMon.moves[pData.moveIndex] || 1; 
            action = { type: 'Move', participantId: client.id, priority: 0, moveId, targetId };
        } else if (pData.kind === 'switch') {
            const nextMon = participant.party[pData.slot];
            if (nextMon) {
               action = { type: 'Switch', participantId: client.id, priority: 6, nextPokemonId: nextMon.id };
            }
        } else if (pData.kind === 'item') {
            action = { type: 'Item', participantId: client.id, priority: 6, itemId: pData.itemId, targetId };
        } else if (pData.kind === 'run') {
            action = { type: 'Run', participantId: client.id, priority: 6 };
            this.endEncounter(battle.state.id, client.id, targetId);
            return;
        }

        if (action) {
            try {
                battle.submitAction(action);
            } catch (e) {
                console.error("Action error", e);
                return;
            }

            if (battle.state.events.length > 0) {
                this.sendBattleEvents(client, battle, targetId);
            }
        }
    }

    private sendBattleEvents(client: any, battle: any, targetId: string) {
        const legacyEvents: LegacyBattleEvent[] = [];
        let battleOver = false;
        let pActiveFainted = false;

        for (const evt of battle.state.events) {
            if (evt.type === BattleEventType.Message) {
                legacyEvents.push({ type: 'message', text: evt.payload.text });
            } else if (evt.type === BattleEventType.Damage) {
                legacyEvents.push({ 
                    type: 'damage', 
                    target: evt.payload.targetId === client.id ? 'player' : 'opponent', 
                    amount: evt.payload.damage,
                    isCrit: evt.payload.isCritical,
                    effectiveness: evt.payload.typeEffectiveness
                });
            } else if (evt.type === BattleEventType.PokemonFainted) {
                legacyEvents.push({
                    type: 'faint',
                    target: evt.payload.participantId === client.id ? 'player' : 'opponent'
                });
                if (evt.payload.participantId === client.id) {
                    pActiveFainted = true;
                }
            } else if (evt.type === BattleEventType.Switch) {
                // mock switch
            } else if (evt.type === CaptureEventType.CaptureSuccess) {
                legacyEvents.push({ type: 'message', text: "Gotcha! Caught it!" });
                legacyEvents.push({ type: 'catch', success: true });
                battleOver = true;
            } else if (evt.type === CaptureEventType.CaptureFailure) {
                legacyEvents.push({ type: 'message', text: "It broke free!" });
                legacyEvents.push({ type: 'catch', success: false });
            } else if (evt.type === BattleEventType.BattleEnded || evt.type === CaptureEventType.BattleEnded) {
                battleOver = true;
            }
        }

        battle.state.events = []; // Clear processed

        // Send results to all human participants in the battle
        for (const [id] of battle.state.participants.entries()) {
            const pClient = this.gameState.getClient(id);
            if (pClient) {
                this.gameState.send(pClient, {
                    type: PacketType.BattleResult,
                    battleId: battle.state.id,
                    events: legacyEvents,
                    battleOver: battleOver,
                    turnReady: !pActiveFainted,
                    timestamp: Date.now()
                });
            }
        }

        if (battleOver || battle.state.phase === 'End') {
            this.endEncounter(battle.state.id, client.id, targetId);
        } else {
            // Re-trigger action request for next turn
            battle.requestTurnActions().catch((err: any) => console.warn('[BattleAdapter] Next turn error:', err));
        }
    }

    private endEncounter(battleId: string, playerId: string, wildEntityId: string) {
        const battle = this.newBattleManager.getBattle(battleId);
        if (battle) {
            this.newBattleManager.destroyBattle(battleId);
        }

        const now = Date.now();
        const client = this.gameState.getClient(playerId);
        if (client) {
            client.lastEncounterTime = now;
            client.encounterCooldownUntil = now + ENCOUNTER_COOLDOWN_MS;
        }

        const wild = PokemonManager.getInstance().getWildPokemon(wildEntityId);
        if (wild) {
            const wildMon = PokemonManager.getInstance().getPokemonById(wild.pokemonInstanceId);
            if (!wildMon || wildMon.currentHp <= 0 || (wildMon as any).ownerId || PokemonManager.getInstance().getLocation(wildMon.id)?.ownerId) {
                // Defeated or Captured
                this.gameState.broadcastToMap(wild.spawnBiome, {
                    type: 23, // EntityDespawn
                    entityId: wildEntityId,
                    timestamp: Date.now()
                });
                PokemonManager.getInstance().removeWildPokemon(wildEntityId);
            } else {
                wild.currentState = WildPokemonState.Wandering;
                wild.lastEncounterPlayerId = playerId;
                wild.lastEncounterTime = now;
                wild.ignorePlayerUntil = now + ENCOUNTER_COOLDOWN_MS;
            }
        }

        if (client && client.playerData) {
            // Restore player party refs if captured or exp gained
            const pParty = PokemonManager.getInstance().getParty(playerId);
            const mParty = [];
            for (let i = 0; i < 6; i++) {
                if (pParty[i]) {
                    mParty.push(pokemonInstanceToMonsterInstance(pParty[i]!));
                }
            }
            client.playerData.party = mParty as any;
            
            // Reconstruct PC data from PokemonManager to save it
            for (let b = 0; b < 32; b++) {
               const box = PokemonManager.getInstance().getPCBox(playerId, b);
               const arr: any[] = [];
               box.forEach((p) => {
                   arr.push(pokemonInstanceToMonsterInstance(p));
               });
               if (arr.length > 0) {
                   client.playerData.boxes[b] = arr;
               } else {
                   delete client.playerData.boxes[b];
               }
            }
            
            savePlayerData(playerId, client.playerData);
        }
    }
}

