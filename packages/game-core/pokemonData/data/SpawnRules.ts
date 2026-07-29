export interface SpawnRule {
  speciesId: number;
  minLevel: number;
  maxLevel: number;
  weight: number;
  conditions?: {
    timeOfDay?: string[];
    weather?: string[];
    waterOnly?: boolean;
    mountainOnly?: boolean;
  };
}

export const SpawnRules: Record<string, SpawnRule[]> = {};

export const BiomeSpawnTables: Record<string, SpawnRule[]> = {
  'route_1': [
    { speciesId: 16, minLevel: 2, maxLevel: 5, weight: 50 }, // Pidgey
    { speciesId: 19, minLevel: 2, maxLevel: 4, weight: 50 }, // Rattata
  ],
  'forest': [
    { speciesId: 10, minLevel: 3, maxLevel: 6, weight: 40 }, // Caterpie
    { speciesId: 13, minLevel: 3, maxLevel: 6, weight: 40 }, // Weedle
    { speciesId: 25, minLevel: 4, maxLevel: 6, weight: 20 }, // Pikachu
  ],
  'city': [
    { speciesId: 19, minLevel: 2, maxLevel: 5, weight: 80 },
    { speciesId: 25, minLevel: 3, maxLevel: 5, weight: 20 }
  ]
};
