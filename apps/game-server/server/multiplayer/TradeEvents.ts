import { MonsterSnapshot } from '@game-core/pokemonData.js';

export interface TradeRequestEvent {
  senderId: string;
  senderName: string;
  targetId: string;
  timestamp: number;
}

export interface TradeResponseEvent {
  senderId: string;
  senderName: string;
  targetId: string;
  accepted: boolean;
  timestamp: number;
}

export interface TradeOfferUpdateEvent {
  tradeId: string;
  playerId: string;
  offeredSlot: number;
  offeredSnapshot?: MonsterSnapshot;
  timestamp: number;
}

export interface TradeConfirmEvent {
  tradeId: string;
  playerId: string;
  confirmed: boolean;
  timestamp: number;
}

export interface TradeCompleteEvent {
  tradeId: string;
  p1Id: string;
  p2Id: string;
  success: boolean;
  p1ReceivedSnapshot?: MonsterSnapshot;
  p2ReceivedSnapshot?: MonsterSnapshot;
  reason?: string;
  timestamp: number;
}

export interface TradeCancelEvent {
  tradeId: string;
  cancellerId: string;
  reason: string;
  timestamp: number;
}

export type TradeEvent =
  | { type: 'request'; data: TradeRequestEvent }
  | { type: 'response'; data: TradeResponseEvent }
  | { type: 'offer_update'; data: TradeOfferUpdateEvent }
  | { type: 'confirm'; data: TradeConfirmEvent }
  | { type: 'complete'; data: TradeCompleteEvent }
  | { type: 'cancel'; data: TradeCancelEvent };

export type TradeEventListener = (event: TradeEvent) => void;
