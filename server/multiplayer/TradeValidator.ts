import { ClientState } from './types.js';
import { TradeSession } from './TradeSession.js';
import { PokemonManager } from '../../shared/pokemonData.js';

export interface TradeValidationResult {
  valid: boolean;
  reason?: string;
}

export class TradeValidator {
  /**
   * Validates if a client is allowed to offer a monster at a given party slot index
   */
  public static validateOffer(client: ClientState, slot: number): TradeValidationResult {
    if (slot < 0) {
      // Emptying the offer slot is valid
      return { valid: true };
    }

    const party = client.playerData?.party || [];
    if (slot >= party.length) {
      return { valid: false, reason: 'Invalid party slot index.' };
    }

    const monster = party[slot];
    if (!monster) {
      return { valid: false, reason: 'No monster found in selected slot.' };
    }

    // Ensure Pokemon exists and is valid in PokemonManager
    const pm = PokemonManager.getInstance();
    const serverParty = pm.getParty(client.id);
    if (!serverParty[slot]) {
      return { valid: false, reason: 'Authoritative server party mismatch.' };
    }

    return { valid: true };
  }

  /**
   * Validates if the entire trade session can be executed safely
   */
  public static validateTradeExecution(session: TradeSession): TradeValidationResult {
    const p1 = session.p1;
    const p2 = session.p2;

    if (!p1.playerData || !p2.playerData) {
      return { valid: false, reason: 'Player data missing.' };
    }

    const p1Party = p1.playerData.party || [];
    const p2Party = p2.playerData.party || [];

    if (session.p1Slot < 0 || session.p1Slot >= p1Party.length) {
      return { valid: false, reason: 'Player 1 offered slot is out of bounds.' };
    }

    if (session.p2Slot < 0 || session.p2Slot >= p2Party.length) {
      return { valid: false, reason: 'Player 2 offered slot is out of bounds.' };
    }

    const m1 = p1Party[session.p1Slot];
    const m2 = p2Party[session.p2Slot];

    if (!m1 || !m2) {
      return { valid: false, reason: 'Offered monster instance is null or undefined.' };
    }

    const pm = PokemonManager.getInstance();
    const pmP1Party = pm.getParty(p1.id);
    const pmP2Party = pm.getParty(p2.id);

    const pmP1Mon = pmP1Party[session.p1Slot];
    const pmP2Mon = pmP2Party[session.p2Slot];

    if (!pmP1Mon || !pmP2Mon) {
      return { valid: false, reason: 'Server side party state validation failed.' };
    }

    // Duplicate check: ensure pmP1Mon and pmP2Mon are distinct Pokemon instances
    if (pmP1Mon.id === pmP2Mon.id) {
      return { valid: false, reason: 'Cannot trade identical monster instances.' };
    }

    return { valid: true };
  }
}
