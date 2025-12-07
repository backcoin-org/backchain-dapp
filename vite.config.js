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
          // O asterisco (*) diz: "Pegue tudo DENTRO dessa pasta"
          src: 'assets/*', 
          // E coloque DENTRO de uma pasta chamada 'assets' no site final
          dest: 'assets'   
        }
      ]
    })
  ],
  envPrefix: 'VITE_',
});