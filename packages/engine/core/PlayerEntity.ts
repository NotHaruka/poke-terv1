import { BaseEntity, Vector2, BoundingBox } from './Entity.js';
import { CollisionSystem } from './CollisionSystem.js';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerOptions {
  id?: string;
  x?: number;
  y?: number;
  speed?: number;
}

export class PlayerEntity extends BaseEntity {
  public facingDirection: Direction = 'down';
  public movementSpeed: number = 96; // 96 px/s = 6 tiles/s
  public isMoving: boolean = false;
  public isInputBlocked: boolean = false;
  public walkAnimTimer: number = 0;
  public walkFrame: number = 0;

  public collisionWidth: number = 14;
  public collisionHeight: number = 14;

  constructor(opts: PlayerOptions = {}) {
    super(opts.id || 'player', opts.x ?? 0, opts.y ?? 0, 16, 16);
    if (opts.speed) this.movementSpeed = opts.speed;
  }

  public get worldPosition(): Vector2 {
    return { ...this.position };
  }

  public get tilePosition(): { x: number; y: number } {
    return {
      x: Math.floor((this.position.x + this.width / 2) / 16),
      y: Math.floor((this.position.y + this.height / 2) / 16),
    };
  }

  public getCollisionBounds(): BoundingBox {
    return {
      x: this.position.x + (this.width - this.collisionWidth) / 2,
      y: this.position.y + (this.height - this.collisionHeight) / 2,
      width: this.collisionWidth,
      height: this.collisionHeight,
    };
  }

  public updatePlayer(
    dt: number,
    inputDir: Vector2,
    isTileSolid: (tileX: number, tileY: number) => boolean
  ): void {
    if (this.isInputBlocked) {
      this.isMoving = false;
      this.velocity = { x: 0, y: 0 };
      return;
    }

    const { x: moveX, y: moveY } = inputDir;

    // Set facing direction
    if (moveX < 0) this.facingDirection = 'left';
    else if (moveX > 0) this.facingDirection = 'right';
    else if (moveY < 0) this.facingDirection = 'up';
    else if (moveY > 0) this.facingDirection = 'down';

    if (moveX !== 0 || moveY !== 0) {
      this.isMoving = true;
      this.walkAnimTimer += dt * 10;
      this.walkFrame = Math.floor(this.walkAnimTimer) % 4;

      const deltaX = moveX * this.movementSpeed * dt;
      const deltaY = moveY * this.movementSpeed * dt;

      const bounds = this.getCollisionBounds();
      const resolved = CollisionSystem.moveAndSlide(
        bounds,
        { x: deltaX, y: deltaY },
        16, // Tile size
        isTileSolid
      );

      // Reposition entity from bounds
      this.position.x = resolved.x - (this.width - this.collisionWidth) / 2;
      this.position.y = resolved.y - (this.height - this.collisionHeight) / 2;
      this.velocity = { x: moveX * this.movementSpeed, y: moveY * this.movementSpeed };
    } else {
      this.isMoving = false;
      this.walkAnimTimer = 0;
      this.walkFrame = 0;
      this.velocity = { x: 0, y: 0 };
    }
  }

  public getInteractionTile(): { x: number; y: number } {
    const tile = this.tilePosition;
    switch (this.facingDirection) {
      case 'up': return { x: tile.x, y: tile.y - 1 };
      case 'down': return { x: tile.x, y: tile.y + 1 };
      case 'left': return { x: tile.x - 1, y: tile.y };
      case 'right': return { x: tile.x + 1, y: tile.y };
    }
  }
}
