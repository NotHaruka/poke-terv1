import { decodeTilesets, buildGameplayDatabase } from './pipeline.js';

/**
 * tools/asset-pipeline/run-pipeline.ts
 *
 * Run with: npm run pipeline (or `npx tsx tools/asset-pipeline/run-pipeline.ts`)
 *
 * Requires:
 *  - python3 + `pip install pillow --break-system-packages` (for tile decoding)
 *  - a local clone of https://github.com/rh-hideout/pokeemerald-expansion
 *    (see POKEEMERALD_EXPANSION_PATH in pipeline.ts)
 */
async function main() {
  console.log('=== Asset Pipeline ===\n');

  console.log('--- Step 1: Decoding real Emerald tilesets ---');
  decodeTilesets();

  console.log('\n--- Step 2: Building gameplay database ---');
  buildGameplayDatabase();

  console.log('\n=== Pipeline complete ===');
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
