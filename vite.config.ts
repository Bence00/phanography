import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Drop console/debugger in production
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core - rarely changes
          'react-core': ['react', 'react-dom'],
          // Canvas rendering - separate chunk
          'canvas': ['konva', 'react-konva'],
          // Utilities
          'utils': ['zustand'],
          // HEIC conversion - heavy and rarely used (lazy loaded)
          // 'heic-converter': ['heic2any'],
        },
        // Optimize entry chunk
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Use esbuild for minification (built-in, no extra dependency)
    minify: 'esbuild',
    // Tree shaking
    treeShaking: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    exclude: ['heic2any'], // Exclude heavy library from pre-bundling
    include: ['react', 'react-dom', 'konva', 'react-konva', 'zustand'],
  },
})
