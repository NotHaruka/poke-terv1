import { GameState } from '../game.js';
import { PokemonManager, WildPokemon } from '../../../shared/pokemonData.js';

export class GameplayValidator {
    static validatePlayerCanBattle(gameState: GameState, playerId: string): boolean {
        const client = gameState.getClient(playerId);
        if (!client) return false;
        if (!client.playerData || !client.playerData.party || client.playerData.party.length === 0) return false;
        const hasAwake = client.playerData.party.some(p => p.currentHp > 0);
        return hasAwake;
    }

    static validateWildPokemon(wildEntityId: string): WildPokemon | null {
        const pm = PokemonManager.getInstance();
        const wild = pm.getWildPokemon(wildEntityId);
        return wild || null;
    }
}
