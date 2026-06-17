import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node22',
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    ssr: 'src/index.ts',
    rolldownOptions: {
      output: {
        format: 'es',
        entryFileNames: 'index.js',
      },
    },
  },
  ssr: {
    noExternal: true,
    external: ['sharp'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
