import { WebSocket } from 'ws';
import { PlayerProfile, PlayerData } from '../../shared/pokemonData.js';

export interface MapInstance {
  id: string;
  seed: number;
  type: 'city' | 'route' | 'interior';
  parentMapId?: string;
  players: Set<string>;
}

export interface ClientState {
  ws: WebSocket | null;
  id: string;
  username: string;
  position: { x: number; y: number };
  direction: string;
  inputSeq: number;
  lastInputSeq: number;
  lastInputTime?: number;
  mapInstanceId: string;
  disconnectTimer?: NodeJS.Timeout;
  profile?: PlayerProfile;
  playerData?: PlayerData;
  lastEncounterTime?: number;
  encounterCooldownUntil?: number;
  lastEncounterStartPos?: { x: number; y: number };
}