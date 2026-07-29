/**
 * Move Data Types
 */

export interface MoveEffect {
  chance: number;
  effect: string;
}

export interface MoveFlags {
  makesContact?: boolean;
  protects?: boolean;
  mirrors?: boolean;
  snatches?: boolean;
  gravity?: boolean;
  defrosts?: boolean;
  reflectable?: boolean;
  blockable?: boolean;
  charge?: boolean;
  recharge?: boolean;
}

export interface MoveData {
  id: number;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power: number;
  accuracy: number; // 0-100 or -1 for never-miss
  pp: number;
  maxPp: number;
  priority: number;
  target: string;
  description: string;
  effects: MoveEffect[];
  flags: MoveFlags;
}
