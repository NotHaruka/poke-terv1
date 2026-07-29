import fs from 'fs';
import path from 'path';
import { PlayerData, PokemonManager, PokemonLocationType, PokemonInstance, monsterInstanceToPokemonInstance } from '@game-core/pokemonData.js';

const SAVES_DIR = path.join(process.cwd(), 'data', 'saves');

// Ensure directory exists
if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
}

export interface Party {
  slots: (string | null)[];
  activeSlotIndex: number;
}

export interface PCBox {
  name: string;
  slots: (string | null)[];
}

export interface PCStorage {
  boxes: PCBox[];
  activeBoxIndex: number;
}

export interface PlayerSaveFile {
  playerData: PlayerData;
  party: Party;
  pc: PCStorage;
  ownedPokemon: PokemonInstance[];
}

export function savePlayerData(clientId: string, data: PlayerData): void {
  const filePath = path.join(SAVES_DIR, `${clientId}.json`);
  try {
    const pm = PokemonManager.getInstance();
    
    // Clear existing owner locations in index before re-assigning slots to prevent duplicate ownership errors during reordering
    pm.clearOwnerLocations(clientId);
    
    const partyData: Party = {
      slots: new Array(6).fill(null),
      activeSlotIndex: 0
    };
    
    const pcData: PCStorage = {
      boxes: [],
      activeBoxIndex: 0
    };
    for (let i = 0; i < 32; i++) {
      pcData.boxes.push({
        name: `Box ${i + 1}`,
        slots: new Array(30).fill(null)
      });
    }

    const ownedPokemon: PokemonInstance[] = [];

    // Helper to register if needed
    const processMon = (mon: any, locType: PokemonLocationType, slot: number, box?: number) => {
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
          partyData.slots[i] = processMon(data.party[i], PokemonLocationType.Party, i);
        }
      }
    }
    
    if (data.boxes) {
      for (let b = 0; b < data.boxes.length && b < 32; b++) {
        const box = data.boxes[b];
        for (let s = 0; s < box.length && s < 30; s++) {
          if (box[s]) {
            pcData.boxes[b].slots[s] = processMon(box[s], PokemonLocationType.PC, s, b);
          }
        }
      }
    }

    // Keep data as is for the rest of the game session, but write out the new format
    // We clone data to remove the duplicated party/boxes objects in the save file
    const dataToSave = { ...data };
    delete (dataToSave as any).party;
    delete (dataToSave as any).boxes;

    const saveFile: PlayerSaveFile = {
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

export function loadPlayerData(clientId: string): PlayerData | undefined {
  const filePath = path.join(SAVES_DIR, `${clientId}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const dataStr = fs.readFileSync(filePath, 'utf-8');
      const rawData = JSON.parse(dataStr);
      
      // Check if it's the new format
      if (rawData.ownedPokemon && rawData.playerData) {
        const saveFile = rawData as PlayerSaveFile;
        const pm = PokemonManager.getInstance();
        
        pm.clearOwnerLocations(clientId);

        const findMonLoc = (monId: string) => {
          if (saveFile.party?.slots) {
            const partyIdx = saveFile.party.slots.indexOf(monId);
            if (partyIdx !== -1) {
              return { type: PokemonLocationType.Party, ownerId: clientId, slotIndex: partyIdx };
            }
          }
          if (saveFile.pc?.boxes) {
            for (let b = 0; b < saveFile.pc.boxes.length; b++) {
              const slotIdx = saveFile.pc.boxes[b].slots?.indexOf(monId);
              if (slotIdx !== undefined && slotIdx !== -1) {
                return { type: PokemonLocationType.PC, ownerId: clientId, boxIndex: b, slotIndex: slotIdx };
              }
            }
          }
          return { type: PokemonLocationType.Party, ownerId: clientId, slotIndex: 0 };
        };

        // Register pokemon with actual saved location
        for (const mon of saveFile.ownedPokemon) {
          if (!mon.speciesId && (mon as any).species) (mon as any).speciesId = (mon as any).species;
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
        
        // Setup Party
        const partyArray = [];
        for (let i = 0; i < saveFile.party.slots.length; i++) {
          const id = saveFile.party.slots[i];
          if (id) {
            pm.updateLocation(id, { type: PokemonLocationType.Party, ownerId: clientId, slotIndex: i });
            partyArray.push(pm.getPokemonById(id));
          }
        }
        
        // Setup PC
        const boxesArray = [];
        for (let b = 0; b < saveFile.pc.boxes.length; b++) {
          const boxArr = [];
          for (let s = 0; s < saveFile.pc.boxes[b].slots.length; s++) {
            const id = saveFile.pc.boxes[b].slots[s];
            if (id) {
              pm.updateLocation(id, { type: PokemonLocationType.PC, ownerId: clientId, slotIndex: s, boxIndex: b });
              boxArr.push(pm.getPokemonById(id));
            }
          }
          boxesArray.push(boxArr);
        }
        
        const pd = saveFile.playerData;
        pd.party = partyArray as any;
        pd.boxes = boxesArray as any;
        return pd;
      } else {
        // Legacy save fallback
        return rawData as PlayerData;
      }
    }
  } catch (err) {
    console.error(`[SaveManager] Failed to load player data for ${clientId}:`, err);
  }
  return undefined;
}
