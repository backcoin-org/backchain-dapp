import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [
    nodePolyfills({
      include: ['stream', 'crypto', 'events', 'buffer', 'process'],
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/*',
          dest: 'assets'
        },
        {
          src: 'deployment-addresses.json',
          dest: ''
        }
      ]
    })
  ],
  envPrefix: 'VITE_',
});