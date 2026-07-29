/**
 * Item Data Types
 */

export interface BerryData {
  itemId: string;
  size: number;
  firmness: string;
  spiciness: number;
  dryness: number;
  sweetness: number;
  bitterness: number;
  sourness: number;
  smoothness: number;
}

export interface PokeballData {
  itemId: string;
  catchRateModifier: number;
  customFormula?: string;
}

export interface ItemData {
  id: string;
  name: string;
  category: 'pokeball' | 'medicine' | 'held' | 'stone' | 'berry' | 'key' | 'tm' | 'battle' | 'misc';
  description: string;
  price: number;
  isKeyItem: boolean;
  berry?: BerryData;
  pokeball?: PokeballData;
}
