import { GameState } from './game.js';
import { ClientState } from './types.js';
import {
  PacketType, AnyPacket, TradeRequestPacket, TradeResponsePacket,
  TradeOfferUpdatePacket, TradeConfirmPacket, TradeCompletePacket,
  MonsterSnapshot,
  PokemonManager, PokemonLocationType, pokemonInstanceToMonsterInstance, PokemonInstance
} from '../../shared/pokemonData.js';
import { savePlayerData } from './SaveManager.js';
import { TradeSession } from './TradeSession.js';
import { TradeValidator } from './TradeValidator.js';
import { TradeEventListener, TradeEvent } from './TradeEvents.js';

export class TradeManager {
  private server: GameState;
  private sessions: Map<string, TradeSession> = new Map();
  private playerToSession: Map<string, string> = new Map(); // clientId -> tradeId for O(1) lookup
  private pendingRequests: Map<string, { targetId: string; timeout: NodeJS.Timeout }> = new Map();
  private eventListeners: TradeEventListener[] = [];

  constructor(server: GameState) {
    this.server = server;
  }

  public addEventListener(listener: TradeEventListener): void {
    this.eventListeners.push(listener);
  }

  private emitEvent(event: TradeEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[TradeManager] Event listener error:', err);
      }
    }
  }

  public handlePacket(client: ClientState, packet: AnyPacket): void {
    switch (packet.type) {
      case PacketType.TradeRequest:
        this.handleTradeRequest(client, packet as TradeRequestPacket);
        break;
      case PacketType.TradeResponse:
        this.handleTradeResponse(client, packet as TradeResponsePacket);
        break;
      case PacketType.TradeOfferUpdate:
        this.handleTradeOfferUpdate(client, packet as TradeOfferUpdatePacket);
        break;
      case PacketType.TradeConfirm:
        this.handleTradeConfirm(client, packet as TradeConfirmPacket);
        break;
    }
  }

  private handleTradeRequest(client: ClientState, packet: TradeRequestPacket): void {
    const target = this.server.getClient(packet.targetPlayerId);
    if (!target) {
      this.server.send(client, {
        type: PacketType.TradeComplete,
        tradeId: 'none',
        success: false,
        timestamp: Date.now()
      } as TradeCompletePacket);
      return;
    }

    // Cancel existing pending trade requests from client
    const existing = this.pendingRequests.get(client.id);
    if (existing) {
      clearTimeout(existing.timeout);
      this.pendingRequests.delete(client.id);
    }

    // 30-second request timeout
    const timeout = setTimeout(() => {
      this.pendingRequests.delete(client.id);
      this.server.send(client, {
        type: PacketType.TradeResponse,
        senderId: target.id,
        senderName: target.username,
        accept: false,
        timestamp: Date.now()
      } as TradeResponsePacket);
    }, 30000);

    this.pendingRequests.set(client.id, { targetId: target.id, timeout });

    this.emitEvent({
      type: 'request',
      data: {
        senderId: client.id,
        senderName: client.username,
        targetId: target.id,
        timestamp: Date.now()
      }
    });

    this.server.send(target, {
      type: PacketType.TradeRequest,
      targetPlayerId: client.id,
      senderName: client.username,
      timestamp: Date.now()
    } as TradeRequestPacket);
  }

  private handleTradeResponse(client: ClientState, packet: TradeResponsePacket): void {
    const challenger = this.server.getClient(packet.senderId);
    if (!challenger) return;

    const req = this.pendingRequests.get(challenger.id);
    if (!req || req.targetId !== client.id) return;

    clearTimeout(req.timeout);
    this.pendingRequests.delete(challenger.id);

    this.emitEvent({
      type: 'response',
      data: {
        senderId: challenger.id,
        senderName: challenger.username,
        targetId: client.id,
        accepted: packet.accept,
        timestamp: Date.now()
      }
    });

    if (packet.accept) {
      const tradeId = `trade_${Date.now()}_${challenger.id}_${client.id}`;
      const session = new TradeSession(tradeId, challenger, client);

      this.sessions.set(tradeId, session);
      this.playerToSession.set(challenger.id, tradeId);
      this.playerToSession.set(client.id, tradeId);

      const welcomeTrade: TradeResponsePacket = {
        type: PacketType.TradeResponse,
        senderId: challenger.id,
        senderName: challenger.username,
        accept: true,
        timestamp: Date.now(),
        seq: 1
      } as any;

      this.server.send(challenger, {
        ...welcomeTrade,
        senderId: client.id,
        senderName: client.username
      });
      this.server.send(client, welcomeTrade);
    } else {
      this.server.send(challenger, {
        type: PacketType.TradeResponse,
        senderId: client.id,
        senderName: client.username,
        accept: false,
        timestamp: Date.now()
      } as TradeResponsePacket);
    }
  }

  private handleTradeOfferUpdate(client: ClientState, packet: TradeOfferUpdatePacket): void {
    const session = this.sessions.get(packet.tradeId) || this.getSessionByClient(client.id);
    if (!session) return;

    // Validate offer slot
    const val = TradeValidator.validateOffer(client, packet.offeredSlot);
    if (!val.valid) {
      console.warn(`[TradeManager] Invalid offer from ${client.id}: ${val.reason}`);
      return;
    }

    session.updateOffer(client.id, packet.offeredSlot);
    const opponent = session.getOpponent(client.id);

    this.emitEvent({
      type: 'offer_update',
      data: {
        tradeId: session.id,
        playerId: client.id,
        offeredSlot: packet.offeredSlot,
        offeredSnapshot: packet.offeredMonsterSnapshot,
        timestamp: Date.now()
      }
    });

    this.server.send(opponent, {
      type: PacketType.TradeOfferUpdate,
      tradeId: session.id,
      offeredSlot: packet.offeredSlot,
      offeredMonsterSnapshot: packet.offeredMonsterSnapshot,
      timestamp: Date.now()
    } as TradeOfferUpdatePacket);
  }

  private handleTradeConfirm(client: ClientState, packet: TradeConfirmPacket): void {
    const session = this.sessions.get(packet.tradeId) || this.getSessionByClient(client.id);
    if (!session) return;

    session.setConfirm(client.id, packet.confirmed);
    const opponent = session.getOpponent(client.id);

    this.emitEvent({
      type: 'confirm',
      data: {
        tradeId: session.id,
        playerId: client.id,
        confirmed: packet.confirmed,
        timestamp: Date.now()
      }
    });

    this.server.send(opponent, {
      type: PacketType.TradeConfirm,
      tradeId: session.id,
      confirmed: packet.confirmed,
      timestamp: Date.now()
    } as TradeConfirmPacket);

    if (session.isReadyForExecution()) {
      this.executeTrade(session);
    }
  }

  private executeTrade(session: TradeSession): void {
    const validation = TradeValidator.validateTradeExecution(session);
    if (!validation.valid) {
      this.failTrade(session, validation.reason || 'Trade validation failed.');
      return;
    }

    const p1 = session.p1;
    const p2 = session.p2;

    const pm = PokemonManager.getInstance();
    const pmP1Mon = pm.getParty(p1.id)[session.p1Slot];
    const pmP2Mon = pm.getParty(p2.id)[session.p2Slot];

    if (pmP1Mon && pmP2Mon) {
      pm.updateLocation(pmP1Mon.id, {
        type: PokemonLocationType.Party,
        ownerId: p2.id,
        slotIndex: session.p2Slot
      });
      pm.updateLocation(pmP2Mon.id, {
        type: PokemonLocationType.Party,
        ownerId: p1.id,
        slotIndex: session.p1Slot
      });
    }

    if (p1.playerData) {
      p1.playerData.party = pm.getParty(p1.id)
        .filter((p): p is PokemonInstance => p !== null)
        .map(p => pokemonInstanceToMonsterInstance(p)) as any;
      savePlayerData(p1.id, p1.playerData);
    }

    if (p2.playerData) {
      p2.playerData.party = pm.getParty(p2.id)
        .filter((p): p is PokemonInstance => p !== null)
        .map(p => pokemonInstanceToMonsterInstance(p)) as any;
      savePlayerData(p2.id, p2.playerData);
    }

    const m1 = p1.playerData?.party[session.p1Slot];
    const m2 = p2.playerData?.party[session.p2Slot];

    const m1Snapshot: MonsterSnapshot = {
      speciesId: m1?.speciesId ?? 0,
      level: m1?.level ?? 1,
      currentHp: m1?.currentHp ?? 10,
      maxHp: m1?.maxHp ?? 10,
      stats: m1?.stats ?? { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
      status: (m1?.status as any) ?? 0,
      nickname: m1?.nickname
    };

    const m2Snapshot: MonsterSnapshot = {
      speciesId: m2?.speciesId ?? 0,
      level: m2?.level ?? 1,
      currentHp: m2?.currentHp ?? 10,
      maxHp: m2?.maxHp ?? 10,
      stats: m2?.stats ?? { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
      status: (m2?.status as any) ?? 0,
      nickname: m2?.nickname
    };

    session.markCompleted();

    this.emitEvent({
      type: 'complete',
      data: {
        tradeId: session.id,
        p1Id: p1.id,
        p2Id: p2.id,
        success: true,
        p1ReceivedSnapshot: m2Snapshot,
        p2ReceivedSnapshot: m1Snapshot,
        timestamp: Date.now()
      }
    });

    this.server.send(p1, {
      type: PacketType.TradeComplete,
      tradeId: session.id,
      success: true,
      receivedMonster: m2Snapshot
    } as TradeCompletePacket);

    this.server.send(p2, {
      type: PacketType.TradeComplete,
      tradeId: session.id,
      success: true,
      receivedMonster: m1Snapshot
    } as TradeCompletePacket);

    this.cleanupSession(session.id);
  }

  private failTrade(session: TradeSession, reason: string): void {
    session.markCancelled();

    const failPacket: TradeCompletePacket = {
      type: PacketType.TradeComplete,
      tradeId: session.id,
      success: false,
      timestamp: Date.now()
    };

    this.server.send(session.p1, failPacket);
    this.server.send(session.p2, failPacket);

    this.emitEvent({
      type: 'complete',
      data: {
        tradeId: session.id,
        p1Id: session.p1.id,
        p2Id: session.p2.id,
        success: false,
        reason,
        timestamp: Date.now()
      }
    });

    this.cleanupSession(session.id);
  }

  public getSessionByClient(clientId: string): TradeSession | undefined {
    const tradeId = this.playerToSession.get(clientId);
    return tradeId ? this.sessions.get(tradeId) : undefined;
  }

  public handleClientDisconnect(clientId: string): void {
    // Clear pending requests
    const req = this.pendingRequests.get(clientId);
    if (req) {
      clearTimeout(req.timeout);
      this.pendingRequests.delete(clientId);
    }

    for (const [challengerId, challenge] of this.pendingRequests.entries()) {
      if (challenge.targetId === clientId) {
        clearTimeout(challenge.timeout);
        this.pendingRequests.delete(challengerId);
      }
    }

    // Abort active session
    const session = this.getSessionByClient(clientId);
    if (session) {
      const opponent = session.getOpponent(clientId);
      this.server.send(opponent, {
        type: PacketType.TradeComplete,
        tradeId: session.id,
        success: false,
        timestamp: Date.now()
      } as TradeCompletePacket);

      this.emitEvent({
        type: 'cancel',
        data: {
          tradeId: session.id,
          cancellerId: clientId,
          reason: 'Client disconnected',
          timestamp: Date.now()
        }
      });

      this.cleanupSession(session.id);
    }
  }

  private cleanupSession(tradeId: string): void {
    const session = this.sessions.get(tradeId);
    if (session) {
      this.playerToSession.delete(session.p1.id);
      this.playerToSession.delete(session.p2.id);
      this.sessions.delete(tradeId);
    }
  }
}
