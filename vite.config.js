import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  // Configurações básicas de build
  build: {
    outDir: 'dist',
  },
  // ATIVAÇÃO DO PLUGIN DE CÓPIA
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'assets', // Pega a pasta 'assets' da raiz
          dest: ''       // Copia para a raiz do site final (criando dist/assets)
        }
      ]
    })
  ],
  // Prefixo para carregar variáveis de ambiente
  envPrefix: 'VITE_',
});