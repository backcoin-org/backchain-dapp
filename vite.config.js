import { defineConfig } from 'vite';

export default defineConfig({
  // Garante que o build vai para a pasta 'dist' que a Vercel espera
  build: {
    outDir: 'dist',
  },
  // Define a raiz do servidor como a pasta atual
  root: '.', 
  // Configuração para carregar variáveis de ambiente corretamente
  envPrefix: 'VITE_',
});