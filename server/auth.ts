import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PlayerData } from '../shared/pokemonData.js';
import { savePlayerData, loadPlayerData } from './multiplayer/SaveManager.js';

/**
 * server/auth.ts
 *
 * Genuinely new — no auth code existed anywhere in the old poke-ter project (verified by
 * searching the whole codebase before starting this rebuild). This is a minimal, dependency-free
 * implementation: scrypt for password hashing (Node built-in, no bcrypt dependency needed),
 * signed opaque session tokens stored server-side (no JWT library needed either). It's enough to
 * gate multiplayer connections behind an account; swap in a real auth provider later if you need
 * OAuth, password reset flows, etc.
 *
 * Account records (username -> password hash) are kept separate from PlayerData (game state),
 * which continues to go through the existing SaveManager.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ACCOUNTS_FILE = path.join(__dirname, '../.data/accounts.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me-in-production';

interface AccountRecord {
  id: string;
  username: string;
  passwordHash: string; // "salt:hash" hex
}

function loadAccounts(): Record<string, AccountRecord> {
  if (!fs.existsSync(ACCOUNTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, AccountRecord>): void {
  fs.mkdirSync(path.dirname(ACCOUNTS_FILE), { recursive: true });
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf8');
}

function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): string {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

function signToken(accountId: string): string {
  const payload = Buffer.from(JSON.stringify({ accountId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { accountId: string } | null {
  const [payload, sig] = (token || '').split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return { accountId: decoded.accountId };
  } catch {
    return null;
  }
}

function defaultPlayerData(id: string, username: string): PlayerData {
  return {
    id,
    username,
    profile: {
      name: username,
      bodyType: 'male',
      hairStyle: 'default',
      hairColor: '#3a2a1a',
      skinTone: '#f2c9a0',
      eyeColor: '#2a2a2a',
      shirtColor: '#c02020',
      pantsColor: '#2050a0',
      shoesColor: '#333333',
      hatType: 'none',
      backpackType: 'none',
    },
    position: { x: 0, y: 0 },
    direction: 'down',
    speed: 1,
    money: 3000,
    party: [],
    boxes: [],
    inventory: [],
    pokedex: [],
    badges: 0,
    currentMap: 'city',
    storyFlags: {},
  };
}

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'username must be >=3 chars, password >=6 chars' });
  }

  const accounts = loadAccounts();
  if (accounts[username]) {
    return res.status(409).json({ error: 'username already taken' });
  }

  const id = crypto.randomUUID();
  accounts[username] = { id, username, passwordHash: hashPassword(password) };
  saveAccounts(accounts);
  savePlayerData(id, defaultPlayerData(id, username));

  res.json({ token: signToken(id), accountId: id });
});

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const accounts = loadAccounts();
  const account = accounts[username];
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return res.status(401).json({ error: 'invalid username or password' });
  }
  res.json({ token: signToken(account.id), accountId: account.id });
});

authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const session = verifyToken(token);
  if (!session) return res.status(401).json({ error: 'invalid or missing token' });

  const playerData = loadPlayerData(session.accountId);
  if (!playerData) return res.status(404).json({ error: 'account has no player data' });
  res.json(playerData);
});
