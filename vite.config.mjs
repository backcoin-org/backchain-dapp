import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [
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