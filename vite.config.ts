import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: true },
  build: {
    chunkSizeWarningLimit: 800,
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
