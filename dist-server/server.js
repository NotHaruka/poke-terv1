// apps/game-server/server.ts
import crypto2 from "crypto";
import express from "express";
import http from "http";
import path3 from "path";
import fs3 from "fs";
import { WebSocketServer } from "ws";

// packages/game-core/pokemonData/data/Abilities.ts
var ABILITIES_DATABASE = {
  overgrow: {
    id: "overgrow",
    name: "Overgrow",
    description: "Powers up Grass-type moves when the Pok\xE9mon is in trouble.",
    shortDescription: "Boosts Grass moves in a pinch."
  },
  blaze: {
    id: "blaze",
    name: "Blaze",
    description: "Powers up Fire-type moves when the Pok\xE9mon is in trouble.",
    shortDescription: "Boosts Fire moves in a pinch."
  },
  torrent: {
    id: "torrent",
    name: "Torrent",
    description: "Powers up Water-type moves when the Pok\xE9mon is in trouble.",
    shortDescription: "Boosts Water moves in a pinch."
  },
  shield_dust: {
    id: "shield_dust",
    name: "Shield Dust",
    description: "Blocks the additional effects of attacks taken.",
    shortDescription: "Blocks move additional effects."
  },
  compound_eyes: {
    id: "compound_eyes",
    name: "Compound Eyes",
    description: "The Pok\xE9mon's compound eyes boost its accuracy.",
    shortDescription: "Boosts move accuracy by 30%."
  },
  intimidate: {
    id: "intimidate",
    name: "Intimidate",
    description: "Lowers the opposing Pok\xE9mon's Attack stat upon entering battle.",
    shortDescription: "Lowers foe Attack on entry."
  },
  static: {
    id: "static",
    name: "Static",
    description: "Contact with the Pok\xE9mon may cause paralysis.",
    shortDescription: "May paralyze attackers making contact."
  },
  lightning_rod: {
    id: "lightning_rod",
    name: "Lightning Rod",
    description: "Draws in all Electric-type moves to boost Sp. Atk.",
    shortDescription: "Draws in Electric moves to boost Sp. Atk."
  },
  levitate: {
    id: "levitate",
    name: "Levitate",
    description: "Gives full immunity to all Ground-type moves.",
    shortDescription: "Immune to Ground moves."
  },
  speed_boost: {
    id: "speed_boost",
    name: "Speed Boost",
    description: "Its Speed stat is boosted at the end of each turn.",
    shortDescription: "Boosts Speed every turn."
  },
  sturdy: {
    id: "sturdy",
    name: "Sturdy",
    description: "Cannot be knocked out with one hit when at full HP.",
    shortDescription: "Survives 1-hit KO at full HP."
  },
  flash_fire: {
    id: "flash_fire",
    name: "Flash Fire",
    description: "Powers up Fire-type moves if hit by a Fire-type move.",
    shortDescription: "Absorbs Fire moves to power up Fire attacks."
  },
  natural_cure: {
    id: "natural_cure",
    name: "Natural Cure",
    description: "All status conditions heal when the Pok\xE9mon switches out.",
    shortDescription: "Cures status conditions on switch-out."
  },
  chlorophyll: {
    id: "chlorophyll",
    name: "Chlorophyll",
    description: "Boosts the Pok\xE9mon's Speed stat in harsh sunlight.",
    shortDescription: "Doubles Speed in harsh sunlight."
  },
  solar_power: {
    id: "solar_power",
    name: "Solar Power",
    description: "Boosts Sp. Atk in harsh sunlight at the cost of HP.",
    shortDescription: "Boosts Sp. Atk in sun, loses HP."
  },
  swift_swim: {
    id: "swift_swim",
    name: "Swift Swim",
    description: "Boosts the Pok\xE9mon's Speed stat in rain.",
    shortDescription: "Doubles Speed in rain."
  },
  inner_focus: {
    id: "inner_focus",
    name: "Inner Focus",
    description: "Protects the Pok\xE9mon from flinching or Intimidate.",
    shortDescription: "Prevents flinching and Intimidate."
  },
  pressure: {
    id: "pressure",
    name: "Pressure",
    description: "Raises opposing Pok\xE9mon's PP usage.",
    shortDescription: "Doubles opponent PP cost."
  },
  rain_dish: {
    id: "rain_dish",
    name: "Rain Dish",
    description: "The Pok\xE9mon gradually regains HP in rain.",
    shortDescription: "Restores HP in rain."
  },
  run_away: {
    id: "run_away",
    name: "Run Away",
    description: "Enables a sure escape from wild Pok\xE9mon.",
    shortDescription: "Sure escape from wild battles."
  },
  shed_skin: {
    id: "shed_skin",
    name: "Shed Skin",
    description: "The Pok\xE9mon may heal its own status conditions by shedding its skin.",
    shortDescription: "May heal status conditions."
  },
  tinted_lens: {
    id: "tinted_lens",
    name: "Tinted Lens",
    description: 'The Pok\xE9mon can use "not very effective" moves to deal regular damage.',
    shortDescription: "Powers up not very effective moves."
  },
  keen_eye: {
    id: "keen_eye",
    name: "Keen Eye",
    description: "Keeps the Pok\xE9mon's accuracy stat from being lowered.",
    shortDescription: "Prevents accuracy reduction."
  },
  tangled_feet: {
    id: "tangled_feet",
    name: "Tangled Feet",
    description: "Raises evasion if the Pok\xE9mon is confused.",
    shortDescription: "Raises evasion when confused."
  },
  big_pecks: {
    id: "big_pecks",
    name: "Big Pecks",
    description: "Protects the Pok\xE9mon from Defense-lowering attacks.",
    shortDescription: "Prevents Defense drops."
  },
  thick_fat: {
    id: "thick_fat",
    name: "Thick Fat",
    description: "A thick layer of fat protects the Pok\xE9mon from Fire- and Ice-type moves.",
    shortDescription: "Halves Fire and Ice damage."
  },
  tough_claws: {
    id: "tough_claws",
    name: "Tough Claws",
    description: "Powers up moves that make direct contact with the target.",
    shortDescription: "Powers up contact moves."
  },
  drought: {
    id: "drought",
    name: "Drought",
    description: "Turns the sunlight harsh when the Pok\xE9mon enters a battle.",
    shortDescription: "Summons harsh sunlight on entry."
  },
  mega_launcher: {
    id: "mega_launcher",
    name: "Mega Launcher",
    description: "Powers up pulse moves.",
    shortDescription: "Powers up pulse moves."
  }
};

// packages/game-core/pokemonData/data/Constants.ts
var TILE_SIZE = 16;
var CHUNK_SIZE = 16;
var WORLD_SEED = 1337;
var TOWN_CHUNK_SPACING = 8;
var CHUNK_PIXELS = CHUNK_SIZE * TILE_SIZE;
var TARGET_FPS = 60;
var FIXED_TIMESTEP = 1e3 / TARGET_FPS;
var PLAYER_WALK_SPEED = 2.5;
var PLAYER_SPRINT_SPEED = 5.5;

// packages/game-core/pokemonData/data/Evolutions.ts
var EVOLUTIONS_DATABASE = {
  1: [{ targetSpeciesId: 2, method: "level", level: 16 }],
  2: [{ targetSpeciesId: 3, method: "level", level: 32 }],
  3: [],
  4: [{ targetSpeciesId: 5, method: "level", level: 16 }],
  5: [{ targetSpeciesId: 6, method: "level", level: 36 }],
  6: [],
  7: [{ targetSpeciesId: 8, method: "level", level: 16 }],
  8: [{ targetSpeciesId: 9, method: "level", level: 36 }],
  9: [],
  10: [{ targetSpeciesId: 11, method: "level", level: 7 }],
  11: [{ targetSpeciesId: 12, method: "level", level: 10 }],
  12: [],
  13: [{ targetSpeciesId: 14, method: "level", level: 18 }],
  14: [{ targetSpeciesId: 15, method: "level", level: 36 }],
  15: [],
  25: [{ targetSpeciesId: 26, method: "item", itemId: 52, requiredItemName: "Thunder Stone" }],
  26: []
};

// packages/game-core/pokemonData/data/Types.ts
var PokemonType = /* @__PURE__ */ ((PokemonType2) => {
  PokemonType2["Normal"] = "normal";
  PokemonType2["Fire"] = "fire";
  PokemonType2["Water"] = "water";
  PokemonType2["Grass"] = "grass";
  PokemonType2["Electric"] = "electric";
  PokemonType2["Ice"] = "ice";
  PokemonType2["Fighting"] = "fighting";
  PokemonType2["Poison"] = "poison";
  PokemonType2["Ground"] = "ground";
  PokemonType2["Flying"] = "flying";
  PokemonType2["Psychic"] = "psychic";
  PokemonType2["Bug"] = "bug";
  PokemonType2["Rock"] = "rock";
  PokemonType2["Ghost"] = "ghost";
  PokemonType2["Dragon"] = "dragon";
  PokemonType2["Dark"] = "dark";
  PokemonType2["Steel"] = "steel";
  PokemonType2["Fairy"] = "fairy";
  return PokemonType2;
})(PokemonType || {});

// packages/game-core/pokemonData/data/Forms.ts
var FORMS_DATABASE = {
  3: [
    {
      formId: "mega",
      formName: "Mega Venusaur",
      types: ["grass" /* Grass */, "poison" /* Poison */],
      baseStats: { hp: 80, attack: 100, defense: 123, specialAttack: 122, specialDefense: 120, speed: 80 },
      abilities: { primary: "thick_fat" },
      height: 2.4,
      weight: 155.5,
      isMega: true,
      requiredItem: "Venusaurite"
    }
  ],
  6: [
    {
      formId: "mega_x",
      formName: "Mega Charizard X",
      types: ["fire" /* Fire */, "dragon" /* Dragon */],
      baseStats: { hp: 78, attack: 130, defense: 111, specialAttack: 130, specialDefense: 85, speed: 100 },
      abilities: { primary: "tough_claws" },
      height: 1.7,
      weight: 110.5,
      isMega: true,
      requiredItem: "Charizardite X"
    },
    {
      formId: "mega_y",
      formName: "Mega Charizard Y",
      types: ["fire" /* Fire */, "flying" /* Flying */],
      baseStats: { hp: 78, attack: 104, defense: 78, specialAttack: 159, specialDefense: 115, speed: 100 },
      abilities: { primary: "drought" },
      height: 1.7,
      weight: 100.5,
      isMega: true,
      requiredItem: "Charizardite Y"
    }
  ],
  9: [
    {
      formId: "mega",
      formName: "Mega Blastoise",
      types: ["water" /* Water */],
      baseStats: { hp: 79, attack: 103, defense: 120, specialAttack: 135, specialDefense: 115, speed: 78 },
      abilities: { primary: "mega_launcher" },
      height: 1.6,
      weight: 101.1,
      isMega: true,
      requiredItem: "Blastoisinite"
    }
  ]
};

// packages/game-core/pokemonData/data/GrowthRates.ts
function getExperienceForLevel(level, growthRate) {
  if (level <= 1) return 0;
  const n = level;
  switch (growthRate) {
    case "fast":
      return Math.floor(4 * Math.pow(n, 3) / 5);
    case "medium_fast":
      return Math.floor(Math.pow(n, 3));
    case "medium_slow":
      return Math.floor(6 / 5 * Math.pow(n, 3) - 15 * Math.pow(n, 2) + 100 * n - 140);
    case "slow":
      return Math.floor(5 * Math.pow(n, 3) / 4);
    case "erratic":
      if (n <= 50) return Math.floor(Math.pow(n, 3) * (100 - n) / 50);
      if (n <= 68) return Math.floor(Math.pow(n, 3) * (150 - n) / 100);
      if (n <= 98) return Math.floor(Math.pow(n, 3) * Math.floor((1911 - 10 * n) / 3) / 500);
      return Math.floor(Math.pow(n, 3) * (160 - n) / 100);
    case "fluctuating":
      if (n <= 15) return Math.floor(Math.pow(n, 3) * (Math.floor((n + 1) / 3) + 24) / 50);
      if (n <= 36) return Math.floor(Math.pow(n, 3) * (n + 14) / 50);
      return Math.floor(Math.pow(n, 3) * (Math.floor(n / 2) + 32) / 50);
    default:
      return Math.floor(Math.pow(n, 3));
  }
}

// packages/game-core/pokemonData/data/Items.ts
var ITEMS_DATABASE = {
  1: {
    id: 1,
    name: "Pok\xE9 Ball",
    description: "A device for catching wild Pok\xE9mon. It is thrown like a ball at a target.",
    category: "pokeball",
    price: 200,
    catchMultiplier: 1
  },
  2: {
    id: 2,
    name: "Great Ball",
    description: "A good, high-performance Pok\xE9 Ball that provides a higher catch rate than a standard Pok\xE9 Ball.",
    category: "pokeball",
    price: 600,
    catchMultiplier: 1.5
  },
  3: {
    id: 3,
    name: "Ultra Ball",
    description: "An ultra-high-performance Pok\xE9 Ball that provides a higher catch rate than a Great Ball.",
    category: "pokeball",
    price: 1200,
    catchMultiplier: 2
  },
  4: {
    id: 4,
    name: "Master Ball",
    description: "The best Pok\xE9 Ball with the ultimate level of performance. It will catch any wild Pok\xE9mon without fail.",
    category: "pokeball",
    price: 0,
    catchMultiplier: 255
  },
  10: {
    id: 10,
    name: "Potion",
    description: "A spray-type medicine for treating wounds. It restores 20 HP to a single Pok\xE9mon.",
    category: "medicine",
    price: 300,
    healAmount: 20
  },
  11: {
    id: 11,
    name: "Super Potion",
    description: "A spray-type medicine for treating wounds. It restores 60 HP to a single Pok\xE9mon.",
    category: "medicine",
    price: 700,
    healAmount: 60
  },
  12: {
    id: 12,
    name: "Hyper Potion",
    description: "A spray-type medicine for treating wounds. It restores 120 HP to a single Pok\xE9mon.",
    category: "medicine",
    price: 1500,
    healAmount: 120
  },
  13: {
    id: 13,
    name: "Max Potion",
    description: "A spray-type medicine for treating wounds. It completely restores the max HP of a single Pok\xE9mon.",
    category: "medicine",
    price: 2500,
    healPercentage: 100
  },
  14: {
    id: 14,
    name: "Revive",
    description: "A medicine that can revive a fainted Pok\xE9mon. It restores half of the Pok\xE9mon max HP.",
    category: "medicine",
    price: 1500,
    revivePercentage: 50
  },
  15: {
    id: 15,
    name: "Antidote",
    description: "A spray-type medicine. It lifts the effect of poison from a single Pok\xE9mon.",
    category: "medicine",
    price: 100,
    statusCure: ["poison", "bad_poison"]
  },
  16: {
    id: 16,
    name: "Paralyze Heal",
    description: "A spray-type medicine. It eliminates paralysis from a single Pok\xE9mon.",
    category: "medicine",
    price: 200,
    statusCure: ["paralysis"]
  },
  17: {
    id: 17,
    name: "Awakening",
    description: "A spray-type medicine. It awakens a Pok\xE9mon from the clutches of sleep.",
    category: "medicine",
    price: 250,
    statusCure: ["sleep"]
  },
  18: {
    id: 18,
    name: "Burn Heal",
    description: "A spray-type medicine. It heals a single Pok\xE9mon from a burn.",
    category: "medicine",
    price: 250,
    statusCure: ["burn"]
  },
  19: {
    id: 19,
    name: "Ice Heal",
    description: "A spray-type medicine. It thaws a single frozen Pok\xE9mon.",
    category: "medicine",
    price: 250,
    statusCure: ["freeze"]
  },
  20: {
    id: 20,
    name: "Full Heal",
    description: "A spray-type medicine. It heals all status conditions of a single Pok\xE9mon.",
    category: "medicine",
    price: 600,
    statusCure: ["poison", "bad_poison", "paralysis", "sleep", "burn", "freeze"]
  },
  30: {
    id: 30,
    name: "Oran Berry",
    description: "A Berry to be consumed by a Pok\xE9mon. If held, it restores 10 HP in battle.",
    category: "berry",
    price: 100,
    healAmount: 10,
    heldEffect: "auto_heal_10_hp"
  },
  31: {
    id: 31,
    name: "Sitrus Berry",
    description: "A Berry to be consumed by a Pok\xE9mon. If held, it restores 25% of max HP when in a pinch.",
    category: "berry",
    price: 200,
    healPercentage: 25,
    heldEffect: "auto_heal_25_pct"
  },
  32: {
    id: 32,
    name: "Lum Berry",
    description: "A Berry to be consumed by a Pok\xE9mon. If held, it cures any status condition in battle.",
    category: "berry",
    price: 300,
    heldEffect: "auto_cure_status"
  },
  40: {
    id: 40,
    name: "Leftovers",
    description: "An item to be held by a Pok\xE9mon. It gradually restores HP throughout a battle.",
    category: "held",
    price: 4e3,
    heldEffect: "turn_heal_6.25_pct"
  },
  41: {
    id: 41,
    name: "Choice Band",
    description: "An item to be held by a Pok\xE9mon. Boosts Attack, but allows the use of only one move.",
    category: "held",
    price: 4e3,
    heldEffect: "choice_band"
  },
  42: {
    id: 42,
    name: "Focus Sash",
    description: "An item to be held by a Pok\xE9mon. If the holder has full HP, it endures any potential KO move with 1 HP.",
    category: "held",
    price: 4e3,
    heldEffect: "focus_sash"
  },
  43: {
    id: 43,
    name: "Life Orb",
    description: "An item to be held by a Pok\xE9mon. Boosts move damage, but loses HP with each attack.",
    category: "held",
    price: 4e3,
    heldEffect: "life_orb"
  },
  50: {
    id: 50,
    name: "Fire Stone",
    description: "A peculiar stone that can make certain species of Pok\xE9mon evolve. It has a warm orange glow.",
    category: "key",
    price: 2100
  },
  51: {
    id: 51,
    name: "Water Stone",
    description: "A peculiar stone that can make certain species of Pok\xE9mon evolve. It is a clear blue.",
    category: "key",
    price: 2100
  },
  52: {
    id: 52,
    name: "Thunder Stone",
    description: "A peculiar stone that can make certain species of Pok\xE9mon evolve. It has a thunderbolt pattern.",
    category: "key",
    price: 2100
  },
  53: {
    id: 53,
    name: "Leaf Stone",
    description: "A peculiar stone that can make certain species of Pok\xE9mon evolve. It has a leaf imprint.",
    category: "key",
    price: 2100
  },
  54: {
    id: 54,
    name: "Moon Stone",
    description: "A peculiar stone that can make certain species of Pok\xE9mon evolve. It is dark as the night sky.",
    category: "key",
    price: 2100
  }
};

// packages/game-core/pokemonData/data/Learnsets.ts
var LEARNSETS_DATABASE = {
  1: [
    // Bulbasaur
    { level: 1, moveId: 1 },
    // Tackle
    { level: 1, moveId: 23 },
    // Growl
    { level: 3, moveId: 3 },
    // Vine Whip
    { level: 9, moveId: 26 },
    // Toxic
    { level: 13, moveId: 7 }
    // Razor Leaf
  ],
  2: [
    // Ivysaur
    { level: 1, moveId: 1 },
    { level: 1, moveId: 23 },
    { level: 1, moveId: 3 },
    { level: 9, moveId: 26 },
    { level: 13, moveId: 7 },
    { level: 20, moveId: 17 }
    // Sludge Bomb
  ],
  3: [
    // Venusaur
    { level: 1, moveId: 1 },
    { level: 1, moveId: 3 },
    { level: 13, moveId: 7 },
    { level: 20, moveId: 17 },
    { level: 32, moveId: 30 }
    // Hyper Beam
  ],
  4: [
    // Charmander
    { level: 1, moveId: 2 },
    // Scratch
    { level: 1, moveId: 23 },
    // Growl
    { level: 4, moveId: 4 },
    // Ember
    { level: 12, moveId: 22 },
    // Quick Attack
    { level: 19, moveId: 8 }
    // Flamethrower
  ],
  5: [
    // Charmeleon
    { level: 1, moveId: 2 },
    { level: 1, moveId: 4 },
    { level: 12, moveId: 22 },
    { level: 19, moveId: 8 },
    { level: 28, moveId: 27 }
    // Will-O-Wisp
  ],
  6: [
    // Charizard
    { level: 1, moveId: 2 },
    { level: 1, moveId: 4 },
    { level: 19, moveId: 8 },
    { level: 36, moveId: 18 },
    // Air Slash
    { level: 45, moveId: 15 }
    // Dragon Pulse
  ],
  7: [
    // Squirtle
    { level: 1, moveId: 1 },
    // Tackle
    { level: 1, moveId: 24 },
    // Tail Whip
    { level: 3, moveId: 5 },
    // Water Gun
    { level: 12, moveId: 22 },
    // Quick Attack
    { level: 21, moveId: 9 }
    // Hydro Pump
  ],
  8: [
    // Wartortle
    { level: 1, moveId: 1 },
    { level: 1, moveId: 5 },
    { level: 12, moveId: 22 },
    { level: 21, moveId: 9 },
    { level: 28, moveId: 11 }
    // Ice Beam
  ],
  9: [
    // Blastoise
    { level: 1, moveId: 1 },
    { level: 1, moveId: 5 },
    { level: 21, moveId: 9 },
    { level: 28, moveId: 11 },
    { level: 36, moveId: 30 }
    // Hyper Beam
  ],
  10: [
    // Caterpie
    { level: 1, moveId: 1 }
    // Tackle
  ],
  11: [
    // Metapod
    { level: 1, moveId: 1 }
    // Tackle
  ],
  12: [
    // Butterfree
    { level: 1, moveId: 1 },
    { level: 10, moveId: 18 }
    // Air Slash
  ],
  13: [
    // Pidgey
    { level: 1, moveId: 1 },
    // Tackle
    { level: 5, moveId: 22 },
    // Quick Attack
    { level: 13, moveId: 18 }
    // Air Slash
  ],
  14: [
    // Pidgeotto
    { level: 1, moveId: 1 },
    { level: 5, moveId: 22 },
    { level: 13, moveId: 18 }
  ],
  15: [
    // Pidgeot
    { level: 1, moveId: 1 },
    { level: 13, moveId: 18 },
    { level: 36, moveId: 30 }
    // Hyper Beam
  ],
  25: [
    // Pikachu
    { level: 1, moveId: 1 },
    { level: 1, moveId: 24 },
    { level: 4, moveId: 6 },
    // Thunder Shock
    { level: 8, moveId: 22 },
    // Quick Attack
    { level: 12, moveId: 25 },
    // Thunder Wave
    { level: 18, moveId: 10 }
    // Thunderbolt
  ],
  26: [
    // Raichu
    { level: 1, moveId: 6 },
    { level: 1, moveId: 10 },
    { level: 1, moveId: 22 }
  ]
};

// packages/game-core/pokemonData/data/Moves.ts
var MOVES_DATABASE = {
  1: {
    id: 1,
    name: "Tackle",
    type: "normal" /* Normal */,
    category: "physical",
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 56,
    priority: 0,
    target: "selected_pokemon",
    description: "A physical charge attack."
  },
  2: {
    id: 2,
    name: "Scratch",
    type: "normal" /* Normal */,
    category: "physical",
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 56,
    priority: 0,
    target: "selected_pokemon",
    description: "Hard, pointed, sharp claws rake the target."
  },
  3: {
    id: 3,
    name: "Vine Whip",
    type: "grass" /* Grass */,
    category: "physical",
    power: 45,
    accuracy: 100,
    pp: 25,
    maxPp: 40,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is struck with slender, whip-like vines."
  },
  4: {
    id: 4,
    name: "Ember",
    type: "fire" /* Fire */,
    category: "special",
    power: 40,
    accuracy: 100,
    pp: 25,
    maxPp: 40,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is attacked with small flames. May inflict burn.",
    secondaryEffect: { chance: 10, status: "burn" }
  },
  5: {
    id: 5,
    name: "Water Gun",
    type: "water" /* Water */,
    category: "special",
    power: 40,
    accuracy: 100,
    pp: 25,
    maxPp: 40,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is blasted with a forceful shot of water."
  },
  6: {
    id: 6,
    name: "Thunder Shock",
    type: "electric" /* Electric */,
    category: "special",
    power: 40,
    accuracy: 100,
    pp: 30,
    maxPp: 48,
    priority: 0,
    target: "selected_pokemon",
    description: "A jolt of electricity strikes the target. May paralyze.",
    secondaryEffect: { chance: 10, status: "paralysis" }
  },
  7: {
    id: 7,
    name: "Razor Leaf",
    type: "grass" /* Grass */,
    category: "physical",
    power: 55,
    accuracy: 95,
    pp: 25,
    maxPp: 40,
    priority: 0,
    target: "all_opponents",
    description: "Sharp-edged leaves are launched at opposing Pok\xE9mon.",
    critRatio: 1
  },
  8: {
    id: 8,
    name: "Flamethrower",
    type: "fire" /* Fire */,
    category: "special",
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 24,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is scorched with an intense blast of fire.",
    secondaryEffect: { chance: 10, status: "burn" }
  },
  9: {
    id: 9,
    name: "Hydro Pump",
    type: "water" /* Water */,
    category: "special",
    power: 110,
    accuracy: 80,
    pp: 5,
    maxPp: 8,
    priority: 0,
    target: "selected_pokemon",
    description: "A huge volume of water is blasted at the target under high pressure."
  },
  10: {
    id: 10,
    name: "Thunderbolt",
    type: "electric" /* Electric */,
    category: "special",
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 24,
    priority: 0,
    target: "selected_pokemon",
    description: "A strong electric blast crashes down on the target.",
    secondaryEffect: { chance: 10, status: "paralysis" }
  },
  11: {
    id: 11,
    name: "Ice Beam",
    type: "ice" /* Ice */,
    category: "special",
    power: 90,
    accuracy: 100,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is struck with an freezing beam of ice.",
    secondaryEffect: { chance: 10, status: "freeze" }
  },
  12: {
    id: 12,
    name: "Earthquake",
    type: "ground" /* Ground */,
    category: "physical",
    power: 100,
    accuracy: 100,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "all_other_pokemon",
    description: "An earthquake crushes all surrounding Pok\xE9mon in battle."
  },
  13: {
    id: 13,
    name: "Psychic",
    type: "psychic" /* Psychic */,
    category: "special",
    power: 90,
    accuracy: 100,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is hit by a strong telekinetic force.",
    secondaryEffect: { chance: 10, statChange: { stat: "specialDefense", stages: -1 } }
  },
  14: {
    id: 14,
    name: "Shadow Ball",
    type: "ghost" /* Ghost */,
    category: "special",
    power: 80,
    accuracy: 100,
    pp: 15,
    maxPp: 24,
    priority: 0,
    target: "selected_pokemon",
    description: "The user hurls a shadowy blob at the target.",
    secondaryEffect: { chance: 20, statChange: { stat: "specialDefense", stages: -1 } }
  },
  15: {
    id: 15,
    name: "Dragon Pulse",
    type: "dragon" /* Dragon */,
    category: "special",
    power: 85,
    accuracy: 100,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is attacked with a shock wave generated by a dragon outburst."
  },
  16: {
    id: 16,
    name: "Close Combat",
    type: "fighting" /* Fighting */,
    category: "physical",
    power: 120,
    accuracy: 100,
    pp: 5,
    maxPp: 8,
    priority: 0,
    target: "selected_pokemon",
    description: "The user fights up close without guarding itself."
  },
  17: {
    id: 17,
    name: "Sludge Bomb",
    type: "poison" /* Poison */,
    category: "special",
    power: 90,
    accuracy: 100,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "selected_pokemon",
    description: "Unsanitary sludge is hurled at the target. May poison.",
    secondaryEffect: { chance: 30, status: "poison" }
  },
  18: {
    id: 18,
    name: "Air Slash",
    type: "flying" /* Flying */,
    category: "special",
    power: 75,
    accuracy: 95,
    pp: 15,
    maxPp: 24,
    priority: 0,
    target: "selected_pokemon",
    description: "The user attacks with a blade of air that slices through the sky."
  },
  19: {
    id: 19,
    name: "Rock Slide",
    type: "rock" /* Rock */,
    category: "physical",
    power: 75,
    accuracy: 90,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "all_opponents",
    description: "Large boulders are hurled at opposing Pok\xE9mon."
  },
  20: {
    id: 20,
    name: "Iron Head",
    type: "steel" /* Steel */,
    category: "physical",
    power: 80,
    accuracy: 100,
    pp: 15,
    maxPp: 24,
    priority: 0,
    target: "selected_pokemon",
    description: "The user slams its steel-hard head into the target."
  },
  21: {
    id: 21,
    name: "Moonblast",
    type: "fairy" /* Fairy */,
    category: "special",
    power: 95,
    accuracy: 100,
    pp: 15,
    maxPp: 24,
    priority: 0,
    target: "selected_pokemon",
    description: "Borrowing the power of the moon, the user attacks the target.",
    secondaryEffect: { chance: 30, statChange: { stat: "specialAttack", stages: -1 } }
  },
  22: {
    id: 22,
    name: "Quick Attack",
    type: "normal" /* Normal */,
    category: "physical",
    power: 40,
    accuracy: 100,
    pp: 30,
    maxPp: 48,
    priority: 1,
    target: "selected_pokemon",
    description: "An extremely fast strike that hits first."
  },
  23: {
    id: 23,
    name: "Growl",
    type: "normal" /* Normal */,
    category: "status",
    power: 0,
    accuracy: 100,
    pp: 40,
    maxPp: 64,
    priority: 0,
    target: "all_opponents",
    description: "The user growls cutely to make opposing Pok\xE9mon less wary.",
    secondaryEffect: { chance: 100, statChange: { stat: "attack", stages: -1 } }
  },
  24: {
    id: 24,
    name: "Tail Whip",
    type: "normal" /* Normal */,
    category: "status",
    power: 0,
    accuracy: 100,
    pp: 30,
    maxPp: 48,
    priority: 0,
    target: "all_opponents",
    description: "The user wags its tail cutely, making opposing Pok\xE9mon lower Defense.",
    secondaryEffect: { chance: 100, statChange: { stat: "defense", stages: -1 } }
  },
  25: {
    id: 25,
    name: "Thunder Wave",
    type: "electric" /* Electric */,
    category: "status",
    power: 0,
    accuracy: 90,
    pp: 20,
    maxPp: 32,
    priority: 0,
    target: "selected_pokemon",
    description: "A weak electric shock paralyzes the target.",
    secondaryEffect: { chance: 100, status: "paralysis" }
  },
  26: {
    id: 26,
    name: "Toxic",
    type: "poison" /* Poison */,
    category: "status",
    power: 0,
    accuracy: 90,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "selected_pokemon",
    description: "A move that badly poisons the target.",
    secondaryEffect: { chance: 100, status: "bad_poison" }
  },
  27: {
    id: 27,
    name: "Will-O-Wisp",
    type: "fire" /* Fire */,
    category: "status",
    power: 0,
    accuracy: 85,
    pp: 15,
    maxPp: 24,
    priority: 0,
    target: "selected_pokemon",
    description: "The user shoots a sinister flame at the target to inflict a burn.",
    secondaryEffect: { chance: 100, status: "burn" }
  },
  28: {
    id: 28,
    name: "Swords Dance",
    type: "normal" /* Normal */,
    category: "status",
    power: 0,
    accuracy: 0,
    pp: 20,
    maxPp: 32,
    priority: 0,
    target: "user",
    description: "A frenetic dance that sharply boosts the user Attack stat.",
    secondaryEffect: { chance: 100, statChange: { stat: "attack", stages: 2 } }
  },
  29: {
    id: 29,
    name: "Recover",
    type: "normal" /* Normal */,
    category: "status",
    power: 0,
    accuracy: 0,
    pp: 10,
    maxPp: 16,
    priority: 0,
    target: "user",
    description: "Restores up to half of the user maximum HP."
  },
  30: {
    id: 30,
    name: "Hyper Beam",
    type: "normal" /* Normal */,
    category: "special",
    power: 150,
    accuracy: 90,
    pp: 5,
    maxPp: 8,
    priority: 0,
    target: "selected_pokemon",
    description: "The target is blasted with a powerful beam. The user must rest next turn."
  }
};

// packages/game-core/pokemonData/data/Natures.ts
var NATURE_EFFECTS = [
  { increased: null, decreased: null },
  // 0  Hardy
  { increased: 1 /* Attack */, decreased: 2 /* Defense */ },
  // 1  Lonely
  { increased: 1 /* Attack */, decreased: 5 /* Speed */ },
  // 2  Brave
  { increased: 1 /* Attack */, decreased: 3 /* SpAttack */ },
  // 3  Adamant
  { increased: 1 /* Attack */, decreased: 4 /* SpDefense */ },
  // 4  Naughty
  { increased: 2 /* Defense */, decreased: 1 /* Attack */ },
  // 5  Bold
  { increased: null, decreased: null },
  // 6  Docile
  { increased: 2 /* Defense */, decreased: 5 /* Speed */ },
  // 7  Relaxed
  { increased: 2 /* Defense */, decreased: 3 /* SpAttack */ },
  // 8  Impish
  { increased: 2 /* Defense */, decreased: 4 /* SpDefense */ },
  // 9  Lax
  { increased: 5 /* Speed */, decreased: 1 /* Attack */ },
  // 10 Timid
  { increased: 5 /* Speed */, decreased: 2 /* Defense */ },
  // 11 Hasty
  { increased: null, decreased: null },
  // 12 Serious
  { increased: 5 /* Speed */, decreased: 3 /* SpAttack */ },
  // 13 Jolly
  { increased: 5 /* Speed */, decreased: 4 /* SpDefense */ },
  // 14 Naive
  { increased: 3 /* SpAttack */, decreased: 1 /* Attack */ },
  // 15 Modest
  { increased: 3 /* SpAttack */, decreased: 2 /* Defense */ },
  // 16 Mild
  { increased: 3 /* SpAttack */, decreased: 5 /* Speed */ },
  // 17 Quiet
  { increased: null, decreased: null },
  // 18 Bashful
  { increased: 3 /* SpAttack */, decreased: 4 /* SpDefense */ },
  // 19 Rash
  { increased: 4 /* SpDefense */, decreased: 1 /* Attack */ },
  // 20 Calm
  { increased: 4 /* SpDefense */, decreased: 2 /* Defense */ },
  // 21 Gentle
  { increased: 4 /* SpDefense */, decreased: 5 /* Speed */ },
  // 22 Sassy
  { increased: 4 /* SpDefense */, decreased: 3 /* SpAttack */ },
  // 23 Careful
  { increased: null, decreased: null }
  // 24 Quirky
];

// packages/game-core/pokemonData/data/SpawnRules.ts
var BiomeSpawnTables = {
  "route_1": [
    { speciesId: 16, minLevel: 2, maxLevel: 5, weight: 50 },
    // Pidgey
    { speciesId: 19, minLevel: 2, maxLevel: 4, weight: 50 }
    // Rattata
  ],
  "forest": [
    { speciesId: 10, minLevel: 3, maxLevel: 6, weight: 40 },
    // Caterpie
    { speciesId: 13, minLevel: 3, maxLevel: 6, weight: 40 },
    // Weedle
    { speciesId: 25, minLevel: 4, maxLevel: 6, weight: 20 }
    // Pikachu
  ],
  "city": [
    { speciesId: 19, minLevel: 2, maxLevel: 5, weight: 80 },
    { speciesId: 25, minLevel: 3, maxLevel: 5, weight: 20 }
  ]
};

// packages/game-core/pokemonData/database/Database.ts
var Database = class _Database {
  static instance = null;
  initialized = false;
  speciesMap = /* @__PURE__ */ new Map();
  speciesByNameMap = /* @__PURE__ */ new Map();
  moveMap = /* @__PURE__ */ new Map();
  moveByNameMap = /* @__PURE__ */ new Map();
  abilityMap = /* @__PURE__ */ new Map();
  itemMap = /* @__PURE__ */ new Map();
  itemByNameMap = /* @__PURE__ */ new Map();
  learnsetMap = /* @__PURE__ */ new Map();
  evolutionMap = /* @__PURE__ */ new Map();
  formMap = /* @__PURE__ */ new Map();
  typeData = { types: [], chart: {} };
  eggGroupMap = /* @__PURE__ */ new Map();
  growthRateMap = /* @__PURE__ */ new Map();
  berryMap = /* @__PURE__ */ new Map();
  ballMap = /* @__PURE__ */ new Map();
  trainerClassMap = /* @__PURE__ */ new Map();
  natureMap = /* @__PURE__ */ new Map();
  expTableData = {};
  constructor() {
  }
  static getInstance() {
    if (!_Database.instance) {
      _Database.instance = new _Database();
    }
    return _Database.instance;
  }
  isInitialized() {
    return this.initialized;
  }
  async initialize(basePath = "/assets/data") {
    if (this.initialized) return;
    try {
      let pokemonRaw;
      let movesRaw;
      let abilitiesRaw;
      let itemsRaw;
      let learnsetsRaw;
      let evolutionsRaw;
      let formsRaw;
      let typesRaw;
      let eggGroupsRaw;
      let growthRatesRaw;
      let berriesRaw;
      let ballsRaw;
      let trainerClassesRaw;
      let naturesRaw;
      let expTablesRaw;
      if (typeof window === "undefined") {
        const fs4 = await import("fs");
        const path4 = await import("path");
        const loadNodeJson = (filename) => {
          const possiblePaths = [
            path4.resolve(process.cwd(), "apps/game-client/public/assets/data", filename),
            path4.resolve(process.cwd(), "dist/client/assets/data", filename),
            path4.resolve(process.cwd(), "assets/data", filename)
          ];
          for (const p of possiblePaths) {
            if (fs4.existsSync(p)) {
              return JSON.parse(fs4.readFileSync(p, "utf8"));
            }
          }
          throw new Error(`Failed to find database file ${filename} in any search path.`);
        };
        pokemonRaw = loadNodeJson("pokemon.json");
        movesRaw = loadNodeJson("moves.json");
        abilitiesRaw = loadNodeJson("abilities.json");
        itemsRaw = loadNodeJson("items.json");
        learnsetsRaw = loadNodeJson("learnsets.json");
        evolutionsRaw = loadNodeJson("evolutions.json");
        formsRaw = loadNodeJson("forms.json");
        typesRaw = loadNodeJson("types.json");
        eggGroupsRaw = loadNodeJson("eggGroups.json");
        growthRatesRaw = loadNodeJson("growthRates.json");
        berriesRaw = loadNodeJson("berries.json");
        ballsRaw = loadNodeJson("balls.json");
        trainerClassesRaw = loadNodeJson("trainerClasses.json");
        naturesRaw = loadNodeJson("natures.json");
        expTablesRaw = loadNodeJson("expTables.json");
      } else {
        const fetchJson = async (filename) => {
          const res = await fetch(`${basePath}/${filename}`);
          if (!res.ok) {
            throw new Error(`Failed to load database file: ${filename} (Status ${res.status})`);
          }
          return await res.json();
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
          fetchJson("pokemon.json"),
          fetchJson("moves.json"),
          fetchJson("abilities.json"),
          fetchJson("items.json"),
          fetchJson("learnsets.json"),
          fetchJson("evolutions.json"),
          fetchJson("forms.json"),
          fetchJson("types.json"),
          fetchJson("eggGroups.json"),
          fetchJson("growthRates.json"),
          fetchJson("berries.json"),
          fetchJson("balls.json"),
          fetchJson("trainerClasses.json"),
          fetchJson("natures.json"),
          fetchJson("expTables.json")
        ]);
      }
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
      if (itemsRaw) {
        for (const [idStr, data] of Object.entries(itemsRaw)) {
          if (!data) continue;
          this.itemMap.set(idStr, data);
          if (typeof data.id === "number") {
            this.itemMap.set(data.id, data);
          }
          if (data.name) {
            this.itemByNameMap.set(data.name.toLowerCase(), data);
          }
        }
      }
      if (learnsetsRaw) {
        for (const [idStr, data] of Object.entries(learnsetsRaw)) {
          this.learnsetMap.set(Number(idStr), data);
        }
      }
      if (evolutionsRaw) {
        for (const [idStr, data] of Object.entries(evolutionsRaw)) {
          this.evolutionMap.set(Number(idStr), data);
        }
      }
      if (formsRaw) {
        for (const [idStr, data] of Object.entries(formsRaw)) {
          this.formMap.set(Number(idStr), data);
        }
      }
      this.typeData = typesRaw || { types: [], chart: {} };
      if (eggGroupsRaw) {
        for (const group of eggGroupsRaw) {
          if (group && group.id) {
            this.eggGroupMap.set(group.id, group);
          }
        }
      }
      if (growthRatesRaw) {
        for (const rate of growthRatesRaw) {
          if (rate && rate.id) {
            this.growthRateMap.set(rate.id, rate);
          }
        }
      }
      if (berriesRaw) {
        for (const berry of berriesRaw) {
          if (!berry) continue;
          const bAny = berry;
          if (bAny.id !== void 0 || bAny.itemId !== void 0) {
            this.berryMap.set(bAny.id ?? bAny.itemId, berry);
          }
          if (bAny.name) {
            this.berryMap.set(bAny.name.toLowerCase(), berry);
          }
        }
      }
      if (ballsRaw) {
        for (const ball of ballsRaw) {
          if (!ball) continue;
          const bAny = ball;
          if (bAny.id !== void 0 || bAny.itemId !== void 0) {
            this.ballMap.set(bAny.id ?? bAny.itemId, ball);
          }
          if (bAny.name) {
            this.ballMap.set(bAny.name.toLowerCase(), ball);
          }
        }
      }
      if (trainerClassesRaw) {
        for (const tc of trainerClassesRaw) {
          if (tc && tc.id) {
            this.trainerClassMap.set(tc.id, tc);
          }
        }
      }
      if (naturesRaw) {
        for (const nat of naturesRaw) {
          if (!nat) continue;
          if (nat.id !== void 0) {
            this.natureMap.set(nat.id, nat);
          }
          if (nat.name) {
            this.natureMap.set(nat.name.toLowerCase(), nat);
          }
        }
      }
      this.expTableData = expTablesRaw || {};
      this.initialized = true;
      console.log("\u2705 Central Database service initialized successfully (Universal).");
    } catch (err) {
      console.error("\u274C Failed to initialize Central Database service:", err);
      throw err;
    }
  }
  // Lookups
  getPokemon(id) {
    if (id === void 0 || id === null) return void 0;
    return this.speciesMap.get(id);
  }
  getPokemonByName(name) {
    if (!name) return void 0;
    return this.speciesByNameMap.get(name.toLowerCase());
  }
  getAllPokemon() {
    return Array.from(this.speciesMap.values());
  }
  getMove(id) {
    if (id === void 0 || id === null) return void 0;
    return this.moveMap.get(id);
  }
  getMoveByName(name) {
    if (!name) return void 0;
    return this.moveByNameMap.get(name.toLowerCase());
  }
  getAllMoves() {
    return Array.from(this.moveMap.values());
  }
  getAbility(id) {
    if (!id) return void 0;
    return this.abilityMap.get(id.toLowerCase());
  }
  getAllAbilities() {
    return Array.from(this.abilityMap.values());
  }
  getItem(id) {
    if (id === void 0 || id === null) return void 0;
    return this.itemMap.get(id);
  }
  getItemByName(name) {
    if (!name) return void 0;
    return this.itemByNameMap.get(name.toLowerCase());
  }
  getAllItems() {
    return Array.from(this.itemByNameMap.values());
  }
  getLearnset(speciesId) {
    if (speciesId === void 0 || speciesId === null) return void 0;
    return this.learnsetMap.get(speciesId);
  }
  getEvolutions(speciesId) {
    if (speciesId === void 0 || speciesId === null) return [];
    return this.evolutionMap.get(speciesId) || [];
  }
  getForms(speciesId) {
    if (speciesId === void 0 || speciesId === null) return [];
    return this.formMap.get(speciesId) || [];
  }
  getTypeChart() {
    return this.typeData ? this.typeData.chart : {};
  }
  getTypeEffectiveness(attackerType, defenderType) {
    if (!attackerType || !defenderType) return 1;
    const atk = attackerType.toLowerCase();
    const def = defenderType.toLowerCase();
    if (this.typeData && this.typeData.chart && this.typeData.chart[atk] && typeof this.typeData.chart[atk][def] === "number") {
      return this.typeData.chart[atk][def];
    }
    return 1;
  }
  getEggGroup(id) {
    if (!id) return void 0;
    return this.eggGroupMap.get(id);
  }
  getGrowthRate(id) {
    if (!id) return void 0;
    return this.growthRateMap.get(id);
  }
  getBerry(id) {
    if (id === void 0 || id === null) return void 0;
    if (typeof id === "string") {
      return this.berryMap.get(id.toLowerCase());
    }
    return this.berryMap.get(id);
  }
  getBall(id) {
    if (!id) return void 0;
    return this.ballMap.get(id.toLowerCase());
  }
  getTrainerClass(id) {
    if (!id) return void 0;
    return this.trainerClassMap.get(id);
  }
  getNature(idOrName) {
    if (idOrName === void 0 || idOrName === null) return void 0;
    if (typeof idOrName === "string") {
      return this.natureMap.get(idOrName.toLowerCase());
    }
    return this.natureMap.get(idOrName);
  }
  getExpForLevel(level, growthRate) {
    if (!growthRate || level === void 0 || level === null) return Math.pow(level || 1, 3);
    const rateData = this.expTableData[growthRate];
    if (rateData && typeof rateData[level] === "number") {
      return rateData[level];
    }
    return Math.pow(level, 3);
  }
};

// packages/game-core/pokemonData/data/Species.ts
var SPECIES_DATABASE = {
  1: {
    id: 1,
    name: "Bulbasaur",
    types: ["grass" /* Grass */, "poison" /* Poison */],
    baseStats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45 },
    abilities: { primary: "overgrow", hidden: "chlorophyll" },
    catchRate: 45,
    baseExp: 64,
    growthRate: "medium_slow",
    eggGroups: ["monster", "grass"],
    genderRatio: 87.5,
    height: 0.7,
    weight: 6.9,
    evYield: { specialAttack: 1 }
  },
  2: {
    id: 2,
    name: "Ivysaur",
    types: ["grass" /* Grass */, "poison" /* Poison */],
    baseStats: { hp: 60, attack: 62, defense: 63, specialAttack: 80, specialDefense: 80, speed: 60 },
    abilities: { primary: "overgrow", hidden: "chlorophyll" },
    catchRate: 45,
    baseExp: 142,
    growthRate: "medium_slow",
    eggGroups: ["monster", "grass"],
    genderRatio: 87.5,
    height: 1,
    weight: 13,
    evYield: { specialAttack: 1, specialDefense: 1 }
  },
  3: {
    id: 3,
    name: "Venusaur",
    types: ["grass" /* Grass */, "poison" /* Poison */],
    baseStats: { hp: 80, attack: 82, defense: 83, specialAttack: 100, specialDefense: 100, speed: 80 },
    abilities: { primary: "overgrow", hidden: "chlorophyll" },
    catchRate: 45,
    baseExp: 236,
    growthRate: "medium_slow",
    eggGroups: ["monster", "grass"],
    genderRatio: 87.5,
    height: 2,
    weight: 100,
    evYield: { specialAttack: 2, specialDefense: 1 }
  },
  4: {
    id: 4,
    name: "Charmander",
    types: ["fire" /* Fire */, "fire" /* Fire */],
    baseStats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65 },
    abilities: { primary: "blaze", hidden: "solar_power" },
    catchRate: 45,
    baseExp: 62,
    growthRate: "medium_slow",
    eggGroups: ["monster", "dragon"],
    genderRatio: 87.5,
    height: 0.6,
    weight: 8.5,
    evYield: { speed: 1 }
  },
  5: {
    id: 5,
    name: "Charmeleon",
    types: ["fire" /* Fire */, "fire" /* Fire */],
    baseStats: { hp: 58, attack: 64, defense: 58, specialAttack: 80, specialDefense: 65, speed: 80 },
    abilities: { primary: "blaze", hidden: "solar_power" },
    catchRate: 45,
    baseExp: 142,
    growthRate: "medium_slow",
    eggGroups: ["monster", "dragon"],
    genderRatio: 87.5,
    height: 1.1,
    weight: 19,
    evYield: { specialAttack: 1, speed: 1 }
  },
  6: {
    id: 6,
    name: "Charizard",
    types: ["fire" /* Fire */, "flying" /* Flying */],
    baseStats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 },
    abilities: { primary: "blaze", hidden: "solar_power" },
    catchRate: 45,
    baseExp: 240,
    growthRate: "medium_slow",
    eggGroups: ["monster", "dragon"],
    genderRatio: 87.5,
    height: 1.7,
    weight: 90.5,
    evYield: { specialAttack: 3 }
  },
  7: {
    id: 7,
    name: "Squirtle",
    types: ["water" /* Water */, "water" /* Water */],
    baseStats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43 },
    abilities: { primary: "torrent", hidden: "rain_dish" },
    catchRate: 45,
    baseExp: 63,
    growthRate: "medium_slow",
    eggGroups: ["monster", "water1"],
    genderRatio: 87.5,
    height: 0.5,
    weight: 9,
    evYield: { defense: 1 }
  },
  8: {
    id: 8,
    name: "Wartortle",
    types: ["water" /* Water */, "water" /* Water */],
    baseStats: { hp: 59, attack: 63, defense: 80, specialAttack: 65, specialDefense: 80, speed: 58 },
    abilities: { primary: "torrent", hidden: "rain_dish" },
    catchRate: 45,
    baseExp: 142,
    growthRate: "medium_slow",
    eggGroups: ["monster", "water1"],
    genderRatio: 87.5,
    height: 1,
    weight: 22.5,
    evYield: { defense: 1, specialDefense: 1 }
  },
  9: {
    id: 9,
    name: "Blastoise",
    types: ["water" /* Water */, "water" /* Water */],
    baseStats: { hp: 79, attack: 83, defense: 100, specialAttack: 85, specialDefense: 105, speed: 78 },
    abilities: { primary: "torrent", hidden: "rain_dish" },
    catchRate: 45,
    baseExp: 239,
    growthRate: "medium_slow",
    eggGroups: ["monster", "water1"],
    genderRatio: 87.5,
    height: 1.6,
    weight: 85.5,
    evYield: { specialDefense: 3 }
  },
  10: {
    id: 10,
    name: "Caterpie",
    types: ["bug" /* Bug */, "bug" /* Bug */],
    baseStats: { hp: 45, attack: 30, defense: 35, specialAttack: 20, specialDefense: 20, speed: 45 },
    abilities: { primary: "shield_dust", hidden: "run_away" },
    catchRate: 255,
    baseExp: 39,
    growthRate: "medium_fast",
    eggGroups: ["bug"],
    genderRatio: 50,
    height: 0.3,
    weight: 2.9,
    evYield: { hp: 1 }
  },
  11: {
    id: 11,
    name: "Metapod",
    types: ["bug" /* Bug */, "bug" /* Bug */],
    baseStats: { hp: 50, attack: 20, defense: 55, specialAttack: 25, specialDefense: 25, speed: 30 },
    abilities: { primary: "shed_skin" },
    catchRate: 120,
    baseExp: 72,
    growthRate: "medium_fast",
    eggGroups: ["bug"],
    genderRatio: 50,
    height: 0.7,
    weight: 9.9,
    evYield: { defense: 2 }
  },
  12: {
    id: 12,
    name: "Butterfree",
    types: ["bug" /* Bug */, "flying" /* Flying */],
    baseStats: { hp: 60, attack: 45, defense: 50, specialAttack: 90, specialDefense: 80, speed: 70 },
    abilities: { primary: "compound_eyes", hidden: "tinted_lens" },
    catchRate: 45,
    baseExp: 178,
    growthRate: "medium_fast",
    eggGroups: ["bug"],
    genderRatio: 50,
    height: 1.1,
    weight: 32,
    evYield: { specialAttack: 2, specialDefense: 1 }
  },
  13: {
    id: 13,
    name: "Pidgey",
    types: ["normal" /* Normal */, "flying" /* Flying */],
    baseStats: { hp: 40, attack: 45, defense: 40, specialAttack: 35, specialDefense: 35, speed: 56 },
    abilities: { primary: "keen_eye", secondary: "tangled_feet", hidden: "big_pecks" },
    catchRate: 255,
    baseExp: 50,
    growthRate: "medium_slow",
    eggGroups: ["flying"],
    genderRatio: 50,
    height: 0.3,
    weight: 1.8,
    evYield: { speed: 1 }
  },
  14: {
    id: 14,
    name: "Pidgeotto",
    types: ["normal" /* Normal */, "flying" /* Flying */],
    baseStats: { hp: 63, attack: 60, defense: 55, specialAttack: 50, specialDefense: 50, speed: 71 },
    abilities: { primary: "keen_eye", secondary: "tangled_feet", hidden: "big_pecks" },
    catchRate: 120,
    baseExp: 122,
    growthRate: "medium_slow",
    eggGroups: ["flying"],
    genderRatio: 50,
    height: 1.1,
    weight: 30,
    evYield: { speed: 2 }
  },
  15: {
    id: 15,
    name: "Pidgeot",
    types: ["normal" /* Normal */, "flying" /* Flying */],
    baseStats: { hp: 83, attack: 80, defense: 75, specialAttack: 70, specialDefense: 70, speed: 101 },
    abilities: { primary: "keen_eye", secondary: "tangled_feet", hidden: "big_pecks" },
    catchRate: 45,
    baseExp: 216,
    growthRate: "medium_slow",
    eggGroups: ["flying"],
    genderRatio: 50,
    height: 1.5,
    weight: 39.5,
    evYield: { speed: 3 }
  },
  25: {
    id: 25,
    name: "Pikachu",
    types: ["electric" /* Electric */, "electric" /* Electric */],
    baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
    abilities: { primary: "static", hidden: "lightning_rod" },
    catchRate: 190,
    baseExp: 112,
    growthRate: "medium_fast",
    eggGroups: ["field", "fairy"],
    genderRatio: 50,
    height: 0.4,
    weight: 6,
    evYield: { speed: 2 }
  },
  26: {
    id: 26,
    name: "Raichu",
    types: ["electric" /* Electric */, "electric" /* Electric */],
    baseStats: { hp: 60, attack: 90, defense: 55, specialAttack: 90, specialDefense: 80, speed: 110 },
    abilities: { primary: "static", hidden: "lightning_rod" },
    catchRate: 75,
    baseExp: 218,
    growthRate: "medium_fast",
    eggGroups: ["field", "fairy"],
    genderRatio: 50,
    height: 0.8,
    weight: 30,
    evYield: { speed: 3 }
  }
};
var MONSTER_SPECIES = new Proxy([], {
  get(target, prop, receiver) {
    const db = Database.getInstance();
    let source = [];
    if (db.isInitialized()) {
      source = db.getAllPokemon().map((s) => ({
        id: s.id,
        name: s.name,
        types: [
          s.types[0],
          s.types[1] && s.types[1] !== s.types[0] ? s.types[1] : null
        ],
        baseStats: {
          hp: s.baseStats.hp,
          attack: s.baseStats.attack,
          defense: s.baseStats.defense,
          spAttack: s.baseStats.specialAttack,
          spDefense: s.baseStats.specialDefense,
          speed: s.baseStats.speed
        },
        evYield: {
          hp: s.evYield.hp ?? 0,
          attack: s.evYield.attack ?? 0,
          defense: s.evYield.defense ?? 0,
          spAttack: s.evYield.specialAttack ?? 0,
          spDefense: s.evYield.specialDefense ?? 0,
          speed: s.evYield.speed ?? 0
        },
        catchRate: s.catchRate,
        experienceYield: s.baseExp,
        growthRate: s.growthRate,
        evolutions: []
      }));
    } else {
      source = Object.values(SPECIES_DATABASE).map((s) => ({
        id: s.id,
        name: s.name,
        types: [
          s.types[0],
          s.types[1] && s.types[1] !== s.types[0] ? s.types[1] : null
        ],
        baseStats: {
          hp: s.baseStats.hp,
          attack: s.baseStats.attack,
          defense: s.baseStats.defense,
          spAttack: s.baseStats.specialAttack,
          spDefense: s.baseStats.specialDefense,
          speed: s.baseStats.speed
        },
        evYield: {
          hp: s.evYield.hp ?? 0,
          attack: s.evYield.attack ?? 0,
          defense: s.evYield.defense ?? 0,
          spAttack: s.evYield.specialAttack ?? 0,
          spDefense: s.evYield.specialDefense ?? 0,
          speed: s.evYield.speed ?? 0
        },
        catchRate: s.catchRate,
        experienceYield: s.baseExp,
        growthRate: 2 /* MediumSlow */,
        evolutions: []
      }));
    }
    const value = Reflect.get(source, prop, receiver);
    if (typeof value === "function") {
      return value.bind(source);
    }
    return value;
  }
});

// packages/game-core/pokemonData/data/TypeChart.ts
var TypeChart = {
  ["normal" /* Normal */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 0.5,
    ["ghost" /* Ghost */]: 0,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 1
  },
  ["fire" /* Fire */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 0.5,
    ["water" /* Water */]: 0.5,
    ["grass" /* Grass */]: 2,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 2,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 2,
    ["rock" /* Rock */]: 0.5,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 0.5,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 2,
    ["fairy" /* Fairy */]: 1
  },
  ["water" /* Water */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 2,
    ["water" /* Water */]: 0.5,
    ["grass" /* Grass */]: 0.5,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 2,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 2,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 0.5,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 1,
    ["fairy" /* Fairy */]: 1
  },
  ["grass" /* Grass */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 0.5,
    ["water" /* Water */]: 2,
    ["grass" /* Grass */]: 0.5,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 0.5,
    ["ground" /* Ground */]: 2,
    ["flying" /* Flying */]: 0.5,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 0.5,
    ["rock" /* Rock */]: 2,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 0.5,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 1
  },
  ["electric" /* Electric */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 2,
    ["grass" /* Grass */]: 0.5,
    ["electric" /* Electric */]: 0.5,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 0,
    ["flying" /* Flying */]: 2,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 0.5,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 1,
    ["fairy" /* Fairy */]: 1
  },
  ["ice" /* Ice */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 0.5,
    ["water" /* Water */]: 0.5,
    ["grass" /* Grass */]: 2,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 0.5,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 2,
    ["flying" /* Flying */]: 2,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 2,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 1
  },
  ["fighting" /* Fighting */]: {
    ["normal" /* Normal */]: 2,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 2,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 0.5,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 0.5,
    ["psychic" /* Psychic */]: 0.5,
    ["bug" /* Bug */]: 0.5,
    ["rock" /* Rock */]: 2,
    ["ghost" /* Ghost */]: 0,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 2,
    ["steel" /* Steel */]: 2,
    ["fairy" /* Fairy */]: 0.5
  },
  ["poison" /* Poison */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 2,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 0.5,
    ["ground" /* Ground */]: 0.5,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 0.5,
    ["ghost" /* Ghost */]: 0.5,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0,
    ["fairy" /* Fairy */]: 2
  },
  ["ground" /* Ground */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 2,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 0.5,
    ["electric" /* Electric */]: 2,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 2,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 0,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 0.5,
    ["rock" /* Rock */]: 2,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 2,
    ["fairy" /* Fairy */]: 1
  },
  ["flying" /* Flying */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 2,
    ["electric" /* Electric */]: 0.5,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 2,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 2,
    ["rock" /* Rock */]: 0.5,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 1
  },
  ["psychic" /* Psychic */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 2,
    ["poison" /* Poison */]: 2,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 0.5,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 0,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 1
  },
  ["bug" /* Bug */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 0.5,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 2,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 0.5,
    ["poison" /* Poison */]: 0.5,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 0.5,
    ["psychic" /* Psychic */]: 2,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 0.5,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 2,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 0.5
  },
  ["rock" /* Rock */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 2,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 2,
    ["fighting" /* Fighting */]: 0.5,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 0.5,
    ["flying" /* Flying */]: 2,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 2,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 1
  },
  ["ghost" /* Ghost */]: {
    ["normal" /* Normal */]: 0,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 2,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 2,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 0.5,
    ["steel" /* Steel */]: 1,
    ["fairy" /* Fairy */]: 1
  },
  ["dragon" /* Dragon */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 2,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 0
  },
  ["dark" /* Dark */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 1,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 0.5,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 2,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 2,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 0.5,
    ["steel" /* Steel */]: 1,
    ["fairy" /* Fairy */]: 0.5
  },
  ["steel" /* Steel */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 0.5,
    ["water" /* Water */]: 0.5,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 0.5,
    ["ice" /* Ice */]: 2,
    ["fighting" /* Fighting */]: 1,
    ["poison" /* Poison */]: 1,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 2,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 1,
    ["dark" /* Dark */]: 1,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 2
  },
  ["fairy" /* Fairy */]: {
    ["normal" /* Normal */]: 1,
    ["fire" /* Fire */]: 0.5,
    ["water" /* Water */]: 1,
    ["grass" /* Grass */]: 1,
    ["electric" /* Electric */]: 1,
    ["ice" /* Ice */]: 1,
    ["fighting" /* Fighting */]: 2,
    ["poison" /* Poison */]: 0.5,
    ["ground" /* Ground */]: 1,
    ["flying" /* Flying */]: 1,
    ["psychic" /* Psychic */]: 1,
    ["bug" /* Bug */]: 1,
    ["rock" /* Rock */]: 1,
    ["ghost" /* Ghost */]: 1,
    ["dragon" /* Dragon */]: 2,
    ["dark" /* Dark */]: 2,
    ["steel" /* Steel */]: 0.5,
    ["fairy" /* Fairy */]: 1
  }
};

// packages/game-core/pokemonData/PokemonRegistry.ts
function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object" || Object.isFrozen(obj)) {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const prop = obj[key];
    if (prop !== null && typeof prop === "object") {
      deepFreeze(prop);
    }
  }
  return obj;
}
var PokemonRegistry = class _PokemonRegistry {
  static instance = null;
  speciesMap = /* @__PURE__ */ new Map();
  movesMap = /* @__PURE__ */ new Map();
  abilitiesMap = /* @__PURE__ */ new Map();
  itemsMap = /* @__PURE__ */ new Map();
  learnsetsMap = /* @__PURE__ */ new Map();
  evolutionsMap = /* @__PURE__ */ new Map();
  formsMap = /* @__PURE__ */ new Map();
  constructor() {
    this.loadData();
    this.validateData();
  }
  static getInstance() {
    if (!_PokemonRegistry.instance) {
      _PokemonRegistry.instance = new _PokemonRegistry();
    }
    return _PokemonRegistry.instance;
  }
  loadData() {
    for (const [idStr, species] of Object.entries(SPECIES_DATABASE)) {
      this.speciesMap.set(Number(idStr), deepFreeze(species));
    }
    for (const [idStr, move] of Object.entries(MOVES_DATABASE)) {
      this.movesMap.set(Number(idStr), deepFreeze(move));
    }
    for (const [idKey, ability] of Object.entries(ABILITIES_DATABASE)) {
      this.abilitiesMap.set(idKey.toLowerCase(), deepFreeze(ability));
    }
    for (const [idKey, item] of Object.entries(ITEMS_DATABASE)) {
      const frozenItem = deepFreeze(item);
      this.itemsMap.set(idKey, frozenItem);
      this.itemsMap.set(item.id, frozenItem);
      if (typeof item.id === "number") {
        this.itemsMap.set(item.id.toString(), frozenItem);
      } else {
        const num = Number(item.id);
        if (!isNaN(num)) this.itemsMap.set(num, frozenItem);
      }
      const numKey = Number(idKey);
      if (!isNaN(numKey)) this.itemsMap.set(numKey, frozenItem);
    }
    for (const [idStr, learnset] of Object.entries(LEARNSETS_DATABASE)) {
      this.learnsetsMap.set(Number(idStr), deepFreeze(learnset));
    }
    for (const [idStr, evos] of Object.entries(EVOLUTIONS_DATABASE)) {
      this.evolutionsMap.set(Number(idStr), deepFreeze(evos));
    }
    for (const [idStr, forms] of Object.entries(FORMS_DATABASE)) {
      this.formsMap.set(Number(idStr), deepFreeze(forms));
    }
    deepFreeze(TypeChart);
  }
  validateData() {
    const errors = [];
    const warnings = [];
    const allTypes = Object.values(PokemonType);
    for (const species of this.speciesMap.values()) {
      if (species.id <= 0 || !Number.isInteger(species.id)) {
        errors.push(`Species "${species.name}" has invalid ID #${species.id}`);
      }
      const { hp, attack, defense, specialAttack, specialDefense, speed } = species.baseStats;
      if (hp <= 0 || attack <= 0 || defense <= 0 || specialAttack <= 0 || specialDefense <= 0 || speed <= 0) {
        errors.push(`Species "${species.name}" (#${species.id}) has invalid non-positive base stats`);
      }
      for (const type of species.types) {
        if (!allTypes.includes(type)) {
          errors.push(`Species "${species.name}" (#${species.id}) has invalid type "${type}"`);
        }
      }
      if (!this.abilitiesMap.has(species.abilities.primary.toLowerCase())) {
        errors.push(`Species "${species.name}" (#${species.id}) references missing primary ability "${species.abilities.primary}"`);
      }
      if (species.abilities.secondary && !this.abilitiesMap.has(species.abilities.secondary.toLowerCase())) {
        errors.push(`Species "${species.name}" (#${species.id}) references missing secondary ability "${species.abilities.secondary}"`);
      }
      if (species.abilities.hidden && !this.abilitiesMap.has(species.abilities.hidden.toLowerCase())) {
        errors.push(`Species "${species.name}" (#${species.id}) references missing hidden ability "${species.abilities.hidden}"`);
      }
      const validGrowthRates = ["fast", "medium_fast", "medium_slow", "slow", "erratic", "fluctuating"];
      if (!validGrowthRates.includes(species.growthRate)) {
        errors.push(`Species "${species.name}" (#${species.id}) has invalid growth rate "${species.growthRate}"`);
      }
      if (!this.learnsetsMap.has(species.id) || this.learnsetsMap.get(species.id).length === 0) {
        warnings.push(`Species "${species.name}" (#${species.id}) has no learnset entries defined`);
      }
    }
    for (const move of this.movesMap.values()) {
      if (move.id <= 0 || !Number.isInteger(move.id)) {
        errors.push(`Move "${move.name}" has invalid ID #${move.id}`);
      }
      if (!allTypes.includes(move.type)) {
        errors.push(`Move "${move.name}" (#${move.id}) references invalid type "${move.type}"`);
      }
      if (!["physical", "special", "status"].includes(move.category)) {
        errors.push(`Move "${move.name}" (#${move.id}) has invalid category "${move.category}"`);
      }
      if (move.pp <= 0 || move.maxPp < move.pp) {
        errors.push(`Move "${move.name}" (#${move.id}) has invalid PP values (${move.pp}/${move.maxPp})`);
      }
      if (move.accuracy < 0 || move.accuracy > 100) {
        errors.push(`Move "${move.name}" (#${move.id}) has invalid accuracy value ${move.accuracy}`);
      }
      if (move.priority < -7 || move.priority > 7) {
        errors.push(`Move "${move.name}" (#${move.id}) priority ${move.priority} out of allowed range [-7, 7]`);
      }
    }
    for (const ability of this.abilitiesMap.values()) {
      if (!ability.id || typeof ability.id !== "string") {
        errors.push(`Ability "${ability.name}" has invalid ID string "${ability.id}"`);
      }
    }
    for (const item of this.itemsMap.values()) {
      if (!item.id) {
        errors.push(`Item "${item.name}" has missing ID`);
      }
    }
    for (const [speciesId, forms] of this.formsMap.entries()) {
      if (!this.speciesMap.has(speciesId)) {
        errors.push(`Form references non-existent parent species #${speciesId}`);
      }
      for (const form of forms) {
        if (!this.abilitiesMap.has(form.abilities.primary.toLowerCase())) {
          errors.push(`Form "${form.formName}" for species #${speciesId} references missing primary ability "${form.abilities.primary}"`);
        }
        if (form.abilities.secondary && !this.abilitiesMap.has(form.abilities.secondary.toLowerCase())) {
          errors.push(`Form "${form.formName}" for species #${speciesId} references missing secondary ability "${form.abilities.secondary}"`);
        }
        if (form.abilities.hidden && !this.abilitiesMap.has(form.abilities.hidden.toLowerCase())) {
          errors.push(`Form "${form.formName}" for species #${speciesId} references missing hidden ability "${form.abilities.hidden}"`);
        }
      }
    }
    for (const [speciesId, learnset] of this.learnsetsMap.entries()) {
      if (!this.speciesMap.has(speciesId)) {
        errors.push(`Learnset defined for non-existent species #${speciesId}`);
      }
      const seenMovesAtLevel = /* @__PURE__ */ new Set();
      for (const entry of learnset) {
        if (!this.movesMap.has(entry.moveId)) {
          errors.push(`Learnset for species #${speciesId} references missing move #${entry.moveId}`);
        }
        if (entry.level < 1 || entry.level > 100) {
          errors.push(`Learnset for species #${speciesId} has invalid level requirement ${entry.level}`);
        }
        const key = `${entry.level}:${entry.moveId}`;
        if (seenMovesAtLevel.has(key)) {
          errors.push(`Learnset for species #${speciesId} has duplicate move #${entry.moveId} at level ${entry.level}`);
        }
        seenMovesAtLevel.add(key);
      }
    }
    for (const [speciesId, evos] of this.evolutionsMap.entries()) {
      if (!this.speciesMap.has(speciesId)) {
        errors.push(`Evolution requirement defined for non-existent source species #${speciesId}`);
      }
      for (const evo of evos) {
        if (!this.speciesMap.has(evo.targetSpeciesId)) {
          errors.push(`Evolution requirement for species #${speciesId} references missing target species #${evo.targetSpeciesId}`);
        }
        if (evo.method === "item" && evo.itemId) {
          if (!this.itemsMap.has(evo.itemId) && !this.itemsMap.has(String(evo.itemId))) {
            errors.push(`Evolution requirement for species #${speciesId} references missing evolution item #${evo.itemId}`);
          }
        }
      }
    }
    const detectCycle = (startId, currentId, visited) => {
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      const evos = this.evolutionsMap.get(currentId) ?? [];
      for (const evo of evos) {
        if (detectCycle(startId, evo.targetSpeciesId, new Set(visited))) {
          return true;
        }
      }
      return false;
    };
    for (const speciesId of this.speciesMap.keys()) {
      if (detectCycle(speciesId, speciesId, /* @__PURE__ */ new Set())) {
        errors.push(`Circular evolution chain detected starting at species #${speciesId}`);
      }
    }
    for (const atkType of allTypes) {
      if (!TypeChart[atkType]) {
        errors.push(`TypeChart missing row for attack type "${atkType}"`);
        continue;
      }
      for (const defType of allTypes) {
        const multiplier = TypeChart[atkType][defType];
        if (multiplier === void 0) {
          errors.push(`TypeChart missing matchup for ${atkType} -> ${defType}`);
        } else if (![0, 0.5, 1, 2].includes(multiplier)) {
          errors.push(`TypeChart multiplier ${multiplier} for ${atkType} -> ${defType} is invalid`);
        }
      }
    }
    if (errors.length > 0) {
      throw new Error(`[PokemonRegistry] Validation failed with ${errors.length} errors:
 - ${errors.join("\n - ")}`);
    }
    return { errors, warnings };
  }
  // --- Species Accessors ---
  getSpecies(id) {
    const numericId = typeof id === "number" ? id : parseInt(id, 10);
    return this.speciesMap.get(numericId);
  }
  getAllSpecies() {
    return Array.from(this.speciesMap.values());
  }
  // --- Move Accessors ---
  getMove(id) {
    return this.movesMap.get(id);
  }
  getAllMoves() {
    return Array.from(this.movesMap.values());
  }
  // --- Ability Accessors ---
  getAbility(id) {
    return this.abilitiesMap.get(id.toLowerCase());
  }
  getAllAbilities() {
    return Array.from(this.abilitiesMap.values());
  }
  // --- Item Accessors ---
  getItem(id) {
    return this.itemsMap.get(id);
  }
  getAllItems() {
    return Array.from(new Set(this.itemsMap.values()));
  }
  // --- Learnset Accessors ---
  getLearnset(speciesId) {
    return this.learnsetsMap.get(speciesId) ?? [];
  }
  // --- Evolution Accessors ---
  getEvolution(speciesId) {
    return this.evolutionsMap.get(speciesId) ?? [];
  }
  // --- Form Accessors ---
  getForm(speciesId, formId) {
    const forms = this.formsMap.get(speciesId);
    return forms?.find((f) => f.formId === formId);
  }
  // --- Type Chart Calculators ---
  getTypeEffectiveness(attackType, defendType) {
    return TypeChart[attackType]?.[defendType] ?? 1;
  }
  getDualTypeEffectiveness(attackType, defendTypes) {
    let mult = this.getTypeEffectiveness(attackType, defendTypes[0]);
    if (defendTypes[1] && defendTypes[1] !== defendTypes[0]) {
      mult *= this.getTypeEffectiveness(attackType, defendTypes[1]);
    }
    return mult;
  }
};
var pokemonRegistry = PokemonRegistry.getInstance();

// packages/game-core/battleFormulas/systems/ExperienceCalculator.ts
var ExperienceCalculator = class {
  static getBaseExperienceForLevel(level, growthRate) {
    return getExperienceForLevel(level, growthRate);
  }
  static getExperienceForNextLevel(level, growthRate) {
    if (level >= 100) return 0;
    return getExperienceForLevel(level + 1, growthRate);
  }
  static getLevelForExperience(experience, growthRate) {
    for (let level = 100; level >= 1; level--) {
      if (experience >= getExperienceForLevel(level, growthRate)) {
        return level;
      }
    }
    return 1;
  }
};

// packages/game-core/pokemonData/utils/PokemonConverter.ts
function monsterInstanceToPokemonInstance(mon, options) {
  const existingId = options?.id || mon.id || `mon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const moves = [];
  if (Array.isArray(mon.moves)) {
    for (const m of mon.moves) {
      if (typeof m === "number") {
        const moveData = pokemonRegistry.getMove(m);
        moves.push({
          moveId: m,
          pp: moveData?.pp ?? 35,
          maxPp: moveData?.pp ?? 35
        });
      } else if (m && typeof m === "object" && "moveId" in m) {
        moves.push({
          moveId: m.moveId,
          pp: m.pp ?? 35,
          maxPp: m.maxPp ?? 35
        });
      }
    }
  }
  const species = pokemonRegistry.getSpecies(mon.speciesId);
  let ability = options?.ability || mon.ability;
  if (!ability && species) {
    ability = species.abilities.primary;
  }
  if (!ability) {
    ability = "Overgrow";
  }
  const shiny = options?.shiny ?? mon.shiny ?? false;
  const level = Math.max(1, mon.level ?? 1);
  const exp = mon.experience ?? (species ? ExperienceCalculator.getBaseExperienceForLevel(level, species.growthRate) : 0);
  return {
    id: existingId,
    speciesId: mon.speciesId,
    level,
    experience: exp,
    nature: mon.nature ?? 0,
    ability,
    ivs: mon.ivs || { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    evs: mon.evs || { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    stats: mon.stats || { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
    currentHp: mon.currentHp ?? (mon.stats ? mon.stats.hp : 10),
    friendship: mon.friendship ?? 70,
    heldItemId: mon.heldItemId,
    moves,
    shiny,
    otId: options?.otId || mon.otId || "00000",
    otName: options?.otName || mon.otName || "Wild",
    nickname: mon.nickname,
    status: mon.status ?? 0 /* None */
  };
}
function pokemonInstanceToMonsterInstance(pok) {
  const moveIds = Array.isArray(pok.moves) ? pok.moves.map((m) => typeof m === "number" ? m : m.moveId) : [];
  const species = pokemonRegistry.getSpecies(pok.speciesId);
  const level = pok.level ?? 1;
  return {
    speciesId: pok.speciesId,
    nickname: pok.nickname,
    level,
    ivs: pok.ivs,
    evs: pok.evs,
    nature: pok.nature,
    currentHp: pok.currentHp,
    maxHp: pok.stats ? pok.stats.hp : 10,
    stats: pok.stats,
    moves: moveIds,
    status: pok.status ?? 0 /* None */,
    friendship: pok.friendship ?? 70,
    experience: pok.experience ?? 0,
    experienceToNext: species ? ExperienceCalculator.getExperienceForNextLevel(level, species.growthRate) : 100
  };
}

// packages/game-core/pokemonData/managers/PokemonManager.ts
var PokemonManager = class _PokemonManager {
  static instance = null;
  // Primary Storage
  instances = /* @__PURE__ */ new Map();
  locations = /* @__PURE__ */ new Map();
  wildPokemon = /* @__PURE__ */ new Map();
  // entityId -> WildPokemon
  // Indices for O(1) lookups
  ownerIndex = /* @__PURE__ */ new Map();
  // ownerId -> Set of PokemonInstance IDs
  entityIndex = /* @__PURE__ */ new Map();
  // entityId -> PokemonInstance ID
  partyIndex = /* @__PURE__ */ new Map();
  // ownerId -> Array of PokemonInstance IDs (up to 6)
  pcIndex = /* @__PURE__ */ new Map();
  // ownerId -> boxIndex -> slotIndex -> PokemonInstance ID
  constructor() {
  }
  static getInstance() {
    if (!_PokemonManager.instance) {
      _PokemonManager.instance = new _PokemonManager();
    }
    return _PokemonManager.instance;
  }
  /**
   * Resets the manager state (useful for testing or full reloads)
   */
  reset() {
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
  registerPokemon(instance, location) {
    if (this.instances.has(instance.id)) {
      throw new Error(`Pokemon ID ${instance.id} is already registered.`);
    }
    const species = pokemonRegistry.getSpecies(instance.speciesId);
    if (!species) {
      throw new Error(`Invalid species ID ${instance.speciesId} for Pokemon ${instance.id}`);
    }
    this.validateLocation(instance.id, location);
    this.instances.set(instance.id, instance);
    this.updateLocation(instance.id, location);
  }
  /**
   * Removes a PokemonInstance from the manager completely
   */
  removePokemon(id) {
    if (!this.instances.has(id)) {
      return;
    }
    this.clearLocation(id);
    this.instances.delete(id);
  }
  /**
   * Updates the location and ownership of a registered Pokemon
   */
  updateLocation(id, location) {
    if (!this.instances.has(id)) {
      throw new Error(`Cannot update location for unregistered Pokemon ${id}`);
    }
    this.validateLocation(id, location);
    this.clearLocation(id);
    this.locations.set(id, location);
    if (location.ownerId) {
      let ownerSet = this.ownerIndex.get(location.ownerId);
      if (!ownerSet) {
        ownerSet = /* @__PURE__ */ new Set();
        this.ownerIndex.set(location.ownerId, ownerSet);
      }
      ownerSet.add(id);
      if (location.type === "party" /* Party */ && location.slotIndex !== void 0) {
        let party = this.partyIndex.get(location.ownerId);
        if (!party) {
          party = [null, null, null, null, null, null];
          this.partyIndex.set(location.ownerId, party);
        }
        party[location.slotIndex] = id;
      }
      if (location.type === "pc" /* PC */ && location.boxIndex !== void 0 && location.slotIndex !== void 0) {
        let pcBoxes = this.pcIndex.get(location.ownerId);
        if (!pcBoxes) {
          pcBoxes = /* @__PURE__ */ new Map();
          this.pcIndex.set(location.ownerId, pcBoxes);
        }
        let box = pcBoxes.get(location.boxIndex);
        if (!box) {
          box = /* @__PURE__ */ new Map();
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
  clearLocation(id) {
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
      if (oldLoc.type === "party" /* Party */ && oldLoc.slotIndex !== void 0) {
        const party = this.partyIndex.get(oldLoc.ownerId);
        if (party) {
          party[oldLoc.slotIndex] = null;
        }
      }
      if (oldLoc.type === "pc" /* PC */ && oldLoc.boxIndex !== void 0 && oldLoc.slotIndex !== void 0) {
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
  clearOwnerLocations(ownerId) {
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
  validateLocation(id, location) {
    if (location.type === "wild" /* Wild */ && !location.entityId) {
      throw new Error(`Wild Pokemon location must have an entityId for Pokemon ${id}`);
    }
    if (location.type === "party" /* Party */) {
      if (!location.ownerId) throw new Error(`Party Pokemon must have an ownerId (Pokemon ${id})`);
      if (location.slotIndex === void 0 || location.slotIndex < 0 || location.slotIndex > 5) {
        throw new Error(`Invalid party slot index for Pokemon ${id}`);
      }
      const existingInSlot = this.partyIndex.get(location.ownerId)?.[location.slotIndex];
      if (existingInSlot && existingInSlot !== id) {
        throw new Error(`Duplicate ownership: Slot ${location.slotIndex} in party for ${location.ownerId} is already occupied by ${existingInSlot}`);
      }
    }
    if (location.type === "pc" /* PC */) {
      if (!location.ownerId) throw new Error(`PC Pokemon must have an ownerId (Pokemon ${id})`);
      if (location.boxIndex === void 0 || location.slotIndex === void 0) {
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
  registerWildPokemon(wild) {
    if (!this.instances.has(wild.pokemonInstanceId)) {
      throw new Error(`Cannot register WildPokemon ${wild.entityId}: PokemonInstance ${wild.pokemonInstanceId} is not registered`);
    }
    const loc = this.locations.get(wild.pokemonInstanceId);
    if (!loc || loc.type !== "wild" /* Wild */ || loc.entityId !== wild.entityId) {
      throw new Error(`Invalid world association: PokemonInstance ${wild.pokemonInstanceId} is not correctly linked as Wild to entity ${wild.entityId}`);
    }
    if (this.wildPokemon.has(wild.entityId)) {
      throw new Error(`WildPokemon entity ${wild.entityId} is already registered`);
    }
    this.wildPokemon.set(wild.entityId, wild);
  }
  getWildPokemon(entityId) {
    return this.wildPokemon.get(entityId);
  }
  getAllWildPokemon() {
    return Array.from(this.wildPokemon.values());
  }
  removeWildPokemon(entityId) {
    const wild = this.wildPokemon.get(entityId);
    if (wild) {
      this.removePokemon(wild.pokemonInstanceId);
    }
  }
  // --- Lookups ---
  getPokemonById(id) {
    return this.instances.get(id);
  }
  getLocation(id) {
    return this.locations.get(id);
  }
  getPokemonByOwner(ownerId) {
    const set = this.ownerIndex.get(ownerId);
    if (!set) return [];
    const result = [];
    for (const id of set) {
      const p = this.instances.get(id);
      if (p) result.push(p);
    }
    return result;
  }
  getPokemonByEntityId(entityId) {
    const id = this.entityIndex.get(entityId);
    return id ? this.instances.get(id) : void 0;
  }
  getParty(ownerId) {
    const party = this.partyIndex.get(ownerId);
    if (!party) return [null, null, null, null, null, null];
    return party.map((id) => id ? this.instances.get(id) || null : null);
  }
  getPCBox(ownerId, boxIndex) {
    const boxResult = /* @__PURE__ */ new Map();
    const box = this.pcIndex.get(ownerId)?.get(boxIndex);
    if (box) {
      for (const [slot, id] of box.entries()) {
        const p = this.instances.get(id);
        if (p) boxResult.set(slot, p);
      }
    }
    return boxResult;
  }
  getNearbyWildPokemon(position, radius) {
    const nearby = [];
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
  serialize() {
    return {
      instances: Array.from(this.instances.values()),
      locations: Object.fromEntries(this.locations.entries()),
      wildPokemon: Array.from(this.wildPokemon.values())
    };
  }
  deserialize(data) {
    this.reset();
    for (const inst of data.instances) {
      this.instances.set(inst.id, inst);
    }
    for (const [id, loc] of Object.entries(data.locations)) {
      this.updateLocation(id, loc);
    }
    for (const wild of data.wildPokemon) {
      this.registerWildPokemon(wild);
    }
  }
};

// packages/game-core/pokemonData/managers/PokemonFactory.ts
var PokemonFactory = class {
  static create(params) {
    const species = pokemonRegistry.getSpecies(params.speciesId);
    const id = `mon_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const ability = params.ability || species?.abilities.primary || "Overgrow";
    const baseStats = species?.baseStats || { hp: 10, attack: 10, defense: 10, specialAttack: 10, specialDefense: 10, speed: 10 };
    const hp = baseStats.hp + params.level * 2;
    const stats = {
      hp,
      attack: baseStats.attack + params.level,
      defense: baseStats.defense + params.level,
      spAttack: baseStats.spAttack ?? baseStats.specialAttack ?? 10,
      spDefense: baseStats.spDefense ?? baseStats.specialDefense ?? 10,
      speed: baseStats.speed + params.level
    };
    return {
      id,
      speciesId: params.speciesId,
      level: params.level,
      experience: 0,
      nature: 0,
      ability,
      ivs: { hp: 15, attack: 15, defense: 15, spAttack: 15, spDefense: 15, speed: 15 },
      evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      stats,
      currentHp: hp,
      friendship: 70,
      moves: [{ moveId: 1, pp: 35, maxPp: 35 }],
      shiny: params.shiny ?? false,
      otId: "00000",
      otName: "Wild",
      nickname: params.nickname,
      status: 0 /* None */
    };
  }
};

// packages/game-core/pokemonData/world/WildPokemon.ts
var ENCOUNTER_COOLDOWN_MS = 6e3;
var ENCOUNTER_RESET_DISTANCE = 128;

// packages/game-core/pokemonData/math.ts
function vec2Sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function vec2Length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
function vec2Distance(a, b) {
  return vec2Length(vec2Sub(a, b));
}
function worldToTile(worldX, worldY, tileSize) {
  return { x: Math.floor(worldX / tileSize), y: Math.floor(worldY / tileSize) };
}
function worldToChunk(worldX, worldY, chunkSize, tileSize) {
  const tile = worldToTile(worldX, worldY, tileSize);
  return {
    x: Math.floor(tile.x / chunkSize),
    y: Math.floor(tile.y / chunkSize)
  };
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// packages/world/tiles/TileRegistry.ts
var TileRegistry = class _TileRegistry {
  static instance;
  tiles = /* @__PURE__ */ new Map();
  static getInstance() {
    if (!_TileRegistry.instance) {
      _TileRegistry.instance = new _TileRegistry();
    }
    return _TileRegistry.instance;
  }
  register(tile) {
    const processedTile = {
      ...tile,
      atlas: tile.atlas ?? tile.atlasKey,
      metatileId: tile.metatileId ?? tile.sourceIndex,
      movementCost: tile.movementCost ?? 1,
      animated: tile.animated ?? false,
      encounterTable: tile.encounterTable ?? (tile.encounterType ? `${tile.encounterType}_wild` : void 0)
    };
    this.tiles.set(tile.id, processedTile);
  }
  registerAll(tiles) {
    for (const tile of tiles) {
      this.register(tile);
    }
  }
  get(id) {
    return this.tiles.get(id);
  }
  getAll() {
    return Array.from(this.tiles.values());
  }
  getByCategory(category) {
    return this.getAll().filter((t) => t.category === category);
  }
  isWalkable(id) {
    const tile = this.get(id);
    if (!tile) return false;
    return tile.walkable && !tile.blocksMovement;
  }
  blocksMovement(id) {
    const tile = this.get(id);
    if (!tile) return true;
    return tile.blocksMovement || !tile.walkable;
  }
  getEncounterType(id) {
    const tile = this.get(id);
    return tile?.encounterType ?? null;
  }
  getInteractionType(id) {
    const tile = this.get(id);
    return tile?.interactionType ?? null;
  }
  getMovementCost(id) {
    const tile = this.get(id);
    return tile?.movementCost ?? 1;
  }
  isVerified(id) {
    const tile = this.get(id);
    return tile?.verified ?? false;
  }
  clear() {
    this.tiles.clear();
  }
};
var tileRegistry = TileRegistry.getInstance();

// packages/world/generator/legacyProceduralWorldgen.ts
var TILE_VOID = 0;
var TILE_GRASS = 1;
var TILE_PATH = 2;
var TILE_WATER = 3;
var TILE_MOUNTAIN = 4;
var TILE_TREE = 5;
var TILE_BUILDING_FLOOR = 6;
var TILE_BUILDING_WALL = 7;
var TILE_DOOR = 8;
var TILE_TALL_GRASS = 9;
var TILE_PORTAL = 10;
function hash2D(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + seed * 982451653;
  h = (h ^ h >> 13) * 1274126177;
  h = h ^ h >> 16;
  return (h >>> 0) % 1e5 / 1e5;
}
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}
function smoothstepEdge(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return smoothstep(t);
}
function valueNoise2D(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const v00 = hash2D(xi, yi, seed);
  const v10 = hash2D(xi + 1, yi, seed);
  const v01 = hash2D(xi, yi + 1, seed);
  const v11 = hash2D(xi + 1, yi + 1, seed);
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const top = v00 + (v10 - v00) * u;
  const bottom = v01 + (v11 - v01) * u;
  return top + (bottom - top) * v;
}
function fbm2D(x, y, seed, octaves, baseFreq) {
  let total = 0;
  let amplitude = 1;
  let freq = baseFreq;
  let maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * freq, y * freq, seed + i * 97) * amplitude;
    maxAmp += amplitude;
    amplitude *= 0.5;
    freq *= 2;
  }
  return total / maxAmp;
}
function distanceToCurve(px, py, x0, y0, x1, y1, seed) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x0) * (px - x0) + (py - y0) * (py - y0));
  let t = ((px - x0) * dx + (py - y0) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const warpFreq = 0.015;
  const warpAmp = 3;
  const warpX = Math.sin(t * Math.PI * 2.5 + seed) * warpAmp;
  const warpY = Math.cos(t * Math.PI * 2.5 + seed) * warpAmp;
  const projX = x0 + t * dx + warpX;
  const projY = y0 + t * dy + warpY;
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}
var HeightGenerator = class {
  // NEW: Generates the raw terrain data, completely ignoring towns to prevent recursion loops
  static getBaseElevation(gx, gy, seed, mapId = "route_1") {
    if (mapId === "route_1") {
      const dist = Math.sqrt((gx - 110) ** 2 + (gy - 110) ** 2);
      if (dist < 15) return 0.45;
    } else if (mapId === "route_2") {
      const dist = Math.sqrt((gx - 150) ** 2 + (gy - 130) ** 2);
      if (dist < 15) return 0.68;
    } else if (mapId === "route_3") {
      const dist = Math.sqrt((gx - 130) ** 2 + (gy - 90) ** 2);
      if (dist < 15) {
        const lakeDist = Math.sqrt((gx - 138) ** 2 + (gy - 90) ** 2);
        if (lakeDist < 6) return 0.25;
        return 0.42;
      }
    } else if (mapId === "route_4") {
      const dist = Math.sqrt((gx - 105) ** 2 + (gy - 145) ** 2);
      if (dist < 15) {
        if (dist < 6) return 0.3;
        if (dist < 9) return 0.75;
        return 0.55;
      }
    }
    const base = fbm2D(gx, gy, seed, 4, 0.012);
    const n2 = fbm2D(gx + 500, gy + 500, seed + 123, 3, 0.02);
    const ridge = 1 - Math.abs(n2 * 2 - 1);
    let raw = base;
    if (base > 0.52) {
      raw = base + ridge * 0.25;
    } else {
      raw = Math.pow(base / 0.52, 1.5) * 0.52;
    }
    if (raw > 0.66 && raw < 0.74) {
      raw = 0.68;
    }
    return Math.min(0.99, Math.max(0, raw));
  }
  static getElevation(gx, gy, seed, mapId = "route_1") {
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    if (seed !== 0 && isTownChunk(cx, cy, seed)) {
      return 0.45;
    }
    return this.getBaseElevation(gx, gy, seed, mapId);
  }
};
var MoistureGenerator = class {
  static getMoisture(gx, gy, seed) {
    return fbm2D(gx, gy, seed + 1e3, 3, 0.04);
  }
};
var TemperatureGenerator = class {
  static getTemperature(gx, gy, seed, elevation) {
    const rawTemp = fbm2D(gx, gy, seed + 4e3, 3, 0.025);
    return rawTemp - (elevation - 0.38) * 0.2;
  }
};
var BiomeGenerator = class _BiomeGenerator {
  static determineBiome(elevation, moisture, temp) {
    if (elevation < 0.33) return "lake";
    if (elevation > 0.82) return "ice_peak";
    if (temp < 0.12) return "tundra";
    if (moisture > 0.55) {
      return "forest";
    } else if (moisture < 0.24) {
      return "desert";
    }
    return "plains";
  }
  static getWaterProximity(gx, gy, seed, mapId) {
    for (let r = 1; r <= 4; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const nx = gx + dx;
            const ny = gy + dy;
            const el = HeightGenerator.getBaseElevation(nx, ny, seed, mapId);
            if (el < 0.33 || RiverGenerator.isRawRiverTile(nx, ny, seed, mapId) || PondGenerator.isRawPondTile(nx, ny, seed)) {
              return 5 - r;
            }
          }
        }
      }
    }
    return 0;
  }
  static isBeachTile(gx, gy, seed, mapId = "route_1") {
    const el = HeightGenerator.getBaseElevation(gx, gy, seed, mapId);
    if (el < 0.33 || RiverGenerator.isRawRiverTile(gx, gy, seed, mapId) || PondGenerator.isRawPondTile(gx, gy, seed)) {
      return false;
    }
    const prox = _BiomeGenerator.getWaterProximity(gx, gy, seed, mapId);
    if (prox === 0) return false;
    const beachNoise = fbm2D(gx * 0.15, gy * 0.15, seed + 7777, 2, 0.08);
    if (prox >= 4) return true;
    if (prox === 3 && beachNoise > 0.3) return true;
    if (prox === 2 && beachNoise > 0.55) return true;
    if (prox === 1 && beachNoise > 0.8) return true;
    return false;
  }
  static isNearWater(gx, gy, seed, mapId) {
    return _BiomeGenerator.isBeachTile(gx, gy, seed, mapId);
  }
};
var RiverGenerator = class {
  static pathCache = {};
  static getRiverPath(seed, mapId) {
    const cacheKey = `${seed}_${mapId}`;
    if (this.pathCache[cacheKey]) {
      return this.pathCache[cacheKey];
    }
    let sx = 64;
    let sy = 64;
    let maxEl = -1;
    for (let x = 40; x < 210; x += 24) {
      for (let y = 40; y < 210; y += 24) {
        const el = HeightGenerator.getBaseElevation(x, y, seed, mapId);
        if (el > maxEl && el > 0.6) {
          maxEl = el;
          sx = x;
          sy = y;
        }
      }
    }
    const path4 = [];
    let cx = sx;
    let cy = sy;
    const visited = /* @__PURE__ */ new Set();
    const maxLen = 140;
    for (let step = 0; step < maxLen; step++) {
      const currentEl = HeightGenerator.getBaseElevation(cx, cy, seed, mapId);
      path4.push({ x: cx, y: cy, el: currentEl });
      visited.add(`${cx},${cy}`);
      let minEl = currentEl;
      let bestDirs = [];
      const dirs = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ];
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (visited.has(`${nx},${ny}`)) continue;
        const nel = HeightGenerator.getBaseElevation(nx, ny, seed, mapId);
        if (nel < minEl) {
          minEl = nel;
          bestDirs = [[dx, dy]];
        } else if (nel === minEl && minEl < currentEl) {
          bestDirs.push([dx, dy]);
        }
      }
      if (bestDirs.length > 0) {
        const h = hash2D(cx, cy, seed + step);
        const chosen = bestDirs[Math.floor(h * bestDirs.length)];
        cx += chosen[0];
        cy += chosen[1];
        if (minEl < 0.33) {
          path4.push({ x: cx, y: cy, el: minEl });
          break;
        }
      } else {
        let escapeDir = null;
        let lowestNeigh = 999;
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (visited.has(`${nx},${ny}`)) continue;
          const nel = HeightGenerator.getBaseElevation(nx, ny, seed, mapId);
          if (nel < lowestNeigh) {
            lowestNeigh = nel;
            escapeDir = [dx, dy];
          }
        }
        if (escapeDir) {
          cx += escapeDir[0];
          cy += escapeDir[1];
        } else {
          break;
        }
      }
    }
    this.pathCache[cacheKey] = path4;
    return path4;
  }
  static isRawRiverTile(gx, gy, seed, mapId) {
    if (mapId === "city") return false;
    const path4 = this.getRiverPath(seed, mapId);
    if (path4.length === 0) return false;
    for (let i = 0; i < path4.length; i++) {
      const pt = path4[i];
      const dx = gx - pt.x;
      const dy = gy - pt.y;
      if (Math.abs(dx) <= 6 && Math.abs(dy) <= 6) {
        const t = i / path4.length;
        const width = 1.2 + t * 2.2;
        const distSq = dx * dx + dy * dy;
        if (distSq < width * width) {
          if (width > 2) {
            const islandNoise = hash2D(gx, gy, seed + 2e4);
            if (islandNoise > 0.85) {
              return false;
            }
          }
          return true;
        }
      }
    }
    return false;
  }
  static isRiverTile(gx, gy, seed, mapId) {
    if (mapId === "city") return false;
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    if (seed !== 0 && isTownChunk(cx, cy, seed)) {
      return false;
    }
    return this.isRawRiverTile(gx, gy, seed, mapId);
  }
};
var LakeGenerator = class {
  static isLakeTile(elevation, gx, gy, seed) {
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    if (seed !== 0 && isTownChunk(cx, cy, seed)) {
      return false;
    }
    const warpX = fbm2D(gx * 0.08, gy * 0.08, seed + 8500, 2, 0.1) * 6;
    const warpY = fbm2D(gx * 0.08, gy * 0.08, seed + 9500, 2, 0.1) * 6;
    const shoreNoise = fbm2D((gx + warpX) * 0.12, (gy + warpY) * 0.12, seed + 8e3, 3, 0.06) * 0.08;
    const threshold = 0.34 + shoreNoise;
    if (elevation < threshold) {
      const islandNoise = fbm2D(gx * 0.15, gy * 0.15, seed + 900, 2, 0.08);
      if (islandNoise > 0.7 && elevation > threshold - 0.08) {
        return false;
      }
      return true;
    }
    return false;
  }
};
var PondGenerator = class {
  static getRawTile(gx, gy, seed) {
    const cellX = Math.floor(gx / 18);
    const cellY = Math.floor(gy / 18);
    for (let cx = cellX - 1; cx <= cellX + 1; cx++) {
      for (let cy = cellY - 1; cy <= cellY + 1; cy++) {
        const hash = hash2D(cx, cy, seed + 1500);
        if (hash > 0.93) {
          const px = cx * 18 + 5 + Math.floor(hash * 100 % 8);
          const py = cy * 18 + 5 + Math.floor(hash * 1e3 % 8);
          const dx = gx - px;
          const dy = gy - py;
          const r = 2.1 + hash * 10 % 1.5;
          const noise = valueNoise2D(gx * 0.4, gy * 0.4, seed + 1600) * 1.2;
          if (dx * dx + dy * dy < (r + noise) * (r + noise)) {
            return TILE_WATER;
          }
        }
      }
    }
    return null;
  }
  static getTile(gx, gy, seed) {
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    if (seed !== 0 && isTownChunk(cx, cy, seed)) {
      return null;
    }
    return this.getRawTile(gx, gy, seed);
  }
  static isRawPondTile(gx, gy, seed) {
    return this.getRawTile(gx, gy, seed) !== null;
  }
  static isPondTile(gx, gy, seed) {
    return this.getTile(gx, gy, seed) !== null;
  }
};
var BeachGenerator = class {
  static getTile(gx, gy, seed, isNearWater, mapId = "city") {
    if (!isNearWater) return null;
    const h = hash2D(gx, gy, seed + 3500);
    if (h < 0.15) {
      return TILE_TALL_GRASS;
    }
    return null;
  }
};
var CliffGenerator = class {
  static getTile(gx, gy, seed, elevation, southElevation, mapId = "route_1") {
    if (elevation < 0.65) return null;
    if (RoadGenerator.isNearRoad(gx, gy, seed, mapId)) return null;
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    if (seed !== 0 && isTownChunk(cx, cy, seed)) return null;
    if (RiverGenerator.isRawRiverTile(gx, gy, seed, mapId) || PondGenerator.isRawPondTile(gx, gy, seed) || LakeGenerator.isLakeTile(elevation, gx, gy, seed)) {
      return null;
    }
    const diffSouth = elevation - southElevation;
    if (diffSouth >= 0.08) {
      return TILE_MOUNTAIN;
    }
    const westElevation = HeightGenerator.getBaseElevation(gx - 1, gy, seed, mapId);
    const eastElevation = HeightGenerator.getBaseElevation(gx + 1, gy, seed, mapId);
    if (elevation - westElevation >= 0.08 || elevation - eastElevation >= 0.08) {
      const cliffNoise = fbm2D(gx * 0.1, gy * 0.1, seed + 999, 2, 0.1);
      if (cliffNoise > 0.45) {
        return TILE_MOUNTAIN;
      }
    }
    return null;
  }
};
var RoadWaypoints = class {
  static cache = {};
  static getWaypoints(p0, p1, seed, mapId) {
    const key = `${seed}_${mapId}`;
    if (this.cache[key]) {
      return this.cache[key];
    }
    const pts = [p0];
    const segments = 3;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const bx = p0.x + t * (p1.x - p0.x);
      const by = p0.y + t * (p1.y - p0.y);
      let bestX = bx;
      let bestY = by;
      let bestScore = -999999;
      const hash = hash2D(Math.floor(bx), Math.floor(by), seed + i * 100);
      for (let angleIdx = 0; angleIdx < 8; angleIdx++) {
        const angle = angleIdx / 8 * Math.PI * 2 + hash * 0.5;
        const radius = 15 + hash * 10;
        const cx = Math.floor(bx + Math.cos(angle) * radius);
        const cy = Math.floor(by + Math.sin(angle) * radius);
        if (cx < 10 || cx > 245 || cy < 10 || cy > 245) continue;
        const el = HeightGenerator.getBaseElevation(cx, cy, seed, mapId);
        const isRiver = RiverGenerator.isRawRiverTile(cx, cy, seed, mapId);
        let score = 0;
        if (isRiver) score -= 300;
        if (el < 0.33) score -= 250;
        if (el > 0.58) score -= 200;
        const elDiff = Math.abs(el - 0.45);
        score -= elDiff * 80;
        if (score > bestScore) {
          bestScore = score;
          bestX = cx;
          bestY = cy;
        }
      }
      pts.push({ x: bestX, y: bestY });
    }
    pts.push(p1);
    this.cache[key] = pts;
    return pts;
  }
};
var RoadGenerator = class _RoadGenerator {
  static townListCache = {};
  static getTownChunksForSeed(seed) {
    if (this.townListCache[seed]) return this.townListCache[seed];
    const towns = [];
    for (let cx = 0; cx < 16; cx++) {
      for (let cy = 0; cy < 16; cy++) {
        if (isTownChunk(cx, cy, seed)) {
          towns.push({ cx, cy });
        }
      }
    }
    this.townListCache[seed] = towns;
    return towns;
  }
  // Pre-computed road distance cache to avoid O(n) distance checks per tile
  static roadDistanceCache = {};
  static getTile(gx, gy, seed, mapId = "city", elevation = 0.5) {
    if (mapId === "city") return null;
    const cacheKey = `${seed}_${mapId}_${gx}_${gy}`;
    if (this.roadDistanceCache[cacheKey] !== void 0) {
      const minDist2 = this.roadDistanceCache[cacheKey];
      if (minDist2 < 1.5) {
        if (elevation < 0.33 || RiverGenerator.isRawRiverTile(gx, gy, seed, mapId) || PondGenerator.isRawPondTile(gx, gy, seed)) {
          return TILE_BUILDING_FLOOR;
        }
        return TILE_PATH;
      }
      return null;
    }
    let p0 = { x: 127, y: 244 };
    let p1 = { x: 127, y: 128 };
    if (mapId === "route_1") {
      p0 = { x: 127, y: 244 };
      p1 = { x: 110, y: 110 };
    } else if (mapId === "route_2") {
      p0 = { x: 127, y: 12 };
      p1 = { x: 150, y: 130 };
    } else if (mapId === "route_3") {
      p0 = { x: 12, y: 121 };
      p1 = { x: 130, y: 90 };
    } else if (mapId === "route_4") {
      p0 = { x: 244, y: 121 };
      p1 = { x: 105, y: 145 };
    } else {
      return null;
    }
    const highwayWaypoints = RoadWaypoints.getWaypoints(p0, p1, seed, mapId);
    let minDist = 999999;
    for (let i = 0; i < highwayWaypoints.length - 1; i++) {
      const d = distanceToCurve(gx, gy, highwayWaypoints[i].x, highwayWaypoints[i].y, highwayWaypoints[i + 1].x, highwayWaypoints[i + 1].y, seed + i);
      if (d < minDist) {
        minDist = d;
      }
    }
    if (seed !== 0) {
      const towns = this.getTownChunksForSeed(seed);
      for (const town of towns) {
        const tx = town.cx * 16 + 7;
        const ty = town.cy * 16 + 7;
        const t0Pts = RoadWaypoints.getWaypoints(p0, { x: tx, y: ty }, seed, `${mapId}_town_0_${town.cx}_${town.cy}`);
        for (let i = 0; i < t0Pts.length - 1; i++) {
          const d = distanceToCurve(gx, gy, t0Pts[i].x, t0Pts[i].y, t0Pts[i + 1].x, t0Pts[i + 1].y, seed + i + 10);
          if (d < minDist) {
            minDist = d;
          }
        }
        const t1Pts = RoadWaypoints.getWaypoints({ x: tx, y: ty }, p1, seed, `${mapId}_town_1_${town.cx}_${town.cy}`);
        for (let i = 0; i < t1Pts.length - 1; i++) {
          const d = distanceToCurve(gx, gy, t1Pts[i].x, t1Pts[i].y, t1Pts[i + 1].x, t1Pts[i + 1].y, seed + i + 20);
          if (d < minDist) {
            minDist = d;
          }
        }
      }
    }
    this.roadDistanceCache[cacheKey] = minDist;
    if (minDist < 1.5) {
      if (elevation < 0.33 || RiverGenerator.isRawRiverTile(gx, gy, seed, mapId) || PondGenerator.isRawPondTile(gx, gy, seed)) {
        return TILE_BUILDING_FLOOR;
      }
      return TILE_PATH;
    }
    return null;
  }
  static isNearRoad(gx, gy, seed, mapId) {
    const cacheKey = `${seed}_${mapId}_${gx}_${gy}`;
    if (_RoadGenerator.roadDistanceCache[cacheKey] !== void 0) {
      return _RoadGenerator.roadDistanceCache[cacheKey] < 1.5;
    }
    const result = _RoadGenerator.getTile(gx, gy, seed, mapId) !== null;
    return result;
  }
};
var LandmarkGenerator = class {
  static getTile(gx, gy, seed, mapId) {
    if (mapId === "route_1") {
      const lx = 110;
      const ly = 110;
      const dx = gx - lx;
      const dy = gy - ly;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      if (dist <= 4) {
        if (dist === 4) {
          if (Math.abs(dx) === 4 && Math.abs(dy) === 4) return TILE_MOUNTAIN;
          return TILE_PATH;
        }
        if (dx === 0 && dy === 0) return TILE_PORTAL;
        if (dist === 1) return TILE_PATH;
        if (dist === 2) {
          if (hash2D(gx, gy, seed) > 0.4) return TILE_PATH;
          return TILE_TALL_GRASS;
        }
        return TILE_PATH;
      }
    } else if (mapId === "route_2") {
      const lx = 150;
      const ly = 130;
      const dx = gx - lx;
      const dy = gy - ly;
      const distSq = dx * dx + dy * dy;
      if (distSq <= 16) {
        return TILE_PATH;
      }
    } else if (mapId === "route_3") {
      const lx = 130;
      const ly = 90;
      const dx = gx - lx;
      const dy = gy - ly;
      if (dx >= -3 && dx <= 3 && dy >= -2 && dy <= 2) {
        return TILE_PATH;
      }
    } else if (mapId === "route_4") {
      const lx = 105;
      const ly = 145;
      const dx = gx - lx;
      const dy = gy - ly;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 8) {
        if (dist > 7) return TILE_MOUNTAIN;
        if (dist < 3) {
          if (dx === 0 && dy === 0) return TILE_PORTAL;
          return TILE_VOID;
        }
        if (hash2D(gx, gy, seed) > 0.55) return TILE_WATER;
        return TILE_TALL_GRASS;
      }
    }
    return null;
  }
};
var VegetationGenerator = class {
  static getTile(gx, gy, seed, moisture, biomeId, mapId = "route_1") {
    if (RoadGenerator.isNearRoad(gx, gy, seed, mapId)) return null;
    const forestNoise = fbm2D(gx, gy, seed + 1200, 3, 0.04);
    const detailNoise = valueNoise2D(gx * 0.6, gy * 0.6, seed + 3e3);
    if (biomeId === "forest") {
      if (forestNoise > 0.55) {
        if (detailNoise < 0.22) {
          return TILE_TALL_GRASS;
        }
        return TILE_TREE;
      }
      if (forestNoise > 0.38) {
        if (detailNoise > 0.45) return TILE_TREE;
        if (detailNoise < 0.25) return TILE_TALL_GRASS;
        return TILE_GRASS;
      }
      if (forestNoise > 0.25) {
        if (detailNoise > 0.65) return TILE_TREE;
        if (detailNoise > 0.4) return TILE_TALL_GRASS;
      }
      return TILE_GRASS;
    }
    if (biomeId === "plains") {
      if (forestNoise > 0.45 && detailNoise > 0.75) {
        return TILE_TREE;
      }
      if (detailNoise > 0.8) {
        return TILE_TALL_GRASS;
      }
    }
    return null;
  }
};
function getBiomeAt(gx, gy, seed, mapId = "route_1") {
  const cacheKey = `${seed}_${mapId}_${gx}_${gy}`;
  if (biomeCache[cacheKey]) return biomeCache[cacheKey];
  if (seed === 0) {
    const biome = {
      id: "city",
      name: "Permanent City",
      bgColor: "#e2d6b5",
      grassColor: "#60a050",
      treeColor: "#1d4a0e",
      tallGrassColor: "#4d8a3e"
    };
    biomeCache[cacheKey] = biome;
    return biome;
  }
  if (gx <= 3 || gx >= 252 || gy <= 3 || gy >= 252) {
    const biome = {
      id: "forest",
      name: "Ancient Grove",
      bgColor: "#3a7c2f",
      grassColor: "#4a8c3f",
      treeColor: "#1a4a0e",
      tallGrassColor: "#2d5a1e"
    };
    biomeCache[cacheKey] = biome;
    return biome;
  }
  const landmark = LandmarkGenerator.getTile(gx, gy, seed, mapId);
  if (landmark !== null) {
    if (landmark === TILE_WATER) {
      const biome = {
        id: "lake",
        name: "Cerulean Lake",
        bgColor: "#3b6fa0",
        grassColor: "#3b6fa0",
        treeColor: "#1d4a0e",
        tallGrassColor: "#4d8a3e"
      };
      biomeCache[cacheKey] = biome;
      return biome;
    }
    if (landmark === TILE_MOUNTAIN) {
      const biome = {
        id: "ice_peak",
        name: "Frozen Summit",
        bgColor: "#c9dbe8",
        grassColor: "#dbe9f2",
        treeColor: "#4a6b7a",
        tallGrassColor: "#a8c8d8"
      };
      biomeCache[cacheKey] = biome;
      return biome;
    }
  }
  const isRiver = RiverGenerator.isRawRiverTile(gx, gy, seed, mapId);
  const isPond = PondGenerator.isRawPondTile(gx, gy, seed);
  const elevation = HeightGenerator.getBaseElevation(gx, gy, seed, mapId);
  if (isRiver || isPond || LakeGenerator.isLakeTile(elevation, gx, gy, seed)) {
    const biome = {
      id: "lake",
      name: "Cerulean Lake",
      bgColor: "#3b6fa0",
      grassColor: "#3b6fa0",
      treeColor: "#1d4a0e",
      tallGrassColor: "#4d8a3e"
    };
    biomeCache[cacheKey] = biome;
    return biome;
  }
  if (BiomeGenerator.isBeachTile(gx, gy, seed, mapId)) {
    const biome = {
      id: "desert",
      name: "Sandy Beach",
      bgColor: "#d8c292",
      grassColor: "#e4d2a3",
      treeColor: "#c29b53",
      tallGrassColor: "#b59247"
    };
    biomeCache[cacheKey] = biome;
    return biome;
  }
  const moisture = MoistureGenerator.getMoisture(gx, gy, seed);
  const temp = TemperatureGenerator.getTemperature(gx, gy, seed, elevation);
  const biomeId = BiomeGenerator.determineBiome(elevation, moisture, temp);
  const MOUNTAIN_THRESHOLD = 0.82;
  const mountainFactor = smoothstepEdge(MOUNTAIN_THRESHOLD - 0.09, MOUNTAIN_THRESHOLD, elevation);
  const coldFactor = 1 - smoothstepEdge(0.08, 0.2, temp);
  const cDesertBg = "#d8c292";
  const cDesertGrass = "#e4d2a3";
  const cDesertTree = "#c29b53";
  const cDesertTallGrass = "#b59247";
  const cPlainsBg = "#5c9c4f";
  const cPlainsGrass = "#4a8c3f";
  const cPlainsTree = "#2d5a1e";
  const cPlainsTallGrass = "#3a7c2f";
  const cForestBg = "#3a7c2f";
  const cForestGrass = "#4a8c3f";
  const cForestTree = "#1a4a0e";
  const cForestTallGrass = "#2d5a1e";
  let normalBg = cPlainsBg, normalGrass = cPlainsGrass, normalTree = cPlainsTree, normalTallGrass = cPlainsTallGrass;
  if (moisture <= 0.22) {
    normalBg = cDesertBg;
    normalGrass = cDesertGrass;
    normalTree = cDesertTree;
    normalTallGrass = cDesertTallGrass;
  } else if (moisture >= 0.58) {
    normalBg = cForestBg;
    normalGrass = cForestGrass;
    normalTree = cForestTree;
    normalTallGrass = cForestTallGrass;
  } else if (moisture < 0.38) {
    const t = (moisture - 0.22) / (0.38 - 0.22);
    normalBg = lerpColor(cDesertBg, cPlainsBg, t);
    normalGrass = lerpColor(cDesertGrass, cPlainsGrass, t);
    normalTree = lerpColor(cDesertTree, cPlainsTree, t);
    normalTallGrass = lerpColor(cDesertTallGrass, cPlainsTallGrass, t);
  } else if (moisture < 0.42) {
  } else {
    const t = (moisture - 0.42) / (0.58 - 0.42);
    normalBg = lerpColor(cPlainsBg, cForestBg, t);
    normalGrass = lerpColor(cPlainsGrass, cForestGrass, t);
    normalTree = lerpColor(cPlainsTree, cForestTree, t);
    normalTallGrass = lerpColor(cPlainsTallGrass, cForestTallGrass, t);
  }
  const tunBg = "#e2edf2", tunGrass = "#eef5f8", tunTree = "#6b8a9a", tunTallGrass = "#b8d4e0";
  const iceBg = "#c9dbe8", iceGrass = "#dbe9f2", iceTree = "#4a6b7a", iceTallGrass = "#a8c8d8";
  const elevBg = lerpColor(normalBg, iceBg, mountainFactor);
  const elevGrass = lerpColor(normalGrass, iceGrass, mountainFactor);
  const elevTree = lerpColor(normalTree, iceTree, mountainFactor);
  const elevTallGrass = lerpColor(normalTallGrass, iceTallGrass, mountainFactor);
  const bgColor = lerpColor(elevBg, tunBg, coldFactor);
  const grassColor = lerpColor(elevGrass, tunGrass, coldFactor);
  const treeColor = lerpColor(elevTree, tunTree, coldFactor);
  const tallGrassColor = lerpColor(elevTallGrass, tunTallGrass, coldFactor);
  const result = {
    id: biomeId,
    name: biomeId === "forest" ? "Ancient Grove" : biomeId === "desert" ? "Sandy Wasteland" : biomeId === "ice_peak" ? "Frozen Summit" : biomeId === "tundra" ? "Frostbound Tundra" : "Grassland Plains",
    bgColor,
    grassColor,
    treeColor,
    tallGrassColor
  };
  biomeCache[cacheKey] = result;
  return result;
}
function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.substring(1, 3), 16);
  const g1 = parseInt(c1.substring(3, 5), 16);
  const b1 = parseInt(c1.substring(5, 7), 16);
  const r2 = parseInt(c2.substring(1, 3), 16);
  const g2 = parseInt(c2.substring(3, 5), 16);
  const b2 = parseInt(c2.substring(5, 7), 16);
  const r = Math.round(r1 + t * (r2 - r1));
  const g = Math.round(g1 + t * (g2 - g1));
  const b = Math.round(b1 + t * (b2 - b1));
  const rs = Math.min(255, Math.max(0, r)).toString(16).padStart(2, "0");
  const gs = Math.min(255, Math.max(0, g)).toString(16).padStart(2, "0");
  const bs = Math.min(255, Math.max(0, b)).toString(16).padStart(2, "0");
  return `#${rs}${gs}${bs}`;
}
function getCityTile(gx, gy) {
  const cityMinX = 105;
  const cityMaxX = 149;
  const cityMinY = 95;
  const cityMaxY = 149;
  const isInsideCity = gx >= cityMinX && gx <= cityMaxX && gy >= cityMinY && gy <= cityMaxY;
  if (!isInsideCity) {
    return TILE_TREE;
  }
  if (gx >= 126 && gx <= 128 && gy >= 95 && gy <= 97) {
    if (gx === 127 && gy === 96) return TILE_PORTAL;
    return TILE_PATH;
  }
  if (gx >= 126 && gx <= 128 && gy >= 147 && gy <= 149) {
    if (gx === 127 && gy === 148) return TILE_PORTAL;
    return TILE_PATH;
  }
  if (gx >= 147 && gx <= 149 && gy >= 120 && gy <= 122) {
    if (gx === 148 && gy === 121) return TILE_PORTAL;
    return TILE_PATH;
  }
  if (gx >= 105 && gx <= 107 && gy >= 120 && gy <= 122) {
    if (gx === 106 && gy === 121) return TILE_PORTAL;
    return TILE_PATH;
  }
  const isMainRoad = gy >= 118 && gy <= 124 || gx >= 124 && gx <= 130;
  if (isMainRoad) return TILE_PATH;
  if (isInsideCity) {
    const isNearStructure = gx >= 105 && gx <= 125 && gy >= 96 && gy <= 148 || gx >= 129 && gx <= 148 && gy >= 96 && gy <= 148 || gx >= 122 && gx <= 132 && gy >= 109 && gy <= 117;
    if (!isNearStructure) {
      if (hash2D(gx, gy, 888) > 0.72) {
        return TILE_TREE;
      }
    }
  }
  return TILE_GRASS;
}
function getRouteOutpostTile(gx, gy, mapId = "city") {
  if (mapId === "route_1") {
    if (gx >= 126 && gx <= 128 && gy >= 243 && gy <= 245) {
      if (gx === 127 && gy === 244) return TILE_PORTAL;
      return TILE_PATH;
    }
  } else if (mapId === "route_2") {
    if (gx >= 126 && gx <= 128 && gy >= 11 && gy <= 13) {
      if (gx === 127 && gy === 12) return TILE_PORTAL;
      return TILE_PATH;
    }
  } else if (mapId === "route_3") {
    if (gx >= 11 && gx <= 13 && gy >= 120 && gy <= 122) {
      if (gx === 12 && gy === 121) return TILE_PORTAL;
      return TILE_PATH;
    }
  } else if (mapId === "route_4") {
    if (gx >= 243 && gx <= 245 && gy >= 120 && gy <= 122) {
      if (gx === 244 && gy === 121) return TILE_PORTAL;
      return TILE_PATH;
    }
  }
  return null;
}
var rawTerrainCache = {};
var biomeCache = {};
function rawTerrainTile(gx, gy, seed, mapId = "city") {
  const cacheKey = `${seed}_${mapId}_${gx}_${gy}`;
  if (rawTerrainCache[cacheKey] !== void 0) {
    return rawTerrainCache[cacheKey];
  }
  if (seed === 0) {
    return getCityTile(gx, gy);
  }
  if (gx <= 3 || gx >= 252 || gy <= 3 || gy >= 252) {
    return TILE_TREE;
  }
  const outpostTile = getRouteOutpostTile(gx, gy, mapId);
  if (outpostTile !== null) {
    rawTerrainCache[cacheKey] = outpostTile;
    return outpostTile;
  }
  const landmarkTile = LandmarkGenerator.getTile(gx, gy, seed, mapId);
  if (landmarkTile !== null) {
    rawTerrainCache[cacheKey] = landmarkTile;
    return landmarkTile;
  }
  const elevation = HeightGenerator.getBaseElevation(gx, gy, seed, mapId);
  const moisture = MoistureGenerator.getMoisture(gx, gy, seed);
  const temp = TemperatureGenerator.getTemperature(gx, gy, seed, elevation);
  const biomeId = BiomeGenerator.determineBiome(elevation, moisture, temp);
  const isRiver = RiverGenerator.isRawRiverTile(gx, gy, seed, mapId);
  if (isRiver) {
    rawTerrainCache[cacheKey] = TILE_WATER;
    return TILE_WATER;
  }
  if (LakeGenerator.isLakeTile(elevation, gx, gy, seed)) {
    rawTerrainCache[cacheKey] = TILE_WATER;
    return TILE_WATER;
  }
  const pondTile = PondGenerator.getRawTile(gx, gy, seed);
  if (pondTile !== null) {
    rawTerrainCache[cacheKey] = pondTile;
    return pondTile;
  }
  const nearWater = BiomeGenerator.isBeachTile(gx, gy, seed, mapId);
  if (nearWater) {
    const beachTile = BeachGenerator.getTile(gx, gy, seed, true);
    if (beachTile !== null) {
      rawTerrainCache[cacheKey] = beachTile;
      return beachTile;
    }
    rawTerrainCache[cacheKey] = TILE_GRASS;
    return TILE_GRASS;
  }
  const southElevation = HeightGenerator.getBaseElevation(gx, gy + 1, seed, mapId);
  const cliffTile = CliffGenerator.getTile(gx, gy, seed, elevation, southElevation);
  if (cliffTile !== null) {
    rawTerrainCache[cacheKey] = cliffTile;
    return cliffTile;
  }
  const roadTile = RoadGenerator.getTile(gx, gy, seed, mapId, elevation);
  if (roadTile !== null) {
    rawTerrainCache[cacheKey] = roadTile;
    return roadTile;
  }
  const vegTile = VegetationGenerator.getTile(gx, gy, seed, moisture, biomeId);
  if (vegTile !== null) {
    rawTerrainCache[cacheKey] = vegTile;
    return vegTile;
  }
  const g = hash2D(gx, gy, seed + 4e3);
  if (g > 0.72) {
    rawTerrainCache[cacheKey] = TILE_TALL_GRASS;
    return TILE_TALL_GRASS;
  }
  rawTerrainCache[cacheKey] = TILE_GRASS;
  return TILE_GRASS;
}
function getTownSuitability(cx, cy, seed) {
  const tx = cx * 16 + 7;
  const ty = cy * 16 + 7;
  const samples = [
    [tx, ty],
    [cx * 16 + 4, cy * 16 + 4],
    [cx * 16 + 11, cy * 16 + 4],
    [cx * 16 + 4, cy * 16 + 11],
    [cx * 16 + 11, cy * 16 + 11]
  ];
  let score = 100;
  for (const [sx, sy] of samples) {
    const el = HeightGenerator.getBaseElevation(sx, sy, seed);
    if (el < 0.33) {
      score -= 150;
    }
    if (el > 0.58) {
      score -= 100;
    }
    if (RiverGenerator.isRawRiverTile(sx, sy, seed, "route_1")) {
      score -= 150;
    }
    if (PondGenerator.isRawPondTile(sx, sy, seed)) {
      score -= 150;
    }
  }
  return score;
}
var townChunkCellCache = {};
function townChunkForCell(cellX, cellY, seed) {
  const cacheKey = `${cellX}_${cellY}_${seed}`;
  if (townChunkCellCache[cacheKey]) return townChunkCellCache[cacheKey];
  let bestCx = NaN;
  let bestCy = NaN;
  let maxScore = -999999;
  for (let cand = 0; cand < 5; cand++) {
    const hx = hash2D(cellX, cellY, seed + 5e3 + cand);
    const hy = hash2D(cellX, cellY, seed + 6e3 + cand);
    const cx = cellX * TOWN_CHUNK_SPACING + Math.floor(hx * TOWN_CHUNK_SPACING);
    const cy = cellY * TOWN_CHUNK_SPACING + Math.floor(hy * TOWN_CHUNK_SPACING);
    if (cx < 1 || cx >= 15 || cy < 1 || cy >= 15) continue;
    const score = getTownSuitability(cx, cy, seed);
    if (score > maxScore) {
      maxScore = score;
      bestCx = cx;
      bestCy = cy;
    }
  }
  const result = { cx: bestCx, cy: bestCy };
  townChunkCellCache[cacheKey] = result;
  return result;
}
function isTownChunk(cx, cy, seed) {
  if (seed === 0) return false;
  const cellX = Math.floor(cx / TOWN_CHUNK_SPACING);
  const cellY = Math.floor(cy / TOWN_CHUNK_SPACING);
  const town = townChunkForCell(cellX, cellY, seed);
  return town.cx === cx && town.cy === cy;
}
function stampTown(tiles, cx, cy, seed) {
  const townHash = hash2D(cx, cy, seed + 12e3);
  const townType = Math.floor(townHash * 3);
  for (let y = 1; y <= 14; y++) {
    for (let x = 1; x <= 14; x++) {
      tiles[y][x] = TILE_GRASS;
    }
  }
  for (let i = 0; i < 16; i++) {
    tiles[7][i] = TILE_PATH;
    tiles[i][7] = TILE_PATH;
  }
  if (townType === 0) {
    for (let y = 1; y <= 14; y++) {
      if (y === 7) continue;
      for (let x = 12; x <= 14; x++) {
        tiles[y][x] = TILE_WATER;
      }
    }
    for (let x = 8; x <= 14; x++) {
      tiles[7][x] = TILE_PATH;
    }
    tiles[6][3] = TILE_PATH;
    for (let y = 8; y <= 13; y++) {
      tiles[y][3] = TILE_PATH;
    }
    tiles[2][8] = TILE_TREE;
    tiles[13][8] = TILE_TREE;
    tiles[3][10] = TILE_TALL_GRASS;
    tiles[11][10] = TILE_TALL_GRASS;
  } else if (townType === 1) {
    tiles[6][3] = TILE_PATH;
    tiles[5][10] = TILE_PATH;
    tiles[6][10] = TILE_PATH;
    tiles[10][9] = TILE_TREE;
    tiles[11][13] = TILE_TREE;
    tiles[13][10] = TILE_TREE;
    tiles[13][13] = TILE_TREE;
  } else {
    tiles[6][4] = TILE_PATH;
    for (let y = 8; y <= 12; y++) {
      tiles[y][10] = TILE_PATH;
    }
    for (let y = 3; y <= 5; y++) {
      for (let x = 9; x <= 11; x++) {
        tiles[y][x] = TILE_PATH;
      }
    }
    tiles[4][10] = TILE_PORTAL;
    tiles[12][4] = TILE_TALL_GRASS;
  }
}
function generateChunkTiles(cx, cy, seed, mapId = "city") {
  const tiles = [];
  for (let y = 0; y < CHUNK_SIZE; y++) {
    tiles[y] = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const gx = cx * CHUNK_SIZE + x;
      const gy = cy * CHUNK_SIZE + y;
      tiles[y][x] = rawTerrainTile(gx, gy, seed, mapId);
    }
  }
  if (seed !== 0 && isTownChunk(cx, cy, seed)) {
    stampTown(tiles, cx, cy, seed);
  }
  return tiles;
}
function isWalkableTileId(tileId) {
  let defId = "grass_flat";
  switch (tileId) {
    case TILE_GRASS:
      defId = "grass_flat";
      break;
    case TILE_TALL_GRASS:
      defId = "tall_grass";
      break;
    case TILE_WATER:
      defId = "water_open";
      break;
    case TILE_PATH:
      defId = "path_dirt";
      break;
    case TILE_TREE:
      defId = "tree_canopy";
      break;
    case TILE_MOUNTAIN:
      defId = "cave_wall_brown";
      break;
    case TILE_BUILDING_FLOOR:
      defId = "building_facade";
      break;
    case TILE_BUILDING_WALL:
      defId = "building_facade";
      break;
    case TILE_DOOR:
      defId = "door_entrance";
      break;
    case TILE_PORTAL:
      defId = "door_entrance";
      break;
    default:
      defId = "grass_flat";
      break;
  }
  return TileRegistry.getInstance().isWalkable(defId);
}
var townChunkCache = {};
function getGlobalTile(gx, gy, seed, mapId = "city") {
  const cx = Math.floor(gx / CHUNK_SIZE);
  const cy = Math.floor(gy / CHUNK_SIZE);
  if (seed !== 0 && isTownChunk(cx, cy, seed)) {
    const cacheKey = `${cx},${cy},${seed},${mapId}`;
    if (!townChunkCache[cacheKey]) {
      townChunkCache[cacheKey] = generateChunkTiles(cx, cy, seed, mapId);
    }
    const chunk = townChunkCache[cacheKey];
    let lx = gx - cx * CHUNK_SIZE;
    let ly = gy - cy * CHUNK_SIZE;
    if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
      return chunk[ly][lx];
    }
  }
  return rawTerrainTile(gx, gy, seed, mapId);
}
function findSafeSpawn(seed, startPixelX, startPixelY, mapId = "city") {
  const isSafe = (px, py) => {
    const margin = 1;
    const corners = [
      { x: px + margin, y: py + margin },
      { x: px + TILE_SIZE - margin, y: py + margin },
      { x: px + margin, y: py + TILE_SIZE - margin },
      { x: px + TILE_SIZE - margin, y: py + TILE_SIZE - margin }
    ];
    for (const c of corners) {
      const tileGx = Math.floor(c.x / TILE_SIZE);
      const tileGy = Math.floor(c.y / TILE_SIZE);
      const tile = getGlobalTile(tileGx, tileGy, seed, mapId);
      if (!isWalkableTileId(tile)) {
        return false;
      }
    }
    return true;
  };
  if (isSafe(startPixelX, startPixelY)) {
    return { x: startPixelX, y: startPixelY };
  }
  let gx = Math.floor(startPixelX / TILE_SIZE);
  let gy = Math.floor(startPixelY / TILE_SIZE);
  const maxRadius = 50;
  for (let r = 0; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const testGx = gx + dx;
          const testGy = gy + dy;
          if (testGx < 0 || testGy < 0) continue;
          const tile = getGlobalTile(testGx, testGy, seed, mapId);
          if (isWalkableTileId(tile)) {
            const right = isWalkableTileId(getGlobalTile(testGx + 1, testGy, seed, mapId));
            const down = isWalkableTileId(getGlobalTile(testGx, testGy + 1, seed, mapId));
            const left = isWalkableTileId(getGlobalTile(testGx - 1, testGy, seed, mapId));
            const up = isWalkableTileId(getGlobalTile(testGx, testGy - 1, seed, mapId));
            if (right || down || left || up) {
              return {
                x: testGx * TILE_SIZE,
                y: testGy * TILE_SIZE
              };
            }
          }
        }
      }
    }
  }
  return { x: startPixelX, y: startPixelY };
}

// apps/game-server/server/multiplayer/integration/GameplayValidator.ts
var GameplayValidator = class {
  static validatePlayerCanBattle(gameState, playerId) {
    const client = gameState.getClient(playerId);
    if (!client) return false;
    if (!client.playerData || !client.playerData.party || client.playerData.party.length === 0) return false;
    const hasAwake = client.playerData.party.some((p) => p.currentHp > 0);
    return hasAwake;
  }
  static validateWildPokemon(wildEntityId) {
    const pm = PokemonManager.getInstance();
    const wild = pm.getWildPokemon(wildEntityId);
    return wild || null;
  }
};

// apps/game-server/server/battleResolution/BattleState.ts
var BattleState = class {
  id;
  phase;
  turn;
  participants;
  events;
  // Environment factors
  weather;
  terrain;
  constructor(id) {
    this.id = id;
    this.phase = "Init" /* Init */;
    this.turn = 1;
    this.participants = /* @__PURE__ */ new Map();
    this.events = [];
    this.weather = "clear";
    this.terrain = "normal";
  }
};

// apps/game-server/server/battleResolution/BattleContext.ts
var BattleContext = class {
  state;
  constructor(state) {
    this.state = state;
  }
  getParticipant(id) {
    return this.state.participants.get(id);
  }
  getActivePokemon(participantId) {
    const participant = this.getParticipant(participantId);
    if (!participant) return void 0;
    return participant.party[participant.activePokemonIndex];
  }
  getEffectiveSpeed(participantId) {
    const pokemon = this.getActivePokemon(participantId);
    if (!pokemon) return 0;
    let speed = pokemon.stats.speed;
    if (pokemon.status === 3) {
      speed = Math.floor(speed * 0.5);
    }
    return speed;
  }
};

// apps/game-server/server/battleResolution/BattleActionQueue.ts
var BattleActionQueue = class {
  actions = [];
  queueAction(action) {
    this.actions.push(action);
  }
  getActionForParticipant(participantId) {
    return this.actions.find((a) => a.participantId === participantId);
  }
  sortAndResolve(context) {
    const sorted = [...this.actions].sort((a, b) => {
      const getActionTypePriority = (type) => {
        switch (type) {
          case "Run" /* Run */:
            return 4;
          case "Switch" /* Switch */:
            return 3;
          case "Item" /* Item */:
            return 2;
          case "Move" /* Move */:
            return 1;
          default:
            return 0;
        }
      };
      const pA = getActionTypePriority(a.type);
      const pB = getActionTypePriority(b.type);
      if (pA !== pB) return pB - pA;
      if (a.priority !== b.priority) return b.priority - a.priority;
      const speedA = context.getEffectiveSpeed(a.participantId);
      const speedB = context.getEffectiveSpeed(b.participantId);
      if (speedA !== speedB) {
        return speedB - speedA;
      }
      return Math.random() > 0.5 ? -1 : 1;
    });
    return sorted;
  }
  clear() {
    this.actions = [];
  }
  hasAllActions(expectedCount) {
    return this.actions.length >= expectedCount;
  }
};

// packages/game-core/battleFormulas/calculators/DamageCalculator.ts
var DamageCalculator = class {
  static calculateDamage(context) {
    const {
      attacker,
      defender,
      move,
      isCritical,
      typeEffectiveness,
      randomFactor,
      weather = "clear",
      attackerStages = {},
      defenderStages = {},
      reflectActive = false,
      lightScreenActive = false
    } = context;
    if (!move || move.category === 2 /* Status */) {
      return 0;
    }
    const db = Database.getInstance();
    const accuracyStage = attackerStages.accuracy || 0;
    const evasionStage = defenderStages.evasion || 0;
    const accuracyMult = accuracyStage >= 0 ? (3 + accuracyStage) / 3 : 3 / (3 - accuracyStage);
    const evasionMult = evasionStage >= 0 ? (3 + evasionStage) / 3 : 3 / (3 - evasionStage);
    const moveAccuracy = typeof move.accuracy === "number" ? move.accuracy : 100;
    const isHit = moveAccuracy === 100 || Math.random() * 100 <= moveAccuracy * (accuracyMult / evasionMult);
    if (!isHit) {
      return 0;
    }
    const levelFactor = Math.floor(2 * attacker.level / 5) + 2;
    const isSpecial = move.category === 1 /* Special */;
    let atkStage = isSpecial ? attackerStages.spAttack || 0 : attackerStages.attack || 0;
    let defStage = isSpecial ? defenderStages.spDefense || 0 : defenderStages.defense || 0;
    if (isCritical) {
      if (atkStage < 0) atkStage = 0;
      if (defStage > 0) defStage = 0;
    }
    const atkMult = atkStage >= 0 ? (2 + atkStage) / 2 : 2 / (2 - atkStage);
    const defMult = defStage >= 0 ? (2 + defStage) / 2 : 2 / (2 - defStage);
    let baseAtk = isSpecial ? attacker.stats.spAttack : attacker.stats.attack;
    let baseDef = isSpecial ? defender.stats.spDefense : defender.stats.defense;
    let atk = Math.floor(baseAtk * atkMult);
    let def = Math.floor(baseDef * defMult);
    const attackerAbility = attacker.ability?.toLowerCase() || "";
    const defenderAbility = defender.ability?.toLowerCase() || "";
    const attackerItem = attacker.heldItemId;
    const defenderItem = defender.heldItemId;
    if (attackerItem === 4 && !isSpecial) {
      atk = Math.floor(atk * 1.5);
    }
    if (attackerItem === 5 && isSpecial) {
      atk = Math.floor(atk * 1.5);
    }
    if (defenderItem === 10 && isSpecial) {
      def = Math.floor(def * 1.5);
    }
    const defSpecies = db.getPokemon(defender.speciesId);
    const evos = defSpecies?.evolutions ?? defSpecies?.evolutionIds ?? [];
    const canEvolve = Array.isArray(evos) && evos.length > 0;
    if (defenderItem === 9 && canEvolve) {
      def = Math.floor(def * 1.5);
    }
    if (!isSpecial && attacker.status === 1) {
      if (attackerAbility !== "guts") {
        atk = Math.floor(atk * 0.5);
      }
    }
    if (defenderAbility === "thick fat" && (move.type === "fire" || move.type === "ice")) {
      atk = Math.floor(atk * 0.5);
    }
    const movePower = move.power || 40;
    const baseDmg = Math.floor(levelFactor * movePower * (atk / Math.max(1, def)) / 50) + 2;
    let finalTypeEffectiveness = typeEffectiveness;
    if (defenderAbility === "levitate" && move.type === "ground") {
      finalTypeEffectiveness = 0;
    }
    if (defenderAbility === "flash fire" && move.type === "fire") {
      finalTypeEffectiveness = 0;
    }
    let isStab = false;
    const attSpecies = db.getPokemon(attacker.speciesId);
    if (attSpecies && attSpecies.types) {
      isStab = attSpecies.types.some((t) => t && t.toLowerCase() === move.type.toLowerCase());
    }
    let stabMult = isStab ? 1.5 : 1;
    if (isStab && attackerAbility === "adaptability") {
      stabMult = 2;
    }
    let weatherMult = 1;
    const moveTypeLower = move.type.toLowerCase();
    const weatherLower = weather.toLowerCase();
    if (weatherLower === "rain" || weatherLower === "storm") {
      if (moveTypeLower === "water") weatherMult = 1.5;
      if (moveTypeLower === "fire") weatherMult = 0.5;
    } else if (weatherLower === "sun") {
      if (moveTypeLower === "fire") weatherMult = 1.5;
      if (moveTypeLower === "water") weatherMult = 0.5;
    }
    let abilityMult = 1;
    const isLowHp = attacker.currentHp <= attacker.maxHp / 3;
    if (isLowHp) {
      if (attackerAbility === "blaze" && moveTypeLower === "fire") abilityMult = 1.5;
      if (attackerAbility === "torrent" && moveTypeLower === "water") abilityMult = 1.5;
      if (attackerAbility === "overgrow" && moveTypeLower === "grass") abilityMult = 1.5;
    }
    if (attackerItem === 7) {
      abilityMult *= 1.3;
    }
    let screenMult = 1;
    if (!isCritical) {
      if (reflectActive && !isSpecial) screenMult = 0.5;
      if (lightScreenActive && isSpecial) screenMult = 0.5;
    }
    const critMult = isCritical ? 1.5 : 1;
    const modifier = finalTypeEffectiveness * critMult * stabMult * weatherMult * abilityMult * screenMult * randomFactor;
    let finalDamage = Math.floor(baseDmg * modifier);
    if (finalTypeEffectiveness > 0 && finalDamage === 0) {
      finalDamage = 1;
    }
    return finalDamage;
  }
};

// packages/game-core/battleFormulas/calculators/AccuracyCalculator.ts
var AccuracyCalculator = class {
  static calculate(attacker, defender, move) {
    if (move.accuracy === null || move.accuracy === void 0 || move.accuracy === 0) {
      return true;
    }
    const hitChance = move.accuracy;
    const roll = Math.random() * 100;
    return roll <= hitChance;
  }
};

// packages/game-core/battleFormulas/calculators/CriticalHitCalculator.ts
var CriticalHitCalculator = class {
  static calculate(attacker, move) {
    let critTier = 0;
    const critChances = [
      1 / 24,
      // Gen 7+ standard
      1 / 8,
      1 / 2,
      1
    ];
    const chance = critTier >= 3 ? 1 : critChances[critTier];
    return Math.random() < chance;
  }
};

// packages/game-core/battleFormulas/calculators/TypeEffectivenessCalculator.ts
var TypeEffectivenessCalculator = class {
  // Assume pokemonRegistry.getTypeEffectiveness is used in actual implementation
  static calculate(attackType, defenderTypes) {
    return 1;
  }
};

// apps/game-server/server/battleResolution/effects/StatusPipeline.ts
var StatusPipeline = class {
  static processEvent(context, event) {
    if (event.type === "TurnEnd" /* TurnEnd */) {
      this.handleTurnEndStatus(context);
    }
  }
  static handleTurnEndStatus(context) {
    for (const [id, participant] of context.state.participants) {
      const activeMon = participant.party[participant.activePokemonIndex];
      if (!activeMon || activeMon.currentHp <= 0) continue;
      if (activeMon.status === 1 /* Burn */) {
        const damage = Math.max(1, Math.floor(activeMon.maxHp / 16));
        activeMon.currentHp = Math.max(0, activeMon.currentHp - damage);
        context.state.events.push({
          type: "Message" /* Message */,
          payload: { text: `${activeMon.nickname || "The Pokemon"} was hurt by its burn!` }
        });
      } else if (activeMon.status === 4 /* Poison */) {
        const damage = Math.max(1, Math.floor(activeMon.maxHp / 8));
        activeMon.currentHp = Math.max(0, activeMon.currentHp - damage);
        context.state.events.push({
          type: "Message" /* Message */,
          payload: { text: `${activeMon.nickname || "The Pokemon"} was hurt by poison!` }
        });
      }
    }
  }
  static canAttack(pokemon, context) {
    if (pokemon.status === 2 /* Freeze */) {
      if (Math.random() < 0.2) {
        pokemon.status = 0 /* None */;
        context.state.events.push({
          type: "Message" /* Message */,
          payload: { text: `${pokemon.nickname || "The Pokemon"} thawed out!` }
        });
        return { canAttack: true };
      }
      return { canAttack: false, reason: `${pokemon.nickname || "The Pokemon"} is frozen solid!` };
    }
    if (pokemon.status === 6 /* Sleep */) {
      if (Math.random() < 0.33) {
        pokemon.status = 0 /* None */;
        context.state.events.push({
          type: "Message" /* Message */,
          payload: { text: `${pokemon.nickname || "The Pokemon"} woke up!` }
        });
        return { canAttack: true };
      }
      return { canAttack: false, reason: `${pokemon.nickname || "The Pokemon"} is fast asleep.` };
    }
    if (pokemon.status === 3 /* Paralysis */) {
      if (Math.random() < 0.25) {
        return { canAttack: false, reason: `${pokemon.nickname || "The Pokemon"} is paralyzed! It can't move!` };
      }
    }
    return { canAttack: true };
  }
};

// apps/game-server/server/battleResolution/effects/AbilityPipeline.ts
var AbilityPipeline = class {
  static processEvent(context, event) {
    const participants = Array.from(context.state.participants.values());
    if (participants.length < 2) return;
    const activeMons = [];
    participants.forEach((p, idx) => {
      const mon = p.party[p.activePokemonIndex];
      if (mon) {
        activeMons.push({ id: p.id, pokemon: mon, isP1: idx === 0 });
      }
    });
    for (const active of activeMons) {
      const mon = active.pokemon;
      const ability = mon.ability?.toLowerCase() || "";
      const opponent = activeMons.find((o) => o.id !== active.id)?.pokemon;
      if (!ability) continue;
      if (!mon.statStages) {
        mon.statStages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 };
      }
      switch (event.type) {
        case "TurnStart" /* TurnStart */:
          if (ability === "pressure" && context.state.turn === 1) {
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"} is exerting its Pressure!` }
            });
          }
          if (ability === "intimidate" && opponent) {
            if (!mon.hasIntimidated) {
              mon.hasIntimidated = true;
              const oppStages = opponent.statStages || { attack: 0 };
              oppStages.attack = Math.max(-6, (oppStages.attack || 0) - 1);
              opponent.statStages = oppStages;
              context.state.events.push({
                type: "Message" /* Message */,
                payload: { text: `${mon.nickname || "Pokemon"}'s Intimidate lowered ${opponent.nickname || "opponent"}'s Attack!` }
              });
            }
          }
          break;
        case "Switch" /* Switch */:
          if (event.payload?.participantId === active.id) {
            mon.hasIntimidated = false;
          }
          break;
        case "BeforeDamage" /* BeforeDamage */:
          if (ability === "levitate" && event.payload?.move?.type === "ground" && event.payload?.targetId === active.id) {
            event.payload.damage = 0;
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"} floated over the Ground move with Levitate!` }
            });
          }
          if (ability === "flash fire" && event.payload?.move?.type === "fire" && event.payload?.targetId === active.id) {
            event.payload.damage = 0;
            mon.flashFireBoost = true;
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"}'s Flash Fire absorbed the Fire attack!` }
            });
          }
          if (ability === "sturdy" && event.payload?.targetId === active.id) {
            const currentHp = mon.currentHp;
            const incomingDamage = event.payload.damage || 0;
            if (currentHp === mon.maxHp && incomingDamage >= currentHp) {
              event.payload.damage = currentHp - 1;
              context.state.events.push({
                type: "Message" /* Message */,
                payload: { text: `${mon.nickname || "Pokemon"} endured the hit with Sturdy!` }
              });
            }
          }
          break;
        case "AfterDamage" /* AfterDamage */:
          if (ability === "static" && event.payload?.targetId === active.id && opponent) {
            const moveCategory = event.payload?.move?.category;
            if (moveCategory !== 1 && Math.random() < 0.3) {
              if (opponent.status === 0 /* None */) {
                opponent.status = 3 /* Paralysis */;
                context.state.events.push({
                  type: "Message" /* Message */,
                  payload: { text: `${opponent.nickname || "Pokemon"} was paralyzed by ${mon.nickname || "Pokemon"}'s Static!` }
                });
              }
            }
          }
          break;
        case "Status" /* Status */:
          if (ability === "synchronize" && event.payload?.targetId === active.id && opponent) {
            const newStatus = event.payload?.status;
            if (newStatus && opponent.status === 0 /* None */) {
              opponent.status = newStatus;
              context.state.events.push({
                type: "Message" /* Message */,
                payload: { text: `${mon.nickname || "Pokemon"}'s Synchronize passed status to ${opponent.nickname || "Pokemon"}!` }
              });
            }
          }
          break;
      }
    }
  }
};

// apps/game-server/server/battleResolution/effects/ItemPipeline.ts
var ItemPipeline = class {
  static processEvent(context, event) {
    const participants = Array.from(context.state.participants.values());
    if (participants.length < 2) return;
    const activeMons = [];
    participants.forEach((p, idx) => {
      const mon = p.party[p.activePokemonIndex];
      if (mon) {
        activeMons.push({ id: p.id, pokemon: mon, isP1: idx === 0 });
      }
    });
    for (const active of activeMons) {
      const mon = active.pokemon;
      const heldItem = mon.heldItemId;
      const opponent = activeMons.find((o) => o.id !== active.id)?.pokemon;
      if (!heldItem) continue;
      switch (event.type) {
        case "TurnEnd" /* TurnEnd */:
          if (heldItem === 40 && mon.currentHp < mon.maxHp && mon.currentHp > 0) {
            const heal = Math.floor(mon.maxHp / 16) || 1;
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"} restored some HP using its Leftovers!` }
            });
          }
          if (heldItem === 30 && mon.currentHp > 0 && mon.currentHp <= mon.maxHp / 2) {
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + 10);
            mon.heldItemId = void 0;
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"} ate its Oran Berry and restored 10 HP!` }
            });
          }
          if (heldItem === 31 && mon.currentHp > 0 && mon.currentHp <= mon.maxHp / 2) {
            const heal = Math.floor(mon.maxHp / 4) || 1;
            mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
            mon.heldItemId = void 0;
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"} ate its Sitrus Berry and restored HP!` }
            });
          }
          if (heldItem === 32 && mon.status && mon.status !== 0 /* None */) {
            mon.status = 0 /* None */;
            mon.heldItemId = void 0;
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"} cured its status condition with Lum Berry!` }
            });
          }
          break;
        case "BeforeDamage" /* BeforeDamage */:
          if (heldItem === 42 && event.payload?.targetId === active.id) {
            const currentHp = mon.currentHp;
            const incomingDamage = event.payload.damage || 0;
            if (currentHp === mon.maxHp && incomingDamage >= currentHp) {
              event.payload.damage = currentHp - 1;
              mon.heldItemId = void 0;
              context.state.events.push({
                type: "Message" /* Message */,
                payload: { text: `${mon.nickname || "Pokemon"} hung on with its Focus Sash!` }
              });
            }
          }
          break;
        case "AfterDamage" /* AfterDamage */:
          if (heldItem === 43 && event.payload?.attackerId === active.id) {
            const recoil = Math.floor(mon.maxHp / 10) || 1;
            mon.currentHp = Math.max(0, mon.currentHp - recoil);
            context.state.events.push({
              type: "Message" /* Message */,
              payload: { text: `${mon.nickname || "Pokemon"} was hurt by its Life Orb!` }
            });
          }
          if (heldItem === 45 && event.payload?.targetId === active.id && opponent) {
            const moveCategory = event.payload?.move?.category;
            if (moveCategory !== 1) {
              const recoil = Math.floor(opponent.maxHp / 6) || 1;
              opponent.currentHp = Math.max(0, opponent.currentHp - recoil);
              context.state.events.push({
                type: "Message" /* Message */,
                payload: { text: `${opponent.nickname || "Pokemon"} was hurt by ${mon.nickname || "Pokemon"}'s Rocky Helmet!` }
              });
            }
          }
          break;
      }
    }
  }
};

// apps/game-server/server/battleResolution/capture/CaptureValidator.ts
var CaptureValidator = class {
  static validate(context) {
    const { battle, participantId, targetId, ballItem } = context;
    if (battle.state.phase === "End" /* End */) {
      return { valid: false, reason: "Battle has ended" };
    }
    const participant = battle.context.getParticipant(participantId);
    if (!participant) {
      return { valid: false, reason: "Participant not found in battle" };
    }
    const target = battle.context.getParticipant(targetId);
    if (!target) {
      return { valid: false, reason: "Target not found in battle" };
    }
    if (target.type !== "Wild" /* Wild */) {
      return { valid: false, reason: "Cannot catch a trainer's Pokemon" };
    }
    const targetMon = target.party[target.activePokemonIndex];
    if (!targetMon || targetMon.currentHp <= 0) {
      return { valid: false, reason: "Target has fainted" };
    }
    if (!ballItem || ballItem.category !== 1 /* CaptureDevice */ && ballItem.category !== "pokeball") {
      return { valid: false, reason: "Item is not a valid Capture Device" };
    }
    return { valid: true };
  }
};

// apps/game-server/server/battleResolution/capture/CaptureCalculator.ts
var CaptureCalculator = class {
  /**
   * Calculates the capture probability and returns the number of shakes.
   * If shakes === 4, the Pokemon is caught.
   */
  static calculate(target, ballId) {
    const species = pokemonRegistry.getSpecies(target.speciesId);
    if (!species) {
      return { shakes: 0, caught: false };
    }
    const maxHp = target.stats.hp;
    const currentHp = target.currentHp;
    const catchRate = species.catchRate;
    let ballBonus = 1;
    if (ballId === 2) ballBonus = 1.5;
    else if (ballId === 3) ballBonus = 2;
    else if (ballId === 4) {
      return { shakes: 4, caught: true };
    }
    let statusBonus = 1;
    const targetStatus = target.status;
    if (targetStatus === 6 /* Sleep */ || targetStatus === 2 /* Freeze */) {
      statusBonus = 2.5;
    } else if (targetStatus && targetStatus !== 0 /* None */) {
      statusBonus = 1.5;
    }
    let a = (3 * maxHp - 2 * currentHp) * catchRate * ballBonus / (3 * maxHp) * statusBonus;
    if (a >= 255) {
      return { shakes: 4, caught: true };
    }
    const b = 65536 / Math.sqrt(Math.sqrt(255 / a));
    let shakes = 0;
    for (let i = 0; i < 4; i++) {
      const roll = Math.floor(Math.random() * 65536);
      if (roll >= b) {
        break;
      }
      shakes++;
    }
    return {
      shakes,
      caught: shakes === 4
    };
  }
};

// apps/game-server/server/battleResolution/capture/CaptureEvents.ts
var CaptureEventType = {
  BallThrown: "BallThrown" /* BallThrown */,
  CaptureShake: "CaptureShake" /* CaptureShake */,
  CaptureSuccess: "CaptureSuccess" /* CaptureSuccess */,
  CaptureFailure: "CaptureFailure" /* CaptureFailure */,
  PokemonRegistered: "PokemonRegistered" /* PokemonRegistered */,
  PartyUpdated: "PartyUpdated" /* PartyUpdated */,
  PCUpdated: "PCUpdated" /* PCUpdated */,
  BattleEnded: "BattleEnded" /* BattleEnded */
};

// apps/game-server/server/battleResolution/capture/CaptureManager.ts
var CaptureManager = class {
  static attemptCapture(context) {
    const { battle, participantId, targetId, ballItem } = context;
    const validation = CaptureValidator.validate(context);
    if (!validation.valid) {
      return { success: false, reason: validation.reason, shakes: 0 };
    }
    const pm = PokemonManager.getInstance();
    const targetParticipant = battle.context.getParticipant(targetId);
    const targetMon = targetParticipant.party[targetParticipant.activePokemonIndex];
    battle.state.events.push({
      type: CaptureEventType.BallThrown,
      // Needs extending BattleEvent, we cheat a bit or maybe handle nicely
      payload: { participantId, targetId, itemId: ballItem.id }
    });
    const { shakes, caught } = CaptureCalculator.calculate(targetMon, Number(ballItem.id) || 1);
    battle.state.events.push({
      type: CaptureEventType.CaptureShake,
      payload: { shakeCount: shakes }
    });
    if (caught) {
      const pokemon = monsterInstanceToPokemonInstance(targetMon, { otId: participantId });
      const party = pm.getParty(participantId);
      let slotIndex = party.findIndex((p) => p === null);
      let locType = "party" /* Party */;
      let boxIndex = -1;
      if (slotIndex === -1) {
        locType = "pc" /* PC */;
        let found = false;
        for (let b = 0; b < 32; b++) {
          const boxMap = pm.getPCBox(participantId, b);
          for (let s = 0; s < 30; s++) {
            if (!boxMap.has(s)) {
              boxIndex = b;
              slotIndex = s;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (!found) {
          return { success: false, reason: "PC is full", shakes: 4 };
        }
      }
      const loc = {
        type: locType,
        ownerId: participantId,
        slotIndex,
        boxIndex: boxIndex === -1 ? void 0 : boxIndex
      };
      if (!pm.getPokemonById(pokemon.id)) {
        pm.registerPokemon(pokemon, loc);
      } else {
        pm.updateLocation(pokemon.id, loc);
      }
      battle.state.events.push({
        type: CaptureEventType.CaptureSuccess,
        payload: { pokemonId: pokemon.id, speciesId: pokemon.speciesId }
      });
      battle.state.events.push({
        type: CaptureEventType.PokemonRegistered,
        payload: { pokemonId: pokemon.id, ownerId: participantId }
      });
      if (locType === "party" /* Party */) {
        battle.state.events.push({
          type: CaptureEventType.PartyUpdated,
          payload: { pokemonId: pokemon.id, slotIndex }
        });
      } else {
        battle.state.events.push({
          type: CaptureEventType.PCUpdated,
          payload: { pokemonId: pokemon.id, boxIndex, slotIndex }
        });
      }
      battle.state.phase = "End" /* End */;
      battle.state.events.push({
        type: CaptureEventType.BattleEnded
      });
      return { success: true, shakes };
    } else {
      battle.state.events.push({
        type: CaptureEventType.CaptureFailure,
        payload: { reason: "broke_free", escaped: false }
      });
      return { success: false, reason: "broke_free", shakes };
    }
  }
};

// apps/game-server/server/battleResolution/providers/HumanActionProvider.ts
var HumanActionProvider = class {
  participantId;
  pendingResolve = null;
  bufferedAction = null;
  constructor(participantId) {
    this.participantId = participantId;
  }
  getAction(context) {
    if (this.bufferedAction) {
      const action = this.bufferedAction;
      this.bufferedAction = null;
      return Promise.resolve(action);
    }
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
    });
  }
  submitAction(action) {
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(action);
    } else {
      this.bufferedAction = action;
    }
  }
  cancel() {
    this.pendingResolve = null;
    this.bufferedAction = null;
  }
};

// apps/game-server/server/battleResolution/BattleInstance.ts
var BattleInstance = class {
  state;
  context;
  actionQueue;
  providers = /* @__PURE__ */ new Map();
  constructor(id) {
    this.state = new BattleState(id);
    this.context = new BattleContext(this.state);
    this.actionQueue = new BattleActionQueue();
  }
  setProvider(participantId, provider) {
    this.providers.set(participantId, provider);
  }
  getProvider(participantId) {
    return this.providers.get(participantId);
  }
  async requestTurnActions() {
    if (this.state.phase !== "Init" /* Init */ && this.state.phase !== "ActionSelection" /* ActionSelection */) {
      return;
    }
    this.state.phase = "ActionSelection" /* ActionSelection */;
    const activeParticipants = Array.from(this.state.participants.values()).filter((p) => {
      const activeMon = p.party[p.activePokemonIndex];
      return activeMon && activeMon.currentHp > 0;
    });
    const actionPromises = activeParticipants.map(async (participant) => {
      let provider = this.providers.get(participant.id);
      if (!provider) {
        provider = new HumanActionProvider(participant.id);
        this.providers.set(participant.id, provider);
      }
      try {
        const action = await provider.getAction(this.context);
        if (action && !this.actionQueue.getActionForParticipant(participant.id)) {
          this.actionQueue.queueAction(action);
        }
      } catch (err) {
        console.warn(`[BattleInstance] Action collection error for ${participant.id}:`, err);
      }
    });
    await Promise.all(actionPromises);
    if (this.actionQueue.hasAllActions(activeParticipants.length) && this.state.phase === "ActionSelection" /* ActionSelection */) {
      this.resolveTurn();
    }
  }
  submitAction(action) {
    const participant = this.context.getParticipant(action.participantId);
    if (!participant) {
      throw new Error("Invalid participant ID");
    }
    const provider = this.providers.get(action.participantId);
    if (provider && provider.submitAction) {
      provider.submitAction(action);
    }
    if (!this.actionQueue.getActionForParticipant(action.participantId)) {
      this.actionQueue.queueAction(action);
    }
    const activeCount = Array.from(this.state.participants.values()).filter((p) => {
      const activeMon = p.party[p.activePokemonIndex];
      return activeMon && activeMon.currentHp > 0;
    }).length;
    if (this.actionQueue.hasAllActions(activeCount) && this.state.phase !== "Execution" /* Execution */ && this.state.phase !== "End" /* End */) {
      this.resolveTurn();
    }
  }
  resolveTurn() {
    this.state.phase = "Execution" /* Execution */;
    this.state.events = [];
    this.emitEvent({ type: "TurnStart" /* TurnStart */ });
    const orderedActions = this.actionQueue.sortAndResolve(this.context);
    for (const action of orderedActions) {
      this.executeAction(action);
      if (this.checkBattleEnd()) {
        break;
      }
    }
    if (!this.checkBattleEnd()) {
      this.emitEvent({ type: "TurnEnd" /* TurnEnd */ });
      this.actionQueue.clear();
      this.state.turn++;
      this.state.phase = "ActionSelection" /* ActionSelection */;
    }
  }
  executeAction(action) {
    const participant = this.context.getParticipant(action.participantId);
    if (!participant) return;
    const activePokemon = participant.party[participant.activePokemonIndex];
    if (activePokemon.currentHp <= 0 && action.type !== "Switch" /* Switch */) {
      return;
    }
    switch (action.type) {
      case "Switch" /* Switch */:
        this.handleSwitch(action.participantId, action.nextPokemonId);
        break;
      case "Move" /* Move */:
        this.handleMove(action);
        break;
      case "Item" /* Item */:
        this.handleItem(action);
        break;
      case "Run" /* Run */:
        break;
    }
  }
  handleItem(action) {
    const itemData = { id: String(action.itemId), name: `Item ${action.itemId}`, description: "", price: 0, category: 1 /* CaptureDevice */, isKeyItem: false };
    if (itemData.category === 1 /* CaptureDevice */) {
      const captureContext = {
        battle: this,
        participantId: action.participantId,
        targetId: action.targetId,
        ballItem: itemData
      };
      const captureResult = CaptureManager.attemptCapture(captureContext);
      if (!captureResult.success) {
        if (captureResult.reason !== "broke_free") {
          this.emitEvent({ type: "Message" /* Message */, payload: { text: `You can't use that here! (${captureResult.reason})` } });
        } else {
          this.emitEvent({ type: "Message" /* Message */, payload: { text: "Oh no! The Pokemon broke free!" } });
        }
      }
    }
  }
  handleSwitch(participantId, nextPokemonId) {
    const participant = this.context.getParticipant(participantId);
    if (!participant) return;
    const nextIndex = participant.party.findIndex((p) => p.id === nextPokemonId);
    if (nextIndex !== -1 && participant.party[nextIndex].currentHp > 0) {
      participant.activePokemonIndex = nextIndex;
      const nextMon = participant.party[nextIndex];
      this.emitEvent({
        type: "Message" /* Message */,
        payload: { text: `${participant.name} sent out ${nextMon.nickname || "a Pokemon"}!` }
      });
      this.emitEvent({
        type: "Switch" /* Switch */,
        payload: { participantId, nextPokemonIndex: nextIndex }
      });
    }
  }
  handleMove(action) {
    const attackerPart = this.context.getParticipant(action.participantId);
    const defenderPart = this.context.getParticipant(action.targetId);
    if (!attackerPart || !defenderPart) return;
    const attacker = attackerPart.party[attackerPart.activePokemonIndex];
    const defender = defenderPart.party[defenderPart.activePokemonIndex];
    if (attacker.currentHp <= 0 || defender.currentHp <= 0) return;
    const statusCheck = StatusPipeline.canAttack(attacker, this.context);
    if (!statusCheck.canAttack) {
      if (statusCheck.reason) {
        this.emitEvent({
          type: "Message" /* Message */,
          payload: { text: statusCheck.reason }
        });
      }
      return;
    }
    const move = { id: action.moveId, name: `Move ${action.moveId}`, category: 0, power: 40, type: 0, accuracy: 100 };
    this.emitEvent({
      type: "Message" /* Message */,
      payload: { text: `${attacker.nickname || "Pokemon"} used ${move.name}!` }
    });
    this.emitEvent({ type: "BeforeMove" /* BeforeMove */, payload: { action } });
    if (!AccuracyCalculator.calculate(attacker, defender, move)) {
      this.emitEvent({
        type: "Message" /* Message */,
        payload: { text: "But it missed!" }
      });
      return;
    }
    const isCritical = CriticalHitCalculator.calculate(attacker, move);
    const typeEffectiveness = TypeEffectivenessCalculator.calculate(
      move.type,
      [0, null]
      /* placeholder defender types */
    );
    const damageContext = {
      attacker,
      defender,
      move,
      isCritical,
      typeEffectiveness,
      randomFactor: 0.85 + Math.random() * 0.15,
      weather: this.state.weather || "clear",
      attackerStages: attacker.statStages || {},
      defenderStages: defender.statStages || {}
    };
    const damage = DamageCalculator.calculateDamage(damageContext);
    this.emitEvent({ type: "BeforeDamage" /* BeforeDamage */, payload: { targetId: action.targetId, damage } });
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    this.emitEvent({ type: "Damage" /* Damage */, payload: { targetId: action.targetId, damage, isCritical, typeEffectiveness } });
    if (isCritical) {
      this.emitEvent({ type: "Message" /* Message */, payload: { text: "A critical hit!" } });
    }
    if (typeEffectiveness > 1) {
      this.emitEvent({ type: "Message" /* Message */, payload: { text: "It's super effective!" } });
    } else if (typeEffectiveness > 0 && typeEffectiveness < 1) {
      this.emitEvent({ type: "Message" /* Message */, payload: { text: "It's not very effective..." } });
    } else if (typeEffectiveness === 0) {
      this.emitEvent({ type: "Message" /* Message */, payload: { text: "It had no effect!" } });
    }
    this.emitEvent({ type: "AfterDamage" /* AfterDamage */, payload: { targetId: action.targetId, damage } });
    this.emitEvent({ type: "AfterMove" /* AfterMove */, payload: { action } });
    if (defender.currentHp <= 0) {
      this.emitEvent({
        type: "Message" /* Message */,
        payload: { text: `${defender.nickname || "Pokemon"} fainted!` }
      });
      this.emitEvent({ type: "PokemonFainted" /* PokemonFainted */, payload: { participantId: action.targetId } });
    }
  }
  emitEvent(event) {
    this.state.events.push(event);
    AbilityPipeline.processEvent(this.context, event);
    ItemPipeline.processEvent(this.context, event);
    StatusPipeline.processEvent(this.context, event);
  }
  checkBattleEnd() {
    let allP1Fainted = true;
    let allP2Fainted = true;
    const participants = Array.from(this.state.participants.values());
    if (participants.length < 2) return false;
    const p1 = participants[0];
    const p2 = participants[1];
    if (p1.party.some((p) => p.currentHp > 0)) allP1Fainted = false;
    if (p2.party.some((p) => p.currentHp > 0)) allP2Fainted = false;
    if (allP1Fainted || allP2Fainted) {
      this.state.phase = "End" /* End */;
      this.emitEvent({ type: "BattleEnded" /* BattleEnded */ });
      return true;
    }
    return false;
  }
};

// apps/game-server/server/battleResolution/BattleManager.ts
var BattleManager = class {
  battles = /* @__PURE__ */ new Map();
  nextBattleId = 1;
  createBattle(participantsConfig) {
    const battleId = `battle_${this.nextBattleId++}_${Date.now()}`;
    const instance = new BattleInstance(battleId);
    for (const config of participantsConfig) {
      const participant = {
        id: config.id,
        type: config.type,
        name: config.name,
        party: config.party,
        activePokemonIndex: config.party.findIndex((p) => p.currentHp > 0) || 0,
        hasActedThisTurn: false,
        canMegaEvolve: true,
        canTerastallize: true,
        canDynamax: true
      };
      instance.state.participants.set(config.id, participant);
    }
    if (instance.state.participants.size < 2) {
      throw new Error("Battle must have at least 2 participants");
    }
    this.battles.set(battleId, instance);
    return instance;
  }
  getBattle(id) {
    return this.battles.get(id);
  }
  destroyBattle(id) {
    this.battles.delete(id);
  }
  getActiveBattles() {
    return Array.from(this.battles.values());
  }
};

// apps/game-server/server/battleResolution/providers/NetworkActionProvider.ts
var NetworkActionProvider = class {
  participantId;
  pendingResolve = null;
  bufferedAction = null;
  timeoutTimer = null;
  constructor(participantId) {
    this.participantId = participantId;
  }
  getAction(context) {
    if (this.bufferedAction) {
      const action = this.bufferedAction;
      this.bufferedAction = null;
      return Promise.resolve(action);
    }
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.timeoutTimer = setTimeout(() => {
        if (this.pendingResolve) {
          const resolveFn = this.pendingResolve;
          this.pendingResolve = null;
          this.timeoutTimer = null;
          const participant = context.getParticipant(this.participantId);
          const activeMon = participant ? participant.party[participant.activePokemonIndex] : null;
          let targetId = "";
          for (const [id] of context.state.participants.entries()) {
            if (id !== this.participantId) {
              targetId = id;
              break;
            }
          }
          const fallbackMove = {
            type: "Move" /* Move */,
            participantId: this.participantId,
            priority: 0,
            moveId: activeMon && activeMon.moves && activeMon.moves[0] || 1,
            targetId
          };
          resolveFn(fallbackMove);
        }
      }, 3e4);
    });
  }
  submitAction(action) {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.pendingResolve) {
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(action);
    } else {
      this.bufferedAction = action;
    }
  }
  cancel() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    this.pendingResolve = null;
    this.bufferedAction = null;
  }
};

// apps/game-server/server/multiplayer/BattleSessionManager.ts
var BattleSessionManager = class {
  gameState;
  battleManager;
  activeSessions = /* @__PURE__ */ new Map();
  playerToSession = /* @__PURE__ */ new Map();
  // clientId -> battleId
  pendingChallenges = /* @__PURE__ */ new Map();
  // challengerId -> challenge
  constructor(gameState, battleManager) {
    this.gameState = gameState;
    this.battleManager = battleManager;
  }
  handleChallengeRequest(challenger, packet) {
    const target = this.gameState.getClient(packet.targetPlayerId);
    if (!target) return;
    if (!challenger.playerData || !challenger.playerData.party || challenger.playerData.party.length === 0) {
      this.gameState.send(challenger, {
        type: 37 /* BattleChallengeResult */,
        accepted: false,
        timestamp: Date.now(),
        message: "You need a monster to battle!"
      });
      return;
    }
    if (!target.playerData || !target.playerData.party || target.playerData.party.length === 0) {
      this.gameState.send(challenger, {
        type: 37 /* BattleChallengeResult */,
        accepted: false,
        timestamp: Date.now(),
        message: "That player has no monsters to battle."
      });
      return;
    }
    if (this.pendingChallenges.has(challenger.id) || this.playerToSession.has(challenger.id)) {
      this.gameState.send(challenger, {
        type: 37 /* BattleChallengeResult */,
        accepted: false,
        timestamp: Date.now(),
        message: "You already have a pending or active battle."
      });
      return;
    }
    if (this.playerToSession.has(target.id)) {
      this.gameState.send(challenger, {
        type: 37 /* BattleChallengeResult */,
        accepted: false,
        timestamp: Date.now(),
        message: "That player is currently in a battle."
      });
      return;
    }
    const timeout = setTimeout(() => {
      this.pendingChallenges.delete(challenger.id);
      const timeoutMsg = {
        type: 37 /* BattleChallengeResult */,
        accepted: false,
        timestamp: Date.now(),
        message: "The battle request timed out."
      };
      this.gameState.send(challenger, timeoutMsg);
      this.gameState.send(target, timeoutMsg);
    }, 3e4);
    this.pendingChallenges.set(challenger.id, {
      challengerId: challenger.id,
      targetId: target.id,
      timeout
    });
    this.gameState.send(target, {
      type: 35 /* BattleChallengeResponse */,
      challengerId: challenger.id,
      challengerName: challenger.username,
      timestamp: Date.now()
    });
  }
  handleChallengeAnswer(sender, packet) {
    const challengerId = packet.challengerId;
    if (sender.id === packet.challengerId) {
      const challenge2 = this.pendingChallenges.get(sender.id);
      if (!challenge2) return;
      clearTimeout(challenge2.timeout);
      this.pendingChallenges.delete(sender.id);
      const target2 = this.gameState.getClient(challenge2.targetId);
      const cancelMsg = {
        type: 37 /* BattleChallengeResult */,
        accepted: false,
        timestamp: Date.now(),
        message: "Battle request cancelled."
      };
      this.gameState.send(sender, cancelMsg);
      if (target2) this.gameState.send(target2, cancelMsg);
      return;
    }
    const challenge = this.pendingChallenges.get(challengerId);
    if (!challenge || challenge.targetId !== sender.id) return;
    clearTimeout(challenge.timeout);
    this.pendingChallenges.delete(challengerId);
    const challenger = this.gameState.getClient(challengerId);
    const target = sender;
    const resultMsg = {
      type: 37 /* BattleChallengeResult */,
      accepted: packet.accept,
      timestamp: Date.now(),
      message: packet.accept ? void 0 : `${target.username} declined the challenge.`
    };
    if (challenger) this.gameState.send(challenger, resultMsg);
    this.gameState.send(target, resultMsg);
    if (packet.accept && challenger) {
      this.startPvPBattle(challenger, target);
    }
  }
  startPvPBattle(p1, p2) {
    const pm = PokemonManager.getInstance();
    const p1Party = pm.getParty(p1.id).filter((p) => p !== null);
    const p2Party = pm.getParty(p2.id).filter((p) => p !== null);
    const battleInstance = this.battleManager.createBattle([
      {
        type: "Player" /* Player */,
        id: p1.id,
        name: p1.username,
        party: p1Party
      },
      {
        type: "Player" /* Player */,
        id: p2.id,
        name: p2.username,
        party: p2Party
      }
    ]);
    const p1Provider = new NetworkActionProvider(p1.id);
    const p2Provider = new NetworkActionProvider(p2.id);
    battleInstance.setProvider(p1.id, p1Provider);
    battleInstance.setProvider(p2.id, p2Provider);
    const session = {
      battleId: battleInstance.state.id,
      p1,
      p2,
      battleInstance,
      p1Provider,
      p2Provider,
      startTime: Date.now()
    };
    this.activeSessions.set(session.battleId, session);
    this.playerToSession.set(p1.id, session.battleId);
    this.playerToSession.set(p2.id, session.battleId);
    const env = this.gameState.getBattleEnvironmentData(p1.mapInstanceId, p1.position.x, p1.position.y);
    this.gameState.send(p1, {
      type: 30 /* BattleStart */,
      battleId: session.battleId,
      isPvP: true,
      opponentName: p2.username,
      opponentId: p2.id,
      playerMonsters: p1.playerData.party,
      opponentMonsters: p2.playerData.party,
      env,
      timestamp: Date.now()
    });
    this.gameState.send(p2, {
      type: 30 /* BattleStart */,
      battleId: session.battleId,
      isPvP: true,
      opponentName: p1.username,
      opponentId: p1.id,
      playerMonsters: p2.playerData.party,
      opponentMonsters: p1.playerData.party,
      env,
      timestamp: Date.now()
    });
    battleInstance.requestTurnActions().catch((err) => console.warn("[BattleSessionManager] PvP action loop error:", err));
    return session;
  }
  handleBattleAction(client, packet) {
    const session = this.activeSessions.get(packet.battleId) || this.getSessionByClient(client.id);
    if (!session) return;
    const provider = client.id === session.p1.id ? session.p1Provider : session.p2Provider;
    const actionData = packet.action;
    let targetId = "";
    for (const [id] of session.battleInstance.state.participants.entries()) {
      if (id !== client.id) {
        targetId = id;
        break;
      }
    }
    let battleAction;
    switch (actionData.kind) {
      case "attack":
        const activeMon = session.battleInstance.state.participants.get(client.id)?.party[session.battleInstance.state.participants.get(client.id).activePokemonIndex];
        const moveId = activeMon?.moves[actionData.moveIndex] || 1;
        battleAction = {
          type: "Move" /* Move */,
          participantId: client.id,
          priority: 0,
          moveId,
          targetId: actionData.targetId || targetId,
          isMega: actionData.isMega
        };
        break;
      case "switch":
        const targetSwitchMon = (session.p1.id === client.id ? session.p1 : session.p2).playerData?.party[actionData.slot];
        battleAction = {
          type: "Switch" /* Switch */,
          participantId: client.id,
          priority: 6,
          targetPokemonIndex: actionData.slot,
          nextPokemonId: targetSwitchMon?.id || ""
        };
        break;
      case "item":
        battleAction = {
          type: "Item" /* Item */,
          participantId: client.id,
          priority: 6,
          itemId: actionData.itemId,
          targetId: actionData.targetId || client.id
        };
        break;
      case "run":
        battleAction = {
          type: "Run" /* Run */,
          participantId: client.id,
          priority: 6
        };
        break;
      default:
        return;
    }
    provider.submitAction(battleAction);
  }
  handleClientReconnect(client) {
    const session = this.getSessionByClient(client.id);
    if (!session) return;
    if (session.p1.id === client.id) session.p1 = client;
    if (session.p2.id === client.id) session.p2 = client;
    const isP1 = session.p1.id === client.id;
    const opponent = isP1 ? session.p2 : session.p1;
    const env = this.gameState.getBattleEnvironmentData(client.mapInstanceId, client.position.x, client.position.y);
    this.gameState.send(client, {
      type: 30 /* BattleStart */,
      battleId: session.battleId,
      isPvP: true,
      opponentName: opponent.username,
      opponentId: opponent.id,
      playerMonsters: client.playerData.party,
      opponentMonsters: opponent.playerData.party,
      env,
      timestamp: Date.now()
    });
  }
  handleClientDisconnect(clientId) {
    for (const [challengerId, challenge] of this.pendingChallenges.entries()) {
      if (challengerId === clientId || challenge.targetId === clientId) {
        clearTimeout(challenge.timeout);
        this.pendingChallenges.delete(challengerId);
      }
    }
    const session = this.getSessionByClient(clientId);
    if (session) {
      const opponent = session.p1.id === clientId ? session.p2 : session.p1;
      session.p1Provider.cancel();
      session.p2Provider.cancel();
      this.gameState.send(opponent, {
        type: 33 /* BattleEnd */,
        battleId: session.battleId,
        winnerId: opponent.id,
        reason: "Opponent disconnected",
        timestamp: Date.now()
      });
      this.endBattleSession(session.battleId);
    }
  }
  getSessionByClient(clientId) {
    const battleId = this.playerToSession.get(clientId);
    return battleId ? this.activeSessions.get(battleId) : void 0;
  }
  endBattleSession(battleId) {
    const session = this.activeSessions.get(battleId);
    if (session) {
      this.playerToSession.delete(session.p1.id);
      this.playerToSession.delete(session.p2.id);
      this.activeSessions.delete(battleId);
      this.battleManager.destroyBattle(battleId);
    }
  }
};

// apps/game-server/server/multiplayer/SaveManager.ts
import fs from "fs";
import path from "path";
var SAVES_DIR = path.join(process.cwd(), "data", "saves");
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
}
function savePlayerData(clientId, data) {
  const filePath = path.join(SAVES_DIR, `${clientId}.json`);
  try {
    const pm = PokemonManager.getInstance();
    pm.clearOwnerLocations(clientId);
    const partyData = {
      slots: new Array(6).fill(null),
      activeSlotIndex: 0
    };
    const pcData = {
      boxes: [],
      activeBoxIndex: 0
    };
    for (let i = 0; i < 32; i++) {
      pcData.boxes.push({
        name: `Box ${i + 1}`,
        slots: new Array(30).fill(null)
      });
    }
    const ownedPokemon = [];
    const processMon = (mon, locType, slot, box) => {
      const pokemon = monsterInstanceToPokemonInstance(mon, { otId: clientId });
      ownedPokemon.push(pokemon);
      const loc = {
        type: locType,
        ownerId: clientId,
        slotIndex: slot,
        boxIndex: box
      };
      if (!pm.getPokemonById(pokemon.id)) {
        pm.registerPokemon(pokemon, loc);
      } else {
        pm.updateLocation(pokemon.id, loc);
      }
      return pokemon.id;
    };
    if (data.party) {
      for (let i = 0; i < data.party.length; i++) {
        if (data.party[i]) {
          partyData.slots[i] = processMon(data.party[i], "party" /* Party */, i);
        }
      }
    }
    if (data.boxes) {
      for (let b = 0; b < data.boxes.length && b < 32; b++) {
        const box = data.boxes[b];
        for (let s = 0; s < box.length && s < 30; s++) {
          if (box[s]) {
            pcData.boxes[b].slots[s] = processMon(box[s], "pc" /* PC */, s, b);
          }
        }
      }
    }
    const dataToSave = { ...data };
    delete dataToSave.party;
    delete dataToSave.boxes;
    const saveFile = {
      playerData: dataToSave,
      party: partyData,
      pc: pcData,
      ownedPokemon
    };
    fs.writeFileSync(filePath, JSON.stringify(saveFile, null, 2));
  } catch (err) {
    console.error(`[SaveManager] Failed to save player data for ${clientId}:`, err);
  }
}
function loadPlayerData(clientId) {
  const filePath = path.join(SAVES_DIR, `${clientId}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const dataStr = fs.readFileSync(filePath, "utf-8");
      const rawData = JSON.parse(dataStr);
      if (rawData.ownedPokemon && rawData.playerData) {
        const saveFile = rawData;
        const pm = PokemonManager.getInstance();
        pm.clearOwnerLocations(clientId);
        const findMonLoc = (monId) => {
          if (saveFile.party?.slots) {
            const partyIdx = saveFile.party.slots.indexOf(monId);
            if (partyIdx !== -1) {
              return { type: "party" /* Party */, ownerId: clientId, slotIndex: partyIdx };
            }
          }
          if (saveFile.pc?.boxes) {
            for (let b = 0; b < saveFile.pc.boxes.length; b++) {
              const slotIdx = saveFile.pc.boxes[b].slots?.indexOf(monId);
              if (slotIdx !== void 0 && slotIdx !== -1) {
                return { type: "pc" /* PC */, ownerId: clientId, boxIndex: b, slotIndex: slotIdx };
              }
            }
          }
          return { type: "party" /* Party */, ownerId: clientId, slotIndex: 0 };
        };
        for (const mon of saveFile.ownedPokemon) {
          if (!mon.speciesId && mon.species) mon.speciesId = mon.species;
          const loc = findMonLoc(mon.id);
          try {
            if (!pm.getPokemonById(mon.id)) {
              pm.registerPokemon(mon, loc);
            } else {
              pm.updateLocation(mon.id, loc);
            }
          } catch (e) {
            console.error(`[SaveManager] Error loading mon ${mon.id}:`, e);
          }
        }
        const partyArray = [];
        for (let i = 0; i < saveFile.party.slots.length; i++) {
          const id = saveFile.party.slots[i];
          if (id) {
            pm.updateLocation(id, { type: "party" /* Party */, ownerId: clientId, slotIndex: i });
            partyArray.push(pm.getPokemonById(id));
          }
        }
        const boxesArray = [];
        for (let b = 0; b < saveFile.pc.boxes.length; b++) {
          const boxArr = [];
          for (let s = 0; s < saveFile.pc.boxes[b].slots.length; s++) {
            const id = saveFile.pc.boxes[b].slots[s];
            if (id) {
              pm.updateLocation(id, { type: "pc" /* PC */, ownerId: clientId, slotIndex: s, boxIndex: b });
              boxArr.push(pm.getPokemonById(id));
            }
          }
          boxesArray.push(boxArr);
        }
        const pd = saveFile.playerData;
        pd.party = partyArray;
        pd.boxes = boxesArray;
        return pd;
      } else {
        return rawData;
      }
    }
  } catch (err) {
    console.error(`[SaveManager] Failed to load player data for ${clientId}:`, err);
  }
  return void 0;
}

// apps/game-server/server/battleResolution/providers/WildAIActionProvider.ts
var WildAIActionProvider = class {
  participantId;
  constructor(participantId) {
    this.participantId = participantId;
  }
  getAction(context) {
    const wildPart = context.getParticipant(this.participantId);
    if (!wildPart) {
      return Promise.resolve({
        type: "Run" /* Run */,
        participantId: this.participantId,
        priority: 0
      });
    }
    const activeMon = wildPart.party[wildPart.activePokemonIndex];
    if (!activeMon || activeMon.currentHp <= 0) {
      return Promise.resolve({
        type: "Run" /* Run */,
        participantId: this.participantId,
        priority: 0
      });
    }
    let targetId = "";
    for (const [id, p] of context.state.participants.entries()) {
      if (id !== this.participantId) {
        targetId = id;
        break;
      }
    }
    const validMoves = activeMon.moves && activeMon.moves.length > 0 ? activeMon.moves : [1];
    const selectedMoveId = validMoves[Math.floor(Math.random() * validMoves.length)];
    const moveAction = {
      type: "Move" /* Move */,
      participantId: this.participantId,
      priority: 0,
      moveId: selectedMoveId,
      targetId
    };
    return Promise.resolve(moveAction);
  }
};

// apps/game-server/server/multiplayer/integration/BattleAdapter.ts
var BattleAdapter = class {
  gameState;
  newBattleManager;
  battleSessionManager;
  constructor(gameState) {
    this.gameState = gameState;
    this.newBattleManager = new BattleManager();
    this.battleSessionManager = new BattleSessionManager(gameState, this.newBattleManager);
  }
  handlePacket(client, packet) {
    switch (packet.type) {
      case 34 /* BattleChallengeRequest */:
        this.handleChallengeRequest(client, packet);
        break;
      case 36 /* BattleChallengeAnswer */:
        this.handleChallengeAnswer(client, packet);
        break;
      case 31 /* BattleAction */:
        this.handleActionPacket(client, packet);
        break;
    }
  }
  createEncounter(playerId, wildEntityId) {
    if (!GameplayValidator.validatePlayerCanBattle(this.gameState, playerId)) return false;
    const wild = GameplayValidator.validateWildPokemon(wildEntityId);
    if (!wild) return false;
    const client = this.gameState.getClient(playerId);
    if (!client || !client.playerData || !client.playerData.party) return false;
    const pm = PokemonManager.getInstance();
    const wildPokemonInstance = pm.getPokemonById(wild.pokemonInstanceId);
    if (!wildPokemonInstance) return false;
    let playerParty = pm.getParty(playerId).filter((p) => p !== null);
    if (playerParty.length === 0 && client.playerData.party) {
      playerParty = client.playerData.party.map((m) => monsterInstanceToPokemonInstance(m, { otId: playerId }));
      playerParty.forEach((mon, i) => {
        pm.registerPokemon(mon, { type: "party" /* Party */, ownerId: playerId, slotIndex: i });
      });
    }
    const battle = this.newBattleManager.createBattle([
      {
        type: "Player" /* Player */,
        id: playerId,
        name: client.username,
        party: playerParty
      },
      {
        type: "Wild" /* Wild */,
        id: wildEntityId,
        name: `Wild`,
        party: [wildPokemonInstance]
      }
    ]);
    const playerProvider = new HumanActionProvider(playerId);
    const wildProvider = new WildAIActionProvider(wildEntityId);
    battle.setProvider(playerId, playerProvider);
    battle.setProvider(wildEntityId, wildProvider);
    const playerMonsters = client.playerData.party.map((m) => ({
      speciesId: m.speciesId,
      level: m.level,
      currentHp: m.currentHp,
      maxHp: m.maxHp,
      stats: m.stats,
      status: m.status ?? 0,
      nickname: m.nickname
    }));
    const opponentMonsters = [{
      speciesId: wildPokemonInstance.speciesId,
      level: wildPokemonInstance.level,
      currentHp: wildPokemonInstance.currentHp,
      maxHp: wildPokemonInstance.maxHp ?? wildPokemonInstance.stats.hp,
      stats: wildPokemonInstance.stats,
      status: wildPokemonInstance.status ?? 0,
      nickname: "Wild"
    }];
    const env = this.gameState.getBattleEnvironmentData(client.mapInstanceId, client.position.x, client.position.y);
    this.gameState.send(client, {
      type: 30 /* BattleStart */,
      battleId: battle.state.id,
      isPvP: false,
      opponentName: "Wild Pokemon",
      opponentId: wildEntityId,
      playerMonsters,
      opponentMonsters,
      env,
      timestamp: Date.now()
    });
    wild.currentState = "battling" /* Battling */;
    battle.requestTurnActions().catch((err) => console.warn("[BattleAdapter] Turn action error:", err));
    return true;
  }
  handleChallengeRequest(challenger, packet) {
    this.battleSessionManager.handleChallengeRequest(challenger, packet);
  }
  handleChallengeAnswer(sender, packet) {
    this.battleSessionManager.handleChallengeAnswer(sender, packet);
  }
  startPvPBattle(p1, p2) {
    this.battleSessionManager.startPvPBattle(p1, p2);
  }
  handleClientDisconnect(clientId) {
    this.battleSessionManager.handleClientDisconnect(clientId);
    for (const battle of this.newBattleManager.getActiveBattles()) {
      if (battle.state.participants.has(clientId)) {
        const provider = battle.getProvider(clientId);
        if (provider && provider.cancel) provider.cancel();
        let targetId = "";
        for (const [id] of battle.state.participants.entries()) {
          if (id !== clientId) {
            targetId = id;
            break;
          }
        }
        this.endEncounter(battle.state.id, clientId, targetId);
      }
    }
  }
  handleActionPacket(client, packet) {
    if (this.battleSessionManager.getSessionByClient(client.id)) {
      this.battleSessionManager.handleBattleAction(client, packet);
      return;
    }
    const battle = this.newBattleManager.getBattle(packet.battleId);
    if (!battle) return;
    const participant = battle.state.participants.get(client.id);
    if (!participant) return;
    const pData = packet.action;
    let action;
    let targetId = "";
    for (const [id] of battle.state.participants.entries()) {
      if (id !== client.id) {
        targetId = id;
        break;
      }
    }
    if (pData.kind === "attack") {
      const activeMon = participant.party[participant.activePokemonIndex];
      const moveId = activeMon.moves[pData.moveIndex] || 1;
      action = { type: "Move", participantId: client.id, priority: 0, moveId, targetId };
    } else if (pData.kind === "switch") {
      const nextMon = participant.party[pData.slot];
      if (nextMon) {
        action = { type: "Switch", participantId: client.id, priority: 6, nextPokemonId: nextMon.id };
      }
    } else if (pData.kind === "item") {
      action = { type: "Item", participantId: client.id, priority: 6, itemId: pData.itemId, targetId };
    } else if (pData.kind === "run") {
      action = { type: "Run", participantId: client.id, priority: 6 };
      this.endEncounter(battle.state.id, client.id, targetId);
      return;
    }
    if (action) {
      try {
        battle.submitAction(action);
      } catch (e) {
        console.error("Action error", e);
        return;
      }
      if (battle.state.events.length > 0) {
        this.sendBattleEvents(client, battle, targetId);
      }
    }
  }
  sendBattleEvents(client, battle, targetId) {
    const legacyEvents = [];
    let battleOver = false;
    let pActiveFainted = false;
    for (const evt of battle.state.events) {
      if (evt.type === "Message" /* Message */) {
        legacyEvents.push({ type: "message", text: evt.payload.text });
      } else if (evt.type === "Damage" /* Damage */) {
        legacyEvents.push({
          type: "damage",
          target: evt.payload.targetId === client.id ? "player" : "opponent",
          amount: evt.payload.damage,
          isCrit: evt.payload.isCritical,
          effectiveness: evt.payload.typeEffectiveness
        });
      } else if (evt.type === "PokemonFainted" /* PokemonFainted */) {
        legacyEvents.push({
          type: "faint",
          target: evt.payload.participantId === client.id ? "player" : "opponent"
        });
        if (evt.payload.participantId === client.id) {
          pActiveFainted = true;
        }
      } else if (evt.type === "Switch" /* Switch */) {
      } else if (evt.type === CaptureEventType.CaptureSuccess) {
        legacyEvents.push({ type: "message", text: "Gotcha! Caught it!" });
        legacyEvents.push({ type: "catch", success: true });
        battleOver = true;
      } else if (evt.type === CaptureEventType.CaptureFailure) {
        legacyEvents.push({ type: "message", text: "It broke free!" });
        legacyEvents.push({ type: "catch", success: false });
      } else if (evt.type === "BattleEnded" /* BattleEnded */ || evt.type === CaptureEventType.BattleEnded) {
        battleOver = true;
      }
    }
    battle.state.events = [];
    for (const [id] of battle.state.participants.entries()) {
      const pClient = this.gameState.getClient(id);
      if (pClient) {
        this.gameState.send(pClient, {
          type: 32 /* BattleResult */,
          battleId: battle.state.id,
          events: legacyEvents,
          battleOver,
          turnReady: !pActiveFainted,
          timestamp: Date.now()
        });
      }
    }
    if (battleOver || battle.state.phase === "End") {
      this.endEncounter(battle.state.id, client.id, targetId);
    } else {
      battle.requestTurnActions().catch((err) => console.warn("[BattleAdapter] Next turn error:", err));
    }
  }
  endEncounter(battleId, playerId, wildEntityId) {
    const battle = this.newBattleManager.getBattle(battleId);
    if (battle) {
      this.newBattleManager.destroyBattle(battleId);
    }
    const now = Date.now();
    const client = this.gameState.getClient(playerId);
    if (client) {
      client.lastEncounterTime = now;
      client.encounterCooldownUntil = now + ENCOUNTER_COOLDOWN_MS;
    }
    const wild = PokemonManager.getInstance().getWildPokemon(wildEntityId);
    if (wild) {
      const wildMon = PokemonManager.getInstance().getPokemonById(wild.pokemonInstanceId);
      if (!wildMon || wildMon.currentHp <= 0 || wildMon.ownerId || PokemonManager.getInstance().getLocation(wildMon.id)?.ownerId) {
        this.gameState.broadcastToMap(wild.spawnBiome, {
          type: 23,
          // EntityDespawn
          entityId: wildEntityId,
          timestamp: Date.now()
        });
        PokemonManager.getInstance().removeWildPokemon(wildEntityId);
      } else {
        wild.currentState = "wandering" /* Wandering */;
        wild.lastEncounterPlayerId = playerId;
        wild.lastEncounterTime = now;
        wild.ignorePlayerUntil = now + ENCOUNTER_COOLDOWN_MS;
      }
    }
    if (client && client.playerData) {
      const pParty = PokemonManager.getInstance().getParty(playerId);
      const mParty = [];
      for (let i = 0; i < 6; i++) {
        if (pParty[i]) {
          mParty.push(pokemonInstanceToMonsterInstance(pParty[i]));
        }
      }
      client.playerData.party = mParty;
      for (let b = 0; b < 32; b++) {
        const box = PokemonManager.getInstance().getPCBox(playerId, b);
        const arr = [];
        box.forEach((p) => {
          arr.push(pokemonInstanceToMonsterInstance(p));
        });
        if (arr.length > 0) {
          client.playerData.boxes[b] = arr;
        } else {
          delete client.playerData.boxes[b];
        }
      }
      savePlayerData(playerId, client.playerData);
    }
  }
};

// apps/game-server/server/multiplayer/integration/EncounterIntegration.ts
var EncounterIntegration = class {
  gameState;
  battleAdapter;
  interval = null;
  constructor(gameState, battleAdapter) {
    this.gameState = gameState;
    this.battleAdapter = battleAdapter;
  }
  start() {
    if (!this.interval) {
      this.interval = setInterval(() => this.update(100), 100);
    }
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  update(dt) {
    const pm = PokemonManager.getInstance();
    const clients = this.gameState.getAllClients();
    const wilds = pm.getAllWildPokemon();
    const now = Date.now();
    for (const wild of wilds) {
      if (wild.currentState !== "wandering" /* Wandering */ && wild.currentState !== "chasing" /* Chasing */) {
        continue;
      }
      for (const client of clients) {
        if (this.isPlayerInBattle(client.id)) {
          continue;
        }
        if (client.mapInstanceId === wild.spawnBiome) {
          const dist = vec2Distance(client.position, wild.position);
          if (dist < 24) {
            const isWildIgnoringPlayer = wild.lastEncounterPlayerId === client.id && (wild.ignorePlayerUntil !== void 0 && now < wild.ignorePlayerUntil);
            const isPlayerOnCooldown = client.encounterCooldownUntil !== void 0 && now < client.encounterCooldownUntil;
            if (isWildIgnoringPlayer || isPlayerOnCooldown) {
              const startPos = wild.encounterStartPos || client.lastEncounterStartPos;
              if (startPos) {
                const distFromStart = vec2Distance(client.position, startPos);
                if (distFromStart >= ENCOUNTER_RESET_DISTANCE) {
                  wild.ignorePlayerUntil = 0;
                  client.encounterCooldownUntil = 0;
                  this.initiateEncounter(client.id, wild.entityId);
                  break;
                }
              }
              continue;
            }
            this.initiateEncounter(client.id, wild.entityId);
            break;
          }
        }
      }
    }
  }
  isPlayerInBattle(playerId) {
    const battles = this.battleAdapter.newBattleManager.getActiveBattles();
    for (const battle of battles) {
      if (battle.state.participants.has(playerId)) {
        return true;
      }
    }
    return false;
  }
  initiateEncounter(playerId, wildEntityId) {
    const pm = PokemonManager.getInstance();
    const wild = pm.getWildPokemon(wildEntityId);
    if (!wild || wild.currentState === "battling" /* Battling */) return;
    const client = this.gameState.getClient(playerId);
    const now = Date.now();
    wild.lastEncounterPlayerId = playerId;
    wild.lastEncounterTime = now;
    wild.encounterStartPos = { x: wild.position.x, y: wild.position.y };
    if (client) {
      client.lastEncounterTime = now;
      client.lastEncounterStartPos = { x: client.position.x, y: client.position.y };
    }
    console.log(`[EncounterIntegration] Triggering encounter: ${playerId} vs ${wildEntityId}`);
    this.battleAdapter.createEncounter(playerId, wildEntityId);
  }
};

// apps/game-server/server/multiplayer/TradeSession.ts
var TradeSession = class {
  id;
  p1;
  p2;
  p1Slot = -1;
  p2Slot = -1;
  p1Confirmed = false;
  p2Confirmed = false;
  p1DoubleConfirmed = false;
  p2DoubleConfirmed = false;
  stage = "init" /* Init */;
  createdTime;
  updatedTime;
  constructor(id, p1, p2) {
    this.id = id;
    this.p1 = p1;
    this.p2 = p2;
    this.createdTime = Date.now();
    this.updatedTime = this.createdTime;
    this.stage = "offering" /* Offering */;
  }
  isParticipant(clientId) {
    return this.p1.id === clientId || this.p2.id === clientId;
  }
  getOpponent(clientId) {
    return this.p1.id === clientId ? this.p2 : this.p1;
  }
  isP1(clientId) {
    return this.p1.id === clientId;
  }
  updateOffer(clientId, slot) {
    if (this.isP1(clientId)) {
      this.p1Slot = slot;
    } else {
      this.p2Slot = slot;
    }
    this.resetConfirmations();
    this.stage = "offering" /* Offering */;
    this.updatedTime = Date.now();
  }
  setConfirm(clientId, confirmed) {
    if (this.isP1(clientId)) {
      this.p1Confirmed = confirmed;
    } else {
      this.p2Confirmed = confirmed;
    }
    this.updatedTime = Date.now();
    if (this.p1Confirmed && this.p2Confirmed) {
      this.stage = "confirming" /* Confirming */;
    } else {
      this.stage = "offering" /* Offering */;
      this.p1DoubleConfirmed = false;
      this.p2DoubleConfirmed = false;
    }
  }
  setDoubleConfirm(clientId, doubleConfirmed) {
    if (this.isP1(clientId)) {
      this.p1DoubleConfirmed = doubleConfirmed;
    } else {
      this.p2DoubleConfirmed = doubleConfirmed;
    }
    this.updatedTime = Date.now();
  }
  resetConfirmations() {
    this.p1Confirmed = false;
    this.p2Confirmed = false;
    this.p1DoubleConfirmed = false;
    this.p2DoubleConfirmed = false;
  }
  isReadyForExecution() {
    return this.p1Slot >= 0 && this.p2Slot >= 0 && this.p1Confirmed && this.p2Confirmed && this.stage !== "completed" /* Completed */ && this.stage !== "cancelled" /* Cancelled */;
  }
  markCompleted() {
    this.stage = "completed" /* Completed */;
    this.updatedTime = Date.now();
  }
  markCancelled() {
    this.stage = "cancelled" /* Cancelled */;
    this.updatedTime = Date.now();
  }
};

// apps/game-server/server/multiplayer/TradeValidator.ts
var TradeValidator = class {
  /**
   * Validates if a client is allowed to offer a monster at a given party slot index
   */
  static validateOffer(client, slot) {
    if (slot < 0) {
      return { valid: true };
    }
    const party = client.playerData?.party || [];
    if (slot >= party.length) {
      return { valid: false, reason: "Invalid party slot index." };
    }
    const monster = party[slot];
    if (!monster) {
      return { valid: false, reason: "No monster found in selected slot." };
    }
    const pm = PokemonManager.getInstance();
    const serverParty = pm.getParty(client.id);
    if (!serverParty[slot]) {
      return { valid: false, reason: "Authoritative server party mismatch." };
    }
    return { valid: true };
  }
  /**
   * Validates if the entire trade session can be executed safely
   */
  static validateTradeExecution(session) {
    const p1 = session.p1;
    const p2 = session.p2;
    if (!p1.playerData || !p2.playerData) {
      return { valid: false, reason: "Player data missing." };
    }
    const p1Party = p1.playerData.party || [];
    const p2Party = p2.playerData.party || [];
    if (session.p1Slot < 0 || session.p1Slot >= p1Party.length) {
      return { valid: false, reason: "Player 1 offered slot is out of bounds." };
    }
    if (session.p2Slot < 0 || session.p2Slot >= p2Party.length) {
      return { valid: false, reason: "Player 2 offered slot is out of bounds." };
    }
    const m1 = p1Party[session.p1Slot];
    const m2 = p2Party[session.p2Slot];
    if (!m1 || !m2) {
      return { valid: false, reason: "Offered monster instance is null or undefined." };
    }
    const pm = PokemonManager.getInstance();
    const pmP1Party = pm.getParty(p1.id);
    const pmP2Party = pm.getParty(p2.id);
    const pmP1Mon = pmP1Party[session.p1Slot];
    const pmP2Mon = pmP2Party[session.p2Slot];
    if (!pmP1Mon || !pmP2Mon) {
      return { valid: false, reason: "Server side party state validation failed." };
    }
    if (pmP1Mon.id === pmP2Mon.id) {
      return { valid: false, reason: "Cannot trade identical monster instances." };
    }
    return { valid: true };
  }
};

// apps/game-server/server/multiplayer/TradeManager.ts
var TradeManager = class {
  server;
  sessions = /* @__PURE__ */ new Map();
  playerToSession = /* @__PURE__ */ new Map();
  // clientId -> tradeId for O(1) lookup
  pendingRequests = /* @__PURE__ */ new Map();
  eventListeners = [];
  constructor(server) {
    this.server = server;
  }
  addEventListener(listener) {
    this.eventListeners.push(listener);
  }
  emitEvent(event) {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[TradeManager] Event listener error:", err);
      }
    }
  }
  handlePacket(client, packet) {
    switch (packet.type) {
      case 70 /* TradeRequest */:
        this.handleTradeRequest(client, packet);
        break;
      case 71 /* TradeResponse */:
        this.handleTradeResponse(client, packet);
        break;
      case 72 /* TradeOfferUpdate */:
        this.handleTradeOfferUpdate(client, packet);
        break;
      case 73 /* TradeConfirm */:
        this.handleTradeConfirm(client, packet);
        break;
    }
  }
  handleTradeRequest(client, packet) {
    const target = this.server.getClient(packet.targetPlayerId);
    if (!target) {
      this.server.send(client, {
        type: 74 /* TradeComplete */,
        tradeId: "none",
        success: false,
        timestamp: Date.now()
      });
      return;
    }
    const existing = this.pendingRequests.get(client.id);
    if (existing) {
      clearTimeout(existing.timeout);
      this.pendingRequests.delete(client.id);
    }
    const timeout = setTimeout(() => {
      this.pendingRequests.delete(client.id);
      this.server.send(client, {
        type: 71 /* TradeResponse */,
        senderId: target.id,
        senderName: target.username,
        accept: false,
        timestamp: Date.now()
      });
    }, 3e4);
    this.pendingRequests.set(client.id, { targetId: target.id, timeout });
    this.emitEvent({
      type: "request",
      data: {
        senderId: client.id,
        senderName: client.username,
        targetId: target.id,
        timestamp: Date.now()
      }
    });
    this.server.send(target, {
      type: 70 /* TradeRequest */,
      targetPlayerId: client.id,
      senderName: client.username,
      timestamp: Date.now()
    });
  }
  handleTradeResponse(client, packet) {
    const challenger = this.server.getClient(packet.senderId);
    if (!challenger) return;
    const req = this.pendingRequests.get(challenger.id);
    if (!req || req.targetId !== client.id) return;
    clearTimeout(req.timeout);
    this.pendingRequests.delete(challenger.id);
    this.emitEvent({
      type: "response",
      data: {
        senderId: challenger.id,
        senderName: challenger.username,
        targetId: client.id,
        accepted: packet.accept,
        timestamp: Date.now()
      }
    });
    if (packet.accept) {
      const tradeId = `trade_${Date.now()}_${challenger.id}_${client.id}`;
      const session = new TradeSession(tradeId, challenger, client);
      this.sessions.set(tradeId, session);
      this.playerToSession.set(challenger.id, tradeId);
      this.playerToSession.set(client.id, tradeId);
      const welcomeTrade = {
        type: 71 /* TradeResponse */,
        senderId: challenger.id,
        senderName: challenger.username,
        accept: true,
        timestamp: Date.now(),
        seq: 1
      };
      this.server.send(challenger, {
        ...welcomeTrade,
        senderId: client.id,
        senderName: client.username
      });
      this.server.send(client, welcomeTrade);
    } else {
      this.server.send(challenger, {
        type: 71 /* TradeResponse */,
        senderId: client.id,
        senderName: client.username,
        accept: false,
        timestamp: Date.now()
      });
    }
  }
  handleTradeOfferUpdate(client, packet) {
    const session = this.sessions.get(packet.tradeId) || this.getSessionByClient(client.id);
    if (!session) return;
    const val = TradeValidator.validateOffer(client, packet.offeredSlot);
    if (!val.valid) {
      console.warn(`[TradeManager] Invalid offer from ${client.id}: ${val.reason}`);
      return;
    }
    session.updateOffer(client.id, packet.offeredSlot);
    const opponent = session.getOpponent(client.id);
    this.emitEvent({
      type: "offer_update",
      data: {
        tradeId: session.id,
        playerId: client.id,
        offeredSlot: packet.offeredSlot,
        offeredSnapshot: packet.offeredMonsterSnapshot,
        timestamp: Date.now()
      }
    });
    this.server.send(opponent, {
      type: 72 /* TradeOfferUpdate */,
      tradeId: session.id,
      offeredSlot: packet.offeredSlot,
      offeredMonsterSnapshot: packet.offeredMonsterSnapshot,
      timestamp: Date.now()
    });
  }
  handleTradeConfirm(client, packet) {
    const session = this.sessions.get(packet.tradeId) || this.getSessionByClient(client.id);
    if (!session) return;
    session.setConfirm(client.id, packet.confirmed);
    const opponent = session.getOpponent(client.id);
    this.emitEvent({
      type: "confirm",
      data: {
        tradeId: session.id,
        playerId: client.id,
        confirmed: packet.confirmed,
        timestamp: Date.now()
      }
    });
    this.server.send(opponent, {
      type: 73 /* TradeConfirm */,
      tradeId: session.id,
      confirmed: packet.confirmed,
      timestamp: Date.now()
    });
    if (session.isReadyForExecution()) {
      this.executeTrade(session);
    }
  }
  executeTrade(session) {
    const validation = TradeValidator.validateTradeExecution(session);
    if (!validation.valid) {
      this.failTrade(session, validation.reason || "Trade validation failed.");
      return;
    }
    const p1 = session.p1;
    const p2 = session.p2;
    const pm = PokemonManager.getInstance();
    const pmP1Mon = pm.getParty(p1.id)[session.p1Slot];
    const pmP2Mon = pm.getParty(p2.id)[session.p2Slot];
    if (pmP1Mon && pmP2Mon) {
      pm.updateLocation(pmP1Mon.id, {
        type: "party" /* Party */,
        ownerId: p2.id,
        slotIndex: session.p2Slot
      });
      pm.updateLocation(pmP2Mon.id, {
        type: "party" /* Party */,
        ownerId: p1.id,
        slotIndex: session.p1Slot
      });
    }
    if (p1.playerData) {
      p1.playerData.party = pm.getParty(p1.id).filter((p) => p !== null).map((p) => pokemonInstanceToMonsterInstance(p));
      savePlayerData(p1.id, p1.playerData);
    }
    if (p2.playerData) {
      p2.playerData.party = pm.getParty(p2.id).filter((p) => p !== null).map((p) => pokemonInstanceToMonsterInstance(p));
      savePlayerData(p2.id, p2.playerData);
    }
    const m1 = p1.playerData?.party[session.p1Slot];
    const m2 = p2.playerData?.party[session.p2Slot];
    const m1Snapshot = {
      speciesId: m1?.speciesId ?? 0,
      level: m1?.level ?? 1,
      currentHp: m1?.currentHp ?? 10,
      maxHp: m1?.maxHp ?? 10,
      stats: m1?.stats ?? { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
      status: m1?.status ?? 0,
      nickname: m1?.nickname
    };
    const m2Snapshot = {
      speciesId: m2?.speciesId ?? 0,
      level: m2?.level ?? 1,
      currentHp: m2?.currentHp ?? 10,
      maxHp: m2?.maxHp ?? 10,
      stats: m2?.stats ?? { hp: 10, attack: 10, defense: 10, spAttack: 10, spDefense: 10, speed: 10 },
      status: m2?.status ?? 0,
      nickname: m2?.nickname
    };
    session.markCompleted();
    this.emitEvent({
      type: "complete",
      data: {
        tradeId: session.id,
        p1Id: p1.id,
        p2Id: p2.id,
        success: true,
        p1ReceivedSnapshot: m2Snapshot,
        p2ReceivedSnapshot: m1Snapshot,
        timestamp: Date.now()
      }
    });
    this.server.send(p1, {
      type: 74 /* TradeComplete */,
      tradeId: session.id,
      success: true,
      receivedMonster: m2Snapshot
    });
    this.server.send(p2, {
      type: 74 /* TradeComplete */,
      tradeId: session.id,
      success: true,
      receivedMonster: m1Snapshot
    });
    this.cleanupSession(session.id);
  }
  failTrade(session, reason) {
    session.markCancelled();
    const failPacket = {
      type: 74 /* TradeComplete */,
      tradeId: session.id,
      success: false,
      timestamp: Date.now()
    };
    this.server.send(session.p1, failPacket);
    this.server.send(session.p2, failPacket);
    this.emitEvent({
      type: "complete",
      data: {
        tradeId: session.id,
        p1Id: session.p1.id,
        p2Id: session.p2.id,
        success: false,
        reason,
        timestamp: Date.now()
      }
    });
    this.cleanupSession(session.id);
  }
  getSessionByClient(clientId) {
    const tradeId = this.playerToSession.get(clientId);
    return tradeId ? this.sessions.get(tradeId) : void 0;
  }
  handleClientDisconnect(clientId) {
    const req = this.pendingRequests.get(clientId);
    if (req) {
      clearTimeout(req.timeout);
      this.pendingRequests.delete(clientId);
    }
    for (const [challengerId, challenge] of this.pendingRequests.entries()) {
      if (challenge.targetId === clientId) {
        clearTimeout(challenge.timeout);
        this.pendingRequests.delete(challengerId);
      }
    }
    const session = this.getSessionByClient(clientId);
    if (session) {
      const opponent = session.getOpponent(clientId);
      this.server.send(opponent, {
        type: 74 /* TradeComplete */,
        tradeId: session.id,
        success: false,
        timestamp: Date.now()
      });
      this.emitEvent({
        type: "cancel",
        data: {
          tradeId: session.id,
          cancellerId: clientId,
          reason: "Client disconnected",
          timestamp: Date.now()
        }
      });
      this.cleanupSession(session.id);
    }
  }
  cleanupSession(tradeId) {
    const session = this.sessions.get(tradeId);
    if (session) {
      this.playerToSession.delete(session.p1.id);
      this.playerToSession.delete(session.p2.id);
      this.sessions.delete(tradeId);
    }
  }
};

// apps/game-server/server/multiplayer/ai/BehaviorContext.ts
var BehaviorContext = class {
  wildPokemon;
  instance;
  gameState;
  controller;
  dt = 0;
  stateTimer = 0;
  spawnOrigin;
  targetPos = null;
  targetEntityId = null;
  maxRoamDistance = 300;
  constructor(wildPokemon, instance, gameState, controller) {
    this.wildPokemon = wildPokemon;
    this.instance = instance;
    this.gameState = gameState;
    this.controller = controller;
    this.spawnOrigin = { ...wildPokemon.position };
  }
  getNearbyPlayers(radius) {
    const clients = this.gameState.getClientsInMap(this.wildPokemon.spawnBiome);
    return clients.filter((c) => {
      const dist = vec2Distance(c.position, this.wildPokemon.position);
      return dist <= radius;
    });
  }
  getDistanceFromHome() {
    return vec2Distance(this.wildPokemon.position, this.spawnOrigin);
  }
  moveTowards(target, speed, dt) {
    const dist = vec2Distance(this.wildPokemon.position, target);
    if (dist > 0.5) {
      const dirX = (target.x - this.wildPokemon.position.x) / dist;
      const dirY = (target.y - this.wildPokemon.position.y) / dist;
      this.wildPokemon.position.x += dirX * speed * (dt / 1e3);
      this.wildPokemon.position.y += dirY * speed * (dt / 1e3);
      if (Math.abs(dirX) > Math.abs(dirY)) {
        this.wildPokemon.rotation = dirX > 0 ? "right" : "left";
      } else {
        this.wildPokemon.rotation = dirY > 0 ? "down" : "up";
      }
    }
  }
  hasLineOfSight(target) {
    return true;
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/IdleBehavior.ts
var IdleBehavior = class {
  idleDuration = 0;
  enter(context) {
    context.wildPokemon.currentState = "idle" /* Idle */;
    this.idleDuration = 1e3 + Math.random() * 4e3;
  }
  update(context, dt) {
    if (context.stateTimer >= this.idleDuration) {
      context.controller.changeState("roam");
      return;
    }
    const players = context.getNearbyPlayers(150);
    if (players.length > 0) {
      context.targetEntityId = players[0].id;
      context.controller.changeState("investigate");
    }
  }
  exit(context) {
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/RoamBehavior.ts
var RoamBehavior = class {
  roamSpeed = 30;
  // pixels per second
  roamDuration = 0;
  enter(context) {
    context.wildPokemon.currentState = "wandering" /* Wandering */;
    const angle = randFloat(0, Math.PI * 2);
    const distance = randFloat(10, context.maxRoamDistance);
    context.targetPos = {
      x: context.spawnOrigin.x + Math.cos(angle) * distance,
      y: context.spawnOrigin.y + Math.sin(angle) * distance
    };
    this.roamDuration = 5e3 + Math.random() * 5e3;
  }
  update(context, dt) {
    if (context.getDistanceFromHome() > context.maxRoamDistance * 1.5) {
      context.controller.changeState("returnHome");
      return;
    }
    const players = context.getNearbyPlayers(150);
    if (players.length > 0) {
      context.targetEntityId = players[0].id;
      context.controller.changeState("investigate");
      return;
    }
    if (context.targetPos) {
      context.moveTowards(context.targetPos, this.roamSpeed, dt);
      const dist = vec2Distance(context.wildPokemon.position, context.targetPos);
      if (dist < 5 || context.stateTimer > this.roamDuration) {
        context.controller.changeState("idle");
      }
    } else {
      context.controller.changeState("idle");
    }
  }
  exit(context) {
    context.targetPos = null;
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/SleepBehavior.ts
var SleepBehavior = class {
  enter(context) {
    context.wildPokemon.currentState = "idle" /* Idle */;
  }
  update(context, dt) {
    const players = context.getNearbyPlayers(50);
    if (players.length > 0) {
      context.controller.changeState("investigate");
      return;
    }
  }
  exit(context) {
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/InvestigateBehavior.ts
var InvestigateBehavior = class {
  speed = 40;
  enter(context) {
    context.wildPokemon.currentState = "wandering" /* Wandering */;
  }
  update(context, dt) {
    if (context.stateTimer > 1e4) {
      context.controller.changeState("idle");
      return;
    }
    if (!context.targetEntityId) {
      context.controller.changeState("idle");
      return;
    }
    const targetClient = context.gameState.getClient(context.targetEntityId);
    if (!targetClient) {
      context.controller.changeState("idle");
      return;
    }
    const dist = vec2Distance(context.wildPokemon.position, targetClient.position);
    const speciesId = context.instance.speciesId;
    const speciesName = String(context.instance.speciesName || context.instance.nickname || speciesId).toLowerCase();
    const isFleeing = ["63", "10", "13", "129", "abra", "caterpie", "weedle", "magikarp"].includes(speciesName) || [63, 10, 13, 129].includes(speciesId);
    const isAggressive = ["15", "130", "128", "19", "21", "beedrill", "gyarados", "tauros", "rattata", "spearow"].includes(speciesName) || [15, 130, 128, 19, 21].includes(speciesId);
    if (dist < 100) {
      if (isFleeing) {
        context.controller.changeState("flee");
        return;
      } else if (isAggressive) {
        context.controller.changeState("aggro");
        return;
      }
    }
    if (dist < 80) {
      context.controller.changeState("idle");
      return;
    } else if (dist > 250) {
      context.controller.changeState("idle");
      return;
    }
    context.moveTowards(targetClient.position, this.speed, dt);
  }
  exit(context) {
    context.targetEntityId = null;
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/FollowBehavior.ts
var FollowBehavior = class {
  speed = 45;
  enter(context) {
    context.wildPokemon.currentState = "chasing" /* Chasing */;
  }
  update(context, dt) {
    if (!context.targetEntityId) {
      context.controller.changeState("idle");
      return;
    }
    const targetClient = context.gameState.getClient(context.targetEntityId);
    if (!targetClient) {
      context.controller.changeState("idle");
      return;
    }
    const dist = vec2Distance(context.wildPokemon.position, targetClient.position);
    if (dist < 40) {
      return;
    } else if (dist > 300) {
      context.controller.changeState("returnHome");
      return;
    }
    context.moveTowards(targetClient.position, this.speed, dt);
  }
  exit(context) {
    context.targetEntityId = null;
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/FleeBehavior.ts
var FleeBehavior = class {
  fleeSpeed = 60;
  enter(context) {
    context.wildPokemon.currentState = "fleeing" /* Fleeing */;
  }
  update(context, dt) {
    if (context.stateTimer > 8e3) {
      context.controller.changeState("despawn");
      return;
    }
    if (!context.targetEntityId) {
      context.controller.changeState("idle");
      return;
    }
    const targetClient = context.gameState.getClient(context.targetEntityId);
    if (!targetClient) {
      context.controller.changeState("idle");
      return;
    }
    const dist = vec2Distance(context.wildPokemon.position, targetClient.position);
    if (dist > 250) {
      context.controller.changeState("idle");
      return;
    }
    const dirX = context.wildPokemon.position.x - targetClient.position.x;
    const dirY = context.wildPokemon.position.y - targetClient.position.y;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length > 0) {
      const targetPos = {
        x: context.wildPokemon.position.x + dirX / length * 50,
        y: context.wildPokemon.position.y + dirY / length * 50
      };
      context.moveTowards(targetPos, this.fleeSpeed, dt);
    }
  }
  exit(context) {
    context.targetEntityId = null;
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/AggroBehavior.ts
var AggroBehavior = class {
  chaseSpeed = 55;
  enter(context) {
    context.wildPokemon.currentState = "chasing" /* Chasing */;
  }
  update(context, dt) {
    if (!context.targetEntityId) {
      context.controller.changeState("returnHome");
      return;
    }
    const targetClient = context.gameState.getClient(context.targetEntityId);
    if (!targetClient) {
      context.controller.changeState("returnHome");
      return;
    }
    const dist = vec2Distance(context.wildPokemon.position, targetClient.position);
    if (dist > 350) {
      context.controller.changeState("returnHome");
      return;
    }
    if (dist < 20) {
      return;
    }
    context.moveTowards(targetClient.position, this.chaseSpeed, dt);
  }
  exit(context) {
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/ReturnHomeBehavior.ts
var ReturnHomeBehavior = class {
  speed = 40;
  enter(context) {
    context.wildPokemon.currentState = "wandering" /* Wandering */;
  }
  update(context, dt) {
    const dist = vec2Distance(context.wildPokemon.position, context.spawnOrigin);
    if (dist < 20) {
      context.controller.changeState("idle");
      return;
    }
    if (context.stateTimer > 15e3) {
      context.wildPokemon.position.x = context.spawnOrigin.x;
      context.wildPokemon.position.y = context.spawnOrigin.y;
      context.controller.changeState("idle");
      return;
    }
    context.moveTowards(context.spawnOrigin, this.speed, dt);
  }
  exit(context) {
  }
};

// apps/game-server/server/multiplayer/ai/Behaviors/DespawnBehavior.ts
var DespawnBehavior = class {
  enter(context) {
    context.wildPokemon.currentState = "idle" /* Idle */;
    context.wildPokemon.despawnTimer = 1;
  }
  update(context, dt) {
  }
  exit(context) {
  }
};

// apps/game-server/server/multiplayer/ai/BehaviorController.ts
var BehaviorController = class {
  currentState = null;
  currentStateName = "";
  context;
  states = /* @__PURE__ */ new Map();
  constructor(wildPokemon, instance, gameState) {
    this.context = new BehaviorContext(wildPokemon, instance, gameState, this);
    this.states.set("idle", new IdleBehavior());
    this.states.set("roam", new RoamBehavior());
    this.states.set("sleep", new SleepBehavior());
    this.states.set("investigate", new InvestigateBehavior());
    this.states.set("follow", new FollowBehavior());
    this.states.set("flee", new FleeBehavior());
    this.states.set("aggro", new AggroBehavior());
    this.states.set("returnHome", new ReturnHomeBehavior());
    this.states.set("despawn", new DespawnBehavior());
    this.changeState("idle");
  }
  changeState(stateName) {
    if (this.currentStateName === stateName) return;
    const nextState = this.states.get(stateName);
    if (!nextState) return;
    if (this.currentState) {
      this.currentState.exit(this.context);
    }
    this.currentState = nextState;
    this.currentStateName = stateName;
    this.context.stateTimer = 0;
    this.currentState.enter(this.context);
  }
  update(dt) {
    this.context.dt = dt;
    this.context.stateTimer += dt;
    if (this.currentState) {
      this.currentState.update(this.context, dt);
    }
  }
  getContext() {
    return this.context;
  }
};

// apps/game-server/server/multiplayer/PokemonSpawnManager.ts
var MAX_POKEMON_PER_CHUNK = 2;
var DESPAWN_DISTANCE = 1e3;
var MIN_SPAWN_DISTANCE = 160;
var MAX_SPAWN_DISTANCE = 500;
var SPAWN_INTERVAL_MS = 5e3;
var AI_TICK_RATE = 200;
var PokemonSpawnManager = class {
  gameState;
  spawnTimer = null;
  aiTimer = null;
  lastAITick = 0;
  // Tracks active wild pokemon by entity ID
  activeSpawns = /* @__PURE__ */ new Set();
  aiControllers = /* @__PURE__ */ new Map();
  constructor(gameState) {
    this.gameState = gameState;
  }
  start() {
    if (!this.spawnTimer) {
      this.spawnTimer = setInterval(() => this.tickSpawns(), SPAWN_INTERVAL_MS);
    }
    if (!this.aiTimer) {
      this.lastAITick = Date.now();
      this.aiTimer = setInterval(() => this.tickAI(), AI_TICK_RATE);
    }
  }
  stop() {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
    if (this.aiTimer) {
      clearInterval(this.aiTimer);
      this.aiTimer = null;
    }
  }
  tickSpawns() {
    this.processSpawns();
    this.processDespawns();
  }
  tickAI() {
    const now = Date.now();
    const dt = now - this.lastAITick;
    this.lastAITick = now;
    const pm = PokemonManager.getInstance();
    const clients = this.gameState.getAllClients();
    for (const entityId of this.activeSpawns) {
      const wild = pm.getWildPokemon(entityId);
      if (!wild) continue;
      let isNearPlayer = false;
      for (const client of clients) {
        if (client.mapInstanceId === wild.spawnBiome) {
          const dist = vec2Distance(client.position, wild.position);
          if (dist < 800) {
            isNearPlayer = true;
            break;
          }
        }
      }
      if (!isNearPlayer) continue;
      const controller = this.aiControllers.get(entityId);
      if (controller) {
        const startPos = { ...wild.position };
        controller.update(dt);
        if (wild.despawnTimer !== void 0 && wild.despawnTimer > 0) {
          this.despawnPokemon(entityId);
          continue;
        }
        if (startPos.x !== wild.position.x || startPos.y !== wild.position.y) {
          this.gameState.broadcastToMap(wild.spawnBiome, {
            type: 24 /* EntityMove */,
            entityId,
            entityType: "pokemon",
            position: wild.position,
            rotation: wild.rotation,
            timestamp: Date.now()
          });
        }
      }
    }
  }
  despawnPokemon(entityId) {
    const pm = PokemonManager.getInstance();
    const wild = pm.getWildPokemon(entityId);
    if (wild) {
      this.gameState.broadcastToMap(wild.spawnBiome, {
        type: 23 /* EntityDespawn */,
        entityId,
        timestamp: Date.now()
      });
      pm.removeWildPokemon(entityId);
    }
    this.activeSpawns.delete(entityId);
    this.aiControllers.delete(entityId);
  }
  processSpawns() {
    const pm = PokemonManager.getInstance();
    const clients = this.gameState.getAllClients();
    if (clients.length === 0) return;
    const chunkBudgets = /* @__PURE__ */ new Map();
    for (const client of clients) {
      if (client.mapInstanceId.includes("interior")) continue;
      const map = this.gameState.getMap(client.mapInstanceId);
      if (!map) continue;
      const chunk = worldToChunk(client.position.x, client.position.y, CHUNK_SIZE, TILE_SIZE);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cx = chunk.x + dx;
          const cy = chunk.y + dy;
          const chunkKey = `${client.mapInstanceId}_${cx}_${cy}`;
          if (!chunkBudgets.has(chunkKey)) {
            chunkBudgets.set(chunkKey, 0);
          }
        }
      }
    }
    for (const entityId of this.activeSpawns) {
      const wild = pm.getWildPokemon(entityId);
      if (!wild) {
        this.activeSpawns.delete(entityId);
        continue;
      }
      const chunkKey = `${wild.spawnBiome}_${wild.spawnChunk.cx}_${wild.spawnChunk.cy}`;
      if (chunkBudgets.has(chunkKey)) {
        chunkBudgets.set(chunkKey, chunkBudgets.get(chunkKey) + 1);
      }
    }
    for (const client of clients) {
      if (client.mapInstanceId.includes("interior")) continue;
      const map = this.gameState.getMap(client.mapInstanceId);
      if (!map) continue;
      const chunk = worldToChunk(client.position.x, client.position.y, CHUNK_SIZE, TILE_SIZE);
      const chunkKey = `${client.mapInstanceId}_${chunk.x}_${chunk.y}`;
      const currentCount = chunkBudgets.get(chunkKey) || 0;
      if (currentCount < MAX_POKEMON_PER_CHUNK) {
        this.attemptSpawnForPlayer(client, map.seed);
        chunkBudgets.set(chunkKey, currentCount + 1);
      }
    }
  }
  attemptSpawnForPlayer(client, seed) {
    const angle = randFloat(0, Math.PI * 2);
    const distance = randFloat(MIN_SPAWN_DISTANCE, MAX_SPAWN_DISTANCE);
    const spawnX = client.position.x + Math.cos(angle) * distance;
    const spawnY = client.position.y + Math.sin(angle) * distance;
    const envData = this.gameState.getBattleEnvironmentData(client.mapInstanceId, spawnX, spawnY);
    const isWater = envData.groundTile === TILE_WATER;
    const isMountain = envData.groundTile === 4;
    const rules = BiomeSpawnTables[envData.biomeId];
    if (!rules || rules.length === 0) return;
    const validRules = rules.filter((r) => {
      if (r.conditions) {
        if (r.conditions.timeOfDay && !r.conditions.timeOfDay.includes(envData.timeOfDay)) return false;
        if (r.conditions.weather && !r.conditions.weather.includes(envData.weather)) return false;
        if (r.conditions.waterOnly && !isWater) return false;
        if (!r.conditions.waterOnly && isWater) return false;
        if (r.conditions.mountainOnly && !isMountain) return false;
        if (!r.conditions.mountainOnly && isMountain) return false;
      } else {
        if (isWater || isMountain) return false;
      }
      return true;
    });
    if (validRules.length === 0) return;
    const totalWeight = validRules.reduce((sum, rule) => sum + rule.weight, 0);
    let roll = randFloat(0, totalWeight);
    let selectedRule = null;
    for (const rule of validRules) {
      roll -= rule.weight;
      if (roll <= 0) {
        selectedRule = rule;
        break;
      }
    }
    if (!selectedRule) return;
    this.executeSpawn(selectedRule, spawnX, spawnY, envData.biomeId, client.mapInstanceId);
  }
  executeSpawn(rule, x, y, biomeId, mapId) {
    const pm = PokemonManager.getInstance();
    const level = randInt(rule.minLevel, rule.maxLevel);
    try {
      const instance = PokemonFactory.create({
        speciesId: rule.speciesId,
        level
      });
      const entityId = `wild_${Date.now()}_${randInt(0, 9999)}`;
      pm.registerPokemon(instance, {
        type: "wild" /* Wild */,
        entityId
      });
      const spawnChunk = worldToChunk(x, y, CHUNK_SIZE, TILE_SIZE);
      const wild = {
        entityId,
        pokemonInstanceId: instance.id,
        position: { x, y },
        rotation: "down",
        spawnChunk,
        spawnBiome: mapId,
        spawnTimestamp: Date.now(),
        currentState: "wandering" /* Wandering */
      };
      pm.registerWildPokemon(wild);
      this.activeSpawns.add(entityId);
      this.aiControllers.set(entityId, new BehaviorController(wild, instance, this.gameState));
      this.gameState.broadcastToMap(mapId, {
        type: 22 /* EntitySpawn */,
        entityId,
        entityType: "pokemon",
        position: { x, y },
        timestamp: Date.now(),
        data: {
          wildPokemon: wild,
          pokemonInstance: instance
        }
      });
      console.log(`[Spawn] ${instance.speciesId} at ${Math.round(x)},${Math.round(y)} in ${mapId}`);
    } catch (e) {
      console.error("Failed to spawn pokemon", e);
    }
  }
  processDespawns() {
    const pm = PokemonManager.getInstance();
    const clients = this.gameState.getAllClients();
    for (const entityId of this.activeSpawns) {
      const wild = pm.getWildPokemon(entityId);
      if (!wild) {
        this.activeSpawns.delete(entityId);
        continue;
      }
      if (wild.currentState === "battling" /* Battling */ || wild.currentState === "captured" /* Captured */) {
        continue;
      }
      let minDistance = Infinity;
      for (const client of clients) {
        if (client.mapInstanceId === wild.spawnBiome) {
          const dist = vec2Distance(client.position, wild.position);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }
      if (minDistance > DESPAWN_DISTANCE) {
        this.gameState.broadcastToMap(wild.spawnBiome, {
          type: 23 /* EntityDespawn */,
          entityId,
          timestamp: Date.now()
        });
        pm.removeWildPokemon(entityId);
        this.activeSpawns.delete(entityId);
        console.log(`[Despawn] ${entityId} due to distance or empty map`);
      }
    }
  }
};

// apps/game-server/server/multiplayer/game.ts
function getRouteSeed(mapId, worldSeed = WORLD_SEED) {
  if (mapId === "city") return 0;
  let hash = worldSeed;
  for (let i = 0; i < mapId.length; i++) {
    hash = (hash << 5) - hash + mapId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}
var GameState = class {
  nextId = 1;
  clients = /* @__PURE__ */ new Map();
  maps = /* @__PURE__ */ new Map();
  mapEmptyTime = /* @__PURE__ */ new Map();
  serverStartTime = Date.now();
  tradeManager;
  spawnManager;
  battleAdapter;
  encounterIntegration;
  constructor() {
    this.battleAdapter = new BattleAdapter(this);
    this.encounterIntegration = new EncounterIntegration(this, this.battleAdapter);
    this.tradeManager = new TradeManager(this);
    this.spawnManager = new PokemonSpawnManager(this);
    this.maps.set("city", {
      id: "city",
      seed: 0,
      // 0 for the permanent city
      type: "city",
      players: /* @__PURE__ */ new Set()
    });
    this.spawnManager.start();
    this.encounterIntegration.start();
    setInterval(() => this.cleanupEmptyRoutes(), 5e3);
  }
  cleanupEmptyRoutes() {
    const now = Date.now();
    for (const [mapId, map] of this.maps) {
      if (map.type === "route") {
        const playersOnRoute = map.players.size;
        let playersInRouteInteriors = 0;
        for (const m of this.maps.values()) {
          if (m.parentMapId === mapId && m.players.size > 0) {
            playersInRouteInteriors += m.players.size;
          }
        }
        if (playersOnRoute === 0 && playersInRouteInteriors === 0) {
          if (!this.mapEmptyTime.has(mapId)) {
            this.mapEmptyTime.set(mapId, now);
          } else {
            const emptySince = this.mapEmptyTime.get(mapId);
            if (now - emptySince >= 45e3) {
              console.log(`[GameState] Destroying empty route: ${mapId}`);
              this.maps.delete(mapId);
              this.mapEmptyTime.delete(mapId);
            }
          }
        } else {
          this.mapEmptyTime.delete(mapId);
        }
      }
    }
  }
  getMap(id) {
    return this.maps.get(id);
  }
  getBattleEnvironmentData(mapId, x, y) {
    const gx = Math.floor(x / 16);
    const gy = Math.floor(y / 16);
    const map = this.getMap(mapId);
    const seed = map ? map.seed : getRouteSeed(mapId);
    const isInterior = mapId.includes("interior");
    const biome = getBiomeAt(gx, gy, seed, mapId);
    const groundTile = rawTerrainTile(gx, gy, seed, mapId);
    const uptimeMs = Date.now() - this.serverStartTime;
    const uptimeMinutes = uptimeMs / 1e3 * 60 / 60;
    const inGameMinutes = (8 * 60 + uptimeMinutes) % (24 * 60);
    const hours = Math.floor(inGameMinutes / 60);
    let timeOfDay = "day";
    if (hours >= 5 && hours < 10) timeOfDay = "morning";
    else if (hours >= 10 && hours < 17) timeOfDay = "day";
    else if (hours >= 17 && hours < 20) timeOfDay = "evening";
    else timeOfDay = "night";
    let weather = "clear";
    if (biome.id === "ice_peak" || biome.id === "tundra") {
      weather = "snow";
    } else if (biome.id === "lake" || mapId.includes("route_3")) {
      const wHash = Math.sin(seed * 17 + hours) * 0.5 + 0.5;
      if (wHash > 0.7) weather = "rain";
      else if (wHash > 0.5) weather = "fog";
      else if (wHash > 0.3) weather = "cloudy";
    } else if (biome.id === "forest") {
      const wHash = Math.sin(seed * 31 + hours) * 0.5 + 0.5;
      if (wHash > 0.8) weather = "storm";
      else if (wHash > 0.6) weather = "rain";
      else if (wHash > 0.4) weather = "cloudy";
    }
    const nearbyObjects = [];
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const nx = gx + dx;
        const ny = gy + dy;
        const t = rawTerrainTile(nx, ny, seed, mapId);
        if (t === 5) nearbyObjects.push("tree");
        else if (t === 9) nearbyObjects.push("tall_grass");
        else if (t === 3) nearbyObjects.push("water");
        else if (t === 4) nearbyObjects.push("cliff");
      }
    }
    return {
      mapId,
      x,
      y,
      seed,
      biomeId: biome.id,
      biomeName: biome.name,
      weather,
      timeOfDay,
      isInterior,
      groundTile,
      nearbyObjects: Array.from(new Set(nearbyObjects))
    };
  }
  createRouteMap(id) {
    const seed = getRouteSeed(id);
    const map = {
      id,
      seed,
      type: "route",
      players: /* @__PURE__ */ new Set()
    };
    this.maps.set(id, map);
    return map;
  }
  createInteriorMap(id) {
    let parentMapId;
    let seed = 0;
    if (id.includes(":")) {
      parentMapId = id.split(":")[0];
      const parent = this.maps.get(parentMapId);
      if (parent) {
        seed = parent.seed;
      } else if (parentMapId.startsWith("route_")) {
        seed = getRouteSeed(parentMapId);
      }
    }
    const map = {
      id,
      seed,
      type: "interior",
      parentMapId,
      players: /* @__PURE__ */ new Set()
    };
    this.maps.set(id, map);
    return map;
  }
  addClient(ws) {
    const playerId = `player_${this.nextId++}`;
    const cityMap = this.maps.get("city");
    const client = {
      ws,
      id: playerId,
      username: "Unknown",
      position: findSafeSpawn(cityMap.seed, 128 * 16, 128 * 16),
      direction: "down",
      inputSeq: 0,
      lastInputSeq: -1,
      mapInstanceId: "city"
      // default spawn
    };
    this.clients.set(playerId, client);
    this.maps.get("city").players.add(playerId);
    return client;
  }
  getClientByWs(ws) {
    for (const client of this.clients.values()) {
      if (client.ws === ws) {
        return client;
      }
    }
    return void 0;
  }
  updateClientId(oldId, newId) {
    const client = this.clients.get(oldId);
    if (!client) return;
    const existing = this.clients.get(newId);
    if (existing && existing !== client) {
      this.removeClient(newId);
    }
    const map = this.maps.get(client.mapInstanceId);
    if (map) {
      map.players.delete(oldId);
      map.players.add(newId);
    }
    this.clients.delete(oldId);
    client.id = newId;
    this.clients.set(newId, client);
  }
  markClientDisconnected(playerId) {
    const client = this.clients.get(playerId);
    if (!client) return;
    client.ws = null;
    client.disconnectTimer = setTimeout(() => {
      this.removeClient(playerId);
      this.broadcastToMap(client.mapInstanceId, {
        type: 11,
        // PacketType.PlayerLeave
        playerId: client.id,
        timestamp: Date.now()
      });
      console.log(`[-] ${client.id} session expired`);
    }, 15e3);
  }
  removeClient(playerId, temporary = false) {
    this.battleAdapter.handleClientDisconnect(playerId);
    this.tradeManager.handleClientDisconnect(playerId);
    const client = this.clients.get(playerId);
    if (client) {
      if (client.disconnectTimer) {
        clearTimeout(client.disconnectTimer);
      }
      const map = this.maps.get(client.mapInstanceId);
      if (map) {
        map.players.delete(playerId);
      }
    }
    this.clients.delete(playerId);
  }
  getClient(playerId) {
    return this.clients.get(playerId);
  }
  getAllClients() {
    return Array.from(this.clients.values());
  }
  getClientsInMap(mapId) {
    const map = this.maps.get(mapId);
    if (!map) return [];
    const result = [];
    for (const pid of map.players) {
      const c = this.clients.get(pid);
      if (c) result.push(c);
    }
    return result;
  }
  send(client, packet) {
    if (client.ws && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(packet));
    }
  }
  broadcastToMap(mapId, packet, excludeId) {
    const data = JSON.stringify(packet);
    const map = this.maps.get(mapId);
    if (!map) return;
    for (const id of map.players) {
      if (excludeId && id === excludeId) continue;
      const client = this.clients.get(id);
      if (client && client.ws && client.ws.readyState === 1) {
        client.ws.send(data);
      }
    }
  }
  broadcast(packet, excludeId) {
    const data = JSON.stringify(packet);
    for (const [id, client] of this.clients) {
      if (excludeId && id === excludeId) continue;
      if (client.ws && client.ws.readyState === 1) {
        client.ws.send(data);
      }
    }
  }
};

// apps/game-server/server/multiplayer/handlers.ts
function handlePacket(gameState, client, packet) {
  switch (packet.type) {
    case 0 /* Hello */:
      handleHello(gameState, client, packet);
      break;
    case 12 /* PlayerInput */:
      handlePlayerInput(gameState, client, packet);
      break;
    case 20 /* ChunkRequest */:
      handleChunkRequest(gameState, client, packet);
      break;
    case 60 /* Ping */:
      handlePing(gameState, client, packet);
      break;
    case 65 /* MapChangeRequest */:
      handleMapChangeRequest(gameState, client, packet);
      break;
    case 63 /* SaveRequest */:
      handleSaveRequest(gameState, client, packet);
      break;
    case 50 /* ChatMessage */:
      gameState.broadcastToMap(client.mapInstanceId, packet);
      break;
    case 70 /* TradeRequest */:
    case 71 /* TradeResponse */:
    case 72 /* TradeOfferUpdate */:
    case 73 /* TradeConfirm */:
      gameState.tradeManager.handlePacket(client, packet);
      break;
    case 34 /* BattleChallengeRequest */:
    case 36 /* BattleChallengeAnswer */:
    case 31 /* BattleAction */:
      gameState.battleAdapter.handlePacket(client, packet);
      break;
    default:
      console.log(`[?] Unknown packet type: ${packet.type}`);
  }
}
function handleHello(gameState, client, packet) {
  client.username = packet.username;
  if (packet.profile) {
    client.profile = packet.profile;
  }
  if (packet.sessionId) {
    const existingClient = gameState.getClient(packet.sessionId);
    if (existingClient && existingClient.ws === null) {
      console.log(`[+] ${existingClient.id} reconnected`);
      existingClient.ws = client.ws;
      if (existingClient.disconnectTimer) {
        clearTimeout(existingClient.disconnectTimer);
        existingClient.disconnectTimer = void 0;
      }
      gameState.removeClient(client.id, true);
      client = existingClient;
      if (packet.profile) client.profile = packet.profile;
      gameState.battleAdapter.battleSessionManager.handleClientReconnect(client);
    } else if (existingClient && existingClient.id === client.id) {
      gameState.broadcastToMap(client.mapInstanceId, {
        type: 10 /* PlayerJoin */,
        // We can reuse PlayerJoin to update profile
        player: {
          id: client.id,
          username: client.username,
          position: client.position,
          direction: client.direction,
          profile: client.profile,
          activeMonster: getActiveMonster(client)
        },
        timestamp: Date.now()
      }, client.id);
      return;
    } else {
      console.log(`[+] ${packet.sessionId} connected with existing ID`);
      gameState.updateClientId(client.id, packet.sessionId);
      const loadedSave = loadPlayerData(packet.sessionId);
      if (loadedSave) {
        console.log(`[+] Loaded save file for ${packet.sessionId}`);
        client.playerData = loadedSave;
        if (loadedSave.profile) client.profile = loadedSave.profile;
        if (loadedSave.position) client.position = loadedSave.position;
        if (loadedSave.direction) client.direction = loadedSave.direction;
        if (loadedSave.currentMap) client.mapInstanceId = loadedSave.currentMap;
      }
    }
  }
  let map = gameState.getMap(client.mapInstanceId);
  if (!map) {
    if (client.mapInstanceId.includes("interior")) {
      map = gameState.createInteriorMap(client.mapInstanceId);
    } else if (client.mapInstanceId.startsWith("route_")) {
      map = gameState.createRouteMap(client.mapInstanceId);
    } else {
      client.mapInstanceId = "city";
      map = gameState.getMap("city");
    }
  }
  map.players.add(client.id);
  if (!client.mapInstanceId.includes("interior")) {
    const safePos = findSafeSpawn(map.seed, client.position.x, client.position.y, client.mapInstanceId);
    client.position = safePos;
  }
  const players = gameState.getClientsInMap(client.mapInstanceId).filter((c) => c.id !== client.id).map((c) => ({
    id: c.id,
    username: c.username,
    position: c.position,
    direction: c.direction,
    profile: c.profile,
    activeMonster: getActiveMonster(c)
  }));
  gameState.send(client, {
    type: 1 /* Welcome */,
    playerId: client.id,
    position: client.position,
    players,
    mapId: map.id,
    seed: map.seed,
    serverStartTime: gameState.serverStartTime,
    timestamp: Date.now(),
    playerData: client.playerData
  });
  gameState.broadcastToMap(client.mapInstanceId, {
    type: 10 /* PlayerJoin */,
    player: {
      id: client.id,
      username: client.username,
      position: client.position,
      direction: client.direction,
      profile: client.profile,
      activeMonster: getActiveMonster(client)
    },
    timestamp: Date.now()
  }, client.id);
  console.log(`  \u2192 ${client.username} (${client.id}) joined`);
}
function getActiveMonster(client) {
  if (!client.playerData || !client.playerData.party || client.playerData.party.length === 0) return void 0;
  const monster = client.playerData.party[0];
  return {
    speciesId: monster.speciesId,
    level: monster.level,
    currentHp: monster.currentHp,
    maxHp: monster.maxHp,
    stats: monster.stats,
    status: monster.status,
    nickname: monster.nickname
  };
}
function handlePlayerInput(gameState, client, packet) {
  if (packet.inputSeq <= client.lastInputSeq) {
    console.log(`[!] Replayed input from ${client.id}`);
    return;
  }
  const receivedAt = Date.now();
  if (client.lastInputTime !== void 0 && receivedAt - client.lastInputTime < 8) {
    return;
  }
  client.lastInputSeq = packet.inputSeq;
  client.direction = packet.direction;
  const speed = packet.keys["ShiftLeft"] || packet.keys["ShiftRight"] ? PLAYER_SPRINT_SPEED : PLAYER_WALK_SPEED;
  let dx = 0, dy = 0;
  if (packet.keys["ArrowUp"] || packet.keys["KeyW"]) dy -= speed;
  if (packet.keys["ArrowDown"] || packet.keys["KeyS"]) dy += speed;
  if (packet.keys["ArrowLeft"] || packet.keys["KeyA"]) dx -= speed;
  if (packet.keys["ArrowRight"] || packet.keys["KeyD"]) dx += speed;
  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071;
    dy *= 0.7071;
  }
  const newX = Math.max(0, Math.min(4096, client.position.x + dx));
  const newY = Math.max(0, Math.min(4096, client.position.y + dy));
  const now = Date.now();
  const lastTime = client.lastInputTime ?? now;
  const elapsedSec = Math.min(1, Math.max(1 / 60, (now - lastTime) / 1e3));
  client.lastInputTime = now;
  const speedPxPerSec = speed * 60;
  const TOLERANCE = 1.5;
  const maxDist = speedPxPerSec * elapsedSec * TOLERANCE;
  const maxDistSq = maxDist * maxDist;
  if (packet.position) {
    const pX = packet.position.x;
    const pY = packet.position.y;
    const diffX = pX - newX;
    const diffY = pY - newY;
    const distSq = diffX * diffX + diffY * diffY;
    const map = gameState.getMap(client.mapInstanceId);
    const tileId = map ? getGlobalTile(Math.floor(pX / TILE_SIZE), Math.floor(pY / TILE_SIZE), map.seed, client.mapInstanceId) : null;
    const tileOk = tileId === null || isWalkableTileId(tileId);
    if (distSq < maxDistSq && tileOk) {
      client.position = { x: Math.round(pX * 10) / 10, y: Math.round(pY * 10) / 10 };
    } else {
      client.position = { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 };
      gameState.send(client, {
        type: 14 /* PlayerPos */,
        position: client.position,
        direction: client.direction,
        inputSeq: packet.inputSeq,
        timestamp: Date.now()
      });
    }
  } else {
    client.position = { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 };
  }
  gameState.broadcastToMap(client.mapInstanceId, {
    type: 13 /* PlayerMove */,
    playerId: client.id,
    position: client.position,
    direction: client.direction,
    inputSeq: packet.inputSeq,
    timestamp: Date.now()
  }, client.id);
}
function handleChunkRequest(gameState, client, packet) {
  const map = gameState.getMap(client.mapInstanceId);
  const seed = map ? map.seed : 0;
  const chunks = packet.chunks.map((c) => ({
    cx: c.cx,
    cy: c.cy,
    tiles: generateChunkTiles(c.cx, c.cy, seed, client.mapInstanceId),
    npcs: []
  }));
  gameState.send(client, {
    type: 21 /* ChunkData */,
    chunks,
    timestamp: Date.now()
  });
}
function handlePing(gameState, client, packet) {
  gameState.send(client, {
    type: 61 /* Pong */,
    clientTime: packet.clientTime,
    serverTime: Date.now()
  });
}
function handleMapChangeRequest(gameState, client, packet) {
  const oldMapId = client.mapInstanceId;
  const oldMap = gameState.getMap(oldMapId);
  if (oldMap) {
    oldMap.players.delete(client.id);
    gameState.broadcastToMap(oldMapId, {
      type: 11 /* PlayerLeave */,
      playerId: client.id,
      timestamp: Date.now()
    });
  }
  let newMap = gameState.getMap(packet.targetMapId);
  if (!newMap) {
    if (packet.targetMapId.startsWith("route_")) {
      newMap = gameState.createRouteMap(packet.targetMapId);
    } else if (packet.targetMapId.includes("interior")) {
      newMap = gameState.createInteriorMap(packet.targetMapId);
    } else {
      newMap = gameState.getMap("city");
    }
  }
  client.mapInstanceId = newMap.id;
  newMap.players.add(client.id);
  let spawnX = packet.spawnX ?? 128 * 16;
  let spawnY = packet.spawnY ?? 128 * 16;
  let spawnDirection = packet.spawnDirection ?? "down";
  if (packet.spawnX === void 0 || packet.spawnY === void 0) {
    if (newMap.id === "city") {
      if (oldMapId === "route_1") {
        spawnX = 127 * 16;
        spawnY = 98 * 16;
        spawnDirection = "down";
      } else if (oldMapId === "route_2") {
        spawnX = 127 * 16;
        spawnY = 146 * 16;
        spawnDirection = "up";
      } else if (oldMapId === "route_3") {
        spawnX = 146 * 16;
        spawnY = 121 * 16;
        spawnDirection = "left";
      } else if (oldMapId === "route_4") {
        spawnX = 108 * 16;
        spawnY = 121 * 16;
        spawnDirection = "right";
      } else {
        spawnX = 128 * 16;
        spawnY = 128 * 16;
        spawnDirection = "down";
      }
    } else if (newMap.id === "route_1") {
      spawnX = 127 * 16;
      spawnY = 242 * 16;
      spawnDirection = "up";
    } else if (newMap.id === "route_2") {
      spawnX = 127 * 16;
      spawnY = 14 * 16;
      spawnDirection = "down";
    } else if (newMap.id === "route_3") {
      spawnX = 14 * 16;
      spawnY = 121 * 16;
      spawnDirection = "right";
    } else if (newMap.id === "route_4") {
      spawnX = 242 * 16;
      spawnY = 121 * 16;
      spawnDirection = "left";
    }
  }
  if (newMap.id.includes("interior") || packet.spawnX !== void 0) {
    client.position = { x: spawnX, y: spawnY };
  } else {
    client.position = findSafeSpawn(newMap.seed, spawnX, spawnY, newMap.id);
  }
  client.direction = spawnDirection;
  const players = gameState.getClientsInMap(newMap.id).filter((c) => c.id !== client.id).map((c) => ({
    id: c.id,
    username: c.username,
    position: c.position,
    direction: c.direction,
    profile: c.profile,
    activeMonster: getActiveMonster(c)
  }));
  gameState.send(client, {
    type: 66 /* MapChangeResponse */,
    mapId: newMap.id,
    seed: newMap.seed,
    position: client.position,
    players,
    timestamp: Date.now()
  });
  gameState.broadcastToMap(newMap.id, {
    type: 10 /* PlayerJoin */,
    player: {
      id: client.id,
      username: client.username,
      position: client.position,
      direction: client.direction,
      profile: client.profile,
      activeMonster: getActiveMonster(client)
    },
    timestamp: Date.now()
  }, client.id);
}
function handleSaveRequest(gameState, client, packet) {
  try {
    const data = JSON.parse(packet.data);
    client.playerData = data;
    if (data.profile) client.profile = data.profile;
    client.position = data.position;
    client.direction = data.direction;
    client.mapInstanceId = data.currentMap;
    savePlayerData(client.id, data);
    gameState.broadcastToMap(client.mapInstanceId, {
      type: 10 /* PlayerJoin */,
      player: {
        id: client.id,
        username: client.username,
        position: client.position,
        direction: client.direction,
        profile: client.profile,
        activeMonster: getActiveMonster(client)
      },
      timestamp: Date.now()
    }, client.id);
    gameState.send(client, {
      type: 64 /* SaveResponse */,
      success: true,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error(`Failed to parse save data from ${client.id}:`, e);
    gameState.send(client, {
      type: 64 /* SaveResponse */,
      success: false,
      timestamp: Date.now()
    });
  }
}

// apps/game-server/server/auth.ts
import { Router } from "express";
import crypto from "crypto";
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var ACCOUNTS_FILE = path2.join(__dirname, "../.data/accounts.json");
var SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me-in-production";
function loadAccounts() {
  if (!fs2.existsSync(ACCOUNTS_FILE)) return {};
  try {
    return JSON.parse(fs2.readFileSync(ACCOUNTS_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveAccounts(accounts) {
  fs2.mkdirSync(path2.dirname(ACCOUNTS_FILE), { recursive: true });
  fs2.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf8");
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}
function signToken(accountId) {
  const payload = Buffer.from(JSON.stringify({ accountId, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyToken(token) {
  const [payload, sig] = (token || "").split(".");
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return { accountId: decoded.accountId };
  } catch {
    return null;
  }
}
function defaultPlayerData(id, username) {
  return {
    id,
    username,
    profile: {
      name: username,
      bodyType: "male",
      hairStyle: "default",
      hairColor: "#3a2a1a",
      skinTone: "#f2c9a0",
      eyeColor: "#2a2a2a",
      shirtColor: "#c02020",
      pantsColor: "#2050a0",
      shoesColor: "#333333",
      hatType: "none",
      backpackType: "none"
    },
    position: { x: 0, y: 0 },
    direction: "down",
    speed: 1,
    money: 3e3,
    party: [],
    boxes: [],
    inventory: [],
    pokedex: [],
    badges: 0,
    currentMap: "city",
    storyFlags: {}
  };
}
var authRouter = Router();
authRouter.post("/register", (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string" || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: "username must be >=3 chars, password >=6 chars" });
  }
  const accounts = loadAccounts();
  if (accounts[username]) {
    return res.status(409).json({ error: "username already taken" });
  }
  const id = crypto.randomUUID();
  accounts[username] = { id, username, passwordHash: hashPassword(password) };
  saveAccounts(accounts);
  savePlayerData(id, defaultPlayerData(id, username));
  res.json({ token: signToken(id), accountId: id });
});
authRouter.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  const accounts = loadAccounts();
  const account = accounts[username];
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return res.status(401).json({ error: "invalid username or password" });
  }
  res.json({ token: signToken(account.id), accountId: account.id });
});
authRouter.get("/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const session = verifyToken(token);
  if (!session) return res.status(401).json({ error: "invalid or missing token" });
  const playerData = loadPlayerData(session.accountId);
  if (!playerData) return res.status(404).json({ error: "account has no player data" });
  res.json(playerData);
});

// apps/game-server/server.ts
if (typeof globalThis.crypto === "undefined") {
  try {
    globalThis.crypto = crypto2.webcrypto || {
      getRandomValues: (array) => {
        const buf = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
        crypto2.randomFillSync(buf);
        return array;
      }
    };
  } catch (err) {
  }
}
async function startServer() {
  try {
    await Database.getInstance().initialize();
  } catch (err) {
    console.error("[poke-ter Server] Failed to initialize Database:", err);
  }
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  const server = http.createServer(app);
  const PORT = 3e3;
  const wss = new WebSocketServer({ server });
  console.log(`[poke-ter Server] WebSocket server mounted on HTTP server`);
  const gameState = new GameState();
  wss.on("connection", (ws) => {
    gameState.addClient(ws);
    console.log(`[+] New connection established`);
    ws.on("message", (data) => {
      try {
        const packet = JSON.parse(data.toString());
        const client = gameState.getClientByWs(ws);
        if (client) {
          handlePacket(gameState, client, packet);
        }
      } catch (e) {
        console.error(`[!] Invalid packet:`, e);
      }
    });
    ws.on("close", () => {
      const client = gameState.getClientByWs(ws);
      if (client) {
        gameState.markClientDisconnected(client.id);
        console.log(`[-] ${client.id} connection closed (grace period started)`);
      }
    });
    ws.on("error", () => {
      const client = gameState.getClientByWs(ws);
      if (client) {
        gameState.markClientDisconnected(client.id);
      }
    });
  });
  const distPath = path3.resolve(process.cwd(), "dist");
  const hasDist = fs3.existsSync(path3.join(distPath, "index.html"));
  if (process.env.NODE_ENV !== "production" || !hasDist) {
    console.log(`[poke-ter Server] Starting Vite dev middleware (production=${process.env.NODE_ENV === "production"}, hasDist=${hasDist})`);
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd()
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path3.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[poke-ter Server] Running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.js.map
