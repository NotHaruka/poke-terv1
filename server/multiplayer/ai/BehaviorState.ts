import { BehaviorContext } from './BehaviorContext.js';

export interface BehaviorState {
  enter(context: BehaviorContext): void;
  update(context: BehaviorContext, dt: number): void;
  exit(context: BehaviorContext): void;
}
