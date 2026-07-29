import type { TileCategory, TileDefinition } from '@shared/types.js';

export class TileRegistry {
  private static instance: TileRegistry;
  private tiles: Map<string, TileDefinition> = new Map();

  public static getInstance(): TileRegistry {
    if (!TileRegistry.instance) {
      TileRegistry.instance = new TileRegistry();
    }
    return TileRegistry.instance;
  }

  public register(tile: TileDefinition): void {
    // Fill compatibility aliases if omitted
    const processedTile: TileDefinition = {
      ...tile,
      atlas: tile.atlas ?? tile.atlasKey,
      metatileId: tile.metatileId ?? tile.sourceIndex,
      movementCost: tile.movementCost ?? 1.0,
      animated: tile.animated ?? false,
      encounterTable: tile.encounterTable ?? (tile.encounterType ? `${tile.encounterType}_wild` : undefined),
    };
    this.tiles.set(tile.id, processedTile);
  }

  public registerAll(tiles: TileDefinition[]): void {
    for (const tile of tiles) {
      this.register(tile);
    }
  }

  public get(id: string): TileDefinition | undefined {
    return this.tiles.get(id);
  }

  public getAll(): TileDefinition[] {
    return Array.from(this.tiles.values());
  }

  public getByCategory(category: TileCategory): TileDefinition[] {
    return this.getAll().filter(t => t.category === category);
  }

  public isWalkable(id: string): boolean {
    const tile = this.get(id);
    if (!tile) return false;
    return tile.walkable && !tile.blocksMovement;
  }

  public blocksMovement(id: string): boolean {
    const tile = this.get(id);
    if (!tile) return true;
    return tile.blocksMovement || !tile.walkable;
  }

  public getEncounterType(id: string): string | null {
    const tile = this.get(id);
    return tile?.encounterType ?? null;
  }

  public getInteractionType(id: string): string | null {
    const tile = this.get(id);
    return tile?.interactionType ?? null;
  }

  public getMovementCost(id: string): number {
    const tile = this.get(id);
    return tile?.movementCost ?? 1.0;
  }

  public isVerified(id: string): boolean {
    const tile = this.get(id);
    return tile?.verified ?? false;
  }

  public clear(): void {
    this.tiles.clear();
  }
}

export const tileRegistry = TileRegistry.getInstance();
