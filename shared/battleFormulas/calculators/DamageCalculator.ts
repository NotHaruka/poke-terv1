import { MonsterInstance, LegacyMoveCategory } from '../../pokemonData.js';
import { Database } from '../../pokemonData.js';

export interface DamageContext {
  attacker: MonsterInstance;
  defender: MonsterInstance;
  move: any; // Using any to avoid importing full Move data for now
  isCritical: boolean;
  typeEffectiveness: number;
  randomFactor: number;
  weather?: string;           // Optional, clear/rain/sun/sandstorm/snow
  attackerStages?: {
    attack?: number;
    defense?: number;
    spAttack?: number;
    spDefense?: number;
    speed?: number;
    accuracy?: number;
    evasion?: number;
  };
  defenderStages?: {
    attack?: number;
    defense?: number;
    spAttack?: number;
    spDefense?: number;
    speed?: number;
    accuracy?: number;
    evasion?: number;
  };
  reflectActive?: boolean;
  lightScreenActive?: boolean;
}

export class DamageCalculator {
  public static calculateDamage(context: DamageContext): number {
    const {
      attacker,
      defender,
      move,
      isCritical,
      typeEffectiveness,
      randomFactor,
      weather = 'clear',
      attackerStages = {},
      defenderStages = {},
      reflectActive = false,
      lightScreenActive = false
    } = context;

    if (!move || move.category === LegacyMoveCategory.Status) {
      return 0;
    }

    const db = Database.getInstance();

    // Accuracy & Evasion check
    const accuracyStage = attackerStages.accuracy || 0;
    const evasionStage = defenderStages.evasion || 0;
    const accuracyMult = accuracyStage >= 0 ? (3 + accuracyStage) / 3 : 3 / (3 - accuracyStage);
    const evasionMult = evasionStage >= 0 ? (3 + evasionStage) / 3 : 3 / (3 - evasionStage);
    
    const moveAccuracy = typeof move.accuracy === 'number' ? move.accuracy : 100;
    const isHit = moveAccuracy === 100 || (Math.random() * 100 <= moveAccuracy * (accuracyMult / evasionMult));
    if (!isHit) {
      return 0;
    }

    const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
    const isSpecial = move.category === LegacyMoveCategory.Special;
    
    // Base Stats with Stat Stages
    let atkStage = isSpecial ? (attackerStages.spAttack || 0) : (attackerStages.attack || 0);
    let defStage = isSpecial ? (defenderStages.spDefense || 0) : (defenderStages.defense || 0);

    // Critical hits ignore negative attacker stages and positive defender stages
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

    // Apply Abilities & Held Items to Attack/Defense
    const attackerAbility = (attacker as any).ability?.toLowerCase() || '';
    const defenderAbility = (defender as any).ability?.toLowerCase() || '';
    const attackerItem = (attacker as any).heldItemId;
    const defenderItem = (defender as any).heldItemId;

    // Choice Items
    if (attackerItem === 4 && !isSpecial) { // Choice Band
      atk = Math.floor(atk * 1.5);
    }
    if (attackerItem === 5 && isSpecial) { // Choice Specs
      atk = Math.floor(atk * 1.5);
    }
    // Assault Vest
    if (defenderItem === 10 && isSpecial) { // Assault Vest
      def = Math.floor(def * 1.5);
    }
    // Eviolite
    const defSpecies = db.getPokemon(defender.speciesId);
    const evos = (defSpecies as any)?.evolutions ?? (defSpecies as any)?.evolutionIds ?? [];
    const canEvolve = Array.isArray(evos) && evos.length > 0;
    if (defenderItem === 9 && canEvolve) { // Eviolite
      def = Math.floor(def * 1.5);
    }

    // Burn reduction
    if (!isSpecial && attacker.status === 1) { // Burn
      if (attackerAbility !== 'guts') {
        atk = Math.floor(atk * 0.5);
      }
    }

    // Thick Fat
    if (defenderAbility === 'thick fat' && (move.type === 'fire' || move.type === 'ice')) {
      atk = Math.floor(atk * 0.5);
    }

    // Base damage
    const movePower = move.power || 40;
    const baseDmg = Math.floor((levelFactor * movePower * (atk / Math.max(1, def))) / 50) + 2;

    // Type Effectiveness
    let finalTypeEffectiveness = typeEffectiveness;
    if (defenderAbility === 'levitate' && move.type === 'ground') {
      finalTypeEffectiveness = 0;
    }
    if (defenderAbility === 'flash fire' && move.type === 'fire') {
      finalTypeEffectiveness = 0;
    }

    // STAB calculation
    let isStab = false;
    const attSpecies = db.getPokemon(attacker.speciesId);
    if (attSpecies && attSpecies.types) {
      isStab = attSpecies.types.some(t => t && t.toLowerCase() === move.type.toLowerCase());
    }
    let stabMult = isStab ? 1.5 : 1.0;
    if (isStab && attackerAbility === 'adaptability') {
      stabMult = 2.0;
    }

    // Weather modifiers
    let weatherMult = 1.0;
    const moveTypeLower = move.type.toLowerCase();
    const weatherLower = weather.toLowerCase();
    if (weatherLower === 'rain' || weatherLower === 'storm') {
      if (moveTypeLower === 'water') weatherMult = 1.5;
      if (moveTypeLower === 'fire') weatherMult = 0.5;
    } else if (weatherLower === 'sun') {
      if (moveTypeLower === 'fire') weatherMult = 1.5;
      if (moveTypeLower === 'water') weatherMult = 0.5;
    }

    // Blaze / Torrent / Overgrow ability multipliers
    let abilityMult = 1.0;
    const isLowHp = attacker.currentHp <= attacker.maxHp / 3;
    if (isLowHp) {
      if (attackerAbility === 'blaze' && moveTypeLower === 'fire') abilityMult = 1.5;
      if (attackerAbility === 'torrent' && moveTypeLower === 'water') abilityMult = 1.5;
      if (attackerAbility === 'overgrow' && moveTypeLower === 'grass') abilityMult = 1.5;
    }

    // Life Orb held item
    if (attackerItem === 7) { // Life Orb
      abilityMult *= 1.3;
    }

    // Screens (Reflect / Light Screen)
    let screenMult = 1.0;
    if (!isCritical) {
      if (reflectActive && !isSpecial) screenMult = 0.5;
      if (lightScreenActive && isSpecial) screenMult = 0.5;
    }

    const critMult = isCritical ? 1.5 : 1.0;
    const modifier = finalTypeEffectiveness * critMult * stabMult * weatherMult * abilityMult * screenMult * randomFactor;
    
    let finalDamage = Math.floor(baseDmg * modifier);
    
    if (finalTypeEffectiveness > 0 && finalDamage === 0) {
      finalDamage = 1;
    }

    return finalDamage;
  }
}