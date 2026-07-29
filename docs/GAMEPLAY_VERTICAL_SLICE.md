# Gameplay Vertical Slice Design

This document details the functional specification and operational flow of the **poke-ter** core gameplay loop.

---

## 1. Overworld Exploration

*   **Grid-Based Movement**: The player navigates the procedural tilemap at standard 16px tile increments. Movement is fully collision-checked against obstacles (trees, rock walls, water edges).
*   **Tall Grass Encounters**: Walking on tall grass tile definitions increments a step counter and initiates an encounter roll based on standard wild spawn rates. Once triggered, the overworld loop halts and the Battle State begins.
*   **NPC Interactions**: The player can approach NPCs (such as Professor Oak or Nurse Joy) and initiate conversations. Dialogue pages support multi-step text advances.

---

## 2. Starter Selection & Progression

*   **Starter Desk**: In the Starter Town map, the player can examine three Poké Balls on Professor Oak's research desk containing:
    *   **Bulbasaur** (Grass-type, Species ID: 1)
    *   **Charmander** (Fire-type, Species ID: 4)
    *   **Squirtle** (Water-type, Species ID: 7)
*   **Starter Assignment**: Selecting a partner adds the level 5 instance to the active Party, registers it with the global `PokemonManager` tracker, triggers an auto-save, and clears dialogue restrictions so the player can explore Route 1.

---

## 3. Stateful Battle Mechanics

The integrated turn-based battle interface supports four main choices:

### Fight
Allows the user to select from level-appropriate moves. Speed-tier checks determine which entity attacks first. Moves incorporate:
*   Standard Accuracy checks (chance to miss).
*   State-of-the-art type effectiveness modifiers (e.g., Grass vs Water).
*   Crit chances and damage variation ranges.

### Bag
Enables item consumption during battle:
*   **Medicines (Potion)**: Restores 20 HP to a selected party member.
*   **Capture Devices (Poké Ball, Great Ball, Ultra Ball)**: Consumes the ball from the player's inventory and computes a captures roll based on current wild HP, status effects, and capture device coefficients.

### Pokémon (Party Screen)
Allows the trainer to switch the active battle Pokémon or make a different party member the lead. If the active battle Pokémon faints, the party overlay opens automatically to force a replacement.

### Run
Calculates an escape probability based on the player's and wild Pokémon's speed stats. Success flees the battle, returning to the overworld safely.

---

## 4. Capture & Storage Mechanics

Successful captures consume a Poké Ball from inventory, display a shaking animation, add the Pokémon to the active Party (if `< 6` members), or route the entity safely to the PC Storage Box. All caught species are logged into the global Pokédex records.
