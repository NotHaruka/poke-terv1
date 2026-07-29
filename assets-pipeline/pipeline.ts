import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

/**
 * assets-pipeline/pipeline.ts
 *
 * Two independent steps:
 *
 * 1. Tile decoding (tilesetDecode.py) — decodes real pokeemerald-expansion GBA metatile binary
 *    format (tiles.png + palettes/*.pal + metatiles.bin) into flat PNG atlases. This stays
 *    Python: it was built, run, and debugged (a real palette-path bug was caught and fixed) as
 *    part of this project, and a from-scratch JS reimplementation of indexed-PNG-plus-external-
 *    palette decoding would be new, unverified code solving an already-solved problem. Requires
 *    `pip install pillow --break-system-packages` and a local clone of
 *    https://github.com/rh-hideout/pokeemerald-expansion (path below).
 *
 * 2. Gameplay database (gameplayData.ts) — fetches and parses real species/moves/abilities/
 *    items/learnsets data from pokeemerald-expansion's raw GitHub source, caches it under
 *    .cache_pokeemerald/, and writes JSON to client/public/assets/data/. Pure Node/TS, no
 *    external dependency beyond fetch.
 *
 * Configure POKEEMERALD_EXPANSION_PATH below (or via env var) to point at your local clone.
 */

const POKEEMERALD_EXPANSION_PATH =
  process.env.POKEEMERALD_EXPANSION_PATH || path.join(ROOT, '..', 'pokeemerald-expansion');

// Each entry pairs the shared "general" primary tileset with one secondary tileset, matching
// what worldgen/tiles/tileLibrary.ts expects to find at these exact output paths.
const TILESET_JOBS: { secondary: string; outPath: string }[] = [
  { secondary: 'fortree', outPath: 'client/public/assets/tilesets/forests/emerald_fortree.png' },
  { secondary: 'cave', outPath: 'client/public/assets/tilesets/caves/emerald_cave.png' },
  { secondary: 'petalburg', outPath: 'client/public/assets/tilesets/towns/emerald_petalburg.png' },
  { secondary: 'fallarbor', outPath: 'client/public/assets/tilesets/towns/emerald_fallarbor.png' },
  { secondary: 'mossdeep', outPath: 'client/public/assets/tilesets/towns/emerald_mossdeep.png' },
  // "general" itself is also needed standalone (grass/water/path/tall grass live at IDs 0-511
  // in every job above identically, but tileLibrary.ts's general-category entries point at this
  // specific file):
  { secondary: 'petalburg', outPath: 'client/public/assets/tilesets/general/emerald_general_petalburg.png' },
];

export function decodeTilesets(): void {
  if (!fs.existsSync(POKEEMERALD_EXPANSION_PATH)) {
    throw new Error(
      `pokeemerald-expansion not found at ${POKEEMERALD_EXPANSION_PATH}. ` +
      `Clone it (git clone https://github.com/rh-hideout/pokeemerald-expansion) and set ` +
      `POKEEMERALD_EXPANSION_PATH, or place it as a sibling of this project's root.`
    );
  }
  const primaryDir = path.join(POKEEMERALD_EXPANSION_PATH, 'data/tilesets/primary/general');

  for (const job of TILESET_JOBS) {
    const secondaryDir = path.join(POKEEMERALD_EXPANSION_PATH, 'data/tilesets/secondary', job.secondary);
    const outPath = path.join(ROOT, job.outPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    console.log(`Decoding ${job.secondary} -> ${job.outPath}`);
    execFileSync('python3', [
      path.join(__dirname, 'tilesetDecode.py'),
      primaryDir,
      secondaryDir,
      outPath,
    ], { stdio: 'inherit' });
  }
}

export function buildGameplayDatabase(): void {
  console.log('Building gameplay database from pokeemerald-expansion source...');
  execFileSync('npx', ['tsx', path.join(__dirname, 'gameplayData.ts')], {
    stdio: 'inherit',
    cwd: ROOT,
  });
}
