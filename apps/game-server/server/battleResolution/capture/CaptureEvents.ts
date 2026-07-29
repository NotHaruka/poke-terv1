import { BattleEventType } from '../BattleEvents.js';

export const CaptureEventType = {
  BallThrown: BattleEventType.BallThrown,
  CaptureShake: BattleEventType.CaptureShake,
  CaptureSuccess: BattleEventType.CaptureSuccess,
  CaptureFailure: BattleEventType.CaptureFailure,
  PokemonRegistered: BattleEventType.PokemonRegistered,
  PartyUpdated: BattleEventType.PartyUpdated,
  PCUpdated: BattleEventType.PCUpdated,
  BattleEnded: BattleEventType.BattleEnded
};

export interface CaptureEvent {
  type: BattleEventType;
  payload?: any;
}

export interface BallThrownEvent extends CaptureEvent {
  type: BattleEventType.BallThrown;
  payload: {
    participantId: string;
    targetId: string;
    itemId: number;
  };
}

export interface CaptureShakeEvent extends CaptureEvent {
  type: BattleEventType.CaptureShake;
  payload: {
    shakeCount: number;
  };
}

export interface CaptureSuccessEvent extends CaptureEvent {
  type: BattleEventType.CaptureSuccess;
  payload: {
    pokemonId: string;
    speciesId: number;
  };
}

export interface CaptureFailureEvent extends CaptureEvent {
  type: BattleEventType.CaptureFailure;
  payload: {
    reason: string; // e.g., "broke_free", "blocked"
    escaped: boolean;
  };
}

export interface PokemonRegisteredEvent extends CaptureEvent {
  type: BattleEventType.PokemonRegistered;
  payload: {
    pokemonId: string;
    ownerId: string;
  };
}

export interface PartyUpdatedEvent extends CaptureEvent {
  type: BattleEventType.PartyUpdated;
  payload: {
    pokemonId: string;
    slotIndex: number;
  };
}

export interface PCUpdatedEvent extends CaptureEvent {
  type: BattleEventType.PCUpdated;
  payload: {
    pokemonId: string;
    boxIndex: number;
    slotIndex: number;
  };
}
