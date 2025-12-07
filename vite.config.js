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
          src: 'assets', // Nome da pasta na raiz do seu projeto
          dest: ''       // Destino na raiz do site final (vai criar dist/assets)
        }
      ]
    })
  ],
  envPrefix: 'VITE_',
});