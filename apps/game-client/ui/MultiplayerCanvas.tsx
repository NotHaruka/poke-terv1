import { useEffect, useRef, useState } from 'react';
import { WorldCanvas, preloadAtlases } from '@engine/rendering/worldCanvas.js';
import { PlayerEntity, Direction } from '@engine/core/PlayerEntity.js';
import { Camera } from '@engine/core/Camera.js';
import { PlayerRenderer } from '@engine/rendering/PlayerRenderer.js';
import { NPCRenderer } from '@engine/rendering/NPCRenderer.js';
import { NPCEntity } from '@engine/core/NPCEntity.js';
import { getGlobalTile, isWalkableTileId, getBiomeAt } from '@world/generator/legacyProceduralWorldgen.js';
import { TileRegistry } from '@world/tiles/TileRegistry.js';
import { legacyTileIdToDefinitionId } from '@world/tiles/tileLibrary.js';
import { getStarterTownMap } from '@world/maps/starterTown.js';
import { PokemonFactory, PokemonManager, PokemonLocationType, pokemonRegistry, StatusEffect, BiomeSpawnTables, pokemonInstanceToMonsterInstance } from '@game-core/pokemonData.js';
import type { PokemonInstance } from '@game-core/pokemonData.js';
import { BattleInterface } from './BattleInterface.js';
import { ExperienceCalculator, DamageCalculator } from '@game-core/battleFormulas.js';

export interface GameplayRuntimeProps {
  seed?: number;
  mapId?: string;
  width?: number;
  height?: number;
}

// --------------------------------------------------
// SOUND EFFECTS & AUDIO GENERATORS (WEB AUDIO API)
// --------------------------------------------------

function playClickSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.06);
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (err) {
    // Audio context may be blocked by user gesture requirements
  }
}

function playHealChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, delay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    playTone(523.25, 0.0, 0.25); // C5
    playTone(659.25, 0.1, 0.25);  // E5
    playTone(783.99, 0.2, 0.3);   // G5
    playTone(1046.50, 0.3, 0.4);  // C6
  } catch (err) {
    // Audio context may be blocked
  }
}

function playSignSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(554.37, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (err) {
    // Audio context may be blocked
  }
}

function getOppositeDirection(dir: Direction): 'up' | 'down' | 'left' | 'right' {
  switch (dir) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
  }
}

function findProceduralSafeSpawn(seed: number, startX: number, startY: number, maxY: number = 127): { x: number, y: number } {
  const maxRadius = 50;
  for (let r = 0; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) === r || Math.abs(dy) === r) {
          const tx = startX + dx;
          const ty = startY + dy;
          if (tx < 0 || ty < 0 || ty > maxY) continue;
          
          const tile = getGlobalTile(tx, ty, seed, 'city');
          if (isWalkableTileId(tile)) {
            // Check adjacent to avoid 1x1 traps
            const right = isWalkableTileId(getGlobalTile(tx + 1, ty, seed, 'city'));
            const down = isWalkableTileId(getGlobalTile(tx, ty + 1, seed, 'city'));
            const left = isWalkableTileId(getGlobalTile(tx - 1, ty, seed, 'city'));
            const up = isWalkableTileId(getGlobalTile(tx, ty - 1, seed, 'city'));
            
            if (right || down || left || up) {
              return { x: tx * 16, y: ty * 16 };
            }
          }
        }
      }
    }
  }
  // Fallback
  return { x: startX * 16, y: Math.min(startY, maxY) * 16 };
}

export interface SaveState {
  schemaVersion: number;
  playerName: string;
  playerPos: { x: number; y: number };
  currentMapId: 'starter_town' | 'procedural';
  facingDirection: 'up' | 'down' | 'left' | 'right';
  playerParty: PokemonInstance[];
  capturedPokemon: PokemonInstance[];
  playerInventory: { itemId: number; name: string; quantity: number }[];
  eventFlags: Record<string, boolean>;
  hasSelectedStarter?: boolean;
}

export function validateSave(data: any): data is SaveState {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.schemaVersion !== 'number') return false;
  if (typeof data.playerName !== 'string' || data.playerName.trim() === '') return false;
  if (!data.playerPos || typeof data.playerPos.x !== 'number' || typeof data.playerPos.y !== 'number') return false;
  if (data.currentMapId !== 'starter_town' && data.currentMapId !== 'procedural') return false;
  if (!Array.isArray(data.playerParty)) return false;
  return true;
}

export function MultiplayerCanvas({
  seed = 1,
  mapId = 'city',
  width = 800,
  height = 600,
}: GameplayRuntimeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<WorldCanvas | null>(null);

  // Map state
  const [currentMapId, setCurrentMapId] = useState<'starter_town' | 'procedural'>('starter_town');
  const starterTownMap = useRef(getStarterTownMap()).current;

  // Track player coordinates for stepping into new tiles
  const lastTilePosRef = useRef<string>('');

  // Core Engine Entities - spawn at starter town spawnPoint
  const spawnTile = starterTownMap.spawnPoint;
  const playerRef = useRef<PlayerEntity>(
    new PlayerEntity({ id: 'player_main', x: spawnTile.x * 16, y: spawnTile.y * 16 })
  );
  const cameraRef = useRef<Camera>(
    new Camera({
      x: spawnTile.x * 16,
      y: spawnTile.y * 16,
      viewportWidth: width,
      viewportHeight: height,
      zoom: 2.5,
      smoothness: 0.15,
    })
  );
  const playerRendererRef = useRef<PlayerRenderer>(new PlayerRenderer());
  const npcRendererRef = useRef<NPCRenderer>(new NPCRenderer());

  // Core game flow states
  const [gamePhase, setGamePhase] = useState<'title' | 'name_input' | 'playing'>('title');
  const [playerName, setPlayerName] = useState<string>('Trainer');
  const [playerParty, setPlayerParty] = useState<PokemonInstance[]>([]);
  const [capturedPokemon, setCapturedPokemon] = useState<PokemonInstance[]>([]);
  const [eventFlags, setEventFlags] = useState<Record<string, boolean>>({
    starterSelected: false,
    firstJoyTalk: false,
    firstOakTalk: false,
    route1Entered: false,
    firstEncounter: false,
  });
  const [hasSelectedStarter, setHasSelectedStarter] = useState<boolean>(false);
  const [showStarterSelectModal, setShowStarterSelectModal] = useState<boolean>(false);
  const [hasSaveFile, setHasSaveFile] = useState<boolean>(false);
  const [hasAutosaveFile, setHasAutosaveFile] = useState<boolean>(false);

  // Check for save game on mount
  useEffect(() => {
    const save = localStorage.getItem('poketer_save_game');
    if (save) {
      try {
        const parsed = JSON.parse(save);
        if (validateSave(parsed)) {
          setHasSaveFile(true);
        }
      } catch (e) {
        console.error('Failed to parse manual save on mount:', e);
      }
    }
    const autoSave = localStorage.getItem('poketer_save_game_auto');
    if (autoSave) {
      try {
        const parsed = JSON.parse(autoSave);
        if (validateSave(parsed)) {
          setHasAutosaveFile(true);
        }
      } catch (e) {
        console.error('Failed to parse autosave on mount:', e);
      }
    }
  }, []);

  // Save helper supporting both standard manual save and autosave
  const saveGame = (
    isAutosave: boolean = false,
    customMapId?: 'starter_town' | 'procedural',
    customPos?: { x: number; y: number }
  ) => {
    const targetMapId = customMapId || currentMapId;
    const targetPos = customPos || { x: playerRef.current.position.x, y: playerRef.current.position.y };
    const targetFacing = playerRef.current.facingDirection || 'down';

    const saveState = {
      schemaVersion: 2,
      playerName,
      playerPos: targetPos,
      currentMapId: targetMapId,
      facingDirection: targetFacing,
      playerParty,
      capturedPokemon,
      playerInventory,
      eventFlags: {
        ...eventFlags,
        starterSelected: hasSelectedStarter,
      },
      timestamp: Date.now()
    };

    const key = isAutosave ? 'poketer_save_game_auto' : 'poketer_save_game';
    localStorage.setItem(key, JSON.stringify(saveState));
    
    if (isAutosave) {
      setHasAutosaveFile(true);
    } else {
      setHasSaveFile(true);
    }
  };

  const loadGame = (isAutosave: boolean = false) => {
    const key = isAutosave ? 'poketer_save_game_auto' : 'poketer_save_game';
    const saveStr = localStorage.getItem(key);
    if (saveStr) {
      try {
        const save = JSON.parse(saveStr);
        if (!validateSave(save)) {
          console.error('Save validation failed during load');
          return;
        }

        setPlayerName(save.playerName || 'Trainer');
        setPlayerParty(save.playerParty || []);
        setCapturedPokemon(save.capturedPokemon || []);
        if (save.playerInventory) {
          setPlayerInventory(save.playerInventory);
        }
        setHasSelectedStarter(!!save.eventFlags?.starterSelected || !!save.hasSelectedStarter);
        setEventFlags(save.eventFlags || {
          starterSelected: !!save.hasSelectedStarter,
          firstJoyTalk: false,
          firstOakTalk: false,
          route1Entered: false,
          firstEncounter: false,
        });
        setCurrentMapId(save.currentMapId || 'starter_town');

        // Restore player position & camera
        const targetX = save.playerPos?.x ?? spawnTile.x * 16;
        const targetY = save.playerPos?.y ?? spawnTile.y * 16;
        playerRef.current.position.x = targetX;
        playerRef.current.position.y = targetY;
        playerRef.current.facingDirection = save.facingDirection || 'down';

        cameraRef.current.x = targetX;
        cameraRef.current.y = targetY;
        cameraRef.current.follow(playerRef.current);

        // Register pokemon in local PokemonManager
        const pm = PokemonManager.getInstance();
        pm.reset();
        (save.playerParty || []).forEach((mon: PokemonInstance, idx: number) => {
          try {
            pm.registerPokemon(mon, {
              type: PokemonLocationType.Party,
              ownerId: 'player_main',
              slotIndex: idx
            });
          } catch (e) {
            console.error(e);
          }
        });

        (save.capturedPokemon || []).forEach((mon: PokemonInstance, idx: number) => {
          try {
            pm.registerPokemon(mon, {
              type: PokemonLocationType.PC,
              ownerId: 'player_main',
              boxIndex: 0,
              slotIndex: idx
            });
          } catch (e) {
            console.error(e);
          }
        });

        setGamePhase('playing');
        playClickSound();
      } catch (err) {
        console.error('Failed to parse save game:', err);
      }
    }
  };

  // Reusable NPC Entities instantiated from the NPCEntity class
  const npcsRef = useRef<NPCEntity[]>([]);
  if (npcsRef.current.length === 0) {
    npcsRef.current = [
      new NPCEntity({
        id: 'professor_oak',
        name: 'Prof. Oak',
        x: 13,
        y: 5,
        facing: 'down',
        spriteType: 'professor',
        dialogue: [
          'Prof. Oak: Hello there! Welcome to the world of poke-ter!',
          'Prof. Oak: I am the regional Professor. It is wonderful to meet you.',
          'Prof. Oak: This starter area is handcrafted, but heading north leads to the endless procedural wilderness!',
          'Prof. Oak: Be careful of wild monsters in the tall grass!',
          'Prof. Oak: Take this virtual Explorer Badge as a token of your adventure!'
        ],
        collision: true,
        onInteract: (npc) => {
          playHealChime();
          setFlashColor('rgba(251, 191, 36, 0.2)'); // Amber flash
          setTimeout(() => setFlashColor(null), 500);
        }
      }),
      new NPCEntity({
        id: 'nurse_joy',
        name: 'Nurse Joy',
        x: 4,
        y: 16,
        facing: 'down',
        spriteType: 'healer',
        dialogue: [
          'Nurse Joy: Welcome to the local Healing Station!',
          'Nurse Joy: I can restore your Pokémon team to full health!',
          'Nurse Joy: Let me take your team for a brief moment...',
          'Nurse Joy: ... *chime* ... Your team is fully healed! Good luck!'
        ],
        collision: true,
        onInteract: (npc) => {
          // Play a beautiful chime and flash screen green
          playHealChime();
          setFlashColor('rgba(16, 185, 129, 0.25)'); // Emerald green flash
          setTimeout(() => setFlashColor(null), 800);
          setPlayerParty(prev => prev.map(p => ({ ...p, currentHp: p.stats.hp })));
        }
      }),
      new NPCEntity({
        id: 'villager_bob',
        name: 'Town Citizen',
        x: 8,
        y: 10,
        facing: 'right',
        spriteType: 'villager',
        dialogue: [
          'Town Citizen: I love living in Starter Town. It is so peaceful here!',
          'Town Citizen: The pond on the southeast is beautiful, but the grass on Route 1 is full of danger.',
          'Town Citizen: Remember, you can press ESC to open your Menu at any time.'
        ],
        collision: true,
        onInteract: (npc) => {
          playClickSound();
          // Let Bob turn in a circle in surprise!
          const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'left', 'down', 'right'];
          directions.forEach((dir, index) => {
            setTimeout(() => {
              npc.facing = dir;
            }, (index + 1) * 200);
          });
        }
      })
    ];
  }

  // UI State
  const [ready, setReady] = useState(false);
  const [playerInfo, setPlayerInfo] = useState({
    worldX: spawnTile.x * 16,
    worldY: spawnTile.y * 16,
    tileX: spawnTile.x,
    tileY: spawnTile.y,
    direction: 'down' as Direction,
    isMoving: false,
    stateText: 'Idle',
  });

  // Reusable/Advanced Dialogue system states
  const [isDialogueActive, setIsDialogueActive] = useState(false);
  const [dialoguePages, setDialoguePages] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [dialogueText, setDialogueText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dialogueSpeaker, setDialogueSpeaker] = useState<string | null>(null);
  const [activeDialogueNpc, setActiveDialogueNpc] = useState<string | null>(null);
  const [isSignPost, setIsSignPost] = useState(false); // custom layout style for signs

  // Custom player stats
  const [flashColor, setFlashColor] = useState<string | null>(null);

  // Typewriter effect timer ref
  const typingTimerRef = useRef<number | null>(null);

  // Typewriter driver useEffect
  useEffect(() => {
    if (!isDialogueActive || dialoguePages.length === 0) {
      setDialogueText('');
      setIsTyping(false);
      setDialogueSpeaker(null);
      return;
    }

    const rawText = dialoguePages[currentPageIndex] || '';
    
    // Parse speaker if starts with "SpeakerName: "
    let speaker = null;
    let textToType = rawText;
    const colonIndex = rawText.indexOf(': ');
    if (colonIndex !== -1 && colonIndex < 25) {
      speaker = rawText.substring(0, colonIndex);
      textToType = rawText.substring(colonIndex + 2);
    }
    
    setDialogueSpeaker(speaker);

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    let charIndex = 0;
    setIsTyping(true);
    setDialogueText('');

    typingTimerRef.current = window.setInterval(() => {
      charIndex++;
      setDialogueText(textToType.substring(0, charIndex));
      if (charIndex >= textToType.length) {
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
        }
        setIsTyping(false);
      }
    }, 20); // 20ms per character for brisk typewriter flow

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, [isDialogueActive, dialoguePages, currentPageIndex]);

  // Battle system state
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [battleMessage, setBattleMessage] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // New battle engine states
  const [activeWildMon, setActiveWildMon] = useState<PokemonInstance | null>(null);
  const [activeBattleMonIndex, setActiveBattleMonIndex] = useState<number>(0);
  const [battlePhase, setBattlePhase] = useState<'MENU' | 'FIGHT' | 'BAG' | 'SWITCH' | 'MESSAGE'>('MENU');
  const [battleMessageText, setBattleMessageText] = useState<string>('');
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);
  const [showPartyModal, setShowPartyModal] = useState<boolean>(false);
  const [showBagModal, setShowBagModal] = useState<boolean>(false);
  const [selectedBagItem, setSelectedBagItem] = useState<{ itemId: number; name: string; quantity: number } | null>(null);
  const [isBagSelectPartyMode, setIsBagSelectPartyMode] = useState<boolean>(false);

  const [playerInventory, setPlayerInventory] = useState<{ itemId: number; name: string; quantity: number }[]>([
    { itemId: 1, name: 'Poké Ball', quantity: 10 },
    { itemId: 2, name: 'Great Ball', quantity: 5 },
    { itemId: 3, name: 'Ultra Ball', quantity: 2 },
    { itemId: 10, name: 'Potion', quantity: 5 }
  ]);

  const cooldownStepsRef = useRef<number>(0);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  function getStatusLabel(status: StatusEffect) {
    switch (status) {
      case StatusEffect.Burn: return { label: 'BRN', color: 'bg-red-500 text-white' };
      case StatusEffect.Freeze: return { label: 'FRZ', color: 'bg-blue-400 text-neutral-900' };
      case StatusEffect.Paralysis: return { label: 'PAR', color: 'bg-amber-400 text-neutral-900' };
      case StatusEffect.Poison: return { label: 'PSN', color: 'bg-purple-500 text-white' };
      case StatusEffect.BadPoison: return { label: 'PSN', color: 'bg-purple-600 text-white' };
      case StatusEffect.Sleep: return { label: 'SLP', color: 'bg-indigo-500 text-white' };
      default: return { label: 'OK', color: 'bg-emerald-500 text-white' };
    }
  }

  function getLevelAppropriateMoves(speciesId: number, level: number) {
    const learnset = pokemonRegistry.getLearnset(speciesId);
    const matched = learnset
      .filter(m => m.level <= level)
      .sort((a, b) => b.level - a.level);
    
    const seenMoveIds = new Set<number>();
    const movesList: { moveId: number; pp: number; maxPp: number }[] = [];
    for (const entry of matched) {
      if (!seenMoveIds.has(entry.moveId)) {
        seenMoveIds.add(entry.moveId);
        const moveData = pokemonRegistry.getMove(entry.moveId);
        movesList.push({
          moveId: entry.moveId,
          pp: moveData?.pp ?? 35,
          maxPp: moveData?.maxPp ?? moveData?.pp ?? 35
        });
        if (movesList.length >= 4) break;
      }
    }
    
    if (movesList.length === 0) {
      movesList.push({ moveId: 1, pp: 35, maxPp: 35 });
    }
    return movesList;
  }

  const triggerWildEncounter = (tileX: number, tileY: number) => {
    const hasHealthy = playerParty.some(p => p.currentHp > 0);
    if (!hasHealthy) {
      setDialoguePages([
        "System: Your team has no healthy Pokémon left to battle!",
        "Nurse Joy: Oh dear! Let me restore your team to full health so you can safely explore!"
      ]);
      const healedParty = playerParty.map(p => ({ ...p, currentHp: p.stats.hp }));
      setPlayerParty(healedParty);
      setCurrentPageIndex(0);
      setIsDialogueActive(true);
      setIsSignPost(false);
      return;
    }
    
    cooldownStepsRef.current = 8;
    
    const biome = getBiomeAt(tileX, tileY, seed, currentMapId);
    const spawnTable = BiomeSpawnTables[biome.id] || BiomeSpawnTables['route_1'];
    
    const totalWeight = spawnTable.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.floor(Math.random() * totalWeight);
    let selectedRule = spawnTable[0];
    for (const rule of spawnTable) {
      if (roll < rule.weight) {
        selectedRule = rule;
        break;
      }
      roll -= rule.weight;
    }
    
    const minL = selectedRule.minLevel;
    const maxL = selectedRule.maxLevel;
    const level = minL + Math.floor(Math.random() * (maxL - minL + 1));
    
    const wildMon = PokemonFactory.create({
      speciesId: selectedRule.speciesId,
      level
    });
    
    wildMon.moves = getLevelAppropriateMoves(selectedRule.speciesId, level);
    wildMon.currentHp = wildMon.stats.hp;
    
    const healthyIndex = playerParty.findIndex(p => p.currentHp > 0);
    setActiveBattleMonIndex(healthyIndex >= 0 ? healthyIndex : 0);
    
    setActiveWildMon(wildMon);
    setIsBattleActive(true);
    setBattlePhase('MENU');
    setBattleMessageText(`A wild ${pokemonRegistry.getSpecies(selectedRule.speciesId)?.name} appeared!`);

    // Set firstEncounter flag and trigger autosave
    setEventFlags(prev => ({ ...prev, firstEncounter: true }));
    setTimeout(() => {
      saveGame(true);
    }, 100);
  };

  const executeMove = (attacker: 'player' | 'opponent', defender: 'player' | 'opponent', move: any) => {
    const playerMon = playerParty[activeBattleMonIndex];
    const atkMon = attacker === 'player' ? playerMon : activeWildMon!;
    const defMon = defender === 'player' ? playerMon : activeWildMon!;
    
    const isHit = move.accuracy === 0 || (Math.random() * 100 <= move.accuracy);
    if (!isHit) {
      return { damage: 0, hit: false, message: `${atkMon.nickname || pokemonRegistry.getSpecies(atkMon.speciesId)?.name}'s attack missed!` };
    }
    
    const isCritical = Math.random() < 0.0625;
    const specTypes = pokemonRegistry.getSpecies(defMon.speciesId)?.types || ['normal'];
    const types: [any, any] = [specTypes[0] || 'normal', specTypes[1] || null];
    const effectiveness = pokemonRegistry.getDualTypeEffectiveness(move.type, types);
    const randomFactor = 0.85 + Math.random() * 0.15;
    
    const dmg = DamageCalculator.calculateDamage({
      attacker: pokemonInstanceToMonsterInstance(atkMon),
      defender: pokemonInstanceToMonsterInstance(defMon),
      move,
      isCritical,
      typeEffectiveness: effectiveness,
      randomFactor
    });
    
    let effMsg = '';
    if (effectiveness > 1) effMsg = " It's super effective!";
    if (effectiveness > 0 && effectiveness < 1) effMsg = " It's not very effective...";
    if (effectiveness === 0) effMsg = " It has no effect...";
    if (isCritical && dmg > 0) effMsg += " A critical hit!";
    
    const finalDmg = Math.max(1, Math.min(defMon.currentHp, Math.floor(dmg)));
    
    return {
      damage: finalDmg,
      hit: true,
      message: `${atkMon.nickname || pokemonRegistry.getSpecies(atkMon.speciesId)?.name} used ${move.name}!${effMsg}`
    };
  };

  const executeMoveWithIndex = (attacker: 'player' | 'opponent', defender: 'player' | 'opponent', move: any, pIdx: number) => {
    const playerMon = playerParty[pIdx];
    const atkMon = attacker === 'player' ? playerMon : activeWildMon!;
    const defMon = defender === 'player' ? playerMon : activeWildMon!;
    
    const isHit = move.accuracy === 0 || (Math.random() * 100 <= move.accuracy);
    if (!isHit) {
      return { damage: 0, hit: false, message: `${atkMon.nickname || pokemonRegistry.getSpecies(atkMon.speciesId)?.name}'s attack missed!` };
    }
    
    const isCritical = Math.random() < 0.0625;
    const specTypes = pokemonRegistry.getSpecies(defMon.speciesId)?.types || ['normal'];
    const types: [any, any] = [specTypes[0] || 'normal', specTypes[1] || null];
    const effectiveness = pokemonRegistry.getDualTypeEffectiveness(move.type, types);
    const randomFactor = 0.85 + Math.random() * 0.15;
    
    const dmg = DamageCalculator.calculateDamage({
      attacker: pokemonInstanceToMonsterInstance(atkMon),
      defender: pokemonInstanceToMonsterInstance(defMon),
      move,
      isCritical,
      typeEffectiveness: effectiveness,
      randomFactor
    });
    
    let effMsg = '';
    if (effectiveness > 1) effMsg = " It's super effective!";
    if (effectiveness > 0 && effectiveness < 1) effMsg = " It's not very effective...";
    if (effectiveness === 0) effMsg = " It has no effect...";
    if (isCritical && dmg > 0) effMsg += " A critical hit!";
    
    const finalDmg = Math.max(1, Math.min(defMon.currentHp, Math.floor(dmg)));
    
    return {
      damage: finalDmg,
      hit: true,
      message: `${atkMon.nickname || pokemonRegistry.getSpecies(atkMon.speciesId)?.name} used ${move.name}!${effMsg}`
    };
  };

  const endBattle = () => {
    setActiveWildMon(null);
    setIsBattleActive(false);
    setBattleMessageText('');
    setBattlePhase('MENU');

    // Trigger autosave when battle ends
    setTimeout(() => {
      saveGame(true);
    }, 100);
  };

  const rewardExperience = async () => {
    const pMon = playerParty[activeBattleMonIndex];
    const specOpp = pokemonRegistry.getSpecies(activeWildMon!.speciesId);
    const specPl = pokemonRegistry.getSpecies(pMon.speciesId);
    if (!specOpp || !specPl) return;
    
    const baseExp = (specOpp as any).baseExperience ?? (specOpp as any).baseExp ?? 64;
    const xpGained = Math.max(5, Math.floor((baseExp * activeWildMon!.level) / 7));
    
    const updatedParty = [...playerParty];
    const activeMon = updatedParty[activeBattleMonIndex];
    
    activeMon.experience = (activeMon.experience || 0) + xpGained;
    setBattleMessageText(`${activeMon.nickname || specPl.name} gained ${xpGained} EXP!`);
    await delay(1500);
    
    const newLevel = ExperienceCalculator.getLevelForExperience(activeMon.experience, specPl.growthRate);
    if (newLevel > activeMon.level) {
      activeMon.level = newLevel;
      activeMon.stats = {
        hp: specPl.baseStats.hp + newLevel * 2,
        attack: specPl.baseStats.attack + newLevel,
        defense: specPl.baseStats.defense + newLevel,
        spAttack: (specPl.baseStats as any).spAttack ?? (specPl.baseStats as any).specialAttack ?? 10,
        spDefense: (specPl.baseStats as any).spDefense ?? (specPl.baseStats as any).specialDefense ?? 10,
        speed: specPl.baseStats.speed + newLevel
      };
      activeMon.currentHp = activeMon.stats.hp;
      setBattleMessageText(`${activeMon.nickname || specPl.name} leveled up to Lv. ${newLevel}! Health fully restored!`);
      await delay(1500);
    }
    
    setPlayerParty(updatedParty);
  };

  const handlePlayerFainted = async () => {
    const nextHealthyIndex = playerParty.findIndex((p) => p.currentHp > 0);
    if (nextHealthyIndex >= 0) {
      setActiveBattleMonIndex(nextHealthyIndex);
      setBattleMessageText(`Go, ${playerParty[nextHealthyIndex].nickname || pokemonRegistry.getSpecies(playerParty[nextHealthyIndex].speciesId)?.name}!`);
      await delay(1500);
      setBattleMessageText(`What will ${playerParty[nextHealthyIndex].nickname || pokemonRegistry.getSpecies(playerParty[nextHealthyIndex].speciesId)?.name} do?`);
      setBattlePhase('MENU');
    } else {
      setBattleMessageText(`You have no healthy Pokémon left! You whited out...`);
      await delay(2000);
      
      setCurrentMapId('starter_town');
      playerRef.current.position.x = 13 * 16;
      playerRef.current.position.y = 11 * 16;
      cameraRef.current.x = playerRef.current.position.x;
      cameraRef.current.y = playerRef.current.position.y;
      cameraRef.current.follow(playerRef.current);
      playerRef.current.facingDirection = 'down';
      
      const healedParty = playerParty.map(p => ({ ...p, currentHp: p.stats.hp }));
      setPlayerParty(healedParty);
      
      setBattleMessageText('');
      setIsBattleActive(false);
      
      setDialoguePages([
        `Nurse Joy: Oh my! Your team was completely exhausted!`,
        `Nurse Joy: I have restored your Pokémon to full health. Please be more careful next time!`
      ]);
      setCurrentPageIndex(0);
      setIsDialogueActive(true);
      setIsSignPost(false);
    }
  };

  const handleSelectMove = async (moveId: number) => {
    if (isProcessingTurn) return;
    setIsProcessingTurn(true);
    setBattlePhase('MESSAGE');
    
    const playerMon = playerParty[activeBattleMonIndex];
    const opponentMon = activeWildMon!;
    
    const playerMove = pokemonRegistry.getMove(moveId);
    const wildMoves = opponentMon.moves;
    const opponentMoveId = wildMoves[Math.floor(Math.random() * wildMoves.length)].moveId;
    const opponentMove = pokemonRegistry.getMove(opponentMoveId);
    
    const playerSpeed = playerMon.stats.speed;
    const opponentSpeed = opponentMon.stats.speed;
    let first = 'player';
    if (opponentSpeed > playerSpeed) {
      first = 'opponent';
    } else if (opponentSpeed === playerSpeed && Math.random() < 0.5) {
      first = 'opponent';
    }
    
    const action1 = first === 'player'
      ? () => executeMove('player', 'opponent', playerMove)
      : () => executeMove('opponent', 'player', opponentMove);
      
    const action2 = first === 'player'
      ? () => executeMove('opponent', 'player', opponentMove)
      : () => executeMove('player', 'opponent', playerMove);
      
    // Action 1
    const res1 = action1();
    setBattleMessageText(res1.message);
    await delay(1500);
    
    if (res1.damage > 0) {
      if (first === 'player') {
        const newHp = Math.max(0, opponentMon.currentHp - res1.damage);
        opponentMon.currentHp = newHp;
        setActiveWildMon({ ...opponentMon });
      } else {
        const updatedParty = [...playerParty];
        const pMon = updatedParty[activeBattleMonIndex];
        pMon.currentHp = Math.max(0, pMon.currentHp - res1.damage);
        setPlayerParty(updatedParty);
      }
    }
    
    const def1Fainted = first === 'player' ? opponentMon.currentHp === 0 : playerParty[activeBattleMonIndex].currentHp === 0;
    if (def1Fainted) {
      if (first === 'player') {
        setBattleMessageText(`${pokemonRegistry.getSpecies(opponentMon.speciesId)?.name} fainted! You win!`);
        await delay(1500);
        await rewardExperience();
        endBattle();
      } else {
        setBattleMessageText(`${playerMon.nickname || pokemonRegistry.getSpecies(playerMon.speciesId)?.name} fainted!`);
        await delay(1500);
        await handlePlayerFainted();
      }
      setIsProcessingTurn(false);
      return;
    }
    
    // Action 2
    const res2 = action2();
    setBattleMessageText(res2.message);
    await delay(1500);
    
    if (res2.damage > 0) {
      if (first === 'player') {
        const updatedParty = [...playerParty];
        const pMon = updatedParty[activeBattleMonIndex];
        pMon.currentHp = Math.max(0, pMon.currentHp - res2.damage);
        setPlayerParty(updatedParty);
      } else {
        const newHp = Math.max(0, opponentMon.currentHp - res2.damage);
        opponentMon.currentHp = newHp;
        setActiveWildMon({ ...opponentMon });
      }
    }
    
    const def2Fainted = first === 'player' ? playerParty[activeBattleMonIndex].currentHp === 0 : opponentMon.currentHp === 0;
    if (def2Fainted) {
      if (first === 'player') {
        setBattleMessageText(`${playerMon.nickname || pokemonRegistry.getSpecies(playerMon.speciesId)?.name} fainted!`);
        await delay(1500);
        await handlePlayerFainted();
      } else {
        setBattleMessageText(`${pokemonRegistry.getSpecies(opponentMon.speciesId)?.name} fainted! You win!`);
        await delay(1500);
        await rewardExperience();
        endBattle();
      }
      setIsProcessingTurn(false);
      return;
    }
    
    setBattleMessageText(`What will ${playerParty[activeBattleMonIndex].nickname || pokemonRegistry.getSpecies(playerParty[activeBattleMonIndex].speciesId)?.name} do?`);
    setBattlePhase('MENU');
    setIsProcessingTurn(false);
  };

  const handleRun = async () => {
    if (isProcessingTurn) return;
    setIsProcessingTurn(true);
    setBattlePhase('MESSAGE');
    
    const playerSpeed = playerParty[activeBattleMonIndex].stats.speed;
    const opponentSpeed = activeWildMon!.stats.speed;
    
    let success = false;
    if (playerSpeed >= opponentSpeed) {
      success = true;
    } else {
      const rate = Math.floor((playerSpeed * 32) / (Math.floor(opponentSpeed / 4) % 256)) + 30;
      success = Math.random() * 256 < rate;
    }
    
    if (success) {
      setBattleMessageText(`Got away safely!`);
      await delay(1200);
      endBattle();
    } else {
      setBattleMessageText(`Can't escape!`);
      await delay(1500);
      
      const wildMoves = activeWildMon!.moves;
      const opponentMoveId = wildMoves[Math.floor(Math.random() * wildMoves.length)].moveId;
      const opponentMove = pokemonRegistry.getMove(opponentMoveId);
      
      const res = executeMove('opponent', 'player', opponentMove);
      setBattleMessageText(res.message);
      await delay(1500);
      
      if (res.damage > 0) {
        const updatedParty = [...playerParty];
        const pMon = updatedParty[activeBattleMonIndex];
        pMon.currentHp = Math.max(0, pMon.currentHp - res.damage);
        setPlayerParty(updatedParty);
      }
      
      if (playerParty[activeBattleMonIndex].currentHp === 0) {
        await handlePlayerFainted();
      } else {
        setBattleMessageText(`What will ${playerParty[activeBattleMonIndex].nickname || pokemonRegistry.getSpecies(playerParty[activeBattleMonIndex].speciesId)?.name} do?`);
        setBattlePhase('MENU');
      }
    }
    setIsProcessingTurn(false);
  };

  const runOpponentFreeTurnWithIndex = async (currentIdx: number) => {
    const wildMoves = activeWildMon!.moves;
    const opponentMoveId = wildMoves[Math.floor(Math.random() * wildMoves.length)].moveId;
    const opponentMove = pokemonRegistry.getMove(opponentMoveId);
    
    const res = executeMoveWithIndex('opponent', 'player', opponentMove, currentIdx);
    setBattleMessageText(res.message);
    await delay(1500);
    
    if (res.damage > 0) {
      const updatedParty = [...playerParty];
      const pMon = updatedParty[currentIdx];
      pMon.currentHp = Math.max(0, pMon.currentHp - res.damage);
      setPlayerParty(updatedParty);
    }
    
    if (playerParty[currentIdx].currentHp === 0) {
      await handlePlayerFainted();
    } else {
      setBattleMessageText(`What will ${playerParty[currentIdx].nickname || pokemonRegistry.getSpecies(playerParty[currentIdx].speciesId)?.name} do?`);
      setBattlePhase('MENU');
    }
  };

  const runOpponentFreeTurn = async () => {
    const wildMoves = activeWildMon!.moves;
    const opponentMoveId = wildMoves[Math.floor(Math.random() * wildMoves.length)].moveId;
    const opponentMove = pokemonRegistry.getMove(opponentMoveId);
    
    const res = executeMove('opponent', 'player', opponentMove);
    setBattleMessageText(res.message);
    await delay(1500);
    
    if (res.damage > 0) {
      const updatedParty = [...playerParty];
      const pMon = updatedParty[activeBattleMonIndex];
      pMon.currentHp = Math.max(0, pMon.currentHp - res.damage);
      setPlayerParty(updatedParty);
    }
    
    if (playerParty[activeBattleMonIndex].currentHp === 0) {
      await handlePlayerFainted();
    } else {
      setBattleMessageText(`What will ${playerParty[activeBattleMonIndex].nickname || pokemonRegistry.getSpecies(playerParty[activeBattleMonIndex].speciesId)?.name} do?`);
      setBattlePhase('MENU');
    }
  };

  const handleSwitchPokemon = async (targetIndex: number) => {
    if (isProcessingTurn) return;
    if (targetIndex === activeBattleMonIndex) {
      setBattleMessageText("That Pokémon is already in battle!");
      await delay(1200);
      setBattleMessageText(`What will ${playerParty[activeBattleMonIndex].nickname || pokemonRegistry.getSpecies(playerParty[activeBattleMonIndex].speciesId)?.name} do?`);
      setBattlePhase('MENU');
      return;
    }
    if (playerParty[targetIndex].currentHp <= 0) {
      setBattleMessageText("That Pokémon has fainted!");
      await delay(1200);
      setBattleMessageText(`What will ${playerParty[activeBattleMonIndex].nickname || pokemonRegistry.getSpecies(playerParty[activeBattleMonIndex].speciesId)?.name} do?`);
      setBattlePhase('MENU');
      return;
    }
    
    setIsProcessingTurn(true);
    setBattlePhase('MESSAGE');
    
    const currentMon = playerParty[activeBattleMonIndex];
    const nextMon = playerParty[targetIndex];
    const currentName = currentMon.nickname || pokemonRegistry.getSpecies(currentMon.speciesId)?.name;
    const nextName = nextMon.nickname || pokemonRegistry.getSpecies(nextMon.speciesId)?.name;
    
    setBattleMessageText(`Come back, ${currentName}!`);
    await delay(1200);
    
    setActiveBattleMonIndex(targetIndex);
    setBattleMessageText(`Go, ${nextName}!`);
    await delay(1500);
    
    await runOpponentFreeTurnWithIndex(targetIndex);
    setIsProcessingTurn(false);
  };

  const handleUseItem = async (itemId: number) => {
    if (isProcessingTurn) return;
    setIsProcessingTurn(true);
    
    const itemIdx = playerInventory.findIndex(it => it.itemId === itemId);
    if (itemIdx < 0 || playerInventory[itemIdx].quantity <= 0) {
      setBattleMessageText("You don't have enough of this item!");
      await delay(1200);
      setIsProcessingTurn(false);
      return;
    }
    
    const updatedInv = [...playerInventory];
    updatedInv[itemIdx].quantity--;
    setPlayerInventory(updatedInv);
    
    setBattlePhase('MESSAGE');
    const itemName = updatedInv[itemIdx].name;
    
    if (itemId === 10) {
      const updatedParty = [...playerParty];
      const pMon = updatedParty[activeBattleMonIndex];
      const healedHp = Math.min(pMon.stats.hp, pMon.currentHp + 20);
      const healAmt = healedHp - pMon.currentHp;
      pMon.currentHp = healedHp;
      setPlayerParty(updatedParty);
      
      setBattleMessageText(`Used Potion! Restored ${healAmt} HP to ${pMon.nickname || pokemonRegistry.getSpecies(pMon.speciesId)?.name}!`);
      await delay(1500);
      
      await runOpponentFreeTurn();
    } else {
      setBattleMessageText(`Trainer threw a ${itemName}!`);
      await delay(1500);
      
      // Calculate capture
      const targetMaxHp = activeWildMon!.stats.hp;
      const targetCurrentHp = activeWildMon!.currentHp;
      const species = pokemonRegistry.getSpecies(activeWildMon!.speciesId);
      const catchRate = species?.catchRate ?? 255;
      
      let ballBonus = 1.0;
      if (itemId === 2) ballBonus = 1.5;
      else if (itemId === 3) ballBonus = 2.0;
      
      let statusBonus = 1.0;
      if (activeWildMon!.status === StatusEffect.Sleep || activeWildMon!.status === StatusEffect.Freeze) {
        statusBonus = 2.5;
      } else if (activeWildMon!.status && (activeWildMon!.status as any) !== StatusEffect.None) {
        statusBonus = 1.5;
      }
      
      const a = (((3 * targetMaxHp - 2 * targetCurrentHp) * catchRate * ballBonus) / (3 * targetMaxHp)) * statusBonus;
      
      let caught = false;
      let shakes = 0;
      if (a >= 255) {
        caught = true;
        shakes = 4;
      } else {
        const b = 65536 / Math.sqrt(Math.sqrt(255 / a));
        for (let i = 0; i < 4; i++) {
          const roll = Math.floor(Math.random() * 65536);
          if (roll >= b) {
            break;
          }
          shakes++;
        }
        if (shakes === 4) {
          caught = true;
        }
      }
      
      for (let s = 1; s <= shakes; s++) {
        setBattleMessageText(`Shake...`);
        await delay(1000);
      }
      
      if (caught) {
        setBattleMessageText(`Gotcha! ${pokemonRegistry.getSpecies(activeWildMon!.speciesId)?.name} was caught!`);
        await delay(1500);
        
        const caughtMon: PokemonInstance = {
          ...activeWildMon!,
          id: `mon_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
          otId: 'player_main',
          otName: playerName,
        };
        
        setCapturedPokemon(prev => [...prev, caughtMon]);
        if (playerParty.length < 6) {
          setPlayerParty(prev => [...prev, caughtMon]);
          setBattleMessageText(`${pokemonRegistry.getSpecies(activeWildMon!.speciesId)?.name} has been added to your party!`);
        } else {
          setBattleMessageText(`Your party is full! ${pokemonRegistry.getSpecies(activeWildMon!.speciesId)?.name} was sent to PC Box 1!`);
        }
        await delay(2000);
        endBattle();
      } else {
        setBattleMessageText(`Oh no! The Pokémon broke free!`);
        await delay(1500);
        
        await runOpponentFreeTurn();
      }
    }
    setIsProcessingTurn(false);
  };

  const handleMakeLead = (index: number) => {
    if (index === 0) return;
    const updated = [...playerParty];
    const temp = updated[0];
    updated[0] = updated[index];
    updated[index] = temp;
    setPlayerParty(updated);
    
    playClickSound();
    setDialoguePages([
      `${updated[0].nickname || pokemonRegistry.getSpecies(updated[0].speciesId)?.name} is now leading the party!`
    ]);
    setCurrentPageIndex(0);
    setIsDialogueActive(true);
    setIsSignPost(false);
    setShowPartyModal(false);
  };

  // Keep player input blocked state in sync with UI overlays
  useEffect(() => {
    const isBlocked = isDialogueActive || isBattleActive || isMenuOpen || showPartyModal || showBagModal;
    playerRef.current.isInputBlocked = isBlocked;
  }, [isDialogueActive, isBattleActive, isMenuOpen, showPartyModal, showBagModal]);

  // Load world Canvas and preload atlases
  useEffect(() => {
    if (!canvasRef.current) return;
    const world = new WorldCanvas({
      canvas: canvasRef.current,
      seed,
      mapId,
      customMap: currentMapId === 'starter_town' ? starterTownMap : undefined,
    });
    worldRef.current = world;

    let cancelled = false;
    preloadAtlases().then(() => {
      if (!cancelled) setReady(true);
    });

    cameraRef.current.follow(playerRef.current);

    return () => {
      cancelled = true;
    };
  }, [seed, mapId, currentMapId]);

  // Main game loop & Input listener
  useEffect(() => {
    const keys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.add(key);

      // Interaction key: E or Space
      if ((key === 'e' || key === ' ') && !e.repeat) {
        e.preventDefault();
        handleInteraction();
      }

      // Menu toggle: Escape
      if (key === 'escape' && !e.repeat) {
        e.preventDefault();
        handleMenuToggle();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let animationFrameId: number;
    let lastTime = performance.now();

    const isTileSolid = (tx: number, ty: number): boolean => {
      if (currentMapId === 'starter_town') {
        const map = starterTownMap;
        if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) {
          return true; // Out of bounds
        }
        const tileId = map.layers.base[ty][tx];
        const tileDef = TileRegistry.getInstance().get(tileId);
        if (!tileDef) return true;

        // NPC solid collision check using our reusable engine class
        const hasNpc = npcsRef.current.some(n => n.collision && n.tileX === tx && n.tileY === ty);
        if (hasNpc) return true;

        return tileDef.blocksMovement || !tileDef.walkable;
      } else {
        const tileId = getGlobalTile(tx, ty, seed, 'city');
        return !isWalkableTileId(tileId);
      }
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const player = playerRef.current;
      const camera = cameraRef.current;

      // 1. Process movement inputs
      let moveX = 0;
      let moveY = 0;

      if (keys.has('w') || keys.has('arrowup')) moveY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) moveY += 1;
      if (keys.has('a') || keys.has('arrowleft')) moveX -= 1;
      if (keys.has('d') || keys.has('arrowright')) moveX += 1;

      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        moveX *= Math.SQRT1_2;
        moveY *= Math.SQRT1_2;
      }

      // 2. Update player entity position with tile collision
      player.updatePlayer(dt, { x: moveX, y: moveY }, isTileSolid);

      // 3. Coordinate triggers & encounters
      const tilePos = player.tilePosition;
      const tileStr = `${tilePos.x},${tilePos.y}`;

      if (tileStr !== lastTilePosRef.current) {
        lastTilePosRef.current = tileStr;

        if (currentMapId === 'starter_town') {
          // A. Transition check
          const transition = starterTownMap.transitions.find(t => t.x === tilePos.x && t.y === tilePos.y);
          if (transition) {
            if (transition.targetMapId === 'procedural') {
              if (!hasSelectedStarter) {
                // Block transition out of town
                setDialoguePages([
                  `Prof. Oak: Wait, ${playerName}! Don't go out yet!`,
                  `Prof. Oak: It is dangerous out in the tall grass without a Pokémon!`,
                  `Prof. Oak: Come back to my lab and choose your partner first.`
                ]);
                setCurrentPageIndex(0);
                setIsDialogueActive(true);
                setIsSignPost(false);

                // Push player back down
                player.position.y = (tilePos.y + 1) * 16;
                lastTilePosRef.current = `${tilePos.x},${tilePos.y + 1}`;
                return;
              }

              setCurrentMapId('procedural');
              const safeSpawn = findProceduralSafeSpawn(seed, transition.targetX, transition.targetY, 127);
              player.position.x = safeSpawn.x;
              player.position.y = safeSpawn.y;
              camera.x = player.position.x;
              camera.y = player.position.y;
              camera.follow(player);

              setDialoguePages([transition.message || 'Entered Route 1 (Procedural World)!']);
              setCurrentPageIndex(0);
              setIsDialogueActive(true);
              setIsSignPost(false);
            }
          }

          // B. Tall Grass wild encounter chance
          if (cooldownStepsRef.current > 0) {
            cooldownStepsRef.current--;
          }

          const tileId = starterTownMap.layers.base[tilePos.y]?.[tilePos.x];
          if (tileId === 'tall_grass' && player.isMoving && hasSelectedStarter) {
            if (cooldownStepsRef.current === 0 && Math.random() < 0.12) {
              triggerWildEncounter(tilePos.x, tilePos.y);
            }
          }
        } else {
          // Procedural Map triggers
          // Walk back to 128,128 on procedural -> triggers transition to starter town!
          if (tilePos.x === 128 && tilePos.y === 128) {
            setCurrentMapId('starter_town');
            player.position.x = 10 * 16;
            player.position.y = 1 * 16; // walk right back into town north path
            camera.x = player.position.x;
            camera.y = player.position.y;
            camera.follow(player);
            player.facingDirection = 'down';

            setDialoguePages(['Returned to Starter Town!']);
            setCurrentPageIndex(0);
            setIsDialogueActive(true);
            setIsSignPost(false);
          }

          if (cooldownStepsRef.current > 0) {
            cooldownStepsRef.current--;
          }

          const rawTileId = getGlobalTile(tilePos.x, tilePos.y, seed, 'city');
          const tileDefId = legacyTileIdToDefinitionId(rawTileId);
          if (tileDefId === 'tall_grass' && player.isMoving && hasSelectedStarter) {
            if (cooldownStepsRef.current === 0 && Math.random() < 0.12) {
              triggerWildEncounter(tilePos.x, tilePos.y);
            }
          }
        }
      }

      // 4. Update camera tracking
      camera.update(dt);

      // 5. Render frame
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          worldRef.current?.render(camera.x, camera.y, camera.zoom);

          // Draw NPCs if on Starter Town Map
          if (currentMapId === 'starter_town') {
            for (const npc of npcsRef.current) {
              npcRendererRef.current.draw(ctx, npc, camera);
            }
          }

          playerRendererRef.current.draw(ctx, player, camera);
        }
      }

      // 6. Update react HUD stats
      let currentStatus = 'Idle';
      if (isBattleActive) currentStatus = 'In Battle';
      else if (isDialogueActive) currentStatus = 'In Dialogue';
      else if (isMenuOpen) currentStatus = 'In Menu';
      else if (player.isMoving) currentStatus = 'Walking';

      setPlayerInfo({
        worldX: Math.round(player.position.x),
        worldY: Math.round(player.position.y),
        tileX: player.tilePosition.x,
        tileY: player.tilePosition.y,
        direction: player.facingDirection,
        isMoving: player.isMoving,
        stateText: currentStatus,
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [seed, mapId, currentMapId, isDialogueActive, isBattleActive, isMenuOpen, dialoguePages, currentPageIndex, isTyping, activeDialogueNpc, playerName, playerParty, hasSelectedStarter, showStarterSelectModal]);

  // Interaction logic
  const handleInteraction = () => {
    // 1. If Dialogue is already active, advance it
    if (isDialogueActive) {
      const rawText = dialoguePages[currentPageIndex] || '';
      let textToType = rawText;
      const colonIndex = rawText.indexOf(': ');
      if (colonIndex !== -1 && colonIndex < 25) {
        textToType = rawText.substring(colonIndex + 2);
      }

      if (isTyping) {
        // Skip typewriter animation and show complete text instantly
        if (typingTimerRef.current) {
          clearInterval(typingTimerRef.current);
        }
        setDialogueText(textToType);
        setIsTyping(false);
        playClickSound();
      } else {
        // Typewriter is done, go to next page
        if (currentPageIndex + 1 < dialoguePages.length) {
          setCurrentPageIndex(prev => prev + 1);
          playClickSound();
        } else {
          // Finished all pages! Close dialogue
          setIsDialogueActive(false);
          setDialoguePages([]);
          setCurrentPageIndex(0);

          // If there's an active NPC, trigger its onInteract callback!
          if (activeDialogueNpc) {
            const npc = npcsRef.current.find(n => n.id === activeDialogueNpc);
            if (npc) {
              npc.interact(); // execute its interaction callback
              if (npc.id === 'professor_oak' && !hasSelectedStarter) {
                setShowStarterSelectModal(true);
              }
            }
          }
          setActiveDialogueNpc(null);
        }
      }
      return;
    }

    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }

    if (isBattleActive) {
      return;
    }

    const player = playerRef.current;
    const targetTile = player.getInteractionTile();

    // 2. Check NPC interactions first
    if (currentMapId === 'starter_town') {
      const npc = npcsRef.current.find(n => n.tileX === targetTile.x && n.tileY === targetTile.y);
      if (npc) {
        // NPC turns to look at the player
        npc.facePlayer(player.facingDirection);

        // Play interaction trigger sound
        playClickSound();

        // Activate Dynamic Dialogue pages!
        let pages = npc.dialogue;
        if (npc.id === 'professor_oak') {
          if (!hasSelectedStarter) {
            pages = [
              `Prof. Oak: Hello there, ${playerName}! Welcome to the world of Pokémon!`,
              `Prof. Oak: I am the regional Professor. It is wonderful to meet you.`,
              `Prof. Oak: To explore the infinite wilderness of Route 1, you will need a partner.`,
              `Prof. Oak: Please, select one of the three starter Pokémon from my desk!`
            ];
          } else {
            const partner = playerParty[0];
            const partnerName = partner ? (partner.nickname || pokemonRegistry.getSpecies(partner.speciesId)?.name || 'partner') : 'partner';
            pages = [
              `Prof. Oak: Ah, ${playerName}! How is your ${partnerName} doing?`,
              `Prof. Oak: It looks very happy traveling with you!`,
              `Prof. Oak: Heading north leads to Route 1 and the endless wilderness!`,
              `Prof. Oak: Be careful in the tall grass, and train hard!`
            ];
          }
        } else if (npc.id === 'nurse_joy') {
          pages = [
            'Nurse Joy: Welcome to the local Healing Station!',
            'Nurse Joy: I can restore your Pokémon team to full health!',
            'Nurse Joy: Let me take your team for a brief moment...',
            'Nurse Joy: ... *chime* ... Your team is fully healed! Good luck!'
          ];
        }

        setDialoguePages(pages);
        setCurrentPageIndex(0);
        setIsDialogueActive(true);
        setActiveDialogueNpc(npc.id);
        setIsSignPost(false);
        return;
      }
    }

    // 3. Check Tile/Sign interactions
    if (currentMapId === 'starter_town') {
      const map = starterTownMap;
      if (targetTile.x < 0 || targetTile.x >= map.width || targetTile.y < 0 || targetTile.y >= map.height) {
        return;
      }
      const tileId = map.layers.base[targetTile.y][targetTile.x];
      const tileDef = TileRegistry.getInstance().get(tileId);

      if (tileDef?.interactionType === 'sign' || tileId === 'sign_post') {
        playSignSound();
        setIsSignPost(true);
        setIsDialogueActive(true);
        setActiveDialogueNpc(null);
        setCurrentPageIndex(0);

        // Custom sign pages!
        if (targetTile.y === 4 && targetTile.x === 6) {
          setDialoguePages([
            'Signpost: "Bob\'s peaceful cottage - Welcome!"',
            'Bob\'s Cottage: "Knock before entering. Friendly citizens inside!"'
          ]);
        } else if (targetTile.y === 4 && targetTile.x === 16) {
          setDialoguePages([
            'Signpost: "Prof. Oak\'s Monster Research Laboratory"',
            'Research Lab: "Exploring the boundary between handcrafted structures and infinite procedural terrain."'
          ]);
        } else if (targetTile.y === 15 && targetTile.x === 6) {
          setDialoguePages([
            'Signpost: "Starter Town Clinic - Open 24/7"',
            'Clinic Sign: "Heal your tired team and restore 100% of your travel stamina."'
          ]);
        } else {
          setDialoguePages([
            'Signpost: Welcome to Starter Town!',
            'Starter Town Guide: Use WASD/Arrows to walk, ESC to toggle Menu, and space/E to interact!'
          ]);
        }
        return;
      }

      if (tileDef?.interactionType === 'door' || tileId === 'door_entrance') {
        playClickSound();
        setIsDialogueActive(true);
        setIsSignPost(false);
        setDialoguePages(['Door: The lock is heavy, but you can see warmth and books inside.']);
        setCurrentPageIndex(0);
        return;
      }

      if (tileDef?.blocksMovement) {
        playClickSound();
        setIsDialogueActive(true);
        setIsSignPost(false);
        setDialoguePages([`Examining ${tileDef.name || 'obstacle'}. It is impassable.`]);
        setCurrentPageIndex(0);
        return;
      }

      // Default empty space interact
      playClickSound();
      setIsDialogueActive(true);
      setIsSignPost(false);
      setDialoguePages([`Facing tile (${targetTile.x}, ${targetTile.y}): ${tileDef?.name || 'Open path'}. Nothing else here.`]);
      setCurrentPageIndex(0);
    } else {
      // Procedural Map Inspection
      const rawTileId = getGlobalTile(targetTile.x, targetTile.y, seed, 'city');
      const defId = legacyTileIdToDefinitionId(rawTileId);
      const tileDef = TileRegistry.getInstance().get(defId);

      if (tileDef?.interactionType === 'sign') {
        playSignSound();
        setIsSignPost(true);
        setIsDialogueActive(true);
        setDialoguePages([
          `Route 1 Signpost: "South: Starter Town. North: Route 1 Wilderness."`,
          `Wilderness Warning: Stay on the dirt path unless you are ready for wild encounters!`
        ]);
        setCurrentPageIndex(0);
        return;
      }

      if (tileDef?.blocksMovement) {
        playClickSound();
        setIsDialogueActive(true);
        setIsSignPost(false);
        setDialoguePages([`The path is blocked by ${tileDef.name || 'vegetation'}.`]);
        setCurrentPageIndex(0);
        return;
      }

      playClickSound();
      setIsDialogueActive(true);
      setIsSignPost(false);
      setDialoguePages([`Facing tile (${targetTile.x}, ${targetTile.y}): ${tileDef?.name || 'Wild path'}. Nothing unusual.`]);
      setCurrentPageIndex(0);
    }
  };

  const handleMenuToggle = () => {
    if (isDialogueActive) {
      setIsDialogueActive(false);
      return;
    }
    if (isBattleActive) {
      return;
    }
    setIsMenuOpen(prev => !prev);
  };

  const handleNewGame = () => {
    setGamePhase('name_input');
    playClickSound();
  };

  const handleStartAdventure = (name: string) => {
    setPlayerName(name);
    setPlayerParty([]);
    setCapturedPokemon([]);
    setEventFlags({
      starterSelected: false,
      firstJoyTalk: false,
      firstOakTalk: false,
      route1Entered: false,
      firstEncounter: false,
    });
    setHasSelectedStarter(false);
    setCurrentMapId('starter_town');
    
    // Set position to starter town spawn point
    playerRef.current.position.x = spawnTile.x * 16;
    playerRef.current.position.y = spawnTile.y * 16;
    cameraRef.current.x = spawnTile.x * 16;
    cameraRef.current.y = spawnTile.y * 16;
    
    // Clear local manager
    PokemonManager.getInstance().reset();
    
    // Save initial state
    const initialSave = {
      schemaVersion: 2,
      playerName: name,
      playerPos: { x: spawnTile.x * 16, y: spawnTile.y * 16 },
      currentMapId: 'starter_town',
      facingDirection: 'down',
      playerParty: [],
      capturedPokemon: [],
      playerInventory: [
        { itemId: 1, name: 'Poké Ball', quantity: 10 },
        { itemId: 2, name: 'Great Ball', quantity: 5 },
        { itemId: 3, name: 'Ultra Ball', quantity: 2 },
        { itemId: 10, name: 'Potion', quantity: 5 }
      ],
      eventFlags: {
        starterSelected: false,
        firstJoyTalk: false,
        firstOakTalk: false,
        route1Entered: false,
        firstEncounter: false,
      },
      timestamp: Date.now()
    };
    localStorage.setItem('poketer_save_game', JSON.stringify(initialSave));
    localStorage.removeItem('poketer_save_game_auto');
    setHasSaveFile(true);
    setHasAutosaveFile(false);

    setGamePhase('playing');
    playClickSound();
    
    // Trigger opening Oak dialog!
    setDialoguePages([
      'Prof. Oak: Welcome to the world of poke-ter!',
      'Prof. Oak: This starter town is handcrafted, but heading north leads to the endless procedural wilderness.',
      `Prof. Oak: Come talk to me at my research desk (at the top of the town) to choose your starter Pokémon!`
    ]);
    setCurrentPageIndex(0);
    setIsDialogueActive(true);
    setIsSignPost(false);
  };

  const handleContinue = () => {
    loadGame(false);
  };

  const handleSelectStarter = (speciesId: number) => {
    const starter = PokemonFactory.create({
      speciesId,
      level: 5
    });
    
    starter.otId = 'player_main';
    starter.otName = playerName;
    
    const newParty = [starter];
    setPlayerParty(newParty);
    setHasSelectedStarter(true);
    setShowStarterSelectModal(false);
    
    // Register in PokemonManager singleton
    const pm = PokemonManager.getInstance();
    pm.reset();
    pm.registerPokemon(starter, {
      type: PokemonLocationType.Party,
      ownerId: 'player_main',
      slotIndex: 0
    });
    
    // Auto-save the game
    setEventFlags(prev => ({ ...prev, starterSelected: true }));
    setTimeout(() => {
      saveGame(false);
      saveGame(true);
    }, 100);
    
    playHealChime();
    setFlashColor('rgba(16, 185, 129, 0.25)'); // Emerald green flash
    setTimeout(() => setFlashColor(null), 800);
    
    const species = pokemonRegistry.getSpecies(speciesId);
    setDialoguePages([
      `Prof. Oak: Excellent choice! ${species?.name || 'Your Pokémon'} is a wonderful Pokémon!`,
      `Prof. Oak: I have added it to your Party.`,
      `Prof. Oak: Now you are ready to explore the world of poke-ter! Go north to Route 1 and train hard!`
    ]);
    setCurrentPageIndex(0);
    setIsDialogueActive(true);
    setIsSignPost(false);
  };

  return (
    <div id="multiplayer_canvas_container" className="relative inline-block rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl">
      {/* Top Runtime Header / HUD */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
        <div className="flex gap-3 items-center">
          <span className="text-emerald-400 font-bold">● LIVE GAMEPLAY</span>
          <span className="font-semibold text-neutral-200">
            Map: {currentMapId === 'starter_town' ? 'Starter Town (Handcrafted)' : 'Route 1 (Procedural)'}
          </span>
          <span>Seed {seed}</span>
        </div>
        <div className="flex gap-3 items-center">
          <span>World: ({playerInfo.worldX}, {playerInfo.worldY})</span>
          <span>Tile: ({playerInfo.tileX}, {playerInfo.tileY})</span>
          <span className="capitalize">Facing: {playerInfo.direction}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            playerInfo.stateText === 'In Battle' ? 'bg-rose-900 text-rose-200' :
            playerInfo.stateText === 'In Dialogue' ? 'bg-amber-900 text-amber-200' :
            playerInfo.stateText === 'In Menu' ? 'bg-blue-900 text-blue-200' :
            playerInfo.stateText === 'Walking' ? 'bg-emerald-900 text-emerald-200' :
            'bg-neutral-800 text-neutral-300'
          }`}>
            {playerInfo.stateText.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-black">
        {/* Title Screen Overlay */}
        {gamePhase === 'title' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 p-6 text-center select-none">
            <h2 className="text-4xl font-extrabold tracking-tight text-white mb-1 font-mono">
              POKÉ-<span className="text-emerald-400">TER</span>
            </h2>
            <p className="text-xs text-neutral-400 mb-8 max-w-sm leading-relaxed">
              A procedural sandbox world of exploration, monsters, and endless adventure.
            </p>

            <div className="flex flex-col gap-3 w-52">
              <button
                id="btn_new_game"
                onClick={handleNewGame}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                New Game
              </button>
              <button
                id="btn_continue"
                disabled={!hasSaveFile}
                onClick={handleContinue}
                className={`w-full rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  hasSaveFile
                    ? 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                }`}
              >
                Continue (Manual Save)
              </button>
              {hasAutosaveFile && (
                <button
                  id="btn_continue_auto"
                  onClick={() => loadGame(true)}
                  className="w-full rounded-lg px-4 py-2.5 text-xs font-bold bg-neutral-800 text-emerald-400 border border-emerald-500/20 hover:bg-neutral-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Continue (Autosave)
                </button>
              )}
            </div>
            {hasSaveFile && (
              <p className="mt-4 text-[10px] text-neutral-500 font-sans">
                Found saved data. Select Continue to resume your journey.
              </p>
            )}
          </div>
        )}

        {/* Trainer Registration / Name Input Overlay */}
        {gamePhase === 'name_input' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 p-6 select-none">
            <div className="w-full max-w-xs rounded-xl border border-neutral-800 bg-neutral-900/90 p-5 backdrop-blur-md shadow-2xl">
              <h3 className="text-base font-bold text-white mb-1 tracking-tight">Trainer Registration</h3>
              <p className="text-[11px] text-neutral-400 mb-4">What is your name, young explorer?</p>
              
              <input
                id="trainer_name_input"
                type="text"
                autoFocus
                placeholder="Trainer Name"
                maxLength={12}
                className="w-full rounded-lg border border-neutral-800 bg-black/60 px-3 py-2 text-xs font-medium text-white placeholder-neutral-600 outline-none focus:border-emerald-500 transition-colors mb-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (/^[a-zA-Z0-9]{2,12}$/.test(val)) {
                      handleStartAdventure(val);
                    }
                  }
                }}
              />
              <p className="text-[10px] text-neutral-500 mb-4 leading-normal">
                Must be 2–12 alphanumeric characters, no spaces or symbols.
              </p>
              
              <div className="flex gap-2">
                <button
                  id="btn_cancel_reg"
                  onClick={() => {
                    setGamePhase('title');
                    playClickSound();
                  }}
                  className="flex-1 rounded-lg bg-neutral-800 py-2 text-[11px] font-bold text-neutral-300 hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn_submit_reg"
                  onClick={() => {
                    const inputEl = document.getElementById('trainer_name_input') as HTMLInputElement;
                    const val = inputEl?.value.trim();
                    if (val && /^[a-zA-Z0-9]{2,12}$/.test(val)) {
                      handleStartAdventure(val);
                    } else {
                      playClickSound();
                      alert('Invalid Name! Must be 2-12 alphanumeric characters.');
                    }
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Adventure Start
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Starter Pokémon Selection Overlay */}
        {showStarterSelectModal && (
          <div id="starter_select_overlay" className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-6 backdrop-blur-sm select-none">
            <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-1 text-center tracking-tight">Choose Your Partner</h3>
              <p className="text-xs text-neutral-400 mb-6 text-center">Prof. Oak has three starting Pokémon. Select one!</p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* Bulbasaur */}
                <button
                  id="starter_bulbasaur"
                  onClick={() => handleSelectStarter(1)}
                  className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-emerald-950/25 p-4 hover:border-emerald-500/50 hover:bg-emerald-950/40 transition-all group cursor-pointer"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🍃</div>
                  <span className="text-xs font-bold text-white">Bulbasaur</span>
                  <span className="text-[10px] text-emerald-400 mt-1">Grass / Poison</span>
                </button>
                
                {/* Charmander */}
                <button
                  id="starter_charmander"
                  onClick={() => handleSelectStarter(4)}
                  className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-rose-950/25 p-4 hover:border-rose-500/50 hover:bg-rose-950/40 transition-all group cursor-pointer"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🔥</div>
                  <span className="text-xs font-bold text-white">Charmander</span>
                  <span className="text-[10px] text-rose-400 mt-1">Fire</span>
                </button>
                
                {/* Squirtle */}
                <button
                  id="starter_squirtle"
                  onClick={() => handleSelectStarter(7)}
                  className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-blue-950/25 p-4 hover:border-blue-500/50 hover:bg-blue-950/40 transition-all group cursor-pointer"
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💧</div>
                  <span className="text-xs font-bold text-white">Squirtle</span>
                  <span className="text-[10px] text-blue-400 mt-1">Water</span>
                </button>
              </div>
              
              <p className="text-[10px] text-neutral-500 text-center leading-normal font-sans">
                Your starter will join your party at Level 5 with balanced base statistics and ready moves!
              </p>
            </div>
          </div>
        )}

        {/* Flash Effect Overlay */}
        {flashColor && (
          <div
            className="absolute inset-0 pointer-events-none z-50 transition-all duration-300"
            style={{ backgroundColor: flashColor }}
          />
        )}

        <canvas
          id="game_canvas"
          ref={canvasRef}
          width={width}
          height={height}
          className="block bg-black"
        />

        {/* 1. Dialogue Box Overlay */}
        {isDialogueActive && (
          <div
            id="dialogue_overlay"
            onClick={handleInteraction}
            className={`absolute bottom-4 left-4 right-4 rounded-xl shadow-2xl backdrop-blur-md cursor-pointer select-none transition-all ${
              isSignPost
                ? 'border-4 border-amber-800/80 bg-amber-50/95 text-amber-950 p-4 shadow-inner'
                : 'border border-neutral-700/60 bg-neutral-950/95 text-neutral-100 p-4'
            }`}
          >
            {/* Speaker Tag / Title */}
            {isSignPost ? (
              <div className="text-xs font-bold text-amber-800 mb-1 tracking-wider uppercase flex items-center gap-1.5">
                <span>📖</span> SIGNPOST
              </div>
            ) : (
              dialogueSpeaker && (
                <div className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-2 tracking-wide uppercase border ${
                  dialogueSpeaker.includes('Joy')
                    ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                    : dialogueSpeaker.includes('Oak')
                    ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-200'
                }`}>
                  {dialogueSpeaker}
                </div>
              )
            )}

            {/* Typewritten Dialogue Message Body */}
            <p className={`text-sm font-sans leading-relaxed ${isSignPost ? 'font-medium' : ''}`}>
              {dialogueText}
            </p>

            {/* Next page arrow indicator or typewriter skip prompt */}
            <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span className={isSignPost ? 'text-amber-800/70' : 'text-neutral-500'}>
                {isTyping ? 'Click or press E/Space to skip typing...' : 'Click or press E/Space to advance'}
              </span>

              {/* Bouncing next-page triangle cursor */}
              {!isTyping && (
                <span className={`inline-block text-xs animate-bounce ${isSignPost ? 'text-amber-800' : 'text-emerald-400'}`}>
                  ▼
                </span>
              )}
            </div>
          </div>
        )}

        {/* 2. Wild Encounter Battle Overlay */}
        {isBattleActive && activeWildMon && playerParty[activeBattleMonIndex] && (
          <div id="battle_overlay" className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 text-center z-40 animate-fade-in">
            <BattleInterface
              playerMon={pokemonInstanceToMonsterInstance(playerParty[activeBattleMonIndex])}
              opponentMon={pokemonInstanceToMonsterInstance(activeWildMon)}
              playerName={playerName}
              opponentName={pokemonRegistry.getSpecies(activeWildMon.speciesId)?.name}
              message={battleMessageText || `A wild ${pokemonRegistry.getSpecies(activeWildMon.speciesId)?.name} appeared!`}
              onSelectMove={handleSelectMove}
              onSwitch={() => setShowPartyModal(true)}
              onBag={() => setShowBagModal(true)}
              onRun={handleRun}
              disabled={isProcessingTurn}
            />
          </div>
        )}

        {/* 3. Pause / Start Menu Overlay */}
        {isMenuOpen && (
          <div id="menu_overlay" className="absolute top-4 right-4 w-56 rounded-xl border border-neutral-700 bg-neutral-900/95 p-3 shadow-2xl backdrop-blur-md text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
              <span className="font-bold text-emerald-400 tracking-wider uppercase">Game Menu</span>
              <span className="text-[10px] text-neutral-500">Press ESC</span>
            </div>
            <p className="text-[11px] text-neutral-400 mb-3">Player movement is suspended while menu is open.</p>
            <div className="space-y-1">
              {['Pokedex', 'Pokemon Party', 'Bag', 'Trainer Card', 'Save Game', 'Option'].map(item => (
                <button
                  key={item}
                  onClick={() => {
                    playClickSound();
                    setIsMenuOpen(false);
                    if (item === 'Save Game') {
                      saveGame(false);
                      setDialoguePages(['Save System: Your adventure progress has been saved successfully!']);
                      setCurrentPageIndex(0);
                      setIsDialogueActive(true);
                      setIsSignPost(false);
                    } else if (item === 'Pokedex') {
                      if (capturedPokemon.length === 0 && playerParty.length === 0) {
                        setDialoguePages([
                          'Pokédex: No data collected yet.',
                          'Pokédex: Encounter and catch wild Pokémon to fill your database!'
                        ]);
                      } else {
                        const uniqueSpecies = Array.from(new Set([
                          ...playerParty.map(p => p.speciesId),
                          ...capturedPokemon.map(p => p.speciesId)
                        ]));
                        const speciesNames = uniqueSpecies.map(sid => pokemonRegistry.getSpecies(sid)?.name || 'Unknown');
                        setDialoguePages([
                          `Pokédex: Collected ${uniqueSpecies.length} unique Pokémon species!`,
                          `Captured List: ${speciesNames.join(', ')}`
                        ]);
                      }
                      setCurrentPageIndex(0);
                      setIsDialogueActive(true);
                      setIsSignPost(false);
                    } else if (item === 'Pokemon Party') {
                      if (playerParty.length === 0) {
                        setDialoguePages(['Party System: You do not have any Pokémon in your party yet!', 'Party System: Speak with Professor Oak to choose a starter!']);
                        setCurrentPageIndex(0);
                        setIsDialogueActive(true);
                        setIsSignPost(false);
                      } else {
                        setShowPartyModal(true);
                      }
                    } else if (item === 'Bag') {
                      setShowBagModal(true);
                    } else if (item === 'Trainer Card') {
                      setDialoguePages([
                        `Trainer Card: Name: ${playerName}`,
                        `Trainer Card: Starter Selected: ${hasSelectedStarter ? 'Yes' : 'No'}`,
                        `Trainer Card: Current Map: ${currentMapId === 'starter_town' ? 'Starter Town' : 'Route 1'}`
                      ]);
                      setCurrentPageIndex(0);
                      setIsDialogueActive(true);
                      setIsSignPost(false);
                    } else {
                      setDialoguePages([`Menu System: Item selected - ${item}`, `Menu System: This feature is offline in the preview sandbox.`]);
                      setCurrentPageIndex(0);
                      setIsDialogueActive(true);
                      setIsSignPost(false);
                    }
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 transition-colors font-medium flex justify-between items-center"
                >
                  <span>{item}</span>
                  <span className="text-[10px] text-neutral-500">▶</span>
                </button>
              ))}
              <button
                id="close_menu_btn"
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-center px-2 py-1.5 mt-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold transition-colors"
              >
                Close Menu
              </button>
            </div>
          </div>
        )}

        {/* 4. Pokémon Party Modal Overlay */}
        {showPartyModal && (
          <div id="party_modal" className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 z-50 animate-fade-in">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 max-w-lg w-full shadow-2xl p-4 flex flex-col h-[480px]">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    {isBagSelectPartyMode ? 'Select target to heal' : 'Your Pokémon Party'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {isBagSelectPartyMode ? 'Select a Pokémon to restore 20 HP' : 'Manage your adventure companions'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPartyModal(false);
                    setIsBagSelectPartyMode(false);
                  }}
                  className="rounded bg-neutral-800 px-2 py-1 text-[11px] font-bold text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {playerParty.map((mon, idx) => {
                  const spec = pokemonRegistry.getSpecies(mon.speciesId);
                  const isCurrentlyActive = isBattleActive && idx === activeBattleMonIndex;
                  const hpPct = Math.max(0, Math.min(100, (mon.currentHp / mon.stats.hp) * 100));
                  const isFainted = mon.currentHp <= 0;
                  
                  return (
                    <div
                      key={mon.id || idx}
                      className={`relative flex items-center gap-3 rounded-lg border p-3 transition-all ${
                        isCurrentlyActive 
                          ? 'border-emerald-500/40 bg-emerald-950/20' 
                          : 'border-neutral-800 bg-neutral-950/60 hover:bg-neutral-950'
                      }`}
                    >
                      {/* Left: Species Thumbnail Placeholder */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-lg font-bold text-neutral-300">
                        {spec?.name?.[0] || 'P'}
                      </div>

                      {/* Middle: Name, Lv, HP, Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-100">
                          <span className="truncate">{mon.nickname || spec?.name}</span>
                          <span className="text-neutral-400 text-[11px]">Lv.{mon.level}</span>
                        </div>
                        
                        {/* HP Bar */}
                        <div className="mt-1.5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                hpPct > 50 ? 'bg-emerald-500' : hpPct > 20 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${hpPct}%` }}
                            />
                          </div>
                        </div>

                        {/* HP Numbers & Status */}
                        <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-500">
                          <span>{mon.currentHp} / {mon.stats.hp} HP</span>
                          {isFainted ? (
                            <span className="rounded bg-red-950 px-1 py-0.2 text-[9px] font-bold text-red-400 uppercase border border-red-900/30">FAINTED</span>
                          ) : isCurrentlyActive ? (
                            <span className="rounded bg-emerald-950 px-1 py-0.2 text-[9px] font-bold text-emerald-400 uppercase border border-emerald-900/30">IN BATTLE</span>
                          ) : (
                            mon.status && (mon.status as any) !== StatusEffect.None && (
                              <span className="rounded bg-amber-950 px-1 py-0.2 text-[9px] font-bold text-amber-400 uppercase border border-amber-900/30">
                                {mon.status}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-1 justify-center">
                        {isBagSelectPartyMode ? (
                          <button
                            disabled={isFainted || mon.currentHp === mon.stats.hp}
                            onClick={() => {
                              // Perform overworld / out-of-battle heal
                              const updatedParty = [...playerParty];
                              const pMon = updatedParty[idx];
                              const healedHp = Math.min(pMon.stats.hp, pMon.currentHp + 20);
                              pMon.currentHp = healedHp;
                              setPlayerParty(updatedParty);

                              // Consume potion
                              const updatedInv = [...playerInventory];
                              const potIdx = updatedInv.findIndex(it => it.itemId === 10);
                              if (potIdx >= 0) {
                                updatedInv[potIdx].quantity--;
                                setPlayerInventory(updatedInv);
                              }

                              playHealChime();
                              setDialoguePages([`Healed ${pMon.nickname || spec?.name} by 20 HP!`]);
                              setCurrentPageIndex(0);
                              setIsDialogueActive(true);
                              setIsSignPost(false);

                              setShowPartyModal(false);
                              setIsBagSelectPartyMode(false);
                            }}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            Heal
                          </button>
                        ) : (
                          isBattleActive && !isCurrentlyActive && !isFainted && (
                            <button
                              disabled={isProcessingTurn}
                              onClick={async () => {
                                setShowPartyModal(false);
                                await handleSwitchPokemon(idx);
                              }}
                              className="rounded bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              Switch
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. Adventure Bag Modal Overlay */}
        {showBagModal && (
          <div id="bag_modal" className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 z-50 animate-fade-in">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 max-w-lg w-full shadow-2xl p-4 flex flex-col h-[400px]">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Adventurer's Bag</h3>
                  <p className="text-[11px] text-neutral-400">Select and use your items</p>
                </div>
                <button
                  onClick={() => {
                    setShowBagModal(false);
                    setSelectedBagItem(null);
                  }}
                  className="rounded bg-neutral-800 px-2 py-1 text-[11px] font-bold text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {/* Left side: Item list */}
                <div className="overflow-y-auto space-y-1.5 pr-1 border-r border-neutral-800">
                  {playerInventory.map(it => (
                    <button
                      key={it.itemId}
                      onClick={() => setSelectedBagItem(it)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs flex justify-between items-center transition-all cursor-pointer ${
                        selectedBagItem?.itemId === it.itemId
                          ? 'border-emerald-500/50 bg-emerald-950/20 text-white font-bold'
                          : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-950 text-neutral-300'
                      }`}
                    >
                      <span>{it.name}</span>
                      <span className="rounded bg-neutral-800 px-1.5 py-0.2 text-[10px] font-mono text-neutral-400">x{it.quantity}</span>
                    </button>
                  ))}
                </div>

                {/* Right side: Item description / action */}
                <div className="flex flex-col justify-between p-1">
                  {selectedBagItem ? (
                    <div className="flex flex-col h-full justify-between">
                      <div className="space-y-2 text-left">
                        <div className="text-xs font-bold text-emerald-400">{selectedBagItem.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400">Quantity: {selectedBagItem.quantity}</div>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          {selectedBagItem.itemId === 1 && "A standard device for catching wild Pokémon. Catch Rate: 1.0x."}
                          {selectedBagItem.itemId === 2 && "An improved device for catching wild Pokémon. Catch Rate: 1.5x."}
                          {selectedBagItem.itemId === 3 && "An ultra-performance device for catching wild Pokémon. Catch Rate: 2.0x."}
                          {selectedBagItem.itemId === 10 && "A spray-type medicine that heals a Pokémon's HP by 20 points."}
                        </p>
                      </div>

                      <div className="pt-4">
                        {selectedBagItem.quantity <= 0 ? (
                          <div className="text-[11px] text-red-400 font-semibold text-center py-1">Out of Stock</div>
                        ) : selectedBagItem.itemId === 10 ? (
                          <button
                            onClick={() => {
                              setShowBagModal(false);
                              if (isBattleActive) {
                                // Heal active battle mon directly
                                handleUseItem(selectedBagItem.itemId);
                              } else {
                                // Overworld heal -> Open party list in healing mode
                                setIsBagSelectPartyMode(true);
                                setShowPartyModal(true);
                              }
                            }}
                            className="w-full rounded bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                          >
                            {isBattleActive ? 'Heal Active' : 'Use Potion'}
                          </button>
                        ) : (
                          <button
                            disabled={!isBattleActive}
                            onClick={() => {
                              setShowBagModal(false);
                              handleUseItem(selectedBagItem.itemId);
                            }}
                            className="w-full rounded bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            {isBattleActive ? 'Throw Ball' : 'In Battle Only'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-neutral-500 text-center italic">
                      Select an item to view description
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls / Instructions footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 font-sans">
        <div className="flex gap-4 items-center">
          <span><kbd className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-neutral-200">WASD</kbd> / <kbd className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-neutral-200">Arrows</kbd> Move</span>
          <span><kbd className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-neutral-200">E</kbd> / <kbd className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-neutral-200">Space</kbd> Interact</span>
          <span><kbd className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-neutral-200">ESC</kbd> Menu</span>
        </div>

        {/* Quick Map Switch for easy testing */}
        <div className="flex gap-2">
          <button
            id="switch_map_btn"
            onClick={() => {
              const nextMap = currentMapId === 'starter_town' ? 'procedural' : 'starter_town';
              setCurrentMapId(nextMap);
              let targetX = nextMap === 'starter_town' ? starterTownMap.spawnPoint.x * 16 : 128 * 16;
              let targetY = nextMap === 'starter_town' ? starterTownMap.spawnPoint.y * 16 : 128 * 16;
              if (nextMap === 'procedural') {
                const safeSpawn = findProceduralSafeSpawn(seed, 128, 128, 127);
                targetX = safeSpawn.x;
                targetY = safeSpawn.y;
              }
              playerRef.current.position.x = targetX;
              playerRef.current.position.y = targetY;
              cameraRef.current.x = targetX;
              cameraRef.current.y = targetY;
              setDialoguePages([`Manually switched map to: ${nextMap === 'starter_town' ? 'Starter Town' : 'Route 1 (Procedural)'}`]);
              setCurrentPageIndex(0);
              setIsDialogueActive(true);
              setIsSignPost(false);
            }}
            className="rounded bg-emerald-900/60 hover:bg-emerald-800/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 border border-emerald-800 transition-colors"
          >
            Switch Map Mode
          </button>
        </div>
      </div>
    </div>
  );
}
