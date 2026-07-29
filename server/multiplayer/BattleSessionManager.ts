import { GameState } from './game.js';
import { ClientState } from './types.js';
import {
  PacketType,
  BattleChallengeRequestPacket,
  BattleChallengeResponsePacket,
  BattleChallengeAnswerPacket,
  BattleChallengeResultPacket,
  BattleStartPacket,
  BattleActionPacket,
  BattleActionData,
  PokemonManager,
  BattleEndPacket
} from '../../shared/pokemonData.js';
import { BattleManager } from '../battleResolution/BattleManager.js';
import { BattleInstance } from '../battleResolution/BattleInstance.js';
import { ParticipantType } from '../battleResolution/BattleParticipant.js';
import { NetworkActionProvider } from '../battleResolution/providers/NetworkActionProvider.js';
import { BattleAction, BattleActionType, MoveAction, SwitchAction, ItemAction, RunAction } from '../battleResolution/BattleAction.js';

export interface PendingBattleChallenge {
  challengerId: string;
  targetId: string;
  timeout: NodeJS.Timeout;
}

export interface PvPBattleSession {
  battleId: string;
  p1: ClientState;
  p2: ClientState;
  battleInstance: BattleInstance;
  p1Provider: NetworkActionProvider;
  p2Provider: NetworkActionProvider;
  startTime: number;
}

export class BattleSessionManager {
  private gameState: GameState;
  private battleManager: BattleManager;
  private activeSessions: Map<string, PvPBattleSession> = new Map();
  private playerToSession: Map<string, string> = new Map(); // clientId -> battleId
  private pendingChallenges: Map<string, PendingBattleChallenge> = new Map(); // challengerId -> challenge

  constructor(gameState: GameState, battleManager: BattleManager) {
    this.gameState = gameState;
    this.battleManager = battleManager;
  }

  public handleChallengeRequest(challenger: ClientState, packet: BattleChallengeRequestPacket): void {
    const target = this.gameState.getClient(packet.targetPlayerId);
    if (!target) return;

    if (!challenger.playerData || !challenger.playerData.party || challenger.playerData.party.length === 0) {
      this.gameState.send(challenger, {
        type: PacketType.BattleChallengeResult,
        accepted: false,
        timestamp: Date.now(),
        message: "You need a monster to battle!"
      } as BattleChallengeResultPacket);
      return;
    }

    if (!target.playerData || !target.playerData.party || target.playerData.party.length === 0) {
      this.gameState.send(challenger, {
        type: PacketType.BattleChallengeResult,
        accepted: false,
        timestamp: Date.now(),
        message: "That player has no monsters to battle."
      } as BattleChallengeResultPacket);
      return;
    }

    if (this.pendingChallenges.has(challenger.id) || this.playerToSession.has(challenger.id)) {
      this.gameState.send(challenger, {
        type: PacketType.BattleChallengeResult,
        accepted: false,
        timestamp: Date.now(),
        message: "You already have a pending or active battle."
      } as BattleChallengeResultPacket);
      return;
    }

    if (this.playerToSession.has(target.id)) {
      this.gameState.send(challenger, {
        type: PacketType.BattleChallengeResult,
        accepted: false,
        timestamp: Date.now(),
        message: "That player is currently in a battle."
      } as BattleChallengeResultPacket);
      return;
    }

    // 30s challenge timeout
    const timeout = setTimeout(() => {
      this.pendingChallenges.delete(challenger.id);
      const timeoutMsg: BattleChallengeResultPacket = {
        type: PacketType.BattleChallengeResult,
        accepted: false,
        timestamp: Date.now(),
        message: "The battle request timed out."
      };
      this.gameState.send(challenger, timeoutMsg);
      this.gameState.send(target, timeoutMsg);
    }, 30000);

    this.pendingChallenges.set(challenger.id, {
      challengerId: challenger.id,
      targetId: target.id,
      timeout
    });

    this.gameState.send(target, {
      type: PacketType.BattleChallengeResponse,
      challengerId: challenger.id,
      challengerName: challenger.username,
      timestamp: Date.now()
    } as BattleChallengeResponsePacket);
  }

  public handleChallengeAnswer(sender: ClientState, packet: BattleChallengeAnswerPacket): void {
    const challengerId = packet.challengerId;

    // Cancellation by challenger
    if (sender.id === packet.challengerId) {
      const challenge = this.pendingChallenges.get(sender.id);
      if (!challenge) return;

      clearTimeout(challenge.timeout);
      this.pendingChallenges.delete(sender.id);

      const target = this.gameState.getClient(challenge.targetId);
      const cancelMsg: BattleChallengeResultPacket = {
        type: PacketType.BattleChallengeResult,
        accepted: false,
        timestamp: Date.now(),
        message: "Battle request cancelled."
      };

      this.gameState.send(sender, cancelMsg);
      if (target) this.gameState.send(target, cancelMsg);
      return;
    }

    // Response from target
    const challenge = this.pendingChallenges.get(challengerId);
    if (!challenge || challenge.targetId !== sender.id) return;

    clearTimeout(challenge.timeout);
    this.pendingChallenges.delete(challengerId);

    const challenger = this.gameState.getClient(challengerId);
    const target = sender;

    const resultMsg: BattleChallengeResultPacket = {
      type: PacketType.BattleChallengeResult,
      accepted: packet.accept,
      timestamp: Date.now(),
      message: packet.accept ? undefined : `${target.username} declined the challenge.`
    };

    if (challenger) this.gameState.send(challenger, resultMsg);
    this.gameState.send(target, resultMsg);

    if (packet.accept && challenger) {
      this.startPvPBattle(challenger, target);
    }
  }

  public startPvPBattle(p1: ClientState, p2: ClientState): PvPBattleSession {
    const pm = PokemonManager.getInstance();
    const p1Party = pm.getParty(p1.id).filter(p => p !== null) as any;
    const p2Party = pm.getParty(p2.id).filter(p => p !== null) as any;

    const battleInstance = this.battleManager.createBattle([
      {
        type: ParticipantType.Player,
        id: p1.id,
        name: p1.username,
        party: p1Party
      },
      {
        type: ParticipantType.Player,
        id: p2.id,
        name: p2.username,
        party: p2Party
      }
    ]);

    const p1Provider = new NetworkActionProvider(p1.id);
    const p2Provider = new NetworkActionProvider(p2.id);
    battleInstance.setProvider(p1.id, p1Provider);
    battleInstance.setProvider(p2.id, p2Provider);

    const session: PvPBattleSession = {
      battleId: battleInstance.state.id,
      p1,
      p2,
      battleInstance,
      p1Provider,
      p2Provider,
      startTime: Date.now()
    };

    this.activeSessions.set(session.battleId, session);
    this.playerToSession.set(p1.id, session.battleId);
    this.playerToSession.set(p2.id, session.battleId);

    const env = this.gameState.getBattleEnvironmentData(p1.mapInstanceId, p1.position.x, p1.position.y);

    this.gameState.send(p1, {
      type: PacketType.BattleStart,
      battleId: session.battleId,
      isPvP: true,
      opponentName: p2.username,
      opponentId: p2.id,
      playerMonsters: p1.playerData!.party,
      opponentMonsters: p2.playerData!.party,
      env,
      timestamp: Date.now()
    } as BattleStartPacket);

    this.gameState.send(p2, {
      type: PacketType.BattleStart,
      battleId: session.battleId,
      isPvP: true,
      opponentName: p1.username,
      opponentId: p1.id,
      playerMonsters: p2.playerData!.party,
      opponentMonsters: p1.playerData!.party,
      env,
      timestamp: Date.now()
    } as BattleStartPacket);

    // Start action loop
    battleInstance.requestTurnActions().catch(err => console.warn('[BattleSessionManager] PvP action loop error:', err));

    return session;
  }

  public handleBattleAction(client: ClientState, packet: BattleActionPacket): void {
    const session = this.activeSessions.get(packet.battleId) || this.getSessionByClient(client.id);
    if (!session) return;

    const provider = client.id === session.p1.id ? session.p1Provider : session.p2Provider;
    const actionData: BattleActionData = packet.action;

    let targetId = '';
    for (const [id] of session.battleInstance.state.participants.entries()) {
      if (id !== client.id) {
        targetId = id;
        break;
      }
    }

    let battleAction: BattleAction;
    switch (actionData.kind) {
      case 'attack':
        const activeMon = session.battleInstance.state.participants.get(client.id)?.party[
          session.battleInstance.state.participants.get(client.id)!.activePokemonIndex
        ];
        const moveId = activeMon?.moves[actionData.moveIndex] || 1;
        battleAction = {
          type: BattleActionType.Move,
          participantId: client.id,
          priority: 0,
          moveId,
          targetId: actionData.targetId || targetId,
          isMega: actionData.isMega
        } as MoveAction;
        break;
      case 'switch':
        const targetSwitchMon = (session.p1.id === client.id ? session.p1 : session.p2).playerData?.party[actionData.slot];
        battleAction = {
          type: BattleActionType.Switch,
          participantId: client.id,
          priority: 6,
          targetPokemonIndex: actionData.slot,
          nextPokemonId: (targetSwitchMon as any)?.id || ''
        } as unknown as SwitchAction;
        break;
      case 'item':
        battleAction = {
          type: BattleActionType.Item,
          participantId: client.id,
          priority: 6,
          itemId: actionData.itemId,
          targetId: actionData.targetId || client.id
        } as ItemAction;
        break;
      case 'run':
        battleAction = {
          type: BattleActionType.Run,
          participantId: client.id,
          priority: 6
        } as RunAction;
        break;
      default:
        return;
    }

    provider.submitAction(battleAction);
  }

  public handleClientReconnect(client: ClientState): void {
    const session = this.getSessionByClient(client.id);
    if (!session) return;

    // Update ClientState ref in session
    if (session.p1.id === client.id) session.p1 = client;
    if (session.p2.id === client.id) session.p2 = client;

    const isP1 = session.p1.id === client.id;
    const opponent = isP1 ? session.p2 : session.p1;

    const env = this.gameState.getBattleEnvironmentData(client.mapInstanceId, client.position.x, client.position.y);

    // Resend BattleStart to re-sync client scene
    this.gameState.send(client, {
      type: PacketType.BattleStart,
      battleId: session.battleId,
      isPvP: true,
      opponentName: opponent.username,
      opponentId: opponent.id,
      playerMonsters: client.playerData!.party,
      opponentMonsters: opponent.playerData!.party,
      env,
      timestamp: Date.now()
    } as BattleStartPacket);
  }

  public handleClientDisconnect(clientId: string): void {
    // Clear pending challenges
    for (const [challengerId, challenge] of this.pendingChallenges.entries()) {
      if (challengerId === clientId || challenge.targetId === clientId) {
        clearTimeout(challenge.timeout);
        this.pendingChallenges.delete(challengerId);
      }
    }

    // Handle active battle disconnect
    const session = this.getSessionByClient(clientId);
    if (session) {
      const opponent = session.p1.id === clientId ? session.p2 : session.p1;

      // Cancel providers
      session.p1Provider.cancel();
      session.p2Provider.cancel();

      // Send battle end to remaining player
      this.gameState.send(opponent, {
        type: PacketType.BattleEnd,
        battleId: session.battleId,
        winnerId: opponent.id,
        reason: 'Opponent disconnected',
        timestamp: Date.now()
      } as BattleEndPacket);

      this.endBattleSession(session.battleId);
    }
  }

  public getSessionByClient(clientId: string): PvPBattleSession | undefined {
    const battleId = this.playerToSession.get(clientId);
    return battleId ? this.activeSessions.get(battleId) : undefined;
  }

  public endBattleSession(battleId: string): void {
    const session = this.activeSessions.get(battleId);
    if (session) {
      this.playerToSession.delete(session.p1.id);
      this.playerToSession.delete(session.p2.id);
      this.activeSessions.delete(battleId);
      this.battleManager.destroyBattle(battleId);
    }
  }
}
