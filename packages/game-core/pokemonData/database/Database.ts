/**
 * Central Gameplay Database Service (Universal)
 * Loads all 15 JSON datasets and provides O(1) Map lookups.
 * Runs seamlessly on both browser and Node.js environments.
 */

import { PokemonSpeciesData, StatBlock, EVYield, PokemonAbilitiesData, SpriteRefs } from './PokemonData.js';
import { MoveData, MoveEffect, MoveFlags } from './MoveData.js';
import { AbilityData } from './AbilityData.js';
import { ItemData, BerryData, PokeballData } from './ItemData.js';
import { EvolutionRequirement } from './EvolutionData.js';
import { SpeciesLearnsetData, LearnsetMove, RemindMove } from './LearnsetData.js';
import { FormDefinition } from './FormData.js';

export interface TypeInfo {
  id: string;
  name: string;
  color: string;
}

export interface TypeChartData {
  types: TypeInfo[];
  chart: Record<string, Record<string, number>>;
}

export interface EggGroupData {
  id: string;
  name: string;
  hatchStepMultiplier: number;
}

export interface GrowthRateData {
  id: string;
  name: string;
  maxExp: number;
  formula: string;
}

export interface TrainerClassData {
  id: string;
  name: string;
  prizeMoneyMultiplier: number;
  aiSkillLevel: number;
  sprite: string;
}

export interface NatureData {
  id: number;
  name: string;
  increasedStat: string | null;
  decreasedStat: string | null;
  favoriteFlavor: string | null;
  dislikedFlavor: string | null;
}

export class Database {
  private static instance: Database | null = null;
  private initialized = false;

  private speciesMap = new Map<number, PokemonSpeciesData>();
  private speciesByNameMap = new Map<string, PokemonSpeciesData>();

  private moveMap = new Map<number, MoveData>();
  private moveByNameMap = new Map<string, MoveData>();

  private abilityMap = new Map<string, AbilityData>();

  private itemMap = new Map<string | number, ItemData>();
  private itemByNameMap = new Map<string, ItemData>();

  private learnsetMap = new Map<number, SpeciesLearnsetData>();
  private evolutionMap = new Map<number, EvolutionRequirement[]>();
  private formMap = new Map<number, FormDefinition[]>();

  private typeData: TypeChartData = { types: [], chart: {} };
  private eggGroupMap = new Map<string, EggGroupData>();
  private growthRateMap = new Map<string, GrowthRateData>();
  private berryMap = new Map<string | number, BerryData>();
  private ballMap = new Map<string, PokeballData>();
  private trainerClassMap = new Map<string, TrainerClassData>();
  private natureMap = new Map<string | number, NatureData>();
  private expTableData: Record<string, Record<number, number>> = {};

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async initialize(basePath = '/assets/data'): Promise<void> {
    if (this.initialized) return;

    try {
      let pokemonRaw: Record<string, PokemonSpeciesData>;
      let movesRaw: Record<string, MoveData>;
      let abilitiesRaw: Record<string, AbilityData>;
      let itemsRaw: Record<string, ItemData>;
      let learnsetsRaw: Record<string, SpeciesLearnsetData>;
      let evolutionsRaw: Record<string, EvolutionRequirement[]>;
      let formsRaw: Record<string, FormDefinition[]>;
      let typesRaw: TypeChartData;
      let eggGroupsRaw: EggGroupData[];
      let growthRatesRaw: GrowthRateData[];
      let berriesRaw: BerryData[];
      let ballsRaw: PokeballData[];
      let trainerClassesRaw: TrainerClassData[];
      let naturesRaw: NatureData[];
      let expTablesRaw: Record<string, Record<number, number>>;

      if (typeof window === 'undefined') {
        // Node / Server environment
        const fs = await import('fs');
        const path = await import('path');
        
        const loadNodeJson = (filename: string): any => {
          const possiblePaths = [
            path.resolve(process.cwd(), 'client/public/assets/data', filename),
            path.resolve(process.cwd(), 'dist/client/assets/data', filename),
            path.resolve(process.cwd(), 'assets/data', filename)
          ];
          
          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              return JSON.parse(fs.readFileSync(p, 'utf8'));
            }
          }
          throw new Error(`Failed to find database file ${filename} in any search path.`);
        };

        pokemonRaw = loadNodeJson('pokemon.json');
        movesRaw = loadNodeJson('moves.json');
        abilitiesRaw = loadNodeJson('abilities.json');
        itemsRaw = loadNodeJson('items.json');
        learnsetsRaw = loadNodeJson('learnsets.json');
        evolutionsRaw = loadNodeJson('evolutions.json');
        formsRaw = loadNodeJson('forms.json');
        typesRaw = loadNodeJson('types.json');
        eggGroupsRaw = loadNodeJson('eggGroups.json');
        growthRatesRaw = loadNodeJson('growthRates.json');
        berriesRaw = loadNodeJson('berries.json');
        ballsRaw = loadNodeJson('balls.json');
        trainerClassesRaw = loadNodeJson('trainerClasses.json');
        naturesRaw = loadNodeJson('natures.json');
        expTablesRaw = loadNodeJson('expTables.json');
      } else {
        // Browser environment
        const fetchJson = async <T>(filename: string): Promise<T> => {
          const res = await fetch(`${basePath}/${filename}`);
          if (!res.ok) {
            throw new Error(`Failed to load database file: ${filename} (Status ${res.status})`);
          }
          return (await res.json()) as T;
        };

        [
          pokemonRaw,
          movesRaw,
          abilitiesRaw,
          itemsRaw,
          learnsetsRaw,
          evolutionsRaw,
          formsRaw,
          typesRaw,
          eggGroupsRaw,
          growthRatesRaw,
          berriesRaw,
          ballsRaw,
          trainerClassesRaw,
          naturesRaw,
          expTablesRaw
        ] = await Promise.all([
          fetchJson<Record<string, PokemonSpeciesData>>('pokemon.json'),
          fetchJson<Record<string, MoveData>>('moves.json'),
          fetchJson<Record<string, AbilityData>>('abilities.json'),
          fetchJson<Record<string, ItemData>>('items.json'),
          fetchJson<Record<string, SpeciesLearnsetData>>('learnsets.json'),
          fetchJson<Record<string, EvolutionRequirement[]>>('evolutions.json'),
          fetchJson<Record<string, FormDefinition[]>>('forms.json'),
          fetchJson<TypeChartData>('types.json'),
          fetchJson<EggGroupData[]>('eggGroups.json'),
          fetchJson<GrowthRateData[]>('growthRates.json'),
          fetchJson<BerryData[]>('berries.json'),
          fetchJson<PokeballData[]>('balls.json'),
          fetchJson<TrainerClassData[]>('trainerClasses.json'),
          fetchJson<NatureData[]>('natures.json'),
          fetchJson<Record<string, Record<number, number>>>('expTables.json')
        ]);
      }

      // Populate Pokémon
      if (pokemonRaw) {
        for (const [idStr, data] of Object.entries(pokemonRaw)) {
          if (!data) continue;
          const id = Number(idStr);
          this.speciesMap.set(id, data);
          if (data.name) {
            this.speciesByNameMap.set(data.name.toLowerCase(), data);
          }
        }
      }

      // Populate Moves
      if (movesRaw) {
        for (const [idStr, data] of Object.entries(movesRaw)) {
          if (!data) continue;
          const id = Number(idStr);
          this.moveMap.set(id, data);
          if (data.name) {
            this.moveByNameMap.set(data.name.toLowerCase(), data);
          }
        }
      }

      // Populate Abilities
      if (abilitiesRaw) {
        for (const [id, data] of Object.entries(abilitiesRaw)) {
          if (!data) continue;
          if (id) {
            this.abilityMap.set(id.toLowerCase(), data);
          }
          if (data.name) {
            this.abilityMap.set(data.name.toLowerCase(), data);
          }
        }
      }

      // Populate Items
      if (itemsRaw) {
        for (const [idStr, data] of Object.entries(itemsRaw)) {
          if (!data) continue;
          this.itemMap.set(idStr, data);
          if (typeof data.id === 'number') {
            this.itemMap.set(data.id, data);
          }
          if (data.name) {
            this.itemByNameMap.set(data.name.toLowerCase(), data);
          }
        }
      }

      // Populate Learnsets
      if (learnsetsRaw) {
        for (const [idStr, data] of Object.entries(learnsetsRaw)) {
          this.learnsetMap.set(Number(idStr), data);
        }
      }

      // Populate Evolutions
      if (evolutionsRaw) {
        for (const [idStr, data] of Object.entries(evolutionsRaw)) {
          this.evolutionMap.set(Number(idStr), data);
        }
      }

      // Populate Forms
      if (formsRaw) {
        for (const [idStr, data] of Object.entries(formsRaw)) {
          this.formMap.set(Number(idStr), data);
        }
      }

      // Types
      this.typeData = typesRaw || { types: [], chart: {} };

      // Egg Groups
      if (eggGroupsRaw) {
        for (const group of eggGroupsRaw) {
          if (group && group.id) {
            this.eggGroupMap.set(group.id, group);
          }
        }
      }

      // Growth Rates
      if (growthRatesRaw) {
        for (const rate of growthRatesRaw) {
          if (rate && rate.id) {
            this.growthRateMap.set(rate.id, rate);
          }
        }
      }

      // Berries
      if (berriesRaw) {
        for (const berry of berriesRaw) {
          if (!berry) continue;
          const bAny = berry as any;
          if (bAny.id !== undefined || bAny.itemId !== undefined) {
            this.berryMap.set(bAny.id ?? bAny.itemId, berry);
          }
          if (bAny.name) {
            this.berryMap.set(bAny.name.toLowerCase(), berry);
          }
        }
      }

      // Balls
      if (ballsRaw) {
        for (const ball of ballsRaw) {
          if (!ball) continue;
          const bAny = ball as any;
          if (bAny.id !== undefined || bAny.itemId !== undefined) {
            this.ballMap.set(bAny.id ?? bAny.itemId, ball);
          }
          if (bAny.name) {
            this.ballMap.set(bAny.name.toLowerCase(), ball);
          }
        }
      }

      // Trainer Classes
      if (trainerClassesRaw) {
        for (const tc of trainerClassesRaw) {
          if (tc && tc.id) {
            this.trainerClassMap.set(tc.id, tc);
          }
        }
      }

      // Natures
      if (naturesRaw) {
        for (const nat of naturesRaw) {
          if (!nat) continue;
          if (nat.id !== undefined) {
            this.natureMap.set(nat.id, nat);
          }
          if (nat.name) {
            this.natureMap.set(nat.name.toLowerCase(), nat);
          }
        }
      }

      // EXP Tables
      this.expTableData = expTablesRaw || {};

      this.initialized = true;
      console.log('✅ Central Database service initialized successfully (Universal).');
    } catch (err) {
      console.error('❌ Failed to initialize Central Database service:', err);
      throw err;
    }
  }

  // Lookups
  public getPokemon(id: number): PokemonSpeciesData | undefined {
    if (id === undefined || id === null) return undefined;
    return this.speciesMap.get(id);
  }

  public getPokemonByName(name: string): PokemonSpeciesData | undefined {
    if (!name) return undefined;
    return this.speciesByNameMap.get(name.toLowerCase());
  }

  public getAllPokemon(): PokemonSpeciesData[] {
    return Array.from(this.speciesMap.values());
  }

  public getMove(id: number): MoveData | undefined {
    if (id === undefined || id === null) return undefined;
    return this.moveMap.get(id);
  }

  public getMoveByName(name: string): MoveData | undefined {
    if (!name) return undefined;
    return this.moveByNameMap.get(name.toLowerCase());
  }

  public getAllMoves(): MoveData[] {
    return Array.from(this.moveMap.values());
  }

  public getAbility(id: string): AbilityData | undefined {
    if (!id) return undefined;
    return this.abilityMap.get(id.toLowerCase());
  }

  public getAllAbilities(): AbilityData[] {
    return Array.from(this.abilityMap.values());
  }

  public getItem(id: number | string): ItemData | undefined {
    if (id === undefined || id === null) return undefined;
    return this.itemMap.get(id);
  }

  public getItemByName(name: string): ItemData | undefined {
    if (!name) return undefined;
    return this.itemByNameMap.get(name.toLowerCase());
  }

  public getAllItems(): ItemData[] {
    return Array.from(this.itemByNameMap.values());
  }

  public getLearnset(speciesId: number): SpeciesLearnsetData | undefined {
    if (speciesId === undefined || speciesId === null) return undefined;
    return this.learnsetMap.get(speciesId);
  }

  public getEvolutions(speciesId: number): EvolutionRequirement[] {
    if (speciesId === undefined || speciesId === null) return [];
    return this.evolutionMap.get(speciesId) || [];
  }

  public getForms(speciesId: number): FormDefinition[] {
    if (speciesId === undefined || speciesId === null) return [];
    return this.formMap.get(speciesId) || [];
  }

  public getTypeChart(): Record<string, Record<string, number>> {
    return this.typeData ? this.typeData.chart : {};
  }

  public getTypeEffectiveness(attackerType: string, defenderType: string): number {
    if (!attackerType || !defenderType) return 1.0;
    const atk = attackerType.toLowerCase();
    const def = defenderType.toLowerCase();
    if (this.typeData && this.typeData.chart && this.typeData.chart[atk] && typeof this.typeData.chart[atk][def] === 'number') {
      return this.typeData.chart[atk][def];
    }
    return 1.0;
  }

  public getEggGroup(id: string): EggGroupData | undefined {
    if (!id) return undefined;
    return this.eggGroupMap.get(id);
  }

  public getGrowthRate(id: string): GrowthRateData | undefined {
    if (!id) return undefined;
    return this.growthRateMap.get(id);
  }

  public getBerry(id: number | string): BerryData | undefined {
    if (id === undefined || id === null) return undefined;
    if (typeof id === 'string') {
      return this.berryMap.get(id.toLowerCase());
    }
    return this.berryMap.get(id);
  }

  public getBall(id: string): PokeballData | undefined {
    if (!id) return undefined;
    return this.ballMap.get(id.toLowerCase());
  }

  public getTrainerClass(id: string): TrainerClassData | undefined {
    if (!id) return undefined;
    return this.trainerClassMap.get(id);
  }

  public getNature(idOrName: number | string): NatureData | undefined {
    if (idOrName === undefined || idOrName === null) return undefined;
    if (typeof idOrName === 'string') {
      return this.natureMap.get(idOrName.toLowerCase());
    }
    return this.natureMap.get(idOrName);
  }

  public getExpForLevel(level: number, growthRate: string): number {
    if (!growthRate || level === undefined || level === null) return Math.pow(level || 1, 3);
    const rateData = this.expTableData[growthRate];
    if (rateData && typeof rateData[level] === 'number') {
      return rateData[level];
    }
    return Math.pow(level, 3);
  }
}
