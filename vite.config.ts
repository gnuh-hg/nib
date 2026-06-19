/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Tauri-ready Vite config. src-tauri/ sẽ thêm ở phase đóng gói (glue-packaging).
// Phase 0: chạy `npm run dev` xem trong browser là đủ.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Tauri expects a fixed port + no clearScreen so logs are visible
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
