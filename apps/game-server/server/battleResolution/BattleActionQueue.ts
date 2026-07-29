import { BattleAction, BattleActionType } from './BattleAction';
import { BattleContext } from './BattleContext';

export class BattleActionQueue {
  private actions: BattleAction[] = [];

  public queueAction(action: BattleAction) {
    this.actions.push(action);
  }

  public getActionForParticipant(participantId: string): BattleAction | undefined {
    return this.actions.find(a => a.participantId === participantId);
  }

  public sortAndResolve(context: BattleContext): BattleAction[] {
    const sorted = [...this.actions].sort((a, b) => {
      // Priority 1: Action type priority
      const getActionTypePriority = (type: BattleActionType) => {
        switch (type) {
          case BattleActionType.Run: return 4;
          case BattleActionType.Switch: return 3;
          case BattleActionType.Item: return 2;
          case BattleActionType.Move: return 1;
          default: return 0;
        }
      };

      const pA = getActionTypePriority(a.type);
      const pB = getActionTypePriority(b.type);

      if (pA !== pB) return pB - pA; // Higher priority action types first

      // Priority 2: Move priority
      if (a.priority !== b.priority) return b.priority - a.priority;

      // Priority 3: Effective Speed
      const speedA = context.getEffectiveSpeed(a.participantId);
      const speedB = context.getEffectiveSpeed(b.participantId);
      
      if (speedA !== speedB) {
        return speedB - speedA;
      }
      
      // Speed tie resolution
      return Math.random() > 0.5 ? -1 : 1;
    });

    return sorted;
  }

  public clear() {
    this.actions = [];
  }
  
  public hasAllActions(expectedCount: number): boolean {
    return this.actions.length >= expectedCount;
  }
}
