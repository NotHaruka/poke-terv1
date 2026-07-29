import { Camera } from '../core/Camera.js';
import { SpriteEntity, RenderableSprite, Vector2 } from '../core/Entity.js';

export class SpriteRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  public loadImage(src: string): HTMLImageElement {
    const cleanSrc = '/' + src.replace(/^\/+/, '');
    let img = this.imageCache.get(cleanSrc);
    if (!img) {
      img = new Image();
      img.src = cleanSrc;
      this.imageCache.set(cleanSrc, img);
    }
    return img;
  }

  /**
   * Draw a raw renderable sprite at a world position using camera offsets.
   */
  public drawSprite(
    sprite: RenderableSprite,
    worldPos: Vector2,
    camera?: Camera
  ): void {
    const img = this.loadImage(sprite.atlas);
    if (!img.complete || img.naturalWidth === 0) return;

    let screenPos = worldPos;
    if (camera) {
      screenPos = camera.worldToScreen(worldPos);
    }

    const scale = sprite.scale ?? 1;
    const drawW = sprite.frameWidth * scale;
    const drawH = sprite.frameHeight * scale;

    this.ctx.save();
    if (sprite.opacity !== undefined) {
      this.ctx.globalAlpha = sprite.opacity;
    }

    this.ctx.drawImage(
      img,
      sprite.frameX,
      sprite.frameY,
      sprite.frameWidth,
      sprite.frameHeight,
      Math.round(screenPos.x - drawW / 2),
      Math.round(screenPos.y - drawH / 2),
      drawW,
      drawH
    );

    this.ctx.restore();
  }

  /**
   * Draw a SpriteEntity onto the canvas.
   */
  public drawEntity(entity: SpriteEntity, camera?: Camera): void {
    if (!entity.visible || !entity.sprite) return;
    this.drawSprite(entity.sprite, entity.position, camera);
  }

  /**
   * Batch draw a list of entities sorted by layer and Y-position.
   */
  public drawEntities(entities: SpriteEntity[], camera?: Camera): void {
    const visibleEntities = entities.filter(e => e.visible && e.sprite);
    
    // Sort by layer ascending, then by Y position for depth sorting
    visibleEntities.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.position.y - b.position.y;
    });

    for (const entity of visibleEntities) {
      this.drawEntity(entity, camera);
    }
  }
}
