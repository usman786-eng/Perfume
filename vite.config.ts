import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: true },
  build: {
    chunkSizeWarningLimit: 800,
    // The 3D engine (three + fiber + drei, ~1MB) is only used by the Sifr 01
    // route, but Vite preloads every transitively-imported chunk from the
    // entry — forcing phones to fetch and parse it on every page load, which
    // kills low-memory mobile tabs. Exclude it from the initial preload list
    // so it loads on demand when SifrPage's lazy import fires instead.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !/three-core|react-three|PerfumeScene|postprocessing/i.test(dep)),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/three/')) return 'three-core';
          if (id.includes('@react-three/fiber')) return 'react-three-fiber';
          if (id.includes('@react-three/drei')) return 'react-three-drei';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('gsap') || id.includes('/lenis/')) return 'scroll';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
        },
      },
    },
  },
});
