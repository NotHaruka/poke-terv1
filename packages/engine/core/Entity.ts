export interface Vector2 {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
  * Generic Entity in the engine world.
  * Contains no game-specific domain logic (no Pokemon, Trainer, Move data).
  */
export interface Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  active: boolean;
  visible: boolean;
  tags: string[];
  layer: number;

  update?(dt: number): void;
  destroy?(): void;
  getBounds(): BoundingBox;
}

export interface RenderableSprite {
  atlas: string;
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  scale?: number;
  opacity?: number;
  tint?: string;
}

/**
  * SpriteEntity represents an entity that can be rendered using a sprite abstraction.
  */
export interface SpriteEntity extends Entity {
  sprite?: RenderableSprite;
  direction?: 'up' | 'down' | 'left' | 'right' | string;
}

export abstract class BaseEntity implements Entity {
  public id: string;
  public position: Vector2;
  public velocity: Vector2;
  public width: number;
  public height: number;
  public active: boolean = true;
  public visible: boolean = true;
  public tags: string[] = [];
  public layer: number = 0;

  constructor(id: string, x: number = 0, y: number = 0, width: number = 16, height: number = 16) {
    this.id = id;
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.width = width;
    this.height = height;
  }

  public update(dt: number): void {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
  }

  public getBounds(): BoundingBox {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
    };
  }

  public addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  public hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  public destroy(): void {
    this.active = false;
  }
}
