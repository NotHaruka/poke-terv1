import { BattleParticipant } from './BattleParticipant.js';
import { BattleEvent } from './BattleEvents.js';

export enum BattlePhase {
  Init = 'Init',
  ActionSelection = 'ActionSelection',
  Execution = 'Execution',
  End = 'End'
}

export class BattleState {
  public id: string;
  public phase: BattlePhase;
  public turn: number;
  public participants: Map<string, BattleParticipant>;
  public events: BattleEvent[];
  
  // Environment factors
  public weather: string;
  public terrain: string;

  constructor(id: string) {
    this.id = id;
    this.phase = BattlePhase.Init;
    this.turn = 1;
    this.participants = new Map();
    this.events = [];
    this.weather = 'clear';
    this.terrain = 'normal';
  }
}