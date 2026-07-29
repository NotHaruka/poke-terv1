/** poke-ter game and asset server */

import crypto from 'crypto';

// Polyfill globalThis.crypto and getRandomValues for older Node.js versions
if (typeof globalThis.crypto === 'undefined') {
  try {
    // @ts-ignore
    globalThis.crypto = crypto.webcrypto || {
      getRandomValues: <T extends ArrayBufferView>(array: T): T => {
        const buf = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
        crypto.randomFillSync(buf);
        return array;
      }
    };
  } catch (err) {
    // Safe fallback
  }
}

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { PacketType, AnyPacket, PlayerLeavePacket, Database } from '../../packages/game-core/pokemonData.js';

import { GameState } from './server/multiplayer/game.js';
import { handlePacket } from './server/multiplayer/handlers.js';
import { authRouter } from './server/auth.js';

async function startServer() {
  // Initialize centralized gameplay database
  try {
    await Database.getInstance().initialize();
  } catch (err) {
    console.error('[poke-ter Server] Failed to initialize Database:', err);
  }

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);

  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // WebSocket server multiplexed on the same HTTP server
  const wss = new WebSocketServer({ server });
  console.log(`[poke-ter Server] WebSocket server mounted on HTTP server`);

  const gameState = new GameState();

  wss.on('connection', (ws: WebSocket) => {
    gameState.addClient(ws);
    console.log(`[+] New connection established`);

    ws.on('message', (data) => {
      try {
        const packet: AnyPacket = JSON.parse(data.toString());
        const client = gameState.getClientByWs(ws);
        if (client) {
          handlePacket(gameState, client, packet);
        }
      } catch (e) {
        console.error(`[!] Invalid packet:`, e);
      }
    });

    ws.on('close', () => {
      const client = gameState.getClientByWs(ws);
      if (client) {
        gameState.markClientDisconnected(client.id);
        console.log(`[-] ${client.id} connection closed (grace period started)`);
      }
    });

    ws.on('error', () => {
      const client = gameState.getClientByWs(ws);
      if (client) {
        gameState.markClientDisconnected(client.id);
      }
    });
  });

  // Vite integration — root is now the project root (index.html lives there), not client/
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV !== 'production' || !hasDist) {
    console.log(`[poke-ter Server] Starting Vite dev middleware (production=${process.env.NODE_ENV === 'production'}, hasDist=${hasDist})`);
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: process.cwd(),
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[poke-ter Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
