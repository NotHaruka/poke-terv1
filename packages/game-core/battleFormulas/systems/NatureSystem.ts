import { Nature } from '../../pokemonData/models/PokemonInstance.js';
import { rollRandomNature, getNatureName } from '../../pokemonData/data/Natures.js';

export class NatureSystem {
  static generateRandomNature(): Nature {
    return rollRandomNature();
  }

  static getNatureName(nature: Nature): string {
    return getNatureName(nature);
  }
}
