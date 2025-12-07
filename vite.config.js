import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  // 1. Define que o build vai para a pasta 'dist'
  build: {
    outDir: 'dist',
  },

  // 2. AQUI ESTÁ A MÁGICA QUE FALTAVA NA IMAGEM
  // Isso força o Vite a copiar a pasta 'assets' da raiz para o site final
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'assets', // Nome da pasta na raiz do seu projeto
          dest: ''       // Destino (vai criar dist/assets automaticamente)
        }
      ]
    })
  ],

  // 3. Permite ler as variáveis do .env
  envPrefix: 'VITE_',
});