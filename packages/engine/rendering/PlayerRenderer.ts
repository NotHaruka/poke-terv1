import { Camera } from '../core/Camera.js';
import { PlayerEntity } from '../core/PlayerEntity.js';

export interface PlayerRendererOptions {
  spriteAtlasUrl?: string;
}

export class PlayerRenderer {
  private spriteImage: HTMLImageElement | null = null;
  private isLoaded: boolean = false;

  constructor(opts: PlayerRendererOptions = {}) {
    if (opts.spriteAtlasUrl) {
      this.spriteImage = new Image();
      this.spriteImage.src = opts.spriteAtlasUrl;
      this.spriteImage.onload = () => {
        this.isLoaded = true;
      };
    }
  }

  /**
   * Draw the player entity onto the canvas context with camera offset.
   * Uses dev placeholder graphic if sprite atlas is not loaded.
   */
  public draw(ctx: CanvasRenderingContext2D, player: PlayerEntity, camera: Camera): void {
    const screenPos = camera.worldToScreen(player.position);
    const z = camera.zoom || 2;

    ctx.save();
    ctx.translate(Math.round(screenPos.x), Math.round(screenPos.y));
    ctx.scale(z, z);

    // 1. Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(8, 15, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bobbing offset when walking
    const bob = player.isMoving ? Math.sin(player.walkAnimTimer * Math.PI) * 1 : 0;

    // 2. Character Body (Dev Placeholder Sprite)
    // Shirt / Body
    ctx.fillStyle = '#dc2626'; // Red shirt (Protagonist)
    ctx.fillRect(3, 5 - bob, 10, 8);

    // Head / Face
    ctx.fillStyle = '#fde047'; // Hair / Skin cap
    ctx.fillRect(4, 1 - bob, 8, 5);

    // Pants / Legs
    ctx.fillStyle = '#2563eb'; // Blue jeans
    if (player.isMoving) {
      if (player.walkFrame % 2 === 0) {
        ctx.fillRect(3, 13 - bob, 4, 3);
        ctx.fillRect(9, 12 - bob, 4, 2);
      } else {
        ctx.fillRect(3, 12 - bob, 4, 2);
        ctx.fillRect(9, 13 - bob, 4, 3);
      }
    } else {
      ctx.fillRect(4, 13, 3, 3);
      ctx.fillRect(9, 13, 3, 3);
    }

    // 3. Facing Direction Indicator / Visor
    ctx.fillStyle = '#ffffff';
    switch (player.facingDirection) {
      case 'down':
        ctx.fillRect(5, 3 - bob, 2, 2);
        ctx.fillRect(9, 3 - bob, 2, 2);
        break;
      case 'up':
        // Cap back / hat brim
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, 1 - bob, 8, 2);
        break;
      case 'left':
        ctx.fillRect(4, 3 - bob, 2, 2);
        break;
      case 'right':
        ctx.fillRect(10, 3 - bob, 2, 2);
        break;
    }

    // Outer outline for high visibility against all terrain
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(2.5, 0.5 - bob, 11, 15);

    ctx.restore();
  }
}
