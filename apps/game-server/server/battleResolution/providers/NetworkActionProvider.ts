import { ActionProvider } from './ActionProvider.js';
import { BattleAction, BattleActionType, MoveAction } from '../BattleAction.js';
import { BattleContext } from '../BattleContext.js';

export class NetworkActionProvider implements ActionProvider {
  public participantId: string;
  private pendingResolve: ((action: BattleAction) => void) | null = null;
  private bufferedAction: BattleAction | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;

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

      // 30-second turn timeout safety
      this.timeoutTimer = setTimeout(() => {
        if (this.pendingResolve) {
          const resolveFn = this.pendingResolve;
          this.pendingResolve = null;
          this.timeoutTimer = null;

          // Auto-select first move as fallback on timeout
          const participant = context.getParticipant(this.participantId);
          const activeMon = participant ? participant.party[participant.activePokemonIndex] : null;
          let targetId = '';
          for (const [id] of context.state.participants.entries()) {
            if (id !== this.participantId) {
              targetId = id;
              break;
            }
          }

          const fallbackMove: MoveAction = {
            type: BattleActionType.Move,
            participantId: this.participantId,
            priority: 0,
            moveId: (activeMon && activeMon.moves && activeMon.moves[0]) || 1,
            targetId
          };
          resolveFn(fallbackMove);
        }
      }, 30000);
    });
  }

  public submitAction(action: BattleAction): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(action);
    } else {
      this.bufferedAction = action;
    }
  }

  public cancel(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    this.pendingResolve = null;
    this.bufferedAction = null;
  }
}
