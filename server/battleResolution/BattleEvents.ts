import { MonsterInstance } from '../../shared/pokemonData.js';
import { BattleAction } from './BattleAction.js';

export enum BattleEventType {
  TurnStart = 'TurnStart',
  BeforeMove = 'BeforeMove',
  BeforeDamage = 'BeforeDamage',
  Damage = 'Damage',
  AfterDamage = 'AfterDamage',
  AfterMove = 'AfterMove',
  TurnEnd = 'TurnEnd',
  PokemonFainted = 'PokemonFainted',
  BattleEnded = 'BattleEnded',
  Switch = 'Switch',
  Message = 'Message',
  Status = 'Status',
  BallThrown = 'BallThrown',
  CaptureShake = 'CaptureShake',
  CaptureSuccess = 'CaptureSuccess',
  CaptureFailure = 'CaptureFailure',
  PokemonRegistered = 'PokemonRegistered',
  PartyUpdated = 'PartyUpdated',
  PCUpdated = 'PCUpdated'
}

export interface BattleEvent {
  type: BattleEventType;
  payload?: any;
}

export interface MessageEvent extends BattleEvent {
  type: BattleEventType.Message;
  payload: {
    text: string;
  };
}