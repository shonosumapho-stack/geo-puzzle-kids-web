import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5176,
    strictPort: true,
    open: '/#/',
  },
  preview: {
    port: 4176,
    strictPort: true,
  },
});
