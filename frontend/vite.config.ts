import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    // Allow CORS in dev (backend already handles this, but belt-and-suspenders)
    cors: {
      origin: 'http://localhost:3000',
      credentials: true,
    },
  },
});
