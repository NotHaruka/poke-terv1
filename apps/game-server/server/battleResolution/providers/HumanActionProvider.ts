import { ActionProvider } from './ActionProvider.js';
import { BattleAction } from '../BattleAction.js';
import { BattleContext } from '../BattleContext.js';

export class HumanActionProvider implements ActionProvider {
  public participantId: string;
  private pendingResolve: ((action: BattleAction) => void) | null = null;
  private bufferedAction: BattleAction | null = null;

  constructor(participantId: string) {
    this.participantId = participantId;
  }

  public getAction(context: BattleContext): Promise<BattleAction> {
    if (this.bufferedAction) {
      const action = this.bufferedAction;
      this.bufferedAction = null;
      return Promise.resolve(action);
    }

    return new Promise<BattleAction>((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  public submitAction(action: BattleAction): void {
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(action);
    } else {
      this.bufferedAction = action;
    }
  }

  public cancel(): void {
    this.pendingResolve = null;
    this.bufferedAction = null;
  }
}
