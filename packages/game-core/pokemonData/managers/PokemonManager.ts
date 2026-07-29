import { PokemonInstance, Vec2 } from '../models/PokemonInstance.js';
import { WildPokemon } from '../world/WildPokemon.js';
import { pokemonRegistry } from '../PokemonRegistry.js';

export enum PokemonLocationType {
  Wild = 'wild',
  Party = 'party',
  PC = 'pc',
  NPC = 'npc'
}

export interface PokemonLocation {
  type: PokemonLocationType;
  ownerId?: string; // e.g. Player ID or NPC ID. Null/undefined if wild.
  entityId?: string; // e.g. WildPokemon entityId
  boxIndex?: number; // For PC
  slotIndex?: number; // For PC or Party
}

export interface SerializedPokemonManager {
  instances: PokemonInstance[];
  locations: Record<string, PokemonLocation>;
  wildPokemon: WildPokemon[];
}

export class PokemonManager {
  private static instance: PokemonManager | null = null;

  // Primary Storage
  private readonly instances = new Map<string, PokemonInstance>();
  private readonly locations = new Map<string, PokemonLocation>();
  private readonly wildPokemon = new Map<string, WildPokemon>(); // entityId -> WildPokemon

  // Indices for O(1) lookups
  private readonly ownerIndex = new Map<string, Set<string>>(); // ownerId -> Set of PokemonInstance IDs
  private readonly entityIndex = new Map<string, string>(); // entityId -> PokemonInstance ID
  private readonly partyIndex = new Map<string, (string | null)[]>(); // ownerId -> Array of PokemonInstance IDs (up to 6)
  private readonly pcIndex = new Map<string, Map<number, Map<number, string>>>(); // ownerId -> boxIndex -> slotIndex -> PokemonInstance ID

  private constructor() {}

  public static getInstance(): PokemonManager {
    if (!PokemonManager.instance) {
      PokemonManager.instance = new PokemonManager();
    }
    return PokemonManager.instance;
  }

  /**
   * Resets the manager state (useful for testing or full reloads)
   */
  public reset(): void {
    this.instances.clear();
    this.locations.clear();
    this.wildPokemon.clear();
    this.ownerIndex.clear();
    this.entityIndex.clear();
    this.partyIndex.clear();
    this.pcIndex.clear();
  }

  /**
   * Registers a new PokemonInstance into the manager
   */
  public registerPokemon(instance: PokemonInstance, location: PokemonLocation): void {
    if (this.instances.has(instance.id)) {
      throw new Error(`Pokemon ID ${instance.id} is already registered.`);
    }
    
    // Validate species using registry
    const species = pokemonRegistry.getSpecies(instance.speciesId);
    if (!species) {
      throw new Error(`Invalid species ID ${instance.speciesId} for Pokemon ${instance.id}`);
    }

    // Validate location before adding instance to prevent corrupt state on validation failure
    this.validateLocation(instance.id, location);

    this.instances.set(instance.id, instance);
    this.updateLocation(instance.id, location);
  }

  /**
   * Removes a PokemonInstance from the manager completely
   */
  public removePokemon(id: string): void {
    if (!this.instances.has(id)) {
      return;
    }

    this.clearLocation(id);
    this.instances.delete(id);
  }

  /**
   * Updates the location and ownership of a registered Pokemon
   */
  public updateLocation(id: string, location: PokemonLocation): void {
    if (!this.instances.has(id)) {
      throw new Error(`Cannot update location for unregistered Pokemon ${id}`);
    }

    // Validation
    this.validateLocation(id, location);

    // Clear old location from indices
    this.clearLocation(id);

    // Set new location
    this.locations.set(id, location);
    
    // Update indices
    if (location.ownerId) {
      let ownerSet = this.ownerIndex.get(location.ownerId);
      if (!ownerSet) {
        ownerSet = new Set();
        this.ownerIndex.set(location.ownerId, ownerSet);
      }
      ownerSet.add(id);

      if (location.type === PokemonLocationType.Party && location.slotIndex !== undefined) {
        let party = this.partyIndex.get(location.ownerId);
        if (!party) {
          party = [null, null, null, null, null, null];
          this.partyIndex.set(location.ownerId, party);
        }
        party[location.slotIndex] = id;
      }

      if (location.type === PokemonLocationType.PC && location.boxIndex !== undefined && location.slotIndex !== undefined) {
        let pcBoxes = this.pcIndex.get(location.ownerId);
        if (!pcBoxes) {
          pcBoxes = new Map();
          this.pcIndex.set(location.ownerId, pcBoxes);
        }
        let box = pcBoxes.get(location.boxIndex);
        if (!box) {
          box = new Map();
          pcBoxes.set(location.boxIndex, box);
        }
        box.set(location.slotIndex, id);
      }
    }

    if (location.entityId) {
      this.entityIndex.set(location.entityId, id);
    }
  }

  /**
   * Clears a pokemon from all lookup indices
   */
  public clearLocation(id: string): void {
    const oldLoc = this.locations.get(id);
    if (!oldLoc) return;

    if (oldLoc.ownerId) {
      const ownerSet = this.ownerIndex.get(oldLoc.ownerId);
      if (ownerSet) {
        ownerSet.delete(id);
        if (ownerSet.size === 0) {
          this.ownerIndex.delete(oldLoc.ownerId);
        }
      }

      if (oldLoc.type === PokemonLocationType.Party && oldLoc.slotIndex !== undefined) {
        const party = this.partyIndex.get(oldLoc.ownerId);
        if (party) {
          party[oldLoc.slotIndex] = null;
        }
      }

      if (oldLoc.type === PokemonLocationType.PC && oldLoc.boxIndex !== undefined && oldLoc.slotIndex !== undefined) {
        const pcBoxes = this.pcIndex.get(oldLoc.ownerId);
        if (pcBoxes) {
          const box = pcBoxes.get(oldLoc.boxIndex);
          if (box) {
            box.delete(oldLoc.slotIndex);
          }
        }
      }
    }

    if (oldLoc.entityId) {
      this.entityIndex.delete(oldLoc.entityId);
      this.wildPokemon.delete(oldLoc.entityId);
    }

    this.locations.delete(id);
  }

  /**
   * Clears all registered locations for an owner
   */
  public clearOwnerLocations(ownerId: string): void {
    const ownerSet = this.ownerIndex.get(ownerId);
    if (!ownerSet) return;

    const ids = Array.from(ownerSet);
    for (const id of ids) {
      this.clearLocation(id);
    }
  }

  /**
   * Validation logic for setting locations to avoid duplicates
   */
  private validateLocation(id: string, location: PokemonLocation): void {
    if (location.type === PokemonLocationType.Wild && !location.entityId) {
      throw new Error(`Wild Pokemon location must have an entityId for Pokemon ${id}`);
    }

    if (location.type === PokemonLocationType.Party) {
      if (!location.ownerId) throw new Error(`Party Pokemon must have an ownerId (Pokemon ${id})`);
      if (location.slotIndex === undefined || location.slotIndex < 0 || location.slotIndex > 5) {
        throw new Error(`Invalid party slot index for Pokemon ${id}`);
      }
      const existingInSlot = this.partyIndex.get(location.ownerId)?.[location.slotIndex];
      if (existingInSlot && existingInSlot !== id) {
        throw new Error(`Duplicate ownership: Slot ${location.slotIndex} in party for ${location.ownerId} is already occupied by ${existingInSlot}`);
      }
    }

    if (location.type === PokemonLocationType.PC) {
      if (!location.ownerId) throw new Error(`PC Pokemon must have an ownerId (Pokemon ${id})`);
      if (location.boxIndex === undefined || location.slotIndex === undefined) {
        throw new Error(`PC Pokemon must have boxIndex and slotIndex (Pokemon ${id})`);
      }
      const existingInSlot = this.pcIndex.get(location.ownerId)?.get(location.boxIndex)?.get(location.slotIndex);
      if (existingInSlot && existingInSlot !== id) {
        throw new Error(`Duplicate ownership: Box ${location.boxIndex} Slot ${location.slotIndex} for ${location.ownerId} is already occupied by ${existingInSlot}`);
      }
    }

    if (location.entityId) {
      const existingLinked = this.entityIndex.get(location.entityId);
      if (existingLinked && existingLinked !== id) {
        throw new Error(`Invalid entity link: Entity ${location.entityId} is already linked to Pokemon ${existingLinked}`);
      }
    }
  }

  // --- Wild Pokemon Management ---

  public registerWildPokemon(wild: WildPokemon): void {
    if (!this.instances.has(wild.pokemonInstanceId)) {
      throw new Error(`Cannot register WildPokemon ${wild.entityId}: PokemonInstance ${wild.pokemonInstanceId} is not registered`);
    }

    const loc = this.locations.get(wild.pokemonInstanceId);
    if (!loc || loc.type !== PokemonLocationType.Wild || loc.entityId !== wild.entityId) {
      throw new Error(`Invalid world association: PokemonInstance ${wild.pokemonInstanceId} is not correctly linked as Wild to entity ${wild.entityId}`);
    }

    if (this.wildPokemon.has(wild.entityId)) {
      throw new Error(`WildPokemon entity ${wild.entityId} is already registered`);
    }

    this.wildPokemon.set(wild.entityId, wild);
  }

  public getWildPokemon(entityId: string): WildPokemon | undefined {
    return this.wildPokemon.get(entityId);
  }

  public getAllWildPokemon(): WildPokemon[] {
    return Array.from(this.wildPokemon.values());
  }

  public removeWildPokemon(entityId: string): void {
    const wild = this.wildPokemon.get(entityId);
    if (wild) {
      this.removePokemon(wild.pokemonInstanceId); // Removes instance and cleans up WildPokemon via clearLocation
    }
  }

  // --- Lookups ---

  public getPokemonById(id: string): PokemonInstance | undefined {
    return this.instances.get(id);
  }

  public getLocation(id: string): PokemonLocation | undefined {
    return this.locations.get(id);
  }

  public getPokemonByOwner(ownerId: string): PokemonInstance[] {
    const set = this.ownerIndex.get(ownerId);
    if (!set) return [];
    
    const result: PokemonInstance[] = [];
    for (const id of set) {
      const p = this.instances.get(id);
      if (p) result.push(p);
    }
    return result;
  }

  public getPokemonByEntityId(entityId: string): PokemonInstance | undefined {
    const id = this.entityIndex.get(entityId);
    return id ? this.instances.get(id) : undefined;
  }

  public getParty(ownerId: string): (PokemonInstance | null)[] {
    const party = this.partyIndex.get(ownerId);
    if (!party) return [null, null, null, null, null, null];
    
    return party.map(id => (id ? (this.instances.get(id) || null) : null));
  }

  public getPCBox(ownerId: string, boxIndex: number): Map<number, PokemonInstance> {
    const boxResult = new Map<number, PokemonInstance>();
    const box = this.pcIndex.get(ownerId)?.get(boxIndex);
    if (box) {
      for (const [slot, id] of box.entries()) {
        const p = this.instances.get(id);
        if (p) boxResult.set(slot, p);
      }
    }
    return boxResult;
  }

  public getNearbyWildPokemon(position: Vec2, radius: number): WildPokemon[] {
    const nearby: WildPokemon[] = [];
    const rSq = radius * radius;
    for (const wild of this.wildPokemon.values()) {
      const dx = wild.position.x - position.x;
      const dy = wild.position.y - position.y;
      if (dx * dx + dy * dy <= rSq) {
        nearby.push(wild);
      }
    }
    return nearby;
  }

  // --- Serialization ---

  public serialize(): SerializedPokemonManager {
    return {
      instances: Array.from(this.instances.values()),
      locations: Object.fromEntries(this.locations.entries()),
      wildPokemon: Array.from(this.wildPokemon.values())
    };
  }

  public deserialize(data: SerializedPokemonManager): void {
    this.reset();
    for (const inst of data.instances) {
      this.instances.set(inst.id, inst);
    }
    for (const [id, loc] of Object.entries(data.locations)) {
      this.updateLocation(id, loc); // This repopulates indices
    }
    for (const wild of data.wildPokemon) {
      this.registerWildPokemon(wild);
    }
  }
}
