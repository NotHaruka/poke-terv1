# Save Format Specification

This document defines the data schema, persistence logic, and validation rules for the **poke-ter** save/load system.

---

## 1. Schema Definition

The game progress state is serialized to a standard, schema-valid JSON format. It must fit the following TypeScript interface definitions exactly:

```typescript
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
  timestamp?: number;
}
```

---

## 2. Field Descriptions

### Metadata
*   `schemaVersion` (Integer): Incremented when database structures or item indices evolve. Used during load to convert or reject older saves. Current version is `2`.
*   `timestamp` (Integer): Milliseconds since epoch. Used to compare newer files.

### Player Identity & Position
*   `playerName` (String): Max 12-char name chosen during Trainer Registration.
*   `playerPos` (Object): Coordinates of the player's position in pixels.
*   `currentMapId` (String): Matches either `'starter_town'` or `'procedural'` zones.
*   `facingDirection` (String): Cardinal direction of the player sprite.

### Collections & Inventory
*   `playerParty` (Array of `PokemonInstance` objects): The list of up to 6 active partner Pokémon.
*   `capturedPokemon` (Array of `PokemonInstance` objects): Holds all captured Pokémon sent to storage/PC Box slots.
*   `playerInventory` (Array of objects): Holds active quantities of consumables like Potions and Poké Balls.

### Event Flags
*   `eventFlags` (Key-value map of booleans): Tracks progression state, such as `starterSelected`, `firstJoyTalk`, `firstOakTalk`, and `firstEncounter`.

---

## 3. Serialization Exclusions

The system strictly excludes the following structures from serialization to prevent memory leaks and corruption:
1.  **Rendering Objects**: Do not serialize canvases, layers, sprites, or preloaded assets.
2.  **Sockets & Connections**: Do not serialize live WebSocket clients or connection states.
3.  **DOM Nodes**: Do not serialize any active HTML elements.
4.  **Class Instances**: Only serialize plain, structured JSON. Upon loading, class singletons (like `PokemonManager`) are reset and populated using raw values.

---

## 4. Validation Rules

Saves are validated by the `validateSave(data: any): boolean` function:
1.  Verifies the object is non-null and structured.
2.  Ensures `schemaVersion` is a valid number.
3.  Checks that `playerName` exists and is non-empty.
4.  Validates `playerPos` contains numbers.
5.  Ensures `currentMapId` is restricted to known regions.
6.  Confirms `playerParty` is a valid array.
