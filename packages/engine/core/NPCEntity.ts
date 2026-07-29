import { BaseEntity } from './Entity.js';

export type NPCSpriteType = 'professor' | 'healer' | 'villager';
export type NPCDirection = 'up' | 'down' | 'left' | 'right';

export interface NPCEntityOptions {
  id: string;
  name: string;
  x: number; // in tile coordinates
  y: number; // in tile coordinates
  facing?: NPCDirection;
  spriteType?: NPCSpriteType;
  dialogue?: string[];
  collision?: boolean;
  onInteract?: (npc: NPCEntity) => void;
}

export class NPCEntity extends BaseEntity {
  public name: string;
  public facing: NPCDirection;
  public spriteType: NPCSpriteType;
  public dialogue: string[];
  public collision: boolean;
  public onInteract?: (npc: NPCEntity) => void;

  constructor(opts: NPCEntityOptions) {
    super(opts.id, opts.x * 16, opts.y * 16, 16, 16);
    this.name = opts.name;
    this.facing = opts.facing ?? 'down';
    this.spriteType = opts.spriteType ?? 'villager';
    this.dialogue = opts.dialogue ?? [];
    this.collision = opts.collision ?? true;
    this.onInteract = opts.onInteract;
    this.addTag('npc');
  }

  // Helper getters for tile coordinates
  public get tileX(): number {
    return Math.floor(this.position.x / 16);
  }

  public set tileX(val: number) {
    this.position.x = val * 16;
  }

  public get getTileY(): number {
    return Math.floor(this.position.y / 16);
  }

  public get tileY(): number {
    return Math.floor(this.position.y / 16);
  }

  public set tileY(val: number) {
    this.position.y = val * 16;
  }

  /**
   * Face the direction opposite to the player's facing direction.
   */
  public facePlayer(playerFacing: NPCDirection): void {
    switch (playerFacing) {
      case 'up':
        this.facing = 'down';
        break;
      case 'down':
        this.facing = 'up';
        break;
      case 'left':
        this.facing = 'right';
        break;
      case 'right':
        this.facing = 'left';
        break;
    }
  }

  /**
   * Trigger the interaction callback.
   */
  public interact(): void {
    if (this.onInteract) {
      this.onInteract(this);
    }
  }
}
