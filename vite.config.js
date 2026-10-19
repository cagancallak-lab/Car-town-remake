import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    // During development, online races go through the Node server (npm start).
    proxy: { '/ws': { target: 'ws://localhost:3000', ws: true } },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
});
