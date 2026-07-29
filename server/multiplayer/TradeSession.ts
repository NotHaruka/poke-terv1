import { ClientState } from './types.js';

export enum TradeSessionStage {
  Init = 'init',
  Offering = 'offering',
  Confirming = 'confirming',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export class TradeSession {
  public id: string;
  public p1: ClientState;
  public p2: ClientState;
  public p1Slot: number = -1;
  public p2Slot: number = -1;
  public p1Confirmed: boolean = false;
  public p2Confirmed: boolean = false;
  public p1DoubleConfirmed: boolean = false;
  public p2DoubleConfirmed: boolean = false;
  public stage: TradeSessionStage = TradeSessionStage.Init;
  public createdTime: number;
  public updatedTime: number;

  constructor(id: string, p1: ClientState, p2: ClientState) {
    this.id = id;
    this.p1 = p1;
    this.p2 = p2;
    this.createdTime = Date.now();
    this.updatedTime = this.createdTime;
    this.stage = TradeSessionStage.Offering;
  }

  public isParticipant(clientId: string): boolean {
    return this.p1.id === clientId || this.p2.id === clientId;
  }

  public getOpponent(clientId: string): ClientState {
    return this.p1.id === clientId ? this.p2 : this.p1;
  }

  public isP1(clientId: string): boolean {
    return this.p1.id === clientId;
  }

  public updateOffer(clientId: string, slot: number): void {
    if (this.isP1(clientId)) {
      this.p1Slot = slot;
    } else {
      this.p2Slot = slot;
    }
    // Any change in offered slot resets confirmation and double-confirmation
    this.resetConfirmations();
    this.stage = TradeSessionStage.Offering;
    this.updatedTime = Date.now();
  }

  public setConfirm(clientId: string, confirmed: boolean): void {
    if (this.isP1(clientId)) {
      this.p1Confirmed = confirmed;
    } else {
      this.p2Confirmed = confirmed;
    }
    this.updatedTime = Date.now();

    if (this.p1Confirmed && this.p2Confirmed) {
      this.stage = TradeSessionStage.Confirming;
    } else {
      this.stage = TradeSessionStage.Offering;
      this.p1DoubleConfirmed = false;
      this.p2DoubleConfirmed = false;
    }
  }

  public setDoubleConfirm(clientId: string, doubleConfirmed: boolean): void {
    if (this.isP1(clientId)) {
      this.p1DoubleConfirmed = doubleConfirmed;
    } else {
      this.p2DoubleConfirmed = doubleConfirmed;
    }
    this.updatedTime = Date.now();
  }

  public resetConfirmations(): void {
    this.p1Confirmed = false;
    this.p2Confirmed = false;
    this.p1DoubleConfirmed = false;
    this.p2DoubleConfirmed = false;
  }

  public isReadyForExecution(): boolean {
    return (
      this.p1Slot >= 0 &&
      this.p2Slot >= 0 &&
      this.p1Confirmed &&
      this.p2Confirmed &&
      this.stage !== TradeSessionStage.Completed &&
      this.stage !== TradeSessionStage.Cancelled
    );
  }

  public markCompleted(): void {
    this.stage = TradeSessionStage.Completed;
    this.updatedTime = Date.now();
  }

  public markCancelled(): void {
    this.stage = TradeSessionStage.Cancelled;
    this.updatedTime = Date.now();
  }
}
