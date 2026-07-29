import { Camera } from '../core/Camera.js';
import { NPCPlacement } from '@shared/types.js';

export class NPCRenderer {
  /**
   * Draw the NPC entity onto the canvas with camera translation and zoom.
   */
  public draw(ctx: CanvasRenderingContext2D, npc: any, camera: Camera): void {
    const tileX = typeof npc.tileX === 'number' ? npc.tileX : npc.x;
    const tileY = typeof npc.tileY === 'number' ? npc.tileY : npc.y;
    const worldX = tileX * 16;
    const worldY = tileY * 16;
    const screenPos = camera.worldToScreen({ x: worldX, y: worldY });
    const z = camera.zoom || 2;

    ctx.save();
    ctx.translate(Math.round(screenPos.x), Math.round(screenPos.y));
    ctx.scale(z, z);

    // 1. Shadow underneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(8, 15, 6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stylize by NPC Type
    let bodyColor = '#1e3a8a'; // Blue shirt for general villager
    let hairColor = '#f59e0b'; // Blonde hair
    let skinColor = '#fde047'; // Skin tone

    if (npc.spriteType === 'professor') {
      bodyColor = '#be123c'; // Burgundy vest under white lab coat
      hairColor = '#9ca3af'; // Grey professor hair
    } else if (npc.spriteType === 'healer') {
      bodyColor = '#db2777'; // Pink dress
      hairColor = '#f472b6'; // Pink nurse hair
    }

    // Base body / outfit
    ctx.fillStyle = bodyColor;
    ctx.fillRect(3, 5, 10, 8);

    // Head / Face
    ctx.fillStyle = skinColor;
    ctx.fillRect(4, 1, 8, 5);

    // Hair styling
    ctx.fillStyle = hairColor;
    ctx.fillRect(4, 0, 8, 2); // Hair top
    ctx.fillRect(3, 1, 1, 3); // Left hair strand
    ctx.fillRect(12, 1, 1, 3); // Right hair strand

    // Apron / Lab coat overlay
    if (npc.spriteType === 'healer') {
      // White apron with small medical cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 6, 6, 7);
      ctx.fillStyle = '#db2777';
      ctx.fillRect(7, 8, 2, 2);
    } else if (npc.spriteType === 'professor') {
      // White open lab coat sides
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 5, 2, 8);
      ctx.fillRect(11, 5, 2, 8);
    }

    // Static standing legs
    ctx.fillStyle = '#374151'; // Charcoal pants
    ctx.fillRect(4, 13, 3, 3);
    ctx.fillRect(9, 13, 3, 3);

    // 3. Eyes / Facing Direction details
    ctx.fillStyle = '#000000';
    switch (npc.facing) {
      case 'down':
        ctx.fillRect(5, 3, 1.5, 1.5);
        ctx.fillRect(9, 3, 1.5, 1.5);
        break;
      case 'up':
        // Draw hair covering the face back
        ctx.fillStyle = hairColor;
        ctx.fillRect(4, 1, 8, 4);
        break;
      case 'left':
        ctx.fillRect(4, 3, 1.5, 1.5);
        break;
      case 'right':
        ctx.fillRect(10, 3, 1.5, 1.5);
        break;
    }

    // 4. Thin black pixel border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(2.5, 0.5, 11, 15);

    ctx.restore();
  }
}
