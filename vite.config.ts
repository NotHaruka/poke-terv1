import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: 'apps/game-client/public',
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, 'packages/engine'),
      '@game-core': path.resolve(__dirname, 'packages/game-core'),
      '@world': path.resolve(__dirname, 'packages/world'),
      '@shared': path.resolve(__dirname, 'packages/shared'),
      '@client': path.resolve(__dirname, 'apps/game-client'),
      '@server': path.resolve(__dirname, 'apps/game-server'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
