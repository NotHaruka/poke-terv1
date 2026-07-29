import type { Chunk, TileDefinition, MapData } from '@shared/types.js';
import { generateChunk } from '@world/generator/chunkGenerator.js';
import { getTile, TILE_LIBRARY } from '@world/tiles/tileLibrary.js';

/**
 * client/rendering/worldCanvas.ts
 *
 * Genuinely new — the old renderer stack (client/src/engine/renderer/) was rebuilt from
 * scratch rather than ported, since that's where most of the bugs in this whole project lived
 * (duplicate hardcoded atlas tables that drifted apart, ad-hoc canvas fills, a manifest system
 * half its categories never had). This is a much simpler design on purpose: one atlas cache,
 * one draw loop, tile placement comes entirely from worldgen's Chunk output — there's no
 * separate "theme resolver" table that can drift out of sync with the tile library, because
 * there's only one source of truth (worldgen/tiles/tileLibrary.ts).
 */

const TILE_PX = 16;
const atlasCache = new Map<string, HTMLImageElement>();

function normalizeAtlasPath(path: string): string {
  if (!path) return '';
  return path.replace(/^\/+/, '').replace(/^(apps\/game-client\/public\/|client\/public\/)/, '');
}

function loadAtlas(path: string): HTMLImageElement {
  const norm = normalizeAtlasPath(path);
  const cached = atlasCache.get(norm);
  if (cached) return cached;
  const img = new Image();
  img.src = '/' + norm;
  atlasCache.set(norm, img);
  return img;
}

// Warm the cache with every atlas referenced by the tile library so the first frame doesn't
// pop in tile-by-tile as images load.
export function preloadAtlases(): Promise<void[]> {
  const unique = Array.from(new Set(TILE_LIBRARY.map((t: TileDefinition) => t.atlas)));
  return Promise.all(
    unique.map(
      atlas =>
        new Promise<void>(resolve => {
          const img = loadAtlas(atlas);
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // don't block rendering on one bad atlas
        })
    )
  );
}

export interface WorldCanvasOptions {
  canvas: HTMLCanvasElement;
  seed: number;
  mapId?: string;
  chunkRadius?: number; // how many chunks in each direction around the camera to keep rendered
  customMap?: MapData;
}

export class WorldCanvas {
  private ctx: CanvasRenderingContext2D;
  private seed: number;
  private mapId: string;
  private chunkRadius: number;
  private chunkCache = new Map<string, Chunk>();
  public customMap?: MapData;

  constructor(opts: WorldCanvasOptions) {
    const ctx = opts.canvas.getContext('2d');
    if (!ctx) throw new Error('WorldCanvas: 2D context unavailable');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false; // pixel art stays crisp
    this.seed = opts.seed;
    this.mapId = opts.mapId ?? 'city';
    this.chunkRadius = opts.chunkRadius ?? 2;
    this.customMap = opts.customMap;
  }

  private getChunk(cx: number, cy: number): Chunk {
    const key = `${cx},${cy}`;
    let chunk = this.chunkCache.get(key);
    if (!chunk) {
      chunk = generateChunk(cx, cy, this.seed, this.mapId);
      this.chunkCache.set(key, chunk);
    }
    return chunk;
  }

  /** Render the world around a camera position, given in world pixel coordinates and camera zoom. */
  render(cameraX: number, cameraY: number, zoom: number = 2): void {
    const canvas = this.ctx.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.customMap) {
      this.renderMap(cameraX, cameraY, zoom);
      return;
    }

    const centerCx = Math.floor(cameraX / TILE_PX / this.chunkSize());
    const centerCy = Math.floor(cameraY / TILE_PX / this.chunkSize());

    for (let dy = -this.chunkRadius; dy <= this.chunkRadius; dy++) {
      for (let dx = -this.chunkRadius; dx <= this.chunkRadius; dx++) {
        this.renderChunk(centerCx + dx, centerCy + dy, cameraX, cameraY, zoom);
      }
    }
  }

  private renderMap(cameraX: number, cameraY: number, zoom: number): void {
    if (!this.customMap) return;
    const canvas = this.ctx.canvas;
    const originX = (-cameraX) * zoom + canvas.width / 2;
    const originY = (-cameraY) * zoom + canvas.height / 2;

    const map = this.customMap;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        // Base layer
        const tileId = map.layers.base[y]?.[x];
        if (tileId) {
          const def = getTile(tileId);
          if (def) {
            this.drawTile(def, originX + x * TILE_PX * zoom, originY + y * TILE_PX * zoom, zoom);
          }
        }

        // Optional Overlay layer
        const overlayId = map.layers.overlay?.[y]?.[x];
        if (overlayId) {
          const def = getTile(overlayId);
          if (def) {
            this.drawTile(def, originX + x * TILE_PX * zoom, originY + y * TILE_PX * zoom, zoom);
          }
        }
      }
    }
  }

  private chunkSize(): number {
    // All chunks share the same size; peek at one to avoid hardcoding the constant here too.
    return this.getChunk(0, 0).size;
  }

  private renderChunk(cx: number, cy: number, cameraX: number, cameraY: number, zoom: number): void {
    const chunk = this.getChunk(cx, cy);
    const canvas = this.ctx.canvas;
    const originX = (cx * chunk.size * TILE_PX - cameraX) * zoom + canvas.width / 2;
    const originY = (cy * chunk.size * TILE_PX - cameraY) * zoom + canvas.height / 2;

    for (let y = 0; y < chunk.tiles.length; y++) {
      for (let x = 0; x < chunk.tiles[y].length; x++) {
        const placed = chunk.tiles[y][x];
        const def = getTile(placed.tileId);
        if (!def) continue;
        this.drawTile(def, originX + x * TILE_PX * zoom, originY + y * TILE_PX * zoom, zoom);
      }
    }
  }

  private getCategoryFallbackColor(category?: string): string {
    switch (category) {
      case 'grass': return '#4ade80';
      case 'tall_grass': return '#15803d';
      case 'water': return '#3b82f6';
      case 'path': return '#d97706';
      case 'tree': return '#166534';
      case 'mountain': return '#78350f';
      case 'building': return '#a8a29e';
      case 'door': return '#f59e0b';
      case 'sign': return '#854d0e';
      case 'sand': return '#fde047';
      case 'snow': return '#e0f2fe';
      default: return '#22c55e';
    }
  }

  private drawTile(def: TileDefinition, px: number, py: number, zoom: number): void {
    const rx = Math.round(px);
    const ry = Math.round(py);
    const tileSize = Math.ceil(TILE_PX * zoom);

    const img = loadAtlas(def.atlas);
    if (!img.complete || img.naturalWidth === 0) {
      // Fallback colored tile while image is loading
      this.ctx.fillStyle = this.getCategoryFallbackColor(def.category);
      this.ctx.fillRect(rx, ry, tileSize, tileSize);
      return;
    }

    const cols = Math.floor(img.naturalWidth / TILE_PX) || 16;
    const metatileId = def.sourceIndex ?? def.metatileId ?? 0;
    const sx = (metatileId % cols) * TILE_PX;
    const sy = Math.floor(metatileId / cols) * TILE_PX;

    this.ctx.drawImage(img, sx, sy, TILE_PX, TILE_PX, rx, ry, tileSize, tileSize);
  }

  /** Invalidate cached chunks, e.g. after changing seed/mapId. */
  reset(seed?: number, mapId?: string): void {
    if (seed !== undefined) this.seed = seed;
    if (mapId !== undefined) this.mapId = mapId;
    this.chunkCache.clear();
  }
}
