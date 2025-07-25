import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // این خط را اضافه کنید
  base: '/Ai-EUPHORIAX/',

  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: "process/browser",
      buffer: "buffer",
      util: "util"
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Suppress SASS deprecation warnings for now
        silenceDeprecations: ['import', 'global-builtin', 'color-functions']
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],

          // Routing
          'router': ['react-router-dom'],

          // Web3 & Crypto libraries
          'web3-vendor': ['ethers', 'viem', 'wagmi', '@rainbow-me/rainbowkit'],

          // UI & Charts
          'ui-vendor': ['@ionic/react', 'ionicons', 'react-icons', 'bootstrap'],
          'charts': ['apexcharts'],

          // Utilities
          'utils-vendor': ['@tanstack/react-query', '@splidejs/splide', 'clsx'],
        },
      },
    },
    // Copy assets from src to public during build
    assetsDir: 'assets',
    // Increase chunk size warning limit to 1000kb (1MB)
    chunkSizeWarningLimit: 1000,
    // Enable code splitting for better performance
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
  },
})