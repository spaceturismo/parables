import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 10001,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
