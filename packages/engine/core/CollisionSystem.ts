import { BoundingBox, Entity, Vector2 } from './Entity.js';

export interface CollisionResult {
  collided: boolean;
  overlapX: number;
  overlapY: number;
  normal: Vector2;
}

export class CollisionSystem {
  /**
   * Check if two AABB bounding boxes intersect.
   */
  public static intersectsAABB(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  /**
   * Detailed AABB collision test with overlap and normal calculation.
   */
  public static checkAABB(a: BoundingBox, b: BoundingBox): CollisionResult {
    const dx = a.x + a.width / 2 - (b.x + b.width / 2);
    const dy = a.y + a.height / 2 - (b.y + b.height / 2);

    const halfW = (a.width + b.width) / 2;
    const halfH = (a.height + b.height) / 2;

    if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
      const overlapX = halfW - Math.abs(dx);
      const overlapY = halfH - Math.abs(dy);

      if (overlapX < overlapY) {
        return {
          collided: true,
          overlapX,
          overlapY: 0,
          normal: { x: dx > 0 ? 1 : -1, y: 0 },
        };
      } else {
        return {
          collided: true,
          overlapX: 0,
          overlapY,
          normal: { x: 0, y: dy > 0 ? 1 : -1 },
        };
      }
    }

    return { collided: false, overlapX: 0, overlapY: 0, normal: { x: 0, y: 0 } };
  }

  /**
   * Check collision between two entities.
   */
  public static checkEntityCollision(a: Entity, b: Entity): boolean {
    if (!a.active || !b.active) return false;
    return this.intersectsAABB(a.getBounds(), b.getBounds());
  }

  /**
   * Check collision against a grid tilemap using a custom solid check callback.
   */
  public static checkTileCollision(
    bounds: BoundingBox,
    tileSize: number,
    isTileSolid: (tileX: number, tileY: number) => boolean
  ): boolean {
    const minTileX = Math.floor(bounds.x / tileSize);
    const maxTileX = Math.floor((bounds.x + bounds.width - 0.001) / tileSize);
    const minTileY = Math.floor(bounds.y / tileSize);
    const maxTileY = Math.floor((bounds.y + bounds.height - 0.001) / tileSize);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        if (isTileSolid(tx, ty)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Resolves entity movement against tile collisions along separate axes.
   */
  public static moveAndSlide(
    bounds: BoundingBox,
    delta: Vector2,
    tileSize: number,
    isTileSolid: (tileX: number, tileY: number) => boolean
  ): Vector2 {
    const resolved: Vector2 = { x: bounds.x, y: bounds.y };

    // Move X
    resolved.x += delta.x;
    const testBoxX: BoundingBox = { ...bounds, x: resolved.x };
    if (this.checkTileCollision(testBoxX, tileSize, isTileSolid)) {
      if (delta.x > 0) {
        resolved.x = Math.floor((resolved.x + bounds.width) / tileSize) * tileSize - bounds.width - 0.001;
      } else if (delta.x < 0) {
        resolved.x = Math.floor(resolved.x / tileSize) * tileSize + tileSize + 0.001;
      }
    }

    // Move Y
    resolved.y += delta.y;
    const testBoxY: BoundingBox = { ...bounds, x: resolved.x, y: resolved.y };
    if (this.checkTileCollision(testBoxY, tileSize, isTileSolid)) {
      if (delta.y > 0) {
        resolved.y = Math.floor((resolved.y + bounds.height) / tileSize) * tileSize - bounds.height - 0.001;
      } else if (delta.y < 0) {
        resolved.y = Math.floor(resolved.y / tileSize) * tileSize + tileSize + 0.001;
      }
    }

    return resolved;
  }
}
