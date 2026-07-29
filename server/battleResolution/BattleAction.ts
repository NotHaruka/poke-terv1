export enum BattleActionType {
  Move = 'Move',
  Switch = 'Switch',
  Item = 'Item',
  Run = 'Run'
}

export interface BaseBattleAction {
  type: BattleActionType;
  participantId: string;
  priority: number;
}

export interface MoveAction extends BaseBattleAction {
  type: BattleActionType.Move;
  moveId: number;
  targetId: string;
}

export interface SwitchAction extends BaseBattleAction {
  type: BattleActionType.Switch;
  nextPokemonId: string;
}

export interface ItemAction extends BaseBattleAction {
  type: BattleActionType.Item;
  itemId: number;
  targetId: string;
}

export interface RunAction extends BaseBattleAction {
  type: BattleActionType.Run;
}

export type BattleAction = MoveAction | SwitchAction | ItemAction | RunAction;
